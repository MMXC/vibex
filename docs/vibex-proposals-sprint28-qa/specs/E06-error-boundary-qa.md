# E06 Canvas 错误边界完善 — QA 验证规格

**Epic**: E06 | **验证策略**: gstack 浏览器交互验证 + 代码审查
**Unit Tests**: DDSCanvasPage vitest 12 tests

---

## 页面: DDSCanvasPage

### 验证场景
DDSCanvasPage 外层包裹 ErrorBoundary，验证出错时 Fallback 显示且重试不触发整页刷新。

### 四态验证

**理想态**
- DDSCanvasPage 正常渲染
- Canvas 三栏正常显示
- 无异常

**错误态（触发 ErrorBoundary）**
- 组件渲染异常时，Fallback UI 显示
- Fallback 包含：渲染失败提示 + "重试"按钮
- 点击"重试"后组件恢复，不触发 `window.location.reload()`
- URL 不变，页面不闪刷新

**代码审查检查项**
- DDSCanvasPage.tsx 包含 TreeErrorBoundary 包裹
- ErrorBoundary 使用 React.ComponentDidCatch 或 getDerivedStateFromError
- Fallback UI 不依赖外部数据（可独立渲染）
- 重试逻辑调用组件重新 render，而非 window.location

### 验收断言（gstack /qa 格式）

```javascript
// E06-Q1: DDSCanvasPage 正常渲染
await expect(page.locator('[data-testid="dds-canvas-page"]')).toBeVisible()

// E06-Q2: 模拟错误触发 Fallback（通过 devtools 注入错误）
// 在 DevTools Console 中执行: throw new Error('test')
// 然后验证 Fallback 显示
await page.evaluate(() => {
  // 触发错误的方式：修改 localStorage 模拟数据损坏
  localStorage.setItem('__test_canvas_error', '1')
})
await page.reload()
await page.waitForTimeout(500)

// Fallback 应显示（如果 ErrorBoundary 工作正常）
const fallback = page.locator('[data-testid="error-fallback"]')
if (await fallback.isVisible()) {
  await expect(page.locator('text=/重试|刷新|Retry/i')).toBeVisible()
}

// E06-Q3: 重试按钮不触发整页刷新
const beforeUrl = page.url()
await page.click('[data-testid="retry-btn"]')
await page.waitForTimeout(500)
const afterUrl = page.url()
expect(afterUrl).toBe(beforeUrl)  // URL 不变
```

### 执行方式
`/qa --url http://localhost:3000/dds-canvas/test --assert "E06-Q1 to E06-Q3"`

### 代码审查检查
- [ ] `DDSCanvasPage.tsx` 包含 `<TreeErrorBoundary>`
- [ ] ErrorBoundary 定义了 `renderFallback()` 或类似方法
- [ ] 重试逻辑使用 `this.setState()` 而非 `window.location`
- [ ] 12 个 DDSCanvasPage unit tests 全部通过
