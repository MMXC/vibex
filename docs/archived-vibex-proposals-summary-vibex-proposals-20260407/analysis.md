# Sprint Analysis — vibex-proposals-20260407

**分析日期**: 2026-04-05
**周期**: 2026-04-07 Sprint (5个工作日)
**综合来源**: 6位 Agent 提案 (Analyst, Dev, Architect, PM, Reviewer, Tester)

---

## 1. Sprint Goal

> **在本 Sprint 解除 Canvas 核心阻塞项，同时建立质量基线与团队流程基线。**
>
> 2026-04-05 三个 subagent 因超时失败（E1/E3-fix/E3-canvas-ux），已完成的代码未 commit，暴露出 subagent 韧性缺失。与此同时，72% Canvas API 端点缺失（9/32 实现），Epic E4（Version History）完全阻塞，Canvas 组件树 3757 行，Zustand 20+ stores 重叠。**三条线必须并行推进：后端 API、测试基线、subagent 韧性。**

---

## 2. Sprint Recommendation

### P0 — 立即执行（合计 ~11h）

| # | 提案 | 来源 | 估算 | 关键理由 |
|---|------|------|------|---------|
| P0-1 | **Canvas API Phase1 — Snapshot CRUD** | 5/6 agents | 4h（Analyst）/~3d（Dev） | 72%端点缺失，阻塞 Epic E4；前端已封装等待后端 |
| P0-2 | **Subagent 超时恢复机制** | 4/6 agents | 4h（Analyst）/~3d（Dev） | 今日 3 个 subagent 超时失败，其中 2 个代码未 commit |
| P0-3 | **Vitest Coverage Threshold Fix** | 4/6 agents | 3h（Analyst）/~6h（Dev） | 配置死代码，CI 门控失效，覆盖率滑坡无法阻断 |

**注**：Dev 对 P0-1 估算 7d（每人天模型），Analyst 估算 4h（按当前端点已有前端封装的增量实现）。建议以 Analyst 估算为基准，实际实施时拆分为 Phase1（4h）+ Phase2/3（2d）。**本 Sprint 只做 Phase1。**

### P1 — 本 Sprint 尽力推进（合计 ~22-26h）

| # | 提案 | 来源 | 估算 | 前置条件 |
|---|------|------|------|---------|
| P1-1 | **Reviewer SOP 标准化** | 3/6 agents | 4h | 无 |
| P1-2 | **Zustand 双仓库去重（分析+alias）** | 3/6 agents | 3h | 无；后续完整迁移依赖 Canvas Split |
| P1-3 | **Canvas Hooks 测试金字塔 L1** | 3/6 agents | 15h | canvas-split-hooks Epic 进度 |
| P1-4 | **Canvas Component Split Phase1** | 2/6 agents | 2d（Dev） | **必须等待 P0-1 Phase1 完成**（API 数据模型稳定后再拆分） |

### P2 — 规划纳入下一 Sprint（当前不执行）

| # | 提案 | 来源 | 估算 | 阻塞原因 |
|---|------|------|------|---------|
| P2-1 | **Canvas Testing Pyramid（完整）** | 2/6 agents | 4.5d（Architect） | 依赖 ADR-005 决策，当前无架构共识 |
| P2-2 | **Canvas API E2E 23 端点测试** | Tester | 12-16h | API 端点尚未实现，无法写端到端测试 |
| P2-3 | **Playwright 稳定性修复** | Tester | 8-12h | 低优先级，等 P2-1 整体重构 |
| P2-4 | **Test Data Factory** | Tester | 6-8h | 低优先级 |

---

## 3. 六 Agent 提案综合分析

### 3.1 共识区域（≥3 agents 独立提出相同提案）

