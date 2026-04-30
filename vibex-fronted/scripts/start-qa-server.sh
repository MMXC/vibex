#!/bin/bash
cd /root/.openclaw/vibex/vibex-fronted
PORT=3000 node .next/standalone/server.js &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"
sleep 3
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
echo ""
