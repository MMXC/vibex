# AGENTS.md - Subagent Timeout Recovery 开发约束

> **项目**: subagent-timeout-strategy  
> **日期**: 2026-04-05  
> **Agent**: dev, tester, reviewer  
> **范围**: 所有参与 subagent 超时恢复机制开发的 agent

---

## 1. 开发规范

### 1.1 脚本放置规范

| 脚本类型 | 放置路径 | 说明 |
|----------|----------|------|
| 核心脚本 | `/root/.openclaw/scripts/` | 统一放置，所有 agent 可调用 |
| Checkpoint 数据 | `/root/.openclaw/checkpoints/` | JSON 文件，按 project_taskId 命名 |
| 进度文件 | `/root/.openclaw/subagents/<session_id>/` | 每个 subagent 一个目录 |
| 测试脚本 | `/root/.openclaw/vibex/scripts/` | 仅用于测试 |

### 1.2 脚本命名规范

```bash
# 标准命名格式:
subagent-spawn.sh      # 子代理派发（带超时）
checkpoint.sh          # 进度保存
recovery.sh            # 状态恢复
wip-commit.sh          # WIP 自动提交
wip-squash.sh          # WIP squash 清理
subagent-progress-monitor.sh  # 进度监控

# Checkpoint 文件命名:
# /root/.openclaw/checkpoints/<project>_<task_id>.json
# 示例: subagent-timeout-strategy_design-architecture.json
```

### 1.3 脚本编写规范

```bash
# 1. 必须添加 shebang
#!/bin/bash
set -e  # 遇到错误立即退出

# 2. 必须包含 Usage 说明
usage() {
  echo "Usage: $0 <arg1> [arg2]"
  exit 1
}

# 3. 必须记录日志到 stderr
echo "[$(basename $0)] INFO: doing something" >&2
echo "[$(basename $0)] ERROR: something failed" >&2

# 4. 必须处理空参数
if [ -z "$1" ]; then
  usage
fi

# 5. 禁止硬编码路径
# ✅ 正确: CHECKPOINT_DIR="${CHECKPOINT_DIR:-/root/.openclaw/checkpoints}"
# ❌ 错误: CHECKPOINT_DIR="/root/.openclaw/checkpoints"  # 硬编码
```

---

## 2. Git 规范

### 2.1 分支策略

```bash
# WIP commits 在子代理分支
# main 分支保护：不允许直接 push WIP commits

# 分支命名:
# subagent-wip/<project>-<task_id>  # 子代理 WIP 分支
# main                              # 主分支（无 WIP commits）
```

### 2.2 Commit 规范

```bash
# WIP commit 格式:
WIP: <project>/<task_id> - <timestamp>

# 示例:
WIP: subagent-timeout-strategy/design-architecture - 20260405-133000

# Squash commit 格式:
Squashed WIP commits

Squashed 5 WIP commits:
- WIP: subagent-timeout-strategy/design-architecture - 20260405-133000
- WIP: subagent-timeout-strategy/design-architecture - 20260405-133010
...
```

### 2.3 禁止事项

```bash
# ❌ 禁止在 main 分支创建 WIP commits
git checkout main && git commit -m "WIP: ..."  # 禁止

# ❌ 禁止强制推送 WIP commits 到 origin
git push origin --force  # 禁止（会污染远程历史）

# ❌ 禁止在没有 checkpoint 的情况下长时间运行
# 建议每 10 分钟至少执行一次 checkpoint.sh
```

---

## 3. Subagent 执行约束

### 3.1 子代理内必须执行的操作

```bash
# 1. 设置环境变量
export SUBAGENT_PROJECT="<project>"
export SUBAGENT_TASK_ID="<task_id>"
export SUBAGENT_CHECKPOINT_FILE="/root/.openclaw/checkpoints/${PROJECT}_${TASK_ID}.json"
export SUBAGENT_WORKDIR="<workdir>"

# 2. 任务开始时创建 checkpoint
bash /root/.openclaw/scripts/checkpoint.sh start "任务开始"

# 3. 每个关键步骤后保存 checkpoint
bash /root/.openclaw/scripts/checkpoint.sh step_1 "完成第一步"
bash /root/.openclaw/scripts/checkpoint.sh step_2 "完成第二步"

# 4. 每 10 分钟自动 WIP commit
# 在 crontab 或 loop 中:
bash /root/.openclaw/scripts/wip-commit.sh

# 5. 任务完成时 squash WIP commits
bash /root/.openclaw/scripts/wip-squash.sh main
```

### 3.2 父会话（Coord）约束

```bash
# 1. 派发时必须设置超时
sessions_spawn \
  --runTimeoutSeconds 1800 \  # 必须设置
  --cleanup delete \           # 完成后清理 session
  ...

# 2. 监控进度文件
cat /root/.openclaw/subagents/<session_id>/.subagent_progress

# 3. 超时后检查 checkpoint
ls -la /root/.openclaw/checkpoints/<project>_<task_id>.json

# 4. 恢复时使用 recovery.sh
bash /root/.openclaw/scripts/recovery.sh /root/.openclaw/checkpoints/<project>_<task_id>.json
```

---

## 4. 测试规范

### 4.1 必须覆盖的场景

