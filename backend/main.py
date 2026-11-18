import os
import sys
import uuid
import datetime
import hashlib
from typing import Optional, List
import sqlite3

# Ensure applet root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from fastapi import FastAPI, HTTPException, Depends, Header, Query
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.staticfiles import StaticFiles
    from pydantic import BaseModel
except ImportError:
    # FastAPI may be running in virtualenv after setup.bat
    pass

from backend.ml_engine import classify_complaint_local, compute_image_hash, hamming_similarity, forecast_complaint_trends
from backend.nlp_assistant import process_civic_chat

DATA_DIR = os.environ.get("DATA_DIR", os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data"))
os.makedirs(DATA_DIR, exist_ok=True)
SQLITE_DB_PATH = os.environ.get("DATABASE_FILE", os.path.join(DATA_DIR, "civicpulse.db"))
UPLOADS_DIR = os.environ.get("UPLOAD_DIR", os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads"))
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Allowed Origins configuration with sensible defaults
allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", "*")
allowed_origins_list = [o.strip() for o in allowed_origins_env.split(",") if o.strip()] if allowed_origins_env != "*" else ["*"]

app = FastAPI(
    title="CivicPulse Self-Managed API",
    description="100% On-Premise Civic Issue Management Platform with Zero External API Key Dependencies",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

def get_db_conn():
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

# ==========================================
# SYSTEM HEALTH & STATUS
# ==========================================
@app.get("/api/health")
def get_health():
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM complaints;")
    complaints_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM users;")
    users_count = cur.fetchone()[0]
    conn.close()

    return {
        "status": "healthy",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "complaintsCount": complaints_count,
        "usersCount": users_count,
        "storageEngine": f"SQLite Self-Managed ({SQLITE_DB_PATH})",
        "aiEngine": "CivicPulse Local Neural Vision & Bilingual NLP Engine (100% On-Premise, Zero API Keys)",
        "offlineReady": True,
        "supportedRoles": ["Citizen", "Administrator", "Department Officer", "Field Worker", "Super Administrator"]
    }

# ==========================================
# AUTHENTICATION
# ==========================================
class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = None

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = ""
    ward: Optional[str] = "Ward 4 - Central Promenade"

@app.post("/api/auth/login")
def login(req: LoginRequest):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?);", (req.email,))
    user = cur.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials. User not found.")

    user_dict = dict(user)
    # Role check: If logging into official portal, citizen role is blocked
    if req.role and req.role != "citizen" and user_dict["role"] == "citizen":
        raise HTTPException(status_code=403, detail="Citizen accounts cannot access government administrative portals.")

    token = f"civic_local_token_{user_dict['id']}_{int(datetime.datetime.utcnow().timestamp())}"
    return {
        "token": token,
        "user": {
            "id": user_dict["id"],
            "name": user_dict["name"],
            "email": user_dict["email"],
            "role": user_dict["role"],
            "phone": user_dict.get("phone", ""),
            "ward": user_dict.get("ward", ""),
            "department": user_dict.get("department", ""),
            "status": user_dict.get("status", "active")
        }
    }

@app.post("/api/auth/register")
def register(req: RegisterRequest):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE LOWER(email) = LOWER(?);", (req.email,))
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email is already registered.")

    user_id = f"user_citizen_{int(datetime.datetime.utcnow().timestamp())}"
    now = datetime.datetime.utcnow().isoformat() + "Z"
    pw_hash = hash_pw(req.password)

    cur.execute(
        "INSERT INTO users (id, name, email, role, phone, ward, department, password_hash, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        (user_id, req.name, req.email.lower().strip(), "citizen", req.phone or "", req.ward or "Ward 4 - Central Promenade", "", pw_hash, "active", now)
    )
    conn.commit()
    conn.close()

    token = f"civic_local_token_{user_id}_{int(datetime.datetime.utcnow().timestamp())}"
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": req.name,
            "email": req.email,
            "role": "citizen",
            "phone": req.phone or "",
            "ward": req.ward or "Ward 4 - Central Promenade",
            "status": "active"
        }
    }

# ==========================================
# LOCAL AI ENDPOINTS
# ==========================================
class AIAnalyzePayload(BaseModel):
    title: Optional[str] = ""
    description: Optional[str] = ""
    imageBase64: Optional[str] = None
    location: Optional[dict] = None

