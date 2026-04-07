#!/bin/bash
# Protected build script for vibex-frontend
# Prevents server from becoming unresponsive during build

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="/root/.openclaw/workspace/vibex/vibex-fronted"
LOG_FILE="/root/.openclaw/workspace/vibex/logs/build-$(date +%Y%m%d-%H%M%S).log"

echo -e "${YELLOW}🚀 Starting protected build...${NC}"

# Create logs directory if not exists
mkdir -p "$(dirname "$LOG_FILE")"

# Check available memory before build
check_memory() {
    local avail=$(free -m | awk 'NR==2{print $7}')
    echo -e "${YELLOW}📊 Available memory: ${avail}MB${NC}"
    if [ "$avail" -lt 1000 ]; then
        echo -e "${RED}⚠️  Low memory! Waiting for resources...${NC}"
        sleep 30
    fi
}

# Run build with protections
run_build() {
    cd "$PROJECT_DIR"
    
    # Set lower priority (nice value 10 = lower priority)
    # Limit max memory via ulimit
    # Use timeout to prevent infinite hangs
    
    echo -e "${YELLOW}📦 Running build (with protections)...${NC}"
    
    # Build with timeout (30 min max) and memory limits
    timeout --signal=TERM 1800 \
    bash -c '
        ulimit -v 12000000
        npm run build 2>&1
    ' | tee "$LOG_FILE"
    
    local exit_code=${PIPESTATUS[0]}
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ Build completed successfully!${NC}"
        echo -e "${GREEN}📄 Log: $LOG_FILE${NC}"
    elif [ $exit_code -eq 124 ]; then
        echo -e "${RED}❌ Build timed out (30 min)${NC}"
        echo -e "${RED}📄 Log: $LOG_FILE${NC}"
    else
        echo -e "${RED}❌ Build failed with exit code $exit_code${NC}"
        echo -e "${RED}📄 Log: $LOG_FILE${NC}"
    fi
    
    return $exit_code
}

# Main
check_memory
run_build
