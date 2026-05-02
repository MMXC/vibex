# VibeX Sprint 20 QA — PRD

**PM**: pm 🤖
**日期**: 2026-05-01
**项目**: vibex-sprint20-qa
**上游**: analysis.md (analyst, 2026-05-01)
**Planning**: Feature List (22 features, 4 Epic)
**产出路径**: `docs/vibex-sprint20-qa/prd.md`

---

## 1. 执行摘要

### 背景
VibeX Sprint 20 交付了 4 个实施项（P001/P003/P004/P006），全部通过 Analyst 代码审查，但部分验证项（如真实 DOM 性能、gateway 运行时可达性）未在代码审查阶段实测。历史经验显示：
- S1-S19 中 P1-1 Canvas 虚拟化问题积压 19 sprint
- E1-E6 Epic 曾 100% 测试通过但从未部署
- S16 MCP DoD 文档完整但最终验证步骤跳过
- S12 AI Agent 实现 UI 但后端 mock 持续 8 sprint

### 目标
QA 验证 Sprint 20 产出物的完整性、正确性与可用性，确保无遗留风险可上线。

### 成功指标

| 指标 | 目标 |
|------|------|
| 所有 P1 功能验证通过率 | 100% |
| E2E 测试 0 failures | 达成 |
| P004 真实 DOM P50 | < 100ms |
| 150 节点滚动 jank | 0 |
| 上线前阻塞项 | 0 |

---

## 2. Epic 拆分

### E1: MCP DoD 收尾 (P001)

**本质需求穿透（神技1）**
- 用户的底层动机：确认 DoD 缺口正式关闭，mcp-server 生产可用
- 去掉现有方案：无法在生产环境运行 mcp-server，/health 不可用
- 解决的本质问题：DoD 流程缺失导致产出物质量不可信

**最小可行范围（神技2）**
- 本期必做：脚本 exit 0 验证、/health 端点可用性、TypeScript 0 errors、12 unit tests 通过
- 本期不做：无（全部是阻塞项）
- 暂缓：无

**用户情绪地图**：N/A（纯后端验证，无用户界面）

---

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|----------|
| E1-S1 | 脚本执行成功 | generate-tool-index.ts exit 0，INDEX.md ≥ 7 entries | 0.5h | `expect(script.exitCode).toBe(0)`, `expect(indexEntries).toBeGreaterThanOrEqual(7)` |
| E1-S2 | /health 端点存活 | /health 在 stdio 启动前可访问，返回 200 | 0.5h | `GET /health → 200 with {status: "ok"}` |
| E1-S3 | TypeScript 构建干净 | `tsc --noEmit` 0 errors | 0.5h | `expect(tscResult.errors).toBe(0)` |
| E1-S4 | 单元测试通过 | 12 unit tests pass | 0.5h | `expect(testResults.passed).toBe(12)`, `expect(testResults.failed).toBe(0)` |

---

### E2: Workbench 生产化 (P003)

**本质需求穿透（神技1）**
- 用户的底层动机：Workbench 功能在生产环境可见且可用，agent sessions 可管理
- 去掉现有方案：Workbench 不可见，用户无法使用 agent 任务功能
- 解决的本质问题：E1-E6 Epic 100% 测试通过但从未部署的根因——feature flag 隔离缺失

**最小可行范围（神技2）**
- 本期必做：Feature Flag 路由隔离、Session 50 上限守卫、E2E 测试通过、XSS 防护
- 本期不做：Session 列表分页、搜索过滤（去掉用户仍能完成任务）
- 暂缓：CSRF 保护（SSO 集成时处理）

**用户情绪地图**
- 进入 Workbench：期待感 → UI 应立即呈现，无白屏
- 无 session：引导文案「还没有运行中的任务，点击上方输入框启动第一个 agent」
- 错误兜底：网络异常显示「连接失败，请检查网络后重试」+ 重试按钮

