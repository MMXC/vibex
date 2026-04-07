# Spec: Epic 7 — MCP Server 可观测性

**Epic ID**: E7
**提案**: A-P2-3
**优先级**: P2
**工时**: 3h
**负责人**: Backend Dev

---

## 1. Overview

为 packages/mcp-server 添加健康检查端点和 structured logging，使 MCP 服务状态可监控、可追踪。

## 2. Scope

### In Scope
- `packages/mcp-server/` — 健康检查端点
- `packages/mcp-server/` — structured logging
- MCP SDK 版本审查（0.5.0）

### Out of Scope
- 与主系统健康检查集成（作为方案二，单独评估）
- MCP 服务高可用部署

## 3. Technical Approach

采用**方案一：添加健康检查 + structured logging**。

### 3.1 健康检查端点

```typescript
// packages/mcp-server/src/health.ts
import type { RequestHandler } from 'express'

export const healthHandler: RequestHandler = (req, res) => {
  res.json({
    status: 'ok',
    version: process.env.MCP_VERSION || '0.5.0',
    connectedClients: connectionPool.size,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    sdkVersion: require('@modelcontextprotocol/sdk/package.json').version,
  })
}

// packages/mcp-server/src/index.ts 集成
app.get('/health', healthHandler)
```

### 3.2 Structured Logging

```typescript
// packages/mcp-server/src/lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  service: 'mcp-server'
  [key: string]: unknown
}

function createLogger(level: LogLevel) {
  return (message: string, meta: Record<string, unknown> = {}) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: 'mcp-server',
      ...meta,
    }
    console.log(JSON.stringify(entry))
  }
}

export const logger = {
  debug: createLogger('debug'),
  info: createLogger('info'),
  warn: createLogger('warn'),
  error: createLogger('error'),
}

// 使用示例
logger.info('tool_called', { tool: name, duration: ms, success: true })
logger.error('connection_failed', { clientId, error: err.message })
```

### 3.3 SDK 版本检查

```typescript
// 启动时检查 SDK 版本
const requiredVersion = '0.5.0'
const currentVersion = require('@modelcontextprotocol/sdk/package.json').version
if (currentVersion !== requiredVersion) {
  logger.warn('sdk_version_mismatch', { required: requiredVersion, current: currentVersion })
}
```

## 4. File Changes

```
Modified:
  packages/mcp-server/src/index.ts           (注册 /health 路由)
  packages/mcp-server/src/tools/*.ts          (替换 console.log → logger)

Added:
  packages/mcp-server/src/health.ts          (新建)
  packages/mcp-server/src/lib/logger.ts       (新建)
  packages/mcp-server/src/__tests__/health.test.ts
```

## 5. Stories

| Story ID | 描述 | 工时 | 验收条件 |
|----------|------|------|---------|
| E7-S1 | MCP /health 端点 | 1.5h | GET /health 返回状态 JSON |
| E7-S2 | Structured logging | 1.5h | 日志输出 JSON 格式，包含 tool/duration/success |

## 6. Acceptance Criteria

```typescript
// E7-S1
describe('MCP Health Endpoint', () => {
  it('should return health status', async () => {
    const res = await fetch('http://localhost:3100/health')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.version).toBeDefined()
    expect(body.uptime).toBeDefined()
  })
})

// E7-S2
describe('Structured Logging', () => {
  it('should output JSON logs', () => {
    const logOutput = captureStdout(() => {
      logger.info('tool_called', { tool: 'test', duration: 42, success: true })
    })
    const parsed = JSON.parse(logOutput)
    expect(parsed).toMatchObject({
      timestamp: expect.any(String),
      level: 'info',
      message: 'tool_called',
      service: 'mcp-server',
      tool: 'test',
      duration: 42,
      success: true,
    })
  })
})
```

## 7. Test Cases

| ID | 输入 | 预期输出 |
|----|------|---------|
| TC01 | GET /health | 200 + {status, version, uptime, connectedClients} |
| TC02 | logger.info('test', {a:1}) | stdout 包含 JSON 对象 |
| TC03 | MCP 服务异常 | logger.error() 输出 error level 日志 |
| TC04 | 进程启动 | SDK version check 日志输出 |

## 8. Edge Cases

- **日志聚合**：structured log 输出到 stdout，需要日志收集基础设施（Datadog/Fluentd）
- **敏感信息**：日志中避免输出 token/secret 等敏感数据（添加自动脱敏层）
- **MCP Server 独立部署**：健康检查 URL 需与主系统约定（如 http://localhost:3100/health）

## 9. Definition of Done

- [ ] MCP /health 端点可访问，返回 200
- [ ] Structured log 输出到 stdout（JSON 格式）
- [ ] 日志包含 tool/duration/success 字段
- [ ] SDK 版本检查日志输出
- [ ] Code review 通过（≥1 reviewer）
