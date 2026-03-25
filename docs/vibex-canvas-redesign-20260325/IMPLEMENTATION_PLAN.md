# VibeX Canvas — 实施计划

**项目**: vibex-canvas-redesign-20260325
**日期**: 2026-03-25
**角色**: architect

---

## 概述

基于 `architecture.md`，按 Epic 分 3 批 PR 实施。P0 功能（Epic 1-6）按依赖顺序开发，每批 PR 必须独立可回滚。

**关键约束**：
- MVP 目标：单页三树并行 + 原型队列 + zip 导出
- CardTreeRenderer 核心引擎保留，只做数据适配
- 现有 `confirmationStore` 保留，双 store 过渡
- 每批 PR 必须 `pnpm tsc --noEmit` 通过

---

## PR 批次规划

### Batch 1: 画布基础设施（Epic 1）

**目标**: 完成画布骨架 + PhaseProgressBar + TreePanel + 阶段联动

**文件变更**:
```
+ app/canvas/page.tsx
+ app/canvas/canvas.module.css
+ components/canvas/CanvasPage.tsx
+ components/canvas/PhaseProgressBar.tsx
+ components/canvas/TreePanel.tsx
+ stores/canvasStore.ts (phaseSlice + 基础 actions)
+ lib/canvas/types.ts
```

**实施步骤**:
1. 创建 `app/canvas/page.tsx`，复制 HomePage 基础布局
2. 实现 `phaseSlice`（input/context/flow/component/prototype 状态切换）
3. 实现 `PhaseProgressBar`（4 阶段，样式正确）
4. 实现 `TreePanel`（折叠/展开动画）
5. 实现激活/暗淡联动（上游确认 → 下游激活）
6. 降级 `app/page.tsx` 为引导页（保留旧 HomePage，添加 Canvas 入口按钮）

**验收**:
- [ ] `pnpm tsc --noEmit` 通过
- [ ] PhaseProgressBar 显示正确阶段
- [ ] 点击阶段可切换（不触发生成）
- [ ] TreePanel 折叠/展开正常

---

### Batch 2: 三树渲染（Epic 2-4）

**目标**: 完成三棵树的数据层 + 渲染 + 级联

**文件变更**:
```
+ components/canvas/BoundedContextTree.tsx
+ components/canvas/BusinessFlowTree.tsx (placeholder)
+ components/canvas/ComponentTree.tsx (placeholder)
+ components/canvas/layout-engine/dagreLayout.ts
+ components/canvas/layout-engine/svgRenderer.ts
+ components/canvas/layout-engine/index.ts
+ components/CardTree/adapters/contextAdapter.ts
+ components/CardTree/adapters/flowAdapter.ts
+ components/CardTree/adapters/componentAdapter.ts
+ stores/canvasStore.ts (contextSlice + flowSlice + componentSlice)
+ lib/canvas/cascade/CascadeUpdateManager.ts
+ lib/canvas/cascade/types.ts
+ lib/canvas/cascade/index.ts
```

**实施步骤**:
1. ✅ 实现 `contextSlice`（BoundedContext CRUD + confirm/edit/delete/add）
2. ✅ 实现 `flowSlice`（BusinessFlow CRUD + confirm/edit）
3. ✅ 实现 `componentSlice`（ComponentNode CRUD + preview）
4. ⏳ 集成 dagre layout engine（`dagreLayout.ts`）— Epic 3-4
5. ⏳ 扩展 `CardTreeRenderer` 数据适配器（三树支持）— Epic 3-4
6. ✅ 实现 `CascadeUpdateManager`（context→flow, context→component, flow→component）
7. ✅ 实现 BoundedContextTree 面板（AI生成mock + CRUD + 确认样式）
8. ⏳ 实现 BusinessFlowTree 面板 — Epic 3
9. ⏳ 实现 ComponentTree 面板 — Epic 4

**Epic 2 完成状态** (commit 395a44f6):
- ✅ BoundedContextTree: AI生成(mock) + CRUD + 节点确认
- ✅ Cascade: context edit/delete → flow+component pending
- ✅ Cascade: flow edit/delete → component pending
- ✅ Tree activation: context confirmed → flow activates
- ✅ 节点确认样式：黄→绿（CSS已定义）
- ✅ 3-column grid layout (≥768px) + mobile Tab模式
- ✅ 27 canvasStore tests pass
- ✅ TypeScript 0 errors

