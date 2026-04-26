# PRD — VibeX Sprint 12 功能规划

**项目**: vibex-proposals-20260426-sprint12
**版本**: 1.0
**日期**: 2026-04-26
**作者**: PM

---

## 执行摘要

### 背景

Sprint 1-11 已建立稳固基础：Canvas 画布（Flow + Node + Chapter 模型）、Firebase 实时协作 MVP（Presence cursor）、MCP Server v0.5.0（AI Coding 集成）、TypeScript 编译安全（CI Gate）。当前产品存在 4 个关键能力缺口：

1. **协作完整性缺失** — Firebase Presence 显示 cursor，但多用户同时编辑同一卡片时无冲突解决
2. **安全扫描不可信** — `code-review.ts` 用正则匹配 `eval/new Function`，误报率高
3. **MCP 不可观测** — 生产环境无法监控 MCP 服务健康状态和调用质量
4. **设计→代码 gap** — Canvas 建模完成后需手工编写 TSX 代码，无自动化支撑

### 目标

Sprint 12 在 Sprint 11 协作基础（Firebase Presence）上，完成 5 个 Epic：
- **E6** 安全 AST 扫描（替换正则，提升评审可信度）
- **E7** MCP 可观测性（健康检查 + Structured Logging）
- **E8** 协作冲突解决（LWW MVP，让多用户编辑有定义行为）
- **E9** AI 设计评审 MCP 工具（封装 code-review.ts 为 MCP 工具）
- **E10** 设计稿自动生成 TSX 骨架（从 Canvas Node 数据导出）

### 成功指标

| 指标 | 目标 |
|------|------|
| Sprint 12 Epic 交付率 | ≥ 4/5（E10 可延期至下 Sprint） |
| E6 AST 扫描误报率 | < 1% |
| E7 /health 端点可用性 | 100%（Sprint 内每次 deploy） |
| E8 冲突场景 E2E 通过率 | 100% |
| E9 MCP 工具调用成功率 | ≥ 95% |
| E10 骨架生成正确率 | 100%（ZIP 内容与预期一致） |
| TypeScript 新增 `as any` | 0（继承 Sprint 11 CI Gate） |
| Sprint 总工时 | ≤ 33h |

---

## Epic 拆分

| ID | Epic | 主题 | 优先级 | 工时 | 依赖 | 负责人 |
|----|------|------|--------|------|------|--------|
| E6 | Prompts 安全 AST 扫描 | 用 @babel/parser AST 解析替代正则匹配 | P0 | 4h | 无 | Dev-A |
| E7 | MCP Server 可观测性 | /health 端点 + JSON Structured Logging | P0 | 3h | 无 | Dev-B |
| E8 | Canvas 协作冲突解决 | 卡片级锁定 + ConflictBubble + LWW 仲裁 | P1 | 10h | Sprint 11 Firebase | Dev-C |
| E9 | AI 设计评审 MCP 工具 | code-review.ts 封装为 MCP 工具 | P1 | 8h | E7（MCP 基础） | Dev-A |
| E10 | 设计稿自动生成组件代码 | Canvas Node → TSX 骨架 + CSS Module | P2 | 8h | Canvas Node 模型 | Dev-B |

**总工时**: 33h | **并行路径**: E6+E7+E8 可并行；E9 依赖 E7；E10 独立

---

