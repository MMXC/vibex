# 需求分析报告 — E6 AST安全扫描 + E7 MCP可观测性架构

**项目**: vibex-architect-proposals-vibex-proposals-20260416
**日期**: 2026-04-16
**分析人**: Analyst
**状态**: 有条件推荐（E7 需修订）

---

## 1. 业务场景分析

### E6 — Prompts 安全 AST 扫描

**业务背景**：VibeX 是一个 AI 代码分析和生成平台，其 `code-review.ts` 和 `code-generation.ts` 向 AI 注入用户提交的代码片段。当用户提交包含 `eval()`、`new Function()` 等动态代码执行语句时，当前系统依赖 prompt 指令让 AI 自行识别，无法真正阻止危险代码进入 AI 上下文。

**目标用户**：VibeX 平台自身（安全扫描作为平台层能力，保护 AI 服务不被滥用）

**核心价值**：
- 降低因恶意/危险代码导致的 AI 误判或平台安全风险
- 通过 AST 精确检测替代模糊的 prompt 指令，减少误报

**Jobs-To-Be-Done (JTBD)**：
1. JTBD-1: 平台需在 AI 分析用户代码前，准确识别出动态代码执行类危险模式
2. JTBD-2: 平台需确保安全扫描本身不产生过多误报（不阻断正常业务代码）
3. JTBD-3: 安全扫描需足够快，不影响 code-review 和 code-generation 的响应时间

---

### E7 — MCP Server 可观测性

**业务背景**：VibeX MCP Server 通过 stdio 与 AI 客户端通信，提供代码生成和分析工具。当前缺少健康检查和结构化日志，运维团队无法感知服务状态和问题定位。

**目标用户**：VibeX 运维团队 / 平台监控层

**核心价值**：
- 让运维团队能感知 MCP Server 的运行状态
- 结构化日志支持日志聚合系统接入（Datadog/Fluentd）
- SDK 版本一致性检查防止版本漂移

**Jobs-To-Be-Done (JTBD)**：
4. JTBD-4: 运维需能查询 MCP Server 当前是否健康（uptime、工具注册数）
5. JTBD-5: 日志需能被结构化采集，供后续分析（JSON 格式）
6. JTBD-6: 团队需感知 MCP SDK 版本是否与预期一致

---

## 2. 技术方案选项

### E6 技术方案

#### 方案一（推荐）：AST 解析替代正则匹配

**描述**：使用 `@babel/parser` 解析代码为 AST，通过 `@babel/traverse` 遍历节点，精确检测 `CallExpression` 中的 `eval` 和 `Function` 引用。

**优点**：
- 精确：AST 层面检测，不受字符串编码、混淆影响
- 性能：单文件 <50ms（babel parser 经过大量优化）
- 误报率低：基于语法结构，非正则模糊匹配

**缺点**：
- 包体积：`@babel/parser` ~5MB，增加 bundle size
- 解析失败：某些非标准语法（如草案阶段语法）可能解析失败，需 fallback
- 覆盖范围有限：无法检测 `eval("ev\x61l")` 等 Unicode 逃逸

#### 方案二：沙箱执行（仅检测 eval）

**描述**：在沙箱环境（如 vm2、isolated-vm）中执行代码，观察是否触发动态执行。

**优点**：能检测到逃逸后的 eval 调用

**缺点**：
- 复杂度高：需要独立沙箱进程或线程
- 性能差：每次分析需启动沙箱
- 资源消耗大
- 无法检测 `new Function`

**结论**：方案一为推荐路径，方案二作为未来增强方向。

---

### E7 技术方案

#### 方案一（推荐，修正）：MCP Tool 健康检查 + Structured Logging（已实现）

**描述**：`health_check` MCP tool 已实现（返回 status/uptime/tools）；structured logging 已实现（JSON 格式输出 stdout）。

**优点**：
- MCP tool 方式与 stdio 传输模式完全兼容
- 客户端通过 MCP 协议查询健康状态
- 无需额外 HTTP 服务

**缺点**：
- 不兼容 HTTP 健康检查协议（如 Kubernetes liveness/readiness）

#### 方案二（问题方案）：HTTP /health 端点

**描述**：在 MCP Server 中新增 HTTP Express 服务，监听 3100 端口。

**问题**：
- MCP Server 使用 `StdioServerTransport`，是单进程 stdio 通信，无 HTTP 监听
- 在 stdio 服务中混入 HTTP 服务是架构冲突
- 增加复杂度，无实际收益

**结论**：方案一为正确路径。Spec 中的 HTTP /health 描述需修正为"MCP tool health_check"。

---

## 3. 可行性评估

### E6 可行性：**高**

