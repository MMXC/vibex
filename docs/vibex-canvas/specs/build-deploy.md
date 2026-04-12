# 规格 — 构建与部署验证

## 功能点

### F3.1.1 — 构建验证
- 执行 `npm run build`
- 验证 exit code === 0
- 验证 stderr 无 warning/error 关键字

### F3.1.2 — 构建产物检查
- 验证 `out/` 或 `.next/` 目录存在
- 验证 CSS 文件数量 > 0
- 验证 CSS 文件中无 `undefined` 字样（正则匹配）

### F3.2.1 — Dev Server 启动
- 执行 `npm run dev`
- 验证服务监听端口（默认 3000）
- 验证 HTTP GET 返回 200

### F3.2.2 — 类名运行时验证
- Playwright 访问关键页面
- 验证 `canvas.module.css` 导入的类名在 DOM 中非 undefined

## 验收标准 (expect() 断言)

### F3.1 — 构建验证

```ts
// 1. 构建命令执行成功
const buildResult = execSync('npm run build', {
  cwd: '/root/.openclaw/vibex',
  encoding: 'utf-8',
  timeout: 120000,
});
expect(buildResult.status).toBe(0);
expect(buildResult.code).toBe(0);

// 2. 无 CSS 编译警告
expect(buildResult.stdout + buildResult.stderr).not.toMatch(/warning.*css/i);
expect(buildResult.stdout + buildResult.stderr).not.toMatch(/error.*css/i);

// 3. 构建产物存在
const outDir = fs.existsSync('/root/.openclaw/vibex/.next') || fs.existsSync('/root/.openclaw/vibex/out');
expect(outDir).toBe(true);

// 4. CSS 产物中无 undefined
const cssFiles = glob.sync('/root/.openclaw/vibex/**/*.css');
let hasUndefined = false;
for (const file of cssFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  if (content.includes('undefined')) {
    hasUndefined = true;
    console.error(`Found 'undefined' in: ${file}`);
  }
}
expect(hasUndefined).toBe(false);
```

### F3.2 — 部署验证

```ts
// 1. Dev server 启动
const devServer = spawn('npm', ['run', 'dev'], {
  cwd: '/root/.openclaw/vibex',
  stdio: 'pipe',
});
// 等待启动（端口 3000）
await waitForPort(3000, { timeout: 30000 });
expect(devServer.pid).toBeDefined();

// 2. 页面可访问
const response = await page.goto('http://localhost:3000', { timeout: 10000 });
expect(response.status()).toBe(200);

// 3. 13 个组件类名非 undefined（随机采样 5 个验证）
const samples = ['treePanel', 'canvasToolbar', 'projectBar', 'treeStatus', 'boundedContextGroup'];
for (const cls of samples) {
  const el = await page.$(`[class*="${cls}"]`);
  expect(el).not.toBeNull();
  const classAttr = await el.getAttribute('class');
  expect(classAttr).not.toBeNull();
  expect(classAttr).not.toContain('undefined');
}

// 4. Canvas 页面特定验证
await page.goto('http://localhost:3000/canvas');
await page.waitForSelector('[class*="treePanel"]', { timeout: 5000 });
const treePanel = await page.$('[class*="treePanel"]');
const styles = await treePanel.evaluate(el => window.getComputedStyle(el).toString());
expect(styles).not.toBe(''); // 样式对象非空
```

## 测试场景

### 场景 1: 构建流水线（CI）
```bash
# 顺序执行
npm install
npm run build
# 断言: exit code === 0
```

### 场景 2: 本地验证（修复后）
```bash
# 开发自测
npm run build && npm run dev
# Playwright 验证脚本
```

### 场景 3: 生产部署前
```bash
# 构建产物检查
npm run build
# 扫描 CSS 中的 undefined
node scripts/validate-css-build.js
```

## 页面集成说明

【需页面集成】— 需要完整构建环境和运行时环境。
- 构建: Node.js 18+, npm
- 运行时: Dev server (`npm run dev`)
- 验证: Playwright browser environment

## 回归策略

| 检查点 | 修复前 | 修复后 |
|--------|--------|--------|
| `npm run build` | 成功（但样式无效） | 成功且样式正确 |
| CSS 类名值 | undefined | 正确哈希值 |
| 页面渲染 | 组件无样式 | 组件样式正常 |
