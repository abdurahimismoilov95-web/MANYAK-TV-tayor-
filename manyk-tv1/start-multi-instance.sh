#!/bin/bash
# Multi-Instance Node.js Server Startup Script
# Har xil portlarda bir nechta instance ishga tushiradi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 MANYAK TV Multi-Instance Startup${NC}"
echo "======================================"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 not found. Installing...${NC}"
    npm install -g pm2
fi

# Stop existing instances
echo -e "${YELLOW}⏹️  Stopping existing instances...${NC}"
pm2 delete manyak-tv-* 2>/dev/null || true

# Build frontend
echo -e "${YELLOW}🔨 Building frontend...${NC}"
npm run build

# Start multiple instances on different ports
echo -e "${GREEN}🚀 Starting instances...${NC}"

PORT=3000 pm2 start server.js --name "manyak-tv-3000" -- --port 3000
PORT=3001 pm2 start server.js --name "manyak-tv-3001" -- --port 3001
PORT=3002 pm2 start server.js --name "manyak-tv-3002" -- --port 3002
PORT=3003 pm2 start server.js --name "manyak-tv-3003" -- --port 3003

# Save PM2 configuration
pm2 save

# Setup PM2 startup script (auto-start on boot)
pm2 startup

# Show status
echo -e "${GREEN}✅ Instances started!${NC}"
pm2 list

echo ""
echo -e "${GREEN}📊 Monitoring:${NC}"
echo "  pm2 monit              - Real-time monitoring"
echo "  pm2 logs               - View logs"
echo "  pm2 restart all        - Restart all instances"
echo "  pm2 reload all         - Zero-downtime reload"
echo "  pm2 stop all           - Stop all instances"
echo ""
echo -e "${YELLOW}⚠️  Configure Nginx to point to these ports!${NC}"