@app.post("/api/ai/analyze-issue")
def analyze_issue(payload: AIAnalyzePayload):
    addr = payload.location.get("address", "") if payload.location else ""
    res = classify_complaint_local(payload.title, payload.description, payload.imageBase64, addr)

    # Check for duplicate image via perceptual hash against active complaints
    if payload.imageBase64:
        q_hash = compute_image_hash(payload.imageBase64)
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute("SELECT ticket_number, image_url FROM complaints WHERE status NOT IN ('Resolved', 'Closed') LIMIT 50;")
        rows = cur.fetchall()
        conn.close()

        for r in rows:
            if r["image_url"] and len(r["image_url"]) > 100:
                h = compute_image_hash(r["image_url"])
                sim = hamming_similarity(q_hash, h)
                if sim > 82:
                    res["duplicateFound"] = True
                    res["duplicateComplaintId"] = r["ticket_number"]
                    break

    return {"aiAnalysis": res}

class AIChatPayload(BaseModel):
    message: str

@app.post("/api/ai/chat")
def chat_ai(payload: AIChatPayload):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT ticket_number, title, status, category, ward, department_assigned, officer_assigned FROM complaints LIMIT 20;")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    reply = process_civic_chat(payload.message, rows)
    return {"reply": reply}

@app.get("/api/ai/predict")
def predict_trends():
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT ward, COUNT(*) as cnt FROM complaints WHERE status NOT IN ('Resolved', 'Closed') GROUP BY ward;")
    rows = cur.fetchall()
    active_by_ward = {r["ward"]: r["cnt"] for r in rows}

    cur.execute("SELECT COUNT(*) FROM complaints;")
    total = cur.fetchone()[0]
    conn.close()

    return forecast_complaint_trends(total, active_by_ward)

# ==========================================
# COMPLAINTS API
# ==========================================
@app.get("/api/complaints")
def list_complaints(
    status: Optional[str] = None,
    category: Optional[str] = None,
    ward: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None
):
    conn = get_db_conn()
    cur = conn.cursor()
    query = "SELECT * FROM complaints WHERE 1=1"
    params = []

    if status:
        query += " AND status = ?"
        params.append(status)
    if category:
        query += " AND category = ?"
        params.append(category)
    if ward:
        query += " AND ward = ?"
        params.append(ward)
    if priority:
        query += " AND priority = ?"
        params.append(priority)
    if search:
        query += " AND (LOWER(title) LIKE ? OR LOWER(ticket_number) LIKE ? OR LOWER(address) LIKE ?)"
        s = f"%{search.lower()}%"
        params.extend([s, s, s])

    query += " ORDER BY created_at DESC"
    cur.execute(query, params)
    rows = cur.fetchall()
    conn.close()

    results = []
    for r in rows:
        d = dict(r)
        results.append({
            "id": d["id"],
            "ticketNumber": d["ticket_number"],
            "title": d["title"],
            "description": d["description"],
            "category": d["category"],
            "priority": d["priority"],
            "status": d["status"],
            "location": {
                "lat": d["lat"],
                "lng": d["lng"],
                "address": d["address"],
                "ward": d["ward"],
                "landmark": d.get("landmark", "")
            },
            "images": [d["image_url"]] if d.get("image_url") else [],
            "citizenId": d["citizen_id"],
            "citizenName": d["citizen_name"],
            "isAnonymous": bool(d["is_anonymous"]),
            "departmentAssigned": d["department_assigned"],
            "officerAssigned": d["officer_assigned"],
            "upvotes": d["upvotes"],
            "createdAt": d["created_at"],
            "updatedAt": d["updated_at"]
        })
    return results

@app.get("/api/complaints/{ticket_number}")
def get_complaint(ticket_number: str):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM complaints WHERE LOWER(ticket_number) = LOWER(?) OR id = ?;", (ticket_number, ticket_number))
    r = cur.fetchone()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="Complaint not found")

    d = dict(r)
    return {
        "id": d["id"],
        "ticketNumber": d["ticket_number"],
        "title": d["title"],
        "description": d["description"],
        "category": d["category"],
        "priority": d["priority"],
        "status": d["status"],
        "location": {
            "lat": d["lat"],
            "lng": d["lng"],
            "address": d["address"],
            "ward": d["ward"],
            "landmark": d.get("landmark", "")
        },
        "images": [d["image_url"]] if d.get("image_url") else [],
        "citizenId": d["citizen_id"],
        "citizenName": d["citizen_name"],
        "isAnonymous": bool(d["is_anonymous"]),
        "departmentAssigned": d["department_assigned"],
        "officerAssigned": d["officer_assigned"],
        "upvotes": d["upvotes"],
        "createdAt": d["created_at"],
        "updatedAt": d["updated_at"]
    }
