# Canvas 按钮审查与清理 — Implementation Plan

> **项目**: vibex-canvas-button-audit-proposal
> **角色**: Architect
> **日期**: 2026-04-10
> **版本**: v1.0

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: vibex-canvas-button-audit-proposal
- **执行日期**: 2026-04-10

---

## 1. Sprint 拆分

| Sprint | 问题 | 预计工时 | 目标 |
|--------|------|----------|------|
| Sprint 1 | P0（Flow undo 修复）+ P1（语义统一） | 1.0h | 消除数据丢失风险 + UX 一致性 |
| Sprint 2 | P2（统一 confirm 弹窗） | 1.5h | 防止误操作，统一的 UX |
| Sprint 3 | P3（重新生成文案）+ P4（重置语义） | 0.5h | 信息清晰，消除歧义 |
| Sprint 4 | P5（ProjectBar 按钮收拢设计方案） | 0.5h | 仅设计稿，不含实现 |

---

## 2. Sprint 1: P0 + P1（1.0h）

### 2.1 Epic 1: P0 — Flow 树批量删除 undo 修复（0.5h）

**文件**: `vibex-fronted/src/lib/canvas/stores/contextStore.ts`

#### 详细步骤

**Step 1: 定位问题代码**
```bash
grep -n "tree === 'flow'" vibex-fronted/src/lib/canvas/stores/contextStore.ts
```

**Step 2: 修改 deleteSelectedNodes**
```typescript
// contextStore.ts — 修复前
if (tree === 'flow' && selectedNodeIds.flow.length > 0) {
  // ❌ 只清空了选择状态，没有删除 flowStore 中的节点
  set({ selectedNodeIds: { ...selectedNodeIds, flow: [] } });
}

// contextStore.ts — 修复后
if (tree === 'flow' && selectedNodeIds.flow.length > 0) {
  // ✅ 调用 flowStore 的批量删除（内部已有 recordSnapshot）
  useFlowStore.getState().deleteSelectedNodes();
  // ✅ 清空 flow 选择状态
  set({ selectedNodeIds: { ...selectedNodeIds, flow: [] } });
  return;
}
```

**Step 3: 验证 flowStore.deleteSelectedNodes 已有 recordSnapshot**
确认 `flowStore.ts` 中：
```typescript
deleteSelectedNodes: () => {
  set((s) => {
    const selected = s.selectedNodeIds;
    if (selected.size === 0) return {};
    const remaining = s.flowNodes.filter((n) => !selected.has(n.nodeId));
    getHistoryStore().recordSnapshot('flow', remaining); // ✅ 已存在
    return { flowNodes: remaining, selectedNodeIds: new Set() };
  });
},
```

**Step 4: Jest 单元测试**
```bash
pnpm --filter vibex-fronted test --testPathPattern="flowStore" --coverage
```

**Step 5: E2E 验证**
```bash
pnpm --filter vibex-fronted playwright test --testPathPattern="canvas-button"
# 验证: 批量删除 Flow 节点 → Ctrl+Z → 节点恢复
```

#### 回滚方案

```bash
git checkout HEAD -- vibex-fronted/src/lib/canvas/stores/contextStore.ts
```

**回滚判定条件**:
- Flow 批量删除后节点未删除
- Ctrl+Z 后节点未恢复
- Jest 测试失败率 > 20%

#### 成功标准

- [ ] `contextStore.deleteSelectedNodes('flow')` 调用 `flowStore.deleteSelectedNodes()`
- [ ] 批量删除 Flow 节点后 Ctrl+Z 可撤销
- [ ] `flowStore.test.ts` P0 用例全部通过
- [ ] Playwright E2E 测试通过

---

### 2.2 Epic 2: P1 — 三树 Toolbar 语义统一（0.5h）

**文件**: `vibex-fronted/src/components/canvas/TreeToolbar.tsx`

#### 详细步骤