---

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|----------|
| E2-S1 | Feature Flag 路由 | `WORKBENCH_ENABLED=true` → 200, `false` → 404 | 1.0h | `expect(request('/workbench').status()).toBe(200)` when enabled, `expect(status()).toBe(404)` when disabled |
| E2-S2 | Session 上限守卫 | 51st session 触发 oldest eviction | 0.5h | `expect(store.sessions.size).toBe(50)` after 51 insertions |
| E2-S3 | XSS 防护 | message.content 渲染无 XSS 注入风险 | 1.0h | `expect(safeRender('<script>alert(1)</script>')).toBe('&lt;script&gt;...')` |
| E2-S4 | E2E journey 通过 | 5 Playwright tests pass，0 failures | 1.0h | `expect(workbenchJourney.results.failures).toBe(0)` |
| E2-S5 | UI 三区渲染 | WorkbenchUI header/messages/content 正确渲染 | 1.0h | `expect(visible('.header')).toBe(true)`, `expect(visible('.messages')).toBe(true)`, `expect(visible('.task-input')).toBe(true)` |
| E2-S6 | SessionList 加载 | SessionList 从 agentSessionStore 加载显示 | 0.5h | `expect(sessionItems.length).toBeGreaterThan(0)` with real sessions |
| E2-S7 | TaskInput 交互 | TaskInput 可输入并触发 agent 调用 | 0.5h | `expect(submitTask('test task').status).not.toBe('error')` |

---

### E3: Canvas 虚拟化 (P004)

**本质需求穿透（神技1）**
- 用户的底层动机：150+ 节点 Canvas 滚动流畅，不卡顿、不丢选中状态
- 去掉现有方案：150 节点滚动严重卡顿（用户无法正常浏览）
- 解决的本质问题：S1-S19 P1-1 Canvas 虚拟化积压 19 sprint 的根因——虚拟化被 .map() 绕过

**最小可行范围（神技2）**
- 本期必做：useVirtualizer 正确集成、100 节点 P50 < 100ms、150 节点无 jank、跨边界选中保持
- 本期不做：虚拟化节流阈值自动调优、滚动惯性曲线定制
- 暂缓：Canvas 缩放/旋转时的虚拟化重算

**用户情绪地图**
- 进入 Canvas：期待流畅滚动 → 应立即渲染骨架屏，节点渐现
- 节点多时：焦虑感 → 滚动应无感知延迟
- 选中丢失：挫败感 → 应始终保持选中高亮（即使滚动出视口再滚回）

---

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|----------|
| E3-S1 | useVirtualizer 集成 | @tanstack/react-virtual 正确接入，无 .map() 绕过 | 1.0h | `expect(virtualizer.estimateSize).toBeDefined()`, `expect(hasMapRender).toBe(false)` |
| E3-S2 | 100 节点 P50 < 100ms | Playwright real DOM 测量 100 visible nodes 渲染 P50 | 2.0h | `expect(performanceMetrics.p50).toBeLessThan(100)` (ms) |
| E3-S3 | 150 节点无 jank | 滚动流畅，dropped frames < 2/60fps | 2.0h | `expect(trace.droppedFrames).toBeLessThan(2)` |
| E3-S4 | 跨边界选中保持 | selectedCardSnapshot 在虚拟边界间保持 | 1.0h | `expect(scrollToNode(50).selectedSnapshot).toBe(scrollToNode(150).selectedSnapshot)` |

---

### E4: AI Agent 真实接入 (P006)

**本质需求穿透（神技1）**
- 用户的底层动机：创建 agent session 后能获取状态、终止 session，真实后端响应
- 去掉现有方案：session API 返回 mock 数据，前端无法与真实 agent 通信
- 解决的本质问题：S12 AI Agent mock 持续 8 sprint 的根因——sessions_spawn 未真实调用

