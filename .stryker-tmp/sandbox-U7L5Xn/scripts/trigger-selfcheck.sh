#!/bin/bash
# trigger-selfcheck.sh — 触发每日自检流程
# Cron: 0 6 * * * cd /root/.openclaw/vibex && bash scripts/trigger-selfcheck.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VIBEX_DIR="$(dirname "$SCRIPT_DIR")"

cd "$VIBEX_DIR"

DATE="$(date +%Y%m%d)"
DATE_DISPLAY="$(date +%Y-%m-%d)"

echo "=== 每日自检触发: $DATE_DISPLAY ==="

# 1. 验证 self-check 文档格式
echo ""
echo "[1/4] 验证 self-check 文档格式..."
VALIDATED=0
FAILED=0

# 搜索多种目录命名模式
for doc in \
    "docs/agent-self-evolution-${DATE}-daily"/*-selfcheck*.md \
    "docs/agent-self-evolution-${DATE}-daily"/*-self-assessment*.md \
    "docs/agent-self-evolution-${DATE}"/*-selfcheck*.md \
    "docs/agent-self-evolution-${DATE}"/*-self-assessment*.md; do
    if [ -f "$doc" ]; then
        echo "  验证: $doc"
        # 验证器 exit 0 = 通过, exit 1 = 失败, exit 2 = 使用错误
        python3 "$SCRIPT_DIR/selfcheck_validator.py" "$doc" > /dev/null 2>&1; result=$?
        if [ $result -eq 0 ]; then
            VALIDATED=$((VALIDATED + 1))
            echo "  ✅ $doc"
        elif [ $result -eq 1 ]; then
            echo "  ❌ 验证失败: $doc"
            python3 "$SCRIPT_DIR/selfcheck_validator.py" "$doc" || true
            FAILED=$((FAILED + 1))
        fi
        # result=2 (usage error) → 忽略，继续
    fi
done

echo "  结果: $VALIDATED 通过, $FAILED 失败"

# 2. 收集 actionable 建议
echo ""
echo "[2/4] 收集 [ACTIONABLE] 建议..."
python3 "$SCRIPT_DIR/actionable-collector.py" docs "$DATE_DISPLAY" || {
    echo "  ⚠️  收集失败，继续执行"
}

# 3. 生成每日报告
echo ""
echo "[3/4] 生成每日报告..."
python3 "$SCRIPT_DIR/daily-report.py" "$DATE" || {
    echo "  ⚠️  报告生成失败，继续执行"
}

# 4. Zombie 告警检查
echo ""
echo "[4/4] Zombie 任务检测..."
python3 "$SCRIPT_DIR/zombie-alert.py" --dry-run || {
    echo "  ⚠️  Zombie 检测失败，继续执行"
}

echo ""
echo "=== 自检完成: $DATE_DISPLAY ==="
echo "📋 报告: docs/daily-reports/${DATE}.md"
echo "📋 建议: proposals/${DATE}/actionable-suggestions.json"