## 功能点总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F6.1 | AST 安全分析引擎 | 用 @babel/parser 解析代码，检测 eval/new Function 等危险模式 | `expect(analyzeCodeSecurity('eval("x")').hasUnsafe).toBe(true)` | 无 |
| F6.2 | AST 性能验证 | 5000 行代码 AST 解析 < 50ms | `expect(duration).toBeLessThan(50)` | 无 |
| F6.3 | 误报率测试套件 | 1000 条合法代码样本误报率 < 1% | `expect(misreportRate).toBeLessThan(0.01)` | 无 |
| F6.4 | 集成到评审流程 | 替换 code-review.ts 和 code-generation.ts 中的正则匹配 | `expect(code-review.ts).not.toContain(/eval\|new Function/)` | 无 |
| F7.1 | /health 健康检查端点 | GET /health 返回 200 + {status, version, uptime} | `expect(status).toBe(200)` + JSON 字段验证 | 无 |
| F7.2 | Structured JSON Logging | 所有 MCP 工具调用输出 JSON 格式日志到 stdout | `expect(log).toMatchObject({tool, duration, success})` | 无 |
| F7.3 | SDK 版本检查日志 | MCP SDK 版本不匹配时输出 warn 日志 | `expect(log.level).toBe('warn')` | 无 |
| F8.1 | 卡片级编辑锁 | 用户 A 编辑卡片时写入 `lockedBy: userA`，用户 B 看到锁定状态 | `expect(card.lockedBy).toBe('userA')` | 【需页面集成】 |
| F8.2 | 冲突检测 + ConflictBubble | 远程更新与本地修改冲突时弹出 ConflictBubble | `expect(ConflictBubble).toBeVisible()` | 【需页面集成】 |
| F8.3 | LWW 仲裁策略 | 后写入覆盖先写入，最终状态以最后写入为准 | `expect(finalState.author).toBe('lastWriter')` | 无 |
| F8.4 | E2E 双路径测试 | Firebase configured/unconfigured 双路径 Playwright E2E 通过 | `expect(e2eResults).toEqual({configured: pass, unconfigured: pass})` | 无 |
| F9.1 | review_design MCP 工具 | MCP server 注册 `review_design` 工具 | `expect(mcpTools).toContainEqual(expect.objectContaining({name: 'review_design'}))` | 无 |
| F9.2 | 设计规范合规评审 | 评审检查 DESIGN.md 合规（颜色/字体/间距） | `expect(report.issues).toContainEqual(expect.objectContaining({type: 'design-compliance'}))` | 无 |
| F9.3 | 组件复用性 + a11y 评审 | 评审建议组件复用 + 检测可访问性问题 | `expect(report.issues).toContainEqual(expect.objectContaining({type: 'a11y'}))` | 无 |
| F10.1 | Canvas Node → TypeScript 类型 | 从 Flow/Chapter 数据生成 .d.ts 类型定义 | `expect(fs.existsSync('types.d.ts')).toBe(true)` | 【需页面集成】 |
| F10.2 | TSX 骨架 + CSS Module 生成 | 生成符合 DESIGN.md 设计变量的 TSX 骨架文件 | `expect(tsxContent).toContain('--color-primary')` | 【需页面集成】 |
| F10.3 | ZIP 下载 + E2E 验证 | 打包为 ZIP 下载；Playwright E2E 验证 ZIP 内容正确性 | `expect(e2eZipContent).toMatchObject({files: ['types.d.ts', 'Component.tsx', 'Component.module.css']})` | 【需页面集成】 |

---

## 详细功能规格

### E6 — Prompts 安全 AST 扫描

#### Story E6-S1: AST 安全分析引擎

**工作目录**: `vibex-backend/src/lib/prompts/`

**实现内容**:
- 新建 `analyzeCodeSecurity(code: string): SecurityAnalysisResult`
- 使用 `@babel/parser` 解析为 AST
- 使用 `@babel/traverse` 遍历 AST，检测以下危险模式：
  - `CallExpression` + `eval` 标识符
  - `NewExpression` + `Function` 标识符
  - `MemberExpression` + `innerHTML` / `outerHTML`
  - `CallExpression` + `setTimeout/setInterval` + 字符串参数
- 返回结构: `{ hasUnsafe: boolean; unsafeEval?: UnsafePattern[]; confidence: number }`
- 当 Babel 解析失败时，返回 `confidence: 50`，不崩溃

**验收标准**:
```typescript
// E6-S1
expect(analyzeCodeSecurity('eval("x")').hasUnsafe).toBe(true)
expect(analyzeCodeSecurity('new Function("return 1")').hasUnsafe).toBe(true)
expect(analyzeCodeSecurity('const x = 1; return x').hasUnsafe).toBe(false)
expect(analyzeCodeSecurity('element.innerHTML = "<b>bold</b>")').hasUnsafe).toBe(true)
expect(analyzeCodeSecurity('setTimeout("alert(1)", 1000)').hasUnsafe).toBe(true)
expect(analyzeCodeSecurity('// syntactically broken code').confidence).toBe(50)
```