**Step 1: 分析当前 Toolbar 文案**
当前三树 Toolbar 文案：
- `✓ 全选` — 保持不变
- `○ 取消` — **改为 "取消选择"**
- `✕ 清空` — **改为 "✕ 清空画布"**
- `↺ 重置` — **改为 "↺ 清空流程"**（仅 Flow 树）

**Step 2: 修改 TreeToolbar.tsx**

方案 A — 动态文案（推荐）：
```tsx
interface TreeToolbarProps {
  // ...existing
  treeLabel?: string; // 新增: "上下文树" / "流程树" / "组件树"
}

// 计算动态文案
const clearLabel = treeLabel ? `✕ 清空${treeLabel}` : '✕ 清空画布';
const resetLabel = '↺ 清空流程'; // Flow 树专属
```

方案 B — 硬编码（简单）：
```tsx
// 直接修改 aria-label 和 title
<button
  type="button"
  className={styles.toolbarButton}
  onClick={onDeselectAll}
  title="取消选择"
  aria-label="取消选择"
>
  ○ 取消选择
</button>

<button
  type="button"
  className={styles.toolbarButton}
  onClick={onClear}
  title="清空画布"
  aria-label="清空画布"
>
  ✕ 清空画布
</button>
```

**Step 3: 验证三树一致性**
三个树组件（`BoundedContextTree`、`BusinessFlowTree`、`ComponentTree`）使用同一个 `TreeToolbar` 组件，修改一处即全量生效。

**Step 4: Jest 单元测试**
```bash
pnpm --filter vibex-fronted test --testPathPattern="TreeToolbar"
```

#### 回滚方案

```bash
git checkout HEAD -- vibex-fronted/src/components/canvas/TreeToolbar.tsx
```

**回滚判定条件**:
- 文案与 PRD 要求不符
- Jest 测试失败

#### 成功标准

- [ ] "取消" → "取消选择"
- [ ] "清空" → "✕ 清空画布"
- [ ] 三树使用统一 `TreeToolbar` 组件，文案一致

---

## 3. Sprint 2: P2 — 统一 Confirm 弹窗（1.5h）

### 3.1 Epic 3: P2 — 新增 confirmDialogStore（1.5h）

**新增文件**: `vibex-fronted/src/stores/confirmDialogStore.ts`

#### 详细步骤

**Step 1: 创建 confirmDialogStore**
```typescript
// src/stores/confirmDialogStore.ts
import { create } from 'zustand';

export interface ConfirmDialogOptions {
  title: string;
  body: string;
  destructive?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface ConfirmDialogState {
  isOpen: boolean;
  options: ConfirmDialogOptions | null;
  resolve: ((result: boolean) => void) | null;

  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
  resolveAndClose: (result: boolean) => void;
}

export const useConfirmDialogStore = create<ConfirmDialogState>((set, get) => ({
  isOpen: false,
  options: null,
  resolve: null,

  confirm: (options) => {
    return new Promise<boolean>((resolve) => {
      set({ isOpen: true, options, resolve });
    });
  },

  resolveAndClose: (result) => {
    const { resolve } = get();
    set({ isOpen: false, options: null, resolve: null });
    resolve?.(result);
  },
}));
```

**Step 2: 创建 ConfirmDialog 组件**
```tsx
// src/components/ui/ConfirmDialog.tsx
'use client';
import { useConfirmDialogStore } from '@/stores/confirmDialogStore';
import styles from './ConfirmDialog.module.css';

export function ConfirmDialog() {
  const { isOpen, options, resolveAndClose } = useConfirmDialogStore();

  if (!isOpen || !options) return null;

  return (
    <dialog open className={styles.dialog} aria-modal="true">
      <div className={styles.content}>
        <h2 className={styles.title}>{options.title}</h2>
        <p className={styles.body}>{options.body}</p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => resolveAndClose(false)}
          >
            {options.cancelLabel ?? '取消'}
          </button>
          <button
            type="button"
            className={`${styles.confirmBtn} ${options.destructive ? styles.destructive : ''}`}
            onClick={() => resolveAndClose(true)}
          >
            {options.confirmLabel ?? '确认'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
```

