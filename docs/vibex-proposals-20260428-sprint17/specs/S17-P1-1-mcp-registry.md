# S17-P1-1: MCP Tool Registry 收尾

**ID**: S17-P1-1
**标题**: MCP Tool Registry 收尾
**优先级**: P1
**Sprint**: S17
**状态**: 待开发
**依赖**: S16-P2-2（MCP 工具文档）

---

## 1. 问题描述

S16-P2-2 交付了 5 个 MCP 工具文档（review_design / figma_import / generate_code / ERROR_HANDLING_POLICY / MCP_TOOL_GOVERNANCE），但 S16-P2-2 验收标准中的以下三项**未完成**：

1. `GET /health` 端点未返回 `tools[]` 数组（`packages/mcp-server/src/index.ts`）
2. `scripts/generate-tool-index.ts` 未创建
3. `docs/mcp-tools/INDEX.md` 未生成

这导致外部 AI Agent 无法自动发现可用工具，文档也无法随工具新增自动更新。

---

## 2. 影响范围

- `packages/mcp-server/src/index.ts`（GET /health tool 列表）
- `scripts/generate-tool-index.ts`（新建）
- `docs/mcp-tools/INDEX.md`（新建）
- GitHub Actions CI 钩子（每次 PR 自动更新 INDEX.md）

---

## 3. 前置条件

### 已就绪的交付物

- `docs/mcp-tools/review_design.md`
- `docs/mcp-tools/figma_import.md`
- `docs/mcp-tools/generate_code.md`
- `docs/mcp-tools/ERROR_HANDLING_POLICY.md`
- `docs/mcp-tools/MCP_TOOL_GOVERNANCE.md`
- `packages/mcp-server/src/tools/list.ts`（返回 Tool[] 数组）

### 环境要求

- Node.js ≥ 18
- pnpm 已安装
- MCP server 可本地启动（`pnpm --filter vibex-mcp-server dev`）

---

## 4. 验收标准（DoD）

所有断言使用 `expect()`：

### 4.1 GET /health 返回 tools[]

```bash
curl -s http://localhost:3100/health | jq .
```

| 断言 | 说明 |
|------|------|
| `expect(response.status).toBe(200)` | HTTP 200 |
| `expect(response.tools).toBeInstanceOf(Array)` | tools 是数组 |
| `expect(response.tools.length).toBeGreaterThanOrEqual(5)` | 至少 5 个工具 |
| `expect(response.tools[0]).toHaveProperty('name')` | 每个工具有 name |
| `expect(response.tools[0]).toHaveProperty('description')` | 每个工具有 description |
| `expect(response.tools[0]).toHaveProperty('inputSchema')` | 每个工具有 inputSchema |
| `expect(response.tools.map(t => t.name)).toContain('review_design')` | review_design 存在 |
| `expect(response.tools.map(t => t.name)).toContain('generate_code')` | generate_code 存在 |

### 4.2 docs/mcp-tools/INDEX.md 自动生成

| 断言 | 说明 |
|------|------|
| `expect(fs.existsSync('docs/mcp-tools/INDEX.md')).toBe(true)` | 文件存在 |
| `expect(indexContent).toContain('## Tool Index')` | 有标题 |
| `expect(indexContent).toContain('review_design')` | 包含 review_design |
| `expect(indexContent).toContain('generate_code')` | 包含 generate_code |
| `expect(indexContent).toContain('figma_import')` | 包含 figma_import |
| `expect(indexContent).toContain('ERROR_HANDLING_POLICY')` | 包含 ERROR_HANDLING_POLICY |
| `expect(indexContent).toContain('MCP_TOOL_GOVERNANCE')` | 包含 MCP_TOOL_GOVERNANCE |
| `expect(indexContent).toMatch(/Last updated: \d{4}-\d{2}-\d{2}/)` | 有更新时间戳 |

### 4.3 scripts/generate-tool-index.ts 可独立运行

```bash
node scripts/generate-tool-index.ts
echo $?  # 必须是 0
```

