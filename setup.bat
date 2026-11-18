@echo off
setlocal enabledelayedexpansion

echo =====================================================================
echo  CIVICPULSE - ZERO API KEY ^& SELF-MANAGED PLATFORM SETUP
echo =====================================================================
echo.

:: 1. Check Python
echo [1/5] Checking Python installation...
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.10+ from https://www.python.org/
    pause
    exit /b 1
)
python --version

:: 2. Check Node.js
echo.
echo [2/5] Checking Node.js installation...
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)
node --version

:: 3. Configure Local Environment File
echo.
echo [3/5] Setting up environment configuration...
if not exist .env (
    echo Copying .env.example to .env...
    copy .env.example .env >nul
) else (
    echo .env already exists.
)

:: Ensure uploads and data directories exist
if not exist data mkdir data
if not exist uploads mkdir uploads

:: 4. Initialize Local SQLite Database
echo.
echo [4/5] Initializing self-managed SQLite database and seeding 5 roles...
python backend\init_db.py
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Python database init encountered an issue; checking fallback...
)

:: 5. Install Node Dependencies
echo.
echo [5/5] Installing frontend and server dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)

echo.
echo =====================================================================
echo  SETUP COMPLETED SUCCESSFULLY!
echo  No API keys or external accounts required.
echo  Launch CivicPulse by double-clicking 'start.bat'
echo =====================================================================
pause
