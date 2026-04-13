#!/bin/bash
#
# qa-server.sh — QA 测试专用：standalone 模式构建并启动 server
#
# 用法:
#   ./scripts/qa-server.sh start   # 构建并启动 server
#   ./scripts/qa-server.sh stop    # 停止 server
#   ./scripts/qa-server.sh status   # 查看状态
#
# 注意: next.config.js 已支持 NEXT_OUTPUT_MODE=standalone
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_FILE="$PROJECT_ROOT/.qa-server.pid"
PORT=3000

cleanup() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 $PID 2>/dev/null; then
      echo "Stopping QA server (PID $PID)..."
      kill "$PID" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
  fi
}

trap cleanup EXIT INT TERM

start_server() {
  echo "Building with standalone mode (NEXT_OUTPUT_MODE=standalone)..."
  cd "$PROJECT_ROOT"
  env NEXT_OUTPUT_MODE=standalone pnpm next build

  echo "Starting standalone server on port $PORT..."
  # Next.js 16 standalone output: .next/standalone/<dirname>/server.js
  SERVER_PATH=$(find .next/standalone -name "server.js" -type f 2>/dev/null | head -1)
  if [ -z "$SERVER_PATH" ]; then
    echo "Error: server.js not found in .next/standalone"
    exit 1
  fi
  echo "Found server at: $SERVER_PATH"
  env NEXT_OUTPUT_MODE=standalone node "$SERVER_PATH" &
  QA_PID=$!
  echo $QA_PID > "$PID_FILE"
  echo "QA server started (PID $QA_PID) on http://localhost:$PORT"

  # 等待 server 就绪
  for i in $(seq 1 30); do
    if curl -sf "http://localhost:$PORT" > /dev/null 2>&1; then
      echo "Server ready!"
      break
    fi
    sleep 1
  done

  echo "Press Ctrl+C to stop..."
  wait $QA_PID
}

stop_server() {
  cleanup
  echo "Server stopped."
}

case "${1:-}" in
  start)
    start_server
    ;;
  stop)
    stop_server
    ;;
  status)
    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      if kill -0 $PID 2>/dev/null; then
        echo "QA server running (PID $PID)"
      else
        echo "PID file exists but process is dead"
        rm -f "$PID_FILE"
      fi
    else
      echo "QA server not running"
    fi
    ;;
  *)
    echo "Usage: $0 {start|stop|status}"
    exit 1
    ;;
esac
