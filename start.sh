#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting VilRent Application...${NC}\n"

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)

    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}⚠️  Port $port is in use by process $pid${NC}"
        kill -9 $pid 2>/dev/null
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Successfully killed process on port $port${NC}"
        else
            echo -e "${RED}✗ Failed to kill process on port $port${NC}"
            return 1
        fi
    else
        echo -e "${GREEN}✓ Port $port is available${NC}"
    fi
    return 0
}

# Kill processes on ports 3000 and 8000
echo -e "${BLUE}Checking ports...${NC}"
kill_port 3000
kill_port 8000
echo ""

# Start backend
echo -e "${BLUE}Starting Backend (FastAPI) on port 8000...${NC}"
cd /Users/test/Documents/aruodas/backend
source /Users/test/Documents/aruodas/venv/bin/activate
uvicorn main:app --reload --port 8000 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 2

# Check if backend started successfully
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Backend started successfully (PID: $BACKEND_PID)${NC}"
    echo -e "  ${BLUE}→ http://127.0.0.1:8000${NC}"
else
    echo -e "${RED}✗ Backend failed to start${NC}"
    echo -e "${RED}Check logs: tail -f /tmp/backend.log${NC}"
    exit 1
fi

echo ""

# Start frontend
echo -e "${BLUE}Starting Frontend (Next.js) on port 3000...${NC}"
cd /Users/test/Documents/aruodas/tikrakaina
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait a bit for frontend to start
sleep 3

# Check if frontend started successfully
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Frontend started successfully (PID: $FRONTEND_PID)${NC}"
    echo -e "  ${BLUE}→ http://localhost:3000${NC}"
else
    echo -e "${RED}✗ Frontend failed to start${NC}"
    echo -e "${RED}Check logs: tail -f /tmp/frontend.log${NC}"
    kill -9 $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ All services started successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}Backend:${NC}  http://127.0.0.1:8000"
echo -e "${BLUE}API Docs:${NC} http://127.0.0.1:8000/docs"
echo ""
echo -e "${YELLOW}View logs:${NC}"
echo -e "  Backend:  tail -f /tmp/backend.log"
echo -e "  Frontend: tail -f /tmp/frontend.log"
echo ""
echo -e "${YELLOW}To stop all services:${NC}"
echo -e "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
