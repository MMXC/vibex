# Vibex Sprint 2026-04-06 — 统一提案分析

> **产出时间**: 2026-04-06 03:00 GMT+8
> **来源**: 6 Agent 提案汇总（analyst / dev / architect / pm / tester）
> **分析者**: analyst subagent

---

## 1. 执行摘要

本 Sprint 收集 6 个 Agent 角色共 **28 个提案**（去重合并后），按主题归类：

| 主题 | P0 | P1 | P2 | 代表提案 |
|------|----|----|----|----------|
| Bug Fixes | 3 | 3 | 0 | E1-E3, E4-E6 |
| Quality | 2 | 2 | 1 | Vitest Gate, Hooks 补测, E2E Flaky |
| Architecture | 1 | 2 | 2 | Canvas split, Zustand dedup, API completion |
| Process | 1 | 1 | 2 | reviewer-dedup, checkpoint, proposal dedup, knowledge base |

**总工时估算**: P0: 25-32h | P1: 43-57h | P2: 64-80h → **建议 3 Sprint 分批执行**

---

## 2. 统一提案清单（去重合并后）

### 2.1 Bug Fixes（Bug 修复）

| ID | 提案 | 来源 | P | Est | Owner | 依赖 |
|----|------|------|---|-----|-------|------|
| B-P0-1 | OPTIONS 预检路由修复 | PM (E1) | P0 | 0.5h | dev | 无 |
| B-P0-2 | Canvas Context 多选修复 | PM (E2) | P0 | 0.3h | dev | 无 |
| B-P0-3 | generate-components flowId 修复 | PM (E3) | P0 | 0.3h | dev | 无 |
| B-P0-4 | reviewer-dedup Ready 决策逻辑修复 | dev+analyst | P0 | 2-4h | dev | 无 |
| B-P0-5 | quickfix-20260405 修复验证 | dev (D-P0-A) | P0 | 1-2h | dev | B-P0-4 前置 |
| B-P1-1 | SSE 超时 + 连接清理 | PM (E4) | P1 | 1.5h | dev | 无 |
| B-P1-2 | 分布式限流 | PM (E5) | P1 | 1.5h | dev | wrangler 配置 |
| B-P1-3 | test-notify 去重 | PM (E6) | P1 | 1h | dev | 无 |

### 2.2 Quality（质量）

| ID | 提案 | 来源 | P | Est | Owner | 依赖 |
|----|------|------|---|-----|-------|------|
| Q-P0-1 | Vitest Coverage Gate 复活 | tester | P0 | 2h | tester | 无 |
| Q-P0-2 | Canvas Hooks 零覆盖补测 (P0×3) | tester | P0 | 8h | tester | 无 |
| Q-P1-1 | E2E Flaky Tests 修复 | tester | P1 | 8-10h | tester | Q-P0-1 前置 |
| Q-P1-2 | npm Test Scripts 统一 | tester | P1 | 3h | dev/tester | 无 |
| Q-P1-3 | Vitest 迁移扫尾 | dev | P1 | 1h | dev | Q-P0-1 前置 |
| Q-P2-1 | Canvas API 23 端点 E2E 测试 | tester | P2 | 12-16h | tester | canvas-api-completion |

### 2.3 Architecture（架构）

| ID | 提案 | 来源 | P | Est | Owner | 依赖 |
|----|------|------|---|-----|-------|------|
| A-P0-1 | Subagent Checkpoint 持久化机制 | analyst | P0 | 6h | coord+analyst | 无 |
| A-P1-1 | 数据层 Canonical Model | architect | P1 | 5h | architect+dev | 无 |
| A-P1-2 | Canvas history snapshot 类型系统化 | dev | P1 | 2h | dev | 无 |
| A-P1-3 | Canvas API 补全计划 (Phase 1) | dev | P1 | 5-8h | dev | 无 |
| A-P2-1 | Zustand Store 治理 ADR-ARCH-001 | architect | P2 | 2d | architect | A-P1-1 前置 |
| A-P2-2 | CanvasPage 组件拆分 | architect | P2 | 1.5d | architect+dev | A-P1-1 前置 |
| A-P2-3 | Canvas API 补全 + 一致性治理 | architect | P2 | 3d | architect+dev | A-P1-3 前置 |

### 2.4 Process（流程）

