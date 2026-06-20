"""
Issue detector and resolver for Windows 11 performance problems.
Covers: startup bloat, disk health, Windows Update cache, corrupted system files.
"""

import os
import subprocess
import winreg
from typing import Optional

import config
from logger_setup import get_logger

log = get_logger("detector")


# ── Startup bloat ─────────────────────────────────────────────────────────────

_STARTUP_REG_KEYS = [
    (winreg.HKEY_CURRENT_USER,  r"Software\Microsoft\Windows\CurrentVersion\Run"),
    (winreg.HKEY_LOCAL_MACHINE, r"Software\Microsoft\Windows\CurrentVersion\Run"),
    (winreg.HKEY_LOCAL_MACHINE, r"Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Run"),
]


def list_startup_programs() -> list[dict]:
    """Return all programs registered to start with Windows."""
    items = []
    for hive, key_path in _STARTUP_REG_KEYS:
        try:
            key = winreg.OpenKey(hive, key_path)
            i = 0
            while True:
                try:
                    name, value, _ = winreg.EnumValue(key, i)
                    items.append({"name": name, "command": value,
                                  "hive": "HKCU" if hive == winreg.HKEY_CURRENT_USER else "HKLM",
                                  "key": key_path})
                    i += 1
                except OSError:
                    break
            winreg.CloseKey(key)
        except FileNotFoundError:
            pass
    log.info("Found %d startup entries.", len(items))
    return items


def disable_startup_program(name: str, hive_str: str, key_path: str) -> bool:
    """
    Disable a startup program by removing its registry value.
    Only removes HKCU entries (user-owned) to stay safe.
    """
    if hive_str != "HKCU":
        log.warning("Will not auto-remove HKLM startup entry '%s'. Needs admin approval.", name)
        return False
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, access=winreg.KEY_SET_VALUE)
        winreg.DeleteValue(key, name)
        winreg.CloseKey(key)
        log.info("Disabled startup program: %s", name)
        return True
    except Exception as e:
        log.warning("Could not disable startup program '%s': %s", name, e)
        return False


# ── Disk health ───────────────────────────────────────────────────────────────

def check_disk_health() -> dict[str, str]:
    """
    Use PowerShell's Get-PhysicalDisk to retrieve disk health status.
    Returns {DiskNumber: HealthStatus}.
    """
    results = {}
    try:
        ps = (
            "Get-PhysicalDisk | "
            "Select-Object DeviceId, FriendlyName, HealthStatus, OperationalStatus | "
            "ConvertTo-Json"
        )
        out = subprocess.check_output(
            ["powershell", "-NoProfile", "-Command", ps],
            text=True, timeout=30,
        )
        import json
        disks = json.loads(out)
        if isinstance(disks, dict):
            disks = [disks]
        for d in disks:
            key = f"Disk {d.get('DeviceId', '?')} ({d.get('FriendlyName', 'Unknown')})"
            health = d.get("HealthStatus", "Unknown")
            results[key] = health
            if health != "Healthy":
                from notifier import critical
                critical(f"Disk health warning: {key} is '{health}'!")
    except Exception as e:
        log.warning("Disk health check failed: %s", e)
    return results


# ── Windows Update cache ──────────────────────────────────────────────────────

def clean_windows_update_cache() -> bool:
    """Stop Windows Update service, clear its download cache, restart service."""
    cmds = [
        ["net", "stop", "wuauserv"],
        ["net", "stop", "bits"],
    ]
    for cmd in cmds:
        subprocess.run(cmd, capture_output=True)

    cache_path = r"C:\Windows\SoftwareDistribution\Download"
    try:
        import shutil
        if os.path.isdir(cache_path):
            shutil.rmtree(cache_path, ignore_errors=True)
            os.makedirs(cache_path, exist_ok=True)
            log.info("Windows Update cache cleared.")
    except Exception as e:
        log.warning("Could not clear WU cache: %s", e)
        return False
    finally:
        subprocess.run(["net", "start", "wuauserv"], capture_output=True)
        subprocess.run(["net", "start", "bits"], capture_output=True)

    return True


# ── System file integrity ─────────────────────────────────────────────────────

def run_sfc_scan() -> Optional[str]:
    """
    Run System File Checker (sfc /scannow).
    Requires the process to be running as Administrator.
    Returns the output summary or None on failure.
    """
    try:
        result = subprocess.run(
            ["sfc", "/scannow"],
            capture_output=True, text=True, timeout=600,
            encoding="utf-8", errors="replace",
        )
        output = result.stdout + result.stderr
        log.info("SFC scan complete:\n%s", output[-500:])
        return output
    except Exception as e:
        log.warning("SFC scan failed (needs Administrator rights): %s", e)
        return None


def run_dism_health() -> Optional[str]:
    """Run DISM component store health check and repair."""
    try:
        result = subprocess.run(
            ["DISM", "/Online", "/Cleanup-Image", "/RestoreHealth"],
            capture_output=True, text=True, timeout=900,
            encoding="utf-8", errors="replace",
        )
        output = result.stdout + result.stderr
        log.info("DISM health restore complete:\n%s", output[-500:])
        return output
    except Exception as e:
        log.warning("DISM failed (needs Administrator rights): %s", e)
        return None


# ── Power plan ────────────────────────────────────────────────────────────────

def ensure_high_performance_power_plan() -> bool:
    """Switch power plan to High Performance if not already set."""
    try:
        result = subprocess.run(
            ["powercfg", "/getactivescheme"],
            capture_output=True, text=True,
        )
        if "High performance" not in result.stdout and "8c5e7fda" not in result.stdout.lower():
            subprocess.run(
                ["powercfg", "/setactive", "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"],
                capture_output=True,
            )
            log.info("Switched to High Performance power plan.")
            return True
        log.debug("Already on High Performance power plan.")
        return True
    except Exception as e:
        log.warning("Could not set power plan: %s", e)
        return False


# ── Visual effects ─────────────────────────────────────────────────────────────

def optimize_visual_effects() -> bool:
    """
    Set Windows visual effects to 'Best Performance' via registry.
    This disables animations and transparency effects.
    """
    try:
        key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Explorer\VisualEffects",
            access=winreg.KEY_SET_VALUE,
        )
        winreg.SetValueEx(key, "VisualFXSetting", 0, winreg.REG_DWORD, 2)
        winreg.CloseKey(key)
        log.info("Visual effects set to Best Performance.")
        return True
    except Exception as e:
        log.warning("Could not set visual effects: %s", e)
        return False


# ── Diagnostic summary ────────────────────────────────────────────────────────

def run_full_diagnostic() -> dict:
    """Run all detectors and return a summary dict."""
    return {
        "startup_programs": list_startup_programs(),
        "disk_health":      check_disk_health(),
        "power_plan_ok":    ensure_high_performance_power_plan(),
    }
