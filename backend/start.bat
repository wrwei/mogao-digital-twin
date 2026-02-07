@echo off
echo ============================================
echo Starting Mogao Digital Twin Backend
echo ============================================
echo.

REM Kill any existing process on port 8080
echo Checking for processes on port 8080...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
    echo Killing existing process %%a on port 8080...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Compiling and starting Micronaut application...
echo Backend will be available at: http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo ============================================
echo.

mvn clean compile mn:run
