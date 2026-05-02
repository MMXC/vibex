# TESTER 阶段任务报告 — E1 Design Review MCP (v2)

**Agent**: TESTER
**创建时间**: 2026-05-02 08:45 GMT+8
**更新时间**: 2026-05-02 11:08 GMT+8
**报告路径**: `/root/.openclaw/vibex/docs/vibex-proposals-20260502-sprint22/tester-epic1-design-review-mcp-report-20260502.md`
**Commit**: d0b50ce74

---

## 项目信息

| 字段 | 内容 |
|------|------|
| 项目 | vibex-proposals-20260502-sprint22 |
| 阶段 | tester-epic1-design-review-mcp |
| 任务描述 | E1 Design Review 真实 MCP 集成测试验证 |
| 验收标准 | 验证 MCP Bridge 实现 graceful degradation、5秒超时、POST /api/mcp/review_design 响应含 aiScore/suggestions 字段 |

---

## 任务领取

```
📌 领取任务: vibex-proposals-20260502-sprint22/tester-epic1-design-review-mcp
👤 Agent: tester
⏰ 时间: 2026-05-02 10:59 GMT+8
🎯 目标: E1 Design Review MCP 真实集成测试验证
```

---

## 执行过程

### Step 1 — 代码审计

读取了以下文件：
- `src/lib/mcp-bridge.ts` — MCP bridge with spawn-based stdio bridge
- `src/app/api/mcp/review_design/route.ts` — API route handler
- `tests/e2e/design-review-mcp.spec.ts` — E2E test spec

### Step 2 — 构建测试

```
cd /root/.openclaw/vibex/vibex-fronted && pnpm run build
```

**结果: 🔴 构建失败**

```
Error: Turbopack build failed with 2 errors:
./vibex-fronted/src/lib
Module not found: Can't resolve './ROOT/packages/mcp-server/dist/index.js'
server relative imports are not implemented yet.
```

**根因**: `mcp-bridge.ts` 使用 `join(process.cwd(), '../packages/mcp-server/dist/index.js')` 作为 MCP server 路径。Next.js 16 Turbopack 尝试静态分析此动态路径，将其识别为 "server relative imports" 并拒绝解析。

**影响**: 
- `pnpm run build` → **失败**，阻塞所有 E2E 测试
- `pnpm test:e2e:qa` → **无法执行**（依赖 build 产物）

### Step 3 — 单元测试（绕过 build 阻塞）

由于 build 失败无法运行 E2E 测试，创建了单元测试来验证 fallback 逻辑：

**测试文件**: `tests/unit/api-mcp-review-design.test.ts`

**结果: ✅ 21/21 PASS**

| # | 测试用例 | 状态 |
|---|---------|------|
| TC1 | 返回所有必填字段 (canvasId, reviewedAt, aiScore, suggestions, summary) | ✅ PASS |
| TC2 | aiScore 是 0-100 的数字 | ✅ PASS |
| TC3 | suggestions 是数组，每项含 type/message/priority | ✅ PASS |
| TC4 | 发现 hardcoded color → compliance=warn | ✅ PASS |
| TC5 | 发现 hardcoded font → compliance=warn | ✅ PASS |
| TC6 | spacing 非 4 的倍数 → compliance=warn | ✅ PASS |
| TC7 | image 缺 alt → a11y=fail, critical=1 | ✅ PASS |
| TC8 | button 缺 aria-label → a11y=fail, high=1 | ✅ PASS |
| TC9 | image 有 alt → a11y=pass | ✅ PASS |
| TC10 | button 有 aria-label → a11y=pass | ✅ PASS |
| TC11 | 无问题 → aiScore=100 | ✅ PASS |
| TC12 | a11y 问题 → aiScore<100 | ✅ PASS |
| TC13 | 检测相似节点 → reuseCandidates | ✅ PASS |
| TC14 | checkCompliance=false 跳过 compliance 检查 | ✅ PASS |
| TC15 | checkA11y=false 跳过 a11y 检查 | ✅ PASS |
| TC16 | 空 canvasId 返回有效报告 | ✅ PASS |
| TC17 | color issues → medium priority suggestions | ✅ PASS |
| TC18 | a11y issues → high priority suggestions | ✅ PASS |
| TC19 | summary.compliance ∈ [pass, warn, fail] | ✅ PASS |
| TC20 | summary.a11y ∈ [pass, warn, fail] | ✅ PASS |
| TC21 | PRD 所有字段完整 | ✅ PASS |

### Step 4 — ESLint 检查

```bash
pnpm exec eslint src/app/api/mcp/review_design/route.ts src/lib/mcp-bridge.ts
```

**结果: ⚠️ 3 warnings, 0 errors**

| 文件 | 警告 | 说明 |
|------|------|------|
| route.ts:21 | `RGBA_LITERAL_RE` 未使用 | 代码删除了 rgba 检查但保留了正则变量 |
| route.ts:126 | `totalFields` 未使用 | for 循环中赋值但未读取 |
| design-review-mcp.spec.ts | 文件被忽略 | E2E 文件在 eslintignore 中（正常） |

