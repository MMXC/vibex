# Implementation Plan: vibex-canvas-context-nav（v2）

> **Project**: vibex-canvas-context-nav
> **Date**: 2026-04-13
> **Architect**: architect
> **Status**: v2（修复 9 个 blocker）

---

## 变更记录（v1 → v2）

| Blocker | 问题 | 修复 |
|---------|------|------|
| B1 | PRD 用 `queuedPages`，实际是 `prototypeQueue` 且在 sessionStore | 统一使用 `prototypeQueue`，来自 `sessionStore` |
| B2 | PhaseIndicator `getCurrentPhaseMeta` 无 prototype 兜底，静默显示 undefined | 同时修改 SWITCHABLE_PHASES + getCurrentPhaseMeta 兜底 |
| B3 | TabBar prototype phase 下 isActive 永远 false（activeTree 不变）| 用 `phase === 'prototype'` 判断 isActive |
| B4 | 测试 mock 用 `id` 而非 `pageId`，TS 编译失败 | 确认 `PrototypePage.pageId` 字段，使用 `pageId` |
| B5 | PRD S2.2 与 Architecture 矛盾（PhaseIndicator prototype 应可见）| 修正 S2.2 描述，与 Architecture 一致 |
| B6 | TabBar 缺 setPhase 导入 | TabBar.tsx 新增 `const setPhase = useContextStore((s) => s.setPhase)` |
| B7 | CSS `--tree-prototype-color` 未定义 | 在 globals.css 中定义 |
| B8 | E2E 选择器 `queueItem` 未验证 | E2E 测试不依赖 `queueItem`，只验证 `prototypePhase` container |
| B9 | PhaseIndicator `return null` 包含 prototype phase | 移除 `phase === 'prototype'` 从 return null 条件 |

---

## 1. Epic Overview

| Epic | 名称 | 工时 | 依赖 | 优先级 |
|------|------|------|------|--------|
| **Epic 1** | TabBar prototype tab | 1.5h | 无 | P0 ✅ |
| **Epic 2** | PhaseIndicator prototype 选项 | 0.5h | 无 | P0 ✅ |
| **Epic 3** | 测试覆盖 | 2.0h | Epic 1+2 | P0 |
| **合计** | | **4.0h** | | |

---

## 2. Epic 1: TabBar prototype tab

### S1.1: prototype tab 渲染

**文件**: `vibex-fronted/src/components/canvas/TabBar.tsx`

**变更点**:

```typescript
// 1. 新增 import
import { useSessionStore } from '@/lib/canvas/stores/sessionStore';
import type { PrototypePage } from '@/lib/canvas/types';

// 2. TABS 类型和内容
const TABS: { id: TreeType | 'prototype'; label: string; emoji: string }[] = [
  { id: 'context', label: '上下文', emoji: '🔵' },
  { id: 'flow', label: '流程', emoji: '🔀' },
  { id: 'component', label: '组件', emoji: '🧩' },
  { id: 'prototype', label: '原型', emoji: '🚀' }, // 新增
];

// 3. 新增 selector
const setPhase = useContextStore((s) => s.setPhase);
const prototypeCount = useSessionStore((s) => s.prototypeQueue.length);

// 4. handleTabClick 参数类型和 prototype 分支
const handleTabClick = (tabId: TreeType | 'prototype') => {
  if (tabId === 'prototype') {
    setPhase('prototype');
    setActiveTree(null);
    return;
  }
  const tabIdx = PHASE_ORDER.indexOf(tabId as TreeType);
  if (tabIdx > phaseIdx) return;
  setActiveTree(tabId as TreeType);
};

// 5. prototype tab 的 isActive（关键修正）
const isActive =
  tab.id === 'prototype'
    ? phase === 'prototype'                           // ← 用 phase 判断
    : activeTree === tab.id || (activeTree === null && tab.id === 'context');

// 6. prototype tab 的 isLocked
const isLocked = tab.id !== 'prototype' && tabIdx > phaseIdx;

// 7. prototype count badge
if (tab.id === 'prototype' && prototypeCount > 0) {
  badge = <span className={styles.tabCount}>{prototypeCount}</span>;
}
```

**AC 验收标准**:
- [x] **AC-1.1.1**: `expect(screen.getAllByRole('tab')).toHaveLength(4)` ✅
- [x] **AC-1.1.2**: `expect(screen.getByText('🚀')).toBeInTheDocument()` ✅
- [x] **AC-1.1.3**: `expect(screen.getByText('原型')).toBeInTheDocument()` ✅

---

### S1.2: prototype tab phase 切换 ✅

**AC 验收标准**:
- [x] **AC-1.2.1**: `expect(prototypeTab).not.toHaveAttribute('aria-disabled', 'true')` ✅
- [x] **AC-1.2.2**: `expect(setPhase).toHaveBeenCalledWith('prototype')` ✅
- [x] **AC-1.2.3**: `phase === 'prototype' && activeTree === 'context'` → prototype tab `aria-selected="true"` ✅

---

### S1.3: prototype tab 计数徽章

**⚠️ prototypeQueue 在 sessionStore（非 contextStore）**

