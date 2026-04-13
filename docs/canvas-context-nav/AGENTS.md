# AGENTS.md: vibex-canvas-context-nav（v2）

> **Project**: vibex-canvas-context-nav
> **Date**: 2026-04-13
> **Architect**: architect
> **Status**: v2（修复 9 个 blocker）

---

## 执行决策

| 字段 | 值 |
|------|-----|
| **决策** | 已采纳（v2）|
| **执行项目** | vibex-canvas-context-nav |
| **执行日期** | 2026-04-13 |

---

## 1. 代码修改清单

### 1.1 TabBar.tsx — 核心变更（7 处）

**文件**: `src/components/canvas/TabBar.tsx`

**变更 1 — 新增 import**:
```diff
+ import { useSessionStore } from '@/lib/canvas/stores/sessionStore';
+ import type { PrototypePage } from '@/lib/canvas/types';
```

**变更 2 — TABS 类型 + prototype entry**:
```diff
- const TABS: { id: TreeType; label: string; emoji: string }[] = [
+ const TABS: { id: TreeType | 'prototype'; label: string; emoji: string }[] = [
    { id: 'context', label: '上下文', emoji: '🔵' },
    { id: 'flow', label: '流程', emoji: '🔀' },
    { id: 'component', label: '组件', emoji: '🧩' },
+   { id: 'prototype', label: '原型', emoji: '🚀' },
  ];
```

**变更 3 — setPhase selector（新增）**:
```diff
  const activeTree = useContextStore((s) => s.activeTree);
  const phase = useContextStore((s) => s.phase);
+ const setPhase = useContextStore((s) => s.setPhase);   // ← 新增

  const contextNodes = useContextStore((s) => s.contextNodes);
  const flowNodes = useFlowStore((s) => s.flowNodes);
  const componentNodes = useComponentStore((s) => s.componentNodes);
  const setActiveTree = useContextStore((s) => s.setActiveTree);

+ const prototypeCount = useSessionStore((s) => s.prototypeQueue.length); // ← 新增
```

**变更 4 — handleTabClick 参数类型 + prototype 分支**:
```diff
- const handleTabClick = (tabId: TreeType) => {
+ const handleTabClick = (tabId: TreeType | 'prototype') => {
+   if (tabId === 'prototype') {
+     setPhase('prototype');
+     setActiveTree(null);
+     return;
+   }
    // existing phase guard for tree tabs
    const tabIdx = PHASE_ORDER.indexOf(tabId);
    if (tabIdx > phaseIdx) return;
    setActiveTree(tabId);
    onTabChange?.(tabId);
  };
```

**变更 5 — prototype tab 的 isActive（关键修正）**:
```diff
-   const isActive = activeTree === tab.id || (activeTree === null && tab.id === 'context');
+   const isActive =
+     tab.id === 'prototype'
+       ? phase === 'prototype'       // ← 用 phase 判断，不依赖 activeTree
+       : activeTree === tab.id || (activeTree === null && tab.id === 'context');
```

**变更 6 — prototype tab 的 isLocked**:
```diff
-   const isLocked = tabIdx > phaseIdx;
+   const isLocked = tab.id !== 'prototype' && tabIdx > phaseIdx; // prototype tab 永远不解锁
```

**变更 7 — prototype tab 计数徽章**:
```diff
+   if (tab.id === 'prototype' && prototypeCount > 0) {
+     badge = <span className={styles.tabCount}>{prototypeCount}</span>;
+   }
```

**⚠️ 关键点**: prototypeCount 来自 `useSessionStore`（不是 `useContextStore`），`prototypeQueue` 在 sessionStore 中。

---

### 1.2 TabBar.test.tsx — 测试更新

**文件**: `src/components/canvas/TabBar.test.tsx`

**变更 1 — 新增 import**:
```diff
+ import { useSessionStore } from '@/lib/canvas/stores/sessionStore';
+ import type { PrototypePage } from '@/lib/canvas/types';
```

**变更 2 — tabs 数量更新**:
```diff
- it('renders three tabs', () => {
-   expect(screen.getAllByRole('tab')).toHaveLength(3);
- });
+ it('renders four tabs', () => {
+   expect(screen.getAllByRole('tab')).toHaveLength(4);
+ });
```

**变更 3 — 新增 6 个测试**:

