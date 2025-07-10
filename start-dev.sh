#!/bin/bash

# DataRobot Lineage React App - Development Startup Script
# This script starts both the backend server and frontend development server

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
MCP_PORT=8000
BACKEND_PORT=8080
FRONTEND_PORT=5173
LOG_DIR="./logs"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
MCP_LOG="$LOG_DIR/mcp.log"

ENV_DIR=".venv"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️${NC} $1"
}

print_info() {
    echo -e "${CYAN}[$(date +'%H:%M:%S')] ℹ️${NC} $1"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port)
    if [ ! -z "$pids" ]; then
        print_warning "Killing existing processes on port $port"
        kill -9 $pids 2>/dev/null
        sleep 2
    fi
}

# Function to cleanup on script exit
cleanup() {
    print_status "Shutting down servers..."
    
    # Kill backend
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        print_status "Backend server stopped"
    fi
    
    # Kill frontend
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        print_status "Frontend server stopped"
    fi

    # Kill mcp server
    if [ ! -z "$MCP_PID" ]; then
        kill $MCP_PID 2>/dev/null
        print_status "MCP server stopped"
    fi
    
    
    # Kill any remaining processes on our ports
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT
    kill_port $MCP_PORT
    
    print_success "Cleanup complete. Goodbye! 👋"
    exit 0
}

# Set up signal handlers for cleanup
trap cleanup SIGINT SIGTERM EXIT

# Print banner
echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                DataRobot Lineage React App                   ║"
echo "║                    Development Server                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if we're in the right directory
if [ ! -f "server.js" ] || [ ! -d "client" ]; then
    print_error "Error: Please run this script from the root directory of the project"
    print_info "Expected files: server.js, client/ directory"
    exit 1
fi

# Create logs directory
mkdir -p "$LOG_DIR"

# Check Node.js and npm
print_status "Checking dependencies..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "Node.js $(node --version) and npm $(npm --version) found"

# Check for .env file
if [ ! -f ".env" ]; then
    print_warning "No .env file found. Creating a template..."
    cat > .env << EOF
# DataRobot API Configuration
DATAROBOT_ENDPOINT=https://app.datarobot.com/api/v2
DATAROBOT_API_TOKEN=your-api-token-here

# Server Configuration
PORT=8080

# Neo4j Configuration (optional - only needed for chat functionality)
NEO4J_URL=your-neo4j-url-here
NEO4J_PASSWORD=your-neo4j-password-here
EOF
    print_info "Please update the .env file with your DataRobot credentials"
fi

# Check and kill existing processes on our ports
print_status "Checking ports..."
if check_port $BACKEND_PORT; then
    print_warning "Port $BACKEND_PORT is already in use"
    kill_port $BACKEND_PORT
fi

if check_port $FRONTEND_PORT; then
    print_warning "Port $FRONTEND_PORT is already in use"
    kill_port $FRONTEND_PORT
fi

if check_port $MCP_PORT; then
    print_warning "Port $MCP_PORT is already in use"
    kill_port $MCP_PORT
fi

# Install dependencies if needed
print_status "Checking dependencies..."

if [ ! -d "node_modules" ]; then
    print_status "Installing backend dependencies..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    print_status "Installing frontend dependencies..."
    cd client && npm install && cd ..
fi

print_success "Dependencies ready"


# create python virtual environment for mcp server 
# Check if virtual environment already exists
if [ -d "$ENV_DIR" ]; then
    print_status "Virtual environment '${ENV_DIR}' already exists."
    print_status "Activating virtual environment..."
    # shellcheck source=/dev/null
    source "${ENV_DIR}/bin/activate"
else
    print_status "Creating virtual environment in ./${ENV_DIR}"
    python3 -m venv "$ENV_DIR"
    # Activate the virtual environment
    print_status "Activating virtual environment..."
    # shellcheck source=/dev/null
    source "${ENV_DIR}/bin/activate"
    # Install requirements
    print_status "Installing requirements from requirements.txt..."
    pip install --upgrade pip
    pip install -r ./mcp_server/requirements.txt
    print_success "Environment setup complete."
