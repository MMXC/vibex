# Implementation Plan: proposals-20260401-9 — Sprint 3

**Agent**: architect
**Date**: 2026-04-02
**Project**: proposals-20260401-9
**Total**: 4 Epic, 20-27h

---

## 1. 执行概览

| Epic | 名称 | 工时 | 优先级 | 依赖 |
|------|------|------|--------|------|
| E1 | Checkbox 修复 | 4-6h | P0 | 无 |
| E2 | 消息抽屉 | 8-10h | P0 | 无 |
| E3 | 响应式布局 | 5-7h | P1 | 无 |
| E4 | 快捷键覆盖 | 3-4h | P1 | 无 |

**并行策略**: E1+E2 可并行（不同文件）；E3+E4 可并行（不同文件）

---

## 2. E1: Checkbox 修复（4-6h）

### 步骤

#### Step 1: canvasStore 新增 confirmContextNode action

**文件**: `vibex-fronted/src/lib/canvas/canvasStore.ts`

```typescript
// 新增 action
confirmContextNode: (nodeId: string) => {
  set((state) => ({
    contextNodes: state.contextNodes.map((n) =>
      n.nodeId === nodeId
        ? { ...n, isActive: true, status: 'confirmed' }
        : n
    ),
  }));
},
```

#### Step 2: BoundedContextTree ContextCard checkbox 修复

**文件**: `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`

```typescript
// 改前（第 239 行）
onChange={() => { onToggleSelect?.(node.nodeId); }}

// 改后
onChange={() => { confirmContextNode(node.nodeId); }}
```

#### Step 3: FlowCard checkbox 语义修正

**文件**: `vibex-fronted/src/components/canvas/BusinessFlowTree.tsx`

```typescript
// 移除或修正 FlowCard 顶 checkbox
// 改为调用 confirmContextNode，不调用 onToggleSelect
```

#### Step 4: SortableStepRow 新增确认 checkbox

**文件**: `vibex-fronted/src/components/canvas/BusinessFlowTree.tsx`

```typescript
// 在每个步骤行内新增确认 checkbox
// 样式: .stepConfirmCheckbox
<input
  type="checkbox"
  checked={step.status === 'confirmed'}
  onChange={() => confirmStep(step.stepId)}
  className={styles.stepConfirmCheckbox}
/>
```

#### Step 5: 新增 Vitest 测试

**文件**: `vibex-fronted/src/__tests__/canvas/checkbox-confirm.test.tsx`

```typescript
test('confirmContextNode toggles confirmed', async () => {
  // ... 4 个测试用例
})
```

---

## 3. E2: 消息抽屉（8-10h）

### 步骤

#### Step 1: 新建事件类型定义

**文件**: `vibex-fronted/src/lib/canvas/canvasEvents.ts`（新建）

```typescript
// 事件类型枚举
export type CanvasEventType = 'canvas:submit' | 'canvas:gen-context' | ...;

// 事件接口
export interface CanvasEvent {
  type: CanvasEventType;
  timestamp: number;
  payload?: unknown;
}
```

#### Step 2: canvasStore 新增 submitCanvas action

**文件**: `vibex-fronted/src/lib/canvas/canvasStore.ts`

```typescript
// 新增
submitCanvas: () => {
  const event: CanvasEvent = { type: 'canvas:submit', timestamp: Date.now() };
  console.log('[Command] /submit triggered');
  addCommandMessage('/submit', event);
  // 派发事件（可订阅）
},
openRightDrawer: () => { /* ... */ },
```

#### Step 3: CommandInput 命令触发抽屉自动展开

**文件**: `vibex-fronted/src/components/canvas/messageDrawer/CommandInput.tsx`

```typescript
// executeCommand 中新增
executeCommand: (commandId: CommandId) => {
  // ... 现有逻辑
  openRightDrawer(); // 命令执行后自动展开抽屉
}
```

#### Step 4: Playwright E2E 测试

```typescript
test('/submit triggers event', async () => { ... });
test('drawer auto-opens on command', async () => { ... });
test('filteredCmds < allCmds when node selected', async () => { ... });
```

---

## 4. E3: 响应式布局（5-7h）

### 步骤

#### Step 1: 新增 useResponsiveMode hook

**文件**: `vibex-fronted/src/hooks/useResponsiveMode.ts`（新建）

```typescript
export function useResponsiveMode() {
  const isMobile = useIsMobile();    // < 768px
  const isTablet = useIsTablet();    // 768-1279px
  const isDesktop = !isMobile && !isTablet;
  
  return {
    isMobile, isTablet, isDesktop,
    isTabMode: isMobile,
    isOverlayDrawer: isTablet || isMobile,
  };
}
```

#### Step 2: MobileDrawer 组件

**文件**: `vibex-fronted/src/components/canvas/MobileDrawer.tsx`（新建）

```typescript
// 固定 85vw，slide-in 动画，backdrop
export function MobileDrawer({ type, children }: MobileDrawerProps) {
  // z-index: 99
  // 支持 LeftDrawer / MessageDrawer 两种类型
}
```

#### Step 3: CanvasPage 响应式集成

