"""
Daily report generator.
Writes an HTML + plain-text summary to the reports/ directory.
"""

import os
import json
from datetime import datetime

import config
import monitor
import detector
from logger_setup import get_logger

log = get_logger("reporter")

# Accumulate events throughout the day for the nightly summary
_daily_events: list[dict] = []


def log_event(category: str, description: str, freed_mb: float = 0.0):
    _daily_events.append({
        "time": datetime.now().strftime("%H:%M:%S"),
        "category": category,
        "description": description,
        "freed_mb": freed_mb,
    })


def generate_daily_report() -> str:
    """Build an HTML report and save it; return the file path."""
    os.makedirs(config.REPORT_DIR, exist_ok=True)
    date_str = datetime.now().strftime("%Y-%m-%d")
    path = os.path.join(config.REPORT_DIR, f"report_{date_str}.html")

    # Live snapshot
    snapshot    = monitor.run_once()
    diagnostics = detector.run_full_diagnostic()
    total_freed = sum(e["freed_mb"] for e in _daily_events)

    disk_rows = "".join(
        f"<tr><td>{p['mount']}</td><td>{p['used_pct']:.1f}%</td>"
        f"<td>{p['free_gb']:.1f} GB</td></tr>"
        for p in snapshot["disk"]["partitions"]
    )

    event_rows = "".join(
        f"<tr><td>{e['time']}</td><td>{e['category']}</td>"
        f"<td>{e['description']}</td><td>{e['freed_mb']:.1f}</td></tr>"
        for e in _daily_events
    ) or "<tr><td colspan='4'>No events recorded today.</td></tr>"

    startup_rows = "".join(
        f"<tr><td>{s['name']}</td><td><code>{s['command'][:60]}…</code></td>"
        f"<td>{s['hive']}</td></tr>"
        for s in diagnostics["startup_programs"]
    )

    disk_health_rows = "".join(
        f"<tr><td>{disk}</td>"
        f"<td style='color:{'green' if status == 'Healthy' else 'red'}'>{status}</td></tr>"
        for disk, status in diagnostics["disk_health"].items()
    ) or "<tr><td colspan='2'>No data (may need elevated rights)</td></tr>"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Maintenance Report — {date_str}</title>
<style>
  body {{font-family: Segoe UI, sans-serif; background:#f5f5f5; color:#222; padding:2rem;}}
  h1  {{color:#0078d4;}}
  h2  {{color:#444; border-bottom:1px solid #ccc; padding-bottom:.3rem;}}
  .card {{background:#fff; border-radius:8px; padding:1rem 1.5rem; margin:.8rem 0;
           box-shadow:0 1px 4px rgba(0,0,0,.1);}}
  .stat {{display:inline-block; margin:.5rem 1.5rem .5rem 0; font-size:1.5rem; font-weight:600;}}
  .label {{font-size:.75rem; color:#666; display:block;}}
  table {{border-collapse:collapse; width:100%; font-size:.9rem;}}
  th,td {{text-align:left; padding:.4rem .6rem; border-bottom:1px solid #eee;}}
  th {{background:#e8f0fe; color:#1a237e;}}
  .ok   {{color:green; font-weight:600;}}
  .warn {{color:orange; font-weight:600;}}
  .bad  {{color:red;    font-weight:600;}}
</style>
</head>
<body>
<h1>System Maintenance Report</h1>
<p>Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>

<div class="card">
  <h2>Today at a Glance</h2>
  <span class="stat">{total_freed:.1f} MB<span class="label">Space Freed</span></span>
  <span class="stat">{len(_daily_events)}<span class="label">Actions Taken</span></span>
  <span class="stat">{snapshot['cpu']['overall_pct']:.1f}%<span class="label">Current CPU</span></span>
  <span class="stat">{snapshot['ram']['used_pct']:.1f}%<span class="label">Current RAM</span></span>
</div>

<div class="card">
  <h2>Disk Usage</h2>
  <table><tr><th>Drive</th><th>Used</th><th>Free</th></tr>
  {disk_rows}
  </table>
</div>

<div class="card">
  <h2>Disk Health</h2>
  <table><tr><th>Drive</th><th>Status</th></tr>
  {disk_health_rows}
  </table>
</div>

<div class="card">
  <h2>Today's Events</h2>
  <table>
  <tr><th>Time</th><th>Category</th><th>Description</th><th>MB Freed</th></tr>
  {event_rows}
  </table>
</div>

<div class="card">
  <h2>Startup Programs ({len(diagnostics['startup_programs'])} total)</h2>
  <table><tr><th>Name</th><th>Command</th><th>Scope</th></tr>
  {startup_rows}
  </table>
  <p style="font-size:.8rem;color:#666;">
    To disable a startup item run: <code>python agent.py --disable-startup "Name"</code>
  </p>
</div>

</body></html>"""

    with open(path, "w", encoding="utf-8") as f:
        f.write(html)

    log.info("Daily report saved: %s", path)
    _daily_events.clear()
    return path
