# Canvas 三栏按钮系统问题分析

> **分析日期**: 2026-04-06
> **分析师**: Analyst Agent
> **项目**: canvas-button-cleanup

---

## 1. 当前状态审计

### 1.1 TreeToolbar 组件（统一工具栏）

**位置**: `src/components/canvas/TreeToolbar.tsx`

TreeToolbar 是统一的工具栏组件，通过 `headerActions` prop 注入到三个 TreePanel 中：

| 按钮 | ID | 功能 | 状态 |
|------|-----|------|------|
| ✓ 全选 | `onSelectAll` | 全选节点 | ✅ 已实现 |
| ○ 取消 | `onDeselectAll` | 取消全选 | ⚠️ 逻辑有误 |
| ✕ 清空 | `onClear` | 清空节点 | ✅ 已实现 |
| 继续 → | `onContinue` | 阶段流转 | ✅ 可选显示 |
| extraButtons | extraButtons | 自定义按钮 | ✅ 插槽设计 |

### 1.2 三栏按钮分布

#### Context 栏 (BoundedContextTree.tsx)

**headerActions（通过 TreePanel headerActions prop 传入）**：
- TreeToolbar（见上表）

**组件内额外按钮**：
- `+ 手动新增` — 手动添加节点
- `🔄 重新生成` — AI 重新生成上下文（位于 extraButtons）

**headerActions 内的继续按钮**（与 TreeToolbar 并列，非 TreeToolbar 内部）：
- `✓ 已确认 → 继续到流程树` — 全部确认后出现
- `确认所有 → 继续到流程树` — 全部未确认时显示

**multiSelectControls**：
- `{N} 已选`
- `取消选择`
- `删除 ({N})`
- `删除全部`（独立按钮，不在 multiSelectControls 内）
- `确认所有`

#### Flow 栏 (BusinessFlowTree.tsx)

**headerActions（通过 TreePanel headerActions prop 传入）**：
- TreeToolbar（见上表）

**组件内额外按钮**：
- `+ 添加流程`
- `🔄 重新生成流程树`
- `继续·组件树`

**multiSelectControls**：
- `{N} 已选`
- `取消选择`
- `删除 ({N})`
- `全选`（无选中时显示）

#### Component 栏 (ComponentTree.tsx)

**headerActions（通过 TreePanel headerActions prop 传入）**：
- TreeToolbar（见上表）

**组件内额外按钮**：
- `清空画布`（F003）
- `添加组件`（零节点时）

**multiSelectControls**：
- `{N} 已选`
- `取消选择`
- `删除 ({N})`
- `全选`（无选中时显示）

---

## 2. 问题识别

### 2.1 🔴 P0 — 严重问题

#### 问题 1: BoundedContextTree 缺少 history snapshot 记录（高风险）

**发现**: `BoundedContextTree.tsx` 中没有任何 `getHistoryStore().recordSnapshot()` 调用。

**对比**:
- `BusinessFlowTree.tsx` 第 709-710 行：拖拽排序后记录 snapshot
- `ComponentTree.tsx` 第 670-671 行：清空画布前记录 snapshot
- `BoundedContextTree.tsx`：**完全没有记录**

**影响**: Context 树的撤销/重做功能失效，用户操作无法回退。

---

### 问题 2: TreeToolbar 全选/取消逻辑错误

**发现**: CanvasPage.tsx 中：

```tsx
// Context 栏
onSelectAll={() => useContextStore.getState().selectAllNodes?.('context')}
onDeselectAll={() => useContextStore.getState().selectAllNodes?.('context')}  // ← 同样调用 selectAllNodes！

// Flow 栏
onSelectAll={() => {}}   // ← 空函数
onDeselectAll={() => {}} // ← 空函数
```

**影响**: 全选和取消按钮功能完全相同（Context 栏），Flow 栏按钮完全无效。

---

### 2.2 🟡 P1 — 功能问题

#### 问题 3: 删除操作未记录 history snapshot

即使 BusinessFlowTree 和 ComponentTree 某些操作记录了 snapshot，`deleteSelectedNodes` / `deleteAll` 操作是否记录 snapshot 未验证。

---

#### 问题 4: Store 缺少 batch delete 方法

当前删除逻辑：

```tsx
// BoundedContextTree - 删除全部
contextNodes.forEach(n => deleteContextNode(n.nodeId));
```

逐个删除 N 个节点，而不是调用 `deleteAllNodes()` 或 `clearAll()`。若有 middleware/logic 串联，会触发 N 次副作用。

---

### 2.3 🟠 P2 — 设计问题

#### 问题 5: 按钮入口分散（三处）

用户可在三处执行相同/类似操作：

