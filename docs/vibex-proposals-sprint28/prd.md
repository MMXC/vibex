# VibeX Sprint 28 — PRD（产品需求文档）

**Agent**: PM
**日期**: 2026-05-07
**项目**: vibex-proposals-sprint28
**状态**: Draft
**执行决策**: 已采纳 | 执行项目: vibex-proposals-sprint28 | 执行日期: 2026-05-07

---

## 1. 执行摘要

### 背景
VibeX Sprint 27 已完成 Onboarding 重构、Canvas 版本历史、Dashboard 批量操作、基础移动端适配。Sprint 28 基于 Sprint 1-27 交付成果，识别下一批高优先级功能增强，涉及实时协作、性能优化、AI 辅助、模板管理、PRD 自动化、错误边界、MCP 集成 7 个方向。

### 目标
- 在 2 人 Sprint（2 周，60h）中完成 24.5h 工期的功能交付
- 所有 Epic/Story 具备可测试的 expect() 验收标准
- 每个功能点有明确的 Definition of Done

### 成功指标
| 指标 | 目标 |
|------|------|
| Sprint 工期完成率 | ≥ 90%（≥ 22h / 24.5h） |
| E2E 测试通过率 | 100% |
| TS 编译 errors | 0 |
| Lighthouse Performance Score | ≥ 85（Design Output） |
| DDSCanvasPage 渲染时间（300 nodes）| < 200ms |

---

## 2. Epic 拆分

### Epic 总览

| Epic ID | Epic 标题 | 工期 | 包含 Story | 优先级 |
|---------|----------|------|-----------|--------|
| E01 | 实时协作整合 | 5.5h | S01.1, S01.2, S01.3 | P0 |
| E02 | Design Output 性能优化 | 3.5h | S02.1, S02.2 | P0 |
| E03 | AI 辅助需求解析 | 3.5h | S03.1, S03.2, S03.3 | P1 |
| E04 | 模板 API 完整 CRUD | 3.5h | S04.1, S04.2, S04.3 | P1 |
| E05 | PRD → Canvas 自动流程 | 4h | S05.1, S05.2 | P1 |
| E06 | Canvas 错误边界完善 | 2h | S06.1 | P2 |
| E07 | MCP Server 集成完善 | 2.5h | S07.1, S07.2 | P2 |

**总工期: 24.5h**

---

### Epic E01: 实时协作整合
**Story S01.1: PresenceLayer 合并到 main**
| 字段 | 内容 |
|------|------|
| 描述 | 将 PresenceLayer.tsx 合并到 CanvasPage，整合 usePresence hook |
| 验收标准 | `expect(CanvasPage rendered, PresenceLayer mounted)` <br> `expect(presence state === "online" after render)` <br> `expect(user avatar visible)` |
| 工时 | 1.5h |
| 依赖 | Firebase 凭证配置（S01.3）|
| 页面集成 | CanvasPage（需要页面集成） |

**Story S01.2: 实时节点同步**
| 字段 | 内容 |
|------|------|
| 描述 | 实现 useRealtimeSync hook，监听节点变更并同步到其他用户 |
| 验收标准 | `expect(useRealtimeSync defined)` <br> `expect(node update received within 500ms)` <br> `expect(conflict resolved by last-write-wins)` |
| 工时 | 2.5h |
| 依赖 | S01.1 |
| 页面集成 | CanvasPage |

**Story S01.3: Firebase 凭证配置**
| 字段 | 内容 |
|------|------|
| 描述 | 配置 .env.staging Firebase 凭证，验证连接 |
| 验收标准 | `expect(env.staging contains FIREBASE_* vars)` <br> `expect(Firebase connection established)` <br> `expect(no console.error on CanvasPage mount)` |
| 工时 | 1.5h |
| 依赖 | 无 |
| 页面集成 | 无 |

---

### Epic E02: Design Output 性能优化
**Story S02.1: 虚拟化列表**
| 字段 | 内容 |
|------|------|
| 描述 | DDSCanvasPage 卡片列表引入 react-window FixedSizeList 虚拟化 |
| 验收标准 | `expect(react-window imported in DDSCanvasPage)` <br> `expect(DOM nodes reduced from ~200 to ~20 for 300-item list)` <br> `expect(lighthouse_score >= 85)` |
| 工时 | 2h |
| 依赖 | 无 |
| 页面集成 | DDSCanvasPage（需要页面集成） |

