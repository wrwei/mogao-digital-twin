@echo off
echo ============================================
echo Starting Mogao Digital Twin Frontend
echo ============================================
echo.

REM Kill any existing process on port 8009
echo Checking for processes on port 8009...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8009 ^| findstr LISTENING') do (
    echo Killing existing process %%a on port 8009...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Starting Python HTTP Server...
echo Frontend will be available at: http://localhost:8009
echo.
echo Open your browser and navigate to: http://localhost:8009
echo Press Ctrl+C to stop the server
echo ============================================
echo.

python -m http.server 8009
