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

- [x] `confirmDialogStore` 新增，测试 > 90%
- [x] `clearComponentCanvas` 使用 `confirmDialogStore`
- [x] `clearFlowCanvas` 使用 `confirmDialogStore`
- [x] destructive 模式红色按钮
- [x] 无 `window.confirm` 调用（canvas 组件）

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

#### 详细步骤

**Step 1: 现状分析**
当前 ProjectBar 直接展示按钮：
1. 项目名称输入框
2. UndoRedo 按钮
3. 搜索按钮
4. ZoomControls（条件展示）
5. 导出菜单
6. 需求抽屉按钮
7. 消息抽屉按钮
8. 历史按钮
9. 快捷键帮助按钮
10. 创建项目按钮

**Step 2: 设计方案**

| 按钮分类 | 策略 | 按钮列表 |
|----------|------|----------|
| 核心操作（直接展示，≤5） | 始终可见 | 项目名称、UndoRedo、搜索、导出、创建项目 |
| 次要操作（收拢菜单） | 点 "..." 展示 | 需求、消息、历史、快捷键帮助 |
| 上下文相关（条件展示） | 有 canvas 时展示 | ZoomControls |

**Step 3: 产出 Figma 设计稿链接**
待 UX Designer 产出后补充 Figma 链接。

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
- [x] `contextStore.deleteSelectedNodes('flow')` 调用 `flowStore.deleteSelectedNodes()`
- [x] 批量删除 Flow → Ctrl+Z → 节点恢复
- [x] Toolbar 文案: "✓ 全选" / "○ 取消选择" / "✕ 清空画布"
- [x] 三树 Toolbar 一致

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
