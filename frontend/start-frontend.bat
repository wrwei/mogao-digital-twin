@echo off
echo ============================================
echo Mogao Digital Twin - Frontend Server
echo ============================================
echo.
echo Starting Python HTTP server on port 8000...
echo.
echo Frontend will be available at:
echo   http://localhost:8000
echo   http://127.0.0.1:8000
echo.
echo Press Ctrl+C to stop the server
echo.
python -m http.server 8000
