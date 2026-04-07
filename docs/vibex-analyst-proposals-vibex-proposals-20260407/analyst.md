# Analyst 提案 — 2026-04-07

**作者**: Analyst | **日期**: 2026-04-07 | **周期**: 20260407

---

## 提案目录

| 编号 | 方向 | 优先级 | 预估工时 | 依赖 |
|------|------|--------|---------|------|
| A-P0-1 | subagent 超时恢复机制 — Hybrid A+C 方案落地 | P0 | 4h | 无 |
| A-P0-2 | Canvas API Phase1 — Snapshot CRUD 6个端点 | P0 | 4h | 无 |
| A-P1-1 | 测试覆盖率门控 — Vitest Native Threshold 配置 | P1 | 3h | 无 |
| A-P1-2 | Reviewer 流程标准化 — SOP 文档 + ce:review 集成 | P1 | 4h | 无 |
| A-P1-3 | Zustand 双仓库去重 — 旧 stores vs canvas/stores 整合 | P1 | 3h | 无 |
| A-P2-1 | Canvas Hooks 测试金字塔 L1 — 6个无覆盖 hook 单元测试 | P2 | 15h | canvas-split-hooks Epic |

---

## A-P0-1: subagent 超时恢复机制 — Hybrid A+C 方案落地

### 问题/机会

**今日分析发现**：2026-04-05 三个 subagent（E1/E3-fix/E3-canvas-ux）均因超时失败，其中 2 个已完成代码但未 commit，1 个完成并 commit 但报告超时。根因是 `sessions_spawn` 使用 `disown` 模式分离，父会话无法感知子代理进度，超时后代码完全丢失。

**影响**：
- 已完成工作归零，开发效率损失
- 任务可恢复性为零，每次超时都是从头开始
- Coord 无法追踪真实进度

### 解决方案

**Hybrid A+C 方案**（基于今日分析推荐的方案）：

**短期（立即落地）**：
1. 所有 `sessions_spawn` 增加 `runTimeoutSeconds 1800`（30分钟）
2. 创建 checkpoint 脚本：`/root/.openclaw/scripts/checkpoint.sh`，子代理每 10 分钟写一次进度 JSON
3. 改造 `stuck task` 检测逻辑：超时后读取 `checkpoints/$task_id.json` 恢复进度

**长期（1-2周内）**：
4. 子代理模板增加 WIP commit：每 15 分钟 `git commit -m 'WIP: $task/$step'`
5. 任务完成后自动 squash WIP commits

### 实施草图

```
Phase 1 (2h):
├── /root/.openclaw/scripts/checkpoint.sh          [新建]
│   └── echo checkpoint JSON → /checkpoints/$task_id.json
├── /root/.openclaw/scripts/heartbeats/common.sh  [修改]
│   └── spawn_task_session() 增加 --runTimeoutSeconds 1800
├── /root/.openclaw/scripts/heartbeats/architect-heartbeat.sh  [修改]
│   └── stuck task 检测 → 读取 checkpoint.json 恢复
└── /root/.openclaw/scripts/heartbeats/dev-heartbeat.sh       [修改]
    └── 同上

Phase 2 (2h):
├── /root/.openclaw/templates/subagent-template.sh   [修改]
│   └── 每 15min 执行 git add + git commit -m 'WIP'
└── git hooks/pre-push 或 post-merge               [新建]
    └── 自动 squash 同任务的 WIP commits
```

### 影响（工时）

**Dev 实施**: 4h（Phase1 2h + Phase2 2h）

### 验收标准

- [ ] 模拟 30s 超时后，`/root/.openclaw/checkpoints/$task_id.json` 存在且包含进度
- [ ] 重新 spawn 相同任务，验证从 checkpoint 恢复（不从头开始）
- [ ] 连续 3 次超时-恢复循环，状态连续性保持
- [ ] 正常完成子代理，WIP commits 被 squash，git log 无 WIP 残留主分支

---

## A-P0-2: Canvas API Phase1 — Snapshot CRUD 端点实现

### 问题/机会