```typescript
it('prototype tab shows correct emoji and label', () => {
  render(<TabBar />);
  expect(screen.getByText('🚀')).toBeInTheDocument();
  expect(screen.getByText('原型')).toBeInTheDocument();
});

it('prototype tab is active when phase === prototype', () => {
  // ⚠️ activeTree 仍为 'context'，但 phase === 'prototype' 时 prototype tab 应高亮
  useContextStore.setState({ phase: 'prototype', activeTree: 'context' });
  render(<TabBar />);
  const prototypeTab = screen.getByText('原型').closest('[role="tab"]')!;
  expect(prototypeTab).toHaveAttribute('aria-selected', 'true');
});

it('prototype tab is NOT locked regardless of current phase', () => {
  useContextStore.setState({ phase: 'input', activeTree: 'context' });
  render(<TabBar />);
  const prototypeTab = screen.getByText('原型').closest('[role="tab"]')!;
  expect(prototypeTab).not.toHaveAttribute('aria-disabled', 'true');
  expect(prototypeTab).not.toBeDisabled();
});

it('clicking prototype tab calls setPhase with prototype', async () => {
  const user = userEvent.setup();
  useContextStore.setState({ phase: 'component', activeTree: 'component' });
  const setPhase = vi.fn();
  useContextStore.setState({ setPhase } as never);
  render(<TabBar />);
  await user.click(screen.getByText('原型').closest('button')!);
  expect(setPhase).toHaveBeenCalledWith('prototype');
});

// S1.3 — prototype count badge
// ⚠️ PrototypePage 字段名是 pageId 不是 id
it('prototype tab shows queue count from sessionStore', () => {
  useSessionStore.setState({
    prototypeQueue: [
      { pageId: '1', componentId: 'c1', name: 'Page1', status: 'queued', progress: 0, retryCount: 0 } as PrototypePage,
      { pageId: '2', componentId: 'c2', name: 'Page2', status: 'done', progress: 100, retryCount: 0 } as PrototypePage,
    ],
  });
  render(<TabBar />);
  expect(screen.getByText('2')).toBeInTheDocument();
});

it('prototype tab is inactive when phase !== prototype', () => {
  useContextStore.setState({ phase: 'context', activeTree: 'context' });
  render(<TabBar />);
  const prototypeTab = screen.getByText('原型').closest('[role="tab"]')!;
  expect(prototypeTab).toHaveAttribute('aria-selected', 'false');
});
```

---

### 1.3 PhaseIndicator.tsx — 核心变更（4 处）

**文件**: `src/components/canvas/features/PhaseIndicator.tsx`

**变更 1 — SWITCHABLE_PHASES 增加 prototype**:
```diff
const SWITCHABLE_PHASES = [
  { key: 'context', label: '◇ 上下文', icon: '◇', colorVar: 'var(--tree-context-color)' },
  { key: 'flow', label: '→ 流程', icon: '→', colorVar: 'var(--tree-flow-color)' },
  { key: 'component', label: '▣ 组件', icon: '▣', colorVar: 'var(--tree-component-color)' },
+ { key: 'prototype', label: '🚀 原型队列', icon: '🚀', colorVar: 'var(--tree-prototype-color)' },
];
```

**变更 2 — getCurrentPhaseMeta 增加 prototype 兜底（关键）**:
```diff
function getCurrentPhaseMeta(phase: Phase) {
- return SWITCHABLE_PHASES.find((p) => p.key === phase) ?? SWITCHABLE_PHASES[0];
+ return SWITCHABLE_PHASES.find((p) => p.key === phase)
+   ?? { key: 'prototype', label: '🚀 原型队列', icon: '🚀', colorVar: 'var(--tree-prototype-color)' };
}
```

**变更 3 — 移除 prototype 时的 return null**:
```diff
- if (phase === 'input' || phase === 'prototype') {
+ if (phase === 'input') {
    return null;
  }
+ // PhaseIndicator 在 prototype phase 可见，显示 "🚀 原型队列"
```

**变更 4 — CSS 变量（在 globals.css）**:
```diff
+ :root {
+   --tree-prototype-color: #9333ea;
+ }
```

---

### 1.4 PhaseIndicator.test.tsx — 新建文件

**文件**: `src/components/canvas/features/PhaseIndicator.test.tsx`

