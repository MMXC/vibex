# PRD: Canvas 按钮体系整合

> **项目**: canvas-button-consolidation
> **目标**: 统一 Canvas 三栏按钮体系，消除重复按钮，修复功能缺陷
> **来源**: analysis.md (canvas-button-consolidation)
> **PRD 作者**: PM Agent
> **日期**: 2026-04-06
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
Canvas 三栏面板（Context / Flow / Component）的按钮系统存在严重混乱：
- **32 个按钮**散布在 3 个层级（TreeToolbar / 组件内 / CanvasPage）
- **14 处按钮重复**、**4 处 Store 空实现**、**3 处跳过 history**
- 目标：**18 个按钮**（每栏 6 个），统一入口，统一行为

### 目标
- 统一按钮入口：只保留 TreeToolbar，删除层级 2/3 的硬编码按钮
- 修复 Store flow 分支空实现（contextStore flow 分支 + flowStore 缺失方法）
- 所有清空操作强制带 history snapshot
- 消除 mock 按钮（重新生成）

### 成功指标
- AC1: 三栏按钮数量 ≤ 6 个/栏
- AC2: TreeToolbar 全选/取消/删除/重置/继续/重新生成 功能正确
- AC3: 清空画布后可 Ctrl+Z 撤销
- AC4: 删除操作只触发一次 history 快照
- AC5: 回归验证三栏树切换正常

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | 根因关联 |
|------|------|--------|------|----------|
| E1 | TreeToolbar 按钮体系标准化 | P0 | 0.5h | 按钮分散 |
| E2 | Store flow 分支修复 | P0 | 0.5h | contextStore 空实现 |
| E3 | flowStore 批量操作补全 | P0 | 0.5h | 方法缺失 |
| E4 | 清空操作 history 强制化 | P0 | 0.3h | 跳过 snapshot |
| E5 | 重新生成按钮 mock 修复 | P1 | 0.3h | mock 数据 |
| E6 | 回归测试验证 | P1 | 0.3h | 无端到端测试 |
| **合计** | | | **2.4h** | |

---

### Epic 1: TreeToolbar 按钮体系标准化

**问题根因**: 按钮散布三层，职责边界不清。

**Story**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | 定义 6 按钮规范 | 0.1h | 按钮数量 ≤ 6/栏 |
| S1.2 | 删除组件内硬编码按钮 | 0.2h | BoundedContextTree/BusinessFlowTree/ComponentTree 无重复按钮 |
| S1.3 | 删除 CanvasPage extraButtons | 0.1h | extraButtons 不含层级 2/3 按钮 |
| S1.4 | TreeToolbar 统一渲染 6 按钮 | 0.1h | 三栏共用同一 TreeToolbar 实例 |

**S1.1 验收标准**:
- `expect(buttonCount).toBe(6)` per column
- 6 按钮：全选 / 取消 / 删除 / 重置 / 继续 / 重新生成

**S1.2 验收标准**:
- `expect(BoundedContextTree.contextTreeControls).toBeFalsy()`
- `expect(BusinessFlowTree.treeHeaderControls).toBeFalsy()`

**S1.3 验收标准**:
- `expect(CanvasPage.extraButtons.length).toBe(0)` 或不含重复按钮

**DoD**:
- [ ] 三栏 TreeToolbar 统一渲染 6 个按钮
- [ ] 组件内硬编码按钮全部删除
- [ ] CanvasPage 不注入重复按钮

---

### Epic 2: Store flow 分支修复

**问题根因**: `contextStore` 的 flow 分支全部 `return s` 空实现。

**Story**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | 修复 flow 分支 selectAllNodes | 0.15h | flow 树全选功能正确 |
| S2.2 | 修复 flow 分支 clearNodeSelection | 0.15h | flow 树取消功能正确 |
| S2.3 | 实现 flow 分支 deleteSelectedNodes | 0.2h | flow 树删除功能正确 |

**S2.1 验收标准**:
- `expect(flowStore.selectAllNodes('flow')).toUpdateStore({...})`
- flow 树所有节点变为 selected

**S2.2 验收标准**:
- `expect(flowStore.clearNodeSelection('flow')).toClearSelection()`

**S2.3 验收标准**:
- `expect(typeof flowStore.deleteSelectedNodes).toBe('function')`
- `expect(selectedNodeIds.length).toBe(0)` after delete