**Epic 2 遗留项**:
- BusinessFlowTree 完整实现（placeholder）→ Epic 3 ✅ (commit d76a0fae)
**Epic 3 完成状态** (commit d76a0fae):
- ✅ BusinessFlowTree: flow cards with steps, CRUD, confirm/edit/delete/reorder
- ✅ autoGenerateFlows: trigger on all-contexts-confirmed
- ✅ FlowStep actions: confirm, edit, delete, reorder (fix splice bug)
- ✅ 44 canvasStore tests pass
- ✅ TypeScript 0 errors

**Epic 4 待完成**:
- ComponentTree 完整实现（placeholder）→ Epic 4
- dagre layout engine → Epic 3-4
- CardTree adapters → Epic 3-4

**验收**:
- [x] `pnpm tsc --noEmit` 通过
- [x] 三树横向并排显示（≥768px），Tab 切换（<768px）
- [x] context 确认后 flow 树激活，component 树暗淡
- [x] context 编辑后 flow + component 标记 pending
- [x] flow 编辑后 component 标记 pending
- [x] 节点确认样式正确（黄→绿）

---

### Batch 3: 原型队列 + 导出（Epic 5-6）

**目标**: 完成原型生成队列 + zip 导出

**文件变更**:
```
+ components/canvas/PrototypeQueuePanel.tsx
+ lib/canvas/api/canvasApi.ts
+ lib/canvas/api/client.ts
+ stores/canvasStore.ts (queueSlice + project actions)
+ lib/prototype-gen/ (Python backend 扩展)
  + api/canvas/project.py
  + api/canvas/generate.py
  + api/canvas/status.py
  + api/canvas/export.py
```

**实施步骤**:
1. 实现 `queueSlice`（PrototypePage 状态 + polling 逻辑）
2. 实现 `PrototypeQueuePanel`（状态显示 + 重试按钮）
3. 实现 `canvasApi.ts`（4 个 API 端点封装）
4. 后端：实现 `/api/canvas/project`（创建项目）
5. 后端：实现 `/api/canvas/generate`（触发生成）
6. 后端：实现 `/api/canvas/status`（轮询状态）
7. 后端：实现 `/api/canvas/export`（zip 打包）
8. 集成：三树全确认 → "创建项目"可用 → 解锁队列
9. 集成：队列状态轮询 + 进度显示
10. 集成：导出 zip 下载

**验收**:
- [ ] `pnpm tsc --noEmit` 通过
- [ ] 三树全确认后"创建项目"按钮可用
- [ ] 队列状态（queued/generating/done/error）正确显示
- [ ] 单页重生成不影响其他页面
- [ ] 5s 轮询不阻塞主流程
- [ ] zip 导出成功，解压后 `npm run dev` 可启动

---

## Epic → Batch 映射

| Epic | 内容 | Batch | 优先级 | 依赖 |
|------|------|-------|--------|------|
| Epic 1 | 画布基础框架 | Batch 1 | P0 | 无 |
| Epic 2 | 限界上下文树 | Batch 2 | P0 | Batch 1 |
| Epic 3 | 业务流程树 | Batch 2 | P0 | Epic 2 |
| Epic 4 | 组件树 | Batch 2 | P0 | Epic 3 |
| Epic 5 | 原型生成队列 | Batch 3 | P0 | Epic 1-4 |
| Epic 6 | 导出功能 | Batch 3 | P0 | Epic 5 |
| Epic 7 | 状态管理（持久化） | Batch 3 | P1 | Epic 1 |

---

## 技术债务 & 后续优化

| 事项 | 时机 | 说明 |
|------|------|------|
| 废弃 `confirmationStore` | v2 | 双 store 同步稳定后废弃 |
| SSE 实时推送 | v2 | 替换 5s 轮询 |
| 后端状态持久化 | v2 | localStorage → DB |
| react-window 虚拟化 | 性能触发时 | >500 节点时启用 |
| 旧路由重定向 | v1 | `app/page.tsx` → `/canvas` 301 |

---

## 风险缓解

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| dagre 布局横向三列实现复杂度 | 高 | Batch 2 先实现单树渲染，验证后再扩展三列 |
| 级联更新遗漏边界 case | 高 | CascadeUpdateManager 100% 单元测试覆盖 |
| 导出 zip 打包失败 | 中 | 独立测试脚本验证 zip 内容 |
| 双 store 状态不一致 | 中 | 通过事件总线桥接，统一由 canvasStore 驱动 |

---

*Architect — VibeX Canvas Redesign | 2026-03-25*
