#!/usr/bin/env bash

set -e

PROJECT_ID=${1:-}
PROJECT_GOAL=${2:-}
PROJECT_PATH=${3:-}

if [ -z "$PROJECT_ID" ] || [ -z "$PROJECT_GOAL" ]; then
    echo "用法: $0 <项目ID> \"<项目目标>\" [项目路径]"
    exit 1
fi

# ─── Dedup check (non-blocking) ───────────────────────────────────────────────
# dedup_check.py is called with absolute path below

if [ -f "$HOME/.openclaw/vibex/scripts/dedup_check.py" ]; then
    echo "🔍 调用提案查重 API ..."
    if ! python3 "$HOME/.openclaw/vibex/scripts/dedup_check.py" "$PROJECT_ID" "$PROJECT_GOAL"; then
        dedup_exit=$?
        if [ $dedup_exit -eq 1 ]; then
            echo "❌ 项目创建被查重阻断: $PROJECT_ID"
            exit 1
        fi
        # dedup_exit=2 (warn) — continue with warning
        echo "⚠️  继续创建（查重告警）..."
    fi
else
    echo "⚠️  dedup_check.py not found, skipping dedup check"
fi

# ─── Project creation ────────────────────────────────────────────────────────────
WORKSPACE=${PROJECT_PATH:-$(pwd)}
export TEAM_TASKS_DIR="$WORKSPACE/team-tasks-data"
TM="python3 $HOME/.openclaw/skills/team-tasks/scripts/task_manager.py"

echo ""
echo "正在创建项目 $PROJECT_ID ..."
echo "工作目录: $WORKSPACE"
echo "数据目录: $TEAM_TASKS_DIR"

# 初始化 linear 模式项目
$TM init "$PROJECT_ID" \
    -m linear \
    -g "$PROJECT_GOAL" \
    -w "$WORKSPACE" \
    -p "analyst,architect,dev,tester,reviewer,coord"

# 为每个阶段分配任务
$TM assign "$PROJECT_ID" analyst "分析需求：$PROJECT_GOAL"
$TM assign "$PROJECT_ID" architect "技术方案设计：基于需求分析，产出技术选型方案和架构设计"
$TM assign "$PROJECT_ID" dev "TDD实现：实现功能代码"
$TM assign "$PROJECT_ID" tester "测试验证：编写测试用例，验证功能"
$TM assign "$PROJECT_ID" reviewer "代码审查：审查代码和测试"
$TM assign "$PROJECT_ID" coord "任务合并：协调各阶段工作，进行最终合并"

echo ""
echo "✅ 项目创建完成: $PROJECT_ID"
echo "📁 数据文件: $TEAM_TASKS_DIR/${PROJECT_ID}.json"
