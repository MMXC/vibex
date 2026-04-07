# Spec: E5 - MCP Server 集成

## 概述
构建 `@vibex/mcp-server` npm 包，让 Claude Desktop 可访问 VibeX 项目上下文。

## F5.1: MCP Server 包结构

### 规格
- 包名: `@vibex/mcp-server`
- 协议: MCP (Model Context Protocol) 0.1+
- 工具: `getProject`, `getNodes`, `getFlow`, `searchComponents`
- 依赖: `@modelcontextprotocol/sdk`

### 验收
```typescript
test('package name is @vibex/mcp-server', () => {
  const pkg = require('@vibex/mcp-server/package.json');
  expect(pkg.name).toBe('@vibex/mcp-server');
});

test('server exports required tools', () => {
  const { tools } = require('@vibex/mcp-server');
  const toolNames = tools.map((t: any) => t.name);
  expect(toolNames).toContain('getProject');
  expect(toolNames).toContain('getNodes');
  expect(toolNames).toContain('getFlow');
});

test('package can be installed from npm', async () => {
  const result = await exec('npm install @vibex/mcp-server --dry-run');
  expect(result.exitCode).toBe(0);
});
```

---

## F5.2: Claude Desktop 连接

### 规格
- 配置: Claude Desktop `claude_desktop_config.json` 添加 MCP server
- 连接: Claude 启动后可发现 VibeX 项目工具
- 查询: Claude 可调用 `getProject` 返回项目结构 JSON

### 验收
```typescript
test('MCP server starts without error', async () => {
  const server = require('@vibex/mcp-server');
  await expect(server.start()).resolves.not.toThrow();
});

test('getProject tool returns project structure', async () => {
  const { tools } = require('@vibex/mcp-server');
  const getProject = tools.find((t: any) => t.name === 'getProject');
  const result = await getProject.handler({ projectId: 'test' });
  expect(result).toHaveProperty('nodes');
  expect(result).toHaveProperty('edges');
  expect(result).toHaveProperty('metadata');
});
```

---

## F5.3: 集成文档

### 规格
- 文件: `docs/mcp-integration.md`
- 内容: 安装步骤 → 配置 Claude Desktop → 使用示例 → 故障排查
- 示例: ≥ 3 个 Claude 使用 VibeX 工具的场景

### 验收
```typescript
test('docs/mcp-integration.md exists', () => {
  const path = 'docs/mcp-integration.md';
  expect(existsSync(path)).toBe(true);
});

test('doc contains installation steps', () => {
  const content = readFileSync('docs/mcp-integration.md', 'utf-8');
  expect(content).toContain('npm install');
  expect(content).toContain('claude_desktop_config.json');
});

test('doc contains >= 3 usage examples', () => {
  const content = readFileSync('docs/mcp-integration.md', 'utf-8');
  const examples = content.match(/```[\s\S]*?```/g) || [];
  expect(examples.length).toBeGreaterThanOrEqual(3);
});
```
