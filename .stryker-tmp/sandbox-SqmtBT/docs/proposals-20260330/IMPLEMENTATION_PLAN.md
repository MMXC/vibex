# Implementation Plan: Proposals Review — 2026-03-30

> **项目**: proposals-20260330
> **阶段**: Phase1 — P0 提案执行
> **版本**: 1.0.0
> **日期**: 2026-03-30
> **Architect**: Architect Agent
> **工作目录**: /root/.openclaw/vibex

---

## 1. 概述

### 1.1 目标
执行 6 个 Epic，确保 P0 提案 100% 完成，P1 提案 ≥ 80% 完成。

### 1.2 执行顺序

```
Day 1: Epic3 (测试补充) → Epic1 (Canvas checkbox)
Day 2: Epic2 (竞品矩阵)
Day 3: Epic4 (用户旅程图) + Epic5 (PRD模板)
Day 4-7: Epic6 (定价策略)
```

---

## 2. Epic 详细计划

### Epic 1: Canvas checkbox 修复（P0）

**负责人**: dev
**工时**: 6h

| Story | 功能 | 验收标准 |
|--------|------|----------|
| F2.1 | toggleConfirmContext | `expect(checkbox).toToggle()` |
| F2.2 | 状态同步 | `expect(state).toBeConsistent()` |
| F2.3 | 可取消勾选 | `expect(checkbox).toBeToggleable()` |

**实现步骤**:
1. 在 canvasStore 添加 `toggleConfirmContext` 函数
2. 在 BoundedContextTree 组件中调用
3. 添加单元测试
4. 添加 E2E 测试

---

### Epic 2: 竞品矩阵规范化（P0）

**负责人**: analyst
**工时**: 4h

| Story | 功能 | 验收标准 |
|--------|------|----------|
| F3.1 | 竞品数据收集 | `expect(competitors).toBeGreaterThanOrEqual(5)` |
| F3.2 | 功能矩阵 | `expect(matrix).toBeComplete()` |
| F3.3 | 更新机制 | `expect(update_process).toBeDefined()` |

**实现步骤**:
1. 收集竞品信息（竞品名、功能、定价）
2. 建立 Markdown 格式矩阵
3. 定义季度更新流程

---

### Epic 3: Canvas E2E 测试补充（P0）

**负责人**: tester
**工时**: 4h

| Story | 功能 | 验收标准 |
|--------|------|----------|
| F1.1 | canvas-expand.spec.ts | `expect(tests).toBeGreaterThanOrEqual(10)` |
| F1.2 | 增量测试覆盖 | `expect(coverage).toBeGreaterThanOrEqual(80)` |
| F1.3 | 测试验证 | `expect(test_result).toBe('pass')` |

**实现步骤**:
1. 创建 `tests/e2e/canvas-expand.spec.ts`
2. 补充 10+ 测试用例
3. 运行覆盖率检查
4. 修复失败用例

---

### Epic 4: 用户旅程图（P1）

**负责人**: pm
**工时**: 3h

| Story | 功能 | 验收标准 |
|--------|------|----------|
| F4.1 | 关键场景识别 | `expect(scenarios).toBeGreaterThanOrEqual(5)` |
| F4.2 | 用户旅程图 | `expect(journey_map).toExist()` |
| F4.3 | 痛点分析 | `expect(pain_points).toBeAnalyzed()` |

---

### Epic 5: PRD 模板标准化（P1）

**负责人**: pm, architect
**工时**: 2h

| Story | 功能 | 验收标准 |
|--------|------|----------|
| F5.1 | 模板定义 | `expect(template).toBeDefined()` |
| F5.2 | 路径规范 | `expect(path).toMatch('docs/{project}/prd.md')` |
| F5.3 | 格式验证 | `expect(validation).toBeAutomated()` |

---

### Epic 6: 定价策略（P2）

**负责人**: business
**工时**: 8h

| Story | 功能 | 验收标准 |
|--------|------|----------|
| F6.1 | 市场调研 | `expect(market_research).toBeComplete()` |
| F6.2 | 定价方案 | `expect(pricing_plan).toBeDefined()` |
| F6.3 | 用户分层 | `expect(user_tiers).toBeDefined()` |

---

## 3. 任务追踪

```bash
# 创建追踪任务
python3 task_manager.py add proposals-20260330 epic1-canvas-checkbox dev "Canvas checkbox 修复"
python3 task_manager.py add proposals-20260330 epic2-competitor-matrix analyst "竞品矩阵规范化"
python3 task_manager.py add proposals-20260330 epic3-canvas-e2e tester "E2E 测试补充"
python3 task_manager.py add proposals-20260330 epic4-user-journey pm "用户旅程图"
python3 task_manager.py add proposals-20260330 epic5-prd-template pm/architect "PRD 模板标准化"
python3 task_manager.py add proposals-20260330 epic6-pricing business "定价策略"

# 周会检查
python3 task_manager.py status proposals-20260330
```

---

## 4. 估计工时

| Epic | 负责人 | 工时 | 累计 |
|------|--------|------|------|
| Epic1 | dev | 6h | 6h |
| Epic2 | analyst | 4h | 10h |
| Epic3 | tester | 4h | 14h |
| Epic4 | pm | 3h | 17h |
| Epic5 | pm/arch | 2h | 19h |
| Epic6 | business | 8h | 27h |
| **总计** | | **27h** | |

---

## 5. 验收标准

### P0
- [ ] Canvas checkbox 可切换
- [ ] 竞品矩阵 ≥ 5
- [ ] E2E 测试 ≥ 10，覆盖率 ≥ 80%

### P1
- [ ] 用户旅程图存在
- [ ] PRD 模板已定义

### P2
- [ ] 定价方案已定义

---

*本文档由 Architect Agent 生成*