**今日分析发现**：Canvas 前端 API 层已完成 14 个端点封装，但后端仅实现了 9/32（28%）。其中 5 个 Snapshot 端点（create/list/get/restore/delete）前端已封装完毕但后端 100% 缺失，直接阻塞 **Epic E4（Version History）** 的落地。

**当前状态**：
- Snapshot CRUD: 6 个端点，0 个实现，100% missing
- Project CRUD: 3 个端点，0 个实现
- Tree Node CRUD: 14 个端点，0 个实现

### 解决方案

**Phase 1（当前提案）**: 实现 Snapshot CRUD 6 个端点，解锁 Epic E4。

**端点清单**：
| Method | Path | 用途 | 优先 |
|--------|------|------|------|
| POST | /api/v1/canvas/snapshots | 创建快照 | P0 |
| GET | /api/v1/canvas/snapshots | 列出快照 | P0 |
| GET | /api/v1/canvas/snapshots/:id | 获取单个快照 | P0 |
| POST | /api/v1/canvas/snapshots/:id/restore | 恢复到快照 | P0 |
| GET | /api/v1/canvas/snapshots/latest | 最新版本号（冲突检测） | P1 |
| DELETE | /api/v1/canvas/snapshots/:id | 删除快照 | P1 |

**关键设计决策**：
1. **Prisma CanvasSnapshot model 已存在**，复用现有 schema
2. **Optimistic Locking**：基于 version 字段防止并发写冲突，并发时返回 409
3. **CORS 预检**：OPTIONS 必须在 gateway 层处理（参考 canvas-cors learnings）
4. **统一错误格式**：`{ success: false, error: string, code?: string }`

### 实施草图

```
vibex-backend/src/app/api/v1/canvas/snapshots/
├── index.ts                        [新建: 路由注册]
├── snapshots.create.ts             [新建: POST snapshots]
├── snapshots.list.ts              [新建: GET snapshots]
├── snapshots.get.ts                [新建: GET snapshots/:id]
├── snapshots.restore.ts            [新建: POST snapshots/:id/restore]
├── snapshots.latest.ts             [新建: GET snapshots/latest]
├── snapshots.delete.ts             [新建: DELETE snapshots/:id]
├── snapshots.service.ts            [新建: 共享业务逻辑]
├── snapshots.types.ts              [新建: Zod schemas + TypeScript types]
└── __tests__/
    ├── snapshots.create.test.ts
    ├── snapshots.list.test.ts
    ├── snapshots.restore.test.ts
    └── snapshots.conflict.test.ts  [并发冲突测试]

路由注册（gateway 或 canvas/index.ts）:
v1.post('/canvas/snapshots', snapshotsCreate)
v1.get('/canvas/snapshots', snapshotsList)
v1.get('/canvas/snapshots/:id', snapshotsGet)
v1.post('/canvas/snapshots/:id/restore', snapshotsRestore)
v1.get('/canvas/snapshots/latest', snapshotsLatest)
v1.delete('/canvas/snapshots/:id', snapshotsDelete)
```

### 影响（工时）

**Dev 实施**: 4h（6个端点 + service + types + 测试 + CORS 验证）

### 验收标准

- [ ] `POST /api/v1/canvas/snapshots` 返回 201，snapshot 正确存入 Prisma
- [ ] `GET /api/v1/canvas/snapshots?projectId=xxx` 返回按时间倒序列表
- [ ] `GET /api/v1/canvas/snapshots/:id` 返回完整快照 JSON
- [ ] `POST /api/v1/canvas/snapshots/:id/restore` 正确恢复项目状态
- [ ] `GET /api/v1/canvas/snapshots/latest?projectId=xxx` 返回最新 version
- [ ] 并发写入触发 409 冲突响应（optimistic locking）
- [ ] CORS OPTIONS 在 gateway 层正确响应（参考 learnings）
- [ ] 前端 `canvasApi.createSnapshot()` / `listSnapshots()` / `getSnapshot()` / `restoreSnapshot()` 端到端可调用
- [ ] 集成测试覆盖所有 6 个端点

---