fi



# Start MCP Server
print_status "Starting MCP Server on port $MCP_PORT..."
cd ./mcp_server && uvicorn main:app --port $MCP_PORT > "../$MCP_LOG" 2>&1 &
MCP_PID=$!

# Wait a moment and check if mcp server started successfully
sleep 3
if ! kill -0 $MCP_PID 2>/dev/null; then
    print_error "MCP server failed to start. Check $MCP_LOG for details:"
    tail -10 "$MCP_LOG"
    exit 1
fi
print_success "MCP server started (PID: $MCP_PID)"

# Start backend server
print_status "Starting backend server on port $BACKEND_PORT..."
node server.js > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

# Wait a moment and check if backend started successfully
sleep 3
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    print_error "Backend server failed to start. Check $BACKEND_LOG for details:"
    tail -10 "$BACKEND_LOG"
    exit 1
fi

print_success "Backend server started (PID: $BACKEND_PID)"

# Start frontend dev server
print_status "Starting frontend development server on port $FRONTEND_PORT..."
cd client
npm run dev > "../$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a moment and check if frontend started successfully
sleep 5
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    print_error "Frontend server failed to start. Check $FRONTEND_LOG for details:"
    tail -10 "$FRONTEND_LOG"
    cleanup
    exit 1
fi

print_success "Frontend development server started (PID: $FRONTEND_PID)"

# Print access information
echo ""
echo -e "${GREEN}🚀 Both servers are running!${NC}"
echo ""
echo -e "${CYAN}📱 Frontend (Development):${NC} http://localhost:$FRONTEND_PORT"
echo -e "${CYAN}🖥️  Backend API:${NC}           http://localhost:$BACKEND_PORT"
echo -e "${CYAN}🔍 API Health Check:${NC}       http://localhost:$BACKEND_PORT/auth/check"
echo ""
echo -e "${YELLOW}📁 Logs:${NC}"
echo -e "   Backend:  $BACKEND_LOG"
echo -e "   Frontend: $FRONTEND_LOG"
echo ""
echo -e "${PURPLE}💡 Tips:${NC}"
echo "   • The frontend has hot reload - changes will auto-refresh"
echo "   • Backend changes require restart (Ctrl+C then run again)"
echo "   • Use Ctrl+C to stop both servers"
echo ""

# Function to tail logs in a nice format
show_logs() {
    echo -e "${BLUE}=== Backend Logs ===${NC}"
    tail -f "$BACKEND_LOG" | sed 's/^/[BACKEND] /' &
    BACKEND_TAIL_PID=$!
    
    echo -e "${BLUE}=== Frontend Logs ===${NC}"
    tail -f "$FRONTEND_LOG" | sed 's/^/[FRONTEND] /' &
    FRONTEND_TAIL_PID=$!
}

# Wait for user input
print_info "Press 'l' to show live logs, 'q' to quit, or Ctrl+C to stop servers"

while true; do
    read -t 1 -n 1 key
    if [ $? = 0 ]; then
        case $key in
            l|L)
                clear
                echo -e "${CYAN}📋 Live logs (Ctrl+C to return to menu):${NC}"
                show_logs
                # Wait for Ctrl+C
                trap 'kill $BACKEND_TAIL_PID $FRONTEND_TAIL_PID 2>/dev/null; echo ""; print_info "Logs stopped. Press q to quit or l to show logs again"' SIGINT
                wait
                trap cleanup SIGINT SIGTERM EXIT
                ;;
            q|Q)
                cleanup
                ;;
        esac
    fi
    
    # Check if processes are still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        print_error "Backend server died unexpectedly!"
        print_info "Check logs: tail $BACKEND_LOG"
        cleanup
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        print_error "Frontend server died unexpectedly!"
        print_info "Check logs: tail $FRONTEND_LOG"
        cleanup
    fi
done 