| 断言 | 说明 |
|------|------|
| `expect(exitCode).toBe(0)` | 脚本成功退出 |
| `expect(fs.existsSync('docs/mcp-tools/INDEX.md')).toBe(true)` | 输出文件已生成 |
| `expect(indexContent.length).toBeGreaterThan(0)` | 有内容 |
| `expect(stderr).toBe('')` | 无错误输出 |

### 4.4 CI 自动更新（可选但推荐）

| 断言 | 说明 |
|------|------|
| 每次新增 `.md` 文档后，INDEX.md 中工具列表数量正确 | CI 运行后检查 |

---

## 5. 实现方案

### 5.1 修改 packages/mcp-server/src/index.ts

在现有 `/health` 端点中添加 `tools` 字段，直接调用 `listTools()` 返回值：

```typescript
// packages/mcp-server/src/index.ts

// 找到现有的 /health 端点，添加 tools 字段
server.setRequestHandler(
  // ... 现有逻辑
);

// 新增或修改 GET /health 路由（如果使用 Express/Fastify）：
// GET /health 返回：
// {
//   status: 'ok',
//   version: SERVER_VERSION,
//   uptime: process.uptime(),
//   tools: listTools(),  // <-- 新增
//   timestamp: new Date().toISOString(),
// }
```

### 5.2 创建 scripts/generate-tool-index.ts

```typescript
#!/usr/bin/env node
/**
 * scripts/generate-tool-index.ts
 * S17-P1-1: MCP Tool Registry 收尾
 *
 * 功能：
 * 1. 读取 docs/mcp-tools/*.md 文件
 * 2. 从每个文件的 frontmatter 提取 name/description
 * 3. 生成 docs/mcp-tools/INDEX.md
 *
 * 运行：
 *   node scripts/generate-tool-index.ts
 *   pnpm generate-tool-index
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.resolve(__dirname, '../../docs/mcp-tools');
const OUTPUT_FILE = path.join(DOCS_DIR, 'INDEX.md');

// Frontmatter 正则
const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n/;
const NAME_REGEX = /^name:\s*(.+)$/m;
const DESCRIPTION_REGEX = /^description:\s*(.+)$/m;
const SINCE_REGEX = /^since:\s*(.+)$/m;

interface ToolMeta {
  name: string;
  description: string;
  since?: string;
  filename: string;
}

/** 从单个 .md 文件解析 frontmatter */
function parseToolMeta(filePath: string): ToolMeta | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fmMatch = content.match(FRONTMATTER_REGEX);

  if (!fmMatch) {
    // 尝试从文件名推断（兜底）
    const filename = path.basename(filePath, '.md');
    if (filename === 'INDEX') return null;
    return {
      name: filename,
      description: `Tool: ${filename}`,
      filename: path.basename(filePath),
    };
  }

  const fm = fmMatch[1];
  const nameMatch = fm.match(NAME_REGEX);
  const descMatch = fm.match(DESCRIPTION_REGEX);
  const sinceMatch = fm.match(SINCE_REGEX);

  const name = nameMatch?.[1]?.trim() ?? path.basename(filePath, '.md');
  const description = descMatch?.[1]?.trim() ?? '';

  return {
    name,
    description,
    since: sinceMatch?.[1]?.trim(),
    filename: path.basename(filePath),
  };
}

/** 生成 INDEX.md 内容 */
function generateIndex(tools: ToolMeta[]): string {
  const today = new Date().toISOString().split('T')[0];

  const lines: string[] = [
    `# MCP Tools Index`,
    ``,
    `> Auto-generated by \`scripts/generate-tool-index.ts\`. Do not edit manually.`,
    ``,
    `**Last updated**: ${today}`,
    ``,
    `This index lists all MCP tools available in the VibeX MCP server.`,
    ``,
    `---\n`,
    ``,
    `## Tool Index (${tools.length} tools)\n`,
  ];

  for (const tool of tools) {
    lines.push(`### ${tool.name}`);
    lines.push(``);
    lines.push(`${tool.description}`);
    if (tool.since) {
      lines.push(`\n> Available since: ${tool.since}`);
    }
    lines.push(``);
    lines.push(`**File**: \`${tool.filename}\` — [View documentation](./${tool.filename})`);
    lines.push(``);
    lines.push(`---\n`);
  }

  lines.push(`\n## Stats\n`);
  lines.push(`- Total tools: ${tools.length}`);
  lines.push(`- Last updated: ${today}`);

  return lines.join('\n');
}

