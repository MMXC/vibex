# PRD: Canvas 按钮系统清理

> **项目**: canvas-button-cleanup
> **目标**: 修复 Canvas 三栏按钮系统的 P0/P1 功能缺陷
> **来源**: analysis.md (canvas-button-cleanup)
> **PRD 作者**: PM Agent
> **日期**: 2026-04-06
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
Canvas 三栏面板（Context / Flow / Component）的按钮系统存在多处功能缺陷：
1. `BoundedContextTree` 缺少 history snapshot 记录 → 撤销/重做失效
2. `TreeToolbar` 全选/取消逻辑映射错误 → 按钮功能异常
3. 删除操作未统一记录 snapshot，store 缺少 batch delete 方法

### 目标
- P0 紧急：修复 history snapshot 缺失和按钮逻辑错误
- P1 跟进：统一删除操作 snapshot 记录，补充 batch delete 方法

### 成功指标
- AC1: Context 树操作后可正确撤销（Ctrl+Z）
- AC2: TreeToolbar 三个栏的全选/取消按钮功能正确
- AC3: 删除操作统一触发 snapshot 记录
- AC4: store 有 batch delete 方法，不再逐个删除

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | 根因关联 |
|------|------|--------|------|----------|
| E1 | BoundedContextTree History 修复 | P0 | 0.5h | #1 |
| E2 | TreeToolbar 按钮逻辑修复 | P0 | 0.5h | #2 |
| E3 | 删除操作 Snapshot 统一 | P1 | 0.5h | #3 |
| E4 | Store Batch Delete 方法 | P1 | 0.5h | #4 |
| **合计** | | | **2h** | |

---

### Epic 1: BoundedContextTree History 修复

**问题根因**: `BoundedContextTree.tsx` 中没有任何 `getHistoryStore().recordSnapshot()` 调用，导致 Context 树撤销/重做失效。

**Story**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | 补充 deleteContextNode 后 snapshot | 0.2h | 删除节点后 Ctrl+Z 可恢复 |
| S1.2 | 补充 editContextNode 后 snapshot | 0.15h | 编辑节点后 Ctrl+Z 可恢复 |
| S1.3 | 补充 addContextNode 后 snapshot | 0.15h | 新增节点后 Ctrl+Z 可删除 |

**S1.1 验收标准**:
- `expect(getHistoryStore().canUndo()).toBe(true)` after delete
- `expect(getHistoryStore().undo()).toRestoreState()`

**S1.2 验收标准**:
- `expect(getHistoryStore().canUndo()).toBe(true)` after edit
- 节点文本恢复到编辑前

**S1.3 验收标准**:
- `expect(getHistoryStore().canUndo()).toBe(true)` after add
- 新增节点在 undo 后消失

**DoD**:
- [ ] `BoundedContextTree.tsx` 在 `deleteContextNode` 后调用 `recordSnapshot`
- [ ] `BoundedContextTree.tsx` 在 `editContextNode`（节点改名/确认）后调用 `recordSnapshot`
- [ ] `BoundedContextTree.tsx` 在 `addContextNode` 后调用 `recordSnapshot`
- [ ] 手动测试：Context 树操作后 Ctrl+Z 能正确撤销

---

### Epic 2: TreeToolbar 按钮逻辑修复

**问题根因**: `CanvasPage.tsx` 中 TreeToolbar 的 `onSelectAll` 和 `onDeselectAll` 映射错误：
- Context 栏：两者都调用 `selectAllNodes('context')`
- Flow/Component 栏：两者都是空函数 `() => {}`

**Story**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | 修复 Context 栏 deselectAll | 0.15h | 点击取消按钮正确取消全选 |
| S2.2 | 修复 Flow 栏 selectAll/deselectAll | 0.15h | Flow 栏全选/取消按钮功能正确 |
| S2.3 | 修复 Component 栏 selectAll/deselectAll | 0.15h | Component 栏全选/取消按钮功能正确 |

**S2.1 验收标准**:
- `expect(onDeselectAll).toBe(deselectAllNodes)` — 对应取消全选函数
- `expect(selectedNodeIds.length).toBe(0)` after deselect

**S2.2 验收标准**:
- `expect(useFlowStore.getState().selectAllNodes).toBeDefined()`
- `expect(useFlowStore.getState().deselectAllNodes).toBeDefined()`

**S2.3 验收标准**:
- `expect(useComponentStore.getState().selectAllNodes).toBeDefined()`
- `expect(useComponentStore.getState().deselectAllNodes).toBeDefined()`

**DoD**:
- [ ] `CanvasPage.tsx` 中 Flow 栏 TreeToolbar 的 `onSelectAll` 映射到 `selectAllNodes`
- [ ] `CanvasPage.tsx` 中 Flow 栏 TreeToolbar 的 `onDeselectAll` 映射到 `deselectAllNodes`
- [ ] `CanvasPage.tsx` 中 Component 栏 TreeToolbar 同上
- [ ] `contextStore`、`flowStore`、`componentStore` 均有 `deselectAllNodes` 方法

---

### Epic 3: 删除操作 Snapshot 统一

**问题根因**: `deleteSelectedNodes` / `deleteAll` 操作未统一在删除前记录 snapshot。

**Story**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | BusinessFlowTree 删除 snapshot | 0.2h | Flow 树删除后 Ctrl+Z 可恢复 |
| S3.2 | ComponentTree 删除 snapshot | 0.2h | Component 树删除后 Ctrl+Z 可恢复 |
| S3.3 | BoundedContextTree 删除 snapshot | 0.1h | Context 树删除后 Ctrl+Z 可恢复（已在 E1 覆盖） |