**最小可行范围（神技2）**
- 本期必做：POST → 201, GET status → 200, DELETE → 204, sessions_spawn 超时 30s, gateway 可达
- 本期不做：agent result 写入 Canvas artifact（pipeline 后续实现）
- 暂缓：session 并发控制（同一 user 多 session 抢占）

**用户情绪地图**
- 创建 session：期待感 → 立即返回 sessionId，前端不阻塞
- 等待中：焦虑感 → status 应每 5s 更新，显示进度
- 超时：挫败感 → 30s 后应显示超时提示「Agent 响应超时，请重试」

---

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|----------|
| E4-S1 | POST session 创建 | `POST /api/agent/sessions` → 201 + sessionId | 0.5h | `expect(post('/api/agent/sessions').status()).toBe(201)`, `expect(body.sessionId).toBeDefined()` |
| E4-S2 | GET session 状态 | `GET /api/agent/sessions/:id/status` → 200 | 0.5h | `expect(get('/api/agent/sessions/abc/status').status()).toBe(200)`, `expect(body.status).toBeDefined()` |
| E4-S3 | DELETE session 清理 | `DELETE /api/agent/sessions/:id` → 204 | 0.5h | `expect(delete('/api/agent/sessions/abc').status()).toBe(204)` |
| E4-S4 | 错误响应格式 | 所有错误返回 `{error, code}` 结构 | 0.5h | `expect(errorResponse).toHaveProperty('error')`, `expect(errorResponse).toHaveProperty('code')` |
| E4-S5 | sessions_spawn 超时 | OpenClawBridge 30s 超时正确触发 | 0.5h | `expect(AbortController.timeout).toBe(30000)` |
| E4-S6 | Gateway 可达性 | sessions_spawn 运行时可用（gateway ping） | 1.0h | `expect(gateway.ping()).resolves.toBe(true)` |
| E4-S7 | 40 单元测试通过 | backend + frontend tests all pass | 0.5h | `expect(testResults.total).toBe(40)`, `expect(testResults.failed).toBe(0)` |

---

## 3. 优先级矩阵

| ID | 功能点 | 优先级 | 类型 |
|----|--------|--------|------|
| E1-S1 | 脚本 exit 0 验证 | P1 | 阻塞 |
| E1-S2 | /health 端点可用性 | P1 | 阻塞 |
| E1-S3 | TypeScript 构建干净 | P1 | 阻塞 |
| E1-S4 | 单元测试通过 | P1 | 阻塞 |
| E2-S1 | Feature Flag 路由 | P1 | 阻塞 |
| E2-S2 | Session 上限守卫 | P1 | 阻塞 |
| E2-S3 | XSS 防护 | P1 | 安全 |
| E2-S4 | E2E journey 通过 | P1 | 阻塞 |
| E3-S1 | useVirtualizer 集成 | P1 | 阻塞 |
| E3-S2 | 100 节点 P50 < 100ms | P1 | 性能 |
| E3-S3 | 150 节点无 jank | P1 | 性能 |
| E4-S1 | POST session 创建 | P1 | 阻塞 |
| E4-S2 | GET session 状态 | P1 | 阻塞 |
| E4-S3 | DELETE session 清理 | P1 | 阻塞 |
| E4-S5 | sessions_spawn 超时 | P1 | 阻塞 |
| E4-S6 | Gateway 可达性 | P1 | 阻塞 |
| E4-S7 | 40 单元测试通过 | P1 | 阻塞 |
| E2-S5 | UI 三区渲染 | P2 | UI |
| E2-S6 | SessionList 加载 | P2 | UI |
| E2-S7 | TaskInput 交互 | P2 | UI |
| E3-S4 | 跨边界选中保持 | P2 | UI |
| E4-S4 | 错误响应格式 | P2 | API |

**P1 总结**: 17 项，P2: 5 项
**P1 全部通过才可上线**

---

## 4. 验收标准汇总

每个 Story 的 expect() 断言见 Epic 拆分表格。QA 执行顺序：

