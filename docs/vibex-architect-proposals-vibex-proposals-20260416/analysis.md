# 需求分析报告 — E6 AST 安全扫描 + E7 MCP 可观测性架构

**项目**: vibex-architect-proposals-vibex-proposals-20260416
**阶段**: Phase 1 — 需求分析（analyze-requirements）
**日期**: 2026-04-16
**分析人**: Analyst

---

## 1. 业务场景分析

### E6 — Prompts 安全 AST 扫描

**业务目标**: 在 AI 代码审查和代码生成流程中，用 AST 解析替代字符串正则匹配，精确检测 `eval`/`new Function` 等危险代码模式，降低误报率。

**目标用户**: 使用 VibeX 进行 AI 代码辅助开发的工程师。

**核心价值**:
- 减少安全扫描误报（当前正则方案会把变量名含 `eval` 的合法代码标记为危险）
- 提高扫描置信度，为 AI 提供更可靠的安全上下文
- 将安全分析从 prompt 指令降级为确定性代码检测

### E7 — MCP 可观测性架构

**业务目标**: 为 `packages/mcp-server` 添加健康检查和结构化日志，使服务状态可监控、可追踪。

**目标用户**: DevOps 工程师、平台运维团队。

**核心价值**:
- 可观测性：了解 MCP 服务运行状态、连接数、响应时间
- 可追踪：结构化日志便于日志聚合系统（Datadog/Fluentd）采集分析
- 可告警：健康检查端点供负载均衡器或监控系统探测

---

## 2. 技术方案选项

### 2.1 E6 技术方案

#### 方案 A：@babel/parser AST 解析（推荐）

**描述**: 用 `@babel/parser` 解析代码为 AST，遍历 `CallExpression` 节点精确检测危险函数调用。

**优势**:
- 精确检测：AST 层面识别 `eval()` 调用，不受字符串混淆影响
- 置信度高：解析成功时 confidence=100，解析失败时降为 50
- 性能可控：单文件 <50ms（Babel 解析 5000 行代码约 30-40ms）
- 依赖已就绪：`@babel/parser`、`@babel/traverse` 已在 `vibex-backend/package.json` 中

**劣势**:
- 解析器不支持所有语法：某些实验性 TypeScript/JSX 语法可能不完全支持
- 包体积：@babel/parser ~5MB，对 bundle size 有轻微影响
- 混淆代码：Unicode 逃逸（如 `ev\x61l`）可能绕过 AST 检测

**实施路径**:
1. 新建 `vibex-backend/src/lib/security/codeAnalyzer.ts`
2. 集成到 `code-review.ts` 和 `code-generation.ts`
3. 移除旧 `vibex-backend/src/lib/prompts/_regexSecurity.ts`
4. 单元测试 + 误报率测试集验证

#### 方案 B：正则匹配增强

**描述**: 保留现有正则方案，增加 negative lookahead 等增强模式。

**结论**: 不推荐。正则方案本质上是字符串匹配，无法区分 `const safeEval = 1;`（安全）和 `eval("x")`（危险）。E6 的核心目标就是消除这种误报，正则增强无法达成。

---

### 2.2 E7 技术方案

**⚠️ 关键冲突**：Spec E7 描述的 HTTP `/health` 端点与 MCP server 当前架构不兼容。

Research 发现 `packages/mcp-server/src/` 下已有：
- `health.ts` — 已实现 `health_check` MCP tool（非 HTTP 端点）
- `logger.ts` — 已实现 structured JSON logging
- `tools/` — 已有 `logger.info/error` 调用

这意味着 E7 已被部分实现。但 Spec 中描述的 HTTP `/health` 方案存在架构问题。

#### 方案 A：MCP Tool 健康检查（推荐）

**描述**: 保留现有 `health_check` MCP tool 方案，通过 MCP 协议自身的 stdio 通信响应健康状态。

**优势**:
- 架构一致：MCP server 使用 stdio 传输，不监听 HTTP 端口
- 已有实现：健康检查逻辑和 structured logging 均已实现
- 可观测性达标：客户端通过调用 `health_check` tool 获取服务状态

**劣势**:
- 无法被外部负载均衡器直接探测（需要通过 MCP 客户端中转）
- 与 Spec 原描述（HTTP 端点）不一致，需要修订 Spec

**实施路径**:
1. 验收现有 `health.ts` 和 `logger.ts` 实现是否符合 Spec
2. 如有缺口，补全 structured logging 字段（`tool/duration/success`）
3. 修订 Spec 中"HTTP `/health` endpoint"描述为"MCP `health_check` tool"

#### 方案 B：MCP Server + HTTP 健康检查共存（不推荐）

**描述**: 在 stdio 传输模式之上额外添加 HTTP 服务器用于健康检查。

**结论**: 不推荐。引入额外 HTTP 服务器增加复杂性，且 MCP server 通常作为子进程运行，HTTP 端口暴露有安全风险。E7 的核心目标是可观测性，通过 MCP tool + structured logging 已可达成。

---

## 3. 可行性评估

### E6 — AST 安全扫描

| 维度 | 评估 | 说明 |
|------|------|------|
| 技术可行性 | ✅ 高 | @babel/parser 成熟稳定，API 清晰，已有依赖 |
| 依赖完整性 | ✅ 就绪 | @babel/parser、@babel/traverse 已在 package.json |
| 性能可行性 | ✅ 可达 | AST 解析性能 <50ms/文件，Babel 优化良好 |
| 测试可行性 | ✅ 可达 | 可构造 safe/unsafe 测试集验证误报率 |
| 风险点 | ⚠️ 需处理 | Babel 不支持所有语法需 fallback；混淆代码检测有限制 |

