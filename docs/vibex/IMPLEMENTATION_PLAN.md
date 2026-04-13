# VibeX TabBar 无障碍化 — 实施计划

**项目**: vibex
**阶段**: implementation
**Architect**: architect
**日期**: 2026-04-13

---

## 1. Epic/Story 实施顺序

```
Epic 1: TabBar 无障碍化改造 — ✅ 完成
  └─ S1.1: TabBar.tsx 移除 disabled + 锁定逻辑（1h） ✅ done
  └─ S1.2: CanvasPage.tsx 移动端内联 TabBar 同步（0.5h） ✅ done

Epic 2: 空状态提示设计 — ✅ 完成
  └─ S2.1: ContextTreePanel 空状态（0.5h） ✅ done
  └─ S2.2: FlowTreePanel 空状态（0.5h） ✅ done
  └─ S2.3: ComponentTreePanel 空状态（0.5h） ✅ done

Epic 3: 行为验证与测试 — ✅ 完成
  └─ S3.1: prototype tab 完全解锁验证（0.5h）
  └─ S3.2: Tab active 状态验证（0.5h）
  └─ S3.3: E2E 测试覆盖（1.5h）
```

**总工时**: 5.5h
**推荐顺序**: S1.1 → S1.2 → S2.1/S2.2/S2.3（可并行）→ S3.1 → S3.2 → S3.3

---

## 2. Epic 1: TabBar 无障碍化改造 — ✅ 完成

### S1.1 — TabBar.tsx 移除 disabled + 锁定逻辑 ✅ done

**工时**: 1h
**改动文件**: `vibex-fronted/src/components/canvas/TabBar.tsx`

#### 2.1.1 删除 `isLocked` 相关变量（第37-48行区域）

**删除前**:
```typescript
const tabIdx = PHASE_ORDER.indexOf(tab.id as Phase);
const isLocked = tab.id !== 'prototype' && tabIdx > phaseIdx;
const isActive =
  tab.id === 'prototype'
    ? phase === 'prototype'
    : activeTree === tab.id || (activeTree === null && tab.id === 'context');
```

**删除后**（`isActive` 逻辑保持不变，仅删除 `isLocked`）:
```typescript
const isActive =
  tab.id === 'prototype'
    ? phase === 'prototype'
    : activeTree === tab.id || (activeTree === null && tab.id === 'context');
```

#### 2.1.2 删除 `handleTabClick` 中的 phase 守卫（第52-55行）

**删除前**:
```typescript
const handleTabClick = (tabId: TreeType | 'prototype') => {
  if (tabId === 'prototype') {
    setPhase('prototype');
    setActiveTree(null);
    return;
  }
  const tabIdx = PHASE_ORDER.indexOf(tabId as Phase);
  if (tabIdx > phaseIdx) {
    // Tab not yet unlocked by phase — do nothing
    return;
  }
  setActiveTree(tabId as TreeType);
  onTabChange?.(tabId as TreeType);
};
```

**删除后**:
```typescript
const handleTabClick = (tabId: TreeType | 'prototype') => {
  if (tabId === 'prototype') {
    setPhase('prototype');
    setActiveTree(null);
    return;
  }
  setActiveTree(tabId as TreeType);
  onTabChange?.(tabId as TreeType);
};
```

#### 2.1.3 修改 button 元素（删除 disabled 相关属性）

**删除前**:
```typescript
return (
  <button
    key={tab.id}
    role="tab"
    aria-selected={isActive}
    aria-disabled={isLocked}         // ← 删除
    disabled={isLocked}             // ← 删除
    className={`${styles.tab} ${isActive ? styles.tabActive : ''} ${isLocked ? styles.tabLocked : ''}`}  // ← 删除 isLocked 条件
    onClick={() => handleTabClick(tab.id)}
    title={isLocked ? `需先完成上一阶段` : `切换到 ${tab.label} 树`}  // ← 简化 title
  >
```

**删除后**:
```typescript
return (
  <button
    key={tab.id}
    role="tab"
    aria-selected={isActive}
    className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
    onClick={() => handleTabClick(tab.id)}
    title={`切换到 ${tab.label} 树`}
  >
```

#### 验收标准（Vitest 单元测试）:

```typescript
// TabBar.unittest.tsx
test('AC-1: 4 个 tab 均无 disabled 属性', () => {
  render(<TabBar />);
  const tabs = screen.getAllByRole('tab');
  expect(tabs).toHaveLength(4);
  tabs.forEach((tab) => expect(tab).not.toBeDisabled());
});

test('AC-6: prototype tab 始终可点击', () => {
  render(<TabBar />);
  const prototypeTab = screen.getByRole('tab', { name: /原型/i });
  expect(prototypeTab).not.toBeDisabled();
});
```

