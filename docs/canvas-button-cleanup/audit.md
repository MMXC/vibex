# Canvas 三栏按钮现状审计 & 问题清单

**基准**: `5526381d` (2026-04-06 pull)

---

## 一、按钮来源分层

当前按钮来自 **三个层级**，互相重复、互相矛盾：

```
层级 1: TreeToolbar (统一工具栏) — 通过 TreePanel.headerActions 注入
层级 2: 各 Tree 组件内部的 contextTreeControls / treeHeader — 硬编码在组件内
层级 3: CanvasPage.tsx extraButtons — 通过 TreeToolbar.extraButtons 注入
```

**核心问题**: 同一个功能在 2-3 个地方各实现了一遍，事件绑定还不一致。

---

## 二、逐栏按钮清单

### 2.1 限界上下文树 (Context Tree)

#### 层级 1: TreeToolbar (TreePanel.headerActions)

| 按钮 | 文案 | 绑定事件 | 问题 |
|------|------|----------|------|
| 全选 | `✓ 全选` | `useContextStore.getState().selectAllNodes?.('context')` | ✅ 正确 |
| 取消 | `○ 取消` | `useContextStore.getState().selectAllNodes?.('context')` | ❌ **BUG: 绑错了！调的是 selectAllNodes 而不是 clearNodeSelection** |
| 清空 | `✕ 清空` | `useContextStore.getState().setContextNodes([])` | ⚠️ 直接设空数组，**跳过 history 快照**，无法撤销 |
| 继续 | `→ 继续 → 流程树` | `autoGenerateFlows(contextNodes.filter(c => c.isActive !== false))` | ⚠️ 传的是 isActive 节点，**没考虑 selectedNodeIds** |

#### 层级 3: extraButtons (CanvasPage.tsx)

| 按钮 | 文案 | 绑定事件 | 问题 |
|------|------|----------|------|
| 重新生成 | `🔄 重新生成` | 硬编码两个 draft → `setContextNodes(newCtxs)` | ❌ **不是真正的重新生成**，是插入两个写死的 mock 节点，且**跳过 history** |

#### 层级 2: BoundedContextTree 内部 (contextTreeControls)

| 按钮 | 文案 | 绑定事件 | 问题 |
|------|------|----------|------|
| 重新执行 | `◈ 重新执行` | `handleGenerate` → `canvasApi.generateContexts(requirementText)` | ⚠️ 与层级 3 的「重新生成」**功能重复**，但这个才是真正的 AI 生成 |
| 确认所有→继续 | `✓ 已确认 → 继续到流程树` | `handleConfirmAll` → 确认全部 + `autoGenerateFlows` | ⚠️ 与层级 1 的「继续」**功能重复** |
| 手动新增 | `+ 手动新增` | `setShowAddForm(true)` | ✅ 正确 |
| 删除全部 | `删除全部` | `contextNodes.forEach(n => deleteContextNode(n.nodeId))` | ❌ **逐个删除，触发 N 次 history 快照 + N 次 toast**，且与「清空」重复 |
| 确认所有 | `确认所有` | `handleConfirmAll` | ⚠️ 与上方「确认所有→继续」**重复**（无选中时显示这个，有选中时显示上面的） |
| 取消选择 | `取消选择` | `clearNodeSelection('context')` | ⚠️ 与层级 1 的「取消」**重复** |
| 删除 (N) | `删除 (N)` | `deleteSelectedNodes('context')` | ✅ 正确 |

**上下文树按钮总计: 12 个，其中 5 个重复，2 个有 BUG**

---

### 2.2 业务流程树 (Flow Tree)

#### 层级 1: TreeToolbar (TreePanel.headerActions)

| 按钮 | 文案 | 绑定事件 | 问题 |
|------|------|----------|------|
| 全选 | `✓ 全选` | `() => {}` | ❌ **空函数，点击无响应** |
| 取消 | `○ 取消` | `() => {}` | ❌ **空函数，点击无响应** |
| 清空 | `✕ 清空` | `useFlowStore.getState().setFlowNodes([])` | ⚠️ **跳过 history**，无法撤销 |
| 继续 | `继续 → 组件树` | `handleContinueToComponents` (CanvasPage 版) | ⚠️ 与层级 2 的同名按钮**重复**，两处各有一份实现 |