**DoD**:
- [ ] `contextStore.selectAllNodes` flow 分支正确处理
- [ ] `contextStore.clearNodeSelection` flow 分支正确处理
- [ ] `contextStore.deleteSelectedNodes` flow 分支正确处理
- [ ] 手动测试 flow 树全选/取消/删除功能

---

### Epic 3: flowStore 批量操作补全

**问题根因**: `flowStore` 完全没有 `selectAllNodes`、`clearNodeSelection`、`deleteSelectedNodes` 方法。

**Story**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | flowStore.selectAllNodes | 0.15h | 方法存在且正确 |
| S3.2 | flowStore.clearNodeSelection | 0.15h | 方法存在且正确 |
| S3.3 | flowStore.deleteSelectedNodes | 0.2h | 方法存在且正确 |

**S3.1 验收标准**:
- `expect(typeof flowStore.selectAllNodes).toBe('function')`
- 调用后 flowStore 所有节点 selected = true

**S3.2 验收标准**:
- `expect(typeof flowStore.clearNodeSelection).toBe('function')`
- 调用后 flowStore selectedNodeIds = []

**S3.3 验收标准**:
- `expect(typeof flowStore.deleteSelectedNodes).toBe('function')`
- 删除后 selectedNodeIds 中的节点从 flowNodes 消失

**DoD**:
- [ ] flowStore 有 selectAllNodes 方法
- [ ] flowStore 有 clearNodeSelection 方法
- [ ] flowStore 有 deleteSelectedNodes 方法
- [ ] flowStore 方法与 contextStore 接口一致

---

### Epic 4: 清空操作 history 强制化

**问题根因**: 三栏「清空」按钮直接 `setNodes([])` 跳过 history，导致无法撤销。

**Story**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S4.1 | Context 栏清空走 history | 0.1h | 走 recordSnapshot |
| S4.2 | Flow 栏清空走 history | 0.1h | 走 recordSnapshot |
| S4.3 | Component 栏清空强制调用 store 方法 | 0.1h | 调用 clearComponentCanvas 而非 setNodes([]) |

**S4.1 验收标准**:
- `expect(getHistoryStore().canUndo()).toBe(true)` after clear context
- `expect(ctrlZ).toRestoreContextNodes()`

**S4.2 验收标准**:
- `expect(getHistoryStore().canUndo()).toBe(true)` after clear flow
- `expect(ctrlZ).toRestoreFlowNodes()`

**S4.3 验收标准**:
- `expect(clearComponentCanvas).toHaveBeenCalled()` not `setComponentNodes([])`
- `expect(ctrlZ).toRestoreComponentNodes()`

**DoD**:
- [ ] 三栏清空操作统一调用 recordSnapshot
- [ ] Component 栏调用 `clearComponentCanvas()` 而非 `setComponentNodes([])`
- [ ] 手动测试三栏清空后 Ctrl+Z 可撤销

---

### Epic 5: 重新生成按钮 mock 修复

**问题根因**: 「重新生成」按钮在 Context 栏使用 mock 数据，未触发真实 AI API。

**Story**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S5.1 | Context 栏重新生成调用 AI | 0.15h | 调用 aiService.generateContext |
| S5.2 | Flow 栏重新生成调用 AI | 0.1h | 调用真实生成接口 |
| S5.3 | Component 栏重新生成调用 AI | 0.1h | 调用真实生成接口 |

**S5.1 验收标准**:
- `expect(aiService.generateContext).toHaveBeenCalled()` on 重新生成 click
- `expect(mockDataUsed).toBe(false)`

**DoD**:
- [ ] 三栏「重新生成」按钮均调用真实 AI API
- [ ] mock 数据已移除
- [ ] 手动测试三栏重新生成功能

---

### Epic 6: 回归测试验证

**问题根因**: 按钮功能无端到端测试，只有点击无响应才发现。

**Story**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S6.1 | 三栏按钮 E2E 测试 | 0.2h | Playwright 测试覆盖 |
| S6.2 | Store 批量操作单元测试 | 0.1h | jest 测试覆盖 |

**S6.1 验收标准**:
- `expect(page.locator('button:has-text("全选")').click()).toSelectAll()`
- 三栏按钮测试通过

**S6.2 验收标准**:
- `expect(flowStore.selectAllNodes()).toBeDefined()`

**DoD**:
- [ ] Playwright E2E 测试覆盖 6 按钮功能
- [ ] jest 单元测试覆盖 flowStore 批量操作
- [ ] 回归测试 100% 通过

---