**S3.1 验收标准**:
- `expect(getHistoryStore().canUndo()).toBe(true)` after delete flow nodes
- Flow 树状态在 undo 后恢复

**S3.2 验收标准**:
- `expect(getHistoryStore().canUndo()).toBe(true)` after delete component nodes
- Component 树状态在 undo 后恢复

**DoD**:
- [ ] `BusinessFlowTree.tsx` 在 `deleteSelectedNodes` 前调用 `recordSnapshot`
- [ ] `ComponentTree.tsx` 在 `deleteSelectedNodes` 前调用 `recordSnapshot`
- [ ] 手动测试：删除 Flow/Component 节点后 Ctrl+Z 能恢复

---

### Epic 4: Store Batch Delete 方法

**问题根因**: 当前使用 `forEach` 逐个删除，若有 middleware/logic 会触发 N 次副作用。

**Story**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S4.1 | contextStore.deleteAllNodes | 0.2h | 批量删除方法存在 |
| S4.2 | flowStore.deleteAllNodes | 0.15h | 批量删除方法存在 |
| S4.3 | componentStore.deleteAllNodes | 0.15h | 批量删除方法存在 |

**S4.1 验收标准**:
- `expect(typeof contextStore.deleteAllNodes).toBe('function')`
- 调用后 `expect(contextNodes.length).toBe(0)`

**DoD**:
- [ ] `contextStore` 有 `deleteAllNodes()` 方法，一次性清空
- [ ] `flowStore` 有 `deleteAllNodes()` 方法
- [ ] `componentStore` 有 `deleteAllNodes()` 方法
- [ ] 批量删除只触发一次副作用（非 N 次 forEach）

---

## 3. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | BoundedContextTree delete snapshot | E1 | expect(canUndo()).toBe(true) | 无 |
| F1.2 | BoundedContextTree edit snapshot | E1 | expect(canUndo()).toBe(true) | 无 |
| F1.3 | BoundedContextTree add snapshot | E1 | expect(canUndo()).toBe(true) | 无 |
| F2.1 | Context deselectAll 修复 | E2 | expect(selected.length).toBe(0) | 无 |
| F2.2 | Flow selectAll/deselectAll 映射 | E2 | expect(selectAll).toBeDefined() | 无 |
| F2.3 | Component selectAll/deselectAll 映射 | E2 | expect(selectAll).toBeDefined() | 无 |
| F3.1 | Flow delete snapshot | E3 | expect(canUndo()).toBe(true) | 无 |
| F3.2 | Component delete snapshot | E3 | expect(canUndo()).toBe(true) | 无 |
| F4.1 | contextStore.deleteAllNodes | E4 | expect(typeof).toBe('function') | 无 |
| F4.2 | flowStore.deleteAllNodes | E4 | expect(typeof).toBe('function') | 无 |
| F4.3 | componentStore.deleteAllNodes | E4 | expect(typeof).toBe('function') | 无 |

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | Context 树节点 | 删除/编辑/新增后 Ctrl+Z | 状态恢复到操作前 |
| AC2 | TreeToolbar 全选按钮 | Flow/Component 栏点击 | 对应 store 所有节点被选中 |
| AC3 | TreeToolbar 取消按钮 | Flow/Component 栏点击 | 所有节点取消选中 |
| AC4 | Flow/Component 删除 | deleteSelectedNodes 后 | history canUndo = true |
| AC5 | Store batch delete | 调用 deleteAllNodes | 节点清空，副作用只触发一次 |

---

## 5. DoD (Definition of Done)

### E1: BoundedContextTree History 修复
- [ ] `BoundedContextTree.tsx` 三处操作（delete/edit/add）后均调用 `recordSnapshot`
- [ ] 手动测试 Context 树撤销功能正常

### E2: TreeToolbar 按钮逻辑修复
- [ ] Flow/Component 栏 TreeToolbar 的 selectAll/deselectAll 正确映射
- [ ] 三个 store 均有 deselectAllNodes 方法

### E3: 删除操作 Snapshot 统一
- [ ] BusinessFlowTree/ComponentTree 删除前调用 recordSnapshot
- [ ] 手动测试 Flow/Component 树撤销功能正常

### E4: Store Batch Delete 方法
- [ ] 三个 store 均有 deleteAllNodes 方法
- [ ] 批量删除副作用只触发一次

---

## 6. 实施计划

### Sprint 1 (全部 P0/P1, 2h)

| Epic | 内容 | 工时 |
|------|------|------|
| E1 | BoundedContextTree History 修复 | 0.5h |
| E2 | TreeToolbar 按钮逻辑修复 | 0.5h |
| E3 | 删除操作 Snapshot 统一 | 0.5h |
| E4 | Store Batch Delete 方法 | 0.5h |

---

## 7. 非功能需求

| 需求 | 描述 |
|------|------|
| 性能 | 批量删除不引入 O(n) 循环开销 |
| 兼容性 | 不破坏现有 Ctrl+Z 行为 |
| 可测试性 | 每处 snapshot 均有对应 jest 单元测试 |

---

## 8. 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| snapshot 重复记录 | 在组件层统一调用，store 层不重复 |
| 批量删除遗漏中间状态 | 使用事务性更新，失败回滚 |

---

*文档版本: v1.0 | 最后更新: 2026-04-06*