**Step 3: 注册到 CanvasPage**
```tsx
// CanvasPage.tsx
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
// 在组件树中添加 <ConfirmDialog />
```

**Step 4: 修改 clearComponentCanvas**
```typescript
// componentStore.ts
clearComponentCanvas: async () => {
  const confirmed = await useConfirmDialogStore.getState().confirm({
    title: '清空组件树',
    body: `确定清空全部 ${get().componentNodes.length} 个组件节点吗？此操作不可撤销。`,
    destructive: true,
    confirmLabel: '确认清空',
  });
  if (!confirmed) return;
  getHistoryStore().recordSnapshot('component', []);
  set({ componentNodes: [], selectedNodeIds: [], componentDraft: null });
},
```

**Step 5: 修改 resetFlowCanvas**
```typescript
// flowStore.ts — 先重命名为 clearFlowCanvas
clearFlowCanvas: async () => {
  const confirmed = await useConfirmDialogStore.getState().confirm({
    title: '清空流程树',
    body: '确定清空全部流程节点吗？此操作不可撤销。',
    destructive: true,
    confirmLabel: '确认清空',
  });
  if (!confirmed) return;
  getHistoryStore().recordSnapshot('flow', []);
  set({ flowNodes: [], selectedNodeIds: new Set() });
},
```

**Step 6: Jest 覆盖率测试**
```bash
pnpm --filter vibex-fronted test --testPathPattern="confirmDialogStore" --coverage
# 目标: > 90%
```

#### 回滚方案

```bash
# 回滚 confirmDialogStore
git checkout HEAD -- vibex-fronted/src/stores/confirmDialogStore.ts
# 回滚使用处
git checkout HEAD -- vibex-fronted/src/lib/canvas/stores/componentStore.ts
git checkout HEAD -- vibex-fronted/src/lib/canvas/stores/flowStore.ts
```

**回滚判定条件**:
- confirmDialogStore 测试失败
- 清空操作不弹出对话框
- `window.confirm` 仍在使用

#### 成功标准

- [ ] `confirmDialogStore.test.ts` 覆盖率 > 90%
- [ ] `componentStore.clearComponentCanvas` 使用 `confirmDialogStore`
- [ ] `flowStore.clearFlowCanvas` 使用 `confirmDialogStore`
- [ ] 无 `window.confirm` 调用
- [ ] destructive 模式确认按钮为红色

---

## 4. Sprint 3: P3 + P4（0.5h）

### 4.1 Epic 4: P3 — 重新生成按钮 tooltip（0.2h）

**文件**: `vibex-fronted/src/components/canvas/BusinessFlowTree.tsx`

#### 详细步骤

**Step 1: 定位重新生成按钮**
```bash
grep -n "重新生成\|regenerate" vibex-fronted/src/components/canvas/BusinessFlowTree.tsx
```

**Step 2: 添加 tooltip**
```tsx
// 修复前
<button
  type="button"
  className={styles.secondaryButton}
  onClick={handleRegenerate}
  disabled={flowGenerating}
>
  {flowGenerating ? '◌ 重新生成中...' : '🔄 重新生成流程树'}
</button>

// 修复后
<button
  type="button"
  className={styles.secondaryButton}
  onClick={handleRegenerate}
  disabled={flowGenerating}
  title="基于已确认上下文重新生成，清空后重建"
>
  {flowGenerating ? '◌ 重新生成中...' : '🔄 重新生成'}
</button>
```

#### 成功标准

- [ ] 按钮文案改为 "🔄 重新生成"
- [ ] `title` 属性说明覆盖行为
- [ ] tooltip 包含"清空后重建"

