import os
import sys
import uuid
import re
import hmac
import json
import base64
import secrets
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

def load_or_create_jwt_secret() -> str:
    env_secret = os.environ.get("JWT_SECRET", "").strip()
    if env_secret:
        return env_secret
    secret_file = os.path.join(DATA_DIR, ".jwt_secret_py")
    if os.path.exists(secret_file):
        with open(secret_file, "r", encoding="utf-8") as f:
            stored = f.read().strip()
            if len(stored) >= 32:
                return stored
    generated = secrets.token_hex(48)
    with open(secret_file, "w", encoding="utf-8") as f:
        f.write(generated)
    try:
        os.chmod(secret_file, 0o600)
    except OSError:
        pass
    return generated

JWT_SECRET = load_or_create_jwt_secret()

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
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
    return f"pbkdf2_sha256${salt}${dk}"

def verify_pw(pw: str, stored_hash: str) -> bool:
    if not stored_hash:
        return False
    if stored_hash.startswith("pbkdf2_sha256$"):
        parts = stored_hash.split("$")
        if len(parts) != 3:
            return False
        _, salt, expected_hex = parts
        dk = hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
        return hmac.compare_digest(dk, expected_hex)
    # Support legacy SHA-256 hashes seeded by init_db.py
    legacy_digest = hashlib.sha256(pw.encode("utf-8")).hexdigest()
    return hmac.compare_digest(legacy_digest, stored_hash)