---

### S1.2 — CanvasPage.tsx 移动端内联 TabBar 同步 ✅ done

**工时**: 0.5h
**改动文件**: `vibex-fronted/src/components/canvas/CanvasPage.tsx`

#### 2.2.1 检查移动端内联 TabBar（第629-648行）

**当前代码**（第631-648行）:
```typescript
<div className={styles.tabBar} role="tablist">
  {(['context', 'flow', 'component'] as TreeType[]).map((t) => (
    <button
      key={t}
      role="tab"
      aria-selected={activeTab === t}
      className={`${styles.tabButton} ${activeTab === t ? styles.tabButtonActive : ''}`}
      onClick={() => setActiveTab(t)}
    >
      {t === 'context' ? '◇ 上下文' : t === 'flow' ? '→ 流程' : '▣ 组件'}
    </button>
  ))}
</div>
```

**确认结果**: 移动端内联 tab bar **没有 disabled 逻辑**，但只有 3 个 tab，缺少 prototype tab（🚀）。

#### 2.2.2 与 desktop TabBar 保持一致（添加 prototype tab）

**改动后**:
```typescript
<div className={styles.tabBar} role="tablist">
  {([
    { id: 'context', label: '◇ 上下文' },
    { id: 'flow', label: '→ 流程' },
    { id: 'component', label: '▣ 组件' },
    { id: 'prototype', label: '🚀 原型' },
  ] as const).map((t) => (
    <button
      key={t.id}
      role="tab"
      aria-selected={t.id === 'prototype' ? phase === 'prototype' : activeTab === t.id}
      className={`${styles.tabButton} ${t.id === 'prototype' ? phase === 'prototype' ? styles.tabButtonActive : '' : activeTab === t.id ? styles.tabButtonActive : ''}`}
      onClick={() => {
        if (t.id === 'prototype') {
          setPhase('prototype');
          setActiveTree(null);
        } else {
          setActiveTab(t.id);
        }
      }}
    >
      {t.label}
    </button>
  ))}
</div>
```

#### 验收标准（E2E）:

```typescript
test('AC-5: 移动端与桌面端行为一致', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/canvas?tabMode=true');
  // 4 个 tab 均无 disabled
  const tabs = page.locator('[role="tab"]');
  await expect(tabs).toHaveCount(4);
  for (const tab of await tabs.all()) {
    await expect(tab).not.toBeDisabled();
  }
});
```

---

## 3. Epic 2: 空状态提示设计 — ✅ 完成

**工时**: 1.5h（三个 Story 各 0.5h，可并行）
**改动文件**: `vibex-fronted/src/components/canvas/TreePanel.tsx`

### 3.1 改动范围（第157-159行区域）

**当前代码**:
```typescript
{/* Summary when no nodes */}
{safeNodes.length === 0 && (
  <div className={styles.treePanelEmpty}>
    <span style={{ color: treeColor }}>{treeIcon}</span>
    <p>暂无节点</p>
    <p className={styles.treePanelEmptyHint}>
      {tree === 'context'
        ? '输入需求后 AI 将生成限界上下文'
        : tree === 'flow'
          ? '确认上下文后自动生成流程树'
          : '确认流程后自动生成组件树'}
    </p>
  </div>
)}
```

### 3.2 S2.1 — ContextTreePanel 空状态

**改动后**（仅 `tree === 'context'` 分支）:
```typescript
{tree === 'context'
  ? '请先在需求录入阶段输入需求'
  : tree === 'flow'
    ? '请先确认上下文节点，流程将自动生成'
    : '请先完成流程树，组件将自动生成'}
```

### 3.3 完整改动

**改动后完整空状态块**:
```typescript
{/* 空状态引导 */}
{safeNodes.length === 0 && (
  <div className={styles.treePanelEmpty}>
    <span style={{ color: treeColor }}>{treeIcon}</span>
    <p>暂无节点</p>
    <p className={styles.treePanelEmptyHint}>
      {tree === 'context'
        ? '请先在需求录入阶段输入需求'
        : tree === 'flow'
          ? '请先确认上下文节点，流程将自动生成'
          : '请先完成流程树，组件将自动生成'}
    </p>
  </div>
)}
```

### 3.4 验收标准（E2E）