---

### 4.2 Epic 5: P4 — 重置语义明确化（0.3h）

**文件**:
- `vibex-fronted/src/lib/canvas/stores/flowStore.ts`
- `vibex-fronted/src/components/canvas/TreeToolbar.tsx`

#### 详细步骤

**Step 1: flowStore — rename resetFlowCanvas → clearFlowCanvas**
```typescript
// flowStore.ts
// 重命名 resetFlowCanvas → clearFlowCanvas
clearFlowCanvas: () => { // docstring: 清空流程树所有节点（不可恢复性操作，建议配合 confirmDialogStore 使用）
  getHistoryStore().recordSnapshot('flow', []);
  set({ flowNodes: [], selectedNodeIds: new Set() });
},
```

**Step 2: TreeToolbar — reset 文案 + tooltip**
```tsx
// TreeToolbar.tsx — 已有 onReset prop，修改文案
{onReset && (
  <button
    type="button"
    className={styles.toolbarButton}
    onClick={onReset}
    title="清空当前树所有节点（配合 Ctrl+Z 可撤销）"
    aria-label="清空流程"
  >
    ↺ 清空流程
  </button>
)}
```

#### 成功标准

- [ ] `resetFlowCanvas` 重命名为 `clearFlowCanvas`
- [ ] TreeToolbar 中 reset 按钮文案为 "↺ 清空流程"
- [ ] tooltip 说明撤销能力

---

## 5. Sprint 4: P5 — ProjectBar 按钮收拢设计（0.5h）

> ⚠️ **注意**: 本 Sprint 仅产出设计方案（文字描述 + Figma 链接），不包含实现代码。

### 5.1 Epic 6: P5 — ProjectBar 按钮收拢设计方案

#### 5.1.1 现状分析（E6 设计）

当前 ProjectBar 按钮清单（共 11 个）：

| # | 按钮名称 | 组件 | 位置 | 当前状态 |
|---|----------|------|------|----------|
| 1 | 项目名称 | `<input>` | 左侧 | 始终可见 |
| 2 | UndoRedo | `<UndoRedoButtons>` | 工具栏左 | 始终可见 |
| 3 | 搜索 | `<button>` | 工具栏 | 始终可见 |
| 4 | 需求抽屉 | `<LeftDrawerToggle>` | 工具栏 | 始终可见（Drawer 打开时高亮） |
| 5 | 消息抽屉 | `<MessageDrawerToggle>` | 工具栏 | 始终可见（Drawer 打开时高亮） |
| 6 | 导出菜单 | `<ExportMenu>` | 工具栏 | 始终可见 |
| 7 | ZoomControls | `<ZoomControls>` | 工具栏 | 仅 canvas 上下文时可见 |
| 8 | 历史 | `<button>` | 工具栏 | 始终可见 |
| 9 | 快捷键帮助 | `<button>` | 工具栏 | 始终可见 |
| 10 | 创建项目 | `<button>` | 工具栏右 | 始终可见 |
| 11 | Project ID badge | `<span>` | 名称旁 | 始终可见 |

**问题**：工具栏按钮数量 9 个（不含 Project ID badge），视觉拥挤，缺乏优先级分层。

#### 5.1.2 按钮分类策略

| 分类 | 定义 | 可见性 | 按钮 |
|------|------|--------|------|
| **A. 信息区** | 项目元信息 | 始终 | 项目名称、Project ID badge |
| **B. 核心操作** | 高频、生产必需 | 始终可见，最多 5 个 | UndoRedo、搜索、导出、创建项目 |
| **C. 上下文工具** | 依赖画布上下文 | 有 canvas 时展示 | ZoomControls |
| **D. 次要操作** | 低频、辅助 | 收拢到 "..." 菜单 | 需求抽屉、消息抽屉、历史、快捷键帮助 |

