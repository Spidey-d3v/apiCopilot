#!/bin/bash
# Enterprise API Copilot All-in-One Startup Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Starting Enterprise API Copilot ==="

# 1. Start Backend
echo "Starting Backend (port 8003)..."
cd "$ROOT_DIR/backend"
if [ -d "venv" ]; then
    source venv/bin/activate
fi
uvicorn app.main:app --host 0.0.0.0 --port 8003 &
BACKEND_PID=$!

# 2. Start Frontend
echo "Starting Frontend (port 3000)..."
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo "=== Enterprise API Copilot Running ==="
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8003"
echo "API Docs: http://localhost:8003/docs"

wait $BACKEND_PID $FRONTEND_PID
