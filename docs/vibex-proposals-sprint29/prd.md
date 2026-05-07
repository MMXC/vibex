# VibeX Sprint 29 — PRD（产品需求文档）

**Agent**: PM
**日期**: 2026-05-07
**项目**: vibex-proposals-sprint29
**状态**: Draft
**执行决策**: 已采纳 | 执行项目: vibex-proposals-sprint29 | 执行日期: 2026-05-07

---

## 1. 执行摘要

### 背景
VibeX Sprint 28 已完成实时协作整合（E01）、Design Output 性能优化（E02）、PRD→Canvas 自动流程（E05）。Sprint 29 聚焦 7 个方向：Onboarding 到 Canvas 的无缝跳转体验、项目分享 Slack 通知、Dashboard 全局搜索增强、RBAC 细粒度权限、Canvas 离线模式、Analytics 趋势折线图、Sprint 28 Specs 补全。

### 目标
- 在 2 人 Sprint（2 周，60h）中完成 22h 工期的功能交付
- 所有 Epic/Story 具备可测试的 expect() 验收标准
- Sprint 28 specs 目录全部补全（E03/E04/E06/E07）

### 成功指标
| 指标 | 目标 |
|------|------|
| Sprint 工期完成率 | ≥ 90%（≥ 19.8h / 22h） |
| E2E 测试通过率 | 100% |
| TS 编译 errors | 0 |
| Lighthouse PWA Score | ≥ 70（离线模式） |
| 通知送达延迟 | < 30s（Slack 分享通知）|

---

## 2. Epic 拆分

### Epic 总览

| Epic ID | Epic 标题 | 工期 | 包含 Story | 优先级 |
|---------|----------|------|-----------|--------|
| E01 | Onboarding → Canvas 无断点 | 3h | S01.1, S01.2, S01.3 | P0 |
| E02 | 项目分享通知系统 | 4h | S02.1, S02.2, S02.3 | P1 |
| E03 | Dashboard 全局搜索增强 | 1h | S03.1, S03.2 | P1 |
| E04 | RBAC 细粒度权限矩阵 | 5h | S04.1, S04.2, S04.3 | P1 |
| E05 | Canvas 离线模式 | 3h | S05.1, S05.2, S05.3 | P2 |
| E06 | Analytics 趋势分析 | 3.5h | S06.1, S06.2, S06.3 | P2 |
| E07 | Sprint 28 Specs 补全 | 2.5h | S07.1 | P2 |

**总工期: 22h**

---

### Epic E01: Onboarding → Canvas 无断点
**Story S01.1: Canvas 预填充骨架屏**
| 字段 | 内容 |
|------|------|
| 描述 | 修改 app/canvas/[id]/page.tsx，渲染前检查 localStorage 预填充数据，显示 skeleton |
| 验收标准 | `expect(Canvas page shows skeleton within 100ms of navigation)` <br> `expect(no white screen during data load)` <br> `expect(skeleton replaced by real content within 500ms)` |
| 工时 | 1h |
| 依赖 | S28 E03 AI 辅助解析 |
| 页面集成 | app/canvas/[id]/page.tsx（需要页面集成） |

**Story S01.2: AI 降级 fallback 适配**
| 字段 | 内容 |
|------|------|
| 描述 | AI 降级时存入 { raw: "...", parsed: null } 格式，Canvas 跳转仍能填充模板 |
| 验收标准 | `expect(ClarifyStep stores { raw, parsed: null } on AI fallback)` <br> `expect(Canvas renders template even with parsed: null)` <br> `expect(no crash when raw text exists but parsed is null)` |
| 工时 | 1h |
| 依赖 | S01.1 |
| 页面集成 | ClarifyStep / Canvas |

