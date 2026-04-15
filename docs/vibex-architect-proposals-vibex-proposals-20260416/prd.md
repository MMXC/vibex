# PRD: VibeX E6/E7 架构提案

**项目**: vibex-architect-proposals-vibex-proposals-20260416
**日期**: 2026-04-16
**来源**: `vibex-architect-proposals-vibex-proposals-20260411` Epic 6 & 7
**Plan 类型**: feat
**Plan 深度**: Standard

---

## 1. 执行摘要

### 背景

VibeX 平台的代码安全检测当前依赖字符串正则匹配（`eval`/`new Function` 关键字检测），存在以下问题：
- **高误报率**：正则匹配会将合法代码中的 `evaluate`、`function` 等词误判为危险模式
- **无法处理混淆代码**：Unicode 逃逸、转义序列等手法可轻易绕过正则
- **MCP 服务黑盒**：MCP Server 无健康检查、无结构化日志，运维无法感知服务状态

### 目标

| 目标 | 指标 |
|------|------|
| 降低代码安全检测误报率 | 误报率 < 1%（当前未量化，预计 >5%） |
| 替换正则方案为 AST 解析 | E6-S1 交付验收通过 |
| MCP 服务可观测 | E7-S1 /health 返回 200 + JSON |
| 日志可解析可追踪 | E7-S2 structured log 输出 JSON 格式 |

### 成功指标

- E6: 代码安全分析误报率 < 1%，AST 解析单文件 < 50ms
- E7: `GET /health` 返回 200 + JSON，日志输出 JSON 格式含 tool/duration/success 字段
- 总工时: 7h（P2 优先级）

---

## 2. Epic 拆分

### 2.1 Epic 6 — Prompts 安全 AST 扫描

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| E6-S1 | @babel/parser AST 解析实现 | 新建 `security/codeAnalyzer.ts`，用 AST 替代正则检测 eval/new Function | 2h | 见章节 3 |
| E6-S2 | 误报率 <1% 测试集验证 | 1000 条合法代码样本，误报率验证 | 1h | 见章节 3 |
| E6-S3 | AST 解析性能验证 | 单文件解析 <50ms 性能测试 | 1h | 见章节 3 |

### 2.2 Epic 7 — MCP Server 可观测性

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| E7-S1 | MCP /health 端点 | 新建 `mcp-server/src/health.ts`，返回 {status, version, uptime} | 1.5h | 见章节 3 |
| E7-S2 | Structured logging | 新建 `mcp-server/src/lib/logger.ts`，JSON 格式输出 | 1.5h | 见章节 3 |

**总工时: 7h | 优先级: P2 | 负责人: Backend Dev**

---

## 3. 验收标准（可写 expect() 断言）

### E6-S1 — @babel/parser AST 解析实现

```typescript
// E6-S1: analyzeCodeSecurity() 精确检测
describe('analyzeCodeSecurity', () => {
  it('should detect eval()', () => {
    const report = analyzeCodeSecurity('eval("alert(1)")')
    expect(report.hasUnsafe).toBe(true)
    expect(report.unsafeEval.length).toBeGreaterThan(0)
  })

  it('should detect new Function()', () => {
    const report = analyzeCodeSecurity('new Function("return 1")')
    expect(report.hasUnsafe).toBe(true)
    expect(report.unsafeNewFunction.length).toBeGreaterThan(0)
  })

  it('should detect setTimeout(string, 0)', () => {
    const report = analyzeCodeSecurity('setTimeout("code", 0)')
    expect(report.hasUnsafe).toBe(true)
    expect(report.unsafeDynamicCode.length).toBeGreaterThan(0)
  })

  it('should not detect safe code as unsafe', () => {
    const report = analyzeCodeSecurity('const x = 1; return x * 2')
    expect(report.hasUnsafe).toBe(false)
    expect(report.unsafeEval).toHaveLength(0)
  })

  it('should parse non-JS syntax error gracefully', () => {
    const report = analyzeCodeSecurity('=== not valid js ===')
    expect(report.confidence).toBeLessThan(100)
    // 不应崩溃，返回 confidence < 100
  })
})
```

### E6-S2 — 误报率 <1% 测试集验证

```typescript
// E6-S2: 误报率验证
it('should have false positive rate < 1% on 1000 safe samples', () => {
  const safeSamples = loadSafeCodeSamples(1000) // 1000 条合法代码
  const falsePositives = safeSamples
    .map(code => analyzeCodeSecurity(code))
    .filter(r => r.hasUnsafe).length
  const rate = falsePositives / safeSamples.length
  expect(rate).toBeLessThan(0.01) // < 1%
})
```

### E6-S3 — AST 解析性能验证

```typescript
// E6-S3: 性能基准
it('should parse 5000-line file < 50ms', () => {
  const largeCode = generateLargeCodeFile(5000)
  const start = Date.now()
  analyzeCodeSecurity(largeCode)
  expect(Date.now() - start).toBeLessThan(50)
})
```

