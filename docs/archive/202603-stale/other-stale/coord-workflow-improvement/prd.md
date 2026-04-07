# 项目完成报告自动发送 Slack - PRD

**项目**: coord-workflow-improvement
**版本**: 1.0
**状态**: PM 细化
**工作目录**: /root/.openclaw/vibex

---

## 1. 执行摘要

### 1.1 背景

当前项目完成时缺乏结构化的自动报告机制，用户无法及时了解项目完成状态和产出物。需要实现自动化的项目完成报告发送 Slack，确保用户第一时间获取项目交付信息。

### 1.2 目标

实现项目完成时自动发送 Slack 消息，包含结构化产出物清单和验证结果。

### 1.3 核心指标

| 指标 | 目标 |
|------|------|
| 报告自动发送率 | 100% |
| 消息包含产出物清单 | 是 |
| 消息包含验证结果 | 是 |

---

## 2. 功能需求

### F1: 报告生成功能

**描述**: 在 task_manager.py 中新增 report 子命令，生成结构化项目完成报告

**验收标准**:
- `expect(task_manager.py report <project>).toContain("project_name")`
- `expect(task_manager.py report <project>).toContain("completion_time")`
- `expect(task_manager.py report <project>).toContain("tasks")`
- `expect(task_manager.py report <project>).toContain("deliverables")`
- `expect(task_manager.py report <project>).toContain("verification")`

### F2: Slack 消息格式化

**描述**: 将报告转换为 Slack Block Kit 格式消息

**验收标准**:
- `expect(format_slack_message(report)).toMatch(/🎉/)`
- `expect(format_slack_message(report)).toMatch(/项目完成报告/)`
- `expect(format_slack_message(report)).toMatch(/📋产出物清单/)`
- `expect(format_slack_message(report)).toMatch(/🔍验证结果/)`

### F3: 自动触发机制

**描述**: 项目状态从 active → completed 时自动发送报告

**验收标准**:
- `expect(update_project_status("completed")).toTrigger("send_completion_notification")`
- `expect(send_completion_notification).toHaveBeenCalledWith(project_name)`
- `expect(send_completion_notification).toHaveBeenCalledTimes(1)` // 不重复发送

### F4: 手动触发命令

**描述**: 支持手动调用命令发送报告

**验收标准**:
- `expect(task_manager.py notify <project>).toSendSlackMessage()`
- `expect(task_manager.py notify <project>).toContain("项目完成报告")`

---

## 3. Epic 拆分

### Epic 1: 报告生成引擎

**目标**: 实现结构化报告数据生成

| Story | 描述 | 验收标准 |
|-------|------|----------|
| S1.1 | 解析项目任务列表 | `expect(load_tasks(project)).toHaveLength(n)` |
| S1.2 | 收集各角色产出物 | `expect(deliverables).toContainKeys(["analyst","pm","architect","dev","tester","reviewer"])` |
| S1.3 | 提取验证结果 | `expect(verification).toContainKeys(["test","review"])` |

### Epic 2: Slack 消息格式化

**目标**: 将报告转换为 Slack Block Kit 格式

| Story | 描述 | 验收标准 |
|-------|------|----------|
| S2.1 | 实现 Block Kit 头部 | `expect(message.header).toMatch(/🎉.*项目完成报告/)` |
| S2.2 | 实现产出物清单区块 | `expect(message.deliverables).toBeArray()` |
| S2.3 | 实现验证结果区块 | `expect(message.verification).toContain("测试")` |

### Epic 3: 触发与集成

**目标**: 实现自动/手动触发发送

| Story | 描述 | 验收标准 |
|-------|------|----------|
| S3.1 | 项目完成自动触发 | `expect(status_change).toTrigger("notify")` |
| S3.2 | CLI 命令手动触发 | `expect(cli.notify).toSendMessage()` |
| S3.3 | 防止重复发送 | `expect(notify).toBeCalledTimes(1)` |

### Epic 4: 兼容性与测试

**目标**: 确保兼容性及测试覆盖

| Story | 描述 | 验收标准 |
|-------|------|----------|
| S4.1 | 现有项目不受影响 | `expect(existing_projects).toHaveUnchangedBehavior()` |
| S4.2 | 多角色项目支持 | `expect(6_roles).toGenerateCompleteReport()` |
| S4.3 | 异常处理 | `expect(slack_fail).toLogError()` |

---

## 4. UI/UX 流程

### 4.1 自动触发流程

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ 项目状态变更    │───▶│ task_manager.py  │───▶│ 生成报告数据    │
│ (active→done)  │    │ update completed │    │ generate_report │
└─────────────────┘    └──────────────────┘    └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Slack 频道收到  │◀───│ 发送 Slack 消息  │◀───│ 格式化消息      │
│ 项目完成报告    │    │ send_notification│    │ format_slack    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 4.2 手动触发流程

```bash
# 手动发送项目完成报告
python3 task_manager.py notify <project-name>
```

---

## 5. 非功能需求

### 5.1 性能

- 报告生成时间 < 1秒
- Slack 消息发送时间 < 2秒

### 5.2 可靠性

- Slack 发送失败时记录日志
- 重复触发时仅发送一次

### 5.3 兼容性

- 与现有 task_manager.py 命令兼容
- 对已完成项目无副作用

---

## 6. 实施计划

| 阶段 | Epic | 预估时间 |
|------|------|----------|
| Phase 1 | Epic 1: 报告生成引擎 | 2h |
| Phase 2 | Epic 2: Slack 消息格式化 | 1h |
| Phase 3 | Epic 3: 触发与集成 | 1h |
| Phase 4 | Epic 4: 兼容性与测试 | 1h |

**总预估**: 5 小时

---

## 7. DoD (Definition of Done)

- [ ] 所有 Story 验收测试通过
- [ ] E2E 测试覆盖自动触发流程
- [ ] 代码审查通过
- [ ] 文档更新

---

## 8. 依赖项

| 依赖 | 说明 |
|------|------|
| task_manager.py | 任务管理系统 |
| Slack API | 消息发送渠道 |
| project-completion-verification | 产出物验证 |

---

**产出物**: `docs/coord-workflow-improvement/prd.md`
**验证**: `test -f /root/.openclaw/vibex/docs/coord-workflow-improvement/prd.md`
