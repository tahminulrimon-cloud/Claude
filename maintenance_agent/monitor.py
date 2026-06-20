"""
Real-time system monitor.
Polls every MONITOR_INTERVAL_SEC seconds and raises alerts when thresholds breach.
Tracks per-process resource history to detect memory leaks.
"""

import time
import threading
import psutil

import config
import notifier
from logger_setup import get_logger

log = get_logger("monitor")

# Tracks RAM samples per PID: {pid: [mb, mb, ...]}
_mem_history: dict[int, list[float]] = {}
_LEAK_SAMPLES = 10          # number of consecutive samples that must grow
_LEAK_GROWTH_MB = 50        # total growth in MB across samples to flag as leak

_stop_event = threading.Event()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _is_protected(name: str) -> bool:
    return (name or "").lower() in config.PROTECTED_PROCESSES


def _fmt_mb(bytes_: float) -> str:
    return f"{bytes_ / 1024 / 1024:.1f} MB"


# ── Individual checks ─────────────────────────────────────────────────────────

def check_cpu() -> dict:
    overall = psutil.cpu_percent(interval=1)
    per_proc = []
    for p in psutil.process_iter(["pid", "name", "cpu_percent"]):
        try:
            if p.info["cpu_percent"] > 50 and not _is_protected(p.info["name"]):
                per_proc.append((p.info["name"], p.info["pid"], p.info["cpu_percent"]))
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    result = {"overall_pct": overall, "top_procs": per_proc}

    if overall >= config.CPU_ALERT_PERCENT:
        msg = f"High CPU usage: {overall:.1f}%"
        if per_proc:
            top = per_proc[0]
            msg += f" — top offender: {top[0]} (PID {top[1]}, {top[2]:.1f}%)"
        notifier.warning(msg)

    return result


def check_ram() -> dict:
    vm = psutil.virtual_memory()
    pct = vm.percent
    result = {"used_pct": pct, "available_mb": vm.available / 1024 / 1024}

    if pct >= config.RAM_ALERT_PERCENT:
        notifier.warning(
            f"High RAM usage: {pct:.1f}% used "
            f"({_fmt_mb(vm.used)} / {_fmt_mb(vm.total)})"
        )

    return result


def check_disk() -> dict:
    results = []
    for part in psutil.disk_partitions(all=False):
        try:
            usage = psutil.disk_usage(part.mountpoint)
            pct = usage.percent
            results.append({"mount": part.mountpoint, "used_pct": pct,
                            "free_gb": usage.free / 1024**3})
            if pct >= config.DISK_ALERT_PERCENT:
                notifier.warning(
                    f"Low disk space on {part.mountpoint}: "
                    f"{pct:.1f}% used, {usage.free / 1024**3:.1f} GB free"
                )
        except PermissionError:
            pass
    return {"partitions": results}


def check_temperature() -> dict:
    temps = {}
    try:
        sensors = psutil.sensors_temperatures()
        if sensors:
            for chip, entries in sensors.items():
                for e in entries:
                    if e.current and e.current >= config.TEMP_ALERT_CELSIUS:
                        notifier.critical(
                            f"High temperature on {chip}/{e.label}: {e.current}°C — "
                            "CPU may be throttling!"
                        )
                    temps[f"{chip}/{e.label}"] = e.current
    except AttributeError:
        # psutil.sensors_temperatures() not available on all Windows builds
        pass
    return {"temps": temps}


def check_memory_leaks() -> list[str]:
    """Track per-process RAM growth; flag processes that grow unbounded."""
    leaks = []
    for p in psutil.process_iter(["pid", "name", "memory_info"]):
        try:
            if _is_protected(p.info["name"]):
                continue
            mb = p.info["memory_info"].rss / 1024 / 1024
            pid = p.info["pid"]
            history = _mem_history.setdefault(pid, [])
            history.append(mb)
            if len(history) > _LEAK_SAMPLES:
                history.pop(0)
            if (len(history) == _LEAK_SAMPLES
                    and all(history[i] <= history[i + 1] for i in range(_LEAK_SAMPLES - 1))
                    and (history[-1] - history[0]) >= _LEAK_GROWTH_MB):
                leaks.append(p.info["name"])
                notifier.warning(
                    f"Possible memory leak: {p.info['name']} (PID {pid}) "
                    f"grew {history[-1] - history[0]:.1f} MB over last "
                    f"{_LEAK_SAMPLES} checks"
                )
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    # Prune history for dead processes
    alive = {p.pid for p in psutil.process_iter()}
    for pid in list(_mem_history):
        if pid not in alive:
            del _mem_history[pid]

    return leaks


def check_zombie_processes() -> list[str]:
    zombies = []
    for p in psutil.process_iter(["pid", "name", "status"]):
        try:
            if p.info["status"] == psutil.STATUS_ZOMBIE:
                zombies.append(f"{p.info['name']} (PID {p.info['pid']})")
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    if zombies:
        log.warning("Zombie/orphan processes found: %s", zombies)
    return zombies


def check_swap() -> dict:
    swap = psutil.swap_memory()
    if swap.total > 0 and swap.percent > 80:
        notifier.warning(
            f"Heavy swap usage: {swap.percent:.1f}% "
            f"({_fmt_mb(swap.used)} / {_fmt_mb(swap.total)}) — system may be thrashing"
        )
    return {"used_pct": swap.percent if swap.total > 0 else 0}


# ── Main monitor loop ─────────────────────────────────────────────────────────

def run_once() -> dict:
    """Run all checks once and return a snapshot dict."""
    return {
        "cpu":     check_cpu(),
        "ram":     check_ram(),
        "disk":    check_disk(),
        "temp":    check_temperature(),
        "swap":    check_swap(),
        "zombies": check_zombie_processes(),
        "leaks":   check_memory_leaks(),
    }


def _loop():
    log.info("Real-time monitor started (interval: %ds)", config.MONITOR_INTERVAL_SEC)
    while not _stop_event.is_set():
        try:
            snapshot = run_once()
            log.debug(
                "Monitor snapshot — CPU: %.1f%% | RAM: %.1f%% | "
                "Swap: %.1f%% | Zombies: %d",
                snapshot["cpu"]["overall_pct"],
                snapshot["ram"]["used_pct"],
                snapshot["swap"]["used_pct"],
                len(snapshot["zombies"]),
            )
        except Exception as e:
            log.exception("Unexpected error in monitor loop: %s", e)
        _stop_event.wait(config.MONITOR_INTERVAL_SEC)
    log.info("Monitor stopped.")


def start() -> threading.Thread:
    t = threading.Thread(target=_loop, name="Monitor", daemon=True)
    t.start()
    return t


def stop():
    _stop_event.set()
