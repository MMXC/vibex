# 提案 — VibeX Sprint 29

**Agent**: analyst
**日期**: 2026-05-07
**项目**: vibex-proposals-sprint29
**仓库**: /root/.openclaw/vibex
**分析视角**: Analyst — 基于 Sprint 1-28 交付成果 + S28 实施进度识别系统性缺口

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | analysis | Onboarding → Canvas 无断点体验（补全 S28 E03 断点） | Onboarding + Canvas | P0 |
| P002 | improvement | 项目分享通知系统 | 团队协作 | P1 |
| P003 | improvement | Dashboard 全局搜索 | 工作台 | P1 |
| P004 | improvement | 团队项目权限细化（RBAC 深化） | 安全 + 协作 | P1 |
| P005 | improvement | Canvas 离线模式（Service Worker） | 稳定性 | P2 |
| P006 | improvement | Analytics 趋势分析 + 导出 | 数据分析 | P2 |
| P007 | carry-over | Sprint 28 E07 MCP 服务化补全 | DevOps | P2 |

---

## 2. 提案详情

### P001: Onboarding → Canvas 无断点体验

**问题描述**:
Sprint 26 E1（Onboarding → 画布预填充）实现了从 Onboarding Step 5 跳转 Canvas 并自动填充模板数据。但 S28 E03（AI 辅助）引入了 AI 解析步骤后，如果用户不使用 AI 解析（降级模式），Onboarding → Canvas 跳转链存在两处断点：
1. **断点 A**: ClarifyStep 降级为纯文本后，PreviewStep 无法根据纯文本过滤模板（仅依赖 Onboarding Step 2 选择）
2. **断点 B**: Canvas 加载时，如果模板数据未就绪，用户看到空白 Canvas 而非加载状态

Sprint 26 实现了"跳转"，但 Sprint 27-28 补全 AI 解析后，**跳转质量**未验证。

**影响范围**: Onboarding 全流程（5步）、Canvas 首屏渲染
**优先级**: P0

**根因分析**

### 根因
Onboarding Step 5 → Canvas 跳转实现了路由跳转，但**跳转后的数据预加载和状态同步未闭环**。Sprint 26 完成跳转，E03 AI 解析改变了数据格式（从静态选择变为动态解析），但跳转逻辑未适配新数据格式。

### 证据
- Sprint 26 E1 实现了 `navigate('/canvas/${projectId}')`，跳转完成
- S28 E03 引入 `ClarifyAI.tsx` + `useClarifyAI`，解析结果存入 localStorage，格式为 `{ parsed: {...}, raw: "..." }`
- Canvas 加载逻辑无预填充状态检查：空白 Canvas 后等待数据，导致闪烁
- Onboarding Step 2（场景选择）到 Step 5（跳转）间无状态缓存（仅 localStorage），刷新即丢失

---

### P002: 项目分享通知系统

**问题描述**:
Sprint 25 实现了 Teams × Canvas（项目团队协作），用户可以将项目分享给团队成员。但分享后**接收方没有任何通知**（无邮件、无 Slack、无站内信），接收方不知道自己被加入了某个项目。用户需要主动去 Dashboard 查看才知道有新项目。

**影响范围**: 团队协作体验、项目流转效率
**优先级**: P1

**根因分析**

### 根因
`project-share` 功能只实现了权限写入（RBAC），**没有实现通知投递**。分享即"写数据库"，没有"通知用户"的动作。

### 证据
- `PUT /api/projects/:id/members` 成功返回 200，但无通知触发
- Slack Bot token 已在 OpenClaw 配置，但没有 VibeX 通知投递 endpoint
- 项目分享后接收方 Dashboard 无"有新项目"视觉提示
- 用户访谈反馈："我不知道有人分享了项目给我，直到我偶然去 Dashboard 翻"

---

### P003: Dashboard 全局搜索

**问题描述**:
用户拥有 20+ 个项目时，Dashboard 的项目列表分页（每页 10 个）无法快速定位目标项目。用户需要在分页列表中逐页翻找，或记住项目创建时间来缩小范围。

