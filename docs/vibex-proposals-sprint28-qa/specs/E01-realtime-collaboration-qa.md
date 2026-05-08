# E01 实时协作整合 — QA 验证规格

**Epic**: E01 | **验证策略**: gstack 浏览器交互验证
**验证文件**: presence-mvp.spec.ts（179行）

---

## 页面: CanvasPage

### 验证场景
访问 `/canvas/{project-id}`，验证 PresenceLayer 是否正确渲染。

### 四态验证

**理想态（Firebase 已配置）**
- CanvasPage 渲染完成
- PresenceAvatars 组件显示在页面顶部（三栏上方）
- 当前用户头像可见
- 其他在线用户头像显示（如果有）

**降级态（Firebase 未配置，mock mode）**
- CanvasPage 渲染完成，无崩溃
- PresenceAvatars 区域显示"仅您"或空状态
- 无 console.error（允许 console.warn）
- 页面其他功能正常可用

**加载态**
- CanvasPage 显示骨架屏或 spinner
- PresenceAvatars 区域 loading 占位

**错误态**
- CanvasPage 渲染出错时，ErrorBoundary Fallback 显示
- 包含"刷新"或"重试"按钮
- 无未捕获异常导致白屏

### 验收断言（gstack /qa 格式）

```javascript
// E01-Q1: CanvasPage 可访问
await expect(page).toHaveURL(/\/canvas\/.+/)
await expect(page.locator('[data-testid="canvas-page"]')).toBeVisible()

// E01-Q2: PresenceAvatars 区域存在（降级态下仍渲染）
const presenceArea = page.locator('[data-testid="presence-avatars"]')
await expect(presenceArea).toBeVisible()

// E01-Q3: 无 console.error
const errors = []
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
await page.waitForTimeout(1000)
expect(errors.filter(e => !e.includes('Firebase'))).toHaveLength(0)

// E01-Q4: 三栏 Canvas 正常渲染
await expect(page.locator('[data-testid="context-panel"]')).toBeVisible()
await expect(page.locator('[data-testid="flow-panel"]')).toBeVisible()
await expect(page.locator('[data-testid="design-panel"]')).toBeVisible()
```

### 执行方式
`/qa --url http://localhost:3000/canvas/test-project --assert "E01-Q1 to E01-Q4"`