**Story S02.2: Memo 优化**
| 字段 | 内容 |
|------|------|
| 描述 | DDSCanvasPage 所有子组件添加 React.memo + useMemo |
| 验收标准 | `expect(all child components wrapped with React.memo)` <br> `expect(useMemo used for expensive computations)` <br> `expect(tsc --noEmit exits 0)` |
| 工时 | 1.5h |
| 依赖 | S02.1 |
| 页面集成 | DDSCanvasPage |

---

### Epic E03: AI 辅助需求解析
**Story S03.1: /api/ai/clarify Endpoint**
| 字段 | 内容 |
|------|------|
| 描述 | 实现 POST /api/ai/clarify，接收自然语言需求，返回结构化 JSON |
| 验收标准 | `expect(POST /api/ai/clarify returns 200)` <br> `expect(response.body.structured contains fields)` <br> `expect(timeout 30s fallback to rule engine)` |
| 工时 | 1.5h |
| 依赖 | 无 |
| 页面集成 | 无 |

**Story S03.2: ClarifyAI 组件**
| 字段 | 内容 |
|------|------|
| 描述 | Onboarding ClarifyStep 集成 ClarifyAI.tsx，显示 AI 解析预览 |
| 验收标准 | `expect(ClarifyAI.tsx renders in ClarifyStep)` <br> `expect(AI result displayed as structured preview)` <br> `expect(user can edit/confirm result)` |
| 工时 | 1h |
| 依赖 | S03.1 |
| 页面集成 | ClarifyStep / Onboarding（需要页面集成） |

**Story S03.3: 降级路径**
| 字段 | 内容 |
|------|------|
| 描述 | 无 API Key 时降级为纯文本引导，不阻断 Onboarding |
| 验收标准 | `expect(no API key shows guidance message, no error thrown)` <br> `expect(AI timeout 30s does not block Onboarding)` <br> `expect(Onboarding flow continues regardless of AI result)` |
| 工时 | 1h |
| 依赖 | S03.1 |
| 页面集成 | ClarifyStep |

---

### Epic E04: 模板 API 完整 CRUD
**Story S04.1: POST/PUT/DELETE API**
| 字段 | 内容 |
|------|------|
| 描述 | 在 /api/v1/templates route 添加 POST/PUT/DELETE 端点 |
| 验收标准 | `expect(POST /api/v1/templates returns 201)` <br> `expect(PUT /api/v1/templates/:id returns 200, fields updated)` <br> `expect(DELETE /api/v1/templates/:id returns 200, subsequent GET returns 404)` |
| 工时 | 1.5h |
| 依赖 | 无 |
| 页面集成 | 无 |

**Story S04.2: 模板 Dashboard UI**
| 字段 | 内容 |
|------|------|
| 描述 | 新增 /dashboard/templates 页面，列表 + 新建 + 编辑 + 删除 |
| 验收标准 | `expect(/dashboard/templates accessible, returns 200)` <br> `expect(template list displays created templates)` <br> `expect(create/edit/delete buttons functional)` |
| 工时 | 1.5h |
| 依赖 | S04.1 |
| 页面集成 | /dashboard/templates（需要页面集成） |

**Story S04.3: 模板导入/导出**
| 字段 | 内容 |
|------|------|
| 描述 | JSON 导出（download）和 JSON 导入（upload + parse）|
| 验收标准 | `expect(export downloads valid JSON file)` <br> `expect(import parses JSON and creates template)` <br> `expect(invalid JSON shows error message, no crash)` |
| 工时 | 0.5h |
| 依赖 | S04.2 |
| 页面集成 | /dashboard/templates |

---

### Epic E05: PRD → Canvas 自动流程
**Story S05.1: /api/canvas/from-prd Endpoint**
| 字段 | 内容 |
|------|------|
| 描述 | 实现 PRD JSON → Canvas node structure 映射 API |
| 验收标准 | `expect(POST /api/canvas/from-prd returns 200)` <br> `expect(response.nodes.length > 0)` <br> `expect(PRD chapter maps to left-panel node)` |
| 工时 | 2h |
| 依赖 | 无 |
| 页面集成 | 无 |

**Story S05.2: PRD Editor 一键生成**
| 字段 | 内容 |
|------|------|
| 描述 | PRD Editor 中"生成 Canvas"按钮，点击后 Canvas 三栏自动填充节点 |
| 验收标准 | `expect("生成 Canvas" button visible in PRD Editor)` <br> `expect(canvas left panel auto-populated after click)` <br> `expect(PRD change triggers canvas update within 1s)` |
| 工时 | 2h |
| 依赖 | S05.1 |
| 页面集成 | PRD Editor + Canvas 三栏（需要页面集成） |