#### 5.1.3 视觉布局规范

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [📋 项目名称     ] [ID:abc]  │ UndoRedo │ 搜索 │ 导出 │ 🚀创建 │ [⋯更多] │
└──────────────────────────────────────────────────────────────────────────────┘
                                ↑ 核心操作区（4-5 个按钮，图标+文字）
                                                                  ↑ 次要菜单
```

**间距规范**:
- 信息区与工具栏分隔：16px gap
- 工具栏按钮间距：4px（紧凑）
- 按钮内 padding：8px 12px
- 按钮高度：32px（与项目名称输入框等高）

**按钮样式**:
- 核心按钮：实心背景（primary/secondary 区分）
- 次要按钮：收起至 `⋯` 图标按钮，点击展开下拉菜单
- Drawer 打开状态：对应按钮高亮（accent color + filled）

#### 5.1.4 "⋯" 更多菜单结构

下拉菜单项：

| 菜单项 | 图标 | 快捷键 | 说明 |
|--------|------|--------|------|
| 需求输入 | 📋 | — | 打开需求抽屉 |
| 消息 | 💬 | — | 打开消息抽屉 |
| 历史 | ⏱ | — | 打开版本历史 |
| 快捷键帮助 | ⌨ | `?` | 打开快捷键面板 |

菜单定位：`⋯` 按钮右下方弹出，绝对定位。

#### 5.1.5 交互状态规范

| 状态 | 视觉表现 |
|------|----------|
| Default | 透明/次要背景 |
| Hover | 背景色加深 10%，cursor: pointer |
| Active/Pressed | 背景色加深 20% |
| Focused | 2px outline（accent color）|
| Disabled | opacity: 0.4，cursor: not-allowed |
| Drawer 打开（需求/消息） | 按钮 accent 背景色，白色图标 |
| 菜单展开 | `⋯` 图标旋转 90° 或变为 `✕` |

#### 5.1.6 响应式行为

| 断点 | 行为 |
|------|------|
| ≥ 1024px | 完整布局，4-5 个核心按钮 + `⋯` 菜单 |
| 768-1023px | 核心按钮减至 3 个，搜索图标化，`⋯` 菜单 |
| < 768px | 仅显示项目名称 + `⋯` 菜单（全部收起）|

#### 5.1.7 无障碍要求（WCAG 2.1 AA）

- 所有按钮有 `aria-label`（含打开/关闭状态区分）
- 菜单展开：`aria-expanded`、`aria-haspopup="menu"`
- 菜单项：`role="menuitem"`
- 键盘 Tab 导航顺序：信息区 → 核心按钮 → `⋯` 菜单 → 创建项目
- 菜单内：↑↓ 方向键导航，Enter/Space 激活，Esc 关闭

#### 5.1.8 快捷键规范

| 功能 | 快捷键 | 作用域 |
|------|--------|--------|
| 搜索 | `/` | 全局（Canvas）|
| Undo | `Ctrl+Z` | 全局 |
| Redo | `Ctrl+Shift+Z` / `Ctrl+Y` | 全局 |
| 快捷键帮助 | `?` | 全局 |
| 导出 | `Ctrl+E` | Canvas |
| 创建项目 | `Ctrl+Enter` | 项目名称输入框失焦时 |

#### 5.1.9 迁移路径（向后兼容）

**Phase 1（立即）**: 次要按钮移入 `⋯` 菜单，原按钮 DOM 保留，CSS 隐藏
**Phase 2（下一 Sprint）**: 删除隐藏按钮 DOM，菜单内实现完整功能

理由：避免单次变更范围过大，降低回归风险。

#### 5.1.10 设计交付物

| 交付物 | 状态 | 备注 |
|--------|------|------|
| 文字设计方案（本文档） | ✅ 已产出 | |
| Figma 设计稿 | ⏳ 待 UX Designer | 链接待补充 |
| 组件 API 草案 | ⏳ 待下一 Sprint | |
| 实现代码 | ⏳ 待下一 Sprint | Sprint 5 |

#### 5.1.11 成功标准检查单

- [ ] 工具栏可见按钮 ≤ 5 个（核心操作）
- [ ] 次要操作全部移入 `⋯` 菜单
- [ ] Drawer 打开时对应按钮高亮
- [ ] 移动端（<768px）全部收起至 `⋯`
- [ ] 无障碍：Tab 顺序、aria 属性、键盘导航
- [ ] 快捷键不冲突（搜索 `/` 优先级最高）
- [ ] Figma 链接已补充

---

*E6 设计方案产出时间: 2026-04-11 | 设计者: dev | 版本: v1.0*

#### 成功标准

- [ ] 产出文字设计方案（本文档）
- [ ] Figma 设计稿链接（待 UX）
- [ ] 不包含任何实现代码

---

## 6. Deployment Checklist

### 预部署检查
- [ ] Sprint 1-3 所有 Jest 测试通过
- [ ] 覆盖率报告核心文件 > 80%
- [ ] `pnpm lint` 无错误
- [ ] TypeScript 编译无错误
- [ ] Playwright E2E 测试通过（P0 + P2）
- [ ] 三树 undo/redo 回归测试通过

### 部署步骤

```bash
# 1. 切换到项目目录
cd /root/.openclaw/vibex

