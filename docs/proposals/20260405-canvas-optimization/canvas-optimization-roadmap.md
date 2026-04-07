# VibeX Canvas 模块优化路线图

**版本基准**: `ae63742f` (2026-04-05)  
**分析文件数**: 7,471 行核心源码 + 后端 API + Prisma Schema  
**测试覆盖**: 57 个单元测试 + 11 个 E2E 测试

---

## 现状评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 架构分层 | ⭐⭐⭐⭐ | Store/Hook/Component 三层清晰，已完成拆分 |
| 类型安全 | ⭐⭐⭐⭐ | 无 `any` 泄漏，Zod 校验已接入 API 层 |
| 代码规范 | ⭐⭐⭐⭐⭐ | 零 `console.log`（前端），零 `TODO/FIXME` |
| 可维护性 | ⭐⭐⭐ | 大组件未拆分，deprecated 代码未清理 |
| 数据层 | ⭐⭐ | JSON blob 存储，前后端模型不统一 |
| 性能 | ⭐⭐⭐ | 有 memoization 但边计算 O(n²)，persist 全量存储 |
| 可靠性 | ⭐⭐⭐ | 无 ErrorBoundary，后端 console.error 无结构化 |
| 测试 | ⭐⭐⭐ | 单元测试覆盖尚可，但关键路径缺集成测试 |

---

## 路线图总览

```
Phase 0: 清理（1-2天）          ← 零风险，立即可做
Phase 1: 数据层统一（3-5天）    ← 核心架构改进
Phase 2: 组件拆分（3-4天）      ← 可维护性提升
Phase 3: 性能优化（2-3天）      ← 用户体验提升
Phase 4: 可靠性加固（2-3天）    ← 生产就绪
Phase 5: 高级特性（5-7天）      ← 功能增强
```

---

## Phase 0: 清理（1-2天）

> 目标：删除死代码，降低维护负担。零功能变更，零风险。

### 0.1 删除 deprecated 层

**文件**: `lib/canvas/deprecated.ts` + `lib/canvas/canvasStore.ts` 中的 re-export

**现状**: `deprecated.ts` 导出 12 个向后兼容函数（`getCanvasPhase`, `getContextNodes` 等），经检查**无任何外部消费者**——所有组件和 hook 已直接使用 split stores。

**行动**:
1. 删除 `deprecated.ts`
2. 从 `canvasStore.ts` 移除 deprecated re-export
3. 运行全量测试确认无 break

**预估**: 0.5h

### 0.2 删除 deprecated cascade 函数

**文件**: `lib/canvas/cascade/CascadeUpdateManager.ts`

**现状**: `cascadeContextChange()` 和 `cascadeFlowChange()` 标记 `@deprecated Epic 4`，经检查**无调用方**。

**行动**:
1. 删除两个 deprecated 函数
2. 保留 `markFlowNodesPending` / `markComponentNodesPending` / `hasNodes` / `hasActiveNodes`（仍被使用）
3. 运行测试

**预估**: 0.5h

### 0.3 删除 dddApi.ts

**文件**: `lib/canvas/api/dddApi.ts`

**现状**: 标记 `@deprecated Use canvasSseApi.ts`，经检查**无调用方**。

**行动**: 删除文件，运行测试。

**预估**: 0.25h

### 0.4 清理 MOCK 模板数据

**文件**:
- `components/canvas/BoundedContextTree.tsx` — `MOCK_CONTEXT_TEMPLATES`
- `components/canvas/ComponentTree.tsx` — `MOCK_COMPONENT_TEMPLATES`

**现状**: 生产代码中硬编码了 mock 模板数据，用于"快速添加"功能。这些数据应该来自 `templateLoader.ts` 或后端。

**行动**:
1. 将 mock 数据迁移到 `templateLoader.ts` 的模板体系
2. 组件通过 `templateLoader` 获取模板
3. 保持 UI 行为不变

**预估**: 1h

### 0.5 后端日志结构化