def create_signed_token(user_dict: dict) -> str:
    payload = {
        "id": user_dict["id"],
        "email": user_dict["email"],
        "role": user_dict["role"],
        "name": user_dict["name"],
        "exp": int((datetime.datetime.utcnow() + datetime.timedelta(days=7)).timestamp()),
    }
    b64_payload = base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8").rstrip("=")
    sig = hmac.new(JWT_SECRET.encode("utf-8"), b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{b64_payload}.{sig}"

def decode_signed_token(authorization: Optional[str]) -> Optional[dict]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[7:].strip()
    if "." not in token:
        return None
    b64_payload, sig = token.split(".", 1)
    expected_sig = hmac.new(JWT_SECRET.encode("utf-8"), b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected_sig):
        return None
    padded = b64_payload + "=" * ((4 - len(b64_payload) % 4) % 4)
    try:
        payload = json.loads(base64.urlsafe_b64decode(padded).decode("utf-8"))
        if payload.get("exp", 0) < int(datetime.datetime.utcnow().timestamp()):
            return None
        return payload
    except Exception:
        return None

def require_auth(authorization: Optional[str] = Header(None)) -> dict:
    user = decode_signed_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication token required.")
    return user

def require_staff(user: dict = Depends(require_auth)) -> dict:
    if user.get("role") not in ("admin", "officer", "field_worker", "super_admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions. Municipal staff authorization required.")
    return user

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
        "aiEngine": "CivicPulse Bilingual Rule-Based Ontology & dHash Engine (Zero External API Keys)",
        "visionAdapter": {"loaded": False, "adapter": "unloaded-stub"},
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
    cur.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?);", (req.email.strip(),))
    user = cur.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user_dict = dict(user)
    if not verify_pw(req.password, user_dict.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if user_dict.get("status") == "suspended":
        raise HTTPException(status_code=403, detail="Account has been suspended. Contact Super Administrator.")

    # Role check: If logging into official portal, citizen role is blocked
    if req.role and req.role != "citizen" and user_dict["role"] == "citizen":
        raise HTTPException(status_code=403, detail="Citizen accounts cannot access government administrative portals.")

    token = create_signed_token(user_dict)
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
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE LOWER(email) = LOWER(?);", (req.email.strip(),))
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email is already registered.")

    user_id = f"user_citizen_{int(datetime.datetime.utcnow().timestamp())}_{secrets.token_hex(2)}"
    now = datetime.datetime.utcnow().isoformat() + "Z"
    pw_hash = hash_pw(req.password)
    clean_email = req.email.lower().strip()

    cur.execute(
        "INSERT INTO users (id, name, email, role, phone, ward, department, password_hash, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        (user_id, req.name.strip(), clean_email, "citizen", req.phone or "", req.ward or "Ward 4 - Central Promenade", "", pw_hash, "active", now)
    )
    conn.commit()
    conn.close()

    user_obj = {
        "id": user_id,
        "name": req.name.strip(),
        "email": clean_email,
        "role": "citizen",
        "phone": req.phone or "",
        "ward": req.ward or "Ward 4 - Central Promenade",
        "status": "active"
    }
    token = create_signed_token(user_obj)
    return {"token": token, "user": user_obj}

# ==========================================
# LOCAL IMAGE UPLOAD
# ==========================================
class UploadPayload(BaseModel):
    imageBase64: str

@app.post("/api/upload")
def upload_image(payload: UploadPayload):
    m = re.match(r"^data:image/(png|jpeg|jpg|webp);base64,(.+)$", payload.imageBase64, re.IGNORECASE)
    if not m:
        raise HTTPException(status_code=400, detail="Invalid base64 image format. Supported: PNG, JPEG, WEBP.")
    ext = "jpg" if m.group(1).lower() == "jpeg" else m.group(1).lower()
    raw_bytes = base64.b64decode(m.group(2))
    if len(raw_bytes) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image exceeds 8MB limit.")
    filename = f"civic_{int(datetime.datetime.utcnow().timestamp())}_{secrets.token_hex(4)}.{ext}"
    filepath = os.path.join(UPLOADS_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(raw_bytes)
    return {"url": f"/uploads/{filename}", "filename": filename, "sizeBytes": len(raw_bytes)}

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
    cur.execute("SELECT COUNT(*) FROM complaints WHERE status IN ('Resolved', 'Closed');")
    resolved = cur.fetchone()[0]
    conn.close()

    return forecast_complaint_trends(total, active_by_ward, resolved)

# ==========================================
# COMPLAINTS API
# ==========================================
def serialize_complaint_row(d: dict, feedback: Optional[dict] = None) -> dict:
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
        "feedback": feedback,
        "createdAt": d["created_at"],
        "updatedAt": d["updated_at"]
    }

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
    cur.execute("SELECT * FROM feedbacks;")
    fb_map = {
        r["complaint_id"]: {
            "rating": r["rating"],
            "review": r["comments"],
            "confirmedResolved": True,
            "submittedAt": r["created_at"],
        }
        for r in cur.fetchall()
    }
    conn.close()

    return [serialize_complaint_row(dict(r), fb_map.get(r["id"])) for r in rows]

@app.get("/api/complaints/{ticket_number}")
def get_complaint(ticket_number: str):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM complaints WHERE LOWER(ticket_number) = LOWER(?) OR id = ?;", (ticket_number, ticket_number))
    r = cur.fetchone()
    if not r:
        conn.close()
        raise HTTPException(status_code=404, detail="Complaint not found")
    cur.execute("SELECT * FROM feedbacks WHERE complaint_id = ? LIMIT 1;", (r["id"],))
    fb = cur.fetchone()
    conn.close()

    fb_dict = {
        "rating": fb["rating"],
        "review": fb["comments"],
        "confirmedResolved": True,
        "submittedAt": fb["created_at"],
    } if fb else None
    return serialize_complaint_row(dict(r), fb_dict)

class CreateComplaintPayload(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    priority: Optional[str] = None
    location: dict
    images: Optional[List[str]] = []
    citizenId: Optional[str] = None
    citizenName: Optional[str] = None
    isAnonymous: Optional[bool] = False

@app.post("/api/complaints", status_code=201)
def create_complaint(payload: CreateComplaintPayload, authorization: Optional[str] = Header(None)):
    auth_user = decode_signed_token(authorization)
    now = datetime.datetime.utcnow().isoformat() + "Z"
    cid = f"cmp_{int(datetime.datetime.utcnow().timestamp())}_{secrets.token_hex(2)}"
    ticket_num = f"CIV-2026-{secrets.randbelow(8999) + 1000}"

    ai_res = classify_complaint_local(payload.title, payload.description, None, payload.location.get("address", ""))
    category = payload.category or ai_res["detectedCategory"]
    priority = payload.priority or ai_res["suggestedPriority"]
    dept = ai_res["recommendedDepartment"]
    first_img = payload.images[0] if payload.images else ""

    citizen_id = auth_user["id"] if auth_user else (payload.citizenId or "user_citizen_anon")
    citizen_name = "Anonymous Citizen" if payload.isAnonymous else (auth_user["name"] if auth_user else (payload.citizenName or "Citizen"))

    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO complaints (id, ticket_number, title, description, category, priority, status, lat, lng, address, ward, landmark, image_url, citizen_id, citizen_name, is_anonymous, department_assigned, officer_assigned, upvotes, fake_score, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);""",
        (
            cid, ticket_num, payload.title.strip(), payload.description.strip(), category, priority, "Submitted",
            float(payload.location.get("lat", 28.6139)), float(payload.location.get("lng", 77.2090)),
            payload.location.get("address", "Municipal Zone"), payload.location.get("ward", "Ward 4 - Central Promenade"),
            payload.location.get("landmark", ""), first_img, citizen_id, citizen_name,
            1 if payload.isAnonymous else 0, dept, "", 1, ai_res["fakeScore"], now, now
        )
    )
    conn.commit()
    cur.execute("SELECT * FROM complaints WHERE id = ?;", (cid,))
    created = dict(cur.fetchone())
    conn.close()
    return serialize_complaint_row(created)

class StatusUpdatePayload(BaseModel):
    status: str
    notes: Optional[str] = ""
    updatedBy: Optional[str] = None
    afterImage: Optional[str] = None

@app.put("/api/complaints/{complaint_id}/status")
def update_complaint_status(complaint_id: str, payload: StatusUpdatePayload, staff: dict = Depends(require_staff)):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM complaints WHERE id = ? OR LOWER(ticket_number) = LOWER(?);", (complaint_id, complaint_id))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Complaint not found")

    now = datetime.datetime.utcnow().isoformat() + "Z"
    cur.execute("UPDATE complaints SET status = ?, updated_at = ? WHERE id = ?;", (payload.status, now, row["id"]))
    conn.commit()
    cur.execute("SELECT * FROM complaints WHERE id = ?;", (row["id"],))
    updated = dict(cur.fetchone())
    conn.close()
    return serialize_complaint_row(updated)

class AssignPayload(BaseModel):
    department: Optional[str] = None
    officerName: Optional[str] = None

@app.post("/api/complaints/{complaint_id}/assign")
def assign_complaint(complaint_id: str, payload: AssignPayload, staff: dict = Depends(require_staff)):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM complaints WHERE id = ? OR LOWER(ticket_number) = LOWER(?);", (complaint_id, complaint_id))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Complaint not found")

    now = datetime.datetime.utcnow().isoformat() + "Z"
    dept = payload.department or row["department_assigned"]
    officer = payload.officerName or row["officer_assigned"]
    new_status = "Assigned" if row["status"] in ("Submitted", "Under Review") else row["status"]
    cur.execute(
        "UPDATE complaints SET department_assigned = ?, officer_assigned = ?, status = ?, updated_at = ? WHERE id = ?;",
        (dept, officer, new_status, now, row["id"])
    )
    conn.commit()
    cur.execute("SELECT * FROM complaints WHERE id = ?;", (row["id"],))
    updated = dict(cur.fetchone())
    conn.close()
    return serialize_complaint_row(updated)

class FeedbackPayload(BaseModel):
    rating: int
    review: Optional[str] = ""
    confirmedResolved: Optional[bool] = True

@app.post("/api/complaints/{complaint_id}/feedback")
def submit_feedback(complaint_id: str, payload: FeedbackPayload, user: dict = Depends(require_auth)):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM complaints WHERE id = ? OR LOWER(ticket_number) = LOWER(?);", (complaint_id, complaint_id))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Complaint not found")

    now = datetime.datetime.utcnow().isoformat() + "Z"
    fb_id = f"fb_{int(datetime.datetime.utcnow().timestamp())}_{secrets.token_hex(2)}"
    cur.execute(
        "INSERT INTO feedbacks (id, complaint_id, rating, comments, citizen_name, created_at) VALUES (?, ?, ?, ?, ?, ?);",
        (fb_id, row["id"], max(1, min(5, int(payload.rating))), payload.review or "", user.get("name", "Citizen"), now)
    )
    new_status = "Closed" if payload.confirmedResolved else "Under Review"
    cur.execute("UPDATE complaints SET status = ?, updated_at = ? WHERE id = ?;", (new_status, now, row["id"]))
    conn.commit()
    cur.execute("SELECT * FROM complaints WHERE id = ?;", (row["id"],))
    updated = dict(cur.fetchone())
    conn.close()
    return serialize_complaint_row(updated, {
        "rating": max(1, min(5, int(payload.rating))),
        "review": payload.review or "",
        "confirmedResolved": bool(payload.confirmedResolved),
        "submittedAt": now,
    })

@app.get("/api/stats/dashboard")
def get_dashboard_stats():
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM complaints;")
    rows = [dict(r) for r in cur.fetchall()]
    cur.execute("SELECT rating FROM feedbacks;")
    ratings = [r["rating"] for r in cur.fetchall()]
    conn.close()

    total = len(rows)
    resolved = sum(1 for r in rows if r["status"] in ("Resolved", "Closed"))
    pending = sum(1 for r in rows if r["status"] not in ("Resolved", "Closed", "Rejected"))
    critical = sum(1 for r in rows if r["priority"] == "Critical" and r["status"] not in ("Resolved", "Closed"))
    sat = round((sum(ratings) / len(ratings)) * 20) if ratings else 0

    return {
        "totalComplaints": total,
        "resolvedComplaints": resolved,
        "pendingComplaints": pending,
        "criticalIssues": critical,
        "avgResolutionHours": 0,
        "citizenSatisfactionRate": sat,
        "feedbackCount": len(ratings),
    }

@app.get("/api/public/transparency")
def get_public_transparency():
    stats = get_dashboard_stats()
    return {
        "totalReportsResolved": stats["resolvedComplaints"],
        "totalComplaints": stats["totalComplaints"],
        "activeIssuesInQueue": stats["pendingComplaints"],
        "avgResolutionTimeHours": stats["avgResolutionHours"],
        "citizenSatisfactionScore": stats["citizenSatisfactionRate"],
    }
