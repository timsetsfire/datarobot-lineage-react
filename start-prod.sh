#!/bin/bash

# DataRobot Lineage React App - Production Startup Script
# This script builds the frontend and starts the backend server

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=8080
MCP_PORT=8000
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
    print_status "Shutting down server..."
    
    # Kill backend
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
        print_status "Server stopped"
    fi

    # Kill MCP Server
    if [ ! -z "$MCP_PID" ]; then
        kill $MCP_PID 2>/dev/null
        print_status "MCP Server stopped"
    fi
    
    # Kill any remaining processes on our port
    kill_port $BACKEND_PORT
    kill_port $MCP_PORT
    
    print_success "Cleanup complete. Goodbye! 👋"
    exit 0
}

# Set up signal handlers for cleanup
trap cleanup SIGINT SIGTERM EXIT

# Print banner
echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                DataRobot Lineage React App                  ║"
echo "║                    Production Server                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if we're in the right directory
if [ ! -f "server.js" ] || [ ! -d "client" ]; then
    print_error "Error: Please run this script from the root directory of the project"
    print_info "Expected files: server.js, client/ directory"
    exit 1
fi

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
    read -p "Press Enter to continue after updating .env file..."
fi

# Check and kill existing processes on our port
print_status "Checking port $BACKEND_PORT..."
if check_port $BACKEND_PORT; then
    print_warning "Port $BACKEND_PORT is already in use"
    kill_port $BACKEND_PORT
fi

# Check and kill existing processes on MCP port
print_status "Checking MCP port $MCP_PORT..."
if check_port $MCP_PORT; then
    print_warning "Port $MCP_PORT is already in use"
    kill_port $MCP_PORT
fi

# Install dependencies if needed
print_status "Installing dependencies..."

if [ ! -d "node_modules" ]; then
    print_status "Installing backend dependencies..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    print_status "Installing frontend dependencies..."
    cd client && npm install && cd ..
fi

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

print_success "Dependencies ready"


# Build frontend
print_status "Building frontend for production..."
cd client

# Clean previous build
if [ -d "dist" ]; then
    rm -rf dist
    print_status "Cleaned previous build"
fi


# Run the build
if npm run build; then
    print_success "Frontend build completed successfully"
else
    print_error "Frontend build failed!"
    cd ..
    exit 1
fi

cd ..

# Check if build directory exists
if [ ! -d "client/dist" ]; then
    print_error "Build directory client/dist not found!"
    exit 1
fi

# Start MCP Server
print_status "Starting MCP Server on port $MCP_PORT..."
cd ./mcp_server && uvicorn main:app --port $MCP_PORT &
MCP_PID=$!

# Wait a moment and check if mcp server started successfully
sleep 3
if ! kill -0 $MCP_PID 2>/dev/null; then
    print_error "MCP Server failed to start!"
    exit 1
fi
print_success "MCP server started (PID: $MCP_PID)"


# Start the production server
print_status "Starting production server on port $BACKEND_PORT..."
export NODE_ENV=production
node server.js &
SERVER_PID=$!

# Wait a moment and check if server started successfully
sleep 3
if ! kill -0 $SERVER_PID 2>/dev/null; then
    print_error "Server failed to start!"
    exit 1
fi

print_success "Production server started (PID: $SERVER_PID)"

# Print access information
echo ""
echo -e "${GREEN}🚀 Production server is running!${NC}"
echo ""
echo -e "${CYAN}🌐 Application URL:${NC} http://localhost:$BACKEND_PORT"
echo -e "${CYAN}🔍 API Health Check:${NC} http://localhost:$BACKEND_PORT/auth/check"
echo ""
echo -e "${YELLOW}📁 Serving frontend from:${NC} client/dist/"
echo ""
echo -e "${PURPLE}💡 Tips:${NC}"
echo "   • This serves the built frontend through the backend"
echo "   • For development with hot reload, use ./start-dev.sh instead"
echo "   • Use Ctrl+C to stop the server"
echo ""

# Get network interfaces
NETWORK_IPS=$(hostname -I 2>/dev/null || echo "")
if [ ! -z "$NETWORK_IPS" ]; then
    echo -e "${CYAN}📡 Network access:${NC}"
    for ip in $NETWORK_IPS; do
        echo "   • http://$ip:$BACKEND_PORT"
    done
    echo ""
fi

print_info "Server is running. Press Ctrl+C to stop."

# Wait for the server process
wait $SERVER_PID 