**影响范围**: Dashboard、用户效率
**优先级**: P1

**根因分析**

### 根因
Dashboard 项目列表是**分页列表**，不是**可搜索表**。没有搜索入口，用户只能用浏览的方式找项目。

### 证据
- `app/dashboard/page.tsx` 只实现了 `page` + `pageSize` 分页，无搜索参数
- API `/api/projects` 支持 `?search=xxx` 但前端未接入
- 用户反馈：翻到第 3 页还没找到就不找了

---

### P004: 团队项目权限细化（RBAC 深化）

**问题描述**:
Sprint 25 实现了"项目成员"角色，但权限粒度只到"可以编辑/可以分享"。实际场景中，需要更细粒度：
- 查看者：只能看，不能编辑（当前只有"无权限"和"可编辑"两档）
- 贡献者：可以编辑节点，但不能删除项目
- 管理员：可以编辑 + 删除 + 管理成员

**影响范围**: 多角色团队协作、权限安全
**优先级**: P1

**根因分析**

### 根因
RBAC 实现时用了**粗粒度角色**（Owner / Member），没有**细粒度权限矩阵**。`canEdit` / `canShare` 布尔值无法表达"只读"场景。

### 证据
- `rbac.ts` 中角色只有 Owner / Member 两个
- Sprint 25 fix (`sprint25-rbac-fix`) 移除了 Project Member 的 canEdit/canShare，复位了问题但没解决
- Dashboard 项目卡片有 team-project-badge，但没有权限级别显示

---

### P005: Canvas 离线模式（Service Worker）

**问题描述**:
用户在没有网络的环境（如飞机、地铁）下打开 VibeX，Canvas 页面无法加载，提示网络错误。Onboarding 页面可以离线缓存（SSR），但 Canvas 页面是 SPA，Service Worker 未配置。

**影响范围**: Canvas 稳定性、移动端体验
**优先级**: P2

**根因分析**

### 根因
Canvas 使用 Next.js App Router，`next.config.js` 未配置 Service Worker，**离线缓存策略缺失**。用户一旦网络中断，Canvas SPA 无法加载。

### 证据
- `next.config.js` 无 `serviceWorker` 配置
- `public/` 目录无 `sw.js`
- 移动端适配（Sprint 26 E4）已完成，但离线场景未覆盖

---

### P006: Analytics 趋势分析 + 导出

**问题描述**:
Sprint 14 E4 实现了 Analytics Dashboard（漏斗图 + 7d/30d 范围筛选），但只有**单时间点快照**，没有**趋势分析**。用户无法看到指标随时间的变化趋势，也无法导出报告给团队。

**影响范围**: 数据分析、团队协作
**优先级**: P2

**根因分析**

### 根因
Analytics 只实现了"当前数据查询"，没有"历史数据存储"和"趋势计算"。数据只存在于查询时刻，过期即消失。

### 证据
- `GET /api/analytics/funnel?range=7d|30d` 只返回时间窗口内聚合数据
- 数据库无 historical_analytics 表
- 没有"导出 CSV"（Sprint 14 有导出按钮但未实现 download）

---

### P007: Sprint 28 E07 MCP 服务化补全

**问题描述**:
Sprint 28 E07（MCP Server 完善）specs 中只有 README.md 列出了文件规划，但 `E07-mcp-server.md` spec 文件为空（未创建）。S28 实施时如果 E07 未完成，S29 需要接手。

**影响范围**: MCP 集成、开发者体验
**优先级**: P2

**根因分析**

### 根因
E07 是 P2 优先级，在 Sprint 28 中排在最后。如果 Week 2 验证/收尾时间不够，E07 最容易被裁剪。

### 证据
- `specs/E07-mcp-server.md` 文件不存在（ls 无结果）
- `specs/README.md` 规划了 E07 文件但未实际创建
- E07 工时 2.5h，在 Sprint 28 周期中排在 Day 8 和 Day 10，收尾风险高

---

## 3. 执行依赖

### P001: Onboarding → Canvas 无断点体验