| 维度 | 评估 |
|------|------|
| 技术难度 | 低。@babel/parser API 成熟，文档完善 |
| 依赖就绪 | 高。`@babel/parser`、`@babel/traverse` 已安装在 package.json |
| 集成复杂度 | 低。只需在 code-review.ts 和 code-generation.ts 中引入并调用 |
| 测试覆盖 | 可行。单元测试 + 1000 条样本误报率验证 |
| 风险点 | Babel 解析失败时的 fallback 策略；Unicode 逃逸的 limitations |

**结论**：技术可行，工时 4h 估算合理。

### E7 可行性：**高（已实现，需修订 Spec）**

| 维度 | 评估 |
|------|------|
| 技术难度 | 低。代码已存在 |
| 实现状态 | health_check tool 和 logger.ts 已集成到 index.ts |
| Spec 准确性 | 中。Spec 描述与实现不一致（HTTP vs MCP tool） |
| 剩余工作 | 验证已实现的功能是否符合验收标准；SDK version check 日志输出 |

**结论**：E7 大部分已完成，剩余工作 <1h。需修订 spec 中的 HTTP 端点描述。

---

## 4. 初步风险识别

### E6 风险矩阵

| 风险 | 可能性 | 影响 | 等级 | 缓解措施 |
|------|--------|------|------|----------|
| Babel 解析失败导致漏报 | 中 | 高 | 🟡 中 | confidence 字段标记低置信度；保留 prompt-based 备用 |
| Unicode 逃逸绕过检测 | 低 | 中 | 🟢 低 | 文档说明 limitations；建议安全红线不使用此类模式 |
| 误报率超 1% | 低 | 中 | 🟢 低 | 1000 条样本测试集验证；可配置白名单 |
| Bundle size 增加 | 中 | 低 | 🟢 低 | @babel/parser 仅在 Node 侧使用，不影响前端 bundle |

### E7 风险矩阵

| 风险 | 可能性 | 影响 | 等级 | 缓解措施 |
|------|--------|------|------|----------|
| HTTP endpoint 方案不可行 | 高（已在代码中发现） | 中 | 🔴 高 | 改用 MCP tool health_check（已实现） |
| Structured log 敏感信息泄露 | 低 | 高 | 🟢 低 | 添加自动脱敏层（spec 中已标注） |
| SDK 版本检查缺失 | 中 | 低 | 🟡 中 | 添加 SDK version 读取和日志输出 |

---

## 5. 验收标准（具体可测试）

### E6 验收标准

- [ ] `analyzeCodeSecurity('eval("x")')` 返回 `hasUnsafe=true`，`unsafeEval` 包含检测结果
- [ ] `analyzeCodeSecurity('new Function("return 1")')` 返回 `hasUnsafe=true`，`unsafeNewFunction` 包含检测结果
- [ ] `analyzeCodeSecurity('const x = 1; return x * 2')` 返回 `hasUnsafe=false`（无误报）
- [ ] 1000 条合法代码样本误报率 <1%（测试集运行）
- [ ] 单文件（5000 行）解析耗时 <50ms
- [ ] `code-review.ts` 集成 `analyzeCodeSecurity`，安全警告注入 AI 结果
- [ ] `code-generation.ts` 集成 `analyzeCodeSecurity`
- [ ] TypeScript 类型检查通过（`tsc --noEmit`）
- [ ] 新增 `codeAnalyzer.test.ts`，测试覆盖率 ≥80%

### E7 验收标准

- [ ] `health_check` MCP tool 可通过 MCP 协议调用，返回 `{status, timestamp, version, uptime, tools}`
- [ ] 结构化日志输出到 stdout，格式为 JSON，包含 `timestamp`, `level`, `event`, `service`, `version` 字段
- [ ] 工具调用日志包含 `tool`, `argsKeys` 字段
- [ ] 工具错误日志包含 `error` 字段
- [ ] MCP Server 启动时输出 `mcp_server_starting` 日志
- [ ] SDK 版本检查（读取 `@modelcontextprotocol/sdk/package.json`）并输出 warn/info 日志（如版本不匹配）
- [ ] Spec 修订：移除 HTTP `/health` 端点描述，改为 MCP tool health_check

---

## 6. 驳回条件检查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 需求模糊无法实现 | ✅ 通过 | 需求清晰：AST 扫描 + 可观测性 |
| 缺少验收标准 | ✅ 通过 | 已列出具体可测试条目 |
| 未执行 Research | ✅ 通过 | 已完成 git history + learnings 分析 |
| 技术可行性 | ✅ 通过 | 依赖已就绪，实现路径明确 |

---

## 执行决策

- **决策**: 已采纳（E6 全额通过，E7 条件通过）
- **执行项目**: vibex-architect-proposals-vibex-proposals-20260416
- **执行日期**: 待定（Coord 决策）
- **备注**: E7 spec 中的 HTTP /health 端点方案不可行，需修订为 MCP tool health_check（已实现）。建议 Dev 优先实施 E6（4h），E7 扫尾（<1h）可并行。
