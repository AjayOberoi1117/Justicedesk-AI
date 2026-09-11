#!/bin/bash

echo "🚀 Starting all backend services..."

cd "$(dirname "$0")"

# Install dependencies for each service
echo "📦 Installing dependencies..."
cd services/current && npm install &
cd ../justice-desk && npm install &
cd ../vakeel-sahib && npm install &
cd ../medideals && npm install &
wait

echo "✓ Dependencies installed"

# Start all services
echo "🎬 Starting services..."
cd "$(dirname "$0")/services"

node current/index.js &
CURRENT_PID=$!

node justice-desk/index.js &
JD_PID=$!

node vakeel-sahib/index.js &
VS_PID=$!

node medideals/index.js &
MD_PID=$!

echo ""
echo "✓ All services started:"
echo "  - CURRENT (port 3000): PID $CURRENT_PID"
echo "  - Justice Desk (port 3001): PID $JD_PID"
echo "  - Vakeel Sahib (port 3002): PID $VS_PID"
echo "  - MediDeals (port 3003): PID $MD_PID"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Keep the script running
wait
