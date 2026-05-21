@echo off
REM ============================================
REM Mogao Digital Twin — full stack launcher
REM Starts backend (port 8008) and frontend (port 8009)
REM each in its own console window.
REM ============================================

setlocal
set ROOT=%~dp0

echo ============================================
echo Mogao Digital Twin — starting both servers
echo   Backend:  http://localhost:8008
echo   Frontend: http://localhost:8009
echo ============================================
echo.

echo [1/2] Launching backend in a new window...
start "Mogao Backend (8008)" cmd /k "cd /d %ROOT%backend\runtime && call start.bat"

echo [2/2] Launching frontend in a new window...
start "Mogao Frontend (8009)" cmd /k "cd /d %ROOT%frontend && call start.bat"

echo.
echo Both windows should open. Close either window to stop that server.
echo Then open http://localhost:8009 in your browser.
echo.
endlocal