**文件**: 所有 `vibex-backend/src/app/api/v1/canvas/*/route.ts`

**现状**: 13 处 `console.error` / `console.log`，无结构化日志。

**行动**:
1. 引入轻量 logger（如 `pino` 或简单的 `logger.ts` wrapper）
2. 统一格式：`[canvas/{endpoint}] {level} {message} {meta}`
3. 错误日志包含 request ID（用于追踪）

**预估**: 1.5h

---

## Phase 1: 数据层统一（3-5天）

> 目标：消除 JSON blob 反模式，统一前后端数据模型。这是最重要的架构改进。

### 1.1 统一前后端类型定义

**问题**: 前后端各自定义了数据结构，字段名不一致：

| 概念 | 前端 | 后端 (Prisma) |
|------|------|---------------|
| ID | `nodeId` | `id` |
| 类型 | `type` | `ctxType` / `compType` |
| 确认状态 | `isActive` + `status` | `confirmed` |
| 描述 | `description` | `description` ✅ |

**行动**:
1. 在 `packages/types/src/api/canvas.ts` 中定义**权威类型**（Canonical Model）
2. 前端 store 类型 → 适配层 → Canonical Model
3. 后端 API 响应 → Canonical Model
4. 前后端共享 `packages/types`，消除重复定义

**具体步骤**:
```
packages/types/src/api/canvas.ts   ← 权威类型（扩展）
vibex-fronted/src/lib/canvas/types.ts  ← 保留 UI 专用类型，但节点数据类型从 packages 导入
vibex-backend/src/app/api/v1/canvas/types.ts  ← 删除，改用 packages/types
```

**预估**: 4h

### 1.2 消除 JSON Blob 存储

**问题**: `CanvasProject` 表使用 `contextsJson` / `flowsJson` / `componentsJson` 三个 JSON 字符串字段存储三棵树数据。

**影响**:
- 无法用 SQL 查询节点（如"查找所有 core 类型的 context"）
- 无法建立外键关系（flow → context 的关联靠 JSON 内的 `contextId`）
- 数据一致性无法在 DB 层保证

**方案**: 利用已有的 Prisma 模型（`CanvasBoundedContext` / `CanvasFlow` / `CanvasFlowStep` / `CanvasComponent`），它们已经定义好了结构化字段但未被使用。

**行动**:
1. **迁移策略**: 新数据写入结构化表，旧数据通过 migration script 转换
2. 修改 `POST /api/v1/canvas/project` — 写入结构化表而非 JSON blob
3. 修改 `POST /api/v1/canvas/generate` — 从结构化表读取
4. 添加 `GET /api/v1/canvas/project/:id` — 查询结构化数据
5. 保留 `contextsJson` 字段做快照备份（过渡期），后续 migration 移除

**预估**: 8h

### 1.3 API 响应标准化

**问题**: 后端 route.ts 中重复定义了 `BoundedContextResponse`、`FlowStepResponse` 等类型，与 `packages/types` 中的定义不一致。

**行动**:
1. 后端 API 直接使用 `packages/types` 中的类型
2. 添加 response transformer 层（DB model → API response）
3. 前端 `canvasApi.ts` 的 Zod schema 与后端 response 保持同步

**预估**: 3h

### 1.4 Snapshot API 对齐

**问题**: 前端 `canvasApi.ts` 定义了 snapshot CRUD（create/list/restore/get/latest），但后端只有 `/api/v1/prototype-snapshots` 路由，路径和接口不匹配。

**行动**:
1. 后端添加 `/api/v1/canvas/snapshots` 路由（CRUD）
2. 使用结构化表存储 snapshot 数据（而非 JSON blob）
3. 前端 `canvasApi.ts` 的 endpoint 配置对齐后端

**预估**: 4h

---

## Phase 2: 组件拆分（3-4天）

> 目标：将大组件拆分为可独立维护的模块。

### 2.1 CanvasPage 拆分（1120行 → 目标 < 400行）

