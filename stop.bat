@echo off
echo =====================================================================
echo  STOPPING CIVICPULSE SERVICES
echo =====================================================================
echo.

echo Terminating running CivicPulse processes on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Terminating PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo Stopping any background node.exe or python.exe servers...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq CivicPulse*" >nul 2>&1
taskkill /F /IM uvicorn.exe >nul 2>&1

echo.
echo =====================================================================
echo  CIVICPULSE SERVICES STOPPED CLEANLY.
echo =====================================================================
timeout /t 2 /nobreak >nul