## A-P1-1: 测试覆盖率门控 — Vitest Native Threshold 配置

### 问题/机会

**今日分析发现**：
- Vitest 是实际测试运行器，但 `jest.config.ts` 中配置了 `coverageThreshold`（Vitest 不读取）
- 当前覆盖率 79.06%（Lines）/ 62.11%（Branches），CI 阈值设为 85% 导致门控形同虚设
- 基线文件不存在，`coverage-diff.js` 无法进行退化检测
- Fork PR 不触发 `coverage-check.yml`（CI 门控失效）

**历史数据**：2026-03-15 覆盖率从 72.91% 骤降至 53.80%，无自动阻断。

### 解决方案

**Option A（推荐）**: Vitest Native Threshold + 渐进式阈值

1. **创建 `vitest.config.ts`**：配置 `@vitest/coverage-v8` 和渐进式阈值
   - Phase1: Lines 75% / Branches 60% / Functions 65% / Statements 73%
   - Phase2 (2周后): Lines 78% / Branches 63% / Functions 68%
   - Phase3 (4周后): Lines 80% / Branches 66% / Functions 70%
   - Phase4 (目标): Lines 85% / Branches 70%

2. **建立基线**: `node scripts/coverage-diff.js --update-baseline`

3. **修复 CI fork PR 支持**: 将 `pull_request` 改为 `pull_request_target`（或独立 job）

4. **废弃 `jest.config.ts`**：标记为 deprecated，Vitest 是唯一测试框架

### 实施草图

```
Phase 1 (2h):
├── vibex-fronted/vitest.config.ts                [新建]
│   └── coverage: { provider: 'v8', thresholds: { lines: 75, ... } }
├── vibex-fronted/jest.config.ts                 [标记废弃]
│   └── 顶部添加 @deprecated 注释
└── coverage/baseline.json                        [建立基线]
    └── node scripts/coverage-diff.js --update-baseline

Phase 2 (1h):
├── .github/workflows/coverage-check.yml          [修改]
│   └── fork PR 支持: 添加独立 coverage job（使用 secrets 可用）
└── .github/workflows/coverage-check.yml           [验证]
    └── 从 fork 创建 PR，验证 CI coverage job 运行
```

### 影响（工时）

**Dev 实施**: 3h

### 验收标准

- [ ] `npm test` 在本地覆盖率低于阈值时 `exit code != 0`
- [ ] PR 覆盖率下降 >5% 自动被 GitHub 阻断合并
- [ ] Fork PR 也能触发覆盖率 CI 门控
- [ ] 基线文件 `coverage/baseline.json` 存在且在 main 分支可读
- [ ] `jest.config.ts` 标记为 deprecated（无 `vitest.config.ts` 时仍可运行）

---

## A-P1-2: Reviewer 流程标准化 — SOP 文档 + ce:review 集成

### 问题/机会

**今日分析发现**：项目存在 8 类不一致：
1. 入口分散（ce:review skill vs reviewer 心跳脚本并行）
2. 报告路径混乱（`review.md` / `review-report.md` / `proposals/<date>/reviewer.md`）
3. 安全扫描时机不统一（PR Template 要求但 heartbeat 未强制）
4. 两阶段门禁未文档化（HEARTBEAT.md 提到但无 SOP）
5. GStack 验证标准模糊（未明确哪些任务需要哪种证据）
6. 4 个模板存在但未与流程节点绑定
7. reviewer 自检报告路径历史遗留问题
8. HEARTBEAT.md 定义路径与实际路径冲突

### 解决方案

**Phase 1: SOP 文档编写**（基于今日分析推荐的 Option A）

1. 编写 `REVIEWER_SOP.md`：明确 reviewer 心跳领取 → 代码审查 → 安全扫描 → 报告产出 → Slack 通知的完整流程

2. **统一报告路径**：`docs/<project>/reviews/<epic>-review-<date>.md`

3. **模板绑定流程节点**：
   - `code-review.md` → Epic 代码审查
   - `architecture-review.md` → 架构设计评审
   - `prd-review.md` → PRD 评审会
   - `api-review.md` → API 契约审查

