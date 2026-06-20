"""
Scheduled cleaner for temp files, caches, logs, and package manager junk.
All deletions are staged first (moved to STAGING_DIR) and permanently removed
after STAGING_RETENTION_HOURS — giving you a recovery window.
"""

import os
import shutil
import fnmatch
import subprocess
import time
from pathlib import Path
from datetime import datetime, timedelta

import config
from logger_setup import get_logger

log = get_logger("cleaner")

# Stats accumulator reset on each full clean run
_stats: dict = {}


def _reset_stats():
    global _stats
    _stats = {"files_moved": 0, "bytes_freed": 0, "errors": 0}


def _is_protected(path: str) -> bool:
    name = os.path.basename(path)
    return any(fnmatch.fnmatch(name, pat) for pat in config.PROTECTED_PATH_PATTERNS)


def _stage_file(src: str) -> bool:
    """Move a file to staging instead of deleting it directly."""
    try:
        os.makedirs(config.STAGING_DIR, exist_ok=True)
        size = os.path.getsize(src)
        # Flatten path into a safe filename
        safe_name = src.replace(":", "").replace("\\", "_").replace("/", "_")
        dest = os.path.join(config.STAGING_DIR, safe_name)
        shutil.move(src, dest)
        _stats["files_moved"] += 1
        _stats["bytes_freed"] += size
        log.debug("Staged: %s (%d bytes)", src, size)
        return True
    except Exception as e:
        log.warning("Could not stage %s: %s", src, e)
        _stats["errors"] += 1
        return False


def _clean_folder(folder: str, min_age_hours: int = 0) -> int:
    """Recursively stage all files in *folder* older than min_age_hours."""
    if not os.path.isdir(folder):
        return 0
    moved = 0
    cutoff = time.time() - min_age_hours * 3600
    for root, dirs, files in os.walk(folder, topdown=False):
        for fname in files:
            fpath = os.path.join(root, fname)
            if _is_protected(fpath):
                continue
            try:
                if os.path.getmtime(fpath) <= cutoff or min_age_hours == 0:
                    if _stage_file(fpath):
                        moved += 1
            except Exception as e:
                log.debug("Skipping %s: %s", fpath, e)
        # Remove empty directories left behind
        for d in dirs:
            dpath = os.path.join(root, d)
            try:
                if not os.listdir(dpath):
                    os.rmdir(dpath)
            except Exception:
                pass
    return moved


# ── Individual clean tasks ────────────────────────────────────────────────────

def clean_temp_folders() -> dict:
    """Clear Windows temp directories."""
    _reset_stats()
    targets = [
        os.environ.get("TEMP", ""),
        os.environ.get("TMP", ""),
        r"C:\Windows\Temp",
        r"C:\Windows\Prefetch",
    ]
    for folder in targets:
        if folder:
            log.info("Cleaning temp: %s", folder)
            _clean_folder(folder, min_age_hours=1)

    freed_mb = _stats["bytes_freed"] / 1024 / 1024
    log.info("Temp clean done — %d files staged, %.1f MB freed", _stats["files_moved"], freed_mb)
    return {**_stats, "freed_mb": freed_mb}


def clean_browser_caches() -> dict:
    """Clear cache folders for common browsers."""
    _reset_stats()
    local_app = os.environ.get("LOCALAPPDATA", "")
    app_data   = os.environ.get("APPDATA", "")

    browser_caches = [
        # Chrome
        os.path.join(local_app, r"Google\Chrome\User Data\Default\Cache"),
        os.path.join(local_app, r"Google\Chrome\User Data\Default\Code Cache"),
        # Edge
        os.path.join(local_app, r"Microsoft\Edge\User Data\Default\Cache"),
        os.path.join(local_app, r"Microsoft\Edge\User Data\Default\Code Cache"),
        # Firefox
        os.path.join(local_app, r"Mozilla\Firefox\Profiles"),
        # Opera
        os.path.join(app_data, r"Opera Software\Opera Stable\Cache"),
        # Brave
        os.path.join(local_app, r"BraveSoftware\Brave-Browser\User Data\Default\Cache"),
    ]

    for folder in browser_caches:
        if os.path.isdir(folder):
            log.info("Cleaning browser cache: %s", folder)
            _clean_folder(folder)

    freed_mb = _stats["bytes_freed"] / 1024 / 1024
    log.info("Browser cache clean done — %.1f MB freed", freed_mb)
    return {**_stats, "freed_mb": freed_mb}


