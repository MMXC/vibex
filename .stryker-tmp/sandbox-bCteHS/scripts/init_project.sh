#!/usr/bin/env bash

set -e

PROJECT_ID=${1:-}
PROJECT_GOAL=${2:-}
PROJECT_PATH=${3:-}

if [ -z "$PROJECT_ID" ] || [ -z "$PROJECT_GOAL" ]; then
    echo "用法: $0 <项目ID> \"<项目目标>\" [项目路径]"
    exit 1
fi

# 默认使用当前目录
WORKSPACE=${PROJECT_PATH:-$(pwd)}

# 关键：设置环境变量，让 team-tasks 把 JSON 写入项目目录
export TEAM_TASKS_DIR="$WORKSPACE/team-tasks-data"

# 指向 OpenClaw 安装的技能 CLI
TM="python3 $HOME/.openclaw/skills/team-tasks/scripts/task_manager.py"

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

echo "✅ 项目创建完成: $PROJECT_ID"
echo "📁 数据文件: $TEAM_TASKS_DIR/${PROJECT_ID}.json"