#### Canvas API Phase1 — Snapshot CRUD
- **Analyst**: 6个端点（create/list/get/restore/delete/latest），复用 Prisma CanvasSnapshot model，Optimistic Locking，4h
- **Dev**: 6个端点 + OpenAPI schema + integration test，~7d（每人天估算）
- **PM**: 4个 CRUD + auto-save debouncing，~7d
- **Architect (ADR-001)**: REST+SSE+WS 混合协议，D1 schema，~7d
- **Tester**: 23个端点 E2E 测试，依赖 Phase1 完成

> **综合判断**：前端已封装，后端仅需落地 6 个 Snapshot 端点。建议 Analyst 估算（4h Phase1）作为 Sprint 目标，实际工作拆分为 Phase1（4h MVP）+ Phase2（2d 完善）。本 Sprint 只做 Phase1。

#### Subagent 超时恢复机制
- **Analyst**: Hybrid A+C 方案（checkpoint + WIP commit），4h
- **Dev**: runTimeoutSeconds + checkpoint store，~5d
- **PM**: timeout + checkpoint + recovery，3-5d
- **Architect (ADR-004)**: worktree isolation + checkpoint + WIP commit 三层架构，~3.5d

> **综合判断**：三位 Agent 提出不同粒度的方案。Analyst 的"短期立即落地"（4h checkpoint 脚本）最具实操性。建议以 checkpoint 脚本为核心（2h），WIP commit 和 worktree 作为 Phase2（下一 Sprint）。

#### Vitest Coverage Threshold Fix
- **Analyst**: Vitest Native Threshold + 渐进式阈值 + CI fork PR 修复，3h
- **Dev**: 移除第三方插件 + Vitest Native Threshold，~6h
- **Reviewer**: 清理死代码 + perFile thresholds + CI 集成，5h
- **Tester**: exclude legacy + perFile + changed-files 更严格阈值，2-3h

> **综合判断**：四 Agent 完全对齐。共识方案：清理 vitest.config.ts 死代码 → 配置 Vitest Native Threshold → 修复 CI fork PR 支持。执行路径清晰，无争议点。

#### Zustand 状态整合
- **Analyst (A-P1-3)**: 旧 stores vs canvas/stores 去重，分析+alias，3h
- **Dev (P1-2)**: simplifiedFlowStore vs flowStore 合并，~3d
- **Architect (ADR-002)**: 统一 store + feature slices，~3.5d

> **综合判断**：当前 Sprint 仅执行 Analyst 提出的"Phase1 分析+alias"（3h），不做破坏性迁移。完整 ADR-002 迁移需下一 Sprint。

#### Reviewer SOP 标准化
- **Analyst (A-P1-2)**: SOP 文档 + 报告路径统一 + 模板绑定，4h
- **Reviewer (P1)**: 5入口→1入口 + 自动化 Gate，8h
- **PM (Proposal 3)**: 标准化流程 + 减少 Review 入口，3-4d

> **综合判断**：三 Agent 一致认为 SOP 标准化是高价值 P1。建议以 Analyst 提案为基准（4h Phase1），Reviewer 补充的自动化 Gate 作为 Phase2（4h）。

### 3.2 差异化区域（1-2 agents 提出）

| 提案 | 提出者 | 独特点 |
|------|--------|--------|
| Canvas Real-time API Protocol (ADR-001) | Architect | REST+SSE+WS 三层架构 + D1 schema 设计，~7d |
| Canvas Component Split (ADR-003) | Architect | hooks-first 架构，~5d；依赖 ADR-002 |
| Canvas Hooks Testing (A-P2-1 + P1-1) | Analyst/Dev | 6个无覆盖 hooks TDD，15h；Dev 提 6个不同 hooks（4d） |
| ce:review 技能增强 | Reviewer | 自动化 SOP 合规检查，8h |
| 关键路径 E2E 测试要求 | Reviewer | 5条关键路径 Playwright，12+20h |
| Review 指标追踪系统 | Reviewer | GitHub API 数据采集，6h |
| ADR-005 Testing Pyramid | Architect | 3层测试金字塔（unit/integration/E2E），~4.5d |
| Playwright 稳定性 | Tester | Flaky test 审计+修复，8-12h |
| Test Data Factory | Tester | 类型安全工厂函数，6-8h |

