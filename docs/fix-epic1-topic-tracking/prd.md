# PRD: fix-epic1-topic-tracking — 飞书话题追踪失败修复

**项目**: fix-epic1-topic-tracking  
**类型**: Bug Fix  
**PM**: PM Agent  
**日期**: 2026-03-25  
**状态**: Ready for Dev  

---

## 1. 问题陈述

`dev-p1-8-topic-tracking` 被标记为完成，但实际无代码实现（虚假完成）。后续 `dev-p1-8-fix-fake-completion` 创建了真实实现（commit `9fd2d511`），但存在以下残留问题：

| 根因 | 影响 | 严重度 |
|------|------|--------|
| `create_thread_and_save` 用 `\|\| true` 吞掉错误 | 飞书发送失败时静默失效 | 🔴 高 |
| `feishu_self_notify` 仅在成功后保存 thread_id | 发送失败时不保存话题 | 🔴 高 |
| analyst 心跳不调用话题创建函数 | analyst TASK_THREADS 永远为空 | 🟡 中 |

---

## 2. 成功指标

| 指标 | 目标 |
|------|------|
| 话题创建失败时的可观测性 | 100% 有 ⚠️ 告警输出 |
| 功能降级可用性 | 失败时 fallback 到普通消息 |
| analyst 心跳容错 | 不因话题函数报错中断 |

---

## 3. 功能需求

### F1: 话题创建失败告警

**描述**: `create_thread_and_save` 在飞书消息发送失败时必须输出可观测的 ⚠️ 告警，而非静默失败。

**修改文件**: `vibex/scripts/common.sh`

**当前代码**:
```bash
result=$(openclaw message send ... 2>&1) || true
```

**修复后代码**:
```bash
result=$(openclaw message send ... 2>&1)
if [ $? -ne 0 ]; then
    echo "⚠️ 飞书话题创建失败: $result"
fi
```

**验收标准**:
- [ ] 当 Bot 不在群组时，脚本输出包含 `⚠️` 和失败原因
- [ ] 返回码非 0，允许调用方检测失败

---

### F2: 失败时降级为普通消息

**描述**: 当 `create_thread_and_save` 无法创建话题时，fallback 到普通消息发送，保证消息不丢失。

**修改文件**: `vibex/scripts/common.sh`

**修复后逻辑**:
```bash
if [ -z "$msg_id" ]; then
    echo "⚠️ 话题创建失败，降级为普通消息"
    openclaw message send --channel feishu --account "$agent" --target "$channel" --message "$message" 2>&1
fi
```

**验收标准**:
- [ ] `msg_id` 为空时，自动发送普通消息（无 `--reply-to`）
- [ ] 输出降级日志：`⚠️ 话题创建失败，降级为普通消息`

---

### F3: analyst 心跳容错

**描述**: 确保 `analyst-heartbeat.sh` 调用话题函数时不因错误中断，同时将 analyst 心跳也纳入话题追踪。

**修改文件**: `vibex/scripts/analyst-heartbeat.sh`

**验收标准**:
- [ ] analyst 心跳在话题函数失败时继续执行（不中断）
- [ ] analyst 领取任务时调用 `create_thread_and_save`
- [ ] analyst 的 TASK_THREADS 区域可写入 thread_id

---

## 4. Epic 拆分

### Epic 1: 失败告警（P0）

| Story | 描述 | 验收条件 |
|-------|------|----------|
| dev-fix-f1-alert | 修改 `create_thread_and_save` 移除 `\|\| true`，添加 ⚠️ 告警 | 失败时输出告警 + 非零返回码 |

### Epic 2: 降级机制（P0）

| Story | 描述 | 验收条件 |
|-------|------|----------|
| dev-fix-f2-fallback | `msg_id` 为空时 fallback 到普通消息 | 降级消息可送达 |

### Epic 3: analyst 话题追踪（P1）

| Story | 描述 | 验收条件 |
|-------|------|----------|
| dev-fix-f3-analyst-integration | analyst-heartbeat.sh 调用话题创建函数，添加容错 | analyst 心跳不报错，TASK_THREADS 可写入 |

---

## 5. UI/UX 流程

不涉及 UI 变更。日志输出示例：

```
✅ 任务领取: heartbeat-dev/P1-8
⚠️ 飞书话题创建失败: Bot not in chat
⚠️ 话题创建失败，降级为普通消息
✅ 心跳报告已发送
```

---

## 6. 非功能需求

| 类型 | 要求 |
|------|------|
| 兼容性 | Bash 3.2+（macOS/Linux 默认） |
| 依赖 | `openclaw`, `jq`, `grep`（已有） |
| 日志 | 所有 ⚠️ 告警输出到 stderr |
| 性能 | 降级路径无额外延迟 |

---

## 7. 实施计划

| 阶段 | 负责人 | 产出 |
|------|--------|------|
| Epic 1 + 2 | dev | 修改 common.sh，提交 PR |
| Epic 3 | dev | 修改 analyst-heartbeat.sh，提交 PR |
| 测试 | tester | 手动验证（Bot 不在群场景） |
| 审查 | reviewer | Code review |

**预计工时**: 1.5h（Epic 1+2: 1h，Epic 3: 0.5h）

---

## 8. 验收测试用例

| ID | 场景 | 输入 | 预期输出 |
|----|------|------|----------|
| TC1 | 话题创建成功 | Bot 在群，发送正常 | `✅` + msg_id 保存到 HEARTBEAT.md |
| TC2 | 话题创建失败 | Bot 不在群 | `⚠️ 飞书话题创建失败: ...` + fallback 普通消息 |
| TC3 | analyst 心跳 | analyst 领取任务 | TASK_THREADS 写入 thread_id |

---

## 9. 依赖

- `common.sh` 中的 `create_thread_and_save`、`save_task_thread_id` 函数
- `openclaw message send` 命令可用
- analyst 的 `workspace-analyst/HEARTBEAT.md` TASK_THREADS 区域存在

---

## 10. 变更文件清单

| 文件 | 操作 |
|------|------|
| `vibex/scripts/common.sh` | 修改 |
| `vibex/scripts/analyst-heartbeat.sh` | 修改 |

---

*PRD 由 PM Agent 生成于 2026-03-25*
