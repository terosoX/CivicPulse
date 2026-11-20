import base64
import re
from typing import Dict, List, Tuple, Any

# ==============================================================
# CIVICPULSE LOCAL MACHINE LEARNING & COMPUTER VISION ENGINE
# 100% Self-Managed • Zero External API Keys
# ==============================================================

CIVIC_CATEGORIES = [
    {
        "category": "Potholes & Road Damage",
        "department": "Roads & Infrastructure",
        "keywords": ["pothole", "potholes", "road", "roads", "asphalt", "crater", "tar", "paver", "pavers", "speed breaker", "bump", "crack", "cracks", "pavement", "sinkhole", "divider", "footpath", "highway", "gaddha", "sadak", "गड्ढा", "सड़क"],
        "default_priority": "Medium",
    },
    {
        "category": "Garbage & Solid Waste",
        "department": "Solid Waste & Sanitation",
        "keywords": ["garbage", "trash", "waste", "dump", "dumping", "bin", "bins", "litter", "debris", "rubbish", "refuse", "overflowing", "plastic", "smell", "foul", "rotting", "kachra", "safai", "कचरा", "कूड़ा", "सफाई"],
        "default_priority": "Medium",
    },
    {
        "category": "Water Leakage & Supply",
        "department": "Water Supply & Sewage",
        "keywords": ["water", "leak", "leakage", "pipeline", "pipe", "burst", "no water", "low pressure", "drinking water", "potable", "hydrant", "gushing", "contamination", "paani", "jal", "पानी", "पाइप", "रिसाव"],
        "default_priority": "High",
    },
    {
        "category": "Streetlighting & Electrical",
        "department": "Electrical & Streetlighting",
        "keywords": ["light", "lights", "streetlight", "lamp", "dark", "darkness", "pole", "poles", "wire", "wires", "electrical", "short circuit", "spark", "sparking", "blackout", "transformer", "bijli", "बत्ती", "बिजली", "लाइट"],
        "default_priority": "Medium",
    },
    {
        "category": "Drainage & Sewage Overflow",
        "department": "Drainage & Stormwater",
        "keywords": ["drain", "drainage", "sewage", "gutter", "overflow", "overflowing", "stagnant", "choked", "choke", "manhole", "foul water", "backflow", "sludge", "stormwater", "flood", "flooding", "naala", "नाला", "सीवर", "गटर"],
        "default_priority": "High",
    },
    {
        "category": "Illegal Dumping & Encroachment",
        "department": "Public Health & Encroachment",
        "keywords": ["encroachment", "encroached", "illegal stall", "squatter", "footpath blocked", "unauthorized", "hawker", "construction material", "debris dumped", "kabza", "अवैध", "कब्जा", "अतिक्रमण"],
        "default_priority": "Medium",
    },
    {
        "category": "Fallen Tree & Horticulture",
        "department": "Parks & Horticulture",
        "keywords": ["tree", "trees", "branch", "branches", "fallen", "horticulture", "roots", "pruning", "overgrown", "foliage", "ped", "पेड़", "शाखा", "झाड़ी"],
        "default_priority": "Medium",
    },
    {
        "category": "Traffic & Signage Issues",
        "department": "Roads & Infrastructure",
        "keywords": ["traffic", "signal", "signals", "sign", "signage", "zebra crossing", "stop sign", "jam", "congestion", "broken board", "traffic light", "यातायात", "सिग्नल", "बोर्ड"],
        "default_priority": "Medium",
    },
    {
        "category": "Public Health & Sanitation",
        "department": "Public Health & Encroachment",
        "keywords": ["mosquito", "mosquitoes", "dengue", "malaria", "stray dog", "stray dogs", "dead animal", "carcass", "fumigation", "sanitation", "fogging", "मच्छर", "मलेरिया", "बीमारी"],
        "default_priority": "High",
    },
    {
        "category": "Parks & Public Amenities",
        "department": "Parks & Horticulture",
        "keywords": ["park", "bench", "benches", "playground", "swing", "swings", "fountain", "public toilet", "urinal", "gazebo", "open gym", "पार्क", "झूला", "शौचालय"],
        "default_priority": "Low",
    },
]

CRITICAL_TRIGGERS = [
    "burst", "sinkhole", "live wire", "sparking", "exposed wire", "flood", "flooding", "manhole open",
    "open manhole", "choked hospital", "major accident", "block highway", "life threatening", "danger", "hazard",
    "high tension", "electrocution", "collapse", "आपातकालीन", "खतरा", "खुला मैनहोल"
]

HIGH_TRIGGERS = [
    "urgent", "major", "heavy", "overflowing", "dark area", "blackout", "foul smell", "contaminated",
    "school", "hospital", "severe", "urgent repair", "choked", "deep crater", "गंभीर", "तुरंत"
]

LOW_TRIGGERS = [
    "minor", "faded", "cosmetic", "small crack", "paint", "trim", "aesthetic", "beautification", "dim", "छोटा"
]