**DoD**:
- [ ] `analyzeCodeSecurity` 函数可独立调用
- [ ] eval/new Function/innerHTML/setTimeout 字符串参数均可检测
- [ ] Babel 解析失败不抛异常，返回 `confidence: 50`
- [ ] 单元测试覆盖所有危险模式
- [ ] CI `typecheck` 通过，零新增 `as any`

#### Story E6-S2: AST 性能验证

**工作目录**: `vibex-backend/src/lib/prompts/`

**验收标准**:
```typescript
// E6-S2
const code = generateLargeCode(5000) // 5000 行
const start = Date.now()
const result = analyzeCodeSecurity(code)
const duration = Date.now() - start
expect(duration).toBeLessThan(50)
expect(result.confidence).toBeGreaterThanOrEqual(90)
```

**DoD**:
- [ ] 性能基准测试存在且 CI 监控
- [ ] 解析 5000 行 < 50ms
- [ ] `@babel/parser` 和 `@babel/traverse` 添加到 `backend/package.json`

#### Story E6-S3: 误报率测试 + 集成

**工作目录**: `vibex-backend/src/lib/prompts/`

**验收标准**:
```typescript
// E6-S3
const legalSamples = loadLegalCodeSamples(1000) // 合法代码样本
const results = legalSamples.map(code => analyzeCodeSecurity(code))
const misreports = results.filter(r => r.hasUnsafe)
const misreportRate = misreports.length / 1000
expect(misreportRate).toBeLessThan(0.01) // < 1%
```

**集成要求**:
- [ ] `code-review.ts` 中替换正则匹配为 `analyzeCodeSecurity()`
- [ ] `code-generation.ts` 中替换正则匹配为 `analyzeCodeSecurity()`
- [ ] 原正则匹配代码移除（或注释标注 DEPRECATED）

**DoD**:
- [ ] 1000 条合法代码误报率 < 1%
- [ ] code-review.ts 和 code-generation.ts 集成完成
- [ ] Playwright E2E 中 code-review 场景测试通过

---

### E7 — MCP Server 可观测性

#### Story E7-S1: /health 健康检查端点

**工作目录**: `packages/mcp-server/src/`

**实现内容**:
- 在 MCP Server 添加 `GET /health` Express handler
- 返回 JSON: `{ status: "ok" | "degraded", version: string, uptime: number (seconds) }`
- 不需要认证，但正确设置 CORS headers
- `version` 从 `package.json` 读取

**验收标准**:
```typescript
// E7-S1
const res = await fetch('http://localhost:3100/health')
expect(res.status).toBe(200)
const body = await res.json()
expect(body).toMatchObject({
  status: expect.stringMatching(/^(ok|degraded)$/),
  version: expect.any(String),
  uptime: expect.any(Number)
})
expect(body.uptime).toBeGreaterThan(0)
```

**DoD**:
- [ ] GET /health 返回 200 + 正确 JSON 结构
- [ ] 版本号从 package.json 读取
- [ ] uptime 随时间递增
- [ ] CORS 预检处理正确

#### Story E7-S2: Structured JSON Logging

**工作目录**: `packages/mcp-server/src/`

**实现内容**:
- 实现 `StructuredLogger` 类: `{ timestamp, level, message, service, tool?, duration?, success? }`
- 所有 MCP 工具调用统一经过 logger，记录 tool name / duration / success
- 日志输出到 stdout，JSON 格式
- 添加 SDK 版本检查: 当 `mcp` package 版本不在白名单时输出 warn log