```typescript
import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhaseIndicator } from './PhaseIndicator';

describe('PhaseIndicator — prototype phase support', () => {
  it('renders prototype option in dropdown when phase !== prototype', async () => {
    const onPhaseChange = vi.fn();
    render(<PhaseIndicator phase="context" onPhaseChange={onPhaseChange} />);
    await userEvent.click(screen.getByRole('button', { name: /当前阶段/ }));
    expect(screen.getByText('🚀 原型队列')).toBeInTheDocument();
  });

  it('calls onPhaseChange with prototype when prototype option clicked', async () => {
    const user = userEvent.setup();
    const onPhaseChange = vi.fn();
    render(<PhaseIndicator phase="context" onPhaseChange={onPhaseChange} />);
    await user.click(screen.getByRole('button', { name: /当前阶段/ }));
    await user.click(screen.getByText('🚀 原型队列'));
    expect(onPhaseChange).toHaveBeenCalledWith('prototype');
  });

  it('renders (visible) when phase === prototype — does NOT return null', () => {
    render(<PhaseIndicator phase="prototype" onPhaseChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /当前阶段/ })).toBeInTheDocument();
  });
});
```

---

### 1.5 E2E 测试文件 — 新建

**文件**: `e2e/prototype-nav.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('vibex-canvas-context-nav — prototype phase navigation', () => {

  test('generate prototype → switch to context → return to prototype', async ({ page }) => {
    await page.goto('/canvas');

    // Advance to prototype phase
    await page.getByRole('button', { name: '快速生成' }).click();
    await page.waitForSelector('[class*="prototypePhase"]');

    // Switch to context tab
    await page.getByText('上下文').click();
    await expect(page.getByText('上下文')).toBeVisible();

    // Return via prototype tab
    await page.getByText('原型').click();
    await expect(page.locator('[class*="prototypePhase"]')).toBeVisible();
  });

  test('PhaseIndicator prototype option returns to prototype phase', async ({ page }) => {
    await page.goto('/canvas');

    // Advance to prototype
    await page.getByRole('button', { name: '快速生成' }).click();
    await page.waitForSelector('[class*="prototypePhase"]');

    // Switch away via tab
    await page.getByText('上下文').click();

    // Return via PhaseIndicator
    await page.getByRole('button', { name: /当前阶段/ }).click();
    await expect(page.getByText('🚀 原型队列')).toBeVisible();
    await page.getByText('🚀 原型队列').click();

    await expect(page.locator('[class*="prototypePhase"]')).toBeVisible();
  });

  test('state preservation: prototypePhase visible after phase switch', async ({ page }) => {
    await page.goto('/canvas');

    // Advance to prototype
    await page.getByRole('button', { name: '快速生成' }).click();
    await page.waitForSelector('[class*="prototypePhase"]');

    // Switch away and back
    await page.getByText('上下文').click();
    await page.getByText('原型').click();

    // prototypePhase container should still be visible
    await expect(page.locator('[class*="prototypePhase"]')).toBeVisible();
  });
});
```

**⚠️ 注意**: 不使用 `[class*="queueItem"]` 选择器，该 class 存在性未经验证。

---

### 1.6 globals.css — CSS 变量

**文件**: `src/app/globals.css`（或对应的 CSS 模块文件）

```css
:root {
  --tree-prototype-color: #9333ea; /* 紫色 */
}
```

---

## 2. 测试用例清单

### 单元测试（Vitest）

| # | 文件 | 测试名称 | 验收断言 |
|---|------|---------|---------|
| 1 | TabBar.test.tsx | `renders four tabs` | `expect(screen.getAllByRole('tab')).toHaveLength(4)` |
| 2 | TabBar.test.tsx | `prototype tab emoji + label` | `expect(screen.getByText('🚀')).toBeInTheDocument()` |
| 3 | TabBar.test.tsx | `prototype tab active when phase === prototype` | `expect(prototypeTab).toHaveAttribute('aria-selected', 'true')` |
| 4 | TabBar.test.tsx | `prototype tab inactive when phase !== prototype` | `expect(prototypeTab).toHaveAttribute('aria-selected', 'false')` |
| 5 | TabBar.test.tsx | `prototype tab NOT locked in phase === input` | `expect(prototypeTab).not.toBeDisabled()` |
| 6 | TabBar.test.tsx | `clicking prototype tab calls setPhase` | `expect(setPhase).toHaveBeenCalledWith('prototype')` |
| 7 | TabBar.test.tsx | `prototype tab shows queue count` | `expect(screen.getByText('2')).toBeInTheDocument()` |
| 8 | PhaseIndicator.test.tsx | `dropdown contains prototype option` | `expect(screen.getByText('🚀 原型队列')).toBeInTheDocument()` |
| 9 | PhaseIndicator.test.tsx | `onPhaseChange called with prototype` | `expect(onPhaseChange).toHaveBeenCalledWith('prototype')` |
| 10 | PhaseIndicator.test.tsx | `visible when phase === prototype` | `expect(button).toBeInTheDocument()` |

