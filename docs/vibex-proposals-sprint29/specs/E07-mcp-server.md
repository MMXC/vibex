# E07: MCP Server 集成完善 — 详细规格

## 1. 背景

Sprint 28 E07 实现 MCP Server 集成，本规格补全 MCP 健康检查协议定义和集成测试用例。

## 2. MCP 健康检查协议

### 2.1 健康检查 Endpoint

**Request**
```bash
GET /api/mcp/health
```

**Response 200**
```json
{
  "status": "ok",
  "timestamp": "2026-05-01T10:00:00.000Z",
  "version": "1.0.0"
}
```

**Response 503**（服务异常）
```json
{
  "status": "error",
  "timestamp": "2026-05-01T10:00:00.000Z",
  "error": "Database connection failed"
}
```

### 2.2 MCP 协议调用

MCP 协议使用 JSON-RPC 2.0 格式。

**Request (JSON-RPC)**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "vibex_analyze",
    "arguments": { "projectId": "xxx" }
  }
}
```

**Response (JSON-RPC)**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "success": true,
    "data": { ... }
  }
}
```

**Error Response**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32600,
    "message": "Invalid request"
  }
}
```

## 3. 边界条件

| 场景 | HTTP 状态 | 返回内容 |
|------|-----------|----------|
| 服务正常 | 200 | `{ status: "ok", timestamp, version }` |
| 数据库异常 | 503 | `{ status: "error", error: "..." }` |
| 请求超时 | 504 | `{ error: "Gateway Timeout" }` |
| 无效 JSON-RPC | 200 | `{ jsonrpc: "2.0", id, error: { code: -32600 } }` |
| 方法不存在 | 200 | `{ jsonrpc: "2.0", id, error: { code: -32601 } }` |

## 4. 测试用例

### 4.1 单元测试 (api/mcp-health.spec.ts)

- GET /api/mcp/health 返回 200 + valid JSON
- timestamp 为 ISO 8601 格式
- status 字段为 "ok" 或 "error"
- 版本号非空字符串

### 4.2 E2E 测试 (mcp-integration.spec.ts)

- MCP 健康检查通过
- 工具调用成功返回结果
- 错误处理正确返回 JSON-RPC error

## 5. 验收门控

- [ ] GET /api/mcp/health 返回 `{ status, timestamp, version }`
- [ ] JSON-RPC 2.0 协议兼容
- [ ] 单元测试 api/mcp-health.spec.ts 通过
- [ ] E2E 测试 mcp-integration.spec.ts 通过
- [ ] 错误响应格式符合 JSON-RPC 规范
- [ ] `tsc --noEmit` exits 0