---

### Epic E06: Canvas 错误边界完善
**Story S06.1: DDSCanvasPage ErrorBoundary**
| 字段 | 内容 |
|------|------|
| 描述 | DDSCanvasPage 外层包裹 ErrorBoundary，Fallback 含"重试"按钮 |
| 验收标准 | `expect(DDSCanvasPage wrapped in ErrorBoundary)` <br> `expect(simulated throw shows fallback UI with "重试" button)` <br> `expect(click retry restores component without full page reload)` <br> `expect(tsc --noEmit exits 0)` |
| 工时 | 2h |
| 依赖 | 无 |
| 页面集成 | DDSCanvasPage（需要页面集成） |

---

### Epic E07: MCP Server 集成完善
**Story S07.1: 健康检查 Endpoint**
| 字段 | 内容 |
|------|------|
| 描述 | 实现 GET /api/mcp/health endpoint |
| 验收标准 | `expect(GET /api/mcp/health returns 200)` <br> `expect(response.body.status === "ok")` <br> `expect(response.body.timestamp is valid ISO string)` |
| 工时 | 1h |
| 依赖 | 无 |
| 页面集成 | 无 |

**Story S07.2: MCP 集成测试套件**
| 字段 | 内容 |
|------|------|
| 描述 | 编写 mcp-integration.spec.ts E2E 测试，更新配置文档 |
| 验收标准 | `expect(mcp-integration.spec.ts passes)` <br> `expect(docs/mcp-claude-desktop-setup.md updated with simplified steps)` |
| 工时 | 1.5h |
| 依赖 | S07.1 |
| 页面集成 | 无 |

---

## 3. 验收标准汇总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F01.1 | PresenceLayer 合并 | CanvasPage 整合 PresenceLayer | expect(CanvasPage rendered, PresenceLayer mounted) | CanvasPage【需页面集成】 |
| F01.2 | 实时节点同步 | 节点变更同步到所有用户 | expect(node update received within 500ms) | CanvasPage【需页面集成】 |
| F01.3 | Firebase 凭证 | 环境变量配置 | expect(Firebase connection established) | 无 |
| F02.1 | 虚拟化列表 | react-window 虚拟化 DDSCanvasPage | expect(DOM nodes ~20 for 300-item list) | DDSCanvasPage【需页面集成】 |
| F02.2 | Memo 优化 | 子组件 React.memo | expect(tsc --noEmit exits 0) | DDSCanvasPage【需页面集成】 |
| F03.1 | /api/ai/clarify | AI 解析 endpoint | expect(timeout 30s fallback to rule engine) | 无 |
| F03.2 | ClarifyAI 组件 | Onboarding AI 辅助 | expect(user can edit/confirm result) | ClarifyStep【需页面集成】 |
| F03.3 | 降级路径 | 无 Key 降级引导 | expect(Onboarding continues regardless of AI result) | ClarifyStep |
| F04.1 | CRUD API | POST/PUT/DELETE 端点 | expect(DELETE后GET返回404) | 无 |
| F04.2 | 模板 Dashboard | /dashboard/templates 页面 | expect(create/edit/delete buttons functional) | /dashboard/templates【需页面集成】 |
| F04.3 | 导入/导出 | JSON 导入导出 | expect(invalid JSON shows error, no crash) | /dashboard/templates【需页面集成】 |
| F05.1 | from-prd API | PRD → Canvas API | expect(PRD chapter maps to left-panel node) | 无 |
| F05.2 | 一键生成 | PRD Editor 按钮触发 | expect(PRD change triggers canvas update within 1s) | PRD Editor + Canvas【需页面集成】 |
| F06.1 | ErrorBoundary | DDSCanvasPage 错误边界 | expect(click retry restores component without page reload) | DDSCanvasPage【需页面集成】 |
| F07.1 | 健康检查 | MCP health endpoint | expect(response.body.status === "ok") | 无 |
| F07.2 | 集成测试 | mcp-integration.spec.ts | expect(mcp-integration.spec.ts passes) | 无 |

---

## 4. Definition of Done