#### 层级 2: BusinessFlowTree 内部 (treeHeader + multiSelectControls)

| 按钮 | 文案 | 绑定事件 | 问题 |
|------|------|----------|------|
| 添加流程 | `+ 添加流程` | `handleManualAdd` → `addFlowNode(...)` | ✅ 正确 |
| 重新生成流程树 | `🔄 重新生成流程树` | `handleRegenerate` → `autoGenerateFlows(contextNodes)` | ⚠️ 基于全部 contextNodes，**没考虑 selectedNodeIds** |
| 继续·组件树 | `继续·组件树` | `handleContinueToComponents` (BusinessFlowTree 内部版) | ⚠️ 与层级 1 的「继续」**重复**，且两份实现逻辑略有不同 |
| 全选 | `全选` | `selectAllNodes('flow')` | ❌ **contextStore.selectAllNodes 对 flow 分支直接 return s，什么都不做** |
| 取消选择 | `取消选择` | `clearNodeSelection('flow')` | ❌ **contextStore.clearNodeSelection 对 flow 分支直接 return s，什么都不做** |
| 删除 (N) | `删除 (N)` | `deleteSelectedNodes('flow')` | ❌ **contextStore.deleteSelectedNodes 只处理 context 分支，flow 分支无实现** |

**流程树按钮总计: 9 个，其中 3 个重复，4 个无响应/空实现**

---

### 2.3 组件树 (Component Tree)

#### 层级 1: TreeToolbar (TreePanel.headerActions)

| 按钮 | 文案 | 绑定事件 | 问题 |
|------|------|----------|------|
| 全选 | `✓ 全选` | `useComponentStore.getState().selectAllNodes?.()` | ✅ 正确 |
| 取消 | `○ 取消` | `useComponentStore.getState().clearNodeSelection?.()` | ✅ 正确 |
| 清空 | `✕ 清空` | `useComponentStore.getState().setComponentNodes([])` | ⚠️ **跳过 history**，且没用 `clearComponentCanvas()` |

#### 层级 2: ComponentTree 内部 (contextTreeControls + multiSelectControls)

| 按钮 | 文案 | 绑定事件 | 问题 |
|------|------|----------|------|
| AI 生成组件 | `◈ AI 生成组件` | `handleGenerate` → `canvasApi.generateComponents(...)` | ✅ 正确 |
| 重新生成组件树 | `🔄 重新生成组件树` | `handleGenerate` (同一个 handler) | ⚠️ 与「AI 生成组件」**完全相同的事件**，只是文案不同 |
| 继续到原型生成 | `继续到原型生成` | `setPhase('prototype')` | ⚠️ 只切 phase，**没有实际触发原型生成逻辑** |
| 手动新增 | `+ 手动新增` | `setShowAddForm(true)` | ✅ 正确 |
| 全选 | `⊞ 全选` | `selectAllNodes_comp()` | ⚠️ 与层级 1 的「全选」**重复** |
| 取消全选 | `⊠ 取消全选` | `clearNodeSelection_comp()` | ⚠️ 与层级 1 的「取消」**重复** |
| 清空画布 | `清空画布` | `handleClearCanvas` → `clearComponentCanvas()` | ⚠️ 与层级 1 的「清空」**重复**，但这个有 history 快照 |
| 取消选择 | `取消选择` | `clearNodeSelection_comp()` | ⚠️ 第三处重复 |
| 删除 (N) | `删除 (N)` | `deleteSelectedNodes_comp()` | ✅ 正确 |
| 全选 | `全选` | `selectAllNodes_comp()` | ⚠️ 第四处重复 |

**组件树按钮总计: 11 个，其中 6 个重复，1 个功能不完整**

---

## 三、Store 层问题

### 3.1 contextStore — flow 分支全部空实现