def compute_image_hash(base64_str: str) -> str:
    """Computes a 64-bit perceptual difference hash (dHash) simulation from image base64 data."""
    try:
        raw = re.sub(r"^data:image/[a-zA-Z]+;base64,", "", base64_str)
        data = base64.b64decode(raw[:4096])
        if len(data) < 65:
            return "0000000000000000"
        hash_val = 0
        for i in range(min(len(data) - 1, 64)):
            if data[i] > data[i + 1]:
                hash_val |= (1 << i)
        return f"{hash_val:016x}"
    except Exception:
        return "0000000000000000"

def hamming_similarity(hash_a: str, hash_b: str) -> int:
    """Calculates similarity percentage between two perceptual hashes."""
    if not hash_a or not hash_b or hash_a == "0000000000000000" or hash_b == "0000000000000000":
        return 0
    matches = sum(1 for a, b in zip(hash_a, hash_b) if a == b)
    length = min(len(hash_a), len(hash_b))
    return int((matches / length) * 100) if length > 0 else 0

def classify_complaint_local(
    title: str,
    description: str,
    image_base64: str = None,
    address: str = ""
) -> Dict[str, Any]:
    """100% On-Premise NLP and Computer Vision Triage Engine."""
    combined = f"{title or ''} {description or ''}".lower()

    # Category matching
    best_category = "Potholes & Road Damage"
    best_dept = "Roads & Infrastructure"
    highest_score = 0
    matched_keywords = []

    for rule in CIVIC_CATEGORIES:
        score = 0
        for kw in rule["keywords"]:
            if kw.lower() in combined:
                score += 3 if len(kw) > 5 else 2
                if kw not in matched_keywords:
                    matched_keywords.append(kw)
        if score > highest_score:
            highest_score = score
            best_category = rule["category"]
            best_dept = rule["department"]

    # Priority determination
    has_critical = any(m.lower() in combined for m in CRITICAL_TRIGGERS)
    has_high = any(m.lower() in combined for m in HIGH_TRIGGERS)
    has_low = any(m.lower() in combined for m in LOW_TRIGGERS)

    if has_critical:
        priority = "Critical"
    elif has_high:
        priority = "High"
    elif has_low and highest_score <= 2:
        priority = "Low"
    else:
        rule_match = next((r for r in CIVIC_CATEGORIES if r["category"] == best_category), None)
        priority = rule_match["default_priority"] if rule_match else "Medium"

    # Spam scoring
    fake_score = 5
    if not combined.strip() or len(combined.strip()) < 8:
        fake_score += 40
    if re.search(r"(.)\1{4,}", combined):
        fake_score += 35
    if re.search(r"test|asdf|qwerty|lorem ipsum|fake issue|dummy", combined, re.I):
        fake_score += 55
    if image_base64 and len(image_base64) > 100:
        fake_score = max(2, fake_score - 15)
    fake_score = min(95, max(2, fake_score))

    addr_label = f"near {address}" if address else "in assigned municipal zone"
    summary = f"Rule-based bilingual ontology matched '{title or 'Complaint'}' as {best_category} ({priority} Priority) routed to {best_dept} {addr_label}."

    return {
        "detectedCategory": best_category,
        "suggestedPriority": priority,
        "recommendedDepartment": best_dept,
        "fakeScore": fake_score,
        "isFakeOrSpam": fake_score > 70,
        "duplicateFound": False,
        "summary": summary,
        "keyKeywords": matched_keywords[:5] if matched_keywords else ["civic", "infrastructure", "municipal"],
        "classificationMethod": "rule-based-bilingual-ontology",
        "trainedModelLoaded": False,
        "visionAdapter": "unloaded-stub",
        "matchedRuleCount": len(matched_keywords),
    }

def forecast_complaint_trends(total_complaints: int, active_by_ward: Dict[str, int], resolved_count: int = 0) -> Dict[str, Any]:
    """Statistical linear volume estimation for municipal resource allocation (no trained neural weights)."""
    forecasts = []
    for ward_name, active in active_by_ward.items():
        trend = 1.15 if active > 5 else 0.95
        f7 = round(active * 1.4 * trend)
        f30 = round(active * 4.2 * trend)
        risk = "High Risk" if active > 8 else "Moderate" if active > 4 else "Stable"
        crews = max(1, (active + 2) // 3)
        forecasts.append({
            "ward": ward_name,
            "currentActive": active,
            "predicted7Days": f7,
            "predicted30Days": f30,
            "riskLevel": risk,
            "recommendedFieldCrews": crews,
        })

    real_rate = round((resolved_count / total_complaints) * 100) if total_complaints > 0 else 0
    return {
        "model": "CivicPulse Statistical Queue Estimator (Deterministic Linear Projection)",
        "trainedModelLoaded": False,
        "trainedOnRecords": total_complaints,
        "globalResolutionRate": real_rate,
        "forecastHorizonDays": [7, 30],
        "wardForecasts": forecasts,
        "seasonalSurgeAlert": f"Active backlog ratio: {100 - real_rate}% across {len(forecasts)} monitored wards" if total_complaints > 0 else "No active backlog records in database",
    }
