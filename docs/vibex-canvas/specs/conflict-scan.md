# 规格 — 类名冲突扫描验证

## 功能点

### F2.1.1 — 收集所有子模块类名
- 扫描 11 个子模块 CSS 文件：`canvas.base`, `canvas.toolbar`, `canvas.trees`, `canvas.panels`, `canvas.context`, `canvas.flow`, `canvas.components`, `canvas.thinking`, `canvas.export`, `canvas.misc`
- 从每个模块提取所有类名及其生成的哈希值

### F2.1.2 — 检测同名冲突
- 识别所有同名类名
- 验证同名类名的哈希值是否一致
- 冲突定义：类名相同但哈希值不同

### F2.1.3 — 输出冲突报告
- 若存在冲突，列出冲突类名及其来源模块
- 若无冲突，输出通过确认

## 验收标准 (expect() 断言)

```ts
// 1. 子模块文件存在
const moduleNames = [
  'canvas.base', 'canvas.toolbar', 'canvas.trees', 'canvas.panels',
  'canvas.context', 'canvas.flow', 'canvas.components', 'canvas.thinking',
  'canvas.export', 'canvas.misc',
];
for (const name of moduleNames) {
  const path = `src/styles/${name}.module.css`;
  expect(fs.existsSync(path)).toBe(true);
}

// 2. 类名集合可枚举（不为空）
const allClassNames = new Map<string, { module: string; value: string }[]>();
for (const name of moduleNames) {
  const cssContent = fs.readFileSync(`src/styles/${name}.module.css`, 'utf-8');
  const classNames = extractClassNames(cssContent); // 自定义提取函数
  expect(classNames.length).toBeGreaterThan(0);
  for (const cls of classNames) {
    if (!allClassNames.has(cls.name)) {
      allClassNames.set(cls.name, []);
    }
    allClassNames.get(cls.name)!.push({ module: name, value: cls.value });
  }
}

// 3. 无同名不同值冲突
const conflicts = [];
for (const [className, entries] of allClassNames) {
  const uniqueValues = [...new Set(entries.map(e => e.value))];
  if (uniqueValues.length > 1) {
    conflicts.push({ className, entries });
  }
}
expect(conflicts).toEqual([]); // 无冲突

// 4. 汇总: 总类名数量合理（> 100，不遗漏）
expect(allClassNames.size).toBeGreaterThan(100);
```

## 测试场景

### 场景 1: 修复前基线扫描
- 在修改 `canvas.module.css` 前执行扫描
- 记录当前冲突数量（预期为 0，因 @use 不导出）

### 场景 2: 修复后验证扫描
- 在 `@use` → `@forward` 修复后执行扫描
- 确认无同名不同值冲突

### 场景 3: 增量监控
- 每次修改子模块 CSS 后自动触发扫描
- 防止新引入冲突

## 页面集成说明

【无需页面集成】— 此规格为构建时静态扫描，通过 Node.js 脚本执行。