```typescript
// contextStore.ts line 109-136
selectAllNodes: (tree) => {
  if (tree === 'context') { /* 正确实现 */ }
  return s;  // ← flow 分支：什么都不做
},
clearNodeSelection: (tree) => {
  if (tree === 'context') { /* 正确实现 */ }
  return s;  // ← flow 分支：什么都不做
},
deleteSelectedNodes: (tree) => {
  if (tree === 'context') { /* 正确实现 */ }
  // ← flow 分支：完全没有
},
```

**影响**: 流程树的「全选」「取消」「删除选中」全部无响应。

### 3.2 flowStore — 缺少批量操作

flowStore 完全没有 `selectAllNodes`、`clearNodeSelection`、`deleteSelectedNodes` 方法。
流程树的选择状态存在 contextStore 的 `selectedNodeIds.flow` 中，但 contextStore 不操作 flowNodes。

### 3.3 componentStore — 有完整实现但被绕过

componentStore 有 `clearComponentCanvas()`（含 history），但 TreeToolbar 的「清空」直接调 `setComponentNodes([])` 跳过了它。

---

## 四、目标按钮体系

按你的要求，每栏只需 6 个按钮：

| # | 按钮 | 功能 | 事件来源 |
|---|------|------|----------|
| 1 | **全选** | 所有节点置为 active/selected | store.selectAllNodes |
| 2 | **取消** | 所有节点取消 active/selected | store.clearNodeSelection |
| 3 | **重新生成** | 根据原始需求或上游勾选节点重新生成 | AI API 调用 |
| 4 | **删除** | 删除选中节点 | store.deleteSelectedNodes |
| 5 | **重置** | 清空画布（含 history） | store.clearXxxCanvas |
| 6 | **继续** | 根据勾选节点生成下一栏 | AI API 调用 |

---

## 五、各栏按钮事件绑定规范

### 5.1 限界上下文树

| 按钮 | 应绑定事件 | 备注 |
|------|-----------|------|
| 全选 | `contextStore.selectAllNodes('context')` | 需确认：是设 isActive 还是 selectedNodeIds？当前 selectAllNodes 只设 selectedNodeIds |
| 取消 | `contextStore.clearNodeSelection('context')` | 清空 selectedNodeIds.context |
| 重新生成 | `canvasApi.generateContexts(requirementText)` → `contextStore.setContextNodes(result)` | 需带 history 快照 |
| 删除 | `contextStore.deleteSelectedNodes('context')` | 已有实现，含 history |
| 重置 | `contextStore.setContextNodes([])` + history 快照 | 当前缺失，需新增 |
| 继续 | `flowStore.autoGenerateFlows(selectedOrActiveContexts)` | 应基于 selectedNodeIds，无选中时 fallback 到 isActive |

### 5.2 业务流程树

| 按钮 | 应绑定事件 | 备注 |
|------|-----------|------|
| 全选 | **需新增**: `contextStore.selectAllNodes('flow')` 或 flowStore 自建 | 当前空实现 |
| 取消 | **需新增**: `contextStore.clearNodeSelection('flow')` 或 flowStore 自建 | 当前空实现 |
| 重新生成 | `flowStore.autoGenerateFlows(contextNodes)` | 已有实现，但应考虑 selectedNodeIds |
| 删除 | **需新增**: 删除 selectedNodeIds.flow 对应的 flowNodes | 当前空实现 |
| 重置 | `flowStore.setFlowNodes([])` + history 快照 | 当前缺失 |
| 继续 | `handleContinueToComponents(selectedOrActiveFlows)` | 应基于 selectedNodeIds |

### 5.3 组件树

| 按钮 | 应绑定事件 | 备注 |
|------|-----------|------|
| 全选 | `componentStore.selectAllNodes()` | ✅ 已有 |
| 取消 | `componentStore.clearNodeSelection()` | ✅ 已有 |
| 重新生成 | `canvasApi.generateComponents(flows)` → `componentStore.setComponentNodes(result)` | 需带 history |
| 删除 | `componentStore.deleteSelectedNodes()` | ✅ 已有 |
| 重置 | `componentStore.clearComponentCanvas()` | ✅ 已有（含 history） |
| 继续 | 触发原型生成队列 | 当前 `setPhase('prototype')` 不够，需接入实际生成逻辑 |

