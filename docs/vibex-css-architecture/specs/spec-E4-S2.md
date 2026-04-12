# Spec: E4-S2 — E2E 测试验证队列项状态样式加载

## 文件

- **新建**: `vibex-frontend/e2e/canvas-queue-styles.spec.ts`

## 目的

在真实浏览器环境中验证 E1-S1 修复效果：队列项状态样式正确渲染，DOM 中无 undefined 类名，console 无警告。

## 测试步骤

### 步骤 1：触发原型队列渲染

1. 打开 canvas 页面（或原型预览页面）
2. 触发原型导出，队列中出现 queued/generating/done/error 状态的队列项

### 步骤 2：检查无 undefined 类名

```ts
const undefinedInClass = await page.evaluate(() =>
  [...document.querySelectorAll('[class]')].some(el => el.className.includes('undefined'))
);
expect(undefinedInClass).toBe(false);
```

### 步骤 3：验证队列项状态样式类名

```ts
// queued 状态
const queuedItem = page.locator('li[class*="queueItem"]').filter({ hasText: '⏳' });
await expect(queuedItem).toHaveClass(/queueItemQueued/);
await expect(queuedItem).not.toHaveClass(/undefined/);

// generating 状态
const generatingItem = page.locator('li[class*="queueItem"]').filter({ hasText: '⚙️' });
await expect(generatingItem).toHaveClass(/queueItemGenerating/);

// done 状态
const doneItem = page.locator('li[class*="queueItem"]').filter({ hasText: '✅' });
await expect(doneItem).toHaveClass(/queueItemDone/);

// error 状态
const errorItem = page.locator('li[class*="queueItem"]').filter({ hasText: '❌' });
await expect(errorItem).toHaveClass(/queueItemError/);
```

### 步骤 4：检查 computed style

```ts
const queuedEl = page.locator('li.queueItemQueued').first();
const bgColor = await queuedEl.evaluate(el => window.getComputedStyle(el).backgroundColor);
expect(bgColor).not.toBe('rgba(0, 0, 0, 0)'); // 非透明
```

## DoD 检查单

- [ ] E2E spec 文件存在
- [ ] Playwright 测试全部通过
- [ ] console 无 `undefined` 类名警告
- [ ] 队列项 4 种状态样式全部正确渲染
