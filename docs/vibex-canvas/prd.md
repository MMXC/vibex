# PRD — vibex-canvas CSS 类名解析修复

> **项目**: vibex-canvas  
> **版本**: 1.0  
> **日期**: 2026-04-11  
> **状态**: Draft

---

## 执行摘要

### 背景

CSS Module 子模块聚合文件 `src/styles/canvas.module.css` 使用了 `@use` 指令代替 `@forward`，导致所有通过该聚合文件导入的类名解析为 `undefined`。

**受影响范围**:
- 组件数：13 个
- 子模块数：11 个（canvas.base, canvas.toolbar, canvas.trees, canvas.panels, canvas.context, canvas.flow, canvas.components, canvas.thinking, canvas.export, canvas.misc）
- 涉及组件：TreePanel, BoundedContextTree, BusinessFlowTree, ComponentTree, ComponentTreeCard, CanvasToolbar, ProjectBar, TreeToolbar, PhaseProgressBar, BoundedContextGroup, PrototypeQueuePanel, TreeStatus, SortableTreeItem

### 目标

将 `canvas.module.css` 中的 `@use` 改为 `@forward`，修复所有类名解析，使 13 个组件样式恢复正常。

### 成功指标

1. 构建产物中所有 CSS 类名值非 `undefined`
2. `npm run build` 通过，exit code === 0
3. 13 个组件页面截图 diff < 5%（视觉回归阈值）
4. Dev server 启动后所有组件样式正常渲染

---

## Epic 拆分

### Epic 1: CSS 架构修复

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **F1.1** | 修改 `src/styles/canvas.module.css`：`@use` → `@forward` | 0.25h | 文件中无 `@use` 语句；`@forward` 语句数量 ≥ 11 |
| **F1.2** | 验证 13 个组件类名解析非 undefined | 0.25h | `expect(styles.treePanel).toBeDefined()` for all 13 components |

### Epic 2: 验证与回归

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **F2.1** | 扫描 11 个子模块类名冲突 | 0.5h | 无同名类名不同值；每个子模块类名集合可枚举 |
| **F2.2** | Playwright 截图对比验证 | 1.0h | 截图 diff < 5% pixels changed per component |

### Epic 3: 构建与部署

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **F3.1** | 构建验证 | 0.25h | `npm run build` exit code === 0；无 CSS compile warning |
| **F3.2** | Dev server 部署验证 | 0.25h | 页面可访问（200 OK）；`document.querySelector('.treePanel')` !== null |

**总工时**: 2.5h

---

## 验收标准（逐 Story）

### F1.1 — 修改 canvas.module.css

```ts
// src/styles/canvas.module.css 修复后
// 期望: @forward 语句存在，@use 语句不存在
expect(content).not.toMatch(/@use\s+/);
expect(content).toMatch(/@forward\s+/);
const forwardCount = (content.match(/@forward\s+/g) || []).length;
expect(forwardCount).toBeGreaterThanOrEqual(11);
```

### F1.2 — 验证组件类名解析

```ts
// 13 个组件逐一验证
import canvasStyles from '@/styles/canvas.module.css';

const componentClassNames = [
  'treePanel',
  'boundedContextTree',
  'businessFlowTree',
  'componentTree',
  'componentTreeCard',
  'canvasToolbar',
  'projectBar',
  'treeToolbar',
  'phaseProgressBar',
  'boundedContextGroup',
  'prototypeQueuePanel',
  'treeStatus',
  'sortableTreeItem',
];

for (const className of componentClassNames) {
  expect(canvasStyles[className]).toBeDefined();
  expect(canvasStyles[className]).not.toBeUndefined();
}
```

### F2.1 — 类名冲突扫描

```ts
// 扫描所有子模块，收集所有类名
// 期望: 无同名类名出现不同值
const allClassNames = new Map<string, string[]>();
for (const module of submodules) {
  for (const [className, value] of Object.entries(module)) {
    if (!allClassNames.has(className)) {
      allClassNames.set(className, []);
    }
    allClassNames.get(className)!.push(value);
  }
}
// 验证: 同名类名的值必须全部相同
for (const [className, values] of allClassNames) {
  const uniqueValues = [...new Set(values)];
  expect(uniqueValues.length).toBeLessThanOrEqual(1);
}
```

### F2.2 — Playwright 视觉回归

```ts
// 13 个组件逐一截图对比
for (const component of components) {
  await page.goto(component.url);
  const screenshot = await page.screenshot();
  const diff = await pixelmatch(baseline, screenshot);
  expect(diff / (width * height)).toBeLessThan(0.05); // < 5%
}
```

### F3.1 — 构建验证

```ts
const result = execSync('npm run build', { cwd: '/root/.openclaw/vibex' });
expect(result.status).toBe(0);
expect(result.stderr).not.toMatch(/warning/i);
expect(result.stderr).not.toMatch(/error/i);
```

### F3.2 — 部署验证

```ts
await page.goto('http://localhost:3000');
await page.waitForSelector('.treePanel');
const treePanel = await page.$('.treePanel');
expect(treePanel).not.toBeNull();
const className = await treePanel.getAttribute('class');
expect(className).not.toContain('undefined');
```

---

## Definition of Done

- [ ] `canvas.module.css` 中 `@use` 已全部替换为 `@forward`
- [ ] 所有 13 个组件类名可从 `canvas.module.css` 正确导出
- [ ] 类名冲突扫描通过，无同名不同值
- [ ] Playwright 截图 diff < 5%
- [ ] `npm run build` 通过，无警告无错误
- [ ] Dev server 页面加载正常，类名值非 undefined
- [ ] 上述所有验证结果已记录

---

## 依赖关系

```
F1.1 (修改 CSS)
      ↓
F1.2 (验证类名解析)
      ↓
F2.1 (冲突扫描) ←→ F3.1 (构建验证)
      ↓
F2.2 (视觉回归)
      ↓
F3.2 (部署验证)
```

## 优先级

| 级别 | Story | 理由 |
|------|-------|------|
| P0 | F1.1, F1.2 | 根因修复，阻塞所有下游 |
| P1 | F3.1 | 构建通过是交付前提 |
| P1 | F2.1 | 防止引入新冲突 |
| P2 | F2.2 | 视觉回归验证 |
| P2 | F3.2 | 最终验收 |

---

## 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| `@forward` 引入类名冲突 | 高 | F2.1 扫描验证 |
| 修复后仍有组件样式缺失 | 中 | F1.2 逐组件验证 |
| 视觉回归 | 低 | F2.2 截图对比兜底 |

---

## 执行决策

- **决策**: 待评审
- **执行项目**: 无
- **执行日期**: 待定
