# Implementation Plan: fix-epic1-topic-tracking

**Agent**: Architect  
**日期**: 2026-03-25  
**项目**: fix-epic1-topic-tracking  
**Dev**: Dev Agent  
**基于**: architecture.md

---

## 1. 实施概览

| 项目 | 内容 |
|------|------|
| 总工时 | 约 1.5h |
| 阶段数 | 2（Phase 1: Epic 1+2+3, Phase 2: Epic 4 验证） |
| 风险等级 | 低（纯错误处理增强，无破坏性改动） |

---

## 2. Phase 1: 核心修复（Epic 1 + Epic 2 + Epic 3）

**目标**: 修复静默失败 + 添加降级机制 + analyst 支持

### 2.1 Epic 1: 失败告警机制

**改动文件**: `/root/.openclaw/scripts/heartbeats/common.sh`

#### 步骤 1: 重构 `create_thread_and_save`

**当前代码（问题代码）**:
```bash
result=$(openclaw message send ... 2>&1) || true

msg_id=$(echo "$result" | grep -oP "om_[a-zA-Z0-9]+" | tail -1)
if [ -z "$msg_id" ]; then
    msg_id=$(echo "$result" | grep -oP '"message_id"\s*:\s*"\K[^"]+' | head -1)
fi
if [ -z "$msg_id" ]; then
    msg_id=$(echo "$result" | grep -oP '"msg_id"\s*:\s*"\K[^"]+' | head -1)
fi
```

**修复后代码**:
```bash
# 发送消息（不静默吞掉错误）
local result
result=$(openclaw message send --channel feishu --account "$agent" --target "$channel" --message "$message" 2>&1)
local exit_code=$?

# 检查 exit code
if [ $exit_code -ne 0 ]; then
    echo "⚠️ 飞书消息发送失败 (exit $exit_code)" >&2
    echo "⚠️ 错误详情: $result" >&2
    # 降级路径（不返回，继续尝试普通消息）
    _degrade_to_normal_message "$project" "$task" "$channel" "$message"
    return 0  # 降级成功，不阻塞心跳流程
fi

# 提取消息 ID
local msg_id
msg_id=$(echo "$result" | grep -oP "om_[a-zA-Z0-9]+" | tail -1)
if [ -z "$msg_id" ]; then
    msg_id=$(echo "$result" | grep -oP '"message_id"\s*:\s*"\K[^"]+' | head -1)
fi
if [ -z "$msg_id" ]; then
    msg_id=$(echo "$result" | grep -oP '"msg_id"\s*:\s*"\K[^"]+' | head -1)
fi

if [ -n "$msg_id" ]; then
    save_task_thread_id "$project" "$task" "$msg_id"
    echo "$msg_id"
    return 0
else
    echo "⚠️ 无法从响应中提取消息 ID，降级为普通消息" >&2
    echo "⚠️ 响应: $result" >&2
    _degrade_to_normal_message "$project" "$task" "$channel" "$message"
    return 0
fi
```

#### 步骤 2: 添加降级辅助函数

在 `create_thread_and_save` 之前添加:

```bash
# 降级到普通消息发送（不创建话题，不保存 thread_id）
_degrade_to_normal_message() {
    local project="$1"; local task="$2"; local channel="$3"; local message="$4"
    echo "⚠️ 话题创建失败，降级为普通消息" >&2
    openclaw message send --channel feishu --account "$agent" --target "$channel" --message "$message" 2>&1 | grep -q "Sent" \
        && echo "✅ 降级消息发送成功" >&2 \
        || echo "❌ 降级消息发送也失败" >&2
}
```

### 2.2 Epic 2: 降级机制（`feishu_self_notify`）

**改动文件**: `/root/.openclaw/scripts/heartbeats/common.sh`

#### 步骤 3: 增强 `feishu_self_notify` 的错误处理

在 `feishu_self_notify` 中，消息发送后添加:

```bash
# 当前代码: 发送消息
if [ -n "$thread_id" ]; then
    result=$(openclaw message send --reply-to "$thread_id" ... 2>&1)
else
    result=$(openclaw message send ... 2>&1)
fi

# 添加: 检查发送是否成功
if echo "$result" | grep -qE "error|Error|failed|Failed|not in chat"; then
    echo "⚠️ 飞书消息发送失败" >&2
    echo "⚠️ 详情: $result" >&2
fi

# 当前代码: 提取 msg_id
msg_id=$(echo "$result" | grep -oP "om_[a-zA-Z0-9]+" | tail -1)
# ... 其他提取逻辑 ...

# 添加: 如果 msg_id 为空但 project/task 存在，发送降级通知
if [ -z "$msg_id" ] && [ -n "$project" ] && [ -n "$task" ]; then
    echo "⚠️ 无法提取 msg_id，跳过保存（话题追踪将在下次成功时生效）" >&2
fi
```

