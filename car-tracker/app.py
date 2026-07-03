import sqlite3
from datetime import date, datetime

import pandas as pd
import streamlit as st

from init_db import init_db, DB_PATH

st.set_page_config(page_title="Car Maintenance Tracker", page_icon="🚗", layout="wide")

init_db()


def get_conn():
    return sqlite3.connect(DB_PATH)


def get_vehicle():
    conn = get_conn()
    df = pd.read_sql("SELECT * FROM vehicles LIMIT 1", conn)
    conn.close()
    return df.iloc[0] if not df.empty else None


def get_latest_mileage(vehicle_id):
    conn = get_conn()
    row = conn.execute(
        "SELECT mileage_km FROM logs WHERE vehicle_id = ? ORDER BY log_date DESC, id DESC LIMIT 1",
        (vehicle_id,),
    ).fetchone()
    conn.close()
    return row[0] if row else 0


def days_until(d):
    try:
        return (datetime.strptime(d, "%Y-%m-%d").date() - date.today()).days
    except (TypeError, ValueError):
        return None


vehicle = get_vehicle()
if vehicle is None:
    st.error("No vehicle found in the database.")
    st.stop()

vehicle_id = int(vehicle["id"])
current_mileage = get_latest_mileage(vehicle_id)

# ---------- Header ----------
st.title(f"🚗 {vehicle['make']} {vehicle['model']} ({vehicle['year']})")
c1, c2, c3, c4, c5 = st.columns(5)
c1.metric("License Plate", vehicle["license_plate"])
c2.metric("Current Mileage", f"{current_mileage:,} km")
c3.metric("Fuel Type", vehicle["fuel_type"])
c4.metric("Engine", f"{vehicle['engine_cc']} cc")
c5.metric("Tire Size", vehicle["tire_size"])

st.divider()

# ---------- Upcoming Maintenance ----------
st.subheader("🔴 Upcoming Maintenance")

conn = get_conn()
schedule_df = pd.read_sql(
    "SELECT * FROM maintenance_schedule WHERE vehicle_id = ?", conn, params=(vehicle_id,)
)
conn.close()

if schedule_df.empty:
    st.info("No maintenance schedule defined yet.")
else:
    alerts = []
    for _, row in schedule_df.iterrows():
        next_due_km = None
        next_due_date = None
        km_remaining = None
        days_remaining = None

        if row["interval_km"] and row["last_done_mileage"] is not None:
            next_due_km = row["last_done_mileage"] + row["interval_km"]
            km_remaining = next_due_km - current_mileage

        if row["interval_months"] and row["last_done_date"]:
            last = datetime.strptime(row["last_done_date"], "%Y-%m-%d").date()
            month = last.month - 1 + row["interval_months"]
            year = last.year + month // 12
            month = month % 12 + 1
            day = min(last.day, 28)
            next_due_date = date(year, month, day)
            days_remaining = (next_due_date - date.today()).days

        due_now = (km_remaining is not None and km_remaining <= 0) or (
            days_remaining is not None and days_remaining <= 0
        )
        due_soon = (km_remaining is not None and 0 < km_remaining <= 500) or (
            days_remaining is not None and 0 < days_remaining <= 30
        )

        status = "🔴 Overdue" if due_now else ("🟠 Due Soon" if due_soon else "🟢 OK")

        alerts.append(
            {
                "Status": status,
                "Category": row["category"],
                "Next Due (km)": next_due_km,
                "Km Remaining": km_remaining,
                "Next Due (date)": next_due_date,
                "Days Remaining": days_remaining,
            }
        )

    alerts_df = pd.DataFrame(alerts).sort_values(
        by="Status", key=lambda s: s.map({"🔴 Overdue": 0, "🟠 Due Soon": 1, "🟢 OK": 2})
    )
    st.dataframe(alerts_df, use_container_width=True, hide_index=True)

st.divider()

# ---------- Renewals ----------
st.subheader("📅 Renewals (Tax Token / Fitness / Insurance)")

conn = get_conn()
renewals_df = pd.read_sql(
    "SELECT * FROM renewals WHERE vehicle_id = ? ORDER BY expiry_date", conn, params=(vehicle_id,)
)
conn.close()

if renewals_df.empty:
    st.info("No renewals recorded yet.")
else:
    display_df = renewals_df.copy()
    display_df["Days Left"] = display_df["expiry_date"].apply(days_until)
    display_df["Status"] = display_df["Days Left"].apply(
        lambda d: "🔴 Expired" if d is not None and d <= 0
        else ("🟠 Expiring Soon" if d is not None and d <= 30 else "🟢 Valid")
    )
    st.dataframe(
        display_df[["Status", "renewal_type", "issued_date", "expiry_date", "Days Left", "cost", "notes"]],
        use_container_width=True,
        hide_index=True,
    )

st.divider()

# ---------- Recent Maintenance & Cost Trend ----------
left, right = st.columns([2, 1])