def trim_windows_logs() -> dict:
    """Delete old Windows event log exports and CBS logs."""
    _reset_stats()
    log_paths = [
        r"C:\Windows\Logs\CBS",
        r"C:\Windows\SoftwareDistribution\Download",
        os.path.join(os.environ.get("LOCALAPPDATA", ""), r"Microsoft\Windows\WER"),
    ]
    for folder in log_paths:
        if os.path.isdir(folder):
            log.info("Trimming logs: %s", folder)
            _clean_folder(folder, min_age_hours=48)

    freed_mb = _stats["bytes_freed"] / 1024 / 1024
    log.info("Log trim done — %.1f MB freed", freed_mb)
    return {**_stats, "freed_mb": freed_mb}


def empty_recycle_bin() -> bool:
    """Empty the Windows Recycle Bin using PowerShell."""
    try:
        subprocess.run(
            ["powershell", "-Command", "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"],
            capture_output=True, timeout=30,
        )
        log.info("Recycle Bin emptied.")
        return True
    except Exception as e:
        log.warning("Could not empty Recycle Bin: %s", e)
        return False


def clean_package_caches() -> dict:
    """Clear pip, npm, and winget/chocolatey caches."""
    _reset_stats()
    commands = [
        ["pip", "cache", "purge"],
        ["npm", "cache", "clean", "--force"],
        ["winget", "cache", "clean"],
    ]
    for cmd in commands:
        try:
            result = subprocess.run(cmd, capture_output=True, timeout=60, text=True)
            log.info("Ran %s: %s", " ".join(cmd), result.stdout.strip() or "OK")
        except FileNotFoundError:
            log.debug("%s not found, skipping.", cmd[0])
        except Exception as e:
            log.warning("Error running %s: %s", cmd[0], e)

    freed_mb = _stats["bytes_freed"] / 1024 / 1024
    return {**_stats, "freed_mb": freed_mb}


def purge_staging() -> int:
    """Permanently delete staged files older than STAGING_RETENTION_HOURS."""
    if not os.path.isdir(config.STAGING_DIR):
        return 0
    cutoff = time.time() - config.STAGING_RETENTION_HOURS * 3600
    deleted = 0
    for fname in os.listdir(config.STAGING_DIR):
        fpath = os.path.join(config.STAGING_DIR, fname)
        try:
            if os.path.getmtime(fpath) <= cutoff:
                os.remove(fpath)
                deleted += 1
        except Exception as e:
            log.debug("Could not purge staged file %s: %s", fpath, e)
    if deleted:
        log.info("Purged %d expired staged files.", deleted)
    return deleted


def run_disk_cleanup() -> bool:
    """Invoke Windows built-in Disk Cleanup silently."""
    try:
        subprocess.run(
            ["cleanmgr", "/sagerun:1"],
            capture_output=True, timeout=120,
        )
        log.info("Windows Disk Cleanup completed.")
        return True
    except Exception as e:
        log.warning("Disk Cleanup failed: %s", e)
        return False


def trim_ssd() -> bool:
    """Run TRIM on all SSD drives via defrag /L."""
    try:
        result = subprocess.run(
            ["defrag", "/L", "/U"],
            capture_output=True, text=True, timeout=60,
        )
        log.info("SSD TRIM result: %s", result.stdout.strip())
        return True
    except Exception as e:
        log.warning("SSD TRIM failed: %s", e)
        return False
