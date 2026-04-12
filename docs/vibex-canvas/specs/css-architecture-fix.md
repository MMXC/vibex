# 规格 — CSS 聚合层修复（@use → @forward）

## 功能点

### F1.1.1 — 识别问题文件
- 文件路径：`src/styles/canvas.module.css`
- 定位当前 `@use` 语句数量和位置

### F1.1.2 — 替换 @use → @forward
- 将所有 `@use 'path/to/module'` 替换为 `@forward 'path/to/module'`
- 保持原有路径顺序不变
- 保留原有 `as` 别名（若有）

### F1.1.3 — 验证 @forward 完整性
- 确认 `@forward` 语句数量 ≥ 11（对应 11 个子模块）
- 确认无残留 `@use` 语句

## 验收标准 (expect() 断言)

```ts
// 1. 文件存在
expect(fs.existsSync('src/styles/canvas.module.css')).toBe(true);

// 2. 无 @use 语句
const content = fs.readFileSync('src/styles/canvas.module.css', 'utf-8');
expect(content).not.toMatch(/@use\s+['"]/);

// 3. @forward 语句数量正确
const forwardMatches = content.match(/@forward\s+['"]/g) || [];
expect(forwardMatches.length).toBeGreaterThanOrEqual(11);

// 4. 每个子模块均被 @forward
const expectedModules = [
  'canvas.base', 'canvas.toolbar', 'canvas.trees', 'canvas.panels',
  'canvas.context', 'canvas.flow', 'canvas.components', 'canvas.thinking',
  'canvas.export', 'canvas.misc',
];
for (const module of expectedModules) {
  expect(content).toContain(`@forward '${module}'`);
}

// 5. 类名可导出（验证所有 13 个组件类名）
const canvasStyles = require('src/styles/canvas.module.css');
const expectedClasses = [
  'treePanel', 'boundedContextTree', 'businessFlowTree', 'componentTree',
  'componentTreeCard', 'canvasToolbar', 'projectBar', 'treeToolbar',
  'phaseProgressBar', 'boundedContextGroup', 'prototypeQueuePanel',
  'treeStatus', 'sortableTreeItem',
];
for (const cls of expectedClasses) {
  expect(canvasStyles[cls]).toBeDefined();
  expect(typeof canvasStyles[cls]).toBe('string');
  expect(canvasStyles[cls]).not.toBe('');
}
```

## 测试场景

### 场景 1: 修复前检查
- 读取 `canvas.module.css` 当前内容
- 确认存在 `@use` 语句
- 记录 @forward 语句数量（修复前应为 0 或极少）

### 场景 2: 修复执行
- 批量替换 `@use` → `@forward`
- 写入修改后的文件

### 场景 3: 修复后验证
- 执行上述 5 个断言
- 全部通过则修复成功

## 页面集成说明

【无需页面集成】— 此规格仅涉及 CSS 聚合文件修改，不依赖特定页面。