### E7-S1 — MCP /health 端点

```typescript
// E7-S1: 健康检查端点
describe('GET /health', () => {
  it('should return 200 with status ok', async () => {
    const res = await fetch('http://localhost:3100/health')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
  })

  it('should include version, uptime, timestamp fields', async () => {
    const res = await fetch('http://localhost:3100/health')
    const body = await res.json()
    expect(body.version).toBeDefined()
    expect(typeof body.uptime).toBe('number')
    expect(body.uptime).toBeGreaterThan(0)
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('should include connectedClients', async () => {
    const res = await fetch('http://localhost:3100/health')
    const body = await res.json()
    expect(typeof body.connectedClients).toBe('number')
  })
})
```

### E7-S2 — Structured logging

```typescript
// E7-S2: 结构化日志
describe('Structured Logging', () => {
  it('should output JSON to stdout', () => {
    const logOutput = captureStdout(() => {
      logger.info('tool_called', { tool: 'test', duration: 42, success: true })
    })
    const parsed = JSON.parse(logOutput.trim())
    expect(parsed.level).toBe('info')
    expect(parsed.message).toBe('tool_called')
    expect(parsed.service).toBe('mcp-server')
    expect(parsed.tool).toBe('test')
    expect(parsed.duration).toBe(42)
    expect(parsed.success).toBe(true)
    expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('should include error level logs', () => {
    const logOutput = captureStdout(() => {
      logger.error('connection_failed', { clientId: 'c1', error: 'timeout' })
    })
    const parsed = JSON.parse(logOutput.trim())
    expect(parsed.level).toBe('error')
    expect(parsed.message).toBe('connection_failed')
    expect(parsed.clientId).toBe('c1')
  })
})
```

---

## 4. 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F6.1 | security/codeAnalyzer.ts | AST 安全分析工具函数 | E6-S1 expect 断言 | 【需集成】code-review.ts, code-generation.ts |
| F6.2 | AST 集成 | 将 codeAnalyzer 集成到 prompts 模块 | code-review 和 code-generation 调用 analyzeCodeSecurity | 【需页面集成】Prompts 相关页面 |
| F6.3 | 误报率测试集 | 1000 条合法代码误报率验证 | E6-S2 expect 断言 | 无 |
| F6.4 | 性能测试 | AST 解析 <50ms 验证 | E6-S3 expect 断言 | 无 |
| F7.1 | /health 端点 | MCP Server 健康检查路由 | E7-S1 expect 断言 | 无（MCP Server 独立部署） |
| F7.2 | Structured logger | JSON 格式日志工具 | E7-S2 expect 断言 | 【需集成】所有 tool handlers |

---

## 5. DoD (Definition of Done)

### E6 — Prompts 安全 AST 扫描

- [ ] `security/codeAnalyzer.ts` 实现并通过 E6-S1 所有 expect 断言
- [ ] 误报率测试集通过（1000 条合法代码，误报率 <1%）
- [ ] 性能测试通过（单文件 5000 行，解析 <50ms）
- [ ] 集成到 `lib/prompts/code-review.ts` 和 `lib/prompts/code-generation.ts`
- [ ] 移除旧正则实现 `_regexSecurity.ts`（如存在）
- [ ] Lint + type-check 通过
- [ ] Code review 通过（≥1 reviewer）

### E7 — MCP Server 可观测性

- [ ] `GET /health` 返回 200 + JSON（status/version/uptime/timestamp/connectedClients）
- [ ] Structured logger 输出 JSON 到 stdout，含 timestamp/level/message/service/tool/duration/success
- [ ] 所有 tool handlers 使用 logger 替代 console.log
- [ ] SDK 版本检查日志输出（启动时）
- [ ] E7-S1 / E7-S2 所有 expect 断言通过
- [ ] Code review 通过（≥1 reviewer）

### 全局 DoD

- [ ] 所有 Story 工时在估算范围内（总工时 7h ±20%）
- [ ] 文档更新（README/changelog）
- [ ] 不引入新的 high/critical 安全漏洞

---

## 6. 依赖关系

```
E6-S1 (2h) → E6-S2 (1h) → E6-S3 (1h)
  ↑ 依赖                    ↑ 依赖
E6-S1 交付 codeAnalyzer → E6-S2/E6-S3 验证

E7-S1 (1.5h) → E7-S2 (1.5h)
  ↑ 并行可独立进行
```

---

## 7. 技术约束

| 约束 | 说明 |
|------|------|
| Babel 包体积 | `@babel/parser` ~5MB，确认 bundle size 限制 |
| MCP Server 独立部署 | /health 端口约定 3100，与主系统约定 |
| 日志脱敏 | 避免在 structured log 中输出 token/secret |
| 解析 fallback | Babel 解析失败时 confidence 降至 50，不阻断流程 |