| ID | 提案 | 来源 | P | Est | Owner | 依赖 |
|----|------|------|---|-----|-------|------|
| P-P0-1 | reviewer-dedup Ready 决策修复 | analyst+dev | P0 | 2-4h | dev | 同 B-P0-4 |
| P-P1-1 | 提案去重与生命周期管理 | analyst | P1 | 2.5h | analyst | 无 |
| P-P1-2 | 分析知识库结构化沉淀 | analyst | P1 | 4h | analyst | 无 |
| P-P2-1 | Sprint 质量基线监控仪表盘 | analyst | P2 | 7h | analyst | team-tasks 完善 |
| P-P2-2 | ts-any-cleanup 监控体系 | dev | P2 | 1h | dev | 无 |
| P-P2-3 | test-commands 标准化落地 | dev | P2 | 1h | dev | 无 |

---

## 3. 依赖图

```
[根因层 - 无依赖]
├── B-P0-1/2/3 (Canvas 3 bug)        ──────────────────────────────────┐
├── B-P0-4 (reviewer-dedup)          ──────────────────────────────────┤
├── B-P0-5 (修复验证)                ← B-P0-4                          │
├── Q-P0-1 (Vitest Gate)             ──────────────────────────────────┤
├── Q-P0-2 (Hooks 补测)              ──────────────────────────────────┤
├── A-P0-1 (Checkpoint)              ──────────────────────────────────┤
└── A-P1-3 (API补全 Phase1)          ──────────────────────────────────┘
                                                      ↓
[验证层]
├── B-P1-1 (SSE 超时)                ← B-P0-3 (flowId 上下文)          │
├── Q-P1-3 (Vitest扫尾)              ← Q-P0-1                          │
├── Q-P1-1 (E2E Flaky)              ← Q-P0-1                          │
└── B-P1-3 (test-notify dedup)       ← PM E6                           │
                                                      ↓
[架构层 - P2 独立演进]
├── A-P1-1 (Canonical Model)         ──────────────────────────────────┐
│   └── A-P2-1 (Store治理)           ← A-P1-1                           │
│   └── A-P2-2 (CanvasPage拆分)     ← A-P1-1                           │
└── A-P1-3 (API补全 Phase1)                                           │
    └── A-P2-3 (API一致性治理)       ← A-P1-3                          │
                                                      ↓
[流程层 - 独立演进]
├── P-P1-1 (提案去重)                ──────────────────────────────────┐
├── P-P1-2 (知识库沉淀)              ──────────────────────────────────┤
├── P-P2-1 (质量监控)                ← team-tasks 数据质量              │
├── P-P2-2 (ts-any监控)              ──────────────────────────────────┤
└── P-P2-3 (test-commands)           ← Q-P1-2                          │
```

---

## 4. 资源分配建议

### Sprint 1（2026-04-06 ~ 2026-04-07，约 1.5 天）

**目标**: 关闭所有 P0 bug + 复活 Vitest Gate

| 负责人 | 任务 | 工时 |
|--------|------|------|
| dev | B-P0-1/2/3 (Canvas 3 bug) | 1.1h |
| dev | B-P0-4 (reviewer-dedup) | 2-4h |
| dev | B-P0-5 (quickfix 验证) | 1-2h |
| tester | Q-P0-1 (Vitest Gate) | 2h |
| tester | Q-P0-2 (Hooks 补测 P0×3) | 8h |
| coord | A-P0-1 (Checkpoint) | 6h |
| **合计** | | **20-23h** |

> **注意**: dev 同时做 B-P0-4/5，共 3-6h 与 tester Q-P0-2 的 8h 并行，实际 Sprint 1 可在 1 天内完成核心 P0。

### Sprint 2（2026-04-08 ~ 2026-04-10，约 2.5 天）

**目标**: P1 质量 + API 补全 + 流程治理

| 负责人 | 任务 | 工时 |
|--------|------|------|
| dev | B-P1-1/2/3 (SSE+限流+notify dedup) | 4h |
| dev | A-P1-2 (Canvas snapshot 类型化) | 2h |
| dev | A-P1-3 (API 补全 Phase1) | 5-8h |
| dev | Q-P1-2/3 (npm scripts + Vitest扫尾) | 4h |
| tester | Q-P1-1 (E2E Flaky) | 8-10h |
| analyst | P-P1-1 (提案去重) | 2.5h |
| analyst | P-P1-2 (知识库沉淀) | 4h |
| architect | A-P1-1 (Canonical Model) | 5h |
| **合计** | | **34.5-40h** |