**Story S01.3: sessionStorage Onboarding 持久化**
| 字段 | 内容 |
|------|------|
| 描述 | useOnboarding.ts 添加 sessionStorage 持久化，Step 2→Step 5 刷新不丢失进度 |
| 验收标准 | `expect(navigate from Step 2 to Step 5, refresh page, progress preserved)` <br> `expect(sessionStorage key matches onboarding flow id)` <br> `expect(tsc --noEmit exits 0)` |
| 工时 | 1h |
| 依赖 | 无 |
| 页面集成 | Onboarding 全部 Step |

---

### Epic E02: 项目分享通知系统
**Story S02.1: Slack 通知 Endpoint**
| 字段 | 内容 |
|------|------|
| 描述 | 新增 POST /api/projects/:id/share/notify，调用 Slack Bot API 发送 DM |
| 验收标准 | `expect(POST /api/projects/:id/share/notify returns 200)` <br> `expect(Slack DM received by target user within 30s)` <br> `expect(notification message includes project name and sender name)` |
| 工时 | 1.5h |
| 依赖 | Slack Bot token |
| 页面集成 | 无 |

**Story S02.2: 分享成功后触发通知**
| 字段 | 内容 |
|------|------|
| 描述 | 在 canvas-share.ts 分享成功后调用 notification service |
| 验收标准 | `expect(canvas-share POST returns 200, notification triggered)` <br> `expect(no duplicate notifications on retry)` <br> `expect(Slack token invalid shows graceful error, no crash)` |
| 工时 | 1.5h |
| 依赖 | S02.1 |
| 页面集成 | 无 |

**Story S02.3: 站内通知 Badge**
| 字段 | 内容 |
|------|------|
| 描述 | 当用户无 Slack 时，Dashboard 显示"新项目"badge |
| 验收标准 | `expect(Dashboard shows "新项目" badge when user has unread shared projects)` <br> `expect(badge count matches unread share count)` <br> `expect(clicking badge navigates to shared project)` |
| 工时 | 1h |
| 依赖 | S02.1 |
| 页面集成 | Dashboard（需要页面集成） |

---

### Epic E03: Dashboard 全局搜索增强
**Story S03.1: 搜索结果高亮**
| 字段 | 内容 |
|------|------|
| 描述 | 搜索结果高亮匹配文本，提升可读性 |
| 验收标准 | `expect(search result highlights matched substring with <mark> tag)` <br> `expect(highlighted text visible in project card title)` <br> `expect(multiple matches all highlighted)` |
| 工时 | 0.5h |
| 依赖 | 无 |
| 页面集成 | Dashboard 搜索框（需要页面集成） |

**Story S03.2: 无结果提示 + E2E 测试**
| 字段 | 内容 |
|------|------|
| 描述 | 搜索无结果时显示友好提示，E2E 测试覆盖 |
| 验收标准 | `expect(empty search result shows "没有找到包含 xxx 的项目")` <br> `expect(search input "登录" filters project list in < 100ms)` <br> `expect(e2e test search.spec.ts passes)` |
| 工时 | 0.5h |
| 依赖 | S03.1 |
| 页面集成 | Dashboard |

---

### Epic E04: RBAC 细粒度权限矩阵
**Story S04.1: 权限类型扩展**
| 字段 | 内容 |
|------|------|
| 描述 | rbac.ts 添加 ProjectPermission 类型，TeamService role 扩展为 owner/admin/member/viewer |
| 验收标准 | `expect(rbac.ts exports ProjectPermission type: view|edit|delete|manageMembers)` <br> `expect(TeamService role includes 'viewer')` <br> `expect(tsc --noEmit exits 0)` |
| 工时 | 1.5h |
| 依赖 | 无 |
| 页面集成 | 无 |

**Story S04.2: 权限 Badge + UI 隔离**
| 字段 | 内容 |
|------|------|
| 描述 | ProjectCard 显示用户权限级别 badge，Canvas 删除按钮按权限显示/隐藏 |
| 验收标准 | `expect(ProjectCard shows permission badge (viewer/member/admin))` <br> `expect(role='viewer' sees edit button disabled or hidden)` <br> `expect(role='member' cannot see delete button)` |
| 工时 | 2h |
| 依赖 | S04.1 |
| 页面集成 | ProjectCard + Canvas（需要页面集成） |

