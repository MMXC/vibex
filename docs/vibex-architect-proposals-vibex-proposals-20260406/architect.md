# VibeX 架构提案 — 2026-04-06 Sprint

> **项目**: vibex-architect-proposals-vibex-proposals-20260406
> **版本**: v1.0
> **日期**: 2026-04-06
> **作者**: architect agent
> **依据**: GLM Canvas 优化路线图 + 6 Agent 提案汇总

---

## 执行摘要

本 Sprint 架构提案围绕 GLM Canvas 优化路线图展开，聚焦 **数据层统一** 和 **架构治理**。提案分两类：

1. **快速落地（≤2h）** — 继承 2026-04-05 的 P0/P1 修复，在同一次 Sprint 中完成
2. **中期改进（1-3 周）** — 来自 GLM Phase 0-2 的架构提案，独立项目执行

---

## 提案 1: 数据层统一 — Canonical Model 建立

**来源**: GLM Phase 1.1 + 2026-04-05 analyst.md

### Problem

前后端各自定义 Canvas 数据结构，字段名不一致、无统一权威类型：

| 概念 | 前端 | 后端 (Prisma) |
|------|------|--------------|
| ID | `nodeId` | `id` |
| 类型字段 | `type` | `ctxType` / `compType` |
| 确认状态 | `isActive` + `status` | `confirmed` |

**影响**:
- 前端 store 和后端 API 之间存在隐式适配层，无人维护
- `packages/types` 定义被绕过，直接在 route.ts 里定义 response 类型
- AI schema 输出字段与后端模型不匹配（如 flowId=unknown）

### Solution

```
Step 1: 在 packages/types/src/api/canvas.ts 定义 Canonical Model（权威类型）
        每个 Canvas 实体（Context, Flow, Component）只有一套类型

Step 2: 前端适配层（轻量）
        src/lib/canvas/types-from-canonical.ts
        只做 nodeId↔id、type↔ctxType 的字段映射，不含业务逻辑

Step 3: 后端响应通过 transformer
        DB model → canonical transformer → API response
        消除 route.ts 中的内联类型定义

Step 4: AI schema 对齐 canonical model
        generate-components 的输出 schema 直接引用 canonical types
```

### Estimate

**5h**（独立项目 `vibex-canvas-canonical-model`）

### Acceptance Criteria

- [ ] `packages/types/src/api/canvas.ts` 包含 `BoundedContextCanonical`, `FlowCanonical`, `ComponentCanonical`
- [ ] 前端不再直接定义节点类型，所有节点类型来自 `packages/types`
- [ ] 后端 route.ts 中无内联 response 类型定义（全部引用 canonical model）
- [ ] `generate-components` 输出 `flowId` 匹配 canonical `Flow.id` 格式
- [ ] Zod schema 在前端和后端保持一致（共享同一份定义）

---

## 提案 2: Phase 0 清理 Playbook

**来源**: GLM Phase 0 + architect.md (2026-04-06 已有)

### Problem

代码中存在 3 处明确的死代码（deprecated 函数/文件），但无系统化清理流程：

| 文件 | 状态 | 外部调用 |
|------|------|----------|
| `lib/canvas/deprecated.ts` | 无消费者 | 0 |
| `cascadeContextChange()` / `cascadeFlowChange()` | 无消费者 | 0 |
| `lib/canvas/api/dddApi.ts` | 无消费者 | 0 |

### Solution

**标准化 Phase 0 清理 Playbook**（供后续 Sprint 复用）：

```
1. 死代码识别
   # 分析 deprecated 标记
   grep -rn "@deprecated" src/ --include="*.ts" | grep -v node_modules

   # 确认无调用方
   rg "<deprecated-function-name>" src/ --type ts --type tsx -c

2. 清理执行
   - 删除文件 / 函数
   - 移除 re-export
   - 运行全量测试

3. Phase 0 清单（本次 Sprint 执行）
   ✅ 删除 lib/canvas/deprecated.ts
   ✅ 删除 cascadeContextChange() / cascadeFlowChange()
   ✅ 删除 lib/canvas/api/dddApi.ts
   ⚠️  迁移 MOCK 模板到 templateLoader.ts（降级为 P1）
```

### Estimate

**1.5h**（含验证，可与 P0 Bug 修复并行）

### Acceptance Criteria

- [ ] `deprecated.ts` 文件已删除
- [ ] `CascadeUpdateManager.ts` 中 deprecated 函数已删除，保留函数功能正常
- [ ] `dddApi.ts` 已删除
- [ ] `pnpm test` 全量通过，无 regression
- [ ] 后续 Sprint 可使用 Playbook 识别下一批死代码

---

## 提案 3: Zustand Store 治理规范（ADR-ARCH-001）

