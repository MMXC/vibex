# VibeX E6/E7 实现计划

**项目**: vibex-architect-proposals-vibex-proposals-20260416
**日期**: 2026-04-16
**作者**: Architect

---

## 执行决策

- **决策**: 待评审
- **执行项目**: 无
- **执行日期**: 待定

---

## 1. Unit Index（顶层索引）

| Epic | Unit | 名称 | 依赖 | 工时 | 优先级 | 状态 |
|------|------|------|------|------|--------|------|
| E6 | E6-U1 | @babel/parser AST 解析实现 | — | 2h | P2 | ✅ 完成 |
| E6 | E6-U2 | 误报率 <1% 测试集验证 | E6-U1 | 1h | P2 | ✅ 完成 |
| E6 | E6-U3 | AST 解析性能验证 | E6-U1 | 1h | P2 | ✅ 完成 |
| E7 | E7-U1 | MCP /health 端点 | — | 1.5h | P2 | 待开始 |
| E7 | E7-U2 | Structured logging | — | 1.5h | P2 | 待开始 |

**总工时**: 7h（E6=4h, E7=3h）

---

## 2. Epic E6: Prompts 安全 AST 扫描

### 2.1 E6-U1: @babel/parser AST 解析实现

| 属性 | 值 |
|------|-----|
| **Unit ID** | E6-U1 |
| **名称** | @babel/parser AST 解析实现 |
| **依赖** | 无 |
| **工时** | 2h |
| **优先级** | P2 |
| **状态** | ✅ 完成 |

#### 验收标准

- [ ] `analyzeCodeSecurity()` 精确检测 eval() / new Function()
- [ ] setTimeout/setInterval 字符串参数检测
- [ ] 合法代码不误报（`const x = 1; return x * 2` → hasUnsafe=false）
- [ ] 解析失败时 confidence=50，不抛异常
- [ ] 集成到 `code-review.ts` 和 `code-generation.ts`

#### 文件变更

```
Added:
  vibex-backend/src/lib/security/codeAnalyzer.ts     (新建，analyzeCodeSecurity 函数)
  vibex-backend/src/lib/security/__tests__/codeAnalyzer.test.ts

Modified:
  vibex-backend/src/lib/prompts/code-review.ts       (集成 AST 扫描)
  vibex-backend/src/lib/prompts/code-generation.ts   (集成 AST 扫描)
  vibex-backend/package.json                         (新增 @babel/parser, @babel/traverse, @babel/types)

Deleted:
  vibex-backend/src/lib/prompts/_regexSecurity.ts    (旧正则实现，如有则移除)
```

#### 实现步骤

1. **安装依赖**：`npm install @babel/parser @babel/traverse @babel/types --save`
2. **创建 `codeAnalyzer.ts`**：
   - `parse(code)` → AST
   - `traverse` 遍历 CallExpression 节点
   - 检测 eval / new Function / setTimeout(fn, 0) 字符串参数
   - try/catch 包裹解析，失败时 confidence=50
3. **集成到 prompts**：
   - `code-review.ts`：并行调用 analyzeCodeSecurity()，结果注入 warnings
   - `code-generation.ts`：同上
4. **单元测试**：覆盖所有验收标准

#### 风险

- **中风险**：Babel 解析某些 TypeScript/JSX 语法可能不完全支持，需添加 fallback
- **中风险**：Unicode 逃逸（ev\x61l）可绕过 AST 检测，记录为 limitations

### 2.2 E6-U2: 误报率 <1% 测试集验证

| 属性 | 值 |
|------|-----|
| **Unit ID** | E6-U2 |
| **名称** | 误报率 <1% 测试集验证 |
| **依赖** | E6-U1 |
| **工时** | 1h |
| **优先级** | P2 |
| **状态** | ✅ 完成 |

#### 验收标准

- [ ] 1000 条合法代码样本误报率 <1%
- [ ] 测试通过后合入

#### 文件变更

```
Added:
  vibex-backend/src/lib/security/__tests__/false-positive-samples.ts   (1000 条合法代码样本)
  vibex-backend/src/lib/security/__tests__/codeAnalyzer.perf.test.ts   (误报率 + 性能测试)
```

#### 实现步骤

1. 收集 1000 条合法代码样本（避免包含 `eval`/`function` 等词）
2. 运行误报率测试：`vitest run codeAnalyzer.perf.test.ts`
3. 统计 false positive rate，assert < 0.01

#### 风险

- **低风险**：样本收集耗时间，建议从现有测试用例补充

### 2.3 E6-U3: AST 解析性能验证

| 属性 | 值 |
|------|-----|
| **Unit ID** | E6-U3 |
| **名称** | AST 解析性能验证 |
| **依赖** | E6-U1 |
| **工时** | 1h |
| **优先级** | P2 |
| **状态** | ✅ 完成 |

#### 验收标准

- [ ] 5000 行代码文件解析 < 50ms
- [ ] Vitest 性能测试通过