4. **安全扫描强制化**：每个 review 必须包含 `npm audit` + `gitleaks` 结果摘要

5. **GStack 验证分级**：
   - BugFix → 需要截图证据
   - Feature → 需要截图 + 操作视频
   - Refactor → 需要截图证据

6. **废弃手工 review 入口**：所有 review 通过 reviewer 心跳领取

**未来演进**（非本次范围）：
- ce:review skill 重新引入作为 L1 自动审查（对应 Option B）

### 实施草图

```
Phase 1 (3h):
├── docs/vibex-reviewer/SOP.md                    [新建: 主 SOP 文档]
│   ├── 流程图（领取→审查→安全扫描→报告→通知）
│   ├── 报告路径规范
│   ├── 模板选择决策树
│   └── GStack 验证分级表
├── docs/vibex-reviewer/templates/               [整理: 绑定到 SOP]
│   └── code-review.md / architecture-review.md / prd-review.md / api-review.md
└── vibex/agents/reviewer/HEARTBEAT.md           [清理: 路径逻辑]
    └── 引用 SOP，删除内嵌路径定义

Phase 2 (1h):
├── vibex/agents/reviewer/HEARTBEAT.md           [修改]
│   └── 所有 review 报告统一路径 → SOP 引用
└── 历史报告迁移（可选）
    └── 旧路径 → 新路径（可选，不强制）
```

### 影响（工时）

**Dev/Reviewer 实施**: 4h

### 验收标准

- [ ] `find docs -name "*review*.md" | grep -v templates` 无路径违规（统一到 `docs/<project>/reviews/`）
- [ ] 每个 review 包含 `npm audit` + `gitleaks` 结果摘要
- [ ] Reviewer SOP 文档覆盖完整流程（领取→审查→报告→通知）
- [ ] 模板与流程节点绑定有明确文档说明
- [ ] HEARTBEAT.md 中引用 SOP，无内嵌路径逻辑

---

## A-P1-3: Zustand 双仓库去重 — 旧 stores vs canvas/stores 整合

### 问题/机会

**来自 2026-04-05 提案 A-P0-2**：项目存在两套 Zustand stores 体系：
- **旧体系**：`/src/stores/`（20 个文件），含 designStore/flowStore/projectStore 等
- **新体系**：`/canvas/stores/`（6 个文件），含 useFlowStore/useContextStore/useComponentStore 等

**问题**：
- 状态定义重复（designStore.project ↔ canvas stores）
- 维护成本翻倍
- 可能出现状态不一致
- CanvasPage 同时引用两套 store

**今日分析补充**：CanvasPage 已引用 E6 Hooks（`useCanvasState`, `useCanvasStore`, `useCanvasRenderer`），但旧 stores 仍被直接引用。整合可简化状态管理层。

### 解决方案

**Phase 1（本次提案）**: 识别重叠范围，制定迁移计划，不做破坏性修改

1. **重叠分析**：对比 `/src/stores/` 和 `/canvas/stores/` 的状态定义
   - `designStore.project` ↔ 应该是 canvas stores 中的 project
   - `designStore.flows` ↔ `useFlowStore` 中的 flows
   - 识别出真正的 shared state vs duplicated state

2. **分类决策**：
   - **Shared**：跨模块使用的状态 → 保留在 `/src/stores/`
   - **Canvas-only**：仅被 Canvas 使用的状态 → 迁移到 `/canvas/stores/`
   - **Duplicate**：两边都有定义 → 合并到一处，另一处引用

3. **迁移策略**：
   - Phase A：建立"主副本"（选择 canvas/stores 为新主）
   - Phase B：旧 stores 改为从 canvas/stores 读取（read-only wrapper）
   - Phase C：旧 stores 完全废弃，删除重复定义

### 实施草图

```
Phase 1 (3h) — 分析 + 计划:
├── stores/audit.md                         [新建: 重叠分析报告]
│   ├── 状态重叠矩阵（旧 vs 新）
│   ├── 每对重叠的优先级判断（保留在哪）
│   └── 迁移路线图
├── canvas/stores/alias.ts                  [新建: 向后兼容别名]
│   └── export { useFlowStore as useDesignFlowStore } 等
└── /src/stores/canvas-adapter.ts           [新建: read-only wrapper]
    └── 从 canvas/stores 读取，复写旧 store 方法
```