### 全局 DoD（每个 Epic/Story 必须满足）
- [ ] 代码已合并到 main branch
- [ ] TS 编译 0 errors（`tsc --noEmit` exit 0）
- [ ] E2E 测试覆盖该 Story 验收标准，测试通过
- [ ] 页面集成类功能经 gstack 浏览器验证
- [ ] PR review 通过

### Epic E01: 实时协作整合 DoD
- [ ] PresenceLayer 正确渲染在 CanvasPage
- [ ] Firebase 连接无 console.error
- [ ] useRealtimeSync hook 单元测试通过
- [ ] 多人编辑冲突时 last-write-wins 生效（可模拟测试）
- [ ] 集成测试 presence-mvp.spec.ts 通过

### Epic E02: Design Output 性能优化 DoD
- [ ] Lighthouse Performance Score ≥ 85
- [ ] 300 节点项目 DDSCanvasPage 渲染时间 < 200ms（DevTools Performance 验证）
- [ ] react-window FixedSizeList 正确工作，无滚动跳变
- [ ] 所有子组件 React.memo 未引入回归 bug

### Epic E03: AI 辅助需求解析 DoD
- [ ] /api/ai/clarify 单元测试覆盖 happy path + timeout 降级
- [ ] ClarifyAI.tsx 在 ClarifyStep 正确渲染
- [ ] 无 API Key 时不阻断 Onboarding（需手动测试验证）
- [ ] AI 解析结果可编辑确认后跳转 PreviewStep

### Epic E04: 模板 API 完整 CRUD DoD
- [ ] POST/PUT/DELETE API 端点测试覆盖 201/200/404 响应
- [ ] /dashboard/templates 页面在 localhost 可访问
- [ ] 新建/编辑/删除功能全链路测试通过
- [ ] JSON 导入导出功能测试覆盖 valid + invalid JSON

### Epic E05: PRD → Canvas 自动流程 DoD
- [ ] /api/canvas/from-prd API 测试覆盖单 chapter + 3 steps 映射
- [ ] PRD Editor 中"生成 Canvas"按钮存在且可点击
- [ ] Canvas 三栏节点填充后验证内容正确
- [ ] PRD 内容变更触发 Canvas 同步（双向）

### Epic E06: Canvas 错误边界完善 DoD
- [ ] DDSCanvasPage 渲染时模拟 `throw new Error()` 能触发 Fallback
- [ ] Fallback 包含"渲染失败"文本 + "重试"按钮
- [ ] 点击"重试"后组件恢复，不触发整页刷新
- [ ] TS 编译 0 errors

### Epic E07: MCP Server 集成完善 DoD
- [ ] GET /api/mcp/health 返回 `{ status: "ok", timestamp: "..." }`
- [ ] mcp-integration.spec.ts E2E 测试 100% 通过
- [ ] docs/mcp-claude-desktop-setup.md 更新并通过 review

---

## 5. 执行计划

### Week 1
| Day | 任务 | Epic |
|-----|------|------|
| Day 1 AM | P002 E02 虚拟化列表 | E02 |
| Day 1 PM | P004 E04 CRUD API + Dashboard UI | E04 |
| Day 2 | P006 E06 DDSCanvasPage ErrorBoundary | E06 |
| Day 3 | P005 E05 PRD → Canvas API + 按钮 | E05 |
| Day 4 | P007 E07 MCP 健康检查 + 集成测试 | E07 |
| Day 5 | P003 E03 API + 降级路径 | E03 |

### Week 2
| Day | 任务 | Epic |
|-----|------|------|
| Day 6-7 | P001 E01 实时协作（PresenceLayer + 节点同步）| E01 |
| Day 8 | P001 E01 Firebase 凭证 + 集成测试 | E01 |
| Day 9 | 全量 E2E + Lighthouse 验证 | - |
| Day 10 | Sprint 28 收尾 + 文档更新 | - |

---

## 6. 自检清单

- [ ] 执行摘要包含：背景 + 目标 + 成功指标
- [ ] Epic/Story 表格格式正确（ID/描述/验收标准/工时/依赖）
- [ ] 每个 Story 有可写的 expect() 断言
- [ ] DoD 章节存在且具体（每个 Epic 有独立 DoD）
- [ ] 功能点格式表存在，包含 ID/描述/验收标准/页面集成标注
- [ ] 所有【需页面集成】的功能点均已标注
- [ ] 工期估算可加总验证（24.5h）

---

*本 PRD 由 PM 基于 analyst 评审报告（analysis.md）产出。*
