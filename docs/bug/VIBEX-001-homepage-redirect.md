# Bug 提案: 首页路由未重定向到落地页

**Bug ID**: VIBEX-001  
**严重级**: P0  
**状态**: Open  
**发现日期**: 2026-03-11  
**发现者**: tester  

---

## 1. 问题描述

### Bug: 首页不仅是营销页，还应嵌入核心交互功能

根据 PRD `vibex-interaction-redesign-prd.md`，首页应该是**营销页 + 核心交互功能的融合**，吸引新用户直接使用。

#### 当前行为
- **URL**: https://vibex-app.pages.dev
- **显示内容**: 仅标题 "VibeX - AI-Powered App Builder"，无实质内容

#### 预期行为
- **首页 `/` 应包含**:
  1. **营销内容**: 功能介绍（AI 对话生成、可视化编辑、一键导出）
  2. **核心交互功能**: 需求录入表单（多行输入框 + "生成" 按钮）
  3. **用户可直接体验**: 无需登录即可输入需求，点击"生成"时才触发登录

#### /landing/ 页面
- 当前显示正常营销内容，但缺少核心交互功能
- 建议整合到 `/` 首页，或在 /landing/ 嵌入需求录入表单

---

## 2. PRD 依据

根据 `docs/prd.md` 中的用户流程:

| 场景 | 验收标准 |
|------|----------|
| T3.1.1 落地页访问 | 访问 /landing/ 显示 VibeX 营销内容 |

新用户首次访问应看到完整营销内容，当前首页不具备引导用户注册的功能。

---

## 3. 影响范围

- **用户体验**: 新用户无法直接体验核心功能，必须先注册才能使用
- **转化率**: 缺少即时使用引导，用户可能流失
- **功能缺失**: 与 PRD 设计不符（首页应嵌入需求录入表单）

---

## 4. 修复建议

### 方案: 首页重构为营销页 + 需求录入表单

1. **首页 `/` 应包含**:
   - 上半部分: 营销内容（功能介绍、价值主张）
   - 下半部分（或核心区域）: 需求录入表单
   - 用户可直接输入需求，点击"生成"才触发登录

### 方案 B: /landing/ 整合
- 在 /landing/ 页面嵌入需求录入表单
- 或将 /landing/ 作为唯一首页

### 文件位置
- `vibex-fronted/app/page.tsx` - 首页组件（需重构）
- `vibex-fronted/app/landing/page.tsx` - 落地页

---

## 5. 验收标准

| 验收项 | 测试方法 |
|--------|----------|
| 首页显示营销内容 | 验证有功能介绍（AI 对话生成、可视化编辑、一键导出） |
| 首页显示需求录入表单 | 验证有需求输入框 + "生成" 按钮 |
| 无需登录可输入需求 | 不登录状态下可输入文本 |
| 点击生成触发登录检查 | 未登录点击"生成"应打开登录抽屉 |

---

## 6. 测试用例

```typescript
test('should show marketing content on homepage', async ({ page }) => {
  await page.goto('https://vibex-app.pages.dev');
  await expect(page.locator('text=AI 对话生成')).toBeVisible();
  await expect(page.locator('text=可视化编辑')).toBeVisible();
});

test('should show requirement input form on homepage', async ({ page }) => {
  await page.goto('https://vibex-app.pages.dev');
  await expect(page.locator('textarea, input[placeholder*="需求"]')).toBeVisible();
  await expect(page.locator('text=生成')).toBeVisible();
});

test('should allow input without login', async ({ page }) => {
  await page.goto('https://vibex-app.pages.dev');
  await page.fill('textarea, input[placeholder*="需求"]', '创建一个项目管理工具');
  await expect(page.locator('text=创建一个项目管理工具')).toBeVisible();
});

test('should prompt login when clicking generate', async ({ page }) => {
  await page.goto('https://vibex-app.pages.dev');
  await page.fill('textarea, input[placeholder*="需求"]', '创建一个项目管理工具');
  await page.click('text=生成');
  // Should show login drawer or prompt
  await expect(page.locator('text=登录')).toBeVisible();
});
```

---

## 7. 相关文件

- `vibex-fronted/app/page.tsx` - 首页组件（需重构，添加需求录入表单）
- `vibex-fronted/app/landing/page.tsx` - 落地页（可选，整合到首页）
- PRD: `docs/prd/vibex-interaction-redesign-prd.md`

---

**优先级**: P0 - 阻塞新用户引导流程  
**指派**: dev agent  
**验证者**: tester