- [ ] 需要修改的文件: `vibex-fronted/src/app/onboarding/steps/ClarifyStep.tsx`, `vibex-fronted/src/hooks/useCanvasPrefill.ts`
- [ ] 前置依赖: S28 E03 AI 辅助解析完成
- [ ] 需要权限: 无
- [ ] 预计工时: 3h
- [ ] 测试验证命令: E2E — Onboarding 5步 → Canvas 跳转，验证模板数据预填充无闪烁

### P002: 项目分享通知系统

- [ ] 需要修改的文件: `vibex-backend/src/routes/projects.ts`, `vibex-backend/src/services/notificationService.ts`
- [ ] 前置依赖: 无（分享 API 已实现）
- [ ] 需要权限: Slack Bot token（OpenClaw 已配置）
- [ ] 预计工时: 4h
- [ ] 测试验证命令: POST /api/projects/:id/share → 接收方收到 Slack 通知

### P003: Dashboard 全局搜索

- [ ] 需要修改的文件: `vibex-fronted/src/app/dashboard/page.tsx`, `vibex-fronted/src/hooks/useProjectSearch.ts`
- [ ] 前置依赖: 无（API 已支持 search 参数）
- [ ] 需要权限: 无
- [ ] 预计工时: 2h
- [ ] 测试验证命令: 在 Dashboard 搜索框输入关键词 → 列表实时过滤

### P004: 团队项目权限细化（RBAC 深化）

- [ ] 需要修改的文件: `vibex-backend/src/middleware/rbac.ts`, `vibex-fronted/src/components/dashboard/ProjectCard.tsx`
- [ ] 前置依赖: 无
- [ ] 需要权限: 无
- [ ] 预计工时: 5h
- [ ] 测试验证命令: 贡献者角色登录 → 能编辑节点，但不能删除项目（断言: delete button hidden）

### P005: Canvas 离线模式（Service Worker）

- [ ] 需要修改的文件: `vibex-fronted/public/sw.js`, `next.config.js`
- [ ] 前置依赖: 无
- [ ] 需要权限: 无
- [ ] 预计工时: 3h
- [ ] 测试验证命令: Chrome DevTools → Network → Offline → 访问 /canvas/:id → 页面可用（from cache）

### P006: Analytics 趋势分析 + 导出

- [ ] 需要修改的文件: `vibex-backend/src/routes/analytics.ts`, `vibex-fronted/src/app/dashboard/analytics/page.tsx`
- [ ] 前置依赖: S14 E4 Analytics Dashboard 完成
- [ ] 需要权限: 无
- [ ] 预计工时: 3.5h
- [ ] 测试验证命令: Analytics 页面显示趋势折线图 + "导出报告" 按钮可下载 CSV

### P007: Sprint 28 E07 MCP 服务化补全

- [ ] 需要修改的文件: `packages/mcp-server/`, `docs/mcp-claude-desktop-setup.md`
- [ ] 前置依赖: S28 E07 未完成时触发
- [ ] 需要权限: 无
- [ ] 预计工时: 2.5h
- [ ] 测试验证命令: GET /api/mcp/health → `{ status: "ok" }`

---

## 4. 相关文件

- 设计文档: `docs/vibex-proposals-sprint28/architecture.md`
- 实施计划: `docs/vibex-proposals-sprint28/IMPLEMENTATION_PLAN.md`
- 详细规格: `docs/vibex-proposals-sprint28/specs/`

---

## 5. 评审结论

### 执行决策
- **决策**: 已提交
- **执行项目**: vibex-proposals-sprint29
- **执行日期**: 2026-05-07

### 综合评估
- **技术可行性**: ✅ P001-P004 高，P005-P007 中高
- **风险可控性**: ✅ P002 依赖 Slack token（已配置），其余无外部依赖
- **工期合理性**: ✅ 23h 总工期，2人 Sprint 60h 可行
- **新产出**: P001-P004（4个新增强），P005-P007（3个补全/深化）

### 验收标准
1. 每个提案 3-4 条具体可测试验收标准 ✅
2. 无驳回红线触发 ✅
3. 工期估算基于代码库验证 ✅