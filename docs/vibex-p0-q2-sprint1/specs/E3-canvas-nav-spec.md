# Spec: E3 - Canvas Phase 导航 + TabBar 修复规格

## E3.1 TabBar 行为规范

```typescript
// 所有 tab 的点击行为必须对称
const TAB_BEHAVIORS = {
  'context': { setPhase: 'context', setActiveTree: 'bounded-context' },
  'domain': { setPhase: 'domain', setActiveTree: 'domain-model' },
  'flow': { setPhase: 'flow', setActiveTree: 'flow' },
  'component': { setPhase: 'component', setActiveTree: 'component' },
  'prototype': { setPhase: 'prototype', setActiveTree: 'component' }, // 与其他 tab 对称
};

// 验证函数
function validateTabConsistency(tabBehaviors: typeof TAB_BEHAVIORS) {
  const behaviors = Object.values(tabBehaviors);
  const hasPhase = behaviors.every(b => 'setPhase' in b);
  const hasActiveTree = behaviors.every(b => 'setActiveTree' in b);
  return hasPhase && hasActiveTree;
}
```

## E3.2 E2E 测试用例

```typescript
// E3.1.1 E2E 基线测试（修改前必须通过）
test('TabBar E2E 基线 - 所有 tab 可点击', async () => {
  await page.goto('/canvas?projectId=test-id');
  const tabs = page.locator('[role="tab"]');
  await expect(tabs).toHaveCount(5);

  for (const tab of ['context', 'domain', 'flow', 'component', 'prototype']) {
    await page.click(`[role="tab"][data-phase="${tab}"]`);
    await expect(page).toHaveURL(new RegExp(`phase=${tab}`));
  }
});

// E3.1.2 Tab 点击响应
test('点击 tab 后 phase 状态正确更新', async () => {
  await page.goto('/canvas?projectId=test-id');
  await page.click('[role="tab"][data-phase="flow"]');
  const phaseIndicator = page.locator('[data-phase-indicator="flow"]');
  await expect(phaseIndicator).toHaveClass(/active/);
});

// E3.1.3 Mobile prototype tab
test('移动端 prototype tab 行为与桌面端一致', async () => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/canvas?projectId=test-id&phase=prototype');
  const prototypeTab = page.locator('[role="tab"][data-phase="prototype"]');
  await expect(prototypeTab).toBeVisible();
  await prototypeTab.click();
  await expect(prototypeTab).toHaveClass(/active/);
});
```

## E3.3 Phase 导航 Active 状态规范

```typescript
// E3.2.1 Active 高亮 CSS
const ACTIVE_STYLE = {
  background: 'var(--color-primary-muted)',
  borderBottom: '2px solid var(--color-primary)',
  color: 'var(--color-primary)',
};

const INACTIVE_STYLE = {
  background: 'transparent',
  borderBottom: '2px solid transparent',
  color: 'var(--color-text-secondary)',
};

// E3.2.2 刷新后保持 - 通过 URL 或 sessionStorage
const PHASE_STORAGE_KEY = 'vibex_canvas_phase';

function persistPhase(phase: string) {
  sessionStorage.setItem(PHASE_STORAGE_KEY, phase);
}

function restorePhase(): string | null {
  return sessionStorage.getItem(PHASE_STORAGE_KEY);
}

// E3.2.3 Phase 切换动画
const PHASE_TRANSITION_CSS = `
  transition: all var(--duration-normal) var(--ease-out-expo);
  /* duration: 200ms */
  /* ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1) */
`;
```
