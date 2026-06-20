"""
Windows 11 System Maintenance Agent — main entry point.

Usage:
  python agent.py                     # Start the agent (normal daemon mode)
  python agent.py --once              # Run all tasks once and exit
  python agent.py --report            # Generate a report and exit
  python agent.py --disable-startup "ProgramName"   # Disable a startup entry
  python agent.py --status            # Print a live system snapshot and exit
"""

import argparse
import os
import sys
import signal
import threading
import time

import schedule

import config
import monitor
import cleaner
import detector
import reporter
import notifier
from logger_setup import get_logger

log = get_logger("agent")

_shutdown_event = threading.Event()


# ── Scheduled task wrappers ───────────────────────────────────────────────────

def _task_clean_temp():
    stats = cleaner.clean_temp_folders()
    reporter.log_event("Temp Clean", "Cleared Windows temp folders", stats["freed_mb"])
    cleaner.purge_staging()


def _task_clean_browsers():
    stats = cleaner.clean_browser_caches()
    reporter.log_event("Browser Cache", "Cleared browser caches", stats["freed_mb"])


def _task_trim_logs():
    stats = cleaner.trim_windows_logs()
    reporter.log_event("Log Trim", "Trimmed old Windows logs", stats["freed_mb"])


def _task_empty_trash():
    cleaner.empty_recycle_bin()
    reporter.log_event("Recycle Bin", "Emptied Recycle Bin")


def _task_clean_pkg_caches():
    stats = cleaner.clean_package_caches()
    reporter.log_event("Package Cache", "Cleared pip/npm caches", stats.get("freed_mb", 0))


def _task_disk_cleanup():
    cleaner.run_disk_cleanup()
    reporter.log_event("Disk Cleanup", "Windows Disk Cleanup (cleanmgr) ran")


def _task_trim_ssd():
    cleaner.trim_ssd()
    reporter.log_event("SSD TRIM", "TRIM sent to SSDs")


def _task_daily_report():
    path = reporter.generate_daily_report()
    notifier.info(f"Daily report ready: {os.path.basename(path)}")


def _task_check_disk_health():
    health = detector.check_disk_health()
    for disk, status in health.items():
        reporter.log_event("Disk Health", f"{disk}: {status}")


# ── Schedule setup ────────────────────────────────────────────────────────────

def _register_schedules():
    schedule.every(config.TEMP_CLEAN_INTERVAL_HOURS).hours.do(_task_clean_temp)
    schedule.every().day.at(f"{config.CACHE_CLEAN_HOUR:02d}:00").do(_task_clean_browsers)
    schedule.every().day.at(f"{config.LOG_TRIM_HOUR:02d}:15").do(_task_trim_logs)
    schedule.every().day.at(f"{config.CACHE_CLEAN_HOUR:02d}:30").do(_task_disk_cleanup)
    schedule.every().day.at(f"{config.DAILY_REPORT_HOUR:02d}:00").do(_task_daily_report)
    schedule.every().day.at("04:00").do(_task_check_disk_health)
    schedule.every().day.at("04:30").do(_task_trim_ssd)

    getattr(schedule.every(), config.TRASH_EMPTY_DAY).at("02:00").do(_task_empty_trash)
    getattr(schedule.every(), config.PKG_CACHE_CLEAN_DAY).at("02:30").do(_task_clean_pkg_caches)

    log.info("Schedules registered.")


def _scheduler_loop():
    while not _shutdown_event.is_set():
        schedule.run_pending()
        _shutdown_event.wait(30)  # check schedule every 30 s


# ── Graceful shutdown ─────────────────────────────────────────────────────────

def _handle_signal(signum, frame):
    log.info("Shutdown signal received (%s). Stopping agent…", signum)
    _shutdown_event.set()
    monitor.stop()


# ── CLI modes ─────────────────────────────────────────────────────────────────

def _run_once():
    log.info("Running all maintenance tasks once (--once mode)…")
    _task_clean_temp()
    _task_clean_browsers()
    _task_trim_logs()
    _task_empty_trash()
    _task_clean_pkg_caches()
    _task_disk_cleanup()
    _task_check_disk_health()
    detector.ensure_high_performance_power_plan()
    path = reporter.generate_daily_report()
    log.info("Done. Report: %s", path)


def _print_status():
    import json
    snapshot = monitor.run_once()
    print(json.dumps(snapshot, indent=2, default=str))


def _disable_startup(name: str):
    items = detector.list_startup_programs()
    matches = [i for i in items if i["name"].lower() == name.lower()]
    if not matches:
        print(f"No startup program named '{name}' found.")
        return
    for item in matches:
        ok = detector.disable_startup_program(item["name"], item["hive"], item["key"])
        print(f"{'Disabled' if ok else 'Failed to disable'}: {item['name']} ({item['hive']})")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Windows 11 Maintenance Agent")
    parser.add_argument("--once",    action="store_true", help="Run all tasks once and exit")
    parser.add_argument("--report",  action="store_true", help="Generate report and exit")
    parser.add_argument("--status",  action="store_true", help="Print live snapshot and exit")
    parser.add_argument("--disable-startup", metavar="NAME",
                        help="Disable a startup program by name")
    args = parser.parse_args()

    if args.once:
        _run_once()
        return
    if args.report:
        print(reporter.generate_daily_report())
        return
    if args.status:
        _print_status()
        return
    if args.disable_startup:
        _disable_startup(args.disable_startup)
        return

    # ── Daemon mode ───────────────────────────────────────────────────────────
    log.info("=" * 60)
    log.info("Windows 11 Maintenance Agent starting…")
    log.info("Logs : %s", config.LOG_DIR)
    log.info("Reports: %s", config.REPORT_DIR)
    log.info("=" * 60)

    signal.signal(signal.SIGTERM, _handle_signal)
    signal.signal(signal.SIGINT,  _handle_signal)

    # Apply one-time optimisations on startup
    detector.ensure_high_performance_power_plan()
    notifier.info("Maintenance Agent started and running.")

    # Start real-time monitor
    monitor.start()

    # Register and run scheduler
    _register_schedules()
    scheduler_thread = threading.Thread(target=_scheduler_loop, name="Scheduler", daemon=True)
    scheduler_thread.start()

    # Block main thread until shutdown
    _shutdown_event.wait()
    log.info("Maintenance Agent stopped.")


if __name__ == "__main__":
    main()