# 2. 创建分支
git checkout -b fix/canvas-button-audit-20260410

# 3. 运行全量测试
pnpm test

# 4. 运行覆盖率
pnpm --filter vibex-fronted test --coverage

# 5. 构建
pnpm --filter vibex-fronted build

# 6. Playwright E2E
pnpm --filter vibex-fronted playwright test --testPathPattern="canvas-button"

# 7. 部署 Staging
pnpm --filter vibex-fronted deploy --env staging

# 8. Staging 验证
openclaw run browse --goto "https://staging.vibex.example/canvas"
# 截图验证三树 Toolbar 文案
# 验证清空操作有 confirm 对话框
```

### Staging 验证命令

```bash
# P0: Flow 批量删除 undo
# 1. 访问 /canvas
# 2. 生成 Flow 节点 ≥ 2
# 3. 点击 "✓ 全选" → 选中所有
# 4. 点击 "删除 (N)" → 验证节点消失
# 5. Ctrl+Z → 验证节点恢复

# P1: 语义统一
# 验证 Toolbar 文案: "✓ 全选" / "○ 取消选择" / "✕ 清空画布"

# P2: Confirm 弹窗
# 点击 "✕ 清空画布" → 验证弹出对话框
# 点击 "取消" → 验证节点未删除
# 点击 "确认清空" → 验证节点删除

# P3: 重新生成 tooltip
# Hover "🔄 重新生成" → 验证 tooltip 显示

# P4: 清空流程
# Hover "↺ 清空流程" → 验证 tooltip 说明
```

---

## 7. Rollback Plan

### 回滚触发条件

| 条件 | 严重程度 | 回滚动作 |
|------|----------|----------|
| Flow 批量删除后节点未删除 | P0 | 立即回滚 Sprint 1 |
| 清空操作 confirm 破坏正常功能 | P1 | 立即回滚 Sprint 2 |
| Toolbar 文案变更影响可用性 | P1 | 立即回滚 Sprint 1 |

### 回滚命令

```bash
# 回滚到上一个稳定版本
cd /root/.openclaw/vibex
git revert HEAD --no-commit

