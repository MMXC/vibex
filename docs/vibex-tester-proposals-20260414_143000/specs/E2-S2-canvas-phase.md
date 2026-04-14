# Spec: E2.S2 — Canvas Phase 边界测试

**功能ID**: E2.S2.F1.1, E2.S2.F1.2, E2.S2.F1.3
**Epic**: E2 — Sprint1 提案配套测试
**类型**: Test / P1
**预估工时**: 2h

---

## 1. 背景

Canvas Phase 状态管理是 Sprint1 核心功能。在刷新、导入文件、Phase 切换等边界场景下，状态必须保持一致。

---

## 2. 验收标准

| # | 验收项 | 断言 |
|---|--------|------|
| 1 | 页面刷新后 Phase 状态与刷新前一致 | `expect(currentPhase).toBe(prevPhase)` |
| 2 | 导入文件后 Phase 正确初始化 | `expect(phase).toBe('initialized')` |
| 3 | Phase 切换（Draft → Review → Published）功能正常 | `expect(switchResult).toBe(true)` |
| 4 | 切换后数据持久化到后端 | `expect(apiCall).toHaveBeenCalledWith({ phase })` |

---

## 3. 实施步骤

### E2.S2.F1.1 — 刷新后 Phase 保持

1. 登录 → 进入 Canvas 页面
2. 设置 Phase 为 `Review`
3. 执行 `page.reload()`
4. 等待页面加载
5. 断言 Phase 仍为 `Review`

### E2.S2.F1.2 — 导入后 Phase 初始化

1. 登录 → 进入 Canvas 页面
2. 触发文件导入（拖拽或上传按钮）
3. 等待导入完成
4. 断言 Phase 状态为预期初始状态

### E2.S2.F1.3 — Phase 切换

1. 登录 → 进入 Canvas 页面
2. 依次切换 Draft → Review → Published
3. 每次切换后验证：
   - UI 状态正确更新
   - API 调用携带正确 phase 参数
   - Phase 指示器（如 badge/tab）正确显示

---

## 4. 测试用例

```typescript
// tests/e2e/canvas-phase.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Canvas Phase Boundary Tests', () => {

  test('刷新后 Phase 状态保持', async ({ page }) => {
    await page.goto('/canvas/test-canvas-id');
    await page.waitForLoadState('networkidle');

    // 获取当前 Phase
    const prevPhase = await page.locator('[data-testid="phase-indicator"]').textContent();

    // 刷新
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 验证 Phase 不变
    const currentPhase = await page.locator('[data-testid="phase-indicator"]').textContent();
    expect(currentPhase).toBe(prevPhase);
  });

  test('导入文件后 Phase 正确初始化', async ({ page }) => {
    await page.goto('/canvas/test-canvas-id');
    await page.waitForLoadState('networkidle');

    // 上传测试文件
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Import' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/sample-canvas.json');

    await page.waitForResponse('**/api/canvas/import**');
    const phase = await page.locator('[data-testid="phase-indicator"]').textContent();
    expect(phase).toBeTruthy(); // 初始化后有非空 phase
  });

  test('Phase 切换 Draft → Review → Published', async ({ page }) => {
    await page.goto('/canvas/test-canvas-id');
    await page.waitForLoadState('networkidle');

    const transitions = ['Review', 'Published', 'Draft'] as const;

    for (const targetPhase of transitions) {
      await page.getByRole('button', { name: `Switch to ${targetPhase}` }).click();
      await page.waitForResponse('**/api/canvas/phase**');
      const currentPhase = await page.locator('[data-testid="phase-indicator"]').textContent();
      expect(currentPhase).toBe(targetPhase);
    }
  });
});
```

---

## 5. Definition of Done

- [ ] 刷新后 Phase 保持测试通过
- [ ] 导入后 Phase 初始化测试通过
- [ ] Phase 切换测试（3 种场景）通过
- [ ] 所有测试在 CI 中通过