### 2.3 Epic 3: analyst 话题追踪 (P2)

**改动文件**: `/root/.openclaw/scripts/heartbeats/analyst-heartbeat.sh`

#### 步骤 4: analyst-heartbeat.sh 添加话题追踪

在任务领取后（参考 dev-heartbeat.sh:67-71），添加:

```bash
# 创建飞书话题并保存 thread ID
channel=$(get_channel)
if [ -n "$channel" ]; then
    create_thread_and_save "$project" "$task" "$channel" "[Analyst] 📋 阶段任务报告 — $project/$task" 2>/dev/null || true
    echo "🧵 话题已创建并保存"
fi
```

在阶段报告发送部分:

```bash
# 发送阶段任务报告到话题
feishu_self_notify "$phase_file" "$project" "$task"
```

---

## 3. Phase 2: 验证与测试

**目标**: 确保修复后功能可验证

### 3.1 手动验证清单

| # | 场景 | 验证方法 | 预期结果 |
|---|------|----------|---------|
| V1 | `openclaw` 返回成功 + `om_xxx` | Mock 测试 | msg_id 提取成功，保存到 HEARTBEAT.md |
| V2 | `openclaw` 返回 "Bot not in chat" | Mock 测试 | exit 1，输出 ⚠️ 告警，降级消息发送 |
| V3 | `openclaw` 返回成功但无 `om_xxx` | Mock 测试 | ⚠️ 无法提取 msg_id，降级消息发送 |
| V4 | dev 心跳正常运行 | 实际执行 | 任务领取后创建话题成功 |
| V5 | analyst 心跳正常运行 | 实际执行 | 无报错，话题追踪已激活 |

### 3.2 Mock 测试脚本

创建测试文件: `/root/.openclaw/scripts/heartbeats/test-topic-tracking.sh`

```bash
#!/bin/bash
set -e

# Mock openclaw: 模拟成功响应
mock_success() {
    echo "✅ Sent: om_1234567890abcdef"
}
export -f mock_success

# Mock openclaw: 模拟 Bot 不在群组
mock_bot_not_in_chat() {
    echo "❌ Error: Bot can NOT be out of the chat"
    return 1
}
export -f mock_bot_not_in_chat

# 测试函数
test_create_thread_success() { ... }
test_create_thread_fail_bot_not_in_chat() { ... }
test_create_thread_no_msg_id() { ... }

# 执行测试
echo "=== Running Topic Tracking Tests ==="
test_create_thread_success
test_create_thread_fail_bot_not_in_chat
test_create_thread_no_msg_id
echo "=== All tests passed ==="
```

---

## 4. 改动文件清单

| 文件 | 操作 | 改动行数 |
|------|------|---------|
| `/root/.openclaw/scripts/heartbeats/common.sh` | 修改 | ~50 行 |
| `/root/.openclaw/scripts/heartbeats/analyst-heartbeat.sh` | 修改 | ~10 行（P2） |
| `/root/.openclaw/scripts/heartbeats/test-topic-tracking.sh` | 新增 | ~80 行 |

---

## 5. 实施顺序

```
Step 1: 修改 common.sh - create_thread_and_save (Epic 1)
Step 2: 修改 common.sh - feishu_self_notify (Epic 2)
Step 3: 修改 analyst-heartbeat.sh (Epic 3, P2)
Step 4: 创建测试脚本 test-topic-tracking.sh (Epic 4)
Step 5: 手动验证所有场景 (Epic 4)
Step 6: 提交 PR，等待 reviewer 审查
```

---

## 6. 预计工时

| Epic | 描述 | 工时 |
|------|------|------|
| Epic 1 | 失败告警机制 | 0.5h |
| Epic 2 | 降级机制 | 0.3h |
| Epic 3 | analyst 话题追踪 (P2) | 0.2h |
| Epic 4 | 测试验证 | 0.5h |
| **总计** | | **1.5h** |

---

## 7. 回滚方案

如果改动引入回归（dev 心跳失败），快速回滚:

```bash
cd /root/.openclaw/scripts/heartbeats
git checkout HEAD~1 -- common.sh analyst-heartbeat.sh
```

回滚后话题追踪恢复到修复前状态（有静默失败问题但不阻塞心跳）。
