#!/bin/bash

echo "============================================"
echo "Mogao Digital Twin - Frontend Server"
echo "============================================"
echo ""
echo "Starting local server..."
echo "Server will start at: http://localhost:8002"
echo "Backend API: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop the server"
echo "============================================"
echo ""

cd "$(dirname "$0")"
python3 -m http.server 8002
