# CivicPulse — Zero API Key & Self-Managed Smart City Platform

CivicPulse is an enterprise-grade civic issue reporting, automated triage, and municipal resolution platform designed to run **100% locally and independently without requiring any third-party paid API keys, cloud subscriptions, or external service credentials**.

---

## 1. Key Architectural Principles

- **Zero External API Keys**: Absolutely no Gemini, OpenAI, Google Maps, Firebase, or Supabase credentials required.
- **Self-Managed Database**: SQLite auto-initializes on startup with pre-seeded categories, departments, wards, and 5 distinct user roles.
- **Local Machine Learning & Computer Vision**: On-premise visual feature classification, perceptual image difference hashing (pHash) for duplicate detection, and Scikit-Learn regression-style volume forecasting.
- **Local Bilingual NLP Assistant**: 24/7 civic concierge in English and Hindi for real-time ticket lookup (`CIV-2026-XXXX`), filing guides, and SLA matrices.
- **Offline-First & Open Mapping**: Leaflet with OpenStreetMap and offline coordinate grid fallback.
- **One-Click Windows Deployment**: Turnkey batch scripts (`setup.bat`, `start.bat`, `stop.bat`) for instant execution on any PC.

---

## 2. 5 Distinct User Roles & Demo Credentials

All test accounts come pre-seeded with the password: `password123`

| # | Role | Email | Permissions & Scope |
|---|------|-------|---------------------|
| 1 | **Citizen** | `citizen@smartcity.gov` | Report issues, track tickets, receive real-time updates, upvote community reports, submit satisfaction feedback. |
| 2 | **Administrator** | `admin@smartcity.gov` | Municipal operational management, ticket verification, cross-department routing, executive KPI analytics. |
| 3 | **Department Officer** | `roads@smartcity.gov` | Departmental dispatch, officer status management, SLA compliance tracking, work order supervision. |
| 4 | **Field Worker** | `worker@smartcity.gov` | Field response assignment, en-route status updates, resolution evidence and before/after photo submission. |
| 5 | **Super Administrator** | `superadmin@smartcity.gov` | System-wide governance, ward/category configuration, security auditing, broadcast alerts, user provisioning. |

*Quick-login buttons for all 5 roles are available directly within the identity modal.*

---

## 3. Quick Start (Windows One-Click)

1. **Initial Setup (One-Time)**:
   Double-click `setup.bat` or run:
   ```cmd
   setup.bat
   ```
   *This checks Python & Node.js, configures `.env`, initializes SQLite database tables, seeds default data, and installs dependencies.*

2. **Launch Application**:
   Double-click `start.bat` or run:
   ```cmd
   start.bat
   ```
   *The application starts at `http://localhost:3000` and automatically launches your default web browser.*

3. **Stop Application**:
   Double-click `stop.bat` to gracefully terminate all running background processes.

---

## 4. Quick Start (Linux / macOS / Container)

```bash
# 1. Install Node dependencies
npm install

# 2. Initialize self-managed SQLite database
python3 backend/init_db.py

# 3. Configure local environment
cp .env.example .env

# 4. Start local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Technology Stack

### Frontend
- **Framework**: React 19 SPA with TypeScript 5.8
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) with dark/light mode support
- **State & Motion**: Motion (`motion/react`) for accessible transitions
- **Spatial GIS**: Leaflet 1.9 with OpenStreetMap and offline coordinate grid
- **Visualizations**: Recharts 3.10 with accessible data tables
- **Internationalization**: `react-i18next` (English & Hindi)
- **Icons**: Lucide React

### Backend
- **Node.js Server**: Express 4 running full-stack on port 3000 with Vite middleware
- **Python FastAPI Service**: `backend/main.py` with SQLAlchemy and Pydantic
- **Database**: SQLite (`data/civicpulse.db`) + Atomic Document Store (`data/civic_store.json`)
- **Authentication**: Stateless HMAC-SHA256 JWT tokens with role-based access control
- **Storage**: Local filesystem storage in `uploads/` directory

### Artificial Intelligence & Local Analytics
- **Visual Classification**: Local feature extraction, color distribution, and edge analysis
- **Duplicate Detection**: 64-bit perceptual difference hashing (dHash) and geospatial proximity (< 150m)
- **NLP Engine**: Bilingual English & Hindi intent classifier and municipal knowledge base
- **Forecasting**: Scikit-Learn style linear regression predicting 7-day and 30-day ticket volumes

---

## 6. Complaint Resolution State Machine

```
[Submitted]
   │
   ├───► [Verified] ───► [Assigned] ───► [Officer En Route] ───► [Work Started] ───► [Resolved] ───► [Closed]
   │         │               │                                       ▲                  │
   ▼         ▼               ▼                                       │                  ▼
[Rejected] [Rejected]     [Rejected]                            [Reopened]          [Feedback (1-5★)]
```

---

## 7. Automated Testing & Code Quality

CivicPulse includes unit, integration, and security tests:

```bash
# Run test suite
npm test

# Type check
npm run lint

# Production build
npm run build
```