### 影响（工时）

**Dev 实施**: 3h（本阶段仅分析和向后兼容别名，不做破坏性迁移）

### 验收标准

- [ ] `stores/audit.md` 完整记录所有重叠状态及其迁移决策
- [ ] 旧 store 读取 canvas store 时类型一致（无 `any` 断言）
- [ ] `canvas/stores/alias.ts` 导出所有向后兼容别名
- [ ] CanvasPage 拆分完成后，不直接引用旧 `/src/stores/`，改用 canvas/stores
- [ ] 现有 canvas 测试全部通过（无因 store 引用导致的测试失败）

---

## A-P2-1: Canvas Hooks 测试金字塔 L1 — 6个无覆盖 hook 单元测试

### 问题/机会

**来自 2026-04-05 提案 canvas-testing-strategy**：CanvasPage 正在被拆分为 6 个新 hooks，其中 5 个 **P0** 级 hooks 完全无测试覆盖：
- `useCanvasRenderer`（~200L）— 渲染计算，边界条件静默错误风险极高
- `useDndSortable`（~200L）— 拖拽排序，竞态风险高
- `useDragSelection`（~150L）— 框选逻辑
- `useCanvasSearch`（~150L）— 搜索过滤
- `useTreeToolbarActions`（~200L）— 工具栏操作

**当前已有 Layer 1 覆盖**：useCanvasState（551L）、useCanvasEvents（358L）、useAIController（77L）、useAutoSave（294L）、useCanvasExport（118L）— 5 个 hooks 有完整或基础测试。

**风险**：重构过程中任何边界条件遗漏（null 检查、store 不存在降级、竞态条件）都不会被自动发现，直到人工 QA 阶段才能暴露——成本极高。

### 解决方案

**Layer 1 单元测试**（本次提案）：

按优先级逐个补充测试，每完成一个 hook 的测试再进行该 hook 的拆分（TDD 驱动）：

| Hook | 优先级 | 测试重点 | 预计工时 |
|------|--------|---------|---------|
| `useCanvasRenderer` | P0 | useMemo 分支覆盖、node rects 计算、边计算 | 3h |
| `useDndSortable` | P0 | DnD 注册/解除、排序竞态、drop target | 3h |
| `useDragSelection` | P0 | 框选状态机、跨树边界、边界 box 计算 | 2h |
| `useCanvasSearch` | P1 | 搜索过滤、防抖、结果限制 | 2h |
| `useTreeToolbarActions` | P1 | 工具栏操作、API 同步 | 3h |
| `useVersionHistory` | P2 | 历史加载、版本恢复 | 2h |
| **合计** | | | **15h** |

### 实施草图

