# PRD: 提案汇总 — 2026-03-30

> **项目**: proposals
> **创建日期**: 2026-03-30
> **类型**: 提案汇总
> **状态**: Draft
> **负责人**: PM Agent

---

## 1. 执行摘要

### 背景
汇总 6 个 Agent 的改进提案，识别跨团队协作优化机会。

### 目标
- 建立提案优先级矩阵
- 明确执行责任和工时
- 建立追踪机制

### 关键指标
| 指标 | 目标 |
|------|------|
| P0 提案解决率 | 100% |
| P1 提案解决率 | ≥ 80% |
| 提案执行追踪率 | 100% |

---

## 2. Epic 拆分

### Epic 1: P0 紧急事项执行

**目标**: 本周内完成所有 P0 提案

**故事点**: 8.5h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F1.1 | Epic3 测试补充 | tester 完成 canvas-expand E2E 测试 | `expect(e2eTests).toPass()` | P0 |
| F1.2 | Canvas checkbox 修复 | dev 修复 checkbox 状态混乱问题 | `expect(checkboxState).toBeConsistent()` | P0 |
| F1.3 | Heartbeat 脚本修复 | infra 修复话题创建失败问题 | `expect(heartbeatScript).toRunWithoutError()` | P0 |

**DoD for Epic 1**:
- [ ] Epic3 E2E 测试 100% 通过
- [ ] Canvas checkbox 行为一致
- [ ] Heartbeat 脚本无报错

---

### Epic 2: P1 高价值事项执行

**目标**: 下周完成 P1 提案

**故事点**: 10h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F2.1 | 任务去重机制 | architect 实现 task_manager 去重 | `expect(duplicateTasks).toBe(0)` | P1 |
| F2.2 | PRD 验收标准断言化 | pm 统一 expect() 格式 | `expect(prdAcceptanceTests).toPass()` | P1 |
| F2.3 | 提案生命周期管理 | coord 建立提案追踪机制 | `expect(lifecycleTracking).toBeImplemented()` | P1 |
| F2.4 | IMPLEMENTATION_PLAN 更新 | dev 及时更新文档 | `expect(docUpdateLag).toBeLessThan(24h)` | P1 |
| F2.5 | 架构文档模板 | architect 统一文档模板 | `expect(archDocTemplate).toExist()` | P1 |

**DoD for Epic 2**:
- [ ] 去重机制正常运作
- [ ] PRD 格式统一
- [ ] 提案可追踪
- [ ] 文档更新及时

---

### Epic 3: P2 优化事项规划

**目标**: 长期规划

**故事点**: 16h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F3.1 | 状态变更事件总线 | architect 设计事件总线 | `expect(eventBusDesign).toBeApproved()` | P2 |
| F3.2 | 代码审查自动化 | reviewer 实现自动化审查 | `expect(autoReview).toReduceManualEffort(50%)` | P2 |
| F3.3 | 日志文件优化 | infra 配置日志轮转 | `expect(logSize).toBeControlled()` | P2 |
| F3.4 | Epic 规模自动化检查 | analyst 实现规模检查 | `expect(scaleCheck).toBeAutomated()` | P2 |

**DoD for Epic 3**:
- [ ] 事件总线设计文档完成
- [ ] 自动化审查减少 50% 人工
- [ ] 日志大小可控
- [ ] 规模检查自动化

---

### Epic 4: 提案追踪机制

**目标**: 建立端到端提案追踪

**故事点**: 5h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F4.1 | 提案状态追踪 | coord 维护提案状态面板 | `expect(proposalDashboard).toBeVisible()` | P1 |
| F4.2 | 执行率统计 | coord 统计提案执行率 | `expect(executionRate).toBeTracked()` | P1 |
| F4.3 | 定期审查 | coord 每周审查提案进度 | `expect(weeklyReview).toHappen()` | P1 |

**DoD for Epic 4**:
- [ ] 提案状态可查
- [ ] 执行率可量化
- [ ] 周审查机制建立

---

## 3. 优先级矩阵

| 优先级 | 提案数 | 负责 Agent | 工时 |
|--------|--------|-----------|------|
| P0 | 4 | dev, tester, infra | 8.5h |
| P1 | 8 | architect, pm, coord | 15h |
| P2 | 6+ | architect, reviewer, infra | 16h |
| **总计** | **18+** | | **39.5h+** |

---

## 4. 验收标准汇总

### P0
| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | E2E 测试运行 | `pnpm test:e2e` | 100% 通过 |
| AC1.2 | Canvas checkbox | 用户操作 | 行为一致 |
| AC1.3 | Heartbeat 脚本 | 执行 | 无报错 |

### P1
| ID | Given | When | Then |
|----|-------|------|------|
| AC2.1 | 任务创建 | 重复提案 | 自动去重 |
| AC2.2 | PRD 评审 | 查看格式 | expect() 格式统一 |
| AC2.3 | 提案执行 | 查看状态 | 状态可追踪 |
| AC2.4 | 文档更新 | 代码提交后 | 24h 内更新 |

### P2
| ID | Given | When | Then |
|----|-------|------|------|
| AC3.1 | 事件总线 | 设计评审 | 方案获批 |
| AC3.2 | 代码审查 | 审查时间 | 减少 50% |
| AC3.3 | 日志 | 观察大小 | 轮转正常 |

---

## 5. 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 任务重复派发 | 高 | 中 | 立即实施去重机制 |
| 测试覆盖不足 | 高 | 高 | 优先 Epic1 F1.1 |
| 提案执行率低 | 中 | 中 | Epic4 追踪机制 |

---

## 6. 快速验收单

```bash
# P0 检查
grep -r "P0" docs/proposals/ | grep -E "Epic3|Canvas|Heartbeat"

# 提案状态
cat proposals/20260330/* | grep -E "P0|P1|P2" | wc -l

# 执行率
python3 task_manager.py list | grep done | wc -l
```

---

**文档版本**: v1.0
**下次审查**: 2026-03-31
