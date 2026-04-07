# E4 Spec: 测试覆盖

## 单元测试: useAutoSave 冲突检测

```typescript
describe('useAutoSave conflict detection', () => {
  test('409 response sets saveStatus to conflict', async () => {
    mockPost.mockResolvedValueOnce({
      status: 409,
      data: { conflict: true, serverVersion: 5, serverSnapshot: mockSnapshot },
    });
    act(() => { result.current.save() });
    expect(result.current.saveStatus).toBe('conflict');
  });
});
```

## E2E: 冲突解决完整流程

```typescript
// tests/e2e/conflict-resolution.spec.ts
test('multi-tab conflict resolution', async ({ browser }) => {
  const ctx1 = await browser.newContext();
  const ctx2 = await browser.newContext();

  const page1 = await ctx1.newPage();
  const page2 = await ctx2.newPage();

  // Tab A: 编辑并保存
  await page1.goto('/canvas');
  await page1.locator('[data-node]').first().fill('修改A');
  await page1.reload(); // 触发自动保存

  // Tab B: 同一项目编辑，触发冲突
  await page2.goto('/canvas');
  await page2.locator('[data-node]').first().fill('修改B');
  // 模拟：Tab A 保存后 Tab B version 过期

  // 解决冲突
  await expect(page2.locator('[data-conflict-dialog]')).toBeVisible();
  await page2.locator('text=使用服务器版本').click();
  await expect(page2.locator('[data-node]').first()).toContainText('修改A');
});
```