# 分 Epic 回滚
git checkout HEAD~1 -- vibex-fronted/src/lib/canvas/stores/contextStore.ts  # Sprint 1
git checkout HEAD~1 -- vibex-fronted/src/components/canvas/TreeToolbar.tsx  # Sprint 1
git checkout HEAD~1 -- vibex-fronted/src/stores/confirmDialogStore.ts  # Sprint 2
git checkout HEAD~1 -- vibex-fronted/src/lib/canvas/stores/componentStore.ts  # Sprint 2
git checkout HEAD~1 -- vibex-fronted/src/lib/canvas/stores/flowStore.ts  # Sprint 2
git checkout HEAD~1 -- vibex-fronted/src/components/canvas/BusinessFlowTree.tsx  # Sprint 3
```

---

## 8. Success Criteria

### 量化指标

| Sprint | 指标 | 目标值 | 验证方法 |
|--------|------|--------|----------|
| Sprint 1 | Flow 批量删除 undo 成功率 | 100% | Playwright E2E |
| Sprint 1 | Toolbar 文案一致性 | 三树统一 | 手动验证 |
| Sprint 2 | confirmDialogStore 测试覆盖率 | > 90% | Jest coverage |
| Sprint 2 | 清空操作 confirm 覆盖率 | 100% | Jest + Playwright |
| Sprint 3 | 重新生成 tooltip 可见率 | 100% | 手动 Hover |
| Sprint 4 | 设计方案产出 | 100% | Figma 链接 |

### DoD (Definition of Done)

#### Sprint 1: P0 + P1 ✅
- [ ] `contextStore.deleteSelectedNodes('flow')` 调用 `flowStore.deleteSelectedNodes()`
- [ ] 批量删除 Flow → Ctrl+Z → 节点恢复
- [ ] Toolbar 文案: "✓ 全选" / "○ 取消选择" / "✕ 清空画布"
- [ ] 三树 Toolbar 一致

#### Sprint 2: P2 ✅
- [ ] `confirmDialogStore` 新增，测试 > 90%
- [ ] `clearComponentCanvas` 使用 `confirmDialogStore`
- [ ] `clearFlowCanvas` 使用 `confirmDialogStore`
- [ ] destructive 模式红色按钮
- [ ] 无 `window.confirm` 调用

#### Sprint 3: P3 + P4 ✅
- [ ] "重新生成" 有 tooltip
- [ ] `resetFlowCanvas` → `clearFlowCanvas` 重命名
- [ ] "↺ 清空流程" tooltip 说明撤销能力

#### Sprint 4: P5 ✅
- [ ] 文字设计方案产出
- [ ] Figma 设计稿链接（待 UX）
- [ ] 无实现代码

---

*文档版本: v1.0 | 最后更新: 2026-04-10*

---

## §E1E2 Sprint1 审查结果 (Reviewer)

**审查日期**: 2026-04-10
**审查人**: reviewer
**状态**: ✅ PASSED

### E1 — Flow Undo 修复

| 检查项 | 结果 | 证据 |
|--------|------|------|
| contextStore 调用 flowStore.deleteSelectedNodes() | ✅ | contextStore.ts:179 `useFlowStore.getState().deleteSelectedNodes()` |
| 批量删除内部有 recordSnapshot | ✅ | flowStore.ts:119 `getHistoryStore().recordSnapshot('flow', allFlows)` |
| 测试覆盖 | ✅ | flowStore.test.ts 包含 deleteSelectedNodes 测试 |
| CHANGELOG 更新 | ✅ | `### Added (vibex-canvas-button-audit E1+E2: Sprint 1)` |

### E2 — TreeToolbar 语义统一

| 检查项 | 结果 | 证据 |
|--------|------|------|
| treeType 分支处理 delete | ✅ | TreeToolbar.tsx 基于 treeType prop 分支渲染 |
| 三树 Toolbar 一致（flow/component/page） | ✅ | 统一使用 treeType prop |
| CHANGELOG 更新 | ✅ | 同上 |

### 驳回红线检查

- [ ] 无功能 commit → ❌ 不适用（原地修复）
- [x] 无 changelog 更新 → ✅ 已更新
- [x] 测试未通过 → ✅ tester 报告 PASS

**最终结论**: ✅ PASSED — E1+E2 Sprint 1 代码审查通过，CHANGELOG 已更新
