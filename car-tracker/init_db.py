import sqlite3
from datetime import date

DB_PATH = "car_tracker.db"


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.executescript(
        """
        CREATE TABLE IF NOT EXISTS vehicles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            make TEXT,
            model TEXT,
            year INTEGER,
            vin_chassis TEXT,
            engine_no TEXT,
            license_plate TEXT,
            fuel_type TEXT,
            engine_cc INTEGER,
            tire_size TEXT,
            seats INTEGER,
            color TEXT,
            purchase_date TEXT
        );

        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id INTEGER NOT NULL,
            log_date TEXT NOT NULL,
            mileage_km INTEGER,
            fuel_efficiency_kmpl REAL,
            note TEXT,
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
        );

        CREATE TABLE IF NOT EXISTS renewals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id INTEGER NOT NULL,
            renewal_type TEXT NOT NULL,
            issued_date TEXT,
            expiry_date TEXT,
            cost REAL,
            notes TEXT,
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
        );

        CREATE TABLE IF NOT EXISTS maintenance_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id INTEGER NOT NULL,
            service_date TEXT NOT NULL,
            mileage_km INTEGER,
            cost REAL,
            description TEXT,
            shop_name TEXT,
            category TEXT,
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
        );

        CREATE TABLE IF NOT EXISTS maintenance_schedule (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id INTEGER NOT NULL,
            category TEXT NOT NULL,
            interval_km INTEGER,
            interval_months INTEGER,
            last_done_date TEXT,
            last_done_mileage INTEGER,
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
        );
        """
    )

    cur.execute("SELECT COUNT(*) FROM vehicles")
    if cur.fetchone()[0] == 0:
        cur.execute(
            """
            INSERT INTO vehicles
                (make, model, year, vin_chassis, engine_no, license_plate,
                 fuel_type, engine_cc, tire_size, seats, color, purchase_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "Toyota",
                "Axio Hybrid",
                2021,
                "NKE165-7248751",
                "1NZ-9328584",
                "DHAKA METRO-GA-24-1096",
                "Hybrid",
                1490,
                "185/60R15",
                5,
                "White",
                "2025-03-01",
            ),
        )
        vehicle_id = cur.lastrowid

        # Maintenance history seeded from the "Change" doc
        cur.executemany(
            """
            INSERT INTO maintenance_log
                (vehicle_id, service_date, mileage_km, cost, description, shop_name, category)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    vehicle_id,
                    "2025-03-01",
                    39300,
                    None,
                    "Engine Oil, Oil Filter, Air Filter, AC Filter",
                    "Mohakhali",
                    "Oil Change",
                ),
                (
                    vehicle_id,
                    "2025-11-23",
                    40890,
                    None,
                    "Engine Oil (0W-20 Toyota Hybrid), Oil Filter, Air Filter, AC Filter",
                    "Mohakhali",
                    "Oil Change",
                ),
            ],
        )

        # Maintenance schedule rules, seeded from latest oil change
        cur.execute(
            """
            INSERT INTO maintenance_schedule
                (vehicle_id, category, interval_km, interval_months, last_done_date, last_done_mileage)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (vehicle_id, "Oil Change", 5000, 6, "2025-11-23", 40890),
        )
        cur.executemany(
            """
            INSERT INTO maintenance_schedule
                (vehicle_id, category, interval_km, interval_months, last_done_date, last_done_mileage)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            [
                (vehicle_id, "Tire Rotation", 10000, 6, "2025-11-23", 40890),
                (vehicle_id, "Brake Pads", 30000, 24, "2025-03-01", 39300),
                (vehicle_id, "Fluid Flush", 40000, 24, "2025-03-01", 39300),
            ],
        )

        # Renewals seeded from BRTA/insurance documents
        cur.executemany(
            """
            INSERT INTO renewals
                (vehicle_id, renewal_type, issued_date, expiry_date, cost, notes)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            [
                (vehicle_id, "Tax Token", "2025-03-05", "2026-03-04", 5802, "25-26 Tax Token"),
                (vehicle_id, "Fitness Certificate", "2025-03-05", "2026-03-05", 1892, "25-26 Fitness Certificate"),
                (vehicle_id, "Insurance", "2025-03-05", "2026-02-04", 60758, "Islami Commercial Insurance - Comprehensive"),
            ],
        )

        # Initial mileage log point
        cur.execute(
            """
            INSERT INTO logs (vehicle_id, log_date, mileage_km, fuel_efficiency_kmpl, note)
            VALUES (?, ?, ?, ?, ?)
            """,
            (vehicle_id, "2025-11-23", 40890, None, "Seed reading at 2nd oil change"),
        )

    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    print(f"Database initialized at {DB_PATH}")