## 3. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 6 按钮规范定义 | E1 | buttonCount ≤ 6 | 无 |
| F1.2 | 删除硬编码按钮 | E1 | 组件内无重复 | 无 |
| F2.1 | contextStore flow selectAll | E2 | 更新 flow 树 | 无 |
| F2.2 | contextStore flow clearSelection | E2 | 清空选择 | 无 |
| F2.3 | contextStore flow deleteSelected | E2 | 删除选中 | 无 |
| F3.1 | flowStore.selectAllNodes | E3 | 方法存在 | 无 |
| F3.2 | flowStore.clearNodeSelection | E3 | 方法存在 | 无 |
| F3.3 | flowStore.deleteSelectedNodes | E3 | 方法存在 | 无 |
| F4.1 | Context 清空 history | E4 | canUndo=true | 无 |
| F4.2 | Flow 清空 history | E4 | canUndo=true | 无 |
| F4.3 | Component 清空 history | E4 | clearComponentCanvas | 无 |
| F5.1 | Context 重新生成 AI | E5 | aiService 调用 | 无 |
| F5.2 | Flow 重新生成 AI | E5 | aiService 调用 | 无 |
| F5.3 | Component 重新生成 AI | E5 | aiService 调用 | 无 |
| F6.1 | Playwright E2E | E6 | 100% 通过 | 无 |
| F6.2 | jest 单元测试 | E6 | 100% 通过 | 无 |

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | 按钮数量 | 三栏 TreeToolbar | 每栏 ≤ 6 个 |
| AC2 | 全选按钮 | Context/Flow/Component 点击 | 所有节点 selected |
| AC3 | 取消按钮 | 点击 | 所有节点取消 selected |
| AC4 | 删除按钮 | 有选中节点时点击 | 选中节点消失 |
| AC5 | 清空按钮 | 点击 | 画布空 + canUndo=true |
| AC6 | 继续按钮 | 有选中节点时点击 | 生成下一栏内容 |
| AC7 | 重新生成按钮 | 点击 | 调用真实 AI API |
| AC8 | Ctrl+Z | 清空/删除后 | 状态恢复到操作前 |
| AC9 | 三栏树切换 | 切换 | 按钮状态正确刷新 |

---

## 5. DoD (Definition of Done)

### E1: TreeToolbar 按钮体系标准化
- [ ] 6 按钮规范：全选 / 取消 / 删除 / 重置 / 继续 / 重新生成
- [ ] 三栏 TreeToolbar 统一渲染，无层级 2/3 按钮
- [ ] 按钮数量验证 ≤ 6/栏

### E2: Store flow 分支修复
- [ ] contextStore flow 分支三个方法正确处理
- [ ] flow 树全选/取消/删除功能验证

### E3: flowStore 批量操作补全
- [ ] flowStore 三个方法全部存在且接口与 contextStore 一致

### E4: 清空操作 history 强制化
- [ ] 三栏清空统一走 recordSnapshot
- [ ] Component 栏调用 clearComponentCanvas

### E5: 重新生成按钮 mock 修复
- [ ] 三栏「重新生成」调用真实 AI API
- [ ] mock 数据已移除

### E6: 回归测试验证
- [ ] Playwright E2E 测试覆盖 6 按钮
- [ ] jest 单元测试覆盖 flowStore 方法
- [ ] 回归测试 100% 通过

---

## 6. 实施计划

### Sprint 1 (P0, 1.8h)

| Epic | 内容 | 工时 |
|------|------|------|
| E1 | TreeToolbar 按钮体系标准化 | 0.5h |
| E2 | Store flow 分支修复 | 0.5h |
| E3 | flowStore 批量操作补全 | 0.5h |
| E4 | 清空操作 history 强制化 | 0.3h |

### Sprint 2 (P1, 0.6h)

| Epic | 内容 | 工时 |
|------|------|------|
| E5 | 重新生成按钮 mock 修复 | 0.3h |
| E6 | 回归测试验证 | 0.3h |

---

## 7. 非功能需求

| 需求 | 描述 |
|------|------|
| 性能 | 批量删除不引入 O(n) 循环开销 |
| 兼容性 | 不破坏现有 Ctrl+Z 行为 |
| 可测试性 | Playwright E2E + jest 单元测试 |

---

## 8. 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| 删除按钮层级后功能遗漏 | Playwright E2E 覆盖三栏按钮 |
| history 快照重复记录 | 在组件层统一调用，store 层不重复 |
| flowStore 方法与 contextStore 不一致 | 统一接口定义，TypeScript 类型检查 |

---

*文档版本: v1.0 | 最后更新: 2026-04-06*