**Story S04.3: API 权限拦截**
| 字段 | 内容 |
|------|------|
| 描述 | API 层拦截无权限操作，返回 403 + 前端显示"权限不足"提示 |
| 验收标准 | `expect(unauthorized DELETE /api/projects/:id returns 403)` <br> `expect(frontend shows "权限不足" toast on 403)` <br> `expect(role='viewer' cannot trigger POST /api/canvas)` |
| 工时 | 1.5h |
| 依赖 | S04.1 |
| 页面集成 | Canvas 删除操作（需要页面集成） |

---

### Epic E05: Canvas 离线模式
**Story S05.1: Service Worker 配置**
| 字段 | 内容 |
|------|------|
| 描述 | next.config.js 启用 serviceWorker，创建 public/sw.js 使用 Workbox 缓存策略 |
| 验收标准 | `expect(next.config.js enables serviceWorker)` <br> `expect(public/sw.js exists and registers successfully)` <br> `expect(Workbox cache strategy: cache-first for assets, network-first for API)` |
| 工时 | 1h |
| 依赖 | 无 |
| 页面集成 | 无 |

**Story S05.2: Canvas 离线可用 + Banner**
| 字段 | 内容 |
|------|------|
| 描述 | 离线时 Canvas 页面可用，显示"离线模式"banner，不阻断使用 |
| 验收标准 | `expect(Chrome DevTools offline mode, /canvas/:id loads from cache)` <br> `expect(offline banner visible when network disconnected)` <br> `expect(online restoration triggers sync within 5s)` |
| 工时 | 1h |
| 依赖 | S05.1 |
| 页面集成 | Canvas 页面（需要页面集成） |

**Story S05.3: Lighthouse PWA 评分**
| 字段 | 内容 |
|------|------|
| 描述 | Lighthouse PWA 评分 ≥ 70 |
| 验收标准 | `expect(lighthouse pwa_score >= 70)` <br> `expect(PWA manifest exists in public/)` <br> `expect(tsc --noEmit exits 0)` |
| 工时 | 1h |
| 依赖 | S05.1 |
| 页面集成 | 无 |

---

### Epic E06: Analytics 趋势分析
**Story S06.1: 历史数据聚合 API**
| 字段 | 内容 |
|------|------|
| 描述 | GET /api/analytics/funnel 返回 30 天日/周聚合数据（内存计算，不改 schema）|
| 验收标准 | `expect(GET /api/analytics/funnel returns historical data array)` <br> `expect(data includes date, conversionRate fields)` <br> `expect(returns 30 days of daily aggregates)` |
| 工时 | 1h |
| 依赖 | S14 E4 |
| 页面集成 | 无 |

**Story S06.2: 趋势折线图组件**
| 字段 | 内容 |
|------|------|
| 描述 | 创建 TrendChart.tsx（纯 SVG），集成到 Analytics Dashboard |
| 验收标准 | `expect(TrendChart.tsx renders SVG line chart)` <br> `expect(chart shows X-axis time, Y-axis conversion rate)` <br> `expect(7d / 30d / 90d toggle switches displayed data range)` |
| 工时 | 1.5h |
| 依赖 | S06.1 |
| 页面集成 | Analytics Dashboard（需要页面集成） |

**Story S06.3: CSV 导出含趋势数据**
| 字段 | 内容 |
|------|------|
| 描述 | "导出 CSV" 按钮包含趋势数据列（日期 + 转化率 + 趋势）|
| 验收标准 | `expect(export CSV includes date, conversionRate, trend columns)` <br> `expect(CSV opens in Excel/LibreOffice with correct encoding)` <br> `expect(data insufficient (< 3 points) shows empty state)` |
| 工时 | 1h |
| 依赖 | S06.1 |
| 页面集成 | Analytics Dashboard |