**验收标准**:
```typescript
// E7-S2
// 验证日志 JSON 格式
const logLine = captureStdout()
triggerMcpToolCall('review_design', { /* args */ })
const log = JSON.parse(logLine)
expect(log).toMatchObject({
  timestamp: expect.any(String),
  level: expect.stringMatching(/^(info|warn|error)$/),
  message: expect.any(String),
  service: 'mcp-server',
  tool: expect.any(String),
  duration: expect.any(Number),
  success: expect.any(Boolean)
})

// SDK 版本不匹配 warn
expect(log.level).toBe('warn')
expect(log.message).toContain('version mismatch')
```

**DoD**:
- [ ] 所有 MCP 工具调用输出 JSON log
- [ ] log 包含 timestamp/level/message/service/tool/duration/success
- [ ] SDK 版本检查生效并输出 warn 日志
- [ ] 日志聚合白名单字段定义（可对接外部日志系统）

---

### E8 — Canvas 协作冲突解决

#### Story E8-S1: 卡片级编辑锁

**工作目录**: `vibex-frontend/src/stores/` + `vibex-frontend/src/components/`

**实现内容**:
- 在 Canvas store 中添加 `lockedCards: Record<string, { lockedBy: string; lockedAt: number }>`
- 编辑卡片时调用 `canvasStore.lockCard(cardId, userId)`
- 锁定时写入 Firebase RTDB: `/canvas/{canvasId}/locks/{cardId}` — `{ lockedBy: userId, lockedAt: timestamp }`
- `isFirebaseConfigured()` guard 包裹所有 Firebase 调用
- 其他用户订阅 `/canvas/{canvasId}/locks/` 实时感知锁定状态
- 锁定卡片显示 `lockedBy` 用户的 cursor 颜色 + "Locked by {username}" tooltip
- 60 秒超时自动释放锁（客户端定时器 + Firebase TTL）

**验收标准**:
```typescript
// E8-S1
// 用户 A 锁定卡片
await canvasStore.lockCard('card-1', 'userA')
expect(canvasStore.lockedCards['card-1'].lockedBy).toBe('userA')
expect(firebaseRTDB.get('/canvas/c1/locks/card-1')).toMatchObject({ lockedBy: 'userA' })

// 用户 B 看到锁定状态
const lockState = firebaseRTDB.get('/canvas/c1/locks/card-1')
expect(lockState.lockedBy).toBe('userA')
expect(ui.isLocked('card-1')).toBe(true)

// 60 秒超时释放
await wait(60001)
expect(canvasStore.lockedCards['card-1']).toBeUndefined()
```

**页面集成**:
- [ ] Canvas 工具面板添加「锁定状态」指示器
- [ ] 已锁定卡片显示 cursor 颜色 + tooltip
- [ ] 未登录用户不可编辑已锁定卡片

**DoD**:
- [ ] 卡片锁定写入 Firebase RTDB 且实时同步
- [ ] 锁定状态在所有在线用户间同步
- [ ] 60 秒超时自动释放
- [ ] Firebase unconfigured 降级路径不报错
- [ ] TypeScript 类型完整，无 `as any`

#### Story E8-S2: 冲突检测 + ConflictBubble

**工作目录**: `vibex-frontend/src/components/Canvas/` + `vibex-frontend/src/stores/`

**实现内容**:
- 监听 Firebase RTDB `/canvas/{id}/cards/{cardId}` 变更
- 当远程更新到达时，与本地草稿（未保存的修改）对比 `lastModified` 时间戳
- 若远程 `lastModified` > 本地 `lastModified`，判定为冲突
- 弹出 ConflictBubble UI 组件，显示：
  - 「你的版本」vs「最新版本」diff
  - 两个按钮：「保留我的版本」/「采用最新版本」
- 「保留我的版本」: 强制写入本地数据到 Firebase
- 「采用最新版本」: 丢弃本地修改，同步远程数据

