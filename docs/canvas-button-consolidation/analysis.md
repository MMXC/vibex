# Canvas 按钮体系问题分析

> 来源：小羊的 Canvas 三栏按钮现状审计 (`5526381d`, 2026-04-06)

## 一、问题概述

**核心矛盾**：同一功能在 2-3 个地方各实现了一遍，事件绑定不一致。

三层按钮来源：
- **层级 1**: `TreeToolbar`（通过 `TreePanel.headerActions` 注入）
- **层级 2**: 各 Tree 组件内部的 `contextTreeControls` / `treeHeader`（硬编码）
- **层级 3**: `CanvasPage.tsx` 的 `extraButtons`（通过 `TreeToolbar.extraButtons` 注入）

当前按钮数量：32 个 → 目标：18 个（每栏 6 个）

## 二、按钮问题清单

### 2.1 限界上下文树（12 个按钮，5 个重复，2 个 BUG）

| # | 按钮 | 问题 |
|---|------|------|
| 1 | 「取消」绑定 `selectAllNodes` | BUG：绑错了，应绑 `clearNodeSelection` |
| 2 | 「清空」直接 `setContextNodes([])` | 跳过 history 快照，无法撤销 |
| 3 | 「继续」只传 `isActive` 节点 | 没考虑 `selectedNodeIds` |
| 4 | 「重新生成」extraButton 是 mock 数据 | 不是真正的 AI 生成 |
| 5 | 「删除全部」逐个删除 | 触发 N 次 history + N 次 toast |

### 2.2 业务流程树（9 个按钮，3 个重复，4 个无响应）

| # | 按钮 | 问题 |
|---|------|------|
| 1 | 「全选」「取消」 | 空函数 `() => {}`，点击无响应 |
| 2 | 「继续」重复实现 | CanvasPage 和 BusinessFlowTree 各有一份 |
| 3 | flow 分支 `selectAllNodes` | contextStore 对 flow 直接 `return s` |
| 4 | flow 分支 `clearNodeSelection` | contextStore 对 flow 直接 `return s` |
| 5 | flow 分支 `deleteSelectedNodes` | 完全没有实现 |

### 2.3 组件树（11 个按钮，6 个重复，1 个功能不完整）

| # | 按钮 | 问题 |
|---|------|------|
| 1 | 「重新生成」= 「AI 生成组件」 | 同一 handler，重复 |
| 2 | 「继续到原型生成」只切 phase | 没有触发实际原型生成逻辑 |
| 3 | 「清空」直接 `setComponentNodes([])` | 跳过了 `clearComponentCanvas()`（含 history） |

## 三、Store 层问题

### 3.1 contextStore — flow 分支全部空实现

```typescript
selectAllNodes: (tree) => {
  if (tree === 'context') { /* 正确 */ }
  return s;  // ← flow 分支：什么都不做
},
clearNodeSelection: (tree) => {
  if (tree === 'context') { /* 正确 */ }
  return s;  // ← flow 分支：什么都不做
},
deleteSelectedNodes: (tree) => {
  if (tree === 'context') { /* 正确 */ }
  // ← flow 分支：完全没有
},
```

### 3.2 flowStore — 缺少批量操作

flowStore 完全没有 `selectAllNodes`、`clearNodeSelection`、`deleteSelectedNodes` 方法。

### 3.3 componentStore — 有完整实现但被绕过

`clearComponentCanvas()`（含 history）存在，但 TreeToolbar 的「清空」直接调 `setComponentNodes([])` 跳过了它。

## 四、目标按钮体系（每栏 6 个）

| # | 按钮 | 功能 |
|---|------|------|
| 1 | 全选 | 所有节点置为 active/selected |
| 2 | 取消 | 所有节点取消 active/selected |
| 3 | 重新生成 | AI API 调用重新生成 |
| 4 | 删除 | 删除选中节点 |
| 5 | 重置 | 清空画布（含 history） |
| 6 | 继续 | 根据勾选节点生成下一栏 |