```
hooks/canvas/__tests__/
├── useCanvasRenderer.test.tsx         [新建, P0, 3h]
│   ├── describe('node rects')
│   │   ├── it('returns empty arrays when store is empty')
│   │   ├── it('computes correct rect for bounded context nodes')
│   │   ├── it('computes correct rect for flow nodes (step card offset)')
│   │   ├── it('handles duplicate node IDs (deduplication)')
│   │   └── it('memo key stability across re-renders')
│   ├── describe('edge computation')
│   │   ├── it('boundedEdges filters by currentPageId')
│   │   ├── it('flowEdges connects correct step IDs')
│   │   └── it('handles orphan nodes (no edges)')
│   └── describe('tree node arrays')
│       ├── it('unifies contextTree from contextStore')
│       ├── it('unifies flowTree from flowStore')
│       └── it('zoomFactor scales card dimensions correctly')
│
├── useDndSortable.test.tsx           [新建, P0, 3h]
│   ├── describe('DnD registration')
│   │   ├── it('registers drag source on mount')
│   │   ├── it('unregisters on unmount (no memory leak)')
│   │   └── it('calls useDndBackend with correct item type')
│   ├── describe('sort operation')
│   │   ├── it('calls componentStore.reorder with correct indices')
│   │   ├── it('debounces rapid reorder calls')
│   │   └── it('reverts on drag cancel')
│   └── describe('drop target')
│       ├── it('accepts drops from same tree type')
│       └── it('rejects drops from different tree type')
│
├── useDragSelection.test.tsx         [新建, P0, 2h]
│   ├── describe('selection state machine')
│   │   ├── it('starts selection on mousedown (no modifier)')
│   │   ├── it('expands selection on shift+click')
│   │   ├── it('clears selection on escape')
│   │   └── it('does not start selection on draggable elements')
│   └── describe('bounding box')
│       ├── it('updates rect during mousemove')
│       ├── it('selects nodes within bounding box')
│       └── it('handles selection crossing tree boundaries')
│
├── useCanvasSearch.test.tsx          [新建, P1, 2h]
│   ├── describe('search filtering')
│   │   ├── it('filters nodes by label (case-insensitive)')
│   │   ├── it('returns all trees when query is empty')
│   │   └── it('debounces rapid keystrokes')
│   └── describe('search results')
│       ├── it('returns highlighted node IDs')
│       └── it('limits results to MAX_SEARCH_RESULTS')
│
├── useTreeToolbarActions.test.tsx    [新建, P1, 3h]
│   ├── describe('toolbar actions')
│   │   ├── it('createNode calls correct store method')
│   │   ├── it('deleteNode removes from correct store')
│   │   ├── it('bulkDelete handles empty selection')
│   │   └── it('syncs state after API operations')
│
└── useVersionHistory.test.tsx        [新建, P2, 2h]
    ├── describe('history management')
    │   ├── it('loads history on mount')
    │   ├── it('restores version correctly')
    │   └── it('handles empty history gracefully')
```

### 影响（工时）

**Dev 实施**: 15h

### 验收标准

- [ ] 6 个新 hook 全部有单元测试（行覆盖率 ≥ 80%）
- [ ] 关键分支（null 检查、边界计算、竞态窗口）覆盖率 ≥ 90%
- [ ] `pnpm test --testPathPattern="hooks/canvas"` 全部 PASS
- [ ] 每个 hook 提取时，对应测试同步提交（不允许无测试的 hook 进入 main）
- [ ] useCanvasRenderer 的 useMemo 在 store 数据不变时不重新计算（render count 断言）

---

## 提案间依赖关系

```
A-P0-1 (subagent 超时恢复)
    └── 无依赖，独立实施

A-P0-2 (Canvas API Phase1)
    └── 无依赖，独立实施
    └── 后续 Phase2/3 依赖本提案完成

A-P1-1 (测试覆盖率门控)
    └── 无依赖，独立实施
    └── 为 A-P2-1 提供 CI 门控保障

A-P1-2 (Reviewer SOP)
    └── 无依赖，独立实施

A-P1-3 (Zustand 去重)
    └── 无依赖，独立实施
    └── canvas-split-hooks 完成后可加速整合

A-P2-1 (Canvas Hooks 测试 L1)
    └── 依赖 canvas-split-hooks Epic 拆分进度
    └── A-P1-1 的 CI 门控保障代码质量
```

## 关键风险与缓解

| 提案 | 主要风险 | 缓解措施 |
|------|---------|---------|
| A-P0-1 | WIP commit 污染 git 历史 | 任务完成后自动 squash |
| A-P0-2 | Snapshot Prisma schema 变更导致迁移 | 先读 schema 确认兼容性，参考 learnings |
| A-P1-1 | 渐进式阈值停滞，永久停留在低覆盖率 | 季度审查 + 自动化提醒 |
| A-P1-2 | Reviewer 抗拒标准化 | 让 reviewer 参与 SOP 评审 |
| A-P1-3 | 旧 store 迁移破坏现有功能 | 本次仅分析和 alias，不做破坏性迁移 |
| A-P2-1 | mock 过于宽松无法发现真实问题 | 使用真实 store 实例（jest.requireActual）|