### 3.3 提案优先级矩阵（按 Agent 维度）

| 提案 | Analyst | Dev | Architect | PM | Reviewer | Tester | 共识优先级 |
|------|---------|-----|-----------|----|----------|--------|-----------|
| Canvas API Phase1 | P0 | P0 | P0 | P0 | - | P1 | **P0** |
| Subagent Timeout Recovery | P0 | P0 | P1 | P1 | - | - | **P0** |
| Vitest Coverage Threshold | P1 | P0 | - | P0 | P0 | P0 | **P0** |
| Reviewer SOP | P1 | - | - | P1 | P0 | - | **P1** |
| Zustand Consolidation | P1 | P1 | P0 | - | - | - | **P1** |
| Canvas Hooks Testing | P2 | P1 | - | - | P1 | P0 | **P1** |
| Canvas Component Split | - | P2 | P1 | P2 | - | - | **P1** |
| Canvas API E2E Tests | - | - | - | - | P1 | P1 | **P1** |
| ADR-001 Real-time API | - | - | P0 | - | - | - | 架构提案 |
| ADR-002 Zustand ADR | - | - | P0 | - | - | - | 架构提案 |
| ADR-004 Subagent ADR | - | - | P1 | - | - | - | 架构提案 |
| ce:review 增强 | - | - | - | - | P1 | - | **P1** |
| Playwright 稳定性 | - | - | - | - | - | P1 | **P1** |
| Test Data Factory | - | - | - | - | - | P2 | P2 |
| Review 指标追踪 | - | - | - | - | P2 | - | P2 |

---

## 4. 依赖关系图

```
                    ┌─────────────────────────────────────┐
                    │         P0-1: Canvas API Phase1      │
                    │   (6 Snapshot CRUD, 4h Phase1 MVP)  │
                    └─────────────┬───────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
   ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
   │  P0-2:       │       │  P1-4:       │       │  P1-3:       │
   │  Subagent     │       │  Canvas      │       │  Canvas      │
   │  Timeout      │       │  Component   │       │  Hooks       │
   │  Recovery     │       │  Split       │       │  Testing     │
   └──────┬───────┘       │  (ADR-003)   │       │  (TDD)       │
          │               │              │       │              │
          │               └──────┬───────┘       └──────┬───────┘
          │                      │                      │
          │                      ▼                      │
          │               ┌──────────────┐              │
          │               │  P1-2:       │              │
          │               │  Zustand     │◄─────────────┘
          │               │  Consolidation│   (hooks 依赖
          │               │  (ADR-002)   │    整合后store)
          │               └──────────────┘
          │                      │
          │                      ▼
          │               ┌──────────────────┐
          │               │  P2-1:           │
          │               │  Testing Pyramid │
          │               │  (ADR-005)       │
          │               └──────────────────┘
          │
          ▼
   ┌──────────────────────────────────────────────┐
   │  P0-3: Vitest Coverage Threshold Fix (3h)    │
   │  (无依赖，独立并行执行)                        │
   └──────────────────────────────────────────────┘
          │
          ▼
   ┌──────────────────────────────────────────────┐
   │  P1-1: Reviewer SOP 标准化 (4h)              │
   │  (无依赖，独立并行执行)                        │
   └──────────────────────────────────────────────┘
          │
          ▼
   ┌──────────────────────────────────────────────┐
   │  P1: ce:review 增强 (Phase2, 4h)             │
   │  (Reviewer SOP 完成后执行)                    │
   └──────────────────────────────────────────────┘
```

**关键依赖说明**：
- **P1-3（Canvas Hooks Testing）** 和 **P1-4（Canvas Split）** 均依赖 P0-1 Phase1 完成，以确保 API 数据模型稳定后再进行 hooks 提取和组件拆分
- **P1-3** 额外依赖 canvas-split-hooks Epic 的进度
- **ADR-002（Zustand）** 完成后才能安全推进 ADR-003（Canvas Split）
- **P0-2（Subagent）** 和 **P0-3（Vitest）** 完全独立，可从 Sprint Day 1 并行执行