**来源**: architect.md P0-1 + GLM Phase 2.3

### Problem

**29 个 Zustand store** 分散在 `src/stores/`（~15个）和 `src/lib/canvas/stores/`（~9个），且存在冗余：

| Store | 问题 |
|-------|------|
| `simplifiedFlowStore` | 与 `flowStore` 功能重叠，无独立价值 |
| `canvasStore.ts` | 仅做 re-export，实际意义存疑 |
| `historySlice` (327行) | 严重超标（规范：≤200行） |

**跨 store 调用**依赖 `canvasStore.getState()` 直接访问，形成隐式耦合。

### Solution

**建立 ADR-ARCH-001 Store 治理规范**：

```
规范 1: 命名约定
  use{Entity}Store     # 单一实体
  use{Feature}Store    # 跨实体功能
  禁止: 跨 domain 的泛化 store

规范 2: 单一职责
  单个 store 文件 ≤ 200 行
  超出部分提取到 {entity}Selectors.ts / {entity}Actions.ts

规范 3: 跨 store 同步
  禁止: 直接调用 otherStore.getState()
  允许: 通过事件总线（EventBus）发布/订阅
  允许: Zustand middleware（有限场景）

规范 4: selector 导出
  每个 store 必须导出类型化 selector：
  export const selectXxx = (state: StoreState) => state.xxx

立即行动（本次 Sprint）:
  - 合并 simplifiedFlowStore → flowStore（使用 feature flag 灰度）
  - 拆分 historySlice → historySlice + historyUtils.ts
  - 评估 canvasStore.ts 价值，可删除则删除
```

### Estimate

**2d**（独立项目 `vibex-store-governance`）

### Acceptance Criteria

- [ ] `ADR-ARCH-001` 文档在 `docs/adr/` 目录，审批通过
- [ ] `simplifiedFlowStore` 合并到 `flowStore`，所有调用方迁移完成
- [ ] `historySlice` 拆分，`historySlice` ≤ 200 行
- [ ] 所有 store 导出类型化 selector
- [ ] 新建 store 必须通过 ADR-ARCH-001 自检清单
- [ ] E2E 测试覆盖 store 重构路径（无 regression）

---

## 提案 4: CanvasPage 组件拆分策略

**来源**: GLM Phase 2.1 + architect.md P3-5

### Problem

`CanvasPage.tsx` 达到 **1120 行**，违反单一职责原则。混合了：

- 阶段条件渲染（input → generate → view）
- 三列布局编排
- 工具栏
- 边层（SVG edge rendering）
- 抽屉状态管理

**风险**: 任何改动都需要理解 1120 行代码，认知负担极高。

### Solution

```
拆分目标: CanvasPage.tsx ≤ 300 行

拆分方案:

CanvasPage.tsx (~300行)
├── CanvasInputPhase.tsx  (~150行)  # 提取: input 阶段 textarea + 按钮
├── CanvasWorkspace.tsx   (~200行)  # 提取: 三列 grid 布局 + 边层
│   ├── BoundedContextTree.tsx  # 已有 (644行，进一步拆分见下)
│   ├── BusinessFlowTree.tsx     # 已有 (1005行，进一步拆分见下)
│   └── ComponentTree.tsx       # 已有 (988行，进一步拆分见下)
├── CanvasToolbar.tsx           # 已有 (161行)
├── FlowEdgeLayer.tsx           # 提取: SVG 边渲染（从 CanvasPage 提取）
├── BoundedEdgeLayer.tsx        # 提取: SVG 边渲染（从 CanvasPage 提取）
└── 抽屉状态 → 独立 useDrawerState hook

三棵树组件进一步拆分（以 BusinessFlowTree 为例）:
BusinessFlowTree.tsx (~300行)
├── FlowNodeCard.tsx     (~200行)   # 单个节点卡片
├── FlowStepEditor.tsx   (~200行)   # 步骤编辑表单
├── FlowStepList.tsx     (~150行)   # 步骤列表 + 拖拽
└── useFlowTreeActions.ts (~100行) # 节点操作 hook
```

### Estimate

**1.5d**（独立项目 `vibex-canvas-component-split`）

### Acceptance Criteria

- [ ] `CanvasPage.tsx` ≤ 300 行（包含注释和空行）
- [ ] 每个新文件 ≤ 350 行
- [ ] 所有现有测试通过（无 regression）
- [ ] 三棵树各自的 `NodeCard` 子组件可独立测试
- [ ] `FlowEdgeLayer` / `BoundedEdgeLayer` 可在单元测试中独立渲染

---

## 提案 5: Canvas API 补全 + 一致性治理

**来源**: GLM Phase 1.3-1.4 + analyst.md + 测试缺口分析

