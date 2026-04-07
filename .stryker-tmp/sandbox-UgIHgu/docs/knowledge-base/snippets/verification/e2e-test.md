# E2E 测试模板

## 测试环境

- **Base URL**: [URL]
- **浏览器**: [Chrome/Firefox]
- **分辨率**: [1920x1080]

## 测试用例模板

```typescript
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('[功能名称]', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });
  
  test('[场景描述]', async ({ page }) => {
    // Given
    await page.getByLabel('[标签]').fill('[输入值]');
    
    // When
    await page.getByRole('button', { name: '[按钮]' }).click();
    
    // Then
    await expect(page.getByText('[预期文本]')).toBeVisible();
  });
  
  test('[边界场景]', async ({ page }) => {
    // Given
    await page.goto(`${BASE_URL}/[路径]`);
    
    // When / Then
    await expect(page).toHaveURL(/[预期URL]/);
  });
});
```

## 认证测试

```typescript
test.beforeEach(async ({ page }) => {
  // 登录
  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel('Email').fill(process.env.TEST_EMAIL!);
  await page.getByLabel('Password').fill(process.env.TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/dashboard');
});
```

---

**版本**: 1.0 | **更新日期**: 2026-03-19