**现状**: CanvasPage 是一个 1120 行的巨型组件，包含三列布局、输入阶段、工具栏、边层、抽屉等所有内容。

**拆分方案**:

```
CanvasPage.tsx (~300行)           ← 只做布局编排
├── CanvasInputPhase.tsx (~150行) ← input 阶段的需求输入区
├── CanvasWorkspace.tsx (~200行)  ← context/flow/component 三列工作区
│   ├── BoundedContextTree.tsx     (已有，644行)
│   ├── BusinessFlowTree.tsx      (已有，1005行)
│   └── ComponentTree.tsx         (已有，988行)
├── CanvasToolbar.tsx             (已有，161行)
├── FlowEdgeLayer.tsx             (从 CanvasPage 提取)
├── BoundedEdgeLayer.tsx          (从 CanvasPage 提取)
├── LeftDrawer.tsx                (已有)
└── MessageDrawer.tsx             (已有)
```

**行动**:
1. 提取 `CanvasInputPhase` — input 阶段的 textarea + 按钮
2. 提取 `CanvasWorkspace` — 三列 grid 布局 + 边层
3. 提取 `FlowEdgeLayer` / `BoundedEdgeLayer` — SVG 边渲染
4. CanvasPage 只做 phase 条件渲染 + layout

**预估**: 6h

### 2.2 三棵树组件瘦身

**现状**: 三棵树组件都接近或超过 1000 行。

| 组件 | 行数 | 问题 |
|------|------|------|
| BoundedContextTree | 644 | 包含 mock 模板、编辑表单、拖拽逻辑 |
| BusinessFlowTree | 1005 | 包含步骤编辑、拖拽排序、展开收起 |
| ComponentTree | 988 | 包含 mock 模板、多选、拖拽 |

**拆分方案**（以 BusinessFlowTree 为例）:

```
BusinessFlowTree.tsx (~300行)     ← 树容器 + 渲染逻辑
├── FlowNodeCard.tsx (~200行)     ← 单个流程节点卡片
├── FlowStepEditor.tsx (~200行)   ← 步骤编辑表单
├── FlowStepList.tsx (~150行)     ← 步骤列表 + 拖拽排序
└── useFlowTreeActions.ts (~100行) ← 节点操作 hook
```

**行动**:
1. 每棵树提取 `NodeCard` 子组件
2. 每棵树提取 `NodeEditor` / `StepEditor` 表单
3. 每棵树提取操作 hook（`useXxxTreeActions`）
4. 目标：每个文件 < 350 行

**预估**: 8h

### 2.3 Store 拆分规范落地

**现状**: dev-proposals P003 提出单 store ≤ 200 行规范，当前超标情况：

| Store | 行数 | 状态 |
|-------|------|------|
| contextStore | 233 | ⚠️ 略超 |
| flowStore | 267 | ⚠️ 超标 |
| componentStore | 147 | ✅ |
| uiStore | 172 | ✅ |
| sessionStore | 120 | ✅ |
| historySlice | 327 | ❌ 严重超标 |

**行动**:
1. **contextStore** (233行): 提取 `contextSelectors.ts`（纯选择器函数）
2. **flowStore** (267行): 提取 `flowSelectors.ts` + `flowStepActions.ts`
3. **historySlice** (327行): 提取 `historyUtils.ts`（undo/redo 纯函数）+ `historySelectors.ts`

**预估**: 4h

---

## Phase 3: 性能优化（2-3天）

> 目标：提升大数据量下的渲染性能和交互流畅度。

### 3.1 边计算从 O(n²) 降为 O(n)

**文件**: `hooks/canvas/useCanvasRenderer.ts`

**现状**: `computeBoundedEdges()` 对所有 context 节点做两两配对，O(n²) 复杂度。当 context 超过 20 个时会产生 190 条边。

**行动**:
1. 只为有明确 `relationships` 的 context 对生成边（数据驱动而非全连接）
2. 利用 `BoundedContextNode.relationships` 字段（已定义但未在边计算中使用）
3. 添加边数量上限（如最多 50 条），超出时按 confidence 排序截断