---

### Epic E07: Sprint 28 Specs 补全
**Story S07.1: 补全 E03/E04/E06/E07 Specs**
| 字段 | 内容 |
|------|------|
| 描述 | 创建 E03-ai-clarify.md、E04-template-crud.md、E06-error-boundary.md、E07-mcp-server.md 详细规格文档 |
| 验收标准 | `expect(E03-ai-clarify.md: /api/ai/clarify request/response schema complete)` <br> `expect(E04-template-crud.md: CRUD API schema + Dashboard UI layout complete)` <br> `expect(E06-error-boundary.md: Fallback UI + boundary conditions complete)` <br> `expect(E07-mcp-server.md: health check protocol + integration test cases complete)` |
| 工时 | 2.5h |
| 依赖 | 无 |
| 页面集成 | 无 |

---

## 3. 验收标准汇总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F01.1 | 预填充骨架屏 | Canvas 页面 skeleton | expect(skeleton within 100ms, no white screen) | app/canvas/[id]【需页面集成】 |
| F01.2 | AI 降级适配 | 降级时 { raw, parsed: null } | expect(Canvas renders with parsed: null) | Canvas |
| F01.3 | sessionStorage 持久化 | 刷新保留 Onboarding 进度 | expect(progress preserved after refresh) | Onboarding【需页面集成】 |
| F02.1 | Slack 通知 Endpoint | POST notify → Slack DM | expect(notification within 30s) | 无 |
| F02.2 | 分享触发通知 | canvas-share 成功后调用 | expect(no duplicate notifications) | 无 |
| F02.3 | 站内 Badge | 无 Slack 时 Dashboard badge | expect(badge count matches unread) | Dashboard【需页面集成】 |
| F03.1 | 搜索高亮 | 高亮匹配文本 | expect(<mark> tag on matched text) | Dashboard【需页面集成】 |
| F03.2 | 无结果提示 | 空搜索显示友好提示 | expect("没有找到包含 xxx 的项目") | Dashboard |
| F04.1 | 权限类型扩展 | rbac.ts + TeamService | expect(viewer role exists) | 无 |
| F04.2 | 权限 Badge | ProjectCard badge | expect(edit disabled for viewer) | ProjectCard【需页面集成】 |
| F04.3 | API 拦截 | 403 + 前端提示 | expect(403 returns, toast shown) | Canvas 删除【需页面集成】 |
| F05.1 | SW 配置 | Workbox 缓存策略 | expect(sw.js registered) | 无 |
| F05.2 | 离线 Banner | 离线可用 + banner | expect(offline loads from cache) | Canvas【需页面集成】 |
| F05.3 | PWA 评分 | Lighthouse PWA | expect(pwa_score >= 70) | 无 |
| F06.1 | 历史数据 API | 30天聚合 | expect(30 days of daily aggregates) | 无 |
| F06.2 | 趋势折线图 | SVG 折线图 | expect(X=time, Y=conversionRate) | Analytics【需页面集成】 |
| F06.3 | CSV 导出 | 含趋势列 | expect(date, conversionRate, trend columns) | Analytics |
| F07.1 | Specs 补全 | E03/E04/E06/E07 | expect(all 4 spec files created) | 无 |

---

## 4. Definition of Done

### 全局 DoD（每个 Epic/Story 必须满足）
- [ ] 代码已合并到 main branch
- [ ] TS 编译 0 errors（`tsc --noEmit` exit 0）
- [ ] E2E 测试覆盖该 Story 验收标准，测试通过
- [ ] 页面集成类功能经 gstack 浏览器验证
- [ ] PR review 通过