/** 主函数 */
function main(): void {
  // 确保 docs/mcp-tools 目录存在
  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`ERROR: Directory not found: ${DOCS_DIR}`);
    process.exit(1);
  }

  // 读取所有 .md 文件（排除 INDEX.md）
  const files = fs.readdirSync(DOCS_DIR).filter(
    (f) => f.endsWith('.md') && f !== 'INDEX.md'
  );

  const tools: ToolMeta[] = [];
  for (const file of files) {
    const filePath = path.join(DOCS_DIR, file);
    const meta = parseToolMeta(filePath);
    if (meta) {
      tools.push(meta);
    }
  }

  // 按 name 排序
  tools.sort((a, b) => a.name.localeCompare(b.name));

  // 生成 INDEX.md
  const indexContent = generateIndex(tools);
  fs.writeFileSync(OUTPUT_FILE, indexContent, 'utf-8');

  console.log(`✅ Generated INDEX.md with ${tools.length} tools: ${OUTPUT_FILE}`);
}

main();
```

### 5.3 GitHub Actions CI 钩子（建议添加）

在 `.github/workflows/mcp-tools.yml`（新建）：

```yaml
name: MCP Tools Index

on:
  push:
    paths:
      - 'docs/mcp-tools/*.md'
  pull_request:
    paths:
      - 'docs/mcp-tools/*.md'

jobs:
  update-index:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: node scripts/generate-tool-index.ts
      - run: git diff --stat
      - name: Create PR comment
        if: github.event_name == 'pull_request'
        run: |
          git config --local user.email "ci@vibex.ai"
          git config --local user.name "CI Bot"
          git add docs/mcp-tools/INDEX.md
          git diff --cached --quiet || git commit -m "chore: auto-update MCP tools INDEX [skip ci]"
          git push
```

---

## 6. 完整测试代码

### 6.1 MCP health endpoint 测试

```typescript
/**
 * mcp-health.spec.ts — S17-P1-1 MCP Tool Registry 收尾
 *
 * 验证 GET /health 返回完整的 tools[] 数组
 */

import { test, expect } from '@playwright/test';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL ?? 'http://localhost:3100';