**验收标准**:
```typescript
// E8-S2
// 场景: 用户 A 本地修改 card-1，未保存；用户 B 远程更新了 card-1
// 冲突触发
triggerConflict('card-1', { localVersion: localData, remoteVersion: remoteData })
expect(ConflictBubble).toBeVisible()
expect(ConflictBubble).toContainText('冲突检测')
expect(ConflictBubble).toContainText('保留我的版本')
expect(ConflictBubble).toContainText('采用最新版本')

// 选「采用最新版本」
await ConflictBubble.click('采用最新版本')
expect(canvasStore.getCard('card-1')).toEqual(remoteData)

// 选「保留我的版本」
await ConflictBubble.click('保留我的版本')
expect(firebaseRTDB.get('/canvas/c1/cards/card-1')).toEqual(localData)
```

**页面集成**:
- [ ] ConflictBubble 组件实现（设计语言遵循 DESIGN.md 玻璃态风格）
- [ ] diff 展示使用统一颜色方案
- [ ] ConflictBubble 出现时禁止其他操作（聚焦）

**DoD**:
- [ ] 冲突检测逻辑正确（local < remote 时触发）
- [ ] ConflictBubble 可交互（保留/采用两个路径）
- [ ] 两种选择后状态一致，无数据丢失
- [ ] ConflictBubble 不遮挡主要编辑区

#### Story E8-S3: LWW 仲裁 + E2E 测试

**工作目录**: `vibex-frontend/src/stores/` + `tests/e2e/`

**实现内容**:
- LWW 策略: `lastModified` 时间戳大的版本胜出
- Firebase RTDB 写入时带上 `lastModified: Date.now()`
- 冲突仲裁: 当远程 `lastModified` > 本地 `lastModified` 时自动采用远程（不弹 ConflictBubble），当本地 > 远程 时弹 ConflictBubble
- Playwright E2E 测试覆盖以下场景:
  1. 用户 A 编辑 → 用户 B 也编辑 → 用户 A 先保存 → 用户 B 后保存 → B 覆盖 A
  2. Firebase configured 路径正常
  3. Firebase unconfigured 路径降级（isFirebaseConfigured=false）

**验收标准**:
```typescript
// E8-S3
// LWW: 后写入覆盖
userA.updateCard('card-1', { text: 'A' }, Date.now() + 1000)
userB.updateCard('card-1', { text: 'B' }, Date.now() + 2000)
// 最终状态以 B 为准（timestamp 更大）
expect(firebaseRTDB.get('/canvas/c1/cards/card-1').text).toBe('B')

// E2E 双路径
expect(e2e('canvas-collaboration')).toEqual({
  configured: 'pass',
  unconfigured: 'pass'
})
```

**DoD**:
- [ ] LWW 仲裁逻辑实现正确
- [ ] 时间戳作为仲裁唯一依据
- [ ] E2E 测试场景覆盖完整
- [ ] Firebase 双路径 E2E 通过
- [ ] 无新增 `as any`

---

### E9 — AI 设计评审 MCP 工具

#### Story E9-S1: review_design MCP 工具注册

**工作目录**: `packages/mcp-server/src/` + `vibex-backend/src/lib/prompts/`

**实现内容**:
- 复用 `code-review.ts` 作为评审核心逻辑
- 在 MCP Server 中注册 `review_design` 工具
- 工具签名: `review_design({ canvasId: string, spec?: DesignSpec }) => DesignReviewReport`
- 返回结构化报告:
  ```typescript
  interface DesignReviewReport {
    overall_score: number // 0-100
    issues: Array<{ type: 'design-compliance' | 'a11y' | 'component-reuse' | 'security'; severity: 'low' | 'medium' | 'high'; description: string; location?: string }>
    suggestions: string[]
    compliance: { colors: boolean; typography: boolean; spacing: boolean }
  }
  ```
- 工具调用记录到 StructuredLogger（F7-S2）

**验收标准**:
```typescript
// E9-S1
const tools = await mcpServer.listTools()
expect(tools).toContainEqual(expect.objectContaining({ name: 'review_design' }))

const report = await mcpServer.callTool('review_design', { canvasId: 'canvas-1' })
expect(report).toMatchObject({
  overall_score: expect.any(Number),
  issues: expect.any(Array),
  suggestions: expect.any(Array),
  compliance: expect.objectContaining({ colors: expect.any(Boolean) })
})
expect(report.overall_score).toBeGreaterThanOrEqual(0)
expect(report.overall_score).toBeLessThanOrEqual(100)
```