---

## 六、修复方案

### Step 1: 统一按钮入口 — 只保留 TreeToolbar

**删除**:
- `BoundedContextTree` 内的 `contextTreeControls` 整块
- `BusinessFlowTree` 内的 `treeHeader` 按钮区 + `multiSelectControls`
- `ComponentTree` 内的 `contextTreeControls` 整块 + `multiSelectControls`
- `CanvasPage.tsx` 的 `extraButtons`

**保留**: `TreeToolbar` 作为唯一按钮入口，6 个按钮统一渲染。

### Step 2: 修复 contextStore — 补全 flow 分支

```typescript
selectAllNodes: (tree) => {
  if (tree === 'context') { /* 已有 */ }
  if (tree === 'flow') {
    // 需要访问 flowNodes — 但 contextStore 不持有 flowNodes
    // 方案 A: contextStore 引入 flowStore（循环依赖风险）
    // 方案 B: flowStore 自建 selectAllNodes（推荐）
  }
},
```

**推荐**: flowStore 自建 `selectAllNodes`、`clearNodeSelection`、`deleteSelectedNodes`，选择状态也迁到 flowStore 内部。

### Step 3: TreeToolbar 扩展为 6 按钮

```typescript
interface TreeToolbarProps {
  treeType: TreeType;
  nodeCount: number;
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
  onReset: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
}
```

### Step 4: CanvasPage 统一绑定

```typescript
// Context Tree
<TreeToolbar
  treeType="context"
  nodeCount={contextNodes.length}
  selectedCount={selectedNodeIds.context.length}
  onSelectAll={() => contextStore.selectAllNodes('context')}
  onDeselectAll={() => contextStore.clearNodeSelection('context')}
  onRegenerate={() => regenerateContexts(requirementText)}
  onDelete={() => contextStore.deleteSelectedNodes('context')}
  onReset={() => contextStore.resetContextCanvas()}
  onContinue={() => generateFlowsFromSelected()}
/>

// Flow Tree
<TreeToolbar
  treeType="flow"
  nodeCount={flowNodes.length}
  selectedCount={flowSelectedIds.length}
  onSelectAll={() => flowStore.selectAllNodes()}
  onDeselectAll={() => flowStore.clearNodeSelection()}
  onRegenerate={() => flowStore.autoGenerateFlows(contextNodes)}
  onDelete={() => flowStore.deleteSelectedNodes()}
  onReset={() => flowStore.resetFlowCanvas()}
  onContinue={() => generateComponentsFromSelected()}
/>

// Component Tree
<TreeToolbar
  treeType="component"
  nodeCount={componentNodes.length}
  selectedCount={componentSelectedIds.length}
  onSelectAll={() => componentStore.selectAllNodes()}
  onDeselectAll={() => componentStore.clearNodeSelection()}
  onRegenerate={() => regenerateComponents(flowNodes)}
  onDelete={() => componentStore.deleteSelectedNodes()}
  onReset={() => componentStore.clearComponentCanvas()}
  onContinue={() => triggerPrototypeGeneration()}
/>
```

---

## 七、问题汇总

| 类型 | 数量 | 详情 |
|------|------|------|
| 按钮重复 | **14 处** | 三栏合计 32 个按钮，去重后只需 18 个 |
| 事件绑定错误 | **2 处** | Context「取消」绑成 selectAllNodes；Flow「全选/取消」是空函数 |
| Store 空实现 | **3 处** | contextStore 的 flow 分支 selectAll/clear/delete 全空 |
| 跳过 history | **3 处** | 三栏的「清空」都直接 setXxxNodes([]) 无快照 |
| 功能缺失 | **4 处** | Flow 缺 selectAll/clear/delete/reset；Context 缺 reset |
| 重复实现 | **2 处** | handleContinueToComponents 在 CanvasPage 和 BusinessFlowTree 各一份 |
| Mock 假按钮 | **1 处** | Context「重新生成」extraButton 是硬编码 mock 数据 |
