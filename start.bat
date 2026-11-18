@echo off
setlocal enabledelayedexpansion

echo =====================================================================
echo  CIVICPULSE - SMART CITY CIVIC ISSUE RESOLUTION SYSTEM
echo  Zero API Keys Required • 100%% Local Self-Managed Architecture
echo =====================================================================
echo.

:: Ensure SQLite DB is initialized
if not exist "data\civicpulse.db" (
    echo Database not found. Initializing local database...
    python backend\init_db.py
)

:: Ensure uploads directory exists
if not exist "uploads" mkdir uploads

echo.
echo =====================================================================
echo  PRE-SEEDED DEMO CREDENTIALS (All passwords: password123)
echo =====================================================================
echo  1. Citizen:            citizen@smartcity.gov
echo  2. Administrator:      admin@smartcity.gov
echo  3. Department Officer: roads@smartcity.gov
echo  4. Field Worker:       worker@smartcity.gov
echo  5. Super Admin:        superadmin@smartcity.gov
echo =====================================================================
echo.
echo Starting CivicPulse server on port 3000...
echo Application URL: http://localhost:3000
echo.

:: Launch browser after 2 seconds in background
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"

:: Start the application
npm run dev
pause