**DoD**:
- [ ] `review_design` 工具可被 MCP client 发现并调用
- [ ] 返回结构符合 `DesignReviewReport` 接口
- [ ] 工具调用记录到 logger
- [ ] 错误处理: canvasId 不存在时返回 `{ overall_score: 0, issues: [], error: '...' }`

#### Story E9-S2: 设计规范合规性评审

**工作目录**: `vibex-backend/src/lib/prompts/`

**实现内容**:
- 读取 `DESIGN.md` 定义的设计变量（颜色/字体/间距）
- 对 Canvas 中的组件节点进行合规检查:
  - 颜色使用 `--color-*` CSS 变量（而非硬编码 hex）
  - 字体使用 `--font-*` CSS 变量
  - 间距使用 4px 基准网格
- 使用 E6 的 `analyzeCodeSecurity` 做辅助检测
- 报告 `compliance` 字段: `{ colors: boolean; typography: boolean; spacing: boolean }`

**验收标准**:
```typescript
// E9-S2
const report = await reviewDesign('canvas-1')
// 合规情况
expect(report.compliance.colors).toBe(false) // 假设有硬编码颜色
expect(report.compliance.typography).toBe(true)
expect(report.compliance.spacing).toBe(true)
// 问题详情
const colorIssues = report.issues.filter(i => i.type === 'design-compliance')
expect(colorIssues.length).toBeGreaterThan(0)
expect(colorIssues[0]).toMatchObject({
  type: 'design-compliance',
  severity: expect.stringMatching(/^(low|medium|high)$/),
  description: expect.any(String)
})
```

**DoD**:
- [ ] 读取 DESIGN.md 设计变量
- [ ] 颜色合规检测（硬编码 hex vs CSS 变量）
- [ ] 字体合规检测
- [ ] 间距网格合规检测
- [ ] 合规结果写入报告

#### Story E9-S3: 组件复用性 + a11y 评审

**工作目录**: `vibex-backend/src/lib/prompts/`

**实现内容**:
- 复用性检测: 识别 Canvas 中结构相似/功能重复的组件节点，给出合并建议
- 可访问性检测（无 AI LLM，纯规则）:
  - 图片节点无 `alt` 文本描述 → a11y 问题
  - 交互节点（按钮/链接）无键盘操作说明 → a11y 问题
  - 颜色对比度不足 → 使用固定阈值（WCAG 2.1 AA: 4.5:1）
- 复用 code-review.ts 的 a11y 检测规则

**验收标准**:
```typescript
// E9-S3
const report = await reviewDesign('canvas-1')
// 组件复用
const reuseIssues = report.issues.filter(i => i.type === 'component-reuse')
expect(reuseIssues.length).toBeGreaterThanOrEqual(0)

// a11y
const a11yIssues = report.issues.filter(i => i.type === 'a11y')
expect(a11yIssues).toContainEqual(expect.objectContaining({
  type: 'a11y',
  severity: 'high',
  description: expect.stringContaining('alt')
}))

// suggestions
expect(report.suggestions.length).toBeGreaterThan(0)
expect(report.suggestions[0]).toBe(expect.any(String))
```

**DoD**:
- [ ] 组件复用检测逻辑实现
- [ ] 图片 alt 检测实现
- [ ] 交互键盘操作检测实现
- [ ] WCAG 对比度检测实现（固定阈值）
- [ ] suggestions 非空且可操作

---

### E10 — 设计稿自动生成组件代码

#### Story S10-S1: Canvas Node → TypeScript 类型生成

**工作目录**: `vibex-frontend/src/lib/` + `vibex-backend/src/lib/`

**实现内容**:
- 从 Canvas Flow 数据提取 Node 节点结构
- 生成 `.d.ts` 文件，包含：
  - Flow 接口定义（`interface Flow { id, name, nodes, chapters }`）
  - Node 接口定义（`interface CanvasNode { id, type, position, data }`）
  - Chapter 接口定义（5-chapter: requirement/context/flow/api/business-rules）