---

## 5. 风险评估

### 5.1 高风险（需主动监控）

| 风险 | 影响 | 概率 | 缓解策略 |
|------|------|------|---------|
| **P0-1 Canvas API 范围蔓延** | Sprint 目标失败 | 高 | 本 Sprint 仅做 Phase1（6个 Snapshot 端点），剩余 26 个端点移至 Phase2 |
| **P0-1 与 Architect ADR-001 协议选型冲突** | 返工 | 中 | 本 Sprint 使用现有 Prisma schema（Analyst/Dev 方案），ADR-001 协议设计在下一 Sprint 评审后再落地 |
| **P1-4 Canvas Split 与 E3-canvas-ux Epic 冲突** | 多个 subagent 操作同一组件 | 高 | 当前 Sprint P1-4 仅做架构评估和边界定义，**不执行实际拆分**，拆分作为下一 Epic 由独立 agent 执行 |
| **Subagent 超时再次发生** | 进度归零 | 高 | P0-2 是当前 Sprint 最高优先修复；在此之前，所有 subagent 任务手动设置较短 timeout |

### 5.2 中风险（需监控）

| 风险 | 影响 | 概率 | 缓解策略 |
|------|------|------|---------|
| **P1-1 Reviewer SOP 推进受阻** | Reviewer 抗拒标准化 | 中 | 让 reviewer 参与 SOP 评审；在本 Sprint 仅完成文档，不强制执行流程变更 |
| **P0-3 CI fork PR 支持方案不生效** | 门控仍然失效 | 中 | Phase2 单独安排 1h 验证 fork PR 支持；PR merge 前必须验证 |
| **P1-3 Hooks Testing mock 过于宽松** | 测试无实际价值 | 中 | 使用 `jest.requireActual` 获得真实 store 实例；严格边界条件断言 |
| **Analyst vs Dev 估算差异** | Sprint 规划失准 | 高 | Dev 估算按每人天模型，Analyst 按增量实现估算。以 Analyst 为 Sprint 目标，Dev 估算作为资源预警 |

### 5.3 低风险（可接受）

| 风险 | 影响 | 缓解策略 |
|------|------|---------|
| P1-2 Zustand alias 破坏向后兼容 | Phase1 仅做 alias，不做破坏性修改 |
| P2 提案持续推迟 | 纳入下一 Sprint，形成 backlog 积累 |

---

## 6. Sprint 资源配置建议

### 执行策略：并行三轨道

```
Track A (Backend/API):     P0-1 Canvas API Phase1 (4h MVP) → P1-4 Canvas Split 评估
Track B (Foundation):      P0-2 Subagent Timeout (4h) + P0-3 Vitest Fix (3h)
Track C (Process):        P1-1 Reviewer SOP (4h) → P1 ce:review 增强 (4h)
Track D (Testing):        P1-2 Zustand Analysis (3h) + P1-3 Hooks Testing (15h, 后半 Sprint)
```

### 时间分配（5天 Sprint）

| Day | 重点任务 |
|-----|---------|
| Day 1 | P0-2 (4h) + P0-3 (3h) + P1-1 Phase1 (2h) |
| Day 2 | P0-1 Phase1 (4h) + P1-2 (3h) |
| Day 3 | P1-3 Canvas Hooks Testing 开始 (6h) + P1-4 架构评估 (2h) |
| Day 4 | P1-3 Canvas Hooks Testing 继续 (6h) + P1-1 Phase2 SOP (2h) |
| Day 5 | P1-3 收尾 + Review + Sprint Retro |

### 总工时估算