| 操作 | TreeToolbar | 组件内 | TreePanel actions |
|------|-------------|--------|------------------|
| 全选 | ✓ | ✓ (multiSelectControls) | ✗ |
| 取消 | ✓ | ✓ (multiSelectControls) | ✗ |
| 删除选中 | ✗ | ✓ | ✗ |
| 删除全部 | ✗ | ✓ (Context 独有) | ✗ |
| 确认所有 | ✗ | ✓ (Context/Flow) | ✗ |
| 清空 | ✓ | ✗ | ✗ |
| 添加 | ✗ | ✓ | ✗ |
| 重新生成 | ✗ | ✓ | ✗ |
| 继续 | ✓ | ✓ | ✗ |

---

#### 问题 6: Context 栏独有"删除全部"按钮

其他栏没有 `删除全部` 按钮，只有 `删除 (N)`，设计不一致。

---

#### 问题 7: TreeToolbar 取消按钮标签误导

按钮显示"取消"，点击后实际行为是"取消全选"（deselect all），但按钮标签是 `aria-label="取消全选"`，视觉文字是"取消"。这在 Context 栏与全选功能重叠。

---

## 3. 修复方案对比

### Option A: 完整按钮审计 + 系统性整合

**目标**: 一次性解决所有按钮问题，建立统一的按钮架构。

**工作内容**:
1. 在各 store 中补充 `recordSnapshot` 调用（Context 树全链路）
2. 修复 TreeToolbar 全选/取消逻辑错误
3. 为 flowStore、componentStore 补充 batch delete 方法
4. 统一按钮入口：TreeToolbar 管理全选/取消/清空，组件内只保留业务操作
5. 移除组件内的重复 multiSelectControls（或合并到 TreeToolbar）
6. 为 BoundedContextTree 补充 history 集成

**预计工时**: 3 小时

**优点**: 彻底解决，技术债务清零
**缺点**: 改动面广，测试覆盖要求高

---

### Option B: 分优先级增量修复

**阶段 1（45min）**: 紧急修复 P0 问题
- 补充 BoundedContextTree 的 history snapshot 记录
- 修复 TreeToolbar 全选/取消逻辑

**阶段 2（45min）**: 清理 P1 问题
- 验证并修复删除操作的 history 记录
- 补充 store batch delete 方法

**预计工时**: 1.5 小时

**优点**: 风险低，见效快
**缺点**: 按钮分散问题未解决，仍有技术债务

---

## 4. 推荐方案

**推荐 Option B（增量修复）**，理由：

1. **P0 问题已识别且可快速修复**，不影响其他功能
2. **按钮分散问题属于 UX 优化**，优先级低于功能正确性
3. **3 小时投入 vs 1.5 小时投入**，对于未上线功能，优先保证功能正确
4. 后续可通过单独 Epic 解决按钮 UX 问题

**但如果团队资源充足且追求工程质量，直接选择 Option A。**

---

## 5. 验收标准

### P0 验收（必须通过）

- [ ] `BoundedContextTree.tsx` 中 `deleteContextNode`、`editContextNode`、`addContextNode` 后均有 `recordSnapshot` 调用
- [ ] Context 树执行删除/编辑操作后，`Ctrl+Z` 能正确撤销
- [ ] TreeToolbar 的 `onSelectAll` 和 `onDeselectAll` 在三个栏均正确映射（Flow/Component 栏需补充 store 方法）
- [ ] Flow 栏 TreeToolbar 的全选/取消按钮不再是无操作的空函数

### P1 验收

- [ ] `deleteSelectedNodes`、`deleteAllNodes` 后均有 `recordSnapshot` 调用
- [ ] Store 补充 `deleteAllNodes` 方法，不再使用 `forEach` 逐个删除

### P2 验收（可选）

- [ ] TreeToolbar 按钮入口与组件内按钮无功能重叠
- [ ] 三栏按钮 UX 体验一致

---

## 6. 附录：问题清单

| # | 问题 | 严重度 | 位置 | 修复方式 |
|---|------|--------|------|----------|
| 1 | BoundedContextTree 无 history snapshot | P0 | BoundedContextTree.tsx | 补充 recordSnapshot |
| 2 | TreeToolbar 全选/取消逻辑错误 | P0 | CanvasPage.tsx | 修正函数引用 |
| 3 | 删除操作未记录 history | P1 | 各 store delete 方法 | 在组件层调用前记录 |
| 4 | Store 缺少 batch delete | P1 | 各 store | 补充 deleteAllNodes |
| 5 | 按钮入口分散 | P2 | 三栏组件 | UX 重构（独立 Epic） |
| 6 | Context 栏独有"删除全部" | P2 | BoundedContextTree.tsx | 移除或统一 |
| 7 | 取消按钮标签歧义 | P2 | TreeToolbar.tsx | 视觉标签改为"取消全选" |