```typescript
test('S2.1: ContextTreePanel 空状态', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[role="tab"]:has-text("上下文")');
  const emptyState = page.locator('text=请先在需求录入阶段输入需求');
  await expect(emptyState).toBeVisible();
});

test('S2.2: FlowTreePanel 空状态', async ({ page }) => {
  await page.goto('/canvas');
  // phase=input 时 flow 为空
  await page.click('[role="tab"]:has-text("流程")');
  const emptyState = page.locator('text=请先确认上下文节点，流程将自动生成');
  await expect(emptyState).toBeVisible();
});

test('S2.3: ComponentTreePanel 空状态', async ({ page }) => {
  await page.goto('/canvas');
  // phase=input 时 component 为空
  await page.click('[role="tab"]:has-text("组件")');
  const emptyState = page.locator('text=请先完成流程树，组件将自动生成');
  await expect(emptyState).toBeVisible();
});
```

---

## 4. Epic 3: 行为验证与测试 — ✅ 完成

### S3.1 — prototype tab 完全解锁验证 ✅ done（0.5h）

**验证**: prototype tab 原本就不受 phase 锁定（S1.1 改动中 `tab.id !== 'prototype'` 分支保留），无需代码改动，仅需测试覆盖。

```typescript
test('S3.1: prototype tab 始终可点击', async ({ page }) => {
  await page.goto('/canvas');
  // phase=input 时点击 prototype tab
  const prototypeTab = page.locator('[role="tab"]:has-text("🚀")');
  await prototypeTab.click();
  await expect(prototypeTab).toHaveAttribute('aria-selected', 'true');
  // prototype 队列面板可见
  await expect(page.locator('[data-testid="prototype-queue"]')).toBeVisible();
});
```

### S3.2 — Tab active 状态验证 ✅ done（0.5h）

**验证 AC-7**: 只有一个 tab 处于 active。

```typescript
test('S3.2: 只有一个 tab 处于 active', async ({ page }) => {
  await page.goto('/canvas');
  const selected = page.locator('[role="tab"][aria-selected="true"]');
  await expect(selected).toHaveCount(1);
  // 切换后仍只有一个
  await page.click('[role="tab"]:has-text("流程")');
  await expect(selected).toHaveCount(1);
  // 默认 context 为 active
  await page.goto('/canvas');
  const contextTab = page.locator('[role="tab"]:has-text("上下文")');
  await expect(contextTab).toHaveAttribute('aria-selected', 'true');
});
```

### S3.3 — E2E 测试覆盖（1.5h）

**文件**: `vibex-fronted/tests/e2e/tab-switching.spec.ts`

完整文件内容见 `architecture.md` §6.2。

---

## 5. 测试命令速查

```bash
cd /root/.openclaw/vibex/vibex-fronted

# 单元测试（Vitest）
pnpm test:unit tests/unit/components/canvas/TabBar.unittest.tsx

# 带覆盖率
pnpm test:unit:coverage tests/unit/components/canvas/TabBar.unittest.tsx

# E2E 测试（需先启动 dev server）
pnpm test:e2e tests/e2e/tab-switching.spec.ts

# E2E CI 模式
pnpm test:e2e:ci tests/e2e/tab-switching.spec.ts

# 全部测试
pnpm test:ci
```

---

## 6. 验收标准矩阵

| AC | 描述 | 测试方式 | 通过条件 |
|----|------|---------|---------|
| AC-1 | 4个tab均无`disabled`属性 | Vitest + Playwright | `expect(tab).not.toBeDisabled()` x4 |
| AC-2 | 点击立即切换，<100ms | Playwright 计时 | `Date.now() - clickTime < 100` |
| AC-3 | 空树显示引导提示 | Playwright | 3 个空状态文案均可见 |
| AC-4 | PhaseIndicator 不受影响 | Playwright | 切换 tab 后 indicator 仍可见 |
| AC-5 | 移动端与桌面端一致 | Playwright viewport | 375x812 下 4 tabs 无 disabled |
| AC-6 | prototype tab 始终可点击 | Vitest + Playwright | `expect(prototypeTab).toBeEnabled()` |
| AC-7 | 只有一个tab处于active | Playwright | `expect(selected).toHaveCount(1)` |
| AC-8 | 切换tab后三树数据不丢失 | Playwright | 切回后 nodes 数量不变 |

---

## 7. 回滚步骤

```bash
cd /root/.openclaw/vibex/vibex-fronted

# 找到引入改动的 commit
git log --oneline -5

# 回滚单个文件
git checkout <previous-commit> -- src/components/canvas/TabBar.tsx

# 或回滚整个改动
git revert <commit-hash>

# 确认回滚
pnpm build && pnpm test:ci
```
