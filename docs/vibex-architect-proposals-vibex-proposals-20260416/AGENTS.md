# VibeX E6/E7 — Dev Agent 任务清单

**项目**: vibex-architect-proposals-vibex-proposals-20260416
**日期**: 2026-04-16
**作者**: Architect

---

## 执行决策

- **决策**: 待评审
- **执行项目**: 无
- **执行日期**: 待定

---

## 1. 开发约束（E6/E7 通用）

### 1.1 代码规范

- **无 any 类型泄漏**：所有类型必须显式定义，禁止 `any`
- **错误不阻断**：解析/日志失败返回 fallback，不抛异常
- **敏感数据不过日志**：token/password/secret/key/auth 字段一律过滤
- **性能达标**：5000 行代码 AST 解析 < 50ms

### 1.2 提交规范

- 每个 Unit 独立提交，commit message 格式：`[E{n}-U{m}] <描述>`
- 示例：`[E6-U1] feat: add AST security analyzer`
- PR 标题格式：`[E{n}] <Epic 名称>`
- 每个 PR 需包含单元测试（Vitest）

### 1.3 审查要点

- TypeScript 类型覆盖完整
- 错误处理（try/catch + fallback 返回）
- 敏感数据日志过滤覆盖常见 key 名
- 性能测试断言通过

---

## 2. Dev Agent 任务分配

### 2.1 Epic E6: Prompts 安全 AST 扫描

#### E6-U1: @babel/parser AST 解析实现

| 属性 | 值 |
|------|-----|
| **负责人** | Dev Agent |
| **依赖** | 无 |
| **预计工时** | 2h |
| **优先级** | P2 |
| **产出** | PR: `[E6] Prompts 安全 AST 扫描实现` |

**任务清单**:

1. 安装依赖：`npm install @babel/parser @babel/traverse @babel/types --save vibex-backend`
2. 创建 `vibex-backend/src/lib/security/codeAnalyzer.ts`：
   ```typescript
   import { parse } from '@babel/parser'
   import traverse from '@babel/traverse'
   import type { CallExpression, Expression } from '@babel/types'

   export interface SecurityAnalysis {
     hasUnsafe: boolean
     confidence: number
     warnings: string[]
   }

   const UNSAFE_PATTERNS = ['eval', 'new Function', 'setTimeout', 'setInterval']

   export function analyzeCodeSecurity(code: string): SecurityAnalysis {
     try {
       const ast = parse(code, { sourceType: 'module', plugins: [] })
       const warnings: string[] = []

       traverse(ast, {
         CallExpression(nodePath) {
           const callee = nodePath.node.callee as Expression
           if (callee.type === 'Identifier') {
             const name = callee.name
             if (UNSAFE_PATTERNS.includes(name)) {
               // 检测字符串参数
               const args = nodePath.node.arguments
               if (args.some(a => a.type === 'StringLiteral' || a.type === 'TemplateLiteral')) {
                 warnings.push(`Detected unsafe pattern: ${name} with string argument`)
               }
             }
           }
         },
       })

       return {
         hasUnsafe: warnings.length > 0,
         confidence: 90,
         warnings,
       }
     } catch {
       return { hasUnsafe: false, confidence: 50, warnings: [] }
     }
   }
   ```
3. 集成到 `vibex-backend/src/lib/prompts/code-review.ts`：并行调用 analyzeCodeSecurity()，结果注入 warnings
4. 集成到 `vibex-backend/src/lib/prompts/code-generation.ts`：同上
5. 移除旧的 `vibex-backend/src/lib/prompts/_regexSecurity.ts`（如存在）
6. 编写单元测试：`vibex-backend/src/lib/security/__tests__/codeAnalyzer.test.ts`
   - eval() 检测
   - new Function() 检测
   - setTimeout(fn, 'string') 检测
   - 合法代码不误报：`const x = 1; return x * 2` → hasUnsafe=false
   - 解析失败返回 confidence=50

**验收检查**:
- [ ] analyzeCodeSecurity() 精确检测 eval/new Function/setTimeout 字符串参数
- [ ] 合法代码不误报
- [ ] 解析失败时 confidence=50，不抛异常
- [ ] 集成到 code-review.ts 和 code-generation.ts
- [ ] Vitest 测试通过

---

#### E6-U2: 误报率 <1% 测试集验证

| 属性 | 值 |
|------|-----|
| **负责人** | Dev Agent |
| **依赖** | E6-U1 |
| **预计工时** | 1h |
| **优先级** | P2 |
| **产出** | PR: `[E6] AST 扫描误报率验证` |

**任务清单**:

1. 创建 `vibex-backend/src/lib/security/__tests__/false-positive-samples.ts`：
   - 收集 1000 条合法代码样本（避免包含 eval/function/setTimeout 等词）
   - 覆盖常见场景：变量声明、函数定义、类、async/await、泛型、TypeScript 类型
2. 创建 `vibex-backend/src/lib/security/__tests__/codeAnalyzer.perf.test.ts`：
   ```typescript
   import { analyzeCodeSecurity } from '../codeAnalyzer'
   import { falsePositiveSamples } from './false-positive-samples'

   describe('false positive rate', () => {
     it('false positive rate < 1%', () => {
       const results = falsePositiveSamples.map(code => analyzeCodeSecurity(code))
       const falsePositives = results.filter(r => r.hasUnsafe)
       const rate = falsePositives.length / results.length
       expect(rate).toBeLessThan(0.01)
     })
   })
   ```
