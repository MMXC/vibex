#!/bin/bash
# Update Coverage Baseline Script
# 更新覆盖率基线

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "=== Coverage Baseline Update ==="
echo ""

# 运行测试并生成覆盖率报告
echo "Running tests with coverage..."
npm test -- --coverage

# 更新基线
echo ""
echo "Updating baseline..."
node scripts/coverage-diff.js --update-baseline

echo ""
echo "✅ Baseline updated successfully!"
echo "   Path: coverage/baseline.json"
