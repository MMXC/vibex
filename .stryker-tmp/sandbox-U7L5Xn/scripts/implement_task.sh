#!/usr/bin/env bash

set -e

PROJECT_ID=${1:-}
TASK_GOAL=${2:-}
PROJECT_PATH=${3:-}

if [ -z "$PROJECT_ID" ] || [ -z "$TASK_GOAL" ]; then
    echo "用法: $0 <任务ID> \"<任务目标>\" [项目路径]"
    exit 1
fi

# 默认使用当前目录
WORKSPACE=${PROJECT_PATH:-$(pwd)}

export TEAM_TASKS_DIR="$WORKSPACE/team-tasks-data"
TM="python3 $HOME/.openclaw/skills/team-tasks/scripts/task_manager.py"

echo "正在创建功能任务 $PROJECT_ID ..."

$TM init "$PROJECT_ID" -m linear -g "$TASK_GOAL" \
    -w "$WORKSPACE" \
    -p "analyst,architect,dev,tester,reviewer,coord"

$TM assign "$PROJECT_ID" analyst "分析需求：$TASK_GOAL"
$TM assign "$PROJECT_ID" architect "技术方案设计：基于需求分析"
$TM assign "$PROJECT_ID" dev "TDD实现：实现功能代码"
$TM assign "$PROJECT_ID" tester "测试验证：编写测试用例"
$TM assign "$PROJECT_ID" reviewer "代码审查：审查代码和测试"
$TM assign "$PROJECT_ID" coord "任务合并：协调各阶段工作"

echo "✅ 功能任务创建完成: $PROJECT_ID"