with left:
    st.subheader("🧰 Recent Maintenance")
    conn = get_conn()
    maint_df = pd.read_sql(
        "SELECT service_date, mileage_km, category, description, shop_name, cost "
        "FROM maintenance_log WHERE vehicle_id = ? ORDER BY service_date DESC",
        conn,
        params=(vehicle_id,),
    )
    conn.close()
    st.dataframe(maint_df, use_container_width=True, hide_index=True)

with right:
    st.subheader("💰 Cost Over Time")
    if not maint_df.empty and maint_df["cost"].notna().any():
        chart_df = maint_df.dropna(subset=["cost"]).sort_values("service_date")
        chart_df = chart_df.set_index("service_date")[["cost"]]
        st.bar_chart(chart_df)
    else:
        st.info("No cost data recorded yet.")

st.divider()

# ---------- Data Entry ----------
st.subheader("➕ Add New Entry")

tab_log, tab_maint, tab_renewal, tab_schedule = st.tabs(
    ["Mileage / Fuel Log", "Maintenance Record", "Renewal", "Maintenance Rule"]
)

with tab_log:
    with st.form("log_form", clear_on_submit=True):
        log_date = st.date_input("Date", value=date.today())
        mileage = st.number_input("Mileage (km)", min_value=0, step=1)
        fuel_eff = st.number_input("Fuel Efficiency (km/l)", min_value=0.0, step=0.1)
        note = st.text_input("Note")
        if st.form_submit_button("Save Log"):
            conn = get_conn()
            conn.execute(
                "INSERT INTO logs (vehicle_id, log_date, mileage_km, fuel_efficiency_kmpl, note) "
                "VALUES (?, ?, ?, ?, ?)",
                (vehicle_id, log_date.isoformat(), mileage, fuel_eff or None, note),
            )
            conn.commit()
            conn.close()
            st.success("Log saved.")
            st.rerun()

with tab_maint:
    with st.form("maint_form", clear_on_submit=True):
        service_date = st.date_input("Service Date", value=date.today())
        mileage = st.number_input("Mileage at Service (km)", min_value=0, step=1)
        category = st.selectbox(
            "Category",
            ["Oil Change", "Tire Rotation", "Brake Pads", "Fluid Flush", "Battery", "Other"],
        )
        description = st.text_area("Description of Work")
        shop_name = st.text_input("Mechanic / Shop Name")
        cost = st.number_input("Cost", min_value=0.0, step=100.0)
        if st.form_submit_button("Save Maintenance Record"):
            conn = get_conn()
            conn.execute(
                "INSERT INTO maintenance_log "
                "(vehicle_id, service_date, mileage_km, cost, description, shop_name, category) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (vehicle_id, service_date.isoformat(), mileage, cost, description, shop_name, category),
            )
            # also update the matching schedule rule so reminders recalculate
            conn.execute(
                "UPDATE maintenance_schedule SET last_done_date = ?, last_done_mileage = ? "
                "WHERE vehicle_id = ? AND category = ?",
                (service_date.isoformat(), mileage, vehicle_id, category),
            )
            conn.commit()
            conn.close()
            st.success("Maintenance record saved.")
            st.rerun()

with tab_renewal:
    with st.form("renewal_form", clear_on_submit=True):
        renewal_type = st.selectbox(
            "Type", ["Tax Token", "Fitness Certificate", "Insurance", "Registration"]
        )
        issued_date = st.date_input("Issued Date", value=date.today())
        expiry_date = st.date_input("Expiry Date", value=date.today())
        cost = st.number_input("Cost", min_value=0.0, step=100.0)
        notes = st.text_input("Notes")
        if st.form_submit_button("Save Renewal"):
            conn = get_conn()
            conn.execute(
                "INSERT INTO renewals (vehicle_id, renewal_type, issued_date, expiry_date, cost, notes) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (vehicle_id, renewal_type, issued_date.isoformat(), expiry_date.isoformat(), cost, notes),
            )
            conn.commit()
            conn.close()
            st.success("Renewal saved.")
            st.rerun()

with tab_schedule:
    with st.form("schedule_form", clear_on_submit=True):
        category = st.text_input("Category (e.g. Oil Change)")
        interval_km = st.number_input("Interval (km)", min_value=0, step=500)
        interval_months = st.number_input("Interval (months)", min_value=0, step=1)
        last_done_date = st.date_input("Last Done Date", value=date.today())
        last_done_mileage = st.number_input("Last Done Mileage (km)", min_value=0, step=1)
        if st.form_submit_button("Save Rule"):
            conn = get_conn()
            conn.execute(
                "INSERT INTO maintenance_schedule "
                "(vehicle_id, category, interval_km, interval_months, last_done_date, last_done_mileage) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (
                    vehicle_id,
                    category,
                    interval_km or None,
                    interval_months or None,
                    last_done_date.isoformat(),
                    last_done_mileage,
                ),
            )
            conn.commit()
            conn.close()
            st.success("Maintenance rule saved.")
            st.rerun()
