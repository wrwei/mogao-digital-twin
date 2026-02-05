@echo off
echo ============================================
echo Mogao Digital Twin - Backend Server
echo ============================================
echo.
echo Starting Micronaut server on port 8080...
echo.
call mvn compile exec:java

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Backend server failed to start!
    pause
    exit /b 1
)