test.describe('S17-P1-1: MCP Tool Registry', () => {
  test('GET /health 返回 tools[] 数组', async ({ request }) => {
    const response = await request.get(`${MCP_SERVER_URL}/health`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('tools');
    expect(body.tools).toBeInstanceOf(Array);
    expect(body.tools.length).toBeGreaterThanOrEqual(5);

    // 验证每个工具的字段
    for (const tool of body.tools) {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('inputSchema');
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(tool.inputSchema).toBeInstanceOf(Object);
    }

    // 验证已知工具存在
    const toolNames = body.tools.map((t: { name: string }) => t.name);
    expect(toolNames).toContain('review_design');
    expect(toolNames).toContain('generate_code');
    expect(toolNames).toContain('figma_import');
    expect(toolNames).toContain('createProject');
    expect(toolNames).toContain('getProject');
    expect(toolNames).toContain('listComponents');
  });

  test('GET /health 返回 health_check 工具', async ({ request }) => {
    const response = await request.get(`${MCP_SERVER_URL}/health`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    const healthTool = body.tools.find((t: { name: string }) => t.name === 'health_check');
    expect(healthTool).toBeDefined();
    expect(healthTool.inputSchema).toEqual({
      type: 'object',
      properties: {},
      required: [],
    });
  });

  test('GET /health 返回版本和 uptime', async ({ request }) => {
    const response = await request.get(`${MCP_SERVER_URL}/health`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body.status).toBe('ok');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('uptime');
    expect(typeof body.uptime).toBe('number');
    expect(body.uptime).toBeGreaterThan(0);
    expect(body).toHaveProperty('timestamp');
  });
});
```

### 6.2 generate-tool-index.ts 集成测试

```typescript
/**
 * generate-tool-index.spec.ts — S17-P1-1 MCP Tool Registry 收尾
 *
 * 验证 generate-tool-index.ts 脚本可独立运行且输出正确
 */

import { test, expect } from '@play/test';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const SCRIPT_PATH = path.resolve(__dirname, '../../scripts/generate-tool-index.ts');
const OUTPUT_PATH = path.resolve(__dirname, '../../docs/mcp-tools/INDEX.md');

test.describe('S17-P1-1: generate-tool-index.ts', () => {
  test('脚本退出码为 0', () => {
    let exitCode = 0;
    try {
      execSync(`node ${SCRIPT_PATH}`, { stdio: 'pipe' });
    } catch (err) {
      exitCode = (err as { status?: number }).status ?? 1;
    }
    expect(exitCode).toBe(0);
  });

  test('生成 docs/mcp-tools/INDEX.md 文件', () => {
    expect(fs.existsSync(OUTPUT_PATH)).toBe(true);
  });

  test('INDEX.md 包含所有已知工具', () => {
    const content = fs.readFileSync(OUTPUT_PATH, 'utf-8');

    const expectedTools = [
      'review_design',
      'generate_code',
      'figma_import',
      'ERROR_HANDLING_POLICY',
      'MCP_TOOL_GOVERNANCE',
    ];

    for (const tool of expectedTools) {
      expect(content).toContain(tool);
    }
  });

  test('INDEX.md 包含更新时间和标题', () => {
    const content = fs.readFileSync(OUTPUT_PATH, 'utf-8');
    expect(content).toContain('Last updated');
    expect(content).toContain('# MCP Tools Index');
  });

  test('重复运行脚本不报错（幂等性）', () => {
    let exitCode = 0;
    try {
      execSync(`node ${SCRIPT_PATH`, { stdio: 'pipe' });
      execSync(`node ${SCRIPT_PATH`, { stdio: 'pipe' }); // 第二次运行
    } catch (err) {
      exitCode = (err as { status?: number }).status ?? 1;
    }
    expect(exitCode).toBe(0);
  });
});
```

---

## 7. DoD Checklist

- [ ] `curl http://localhost:3100/health` 返回 200 + `tools[]` 数组（≥5 个工具）
- [ ] 每个工具对象包含 `name`/`description`/`inputSchema`
- [ ] `node scripts/generate-tool-index.ts` 退出码为 0
- [ ] `docs/mcp-tools/INDEX.md` 存在且包含所有 5 个工具的索引
- [ ] INDEX.md 包含 Last updated 时间戳
- [ ] 脚本可重复运行（幂等性）
- [ ] `pnpm playwright test mcp-health.spec.ts` 全通过
- [ ] `pnpm playwright test generate-tool-index.spec.ts` 全通过

---

## 8. 执行依赖

| 类型 | 内容 |
|------|------|
| 需要修改的文件 | `packages/mcp-server/src/index.ts`（GET /health 添加 tools 字段）<br>`scripts/generate-tool-index.ts`（新建） |
| 需要新建的文件 | `docs/mcp-tools/INDEX.md`（由脚本生成）<br>`.github/workflows/mcp-tools.yml`（CI 自动更新） |
| 前置依赖 | S16-P2-2 MCP 工具文档（5 docs 已就绪） |
| package.json 添加 script | `"generate-tool-index": "node scripts/generate-tool-index.ts"` |
| 预计工时 | 1d |
| 验证命令 | `curl http://localhost:3100/health && node scripts/generate-tool-index.ts` |
