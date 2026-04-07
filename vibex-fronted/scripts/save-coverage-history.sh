#!/bin/bash
# Save Coverage History Script
# 保存每日覆盖率到历史记录

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COVERAGE_DIR="$PROJECT_DIR/coverage"
HISTORY_DIR="$PROJECT_DIR/coverage-history"
HISTORY_FILE="$HISTORY_DIR/coverage-history.jsonl"

echo "=== VibeX Coverage History Save ==="

# 运行测试并生成覆盖率报告
echo "Running tests with coverage..."
cd "$PROJECT_DIR"
npm test -- --coverage --silent 2>/dev/null || true

# 检查覆盖率报告是否存在
if [ ! -f "$COVERAGE_DIR/coverage-summary.json" ]; then
    echo "❌ Coverage report not found!"
    exit 1
fi

# 创建历史目录
mkdir -p "$HISTORY_DIR"

# 提取覆盖率数据
LINES=$(node -e "console.log(require('./coverage/coverage-summary.json').total.lines.pct)")
BRANCHES=$(node -e "console.log(require('./coverage/coverage-summary.json').total.branches.pct)")
FUNCTIONS=$(node -e "console.log(require('./coverage/coverage-summary.json').total.functions.pct)")
STATEMENTS=$(node -e "console.log(require('./coverage/coverage-summary.json').total.statements.pct)")

DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%s)

# 创建 JSON 记录
RECORD="{\"date\":\"$DATE\",\"timestamp\":$TIMESTAMP,\"coverage\":{\"lines\":$LINES,\"branches\":$BRANCHES,\"functions\":$FUNCTIONS,\"statements\":$STATEMENTS}}"

# 追加到历史文件
echo "$RECORD" >> "$HISTORY_FILE"

echo "✅ Coverage history saved!"
echo "   Date: $DATE"
echo "   Lines: $LINES%"
echo "   Branches: $BRANCHES%"
echo "   Functions: $FUNCTIONS%"
echo "   Statements: $STATEMENTS%"
echo "   File: $HISTORY_FILE"
