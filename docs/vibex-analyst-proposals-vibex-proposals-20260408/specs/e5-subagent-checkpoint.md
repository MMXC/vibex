# Spec: Epic E5 — Subagent Checkpoint

## 1. checkpoint.sh 脚本

```bash
#!/bin/bash
# /root/.openclaw/scripts/checkpoint.sh
# 用法: checkpoint.sh <task_id> [data]
# 功能: 将任务状态写入 checkpoint 文件

TASK_ID="$1"
DATA="${2:-$(cat)}"
CHECKPOINT_DIR="/root/.openclaw/checkpoints"
mkdir -p "$CHECKPOINT_DIR"

echo "$DATA" | jq --arg task_id "$TASK_ID" \
  '.task_id = $task_id | .timestamp = now | .updatedAt = now' \
  > "$CHECKPOINT_DIR/$TASK_ID.json"

echo "Checkpoint saved: $CHECKPOINT_DIR/$TASK_ID.json"
```

## 2. 集成方式

子代理在以下时机写入 checkpoint：
- **启动时**: 读取 checkpoint（如存在）恢复状态
- **每 10min**: 定期更新 checkpoint
- **完成时**: 写入 success=true 并删除 checkpoint

## 3. WIP Commit 规范

```bash
# 子代理每 15min 自动执行
git add -A
git commit -m "WIP: $TASK_ID/$(date +%H%M)"

# 任务完成时 squash
git rebase -i HEAD~N  # N = WIP commits 数量
# squash all WIP into final commit
```

## 4. 超时恢复流程

```
1. 子代理超时 → disown
2. Coord 检测到超时（task_manager.py timeout 标记）
3. 新 spawn 相同任务
4. 新子代理启动 → 读取 /root/.openclaw/checkpoints/$task_id.json
5. 恢复 context → 继续执行
```

## 5. 验收标准

```bash
# 脚本存在且可执行
test -x /root/.openclaw/scripts/checkpoint.sh
echo $?  # 0

# checkpoint 写入
./checkpoint.sh test-task '{"status": "in-progress"}'
cat /root/.openclaw/checkpoints/test-task.json | jq .task_id
# 输出: "test-task"

# 恢复读取
./checkpoint.sh test-task | jq .status
# 输出: "in-progress"

# 清理
rm /root/.openclaw/checkpoints/test-task.json
```