1. 先跑 CI 静态检查（TypeScript + Unit Tests）
2. 再跑 E2E Playwright tests
3. 最后执行真实 DOM 性能测试（E3-S2, E3-S3）

---

## 5. DoD (Definition of Done)

### E1 — MCP DoD 收尾

- [ ] `node scripts/generate-tool-index.ts` exit 0，输出 ≥ 7 entries
- [ ] `GET /health` → 200，返回 payload 包含 `{status: "ok"}`
- [ ] `tsc --noEmit` 在 mcp-server 目录返回 0 errors
- [ ] `pnpm test` 12 unit tests 全部通过，0 failures

### E2 — Workbench 生产化

- [ ] `NEXT_PUBLIC_WORKBENCH_ENABLED=true` 时 `/workbench` 返回 200
- [ ] `NEXT_PUBLIC_WORKBENCH_ENABLED=false` 时 `/workbench` 返回 404
- [ ] `agentSessionStore` 插入第 51 个 session 后 size === 50（oldest 被清理）
- [ ] XSS payload (`<script>alert(1)</script>`) 渲染为转义文本
- [ ] `pnpm exec playwright test tests/e2e/workbench-journey.spec.ts` 5 tests 全部通过
- [ ] WorkbenchUI header / messages / task-input 三区可见
- [ ] SessionList 显示非空时 ≥ 1 个 session item
- [ ] TaskInput submit 后无 network error

### E3 — Canvas 虚拟化

- [ ] `ChapterPanel.tsx` 无 `.map()` 用于 card 渲染路径
- [ ] `@tanstack/react-virtual` useVirtualizer estimateSize === 120, overscan === 3
- [ ] Playwright E2E `canvas-virtualization-perf.spec.ts` 100 节点 P50 < 100ms
- [ ] Playwright performance trace 150 节点 dropped frames < 2
- [ ] 滚动到节点 150 后 selectedCardSnapshot 与滚动前一致

### E4 — AI Agent 真实接入

- [ ] `POST /api/agent/sessions` → 201，body 包含 sessionId
- [ ] `GET /api/agent/sessions/:id/status` → 200，body 包含 status 字段
- [ ] `DELETE /api/agent/sessions/:id` → 204，body 为空
- [ ] 错误场景返回 `{error: string, code: number}`
- [ ] `OpenClawBridge.ts` 中 AbortController timeout === 30000
- [ ] `gateway ping` → true（sessions_spawn 运行时可达）
- [ ] backend + frontend `pnpm test` 40 tests 全部通过，0 failures

---

## 6. 依赖关系图

```
E1 (P001) ───────────────────────────┐
  └─ E1-S1~S4: CI gate ──────────────→ 上线门槛 (CI must be green)

E2 (P003)
  ├─ E2-S1: Feature Flag → Gate        ┐
  └─ E2-S4: E2E tests  ──────────────→ 上线门槛

E3 (P004)
  ├─ E3-S1: code review ──→ E3-S2/E3-S3
  └─ E3-S2, E3-S3: Playwright real DOM → 上线门槛 (性能)

E4 (P006)
  ├─ E4-S6: Gateway 可达 ──→ E4-S1~S5 (后置条件)
  └─ E4-S7: CI gate ────────────────→ 上线门槛

上线条件: E1 ✓ + E2 ✓ + E3 ✓ + E4 ✓ (全部 P1 通过)
```

---

## 7. 驳回条件

- 任一 P1 Story 验收失败 → 驳回重修
- E3-S2 P50 ≥ 100ms → 驳回，性能不达标
- E3-S3 dropped frames ≥ 2 → 驳回，jank 可见
- E2-S1 flag 控制失效 → 驳回，安全风险
- E4-S6 gateway 不可达 → 阻塞上报 coord
- 上线前 `NEXT_PUBLIC_WORKBENCH_ENABLED` 未配置 → 阻塞上报 coord

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint20-qa
- **执行日期**: 2026-05-01