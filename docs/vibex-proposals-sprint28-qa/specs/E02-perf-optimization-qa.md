# E02 Design Output 性能优化 — QA 验证规格

**Epic**: E02 | **验证策略**: gstack 浏览器交互验证 + 性能检查
**相关文件**: ChapterPanel.tsx（react-window FixedSizeList）

---

## 页面: DDSCanvasPage（Design Output / Chapter Panel）

### 验证场景
访问 DDSCanvasPage，验证大量节点时列表虚拟化正常，空状态引导正确，错误态重试可用。

### 四态验证

**理想态（大量节点，≥200）**
- FixedSizeList 正确渲染，DOM 节点数约 20 个（而非 ~200 个）
- 滚动流畅，无卡顿
- Lighthouse Performance Score ≥ 85

**正常态（少量节点，<200）**
- 卡片列表正常渲染
- 每个卡片包含：标题、描述、操作按钮

**空状态**
- 显示空状态插图（非空白）
- 引导文案："暂无设计输出，请先添加内容"（或类似）
- 无崩溃

**错误态**
- 出错时显示错误信息（网络异常 / 数据加载失败）
- 包含"重试"按钮，点击后重新加载
- 不触发整页刷新

### 验收断言（gstack /qa 格式）

```javascript
// E02-Q1: DDSCanvasPage 可访问
await expect(page).toHaveURL(/\/dds-canvas\/.+/)
await expect(page.locator('[data-testid="chapter-panel"]')).toBeVisible()

// E02-Q2: 加载骨架屏显示（大量节点时）
const shimmer = page.locator('[data-testid="loading-shimmer"]')
// 当节点数 > 200 时应显示 shimmer
await expect(shimmer.or(page.locator('[data-testid="chapter-card"]'))).toBeVisible()

// E02-Q3: 列表渲染（少量节点）
await expect(page.locator('[data-testid="chapter-card"]').first()).toBeVisible()

// E02-Q4: 空状态引导（非空白）
const emptyState = page.locator('[data-testid="empty-state"]')
if (await emptyState.isVisible()) {
  await expect(emptyState.locator('img, svg')).toBeVisible()
  await expect(emptyState.locator('text=/暂无|请先|暂无内容/')).toBeVisible()
}

// E02-Q5: 错误态重试按钮
const retryBtn = page.locator('[data-testid="retry-btn"]')
// 模拟错误：可通过设置无效 projectId 触发
await expect(retryBtn.or(page.locator('[data-testid="error-message"]'))).toBeVisible()
```

### 性能验证（/benchmark 技能）
```bash
# Lighthouse 性能检查（需部署后验证）
/benchmark --url http://staging.vibex.app/dds-canvas/test --lighthouse
# 期望: Performance Score >= 85
```

### 执行方式
`/qa --url http://localhost:3000/dds-canvas/test-project --assert "E02-Q1 to E02-Q5"`
