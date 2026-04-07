# PRD: fix-epic1-topic-tracking

**Agent**: PM  
**日期**: 2026-03-25  
**项目**: 修复 dev-p1-8-topic-tracking 虚假完成问题  
**分析来源**: `docs/fix-epic1-topic-tracking/analysis.md`

---

## 1. 执行摘要

### 1.1 背景
`dev-p1-8-topic-tracking` 被 dev 标记为完成，但 tester 发现**无实际代码实现**（虚假完成）。根本原因是 `create_thread_and_save` 在飞书消息发送失败时静默失败（`|| true`），导致话题追踪完全失效。

### 1.2 目标
修复话题追踪功能，确保：
1. 失败时有明确告警
2. 失败时降级为普通消息
3. analyst 心跳也支持话题追踪

### 1.3 关键指标

| 指标 | 目标 |
|------|------|
| 静默失败次数 | 0（必须有告警） |
| 功能降级 | 失败时 fallback 到普通消息 |
| analyst 话题支持 | P2（可选） |

---

## 2. Epic 拆分

### Epic 1: 失败告警机制

**目标**: `create_thread_and_save` 失败时有明确告警，不再静默

| Story ID | 描述 | 验收标准 | 优先级 |
|----------|------|----------|--------|
| F-E1-001 | 移除 `\|\| true` 静默 | `expect(create_thread_and_save 失败时返回非0) | P0 |
| F-E1-002 | 添加 `⚠️` 告警消息 | `expect(日志包含 "⚠️ 话题创建失败")` | P0 |
| F-E1-003 | 失败时输出错误详情 | `expect(日志包含 stderr 内容)` | P1 |

### Epic 2: 降级机制

**目标**: 话题创建失败时，fallback 到普通消息发送

| Story ID | 描述 | 验收标准 | 优先级 |
|----------|------|----------|--------|
| F-E2-001 | 检测 msg_id 为空 | `expect([ -z "$msg_id" ] 时触发降级)` | P0 |
| F-E2-002 | 降级到普通消息 | `expect(feishu_self_notify 不带 --reply-to)` | P0 |
| F-E2-003 | 降级时记录日志 | `expect(日志包含 "降级为普通消息")` | P1 |

### Epic 3: analyst 话题追踪

**目标**: analyst 心跳也支持话题追踪（P2，可选）

| Story ID | 描述 | 验收标准 | 优先级 |
|----------|------|----------|--------|
| F-E3-001 | analyst-heartbeat.sh 调用话题函数 | `expect(analyst 心跳创建话题)` | P2 |
| F-E3-002 | analyst HEARTBEAT.md 保存 thread_id | `expect(TASK_THREADS 区域有值)` | P2 |

### Epic 4: 验证与测试

**目标**: 确保修复后的功能可验证

| Story ID | 描述 | 验收标准 | 优先级 |
|----------|------|----------|--------|
| F-E4-001 | dev-heartbeat.sh 功能正常 | `expect(任务领取后创建话题)` | P0 |
| F-E4-002 | analyst 心跳不受影响 | `expect(analyst 心跳不报错)` | P0 |
| F-E4-003 | E2E 测试覆盖 | `expect(话题追踪覆盖 3 个场景)` | P1 |

---

## 3. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| AC-001 | Bot 不在群组 | `create_thread_and_save` 执行 | `expect(返回非0，日志包含 "⚠️ 话题创建失败")` |
| AC-002 | `msg_id` 为空 | 话题创建失败 | `expect(降级到普通消息发送)` |
| AC-003 | analyst 心跳运行 | 任务领取 | `expect(创建话题并保存 thread_id)` |
| AC-004 | dev 心跳运行 | 任务领取 | `expect(thread_id 保存到 HEARTBEAT.md)` |
| AC-005 | 正常情况 | 话题创建成功 | `expect(msg_id 非空，保存成功)` |

---

## 4. UI/UX 流程

```
[任务领取]
     ↓
[create_thread_and_save]
     ↓
[openclaw message send]
     ↓
    /\
   /  \
  成功  失败
   |     |
   ↓     ↓
[提取msg_id] [⚠️ 告警]
   |     |
   ↓     ↓
[保存thread_id] [降级普通消息]
   |
   ↓
[完成]
```

---

## 5. 非功能需求

| 需求 | 指标 |
|------|------|
| 向后兼容 | 现有 dev/analyst 心跳不受影响 |
| 可观测性 | 失败必须有日志/告警 |
| 容错性 | 单次失败不影响整体功能 |

---

## 6. Out of Scope

- 不修改 `openclaw message send` 本身
- 不修改其他 agent 的心跳脚本（除 analyst P2）
- 不修改飞书 API 集成

---

## 7. 依赖关系

| 依赖方 | 依赖内容 | 状态 |
|--------|----------|------|
| Dev | 修改 common.sh | 待派发 |
| Tester | E2E 测试验证 | 待派发 |
| Reviewer | 代码审查 | 待派发 |

---

## 8. 实施计划

| Phase | 内容 | 工时 |
|-------|------|------|
| Phase 1 | Epic 1 + Epic 2（失败告警 + 降级） | 1h |
| Phase 2 | Epic 4（验证测试） | 1h |
| Phase 3 | Epic 3 analyst 话题（P2） | 0.5h |

**总计**: 约 2.5h

---

## 9. 验收检查清单

- [ ] `create_thread_and_save` 失败时返回非0
- [ ] 失败日志包含 `⚠️ 话题创建失败`
- [ ] msg_id 为空时降级到普通消息
- [ ] dev 心跳任务领取后创建话题成功
- [ ] analyst 心跳不受影响（P2 可选）
- [ ] E2E 测试覆盖 3 个场景

---

**DoD**: 所有 P0 Story 验收标准通过，Epic 1+2+4 完成，analyst 话题追踪为 P2 可选。
