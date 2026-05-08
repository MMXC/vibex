# E07 MCP Server 集成完善 — QA 验证规格

**Epic**: E07 | **验证策略**: API 测试 + 代码审查
**E2E 文件**: mcp-integration.spec.ts（108行，6 个 scenarios）

---

## 端点: GET /api/mcp/health

### 验证场景
验证 MCP Server health endpoint 返回正确响应，E2E integration tests 通过。

### API 验收（curl 验证）

```bash
# E07-API-Q1: health endpoint 返回 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/mcp/health
# 期望: 200

# E07-API-Q2: 响应结构正确
curl -s http://localhost:3000/api/mcp/health | jq .
# 期望:
# {
#   "status": "ok",
#   "timestamp": "2026-05-07T...",
#   "service": "vibex-mcp"
# }

# E07-API-Q3: timestamp 为有效 ISO 8601
curl -s http://localhost:3000/api/mcp/health | jq -e '.timestamp | test("^\\d{4}-\\d{2}-\\d{2}T")'
# 期望: 退出码 0
```

### E2E 验证检查

**mcp-integration.spec.ts 必须包含以下 6 个场景：**
1. health endpoint 返回 200
2. health endpoint 响应结构正确
3. service name 正确
4. timestamp 格式正确
5. 异常情况（服务 down 时返回非 200）
6. 性能（响应时间 < 500ms）

### 验收断言（gstack /qa 格式）

```javascript
// E07-Q1: health endpoint 可访问
const response = await page.request.get('/api/mcp/health')
expect(response.status()).toBe(200)

// E07-Q2: 响应结构
const body = await response.json()
expect(body).toHaveProperty('status', 'ok')
expect(body).toHaveProperty('timestamp')
expect(body).toHaveProperty('service', 'vibex-mcp')

// E07-Q3: timestamp 格式
expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date')

// E07-Q4: 响应时间 < 500ms
const start = Date.now()
await page.request.get('/api/mcp/health')
expect(Date.now() - start).toBeLessThan(500)
```

### 执行方式
```bash
# API 层验证
curl -s http://localhost:3000/api/mcp/health

# E2E 层验证（Playwright）
npx playwright test tests/e2e/mcp-integration.spec.ts
# 期望: 6 passing
```