| 场景 | 测试命令 | 验收标准 |
|------|----------|----------|
| checkpoint 创建 | `checkpoint.sh step1 "test"` | `test -f checkpoint.json` |
| checkpoint 格式 | `cat checkpoint.json \| python3 -m json.tool` | 无 JSON 解析错误 |
| recovery 恢复 | `recovery.sh checkpoint.json` | `git status` 无未提交 |
| WIP commit | `wip-commit.sh` | `git log --grep="WIP:"` 有记录 |
| WIP squash | `wip-squash.sh main` | `git log main --grep="WIP:"` 无记录 |
| 进度文件 | `cat .subagent_progress` | 包含 percentComplete |

### 4.2 集成测试

```bash
# 测试脚本: /root/.openclaw/vibex/scripts/test-subagent-timeout.sh

#!/bin/bash
set -e

TEST_DIR="/tmp/subagent-timeout-test-$(date +%s)"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# 初始化测试 repo
git init
git config user.email "test@test.com"
git config user.name "Test"

# 测试 1: checkpoint.sh
export SUBAGENT_CHECKPOINT_FILE="$TEST_DIR/checkpoint.json"
bash /root/.openclaw/scripts/checkpoint.sh init "初始化"
test -f "$CHECKPOINT_FILE" || exit 1

# 测试 2: wip-commit.sh
echo "test content" > test.txt
export SUBAGENT_PROJECT="test"
export SUBAGENT_TASK_ID="test_task"
bash /root/.openclaw/scripts/wip-commit.sh
git log --oneline | grep -q "WIP:" || exit 1

# 测试 3: recovery.sh + wip-squash.sh
bash /root/.openclaw/scripts/wip-squash.sh main
git log main --oneline | grep -q "Squashed" || exit 1

# 清理
cd /
rm -rf "$TEST_DIR"

echo "[TEST] All tests passed"
```

---

## 5. 性能约束

| 指标 | 上限 | 说明 |
|------|------|------|
| checkpoint 单次执行时间 | < 100ms | 不影响子代理主流程 |
| wip-commit 单次执行时间 | < 500ms | 包含 git add + commit |
| 存储空间（单任务） | < 100KB | checkpoint + WIP commits |
| checkpoint 文件大小 | < 10KB | JSON 格式，无冗余 |

---

## 6. 安全约束

```bash
# ❌ 禁止在 checkpoint 中记录敏感信息
# 允许: project, taskId, gitBranch, lastCommit, steps
# 禁止: API keys, passwords, tokens, personal info

# ❌ 禁止 checkpoint 目录777权限
chmod 755 /root/.openclaw/checkpoints  # 正确
chmod 777 /root/.openclaw/checkpoints  # 禁止

# ❌ 禁止 git push 在非测试环境
# 只允许在 /tmp 测试目录中测试 git 操作
```

---

## 7. 监控与告警

### 7.1 必须监控的指标

| 指标 | 告警阈值 | 处理方式 |
|------|----------|----------|
| checkpoint 超过 30 分钟未更新 | 30min 无新 checkpoint | 检查 subagent 状态 |
| recovery 失败 | exit code != 0 | 人工介入 |
| WIP commits 超过 10 个未 squash | 10+ WIP commits | 立即执行 wip-squash |
| 进度文件超过 5 分钟未更新 | 5min 无心跳 | 触发超时检测 |

### 7.2 日志规范

```bash
# 所有脚本输出格式:
# [SCRIPT_NAME] LEVEL: message

# 示例:
[checkpoint] INFO: Saving checkpoint to /root/.openclaw/checkpoints/test.json
[checkpoint] WARN: Checkpoint file not found, creating new
[checkpoint] ERROR: Failed to write checkpoint: permission denied

# 日志级别:
# INFO:  正常操作信息
# WARN:  可恢复的错误，继续执行
# ERROR: 不可恢复的错误，退出
```

---

## 8. 文档要求

### 8.1 必须维护的文档

| 文档 | 位置 | 更新时机 |
|------|------|----------|
| architecture.md | docs/proposals/20260405-1321/ | 架构变更时 |
| IMPLEMENTATION_PLAN.md | docs/proposals/20260405-1321/ | 实施前 |
| AGENTS.md | docs/proposals/20260405-1321/ | 开发约束变更时 |
| Checkpoint 模板 | scripts/checkpoint.sh (注释) | 脚本修改时 |

### 8.2 README 要求

```bash
# /root/.openclaw/scripts/README.md 必须包含:

# Subagent Timeout Recovery Scripts

## 快速开始
1. 派发: `bash subagent-spawn.sh "<task>" 1800 project task_id`
2. checkpoint: `bash checkpoint.sh <step_id> [description]`
3. 恢复: `bash recovery.sh <checkpoint_file>`
4. WIP commit: `bash wip-commit.sh`
5. Squash: `bash wip-squash.sh main`

## 目录结构
/root/.openclaw/scripts/       # 核心脚本
/root/.openclaw/checkpoints/   # Checkpoint 数据
/root/.openclaw/subagents/     # 进度文件

## 注意事项
- 所有脚本必须在 /root/.openclaw/scripts/ 中
- checkpoint 文件按 project_taskId 命名
- WIP commits 只在子代理分支，禁止 push 到 origin
```

---

*本文档由 Architect Agent 生成 | 2026-04-05*