### E7 — MCP 可观测性

| 维度 | 评估 | 说明 |
|------|------|------|
| 技术可行性 | ✅ 高 | 核心功能（health_check tool、logger）已实现 |
| 架构一致性 | ⚠️ 需修订 | Spec 描述 HTTP 端点，但 MCP stdio 模式不适用 |
| 依赖完整性 | ✅ 就绪 | logger.ts、health.ts 均已存在 |
| 风险点 | ⚠️ 需确认 | 现有实现是否符合 Spec 所有验收条件 |

---

## 4. 初步风险识别

| ID | 风险描述 | 影响 | 概率 | 缓解措施 |
|----|----------|------|------|----------|
| R1 | Babel 解析失败导致 confidence 骤降，漏报危险代码 | 高 | 低 | 解析失败时 fallback 到正则检测，记录为 warning |
| R2 | 混淆代码（`ev\x61l`）绕过 AST 检测 | 中 | 低 | 在文档中标注为已知限制，不依赖 AST 作为唯一防线 |
| R3 | E7 Spec 与实现不匹配，Spec 需修订 | 中 | 高 | Analyst 在评审报告中标注，Architect 负责修订 Spec |
| R4 | Structured log 暴露敏感数据（token/secret） | 高 | 中 | 实现自动脱敏层，对匹配 `*token*/*secret*/password` 的字段值做 mask |
| R5 | @babel/parser 包体积影响 bundle size | 低 | 中 | 确认 CI bundlesize 基线是否可接受；如超限，考虑 tree-shaking |

---

## 5. 验收标准

### E6 — AST 安全扫描

| ID | 验收条件 | 测试方式 |
|----|----------|----------|
| AC01 | `analyzeCodeSecurity('eval("x")')` 返回 `hasUnsafe=true`，`unsafeEval` 包含该调用 | 单元测试 |
| AC02 | `analyzeCodeSecurity('new Function("return 1")')` 返回 `hasUnsafe=true` | 单元测试 |
| AC03 | `analyzeCodeSecurity('const safeEval = 1')` 返回 `hasUnsafe=false`（不误报） | 单元测试 |
| AC04 | `analyzeCodeSecurity('setTimeout("code", 0)')` 返回 `hasUnsafe=true` | 单元测试 |
| AC05 | 1000 条合法代码样本误报率 <1% | 集成测试 |
| AC06 | 5000 行代码 AST 解析 <50ms | 性能测试 |
| AC07 | 解析失败时 confidence=50，不抛异常 | 单元测试 |
| AC08 | `code-review.ts` 和 `code-generation.ts` 均集成 AST 扫描 | 集成测试 |
| AC09 | 旧 `_regexSecurity.ts` 已删除 | 代码审查 |

### E7 — MCP 可观测性

| ID | 验收条件 | 测试方式 |
|----|----------|----------|
| AC10 | MCP `health_check` tool 返回 status/version/uptime/connectedClients | 集成测试 |
| AC11 | Structured log 输出 JSON 格式到 stdout | 单元测试 |
| AC12 | 日志包含 `tool/duration/success` 字段 | 单元测试 |
| AC13 | 日志包含 `timestamp/level/message/service` 字段 | 单元测试 |
| AC14 | SDK 版本不匹配时输出 warn 日志 | 集成测试 |
| AC15 | `logger.info/warn/error` 均正常输出对应 level | 单元测试 |

---

## 6. 工期估算

| Epic | Story | 工时 | 备注 |
|------|-------|------|------|
| E6-S1 | @babel/parser AST 解析实现 | 2h | 含 codeAnalyzer.ts + 测试 |
| E6-S2 | 误报率 <1% 测试集验证 | 1h | 含测试集构造 + 运行 |
| E6-S3 | AST 解析性能验证 | 1h | 含性能基准测试 |
| **E6 合计** | | **4h** | |
| E7-S1 | MCP `health_check` tool 验收/补全 | 1.5h | 验收现有实现，补缺口 |
| E7-S2 | Structured logging 验收/补全 | 1.5h | 验收 logger.ts，补缺失字段 |
| **E7 合计** | | **3h** | |
| **总计** | | **7h** | |

**说明**: E7 工期基于"核心功能已部分实现"的前提。如需额外开发，工作量可能上升至 4-5h。

---

## 7. 依赖分析

```
E6 依赖:
  ├── @babel/parser  ✅ 已安装（vibex-backend）
  ├── @babel/traverse  ✅ 已安装（vibex-backend）
  ├── @babel/types  ⚠️ 需确认是否存在
  ├── code-review.ts  ✅ 存在
  └── code-generation.ts  ✅ 存在

E7 依赖:
  ├── @modelcontextprotocol/sdk  ✅ 存在
  ├── health.ts  ✅ 已实现
  ├── logger.ts  ✅ 已实现
  └── tools/*.ts  ✅ 已有 logger 调用
```

---

## 8. 评审结论

**结论**: Conditional — 有条件推荐

**理由**:
1. E6 技术方案可行，依赖已就绪，工期合理（4h）
2. E7 核心功能已部分实现，但 Spec 存在架构描述错误（HTTP endpoint 不适用于 MCP stdio 模式），需要修订 Spec 后再实施
3. E7 需在 Spec 修订完成后重新评估实施范围

**前置条件**:
- E7 Spec 需修订"HTTP `/health` endpoint"为"MCP `health_check` tool"
- E6 需确认 `@babel/types` 依赖是否存在

---

## 执行决策

- **决策**: 有条件推荐
- **执行项目**: 待定（E7 需先修订 Spec）
- **执行日期**: 待定
- **备注**: E6 可立即进入实施阶段；E7 需 Architect 修订 Spec 后再分配开发任务