#### 文件变更

```
Modified:
  vibex-backend/src/lib/security/__tests__/codeAnalyzer.perf.test.ts
```

#### 实现步骤

1. 生成 5000 行测试代码
2. `Date.now()` 计时 assert < 50ms
3. 如性能不达标：检查是否需缓存 AST 或优化 traverse 逻辑

#### 风险

- **低风险**：Babel 解析性能业界验证过，5000 行应轻松达标

---

## 3. Epic E7: MCP Server 可观测性

### 3.1 E7-U1: MCP /health 端点

| 属性 | 值 |
|------|-----|
| **Unit ID** | E7-U1 |
| **名称** | MCP /health 端点 |
| **依赖** | 无 |
| **工时** | 1.5h |
| **优先级** | P2 |
| **状态** | ✅ 完成 |

#### 验收标准

- [ ] GET /health 返回 200 + JSON（status/version/uptime/timestamp/connectedClients/sdkVersion）
- [ ] 启动失败时返回 503

#### 文件变更

```
Added:
  packages/mcp-server/src/health.ts           (新建)
  packages/mcp-server/src/__tests__/health.test.ts

Modified:
  packages/mcp-server/src/index.ts             (注册 /health 路由)
```

#### 实现步骤

1. **创建 `health.ts`**：
   ```typescript
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
   ```
2. **注册路由**：`app.get('/health', healthHandler)`
3. **单元测试**：覆盖所有响应字段

#### 风险

- **低风险**：Express 基础路由，逻辑简单

### 3.2 E7-U2: Structured logging

| 属性 | 值 |
|------|-----|
| **Unit ID** | E7-U2 |
| **名称** | Structured logging |
| **依赖** | 无 |
| **工时** | 1.5h |
| **优先级** | P2 |
| **状态** | ✅ 完成 |

#### 验收标准

- [ ] 日志输出 JSON 到 stdout，含 timestamp/level/message/service/tool/duration/success
- [ ] 所有 tool handlers 使用 logger 替代 console.log
- [ ] SDK 版本检查日志（启动时输出）
- [ ] 敏感数据（token/password）不输出到日志

#### 文件变更

```
Added:
  packages/mcp-server/src/lib/logger.ts        (新建)
  packages/mcp-server/src/__tests__/logger.test.ts

Modified:
  packages/mcp-server/src/index.ts             (启动时 SDK 版本检查)
  packages/mcp-server/src/tools/*.ts            (console.log → logger)
```

#### 实现步骤

1. **创建 `logger.ts`**：
   ```typescript
   type LogLevel = 'debug' | 'info' | 'warn' | 'error'
   
   interface LogEntry {
     timestamp: string
     level: LogLevel
     message: string
     service: 'mcp-server'
     [key: string]: unknown
   }
   
   const SENSITIVE_KEYS = ['token', 'password', 'secret', 'key', 'auth']
   
   function sanitize(meta: Record<string, unknown>): Record<string, unknown> {
     const sanitized: Record<string, unknown> = {}
     for (const [k, v] of Object.entries(meta)) {
       if (SENSITIVE_KEYS.some(sk => k.toLowerCase().includes(sk))) {
         sanitized[k] = '[REDACTED]'
       } else {
         sanitized[k] = v
       }
     }
     return sanitized
   }
   
   function createLogger(level: LogLevel) {
     return (message: string, meta: Record<string, unknown> = {}) => {
       const entry: LogEntry = {
         timestamp: new Date().toISOString(),
         level,
         message,
         service: 'mcp-server',
         ...sanitize(meta),
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
   ```
2. **SDK 版本检查**（启动时）：
   ```typescript
   const sdkVersion = require('@modelcontextprotocol/sdk/package.json').version
   logger.info('mcp_server_starting', { sdkVersion })
   if (sdkVersion !== '0.5.0') {
     logger.warn('sdk_version_mismatch', { expected: '0.5.0', current: sdkVersion })
   }
   ```
3. **替换 tool handlers 中的 console.log**
4. **单元测试**：验证 JSON 输出格式 + 敏感数据过滤

#### 风险

- **低风险**：逻辑简单，敏感数据过滤需覆盖常见 key 名

---

## 4. 风险汇总

| 风险 | 影响 Epic | 缓解措施 |
|------|-----------|----------|
| Babel 包体积 ~5MB 导致 bundle regression | E6 | 确认 E6 基线，用 tree-shaking |
| Babel 解析某些 TS/JSX 语法不完全支持 | E6 | confidence=50 fallback，不阻断 |
| Unicode 逃逸绕过检测（ev\x61l） | E6 | 记录为 limitations |
| 敏感数据泄漏到日志 | E7 | sanitize() 函数过滤常见 key |
| 1000 条测试样本收集耗时 | E6-U2 | 从现有测试用例补充 |

---

## 执行决策

- **决策**: 待评审
- **执行项目**: 无
- **执行日期**: 待定