**预估**: 2h

### 3.2 Zustand Persist 优化

**现状**: 5 个 store 全部使用 `persist` 中间件，每次状态变更都序列化到 localStorage。

**问题**:
- `contextNodes` 数组可能包含几十个节点，每次编辑都全量写入
- `historySlice` 的 50 步历史也全量持久化，localStorage 膨胀

**行动**:
1. **partialize**: 只持久化必要字段
   ```ts
   persist(
     (set, get) => ({...}),
     {
       name: 'vibex-context-store',
       partialize: (state) => ({
         contextNodes: state.contextNodes,
         phase: state.phase,
         // 不持久化: contextDraft, selectedNodeIds
       }),
     }
   )
   ```
2. **historySlice 不持久化**: 历史记录是会话级的，不需要跨页面保留
3. **debounce 写入**: 对频繁更新的 store（如 uiStore 的 drag 状态）添加 500ms debounce

**预估**: 3h

### 3.3 虚拟化长列表

**现状**: 三棵树直接 `map` 渲染所有节点，无虚拟化。

**行动**:
1. 当节点数 > 20 时启用虚拟滚动（`@tanstack/react-virtual` 或 `react-window`）
2. TreePanel 组件添加虚拟化 wrapper
3. 保持折叠/展开状态不受虚拟化影响

**预估**: 4h

### 3.4 useCanvasRenderer 中的 `as unknown as` 消除

**文件**: `hooks/canvas/useCanvasRenderer.ts:178-180, 193-195`

**现状**: flowTreeNodes 和 componentTreeNodes 的构建使用了 `as unknown as` 类型断言，说明类型定义不完整。

**行动**:
1. 在 `BusinessFlowNode` 和 `ComponentNode` 类型上添加 `isActive?` / `parentId?` / `children?` 可选字段
2. 或创建统一的 `BaseNode` 接口
3. 消除所有 `as unknown as`

**预估**: 1h

---

## Phase 4: 可靠性加固（2-3天）

> 目标：提升生产环境的容错能力。

### 4.1 添加 ErrorBoundary

**现状**: Canvas 模块**无 ErrorBoundary**。任何子组件渲染错误会导致整个画布白屏。

**行动**:
1. 在 `CanvasPage` 顶层添加 `CanvasErrorBoundary`
2. 每棵树（context/flow/component）各自添加 `TreeErrorBoundary`
3. ErrorBoundary 提供"重试"按钮和错误上报
4. SSE 连接错误已有处理，但 AI 生成结果解析失败需要 catch

**预估**: 3h

### 4.2 API 错误处理增强

**文件**: `lib/canvas/api/canvasApi.ts`

**现状**: `handleResponseError` 只抛出通用 Error，无错误分类。

**行动**:
1. 定义 `CanvasApiError` 类（含 code、status、details）
2. 区分网络错误 / 401 / 409 冲突 / 500
3. 409 冲突时自动触发版本同步流程（已有 `versionCheckInterval` 但未完整实现）
4. 添加请求重试（指数退避，最多 3 次，仅对 5xx）

**预估**: 3h

### 4.3 SSE 连接健壮性

**文件**: `lib/canvas/api/canvasSseApi.ts`

**现状**: SSE 连接断开后依赖 `sessionStore.sseStatus` 状态，但重连逻辑不够健壮。

**行动**:
1. 添加自动重连（指数退避：1s → 2s → 4s → 8s → max 30s）
2. 重连时恢复 `Last-Event-ID`（避免丢失事件）
3. 连接超时检测（30s 无事件 → 视为断连）
4. `abortGeneration()` 确保清理 EventSource

**预估**: 3h

### 4.4 并发控制

**问题**: 用户快速点击"生成"可能触发多个并发请求。

**行动**:
1. 在 `sessionStore` 中添加 `isGenerating` 锁
2. 生成中禁用"生成"按钮
3. 新请求自动 abort 前一个未完成的请求