## 五、修复方案要点

1. **统一按钮入口**：只保留 TreeToolbar，删除所有层级 2/3 的按钮
2. **修复 contextStore flow 分支**：或让 flowStore 自建选择操作
3. **TreeToolbar 扩展为 6 按钮统一渲染**
4. **CanvasPage 统一绑定事件**
5. **所有清空操作必须带 history 快照**

## 六、问题统计

| 类型 | 数量 |
|------|------|
| 按钮重复 | 14 处 |
| 事件绑定错误 | 2 处 |
| Store 空实现 | 3 处 |
| 跳过 history | 3 处 |
| 功能缺失 | 4 处 |
| 重复实现 | 2 处 |
| Mock 假按钮 | 1 处 |

## 七、验证步骤与验收标准

### 7.1 功能验证

- [ ] **全选按钮**：点击后所有节点变为选中状态（三栏均需验证）
- [ ] **取消按钮**：点击后所有节点取消选中（三栏均需验证）
- [ ] **删除按钮**：删除选中节点后，节点从画布消失（三栏均需验证）
- [ ] **清空/重置按钮**：点击后画布为空，且可撤销（Ctrl+Z）
- [ ] **继续按钮**：点击后生成下一栏内容（验证 context→flow、flow→component）
- [ ] **重新生成按钮**：点击后触发 AI API 调用（三栏均需验证非 mock）

### 7.2 交互验证

- [ ] 按钮点击有视觉反馈（hover/active 状态）
- [ ] 禁用状态按钮不可点击（继续按钮无选中节点时）
- [ ] 删除/清空后 toast 提示只出现一次
- [ ] 三栏按钮数量均为 6 个或以内

### 7.3 历史记录验证

- [ ] 清空后按 Ctrl+Z 可撤销恢复节点
- [ ] 删除节点后按 Ctrl+Z 可撤销恢复
- [ ] 多选删除只触发一次 history 快照

### 7.4 回归验证

- [ ] 三栏树切换正常工作
- [ ] 节点选择、多选、取消功能正常
- [ ] AI 生成流程（context→flow→component）正常
- [ ] 画布缩放、拖拽功能正常

## 八、根因分析

### 8.1 直接原因

1. **三层按钮并行实现**：TreeToolbar、Tree 组件内部、CanvasPage 同时定义按钮
2. **Store 分支不完整**：contextStore 只处理 context 分支，flow 分支 return s
3. **历史快照缺失**：清空操作直接 set 状态，跳过 recordSnapshot

### 8.2 根本原因

1. **职责边界不清**：TreeToolbar、TreePanel、Tree 组件对按钮都有控制权
2. **Store 设计不统一**：三栏树各自 Store 实现不一致（componentStore 完整，flowStore 缺失）
3. **缺乏集成测试**：按钮功能无端到端测试，只有点击无响应才发现问题

## 九、关键文件清单

| 文件 | 作用 | 修改类型 |
|------|------|---------|
| `components/canvas/TreeToolbar.tsx` | 统一按钮渲染入口 | 扩展按钮逻辑 |
| `components/canvas/BoundedContextTree.tsx` | 限界上下文树，层级 2 按钮 | 删除硬编码按钮 |
| `components/canvas/BusinessFlowTree.tsx` | 业务流程树，层级 2 按钮 | 删除硬编码按钮 |
| `components/canvas/ComponentTree.tsx` | 组件树，层级 2 按钮 | 删除硬编码按钮 |
| `components/canvas/CanvasPage.tsx` | 层级 3 extraButtons 注入 | 统一事件绑定 |
| `lib/canvas/stores/contextStore.ts` | flow 分支空实现 | 修复 flow 分支 |
| `lib/canvas/stores/flowStore.ts` | 缺少批量操作方法 | 新增方法 |
| `lib/canvas/stores/componentStore.ts` | 有完整实现 | 确认无改动 |
| `lib/canvas/historySlice.ts` | 历史记录管理 | 确认无改动 |
