"""
Central configuration for the Windows 11 Maintenance Agent.
Edit values here to tune behaviour without touching agent logic.
"""

import os

# ── Thresholds ────────────────────────────────────────────────────────────────
CPU_ALERT_PERCENT       = 85    # sustained CPU % that triggers an alert
RAM_ALERT_PERCENT       = 85    # RAM % that triggers an alert
DISK_ALERT_PERCENT      = 90    # Disk usage % that triggers an alert
TEMP_ALERT_CELSIUS      = 90    # CPU temperature that triggers a thermal alert
MONITOR_INTERVAL_SEC    = 60    # how often the real-time monitor polls

# ── Schedules (hour of day, 24-h clock) ──────────────────────────────────────
TEMP_CLEAN_INTERVAL_HOURS   = 6
CACHE_CLEAN_HOUR            = 3     # 3 AM daily
LOG_TRIM_HOUR               = 3
TRASH_EMPTY_DAY             = "sunday"   # weekly
PKG_CACHE_CLEAN_DAY         = "saturday"
DUPLICATE_SCAN_DAY          = "friday"
DAILY_REPORT_HOUR           = 6     # 6 AM daily summary

# ── Paths ─────────────────────────────────────────────────────────────────────
AGENT_DIR   = os.path.dirname(os.path.abspath(__file__))
LOG_DIR     = os.path.join(AGENT_DIR, "logs")
REPORT_DIR  = os.path.join(AGENT_DIR, "reports")
STAGING_DIR = os.path.join(AGENT_DIR, "staging")   # files moved here before final delete

# ── Staging / safety ─────────────────────────────────────────────────────────
STAGING_RETENTION_HOURS = 24    # hours before staged files are permanently removed

# ── Notifications ─────────────────────────────────────────────────────────────
DESKTOP_NOTIFICATIONS = True    # show Windows toast notifications
NOTIFICATION_TITLE    = "System Maintenance Agent"

# ── Process whitelist ─────────────────────────────────────────────────────────
# Processes that will NEVER be touched, even if they spike resources
PROTECTED_PROCESSES = {
    "system", "registry", "smss.exe", "csrss.exe", "wininit.exe",
    "winlogon.exe", "services.exe", "lsass.exe", "svchost.exe",
    "dwm.exe", "explorer.exe", "taskmgr.exe",
}

# ── File/folder whitelist for cleaning ───────────────────────────────────────
# Glob patterns that the cleaner will never delete
PROTECTED_PATH_PATTERNS = [
    "*.sys", "*.dll", "desktop.ini",
]

# ── Log rotation ──────────────────────────────────────────────────────────────
LOG_MAX_BYTES   = 5 * 1024 * 1024   # 5 MB
LOG_BACKUP_COUNT = 5