| 轨道 | 任务 | 估算 |
|------|------|------|
| Backend | P0-1 Canvas API Phase1 | 4h |
| Backend | P1-4 Canvas Split 评估 | 2h |
| Foundation | P0-2 Subagent Timeout | 4h |
| Foundation | P0-3 Vitest Coverage Fix | 3h |
| Process | P1-1 Reviewer SOP | 4h |
| Process | P1 ce:review 增强 | 4h |
| Testing | P1-2 Zustand Analysis | 3h |
| Testing | P1-3 Canvas Hooks Testing | 15h |
| **合计** | | **39h** |

> **容量评估**: 5天 Sprint = 5人 × 8h = 40h 理论容量。**本 Sprint 规划 39h，紧绷但可行。** 关键路径在 Track D（P1-3，15h），需分配最熟练的开发者。

---

## 7. 关键决策点（需在 Sprint 启动会上确认）

1. **P0-1 估算基准**：使用 Analyst 的 4h 增量估算，还是 Dev 的 7d 每人天模型？
   → 建议：**以 Analyst 4h 为 Sprint 目标，Dev 7d 作为资源预警，实际以端到端可调用为验收标准**

2. **P1-4 Canvas Split 执行边界**：Sprint 内只做架构评估/边界定义，还是实际执行拆分？
   → 建议：**本 Sprint 仅做架构评估，实际拆分作为下一 Epic 由独立 subagent 执行**（避免与 E3-canvas-ux 并发冲突）

3. **P1-3 Hooks Testing 的 TDD 策略**：先写测试还是先提取 hook？
   → 建议：**TDD 驱动，先写单元测试（每个 hook ≥5 个测试用例），测试通过后再进行 hook 提取**

4. **ADR-001 协议选型**：本 Sprint 使用简单 REST，还是投入时间评审 ADR-001 的 REST+SSE+WS 混合方案？
   → 建议：**本 Sprint 使用现有 Prisma schema 实现简单 REST CRUD，ADR-001 作为下一 Sprint 的架构提案评审项**

---

## 附录：各 Agent 工时估算汇总

| 提案 | Analyst | Dev | Architect | PM | Reviewer | Tester | 综合估算 |
|------|---------|-----|-----------|----|----------|--------|---------|
| Canvas API Phase1 | 4h | ~7d | ~7d | ~7d | - | 12-16h | **4h Phase1 + 2d 完善** |
| Subagent Timeout | 4h | ~5d | ~3.5d | 3-5d | - | - | **4h Phase1 + ~3d 完善** |
| Vitest Coverage | 3h | ~6h | - | 1-2d | 5h | 2-3h | **3h** |
| Reviewer SOP | 4h | - | - | 3-4d | 8h | - | **4h Phase1 + 4h Phase2** |
| Zustand Consolidation | 3h | ~3d | ~3.5d | - | - | - | **3h Phase1** |
| Canvas Hooks Testing | 15h | ~4d | - | - | 8h | 6-8h | **15h** |
| Canvas Split | - | ~4d | ~5d | 5-7d | - | - | **2d 评估 + 4d 执行** |
| Canvas API E2E | - | - | - | - | 32h | 12-16h | **下一 Sprint** |
| ce:review 增强 | - | - | - | - | 8h | - | **4h** |
| Playwright 稳定性 | - | - | - | - | - | 8-12h | **下一 Sprint** |
| Test Data Factory | - | - | - | - | - | 6-8h | **下一 Sprint** |
| ADR-001 | - | - | ~7d | - | - | - | **下一 Sprint 架构评审** |
| ADR-002 | - | - | ~3.5d | - | - | - | **本 Sprint Zustand Phase1** |
| ADR-003 | - | - | ~5d | - | - | - | **下一 Sprint** |
| ADR-004 | - | - | ~3.5d | - | - | - | **本 Sprint P0-2 补充** |
| ADR-005 | - | - | ~4.5d | - | - | - | **下一 Sprint** |
| Review 指标追踪 | - | - | - | - | 6h | - | **下一 Sprint** |

---

*综合分析: Analyst | 2026-04-05 | 基于 6/6 Agent 提案*