### E2E 测试（Playwright）

| # | 测试名称 | 关键选择器 |
|---|---------|-----------|
| 1 | TabBar prototype tab 完整路径 | `page.getByText('原型')` → `[class*="prototypePhase"]` |
| 2 | PhaseIndicator prototype 选项 | `[name=/当前阶段/]` → `'🚀 原型队列'` → `[class*="prototypePhase"]` |
| 3 | 状态保留 | `[class*="prototypePhase"]` 可见性 |

---

## 3. 审查检查单

### 功能验收

- [ ] TabBar 渲染 4 个 tab（含 prototype 🚀）
- [ ] prototype tab 在 `phase === 'prototype'` 时 `aria-selected="true"`（即使 `activeTree === 'context'`）
- [ ] prototype tab 在 `phase === 'input'` 时无 `aria-disabled`
- [ ] 点击 prototype tab，`setPhase('prototype')` 被调用
- [ ] prototype tab 徽章显示 `sessionStore.prototypeQueue.length`（`prototypeQueue` 来自 sessionStore）
- [ ] PhaseIndicator 在 `phase === 'prototype'` 时**可见**（不 return null）
- [ ] PhaseIndicator 下拉包含 `🚀 原型队列` 选项
- [ ] PhaseIndicator `getCurrentPhaseMeta` 对 `phase === 'prototype'` 不返回 undefined
- [ ] `--tree-prototype-color` CSS 变量已定义

### 回归检查

- [ ] TabBar phase guard 对 context/flow/component tabs 仍然生效
- [ ] TabBar `onTabChange` callback 对 prototype tab 不调用（直接 return）
- [ ] PhaseIndicator 现有 context/flow/component 下拉功能正常
- [ ] CanvasPage `phase === 'prototype'` 渲染逻辑未受影响

### TS 编译检查

- [ ] `pnpm tsc --noEmit` 无错误
- [ ] mock 使用 `pageId` 而非 `id`
- [ ] `prototypeQueue` 来自 `sessionStore`（非 `contextStore`）

### 代码质量

- [ ] TabBar 导入 `useSessionStore` + `PrototypePage` 类型
- [ ] TabBar 导入 `setPhase` from contextStore
- [ ] PhaseIndicator `getCurrentPhaseMeta` 有 prototype 兜底
- [ ] 无 `any` 类型泄漏
- [ ] 无 `// TODO` / `// FIXME` 遗留

---

## 4. 执行命令

```bash
# 1. TypeScript 检查（先做）
npx tsc --noEmit

# 2. 单元测试
npx vitest run src/components/canvas/TabBar.test.tsx
npx vitest run src/components/canvas/features/PhaseIndicator.test.tsx

# 3. E2E 测试（需 dev server）
npx playwright test e2e/prototype-nav.spec.ts

# 4. 覆盖率
npx vitest run --coverage src/components/canvas/TabBar.test.tsx
```

---

## 5. 关键参考文件

| 文件 | 操作 |
|------|------|
| `src/components/canvas/TabBar.tsx` | 修改（7 处）|
| `src/components/canvas/TabBar.test.tsx` | 修改（6 个新测试）|
| `src/components/canvas/features/PhaseIndicator.tsx` | 修改（4 处）|
| `src/components/canvas/features/PhaseIndicator.test.tsx` | 新建 |
| `e2e/prototype-nav.spec.ts` | 新建 |
| `src/app/globals.css` | 修改（CSS 变量）|
| `src/lib/canvas/types.ts` | 只读（PrototypePage 定义，字段名 pageId）|
| `src/lib/canvas/stores/sessionStore.ts` | 只读（prototypeQueue 在此）|
| `src/lib/canvas/stores/contextStore.ts` | 只读（setPhase/phase 在此）|