**预估**: 2h

---

## Phase 5: 高级特性（5-7天）

> 目标：功能增强，提升产品竞争力。

### 5.1 实时协作冲突解决

**现状**: `Project.version` 字段支持乐观锁，前端有 `versionCheckInterval`，但冲突解决 UI 未实现。

**行动**:
1. 后端 409 响应包含当前版本数据
2. 前端弹出 `ConflictDialog`（三路合并或覆盖选择）
3. 自动保存间隔从 30s 可配置
4. 离线编辑队列 + 上线后同步

**预估**: 8h

### 5.2 原型生成进度推送

**现状**: 原型生成使用 5s 轮询 `GET /api/v1/canvas/status`。

**行动**:
1. 后端添加 SSE 端点 `GET /api/v1/canvas/generate/stream`
2. 推送每个页面的生成进度（0% → 100%）
3. 前端替换轮询为 SSE 订阅
4. 生成完成时推送代码预览

**预估**: 6h

### 5.3 导出功能增强

**文件**: `vibex-backend/src/app/api/v1/canvas/export/route.ts`

**现状**: 手写 tar 格式实现（`writeTarHeader`），只支持 `.tar.gz`。

**行动**:
1. 替换手写 tar 为 `archiver` 库
2. 支持 ZIP 格式导出
3. 添加项目 README.md 自动生成
4. 添加 `docker-compose.yml` 模板
5. 导出包含环境配置文件（`.env.example`）

**预估**: 4h

### 5.4 智能关系推断增强

**文件**: `lib/canvas/utils/inferRelationships.ts`

**现状**: 边计算基于 context type 的硬编码规则（core↔supporting = dependency 等）。

**行动**:
1. 利用 AI 生成结果中的 `relationships` 字段（`ContextRelationship` 类型已定义）
2. 支持用户手动添加/删除关系线
3. 关系类型扩展：`dependency` / `aggregate` / `calls` / `publishes` / `shared_kernel`
4. 关系权重影响布局算法

**预估**: 6h

### 5.5 模板系统完善

**文件**: `lib/canvas/templateLoader.ts`

**现状**: 模板系统基础存在，但模板数量少，且与 mock 数据重复。

**行动**:
1. 扩展行业模板（电商/SaaS/社交/医疗/教育）
2. 模板包含预定义的三棵树数据
3. 支持用户保存自定义模板
4. 模板评分和推荐

**预估**: 8h

---

## 优先级矩阵

| Phase | 影响 | 工时 | 风险 | 推荐顺序 |
|-------|------|------|------|----------|
| **Phase 0: 清理** | 低 | 4h | 零 | ① 立即做 |
| **Phase 1: 数据层** | 极高 | 19h | 中 | ② 核心改进 |
| **Phase 4: 可靠性** | 高 | 11h | 低 | ③ 生产必备 |
| **Phase 2: 组件拆分** | 中 | 18h | 低 | ④ 可维护性 |
| **Phase 3: 性能** | 中 | 10h | 低 | ⑤ 按需 |
| **Phase 5: 高级特性** | 高 | 32h | 中 | ⑥ 产品规划 |

**建议执行顺序**: 0 → 1 → 4 → 2 → 3 → 5

理由：
- Phase 0 零风险热身，建立信心
- Phase 1 是架构根基，越早做技术债越少
- Phase 4 让系统生产就绪
- Phase 2/3 在数据层稳定后做更安全
- Phase 5 是产品功能，按业务优先级排期

---

## 工时汇总

| Phase | 工时 | 累计 |
|-------|------|------|
| Phase 0 | 4h | 4h |
| Phase 1 | 19h | 23h |
| Phase 2 | 18h | 41h |
| Phase 3 | 10h | 51h |
| Phase 4 | 11h | 62h |
| Phase 5 | 32h | 94h |

**最小可行改进（Phase 0 + 1 + 4）**: 34h ≈ **4-5 个工作日**
**完整优化**: 94h ≈ **12 个工作日**