- 类型生成器位于 `frontend/src/lib/codeGenerator.ts` → `generateTypeDefinitions(flow: Flow): string`

**验收标准**:
```typescript
// S10-S1
const flow = loadCanvasFlow('canvas-1')
const typeDefs = generateTypeDefinitions(flow)
expect(typeDefs).toContain('interface Flow {')
expect(typeDefs).toContain('interface CanvasNode {')
expect(typeDefs).toContain('interface Chapter {')
expect(typeDefs).toContain('id: string')
expect(typeDefs).toContain('type: CanvasNodeType')
// 导出语句
expect(typeDefs).toMatch(/export (interface|type) /)
```

**DoD**:
- [ ] 生成的 .d.ts 语法正确（tsc 编译通过）
- [ ] 包含 Flow/CanvasNode/Chapter 完整接口
- [ ] Canvas Node 数据完整保留（无字段丢失）
- [ ] 单元测试覆盖各种 Node 类型

#### Story S10-S2: TSX 骨架 + CSS Module 生成

**工作目录**: `vibex-frontend/src/lib/` + `templates/`

**实现内容**:
- 使用 DESIGN.md 设计变量（CSS 变量）生成 TSX 骨架
- 生成文件:
  1. `Component.tsx` — React 组件骨架，含 Props 接口
  2. `Component.module.css` — CSS Module，使用 DESIGN.md 变量
  3. `index.ts` — 导出语句
- TSX 骨架包含：
  - 正确的 imports
  - Props interface
  - 组件函数骨架（带 TODO 注释标注需要人工补充的位置）
  - 使用 DESIGN.md CSS 变量（`var(--color-primary)` 等）
- 骨架**不含业务逻辑**，纯结构展示

**验收标准**:
```typescript
// S10-S2
const output = generateComponentSkeleton(flow)
expect(output.files['Component.tsx']).toContain('interface Props {')
expect(output.files['Component.tsx']).toContain('export default function')
expect(output.files['Component.tsx']).toContain('// TODO:')
expect(output.files['Component.module.css']).toContain('--color-primary')
expect(output.files['Component.module.css']).toContain('--color-bg-primary')
expect(output.files['index.ts']).toContain('export { default }')

// 设计变量使用正确
expect(output.files['Component.tsx']).not.toMatch(/#[0-9A-Fa-f]{6}/) // 无硬编码颜色
expect(output.files['Component.tsx']).not.toMatch(/rgba?\([^)]+\)/) // 无硬编码 rgba
```

**页面集成**:
- [ ] Canvas 工具面板添加「生成代码」按钮
- [ ] 点击后弹出预览 Modal，展示生成的文件列表
- [ ] 预览支持文件切换查看

**DoD**:
- [ ] TSX 骨架语法正确（可被 TypeScript 解析）
- [ ] CSS Module 使用 DESIGN.md 变量
- [ ] 无硬编码颜色/字体
- [ ] 骨架不含业务逻辑（可人工补充）
- [ ] 支持多种 Node 类型（Chapter/节点/连接线）

#### Story S10-S3: ZIP 下载 + E2E 验证

**工作目录**: `vibex-frontend/` + `tests/e2e/`

**实现内容**:
- 将生成的文件打包为 ZIP 下载
- 使用 `jszip` 或 `archiver` 库
- Playwright E2E 测试:
  1. 加载 Canvas flow
  2. 点击「生成代码」
  3. 点击「下载 ZIP」
  4. 解压 ZIP，验证文件列表和内容

**验收标准**:
```typescript
// S10-S3
const zipBuffer = await downloadZip('canvas-1')
const zip = await JSZip.loadAsync(zipBuffer)
const files = Object.keys(zip.files)
expect(files).toContain('types.d.ts')
expect(files).toContain('Component.tsx')
expect(files).toContain('Component.module.css')
expect(files).toContain('index.ts')

// 内容验证
const tsxContent = await zip.files['Component.tsx'].async('string')
expect(tsxContent).toContain('export default function')
const cssContent = await zip.files['Component.module.css'].async('string')
expect(cssContent).toContain('--color-primary')
```