### Sprint 3（2026-04-11 ~ 2026-04-14，约 3 天）

**目标**: P2 架构 + 长期质量基线

| 负责人 | 任务 | 工时 |
|--------|------|------|
| dev+architect | A-P2-1 (Store 治理 ADR) | 2d (16h) |
| dev+architect | A-P2-2 (CanvasPage 拆分) | 1.5d (12h) |
| dev | A-P2-3 (API 一致性治理) | 3d (24h) |
| tester | Q-P2-1 (Canvas API E2E) | 12-16h |
| analyst | P-P2-1 (质量监控仪表盘) | 7h |
| dev | P-P2-2/3 (ts-any监控+test-commands) | 2h |
| **合计** | | **73-79h** |

---

## 5. Sprint 估算汇总

| 周期 | P0 | P1 | P2 | 合计 |
|------|----|----|----|------|
| Sprint 1 | 20-23h | — | — | 20-23h |
| Sprint 2 | — | 34.5-40h | — | 34.5-40h |
| Sprint 3 | — | — | 73-79h | 73-79h |
| **总计** | **20-23h** | **34.5-40h** | **73-79h** | **128-142h** |

> 建议 Sprint 1 压缩到 1 天完成（dev+tester 并行），Sprint 2 维持 2 天，Sprint 3 的 A-P2-3 可与 Sprint 2 的 A-P1-3 合并执行。

---

## 6. 关键风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| A-P0-1 (Checkpoint) 需要 sessions_spawn 重构，影响所有 agent | 中 | 高 | 先在测试环境验证，CI 通过后再合入；提供 rollback 方案 |
| reviewer-dedup 修复影响其他 agent 任务状态机 | 低 | 高 | 先在测试环境验证；添加端到端回归测试 |
| Canvas API 补全 5-8h 估算偏乐观（72% 端点缺失） | 高 | 中 | 严格按 Phase 优先级推进，Phase1 完成后评审；设定 8h 强制超时 |
| E2E Flaky 修复 8-10h 取决于现有测试套件健康度 | 中 | 中 | 先做 audit（2h）确认实际工作量，再决定是否继续 |
| A-P2-1/2 (Store治理+CanvasPage拆分) 需要大量重构测试 | 高 | 中 | Q-P0-2 (Hooks 补测) 必须在拆分前完成；建立 E2E regression suite |
| Vitest Gate 复活发现更多配置死代码 | 低 | 低 | 设定 2h 超时；遗留问题移至 P1 |

---

## 7. 跨角色去重说明

| 重复提案 | 合并方案 |
|----------|----------|
| dev D-P0-B ≈ analyst A-P0-2 ≈ pm E2 (隐含) | 合并为 B-P0-4，dev 主导实现，analyst 提供验收标准 |
| analyst A-P2-1 ≈ tester P2 (质量监控) | analyst 主导，tester 提供测试覆盖指标 |
| dev D-P1-C ≈ architect Arch-P5 ≈ pm (隐含API) | 合并为 A-P1-3 + A-P2-3，dev 主导 Phase1，architect 负责 Phase2+ |
| tester T-P1-2 ≈ dev D-P2-C ≈ pm (test commands) | 合并，dev 落地 package.json，tester 验证脚本可执行性 |

---

## 8. 立即行动项（今天完成）

| # | 任务 | 负责人 | 时限 |
|---|------|--------|------|
| 1 | E1: OPTIONS 路由修复（gateway.ts 调整注册顺序） | dev | 0.5h |
| 2 | E2: Canvas checkbox → onToggleSelect 绑定 | dev | 0.3h |
| 3 | E3: schema.ts 添加 flowId 字段 + prompt 更新 | dev | 0.3h |
| 4 | B-P0-4: _ready_decision.py 跨项目依赖查询修复 | dev | 2-4h |
| 5 | Q-P0-1: 创建 vitest.config.ts，废弃 jest.config.ts | tester | 2h |
| 6 | A-P0-1: Subagent checkpoint 模板创建 | coord+analyst | 1h（模板）+ 5h（实现） |

---

*分析文档版本: v1.0 | Analyst Subagent | 2026-04-06*