### Epic E01: Onboarding → Canvas 无断点 DoD
- [ ] Canvas 首屏 skeleton 在 100ms 内可见，无白屏
- [ ] AI 降级模式下模板数据仍能填充
- [ ] Onboarding Step 2→Step 5 刷新后进度不丢失
- [ ] useCanvasPrefill hook 单元测试通过

### Epic E02: 项目分享通知系统 DoD
- [ ] Slack DM 在分享后 30s 内送达目标用户
- [ ] 重试不产生重复通知
- [ ] Slack token 无效时显示友好错误，不 crash
- [ ] 无 Slack 用户在 Dashboard 看到"新项目"badge

### Epic E03: Dashboard 全局搜索增强 DoD
- [ ] 搜索结果高亮匹配文本（<mark> 标签）
- [ ] 搜索空结果显示友好提示
- [ ] 搜索过滤响应 < 100ms
- [ ] e2e test search.spec.ts 通过

### Epic E04: RBAC 细粒度权限矩阵 DoD
- [ ] rbac.ts 导出完整 ProjectPermission 类型
- [ ] viewer 角色在 ProjectCard 显示 badge，编辑按钮 disabled
- [ ] member 角色看不到删除按钮
- [ ] 无权限操作 API 返回 403，前端显示 toast
- [ ] TS 编译 0 errors

### Epic E05: Canvas 离线模式 DoD
- [ ] Chrome DevTools Offline 模式 /canvas/:id 仍可加载
- [ ] 离线时显示"离线模式"banner，不阻断使用
- [ ] 重新上线后 5s 内自动同步
- [ ] Lighthouse PWA Score >= 70
- [ ] public/sw.js 正确注册，console 无 SW 错误

### Epic E06: Analytics 趋势分析 DoD
- [ ] GET /api/analytics/funnel 返回 30 天聚合数据
- [ ] TrendChart.tsx 正确渲染 SVG 折线图
- [ ] 7d / 30d / 90d 切换正确切换数据范围
- [ ] CSV 导出包含趋势数据列
- [ ] 数据 < 3 条时显示空状态，不 crash

### Epic E07: Sprint 28 Specs 补全 DoD
- [ ] E03-ai-clarify.md 包含 /api/ai/clarify 完整请求/响应格式
- [ ] E04-template-crud.md 包含 CRUD API schema + Dashboard UI 布局
- [ ] E06-error-boundary.md 包含 Fallback UI 设计 + 边界条件
- [ ] E07-mcp-server.md 包含健康检查协议 + 集成测试用例
- [ ] 所有 4 个文件可读、无错误、与 S28 IMPLEMENTATION_PLAN 对齐

---

## 5. 执行计划

### Week 1
| Day | 任务 | Epic |
|-----|------|------|
| Day 1 AM | P003 搜索验证 + 高亮 | E03 |
| Day 1 PM | P007 Specs 补全（E03/E04/E06/E07）| E07 |
| Day 2 | P001 Onboarding → Canvas | E01 |
| Day 3 | P002 项目分享通知 | E02 |
| Day 4 | P004 RBAC 深化 | E04 |
| Day 5 | P005 离线模式 | E05 |

### Week 2
| Day | 任务 | Epic |
|-----|------|------|
| Day 6 | P006 Analytics 趋势分析 | E06 |
| Day 7-10 | 验证测试 + 收尾 | - |

---

## 6. 自检清单

- [ ] 执行摘要包含：背景 + 目标 + 成功指标
- [ ] Epic/Story 表格格式正确（ID/描述/验收标准/工时/依赖）
- [ ] 每个 Story 有可写的 expect() 断言
- [ ] DoD 章节存在且具体（每个 Epic 有独立 DoD）
- [ ] 功能点格式表存在，包含 ID/描述/验收标准/页面集成标注
- [ ] 所有【需页面集成】的功能点均已标注
- [ ] 工期估算可加总验证（22h）

---

*本 PRD 由 PM 基于 analyst 评审报告（analysis.md）产出。P003/P006 修正项已纳入 Epic/Story 定义。*
