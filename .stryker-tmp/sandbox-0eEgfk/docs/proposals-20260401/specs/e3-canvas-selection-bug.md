# Spec: E3 - Canvas 选区 bug 修复

## 概述
修复 Canvas 选区过滤逻辑，确保 deselect 后卡片不继续出现在发送请求中。

## F3.1: Canvas 选区过滤

### 问题
用户 deselect 卡片后，`selectedNodeIds` 未更新，导致继续发送时仍包含已取消选择的卡片。

### 根因
`confirmed` 和 `selectedNodeIds` 混用：继续发送使用 `confirmed` 列表，但 deselect 时仅更新 UI 状态。

### 规格
- 文件: `frontend/components/Canvas.tsx`
- 修复: `onSelectionChange` 同时更新 `selectedNodeIds`；发送时使用 `selectedNodeIds` 而非 `confirmed`
- 验证: deselect 事件触发后，`selectedNodeIds` 立即反映最新状态

### 验收
```typescript
// e3-s1 Playwright E2E
test('deselected cards not in continue request', async ({ page }) => {
  await page.goto('/canvas');
  // 选中 3 张卡片
  await page.click('[data-testid="card-1"]');
  await page.click('[data-testid="card-2"]');
  await page.click('[data-testid="card-3"]');
  
  // 取消选择 card-2
  await page.click('[data-testid="card-2"]');
  
  // 点击继续
  await page.click('[data-testid="continue-btn"]');
  
  // 捕获请求体
  const [request] = await page.waitForRequest('**/canvas/continue');
  const body = request.postData();
  const sentNodeIds = JSON.parse(body).nodeIds;
  
  expect(sentNodeIds).toContain('card-1');
  expect(sentNodeIds).toContain('card-3');
  expect(sentNodeIds).not.toContain('card-2');
});
```

### 【需页面集成】✅

此功能涉及页面交互，必须在 Canvas 组件中实现。