**文件**: `vibex-fronted/src/app/canvas/page.tsx`

```typescript
const { isMobile, isTabMode } = useResponsiveMode();

// 移动端 Tab 切换
{isMobile && <TabBar />}

// 移动端/平板 drawer overlay
{(isTablet || isMobile) && (
  <>
    {leftDrawerOpen && <MobileDrawer type="left">{<LeftDrawer />}</MobileDrawer>}
    {rightDrawerOpen && <MobileDrawer type="right">{<MessageDrawer />}</MobileDrawer>}
  </>
)}
```

#### Step 4: CSS 断点覆盖

**文件**: `vibex-fronted/src/styles/canvas.module.css`

```css
/* 768-1279px: 两列布局 */
@media (min-width: 768px) and (max-width: 1279px) {
  .treePanelsGrid {
    grid-template-columns: 250px 1fr;
  }
}

/* <768px: 单列 */
@media (max-width: 767px) {
  .treePanelsGrid {
    grid-template-columns: 1fr;
  }
}
```

#### Step 5: Playwright 断点测试

```typescript
test('768px: 2 columns', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  // ...
});
test('375px: tab navigation', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  // ...
});
```

---

## 5. E4: 快捷键覆盖（3-4h）

### 步骤

#### Step 1: 扩展 useKeyboardShortcuts

**文件**: `vibex-fronted/src/hooks/useKeyboardShortcuts.ts`（新建或扩展）

```typescript
// 新增两个 handler
onConfirmSelected?: () => void;
onGenerateContext?: () => void;

// Ctrl+Shift+C
if (e.ctrlKey && e.shiftKey && e.key === 'C') {
  e.preventDefault();
  onConfirmSelected?.();
}

// Ctrl+Shift+G
if (e.ctrlKey && e.shiftKey && e.key === 'G') {
  e.preventDefault();
  onGenerateContext?.();
}
```

#### Step 2: CanvasPage 绑定

**文件**: `vibex-fronted/src/app/canvas/page.tsx`

```typescript
const { confirmSelectedNodes } = useCanvasStore();
const { generateContext } = useQuickGenerate();

useKeyboardShortcuts({
  onConfirmSelected: () => {
    selectedNodeIds.context.forEach(confirmContextNode);
  },
  onGenerateContext: () => {
    generateContext();
  },
});
```

#### Step 3: ShortcutHintPanel 更新

**文件**: `vibex-fronted/src/components/canvas/features/ShortcutHintPanel.tsx`

```typescript
const SHORTCUTS: ShortcutItem[] = [
  // ... 现有
  { keys: ['Ctrl', 'Shift', 'C'], description: '确认选中节点' },
  { keys: ['Ctrl', 'Shift', 'G'], description: '生成上下文' },
];
```

#### Step 4: Vitest + Playwright 测试

```typescript
test('Ctrl+Shift+C confirms card', async ({ page }) => { ... });
test('Ctrl+Shift+G generates context', async ({ page }) => { ... });
```

---

## 6. gstack 强制验证清单

| 验证项 | 工具 | 命令 |
|--------|------|------|
| E1: Checkbox 双向切换 | Playwright | 点击两次 checkbox，验证 confirmed 切换 |
| E1: FlowCard 子步骤联动 | Playwright | 勾选父卡片，验证子步骤 confirmed |
| E2: /submit 触发日志 | Playwright | 输入 /submit，检查控制台 |
| E2: 命令过滤 | Playwright | 点选节点后，验证命令列表变短 |
| E3: 768px 布局 | Playwright | viewport(1024,768)，截图验证两列 |
| E3: 375px Tab 导航 | Playwright | viewport(375,667)，验证 Tab 存在 |
| E4: Ctrl+Shift+C | Playwright | 按快捷键，验证卡片 confirmed |
| E4: Ctrl+Shift+G | Playwright | 按快捷键，验证上下文生成 |

---

## 7. 依赖关系

```
E1 ─┬─ canvasStore.confirmContextNode
     ├─ BoundedContextTree.tsx
     └─ BusinessFlowTree.tsx

E2 ─┬─ canvasEvents.ts（新建）
     ├─ canvasStore.submitCanvas（新增）
     └─ CommandInput.tsx

E3 ─┬─ useResponsiveMode.ts（新建）
     ├─ MobileDrawer.tsx（新建）
     └─ canvas.module.css

E4 ─┬─ useKeyboardShortcuts.ts（新建或扩展）
     ├─ CanvasPage.tsx
     └─ ShortcutHintPanel.tsx
```

---

## 8. 文件变更汇总

| 操作 | 文件数 | 文件 |
|------|--------|------|
| 新建 | 5 | canvasEvents.ts, useResponsiveMode.ts, MobileDrawer.tsx, mobileDrawer.module.css, useKeyboardShortcuts.ts |
| 修改 | 8 | canvasStore.ts, BoundedContextTree.tsx, BusinessFlowTree.tsx, CommandInput.tsx, CanvasPage.tsx, canvas.module.css, ShortcutHintPanel.tsx, TabBar.tsx |
| 删除 | 0 | 无 |