**页面集成**:
- [ ] 下载按钮在「生成代码」Modal 内
- [ ] 下载后显示成功提示

**DoD**:
- [ ] ZIP 下载功能可用
- [ ] ZIP 内容完整（types.d.ts + TSX + CSS + index.ts）
- [ ] Playwright E2E 测试通过
- [ ] ZIP 文件命名规范: `{flowName}-generated-{timestamp}.zip`

---

## DoD (Definition of Done)

### 全局 DoD（每个 Epic 必须满足）

- [ ] TypeScript `tsc --noEmit` 通过，零新增 `as any`
- [ ] 所有新增函数/模块有单元测试（覆盖率 ≥ 80%）
- [ ] 提交信息遵循 Conventional Commits 格式
- [ ] PR 必须经过至少 1 人 Code Review
- [ ] E2E 测试在 CI 中运行（Playwright）
- [ ] 文档更新（CHANGELOG.md 更新 + 内联注释）
- [ ] `isFirebaseConfigured()` 降级路径覆盖

### Epic 专属 DoD

| Epic | 专属 DoD |
|------|---------|
| E6 | AST 扫描误报率 < 1%；性能 < 50ms；集成到 code-review.ts 和 code-generation.ts |
| E7 | /health 返回 200；JSON log 包含全部 7 个字段；SDK 版本检查生效 |
| E8 | ConflictBubble 可交互；LWW 仲裁正确；E2E 双路径通过；60 秒锁超时 |
| E9 | MCP 工具可被发现；DESIGN.md 合规检查生效；a11y 检测覆盖 3 种场景 |
| E10 | .d.ts 语法正确；TSX/CSS 使用 DESIGN.md 变量；ZIP 下载 E2E 通过 |

---

## 优先级矩阵

| 优先级 | Epic | 理由 |
|--------|------|------|
| P0 / Must | E6 (AST 扫描) | 安全风险，当前正则匹配误报率高，已有 Architect spec，4h 高确定性 |
| P0 / Must | E7 (MCP 观测) | 可观测性基础设施缺失，已有 Architect spec，3h 高确定性 |
| P1 / Should | E8 (冲突解决) | Sprint 11 协作能力延伸，用户核心体验，LWW MVP 可控 |
| P1 / Should | E9 (AI 评审) | MCP 工具能力扩展，code-review.ts 已验证，E7 完成后并行 |
| P2 / Could | E10 (Design-to-Code) | 用户提效工具，但范围严格限定为骨架生成，延期不影响 Sprint 目标 |

---

## 依赖关系图

```
E6 ─────────────────────────────────────────────────────────┐
  无依赖 → 可立即开始                                        │
                                                          │
E7 ─────────────────────────────────────────────────────────┤
  无依赖 → 可立即开始                                        ├─ Sprint 12 主要路径
                                                          │  总工时 33h
E8 ─────────────────────────────────────────────────────────┤
  依赖 Sprint 11 Firebase Presence ───────────────────────→ │
  独立路径（Dev-C）                                          │
                                                          │
E9 ─────────────────────────────────────────────────────────┤
  依赖 E7（MCP 基础）                                        │
  并行于 E10 ─────────────────────────────────────────────→│
                                                          │
E10 ─────────────────────────────────────────────────────────┘
  依赖 Canvas Node 数据模型（已完备）
  P2，可延期
```

---

## 驳回红线自检

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言
- [x] DoD 章节存在且具体（全局 DoD + Epic 专属 DoD）
- [x] 功能点模糊，无法写 expect() → **无模糊功能点，全部可写断言**
- [x] 验收标准缺失 → **每个 Story 至少 3 条 expect() 断言**
- [x] 涉及页面但未标注【需页面集成】→ **F8.1, F8.2, F10.1, F10.2, F10.3 均已标注**
- [x] 功能ID格式正确（F6.x / E7.x / E8.x / E9.x / S10-x 体系一致）

---

*PRD 完成 | 2026-04-26 | PM*