3. 运行测试：`vitest run codeAnalyzer.perf.test.ts`
4. 如误报率超标，修复 codeAnalyzer.ts 逻辑

**验收检查**:
- [ ] 1000 条合法代码样本误报率 < 1%
- [ ] Vitest 测试通过

---

#### E6-U3: AST 解析性能验证

| 属性 | 值 |
|------|-----|
| **负责人** | Dev Agent |
| **依赖** | E6-U1 |
| **预计工时** | 1h |
| **优先级** | P2 |
| **产出** | PR: `[E6] AST 扫描性能验证` |

**任务清单**:

1. 在 `codeAnalyzer.perf.test.ts` 添加性能测试：
   ```typescript
   it('5000 lines parsed in < 50ms', () => {
     const largeCode = generateLargeCode(5000)
     const start = Date.now()
     analyzeCodeSecurity(largeCode)
     const duration = Date.now() - start
     expect(duration).toBeLessThan(50)
   })

   function generateLargeCode(lines: number): string {
     let code = 'const results: number[] = [];\n'
     for (let i = 0; i < lines; i++) {
       code += `results.push(${i} * ${i + 1});\n`
     }
     return code
   }
   ```
2. 运行测试：`vitest run codeAnalyzer.perf.test.ts`
3. 如性能不达标：检查是否需缓存 AST 或优化 traverse 逻辑

**验收检查**:
- [ ] 5000 行代码文件解析 < 50ms
- [ ] Vitest 性能测试通过

---

### 2.2 Epic E7: MCP Server 可观测性

#### E7-U1: MCP /health 端点

| 属性 | 值 |
|------|-----|
| **负责人** | Dev Agent |
| **依赖** | 无 |
| **预计工时** | 1.5h |
| **优先级** | P2 |
| **产出** | PR: `[E7] MCP /health 端点` |

**任务清单**:

1. 创建 `packages/mcp-server/src/health.ts`：
   ```typescript
   import type { RequestHandler } from 'express'

   // 外部注入或从 connectionPool 获取
   function getConnectedClients(): number {
     // TODO: 根据实际 connectionPool 实现调整
     return (global as any).__mcpConnectedClients ?? 0
   }

   export const healthHandler: RequestHandler = (req, res) => {
     try {
       res.json({
         status: 'ok',
         version: process.env.MCP_VERSION || '0.5.0',
         connectedClients: getConnectedClients(),
         uptime: Math.floor(process.uptime()),
         timestamp: new Date().toISOString(),
         sdkVersion: require('@modelcontextprotocol/sdk/package.json').version,
       })
     } catch {
       res.status(503).json({ status: 'error', timestamp: new Date().toISOString() })
     }
   }
   ```
2. 注册路由：在 `packages/mcp-server/src/index.ts` 添加 `app.get('/health', healthHandler)`
3. 编写单元测试：`packages/mcp-server/src/__tests__/health.test.ts`
   - 验证所有响应字段存在
   - 验证错误时返回 503

**验收检查**:
- [ ] GET /health 返回 200 + JSON（status/version/uptime/timestamp/connectedClients/sdkVersion）
- [ ] 启动失败时返回 503
- [ ] Vitest 测试通过

---

#### E7-U2: Structured logging

| 属性 | 值 |
|------|-----|
| **负责人** | Dev Agent |
| **依赖** | 无（建议 E7-U1 后实施） |
| **预计工时** | 1.5h |
| **优先级** | P2 |
| **产出** | PR: `[E7] Structured logging` |

**任务清单**:

1. 创建 `packages/mcp-server/src/lib/logger.ts`：
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
2. SDK 版本检查：在 `packages/mcp-server/src/index.ts` 启动时添加：
   ```typescript
   const sdkVersion = require('@modelcontextprotocol/sdk/package.json').version
   logger.info('mcp_server_starting', { sdkVersion })
   if (sdkVersion !== '0.5.0') {
     logger.warn('sdk_version_mismatch', { expected: '0.5.0', current: sdkVersion })
   }
   ```
3. 替换所有 tool handlers 中的 console.log 为 logger.info/error
4. 编写单元测试：`packages/mcp-server/src/__tests__/logger.test.ts`
   - 验证 JSON 输出格式
   - 验证敏感数据过滤

**验收检查**:
- [ ] 日志输出 JSON 到 stdout，含 timestamp/level/message/service/tool/duration/success
- [ ] 所有 tool handlers 使用 logger 替代 console.log
- [ ] SDK 版本检查日志（启动时输出）
- [ ] 敏感数据（token/password/secret/key/auth）不输出到日志
- [ ] Vitest 测试通过

---

## 3. 提交顺序建议

```
E6-U1 → E6-U2 → E6-U3 → E7-U1 → E7-U2
```

- E6-U1 先完成（基础实现）
- E6-U2/E6-U3 紧随（验证）
- E7-U1/E7-U2 可并行或串行

---

## 4. PR 合并后检查清单

- [ ] 所有单元测试通过（`vitest run`）
- [ ] TypeScript 类型检查通过（`npx tsc --noEmit`）
- [ ] 无 any 类型泄漏
- [ ] 敏感数据不过日志
- [ ] 性能测试通过（5000 行 < 50ms）
- [ ] 误报率 < 1%

---

## 执行决策

- **决策**: 待评审
- **执行项目**: 无
- **执行日期**: 待定
