# PRD: Proposals Review — 2026-03-30

> **项目**: proposals-20260330
> **创建日期**: 2026-03-30
> **类型**: 提案评审
> **状态**: Draft
> **负责人**: PM Agent

---

## 1. 执行摘要

### 背景
汇总 6 个 Agent 的改进提案，识别跨团队协作优化机会。

### 提案统计
| 来源 | 提案数 | P0 | P1 | P2 |
|------|--------|-----|-----|-----|
| Analyst | 3 | 1 | 2 | 0 |
| Dev | 4 | 2 | 2 | 0 |
| Architect | 5 | 0 | 2 | 3 |
| PM | 2 | 0 | 2 | 0 |
| Tester | 1 | 1 | 0 | 0 |
| Reviewer | 1 | 0 | 1 | 0 |
| **总计** | **16** | **4** | **9** | **3** |

### 关键指标
| 指标 | 目标 |
|------|------|
| P0 提案解决率 | 100% |
| P1 提案解决率 | ≥ 80% |
| 提案执行追踪率 | 100% |

---

## 2. Epic 拆分

### Epic 1: Epic3 测试补充（P0）

**目标**: 补充 canvas-expand E2E 测试用例

**负责人**: tester

**故事点**: 4h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F1.1 | canvas-expand.spec.ts | 补充 canvas-expand 测试用例 | `expect(tests).toBeGreaterThanOrEqual(10)` | P0 |
| F1.2 | 增量测试覆盖 | 补充增量测试用例 | `expect(coverage).toBeGreaterThanOrEqual(80)` | P0 |
| F1.3 | 测试验证 | npm test 通过 | `expect(test_result).toBe('pass')` | P0 |

**DoD for Epic 1**:
- [ ] 测试用例 ≥ 10 个
- [ ] 覆盖率 ≥ 80%
- [ ] npm test 通过

---

### Epic 2: Canvas checkbox 修复（P0）

**目标**: 修复 checkbox 勾选逻辑混乱问题

**负责人**: dev

**故事点**: 6h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F2.1 | Toggle 函数 | 实现 `toggleConfirmContext` | `expect(checkbox).toToggle()` | P0 |
| F2.2 | 状态同步 | 确保状态正确同步 | `expect(state).toBeConsistent()` | P0 |
| F2.3 | 可取消勾选 | checkbox 可勾可取消 | `expect(checkbox).toBeToggleable()` | P0 |

**DoD for Epic 2**:
- [ ] checkbox 可切换状态
- [ ] 状态同步正确
- [ ] 可取消勾选

---

### Epic 3: 竞品矩阵规范化（P0）

**目标**: 建立系统性竞品功能对比

**负责人**: analyst

**故事点**: 4h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F3.1 | 竞品数据收集 | 收集 5+ 竞品数据 | `expect(competitors).toBeGreaterThanOrEqual(5)` | P0 |
| F3.2 | 功能矩阵 | 建立功能对比矩阵 | `expect(matrix).toBeComplete()` | P0 |
| F3.3 | 季度更新机制 | 建立季度更新流程 | `expect(update_process).toBeDefined()` | P1 |

**DoD for Epic 3**:
- [ ] 竞品 ≥ 5 个
- [ ] 功能矩阵完整
- [ ] 更新机制已定义

---

### Epic 4: 用户旅程图（P1）

**目标**: 建立用户旅程地图

**负责人**: pm

**故事点**: 3h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F4.1 | 关键场景识别 | 识别 5+ 关键场景 | `expect(scenarios).toBeGreaterThanOrEqual(5)` | P1 |
| F4.2 | 用户旅程图 | 绘制完整用户旅程 | `expect(journey_map).toExist()` | P1 |
| F4.3 | 痛点分析 | 分析关键痛点 | `expect(pain_points).toBeAnalyzed()` | P1 |

**DoD for Epic 4**:
- [ ] 关键场景 ≥ 5 个
- [ ] 用户旅程图存在
- [ ] 痛点已分析

---

### Epic 5: PRD 模板标准化（P1）

**目标**: 统一 PRD 模板

**负责人**: pm, architect

**故事点**: 2h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F5.1 | 模板定义 | 定义统一 PRD 模板 | `expect(template).toBeDefined()` | P1 |
| F5.2 | 路径规范 | 统一 PRD 路径 | `expect(path).toMatch('docs/{project}/prd.md')` | P1 |
| F5.3 | 格式验证 | 验证格式一致性 | `expect(validation).toBeAutomated()` | P2 |

**DoD for Epic 5**:
- [ ] 模板已定义
- [ ] 路径规范已建立
- [ ] 验证自动化

---

### Epic 6: 定价策略（P2）

**目标**: 建立定价策略

**负责人**: business

**故事点**: 8h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F6.1 | 市场调研 | 调研竞品定价 | `expect(market_research).toBeComplete()` | P2 |
| F6.2 | 定价方案 | 制定定价方案 | `expect(pricing_plan).toBeDefined()` | P2 |
| F6.3 | 用户分层 | 定义用户分层 | `expect(user_tiers).toBeDefined()` | P2 |

**DoD for Epic 6**:
- [ ] 市场调研完成
- [ ] 定价方案已定义
- [ ] 用户分层已定义

---

## 3. 优先级矩阵

| 优先级 | 提案 | 负责人 | 工时 |
|--------|------|--------|------|
| P0 | Epic3 测试补充 | tester | 4h |
| P0 | Canvas checkbox 修复 | dev | 6h |
| P0 | 竞品矩阵规范化 | analyst | 4h |
| P1 | 用户旅程图 | pm | 3h |
| P1 | PRD 模板标准化 | pm/architect | 2h |
| P2 | 定价策略 | business | 8h |
| **总计** | | | **27h** |

---

## 4. 验收标准汇总

### P0
| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | 测试用例 | 统计数量 | ≥ 10 个 |
| AC1.2 | 测试覆盖 | 运行覆盖率 | ≥ 80% |
| AC2.1 | Canvas checkbox | 点击 | 状态切换 |
| AC2.2 | 再次点击 | - | 取消勾选 |
| AC3.1 | 竞品数量 | 统计 | ≥ 5 个 |

### P1
| ID | Given | When | Then |
|----|-------|------|------|
| AC4.1 | 关键场景 | 统计 | ≥ 5 个 |
| AC4.2 | 用户旅程图 | 检查 | 存在且完整 |
| AC5.1 | PRD 模板 | 检查 | 格式统一 |

---

## 5. 快速验收单

```bash
# P0 检查
npm test -- --grep "canvas-expand"

# 竞品数量
ls docs/competitor-analysis/ | wc -l

# 测试覆盖率
npm test -- --coverage | grep "codecov"
```

---

**文档版本**: v1.0
**下次审查**: 2026-04-01
