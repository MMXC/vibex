# Implementation Plan: VibeX E6/E7

**项目**: vibex-architect-proposals-vibex-proposals-20260416
**日期**: 2026-04-16
**总工时**: 7h

---

## Epic 6 — Prompts 安全 AST 扫描 (4h)

### E6-S1: @babel/parser AST 解析实现 (2h)

**依赖**: 无
**步骤**:

1. 安装依赖: `@babel/parser`, `@babel/traverse`, `@babel/types`
   ```bash
   cd vibex-backend && pnpm add @babel/parser @babel/traverse @babel/types
   ```
2. 创建 `src/lib/security/codeAnalyzer.ts`:
   - `analyzeCodeSecurity(code: string): SecurityReport`
   - 检测 `eval()`, `new Function()`, `setTimeout(str, ...)`, `setInterval(str, ...)`
   - 解析失败时设置 `confidence=50`
3. 创建 `src/lib/security/__tests__/codeAnalyzer.test.ts`:
   - 覆盖 TC01-TC05
   - Vitest 测试，>80% coverage
4. 修改 `src/lib/prompts/code-review.ts`:
   - 导入 `analyzeCodeSecurity`
   - 并行执行 AI 分析 + AST 扫描
   - 扫描结果注入 `warnings` 数组
5. 修改 `src/lib/prompts/code-generation.ts`:
   - 同上集成逻辑
6. 运行 lint + type-check
   ```bash
   cd vibex-backend && pnpm lint && pnpm type-check
   ```

**验收**: `pnpm test -- --run src/lib/security/__tests__/codeAnalyzer.test.ts` 全部通过

### E6-S2: 误报率 <1% 测试集验证 (1h)

**依赖**: E6-S1
**步骤**:

1. 生成 1000 条合法代码样本（`test/fixtures/safe-code/`）
2. 运行 `analyzeCodeSecurity` 全量检测
3. 计算误报率: `falsePositives / 1000 < 0.01`
4. 如有误报，补充白名单规则到 `DANGEROUS_PATTERNS_WHITELIST`

**验收**: `pnpm test -- --run false-positive-rate` 通过

### E6-S3: AST 解析性能验证 (1h)

**依赖**: E6-S1
**步骤**:

1. 生成 5000 行测试文件: `test/fixtures/large-file.ts`
2. 基准测试: `Date.now()` 测量 `analyzeCodeSecurity(largeFile)` 耗时
3. 断言: `< 50ms`

**验收**: `pnpm test -- --run perf-benchmark` 通过

---

## Epic 7 — MCP Server 可观测性 (3h)

### E7-S1: MCP /health 端点 (1.5h)

**依赖**: 无
**步骤**:

1. 创建 `packages/mcp-server/src/health.ts`:
   ```typescript
   export const healthHandler: RequestHandler = (req, res) => {
     res.json({ status: 'ok', version, uptime, connectedClients, timestamp, sdkVersion })
   }
   ```
2. 修改 `packages/mcp-server/src/index.ts`:
   - 导入 `healthHandler`
   - `app.get('/health', healthHandler)`
3. 创建 `packages/mcp-server/src/__tests__/health.test.ts`:
   - supertest 测试 GET /health → 200
   - 字段完整性验证
   - 异常场景 (pool error) → status='error'

**验收**: `pnpm --filter mcp-server test` 通过

### E7-S2: Structured Logging (1.5h)

**依赖**: E7-S1
**步骤**:

1. 安装 pino: `pnpm add pino && pnpm add -D @types/pino`
2. 创建 `packages/mcp-server/src/lib/logger.ts`:
   - 基于 pino，输出 JSON 格式
   - 字段: timestamp, level, message, service, tool, duration, success
   - 支持 redaction (敏感字段)
3. 替换 `packages/mcp-server/src/tools/*.ts` 中的 `console.log/error` → `logger.info/error`
4. 添加 SDK 版本检查: 启动时 log warn if version mismatch
5. 创建 `packages/mcp-server/src/__tests__/logger.test.ts`:
   - JSON parse 验证
   - level 字段验证

**验收**: `pnpm --filter mcp-server test` 通过，日志输出到 stdout

---

## DoD Checklist

- [ ] eval/new Function 检测精准
- [ ] 误报率 <1%
- [ ] AST 解析性能 <50ms
- [ ] code-review.ts + code-generation.ts 集成
- [ ] MCP /health 返回 200 + 完整 JSON
- [ ] Structured log JSON 格式输出
- [ ] 日志包含 tool/duration/success 字段
- [ ] SDK version check 日志输出
- [ ] lint + type-check 通过
- [ ] 测试覆盖率 >80%
- [ ] changelog 已更新