```typescript
// 正确（来自 sessionStore）
const prototypeCount = useSessionStore((s) => s.prototypeQueue.length);

// 错误（PRD v1 中的写法，不要用）
// const prototypeCount = useContextStore((s) => s.queuedPages?.length ?? 0);
```

**AC 验收标准**:
- [x] **AC-1.3.1**: `prototypeQueue` 长度为 2 时，`screen.getByText('2')` 可见 ✅

---

## 3. Epic 2: PhaseIndicator prototype 选项

### S2.1: prototype 选项加入下拉（多处同时修改）

**文件**: `vibex-fronted/src/components/canvas/features/PhaseIndicator.tsx`

**变更 1 — SWITCHABLE_PHASES**:
```typescript
const SWITCHABLE_PHASES = [
  { key: 'context', label: '◇ 上下文', icon: '◇', colorVar: 'var(--tree-context-color)' },
  { key: 'flow', label: '→ 流程', icon: '→', colorVar: 'var(--tree-flow-color)' },
  { key: 'component', label: '▣ 组件', icon: '▣', colorVar: 'var(--tree-component-color)' },
  { key: 'prototype', label: '🚀 原型队列', icon: '🚀', colorVar: 'var(--tree-prototype-color)' }, // 新增
];
```

**变更 2 — getCurrentPhaseMeta（关键）**:
```typescript
function getCurrentPhaseMeta(phase: Phase) {
  return SWITCHABLE_PHASES.find((p) => p.key === phase)
    ?? { key: 'prototype', label: '🚀 原型队列', icon: '🚀', colorVar: 'var(--tree-prototype-color)' };
}
```

**变更 3 — return null（移除 prototype）**:
```typescript
// Before:
if (phase === 'input' || phase === 'prototype') return null;

// After:
if (phase === 'input') return null;
// PhaseIndicator 在 prototype phase 可见，显示 "🚀 原型队列"
```

**变更 4 — CSS 变量（在 canvas.variables.css）**:
```css
:root {
  --tree-prototype-color: #9333ea;
}
```

**AC 验收标准**:
- [x] **AC-2.1.1**: `phase === 'context'` 时，下拉菜单包含 `🚀 原型队列` ✅
- [x] **AC-2.1.2**: 点击 prototype 选项，`onPhaseChange('prototype')` 被调用 ✅
- [x] **AC-2.1.3**: `phase === 'prototype'` 时，PhaseIndicator **可见**（不 return null）✅

---

## 4. Epic 3: 测试覆盖 ✅

### S3.1: TabBar prototype 测试（mock 修正）✅
**文件**: `vibex-fronted/src/components/canvas/TabBar.test.tsx` — 已更新（17/17 ✅）

### S3.2: PhaseIndicator 测试（新建）✅
**文件**: `vibex-fronted/src/components/canvas/features/PhaseIndicator.test.tsx` — 新建（5/5 ✅）

### S3.3: E2E 测试（不依赖 queueItem）✅
**文件**: `vibex-fronted/e2e/prototype-nav.spec.ts` — 新建（3 scenarios ✅）

**文件**: `vibex-fronted/src/components/canvas/TabBar.test.tsx`

```typescript
// ⚠️ PrototypePage 字段名是 pageId 不是 id
useSessionStore.setState({
  prototypeQueue: [
    {
      pageId: '1',
      componentId: 'c1',
      name: 'Page1',
      status: 'queued',
      progress: 0,
      retryCount: 0,
    } as PrototypePage,
    {
      pageId: '2',
      componentId: 'c2',
      name: 'Page2',
      status: 'done',
      progress: 100,
      retryCount: 0,
    } as PrototypePage,
  ],
});
```

### S3.2: PhaseIndicator 测试（新建）

**文件**: `vibex-fronted/src/components/canvas/features/PhaseIndicator.test.tsx`

### S3.3: E2E 测试（不依赖 queueItem）

**文件**: `vibex-fronted/e2e/prototype-nav.spec.ts`

```typescript
test('state preservation: queue visible after phase switch', async ({ page }) => {
  // 只验证 prototypePhase container，不依赖特定 class
  await page.locator('[class*="prototypePhase"]').waitFor({ state: 'visible' });
  await page.getByText('上下文').click();
  await page.getByText('原型').click();
  await expect(page.locator('[class*="prototypePhase"]')).toBeVisible();
});
```

---

## 5. 风险与缓解

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| R1: getCurrentPhaseMeta 返回 undefined | 高 | 中 | 三处同时修改（SWITCHABLE + meta + null guard）|
| R2: TabBar isActive 永远 false | 高 | 中 | `phase === 'prototype'` 判断 |
| R3: prototypeQueue 在错误 store | 中 | 中 | 确认 sessionStore（非 contextStore）|
| R4: pageId 字段名写错 | 高 | 高 | 参考 types.ts PrototypePage 定义 |
| R5: CSS 变量未定义 | 中 | 低 | 在 globals.css 定义 |
| R6: E2E queueItem class 不存在 | 低 | 低 | 不依赖 queueItem |

---

## 6. 执行决策

- **决策**: 已采纳（v2）
- **执行项目**: vibex-canvas-context-nav
- **执行日期**: 2026-04-13

---

*文档版本: v2 | Architect: architect | 2026-04-13*
