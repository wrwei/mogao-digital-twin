#!/usr/bin/env bash
# ============================================
# Mogao Digital Twin — full stack launcher (bash)
# Starts backend (port 8008) and frontend (port 8009)
# in the background. Ctrl+C stops both.
# ============================================

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "============================================"
echo "Mogao Digital Twin — starting both servers"
echo "  Backend:  http://localhost:8008"
echo "  Frontend: http://localhost:8009"
echo "============================================"
echo

# Kill anything already listening on these ports
kill_port() {
    local port=$1
    local pids
    # Try lsof first; fall back to netstat for Git Bash on Windows
    if command -v lsof >/dev/null 2>&1; then
        pids=$(lsof -ti :"$port" 2>/dev/null || true)
    else
        pids=$(netstat -ano 2>/dev/null | awk -v p=":$port" '$2 ~ p && $4 == "LISTENING" { print $5 }' | sort -u)
    fi
    if [ -n "$pids" ]; then
        echo "Killing existing process(es) on port $port: $pids"
        for pid in $pids; do
            if command -v taskkill >/dev/null 2>&1; then
                taskkill //F //PID "$pid" >/dev/null 2>&1 || true
            else
                kill -9 "$pid" 2>/dev/null || true
            fi
        done
    fi
}

kill_port 8008
kill_port 8009

# Start backend
echo "[1/2] Starting backend..."
( cd "$ROOT/backend/runtime" && npm start ) &
BACKEND_PID=$!

# Start frontend
echo "[2/2] Starting frontend..."
( cd "$ROOT/frontend" && python -m http.server 8009 ) &
FRONTEND_PID=$!

cleanup() {
    echo
    echo "Shutting down servers..."
    kill "$BACKEND_PID" 2>/dev/null || true
    kill "$FRONTEND_PID" 2>/dev/null || true
    wait 2>/dev/null || true
    exit 0
}
trap cleanup INT TERM

echo
echo "Both servers running. Open http://localhost:8009 in your browser."
echo "Press Ctrl+C to stop both."
echo

wait