### Step 5 — TypeScript 检查

```bash
pnpm exec tsc --noEmit
```

**结果: ✅ 0 errors**

---

## 测试结果汇总

| # | 验证项 | 预期 | 实际 | 状态 |
|---|--------|------|------|------|
| 1 | `pnpm run build` → 0 errors | 0 errors | **2 errors** (Turbopack server-relative import) | 🔴 FAIL |
| 2 | `POST /api/mcp/review_design` → 200 | 200 | **无法测试** (build 失败) | ⏳ SKIP |
| 3 | `mcp.called` 字段存在 | 存在 | 代码确认存在 ✅ | ✅ PASS (code audit) |
| 4 | Graceful degradation (MCP 不可用 → 200) | 200 | fallback 逻辑正确 ✅ | ✅ PASS (unit test) |
| 5 | 响应含 `aiScore` 字段 | 存在 | ✅ 实现正确 | ✅ PASS |
| 6 | 响应含 `suggestions` 数组 | 数组 | ✅ 实现正确 | ✅ PASS |
| 7 | C-E1-2: 5s 超时 | 5000ms | `CALL_TIMEOUT_MS = 5000` ✅ | ✅ PASS (code audit) |
| 8 | C-E1-3: 无新 npm 依赖 | 无新增 | ✅ 未引入新依赖 | ✅ PASS |
| 9 | TypeScript 类型检查 | 0 errors | ✅ 0 errors | ✅ PASS |
| 10 | ESLint 检查 | 0 errors | ⚠️ 3 warnings | ⚠️ WARNINGS |

---

## 验收标准逐条检查

### ✅ C-E1-1: Graceful degradation
**状态**: 实现正确。`fallbackStaticAnalysis` 逻辑完整，包含 compliance/a11y/reuse 三部分。单元测试 21/21 通过验证。

### ✅ C-E1-2: MCP call timeout = 5s
**状态**: `mcp-bridge.ts` 中 `CALL_TIMEOUT_MS = 5000`。代码审计确认实现正确。

### ✅ C-E1-3: No new npm dependencies
**状态**: 未引入新依赖 ✅。

### 🔴 Build: Next.js Turbopack server-relative import
**状态**: `pnpm run build` 失败。`mcp-bridge.ts` 中 `join(process.cwd(), '../packages/mcp-server/dist/index.js')` 触发 Turbopack 静态分析错误："server relative imports are not implemented yet"。

### ✅ PRD AC: `aiScore` / `suggestions`
**状态**: 两个字段均已在 `DesignReviewReport` 类型和 `fallbackStaticAnalysis` 实现中正确实现。单元测试 21/21 验证通过。

### ⚠️ ESLint: 残留未使用变量
**状态**: 2 个 warning（`RGBA_LITERAL_RE`, `totalFields`）。不影响功能但应清理。

---

## 阻塞问题

### 🔴 P0 BLOCKER: 构建失败

**问题**: Next.js 16 Turbopack 无法解析 `process.cwd()` 服务器相对路径

**错误信息**:
```
Module not found: Can't resolve './ROOT/packages/mcp-server/dist/index.js'
server relative imports are not implemented yet.
```

**建议修复方案**:
1. **方案A（推荐）**: 在 `mcp-bridge.ts` 中使用绝对路径，避免 Turbopack 静态分析：
   ```typescript
   // 使用运行时环境变量，不做静态计算
   const mcpServerPath = process.env.MCP_SERVER_PATH 
     ?? '/absolute/path/to/mcp-server/index.js';
   ```
2. **方案B**: 将 MCP server 添加到 `next.config.js` 的 `serverExternalPackages`
3. **方案C**: 在 `next.config.js` 中添加 `experimental.turbo.resolveAlias` 配置

**影响**: 所有 E2E 测试（`design-review-mcp.spec.ts`）无法运行。

---

## 结论

| 状态 | 说明 |
|------|------|
| ⚠️ **REJECTED — 上游构建失败** | Build 阻塞导致 E2E 无法执行 |

**失败原因**:
- `pnpm run build` → Turbopack server-relative import 错误（2 errors）
- E2E 测试无法运行（依赖 build 产物）

**通过验证**:
- ✅ `aiScore` 和 `suggestions` 字段已正确实现（单元测试 21/21 PASS）
- ✅ Graceful degradation 逻辑正确
- ✅ TypeScript 类型检查通过
- ✅ C-E1-2 (5s 超时) 和 C-E1-3 (无新依赖) 符合约束

**需要修复**:
- [ ] 修复 `mcp-bridge.ts` 中的 `process.cwd()` 路径解析，使 build 通过
- [ ] 清理 `RGBA_LITERAL_RE` 和 `totalFields` 未使用变量警告
- [ ] 修复 build 后重新运行 E2E 测试验证

---

*报告更新时间: 2026-05-02 11:08 GMT+8*
*TESTER Agent | VibeX Sprint 22*
