"""
Desktop toast notifications for Windows 11.
Uses plyer (cross-platform fallback) and falls back to a simple log if unavailable.
"""

import config
from logger_setup import get_logger

log = get_logger("notifier")


def _toast(title: str, message: str, duration: int = 8) -> None:
    try:
        from plyer import notification
        notification.notify(
            title=title,
            message=message,
            app_name=config.NOTIFICATION_TITLE,
            timeout=duration,
        )
    except Exception as e:
        log.debug("Toast notification unavailable: %s", e)


def alert(message: str, level: str = "INFO") -> None:
    """Send a desktop notification and log the message."""
    log.info("[ALERT] %s", message)
    if config.DESKTOP_NOTIFICATIONS:
        icon = {"INFO": "ℹ️", "WARNING": "⚠️", "CRITICAL": "🚨"}.get(level, "")
        _toast(config.NOTIFICATION_TITLE, f"{icon} {message}")


def info(message: str) -> None:
    alert(message, "INFO")


def warning(message: str) -> None:
    alert(message, "WARNING")


def critical(message: str) -> None:
    alert(message, "CRITICAL")
