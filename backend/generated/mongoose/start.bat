@echo off
echo ============================================
echo Mogao Digital Twin - Node.js Backend
echo ============================================
echo.

REM ---- CORS configuration ---------------------------------------------------
REM List every origin the frontend may be served from, comma-separated.
REM Inherit CORS_ORIGINS if caller already set it; otherwise use this default.
REM When deploying to a public IP, add it here or set CORS_ORIGINS beforehand.
REM Example deploy host: http://39.97.36.3:8009
if not defined CORS_ORIGINS (
    set "CORS_ORIGINS=http://localhost:8009,http://127.0.0.1:8009,http://39.97.36.3:8009"
)
echo CORS_ORIGINS = %CORS_ORIGINS%
echo.

REM Kill any existing process on port 8008
echo Checking for processes on port 8008...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8008 ^| findstr LISTENING') do (
    echo Killing existing process %%a on port 8008...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Starting Node.js server...
echo Backend will be available at: http://localhost:8008
echo.
echo Press Ctrl+C to stop the server
echo ============================================
echo.

node server.js