### Problem

**Canvas API 覆盖率仅 ~28%**（根据 GLM 分析）：

| 问题 | 影响 |
|------|------|
| Snapshot API 前后端路径不一致 | 前端 `canvasApi.ts` 定义 `/api/v1/prototype-snapshots`，后端路由不同 |
| 后端 13 处 `console.error` 无结构化日志 | 生产问题难以追踪 |
| API 响应格式不统一 | 客户端需要处理多种错误格式 |
| 双重路由体系并存 (`/api/*` + `/v1/*`) | 维护成本高，容易出错 |

### Solution

```
优先级 A: Snapshot API 对齐（最高优先）

  前端定义: canvasApi.ts → /api/v1/prototype-snapshots/*
  后端路由: /api/v1/prototype-snapshots/*  ✅ 存在

  但 canvas 相关的 snapshot 路由缺失：
  后端需新增: /api/v1/canvas/snapshots (CRUD)
  前端 canvasApi.ts 需对齐后端路由

优先级 B: 后端日志结构化（低风险）

  替换所有 console.error 为结构化 logger：
  # 格式: [canvas/{endpoint}] {level} {message} {meta}
  logger.error('[canvas/generate] generation failed', { requestId, error })

优先级 C: 统一 API 响应格式（中期）

  统一格式: { success: boolean, data?: T, error?: { code, message }, timestamp }
  建议: 先评审 API 响应格式 ADR（ADR-ARCH-004），再实施

优先级 D: 双重路由体系治理（长期）

  策略: /v1/* 为目标路由，/api/* 逐步废弃
  短期: 不新增 /api/* 路由
  中期: 迁移 /api/* 到 /v1/*
```

### Estimate

**3d**（`vibex-canvas-api-consolidation`）

### Acceptance Criteria

- [ ] Canvas snapshot CRUD 在后端完整实现（`/api/v1/canvas/snapshots`）
- [ ] 前端 `canvasApi.ts` snapshot 端点与后端路由完全一致
- [ ] 所有 canvas 后端 route.ts 使用结构化 logger（无 raw console.error）
- [ ] 错误响应包含 `requestId`，可用于日志追踪
- [ ] `/api/*` 路由数量不增加（封口政策）

---

## 提案优先级矩阵

| 提案 | 影响 | 工时 | 风险 | 建议顺序 |
|------|------|------|------|----------|
| **P1: 数据层 Canonical Model** | 极高 | 5h | 中（需协调前后端） | ① 立即启动 |
| **P2: Phase 0 清理 Playbook** | 低 | 1.5h | 零 | ① 并行执行 |
| **P3: Store 治理 ADR-ARCH-001** | 高 | 2d | 低 | ② 下个 Sprint |
| **P4: CanvasPage 拆分** | 中 | 1.5d | 中（测试覆盖关键） | ② 下个 Sprint |
| **P5: Canvas API 补全** | 高 | 3d | 低 | ③ 与 P3/P4 并行 |

**本次 Sprint 落地**: P1 + P2（~6.5h，可在 Sprint 周期内完成）
**下个 Sprint**: P3 + P4（~3.5d）
**后续 Sprint**: P5（~3d，与 Phase 1 数据层工作重叠，可合并）

---

## 与 GLM Phase 0-2 的关系

| GLM Phase | 对应提案 | 重叠说明 |
|-----------|---------|----------|
| Phase 0: 清理 | **提案 2** | 完全对齐，Playbook 即为 Phase 0 执行指南 |
| Phase 1: 数据层 | **提案 1** + **提案 5** | 提案1是 Phase 1.1 子集，提案5是 Phase 1.3-1.4 |
| Phase 2: 组件拆分 | **提案 4** | 完全对齐，CanvasPage 拆分即 Phase 2.1 |
| Phase 2: Store 拆分 | **提案 3** | 完全对齐，ADR-ARCH-001 约束 Phase 2.3 |

**结论**: 5 个提案与 GLM Phase 0-2 高度对齐，无冲突。本次 Sprint 聚焦 P1+P2，下个 Sprint 继续 P3+P4。

---

## ADR 索引

| ID | 标题 | 状态 | 关联提案 |
|----|------|------|----------|
| ADR-ARCH-001 | Canvas Store 治理规范 | **Proposed** | 提案 3 |
| ADR-ARCH-002 | Canvas Canonical Data Model | **Proposed** | 提案 1 |
| ADR-ARCH-003 | 统一 API 响应格式 | **Proposed** | 提案 5 |
| ADR-ARCH-004 | CanvasPage 组件拆分规范 | **Proposed** | 提案 4 |

---

*文档版本: v1.0 | Architect | 2026-04-06*
