# 规格 — 视觉回归验证（Playwright 截图对比）

## 功能点

### F2.2.1 — 建立基线截图
- 使用 Playwright 访问 13 个组件所在页面
- 对每个组件区域截图，保存为基线 PNG
- 组件 URL 映射表：
  - TreePanel → `/canvas/panel`
  - BoundedContextTree → `/canvas/bounded-context`
  - BusinessFlowTree → `/canvas/business-flow`
  - ComponentTree → `/canvas/component`
  - ComponentTreeCard → `/canvas/component`
  - CanvasToolbar → `/canvas`
  - ProjectBar → `/canvas`
  - TreeToolbar → `/canvas/panel`
  - PhaseProgressBar → `/canvas`
  - BoundedContextGroup → `/canvas/bounded-context`
  - PrototypeQueuePanel → `/canvas/queue`
  - TreeStatus → `/canvas`
  - SortableTreeItem → `/canvas/component`

### F2.2.2 — 执行修复后截图
- 在 `@use` → `@forward` 修复后重新启动 dev server
- 对相同 13 个组件执行截图

### F2.2.3 — 像素级对比
- 使用 `pixelmatch` 或 Playwright 的 `toHaveScreenshot` 进行对比
- 计算变化像素百分比
- 阈值: < 5% 为通过

### F2.2.4 — 生成差异报告
- 输出每个组件的 diff PNG
- 标记变化区域

## 验收标准 (expect() 断言)

```ts
// 1. Dev server 可访问
const response = await page.goto('http://localhost:3000');
expect(response.status()).toBe(200);

// 2. 组件可见且类名正确
const componentSelectors = {
  treePanel: '[class*="treePanel"]',
  boundedContextTree: '[class*="boundedContextTree"]',
  businessFlowTree: '[class*="businessFlowTree"]',
  componentTree: '[class*="componentTree"]',
  componentTreeCard: '[class*="componentTreeCard"]',
  canvasToolbar: '[class*="canvasToolbar"]',
  projectBar: '[class*="projectBar"]',
  treeToolbar: '[class*="treeToolbar"]',
  phaseProgressBar: '[class*="phaseProgressBar"]',
  boundedContextGroup: '[class*="boundedContextGroup"]',
  prototypeQueuePanel: '[class*="prototypeQueuePanel"]',
  treeStatus: '[class*="treeStatus"]',
  sortableTreeItem: '[class*="sortableTreeItem"]',
};

for (const [name, selector] of Object.entries(componentSelectors)) {
  await page.waitForSelector(selector, { timeout: 5000 });
  const el = await page.$(selector);
  expect(el).not.toBeNull();
  const className = await el.getAttribute('class');
  expect(className).not.toContain('undefined');
}

// 3. 截图对比通过（阈值 < 5%）
const diffPixels = await pixelmatch(baselineImg, fixedImg, null, {
  threshold: 0.1,
  diffMask: true,
});
const totalPixels = width * height;
const diffRatio = diffPixels / totalPixels;
expect(diffRatio).toBeLessThan(0.05);

// 4. 每个组件单独验证
for (const component of Object.keys(componentSelectors)) {
  const baseline = fs.readFileSync(`tests/visual/baseline/${component}.png`);
  const current = await page.screenshot({ path: `/tmp/${component}.png` });
  const diff = pixelmatch(baseline, current, null, { threshold: 0.1 });
  expect(diff / (width * height)).toBeLessThan(0.05);
}
```

## 测试场景

### 场景 1: 基线建立（修复前）
```bash
# 运行基线建立脚本
npm run visual:baseline -- --components=treePanel,boundedContextTree,...
```

### 场景 2: 修复后对比（修复后）
```bash
# 运行对比脚本
npm run visual:compare
# 输出: diff report per component
```

### 场景 3: CI 自动化
- 集成到 CI pipeline
- 修复后 PR 自动触发截图对比
- 超过阈值自动失败

## 页面集成说明

【需页面集成】— 需要 Dev server 启动，且 13 个组件页面可访问。
- 启动命令: `npm run dev`
- 访问 URL: `http://localhost:3000`
- 前置条件: 数据库种子数据已填充（若有）
