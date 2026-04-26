# Spec — E7: MCP Server 可观测性

**基于**: `vibex-architect-proposals-vibex-proposals-20260416/specs/epic-07-mcp-observability.md`

## /health 端点

```
GET /health
Response 200:
{
  "status": "ok" | "degraded",
  "version": "x.y.z",    // 来自 package.json version
  "uptime": 123          // 秒
}
```

**CORS**: 允许所有 origin（生产环境可通过 reverse proxy 限制）

## StructuredLogger

```typescript
// 文件: packages/mcp-server/src/logger.ts

interface LogEntry {
  timestamp: string   // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  service: 'mcp-server'
  tool?: string
  duration?: number   // ms
  success?: boolean
  error?: string      // 当 level === 'error' 时
}

class StructuredLogger {
  info(message: string, meta?: Partial<LogEntry>): void
  warn(message: string, meta?: Partial<LogEntry>): void
  error(message: string, meta?: Partial<LogEntry>): void
}
```

## SDK 版本检查

```typescript
// 当 mcp SDK 版本不在白名单时输出 warn
const SDK_VERSION_WHITELIST = ['^0.5.0', '^0.6.0']
const currentVersion = require('@modelcontextprotocol/sdk/package.json').version
if (!matchesWhitelist(currentVersion, SDK_VERSION_WHITELIST)) {
  logger.warn(`MCP SDK version mismatch: ${currentVersion}`, {
    expected: SDK_VERSION_WHITELIST,
    actual: currentVersion
  })
}
```

## 工具调用日志

```typescript
// 每次 MCP 工具调用前后
logger.info('tool_call_start', { tool: 'review_design', duration: 0 })
try {
  const result = await callTool(name, args)
  logger.info('tool_call_end', { tool: name, duration: Date.now() - start, success: true })
  return result
} catch (e) {
  logger.error('tool_call_error', { tool: name, duration: Date.now() - start, success: false, error: e.message })
  throw e
}
```

## 依赖

- 无新增外部依赖

## 验收测试

```typescript
describe('E7 MCP Observability', () => {
  it('GET /health returns 200 with correct shape', async () => {
    const res = await fetch('http://localhost:3100/health')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toMatch(/^(ok|degraded)$/)
    expect(body.version).toBe(require('../package.json').version)
    expect(typeof body.uptime).toBe('number')
    expect(body.uptime).toBeGreaterThan(0)
  })

  it('tool call logs structured JSON to stdout', async () => {
    const stdout = captureStdout()
    await mcpServer.callTool('review_design', { canvasId: 'test' })
    const lines = stdout.split('\n').filter(Boolean)
    const logEntry = JSON.parse(lines.find(l => l.includes('tool_call')))
    expect(logEntry).toMatchObject({
      timestamp: expect.any(String),
      level: 'info',
      service: 'mcp-server',
      tool: 'review_design',
      duration: expect.any(Number),
      success: true
    })
  })

  it('SDK version mismatch outputs warn log', () => {
    const logger = new StructuredLogger()
    // Mock SDK version to mismatch
    const warnLog = captureStderr()
    // assert warn log contains 'version mismatch'
    expect(warnLog).toContain('version mismatch')
  })
})
```
