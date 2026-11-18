import os
import sys
import sqlite3
import datetime
import hashlib

DATA_DIR = os.environ.get("DATA_DIR", os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data"))
os.makedirs(DATA_DIR, exist_ok=True)
SQLITE_DB_PATH = os.environ.get("DATABASE_FILE", os.path.join(DATA_DIR, "civicpulse.db"))

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def seed_sqlite_native():
    """Initializes SQLite database using Python built-in sqlite3 standard library (Zero Dependencies)."""
    print(f"Connecting to SQLite database at: {SQLITE_DB_PATH}")
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cur = conn.cursor()

    # 1. Users Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'citizen',
        phone TEXT DEFAULT '',
        ward TEXT DEFAULT 'Ward 4 - Central Promenade',
        department TEXT DEFAULT '',
        password_hash TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        created_at TEXT NOT NULL
    );
    """)

    # 2. Complaints Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS complaints (
        id TEXT PRIMARY KEY,
        ticket_number TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        priority TEXT DEFAULT 'Medium',
        status TEXT DEFAULT 'Submitted',
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        address TEXT NOT NULL,
        ward TEXT NOT NULL,
        landmark TEXT DEFAULT '',
        image_url TEXT DEFAULT '',
        citizen_id TEXT DEFAULT 'user_citizen_1',
        citizen_name TEXT DEFAULT 'Aarav Sharma',
        is_anonymous INTEGER DEFAULT 0,
        department_assigned TEXT DEFAULT 'Roads & Infrastructure',
        officer_assigned TEXT DEFAULT 'Eng. Vikram Sethi',
        upvotes INTEGER DEFAULT 1,
        fake_score INTEGER DEFAULT 5,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # 3. Departments Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS departments (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        head_name TEXT DEFAULT '',
        email TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        active_tickets INTEGER DEFAULT 0,
        resolved_tickets INTEGER DEFAULT 0,
        avg_resolution_hours REAL DEFAULT 24.0
    );
    """)

    # 4. Wards Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS wards (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        ward_number INTEGER DEFAULT 1,
        councilor_name TEXT DEFAULT '',
        total_complaints INTEGER DEFAULT 0,
        resolved_complaints INTEGER DEFAULT 0
    );
    """)

    # 5. Announcements Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        department TEXT DEFAULT 'General Municipal Administration',
        priority TEXT DEFAULT 'Normal',
        created_at TEXT NOT NULL
    );
    """)

    # 6. Feedbacks Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS feedbacks (
        id TEXT PRIMARY KEY,
        complaint_id TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comments TEXT DEFAULT '',
        citizen_name TEXT DEFAULT 'Citizen',
        created_at TEXT NOT NULL
    );
    """)

    conn.commit()

    # Seed 5 Standard User Accounts (Citizen, Administrator, Department Officer, Field Worker, Super Administrator)
    cur.execute("SELECT COUNT(*) FROM users;")
    if cur.fetchone()[0] == 0:
        print("Seeding 5 default user accounts across roles...")
        now = datetime.datetime.utcnow().isoformat() + "Z"
        users_data = [
            ("user_citizen_1", "Aarav Sharma", "citizen@smartcity.gov", "citizen", "+1 555-0192", "Ward 4 - Central Promenade", "", hash_pw("password123"), "active", now),
            ("user_admin_1", "Dr. Rajesh Verma (Municipal Commissioner)", "admin@smartcity.gov", "admin", "+1 555-0100", "Ward 4 - Central Promenade", "Municipal Executive Administration", hash_pw("password123"), "active", now),
            ("user_officer_1", "Eng. Vikram Sethi", "roads@smartcity.gov", "officer", "+1 555-0144", "Ward 4 - Central Promenade", "Roads & Infrastructure", hash_pw("password123"), "active", now),
            ("user_worker_1", "Ramesh Kumar (Field Response Specialist)", "worker@smartcity.gov", "field_worker", "+1 555-0155", "Ward 4 - Central Promenade", "Roads & Infrastructure", hash_pw("password123"), "active", now),
            ("user_superadmin_1", "Super Admin - Director of Digital Governance", "superadmin@smartcity.gov", "super_admin", "+1 555-0001", "All Wards (Central Command)", "Smart City IT & Digital Governance", hash_pw("password123"), "active", now),
        ]
        cur.executemany("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);", users_data)
        conn.commit()
        print("Seeded 5 user accounts successfully.")

    # Seed Departments
    cur.execute("SELECT COUNT(*) FROM departments;")
    if cur.fetchone()[0] == 0:
        print("Seeding municipal departments...")
        depts_data = [
            ("dept_1", "Roads & Infrastructure", "Eng. Vikram Sethi", "roads@smartcity.gov", "+1 555-0144", 14, 182, 28.0),
            ("dept_2", "Solid Waste & Sanitation", "Dr. Sunita Rao", "sanitation@smartcity.gov", "+1 555-0188", 9, 310, 12.0),
            ("dept_3", "Water Supply & Sewage", "Eng. Ramesh Gupta", "water@smartcity.gov", "+1 555-0122", 11, 145, 18.0),
            ("dept_4", "Electrical & Streetlighting", "Er. Priya Nair", "electricity@smartcity.gov", "+1 555-0166", 6, 220, 14.0),
            ("dept_5", "Drainage & Stormwater", "Eng. Anil Kapoor", "drainage@smartcity.gov", "+1 555-0133", 8, 98, 22.0),
            ("dept_6", "Parks & Horticulture", "Sanjay Deshmukh", "parks@smartcity.gov", "+1 555-0177", 4, 85, 36.0),
            ("dept_7", "Public Health & Encroachment", "Dr. Meera Kulkarni", "health@smartcity.gov", "+1 555-0199", 5, 112, 24.0),
        ]
        cur.executemany("INSERT INTO departments VALUES (?, ?, ?, ?, ?, ?, ?, ?);", depts_data)
        conn.commit()

    # Seed Wards
    cur.execute("SELECT COUNT(*) FROM wards;")
    if cur.fetchone()[0] == 0:
        print("Seeding municipal wards...")
        wards_data = [
            ("ward_1", "Ward 1 - Metro North", 1, "Smt. Rekha Sharma", 84, 76),
            ("ward_2", "Ward 2 - Civic Tech Hub", 2, "Shri Amit Patel", 62, 58),
            ("ward_3", "Ward 3 - Heritage Square", 3, "Shri Mohan Das", 95, 82),
            ("ward_4", "Ward 4 - Central Promenade", 4, "Smt. Kavita Reddy", 128, 114),
            ("ward_5", "Ward 5 - Waterfront East", 5, "Shri Tariq Ali", 47, 43),
            ("ward_6", "Ward 6 - Southern Industrial Park", 6, "Er. Harish Verma", 71, 64),
        ]
        cur.executemany("INSERT INTO wards VALUES (?, ?, ?, ?, ?, ?);", wards_data)
        conn.commit()

    # Seed Initial Complaints
    cur.execute("SELECT COUNT(*) FROM complaints;")
    if cur.fetchone()[0] == 0:
        print("Seeding initial complaints...")
        now = datetime.datetime.utcnow().isoformat() + "Z"
        complaints_data = [
            ("cmp_1001", "CIV-2026-8812", "Deep Dangerous Pothole near Metro Station Gate 3", "Large asphalt crater roughly 1.5 meters wide causing vehicle tire damage and severe evening traffic blockage.", "Potholes & Road Damage", "High", "Work Started", 28.6139, 77.2090, "Metro Station Gate 3, Central Promenade, Ward 4", "Ward 4 - Central Promenade", "Opp Metro Gate", "", "user_citizen_1", "Aarav Sharma", 0, "Roads & Infrastructure", "Eng. Vikram Sethi", 14, 5, now, now),
            ("cmp_1002", "CIV-2026-8813", "Overflowing Community Waste Dumpster opposite City Mall", "Sanitation bin overflowing onto pedestrian footpath for 48 hours. Stray cattle spreading trash onto roadway.", "Garbage & Solid Waste", "Medium", "Submitted", 28.6175, 77.2150, "Opposite City Grand Mall, Civic Tech Hub, Ward 2", "Ward 2 - Civic Tech Hub", "Near Parking", "", "user_citizen_1", "Aarav Sharma", 0, "Solid Waste & Sanitation", "Dr. Sunita Rao", 8, 4, now, now),
            ("cmp_1003", "CIV-2026-8814", "Underground Drinking Water Pipe Burst on MG Road", "High pressure potable water line ruptured flooding lower shops and wasting clean municipal water.", "Water Leakage & Supply", "Critical", "Verified", 28.6210, 77.2050, "Shop #42, MG Road Market, Ward 4", "Ward 4 - Central Promenade", "Main Market", "", "user_citizen_1", "Aarav Sharma", 0, "Water Supply & Sewage", "Eng. Ramesh Gupta", 21, 3, now, now),
            ("cmp_1004", "CIV-2026-8815", "Non-Functional LED Streetlights on Park Avenue", "Continuous stretch of 8 streetlights dark for 3 consecutive nights creating pedestrian safety hazards.", "Streetlighting & Electrical", "Medium", "Resolved", 28.6090, 77.2180, "Park Avenue West, Ward 1", "Ward 1 - Metro North", "Park Gate", "", "user_citizen_1", "Aarav Sharma", 0, "Electrical & Streetlighting", "Er. Priya Nair", 5, 2, now, now),
        ]
        cur.executemany("INSERT INTO complaints VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);", complaints_data)
        conn.commit()

    conn.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_sqlite_native()
