# VibeX Sprint 29 — 实施计划

**Agent**: architect
**日期**: 2026-05-07
**项目**: vibex-proposals-sprint29
**总工期**: 22h（2人 Sprint，60h）
**执行决策**: 已采纳 | 执行项目: vibex-proposals-sprint29 | 执行日期: 2026-05-07

---

## 执行摘要

Sprint 29 包含 7 个 Epic，聚焦 Onboarding 无断点体验、项目分享 Slack 通知、RBAC 权限细化、Canvas 离线模式、Analytics 趋势分析。总工期 22h，2人 Sprint 可行。

---

## 1. Sprint Overview

### 1.1 工期汇总

| Epic | 标题 | 工期 | 优先级 | 依赖 |
|------|------|------|--------|------|
| E01 | Onboarding → Canvas 无断点 | 3h | P0 | S28 E03 |
| E02 | 项目分享通知系统 | 4h | P1 | Slack token |
| E03 | Dashboard 全局搜索增强 | 1h | P1 | 无 |
| E04 | RBAC 细粒度权限矩阵 | 5h | P1 | 无 |
| E05 | Canvas 离线模式 | 3h | P2 | 无 |
| E06 | Analytics 趋势分析 | 3.5h | P2 | S14 E4 |
| E07 | Sprint 28 Specs 补全 | 2.5h | P2 | 无 |
| **合计** | | **22h** | | |

### 1.2 Week 1/2 日历表

| Day | 任务 | Epic | 工期 | 备注 |
|-----|------|------|------|------|
| Day 1 AM | P003 搜索验证 + 高亮 | E03 | 0.5h | 前端已就绪，验证+高亮 |
| Day 1 PM | P007 Specs 补全（E03/E04/E06/E07）| E07 | 2.5h | 文档工作先行 |
| Day 2 | P001 Onboarding → Canvas | E01 | 3h | P0 最优先 |
| Day 3 | P002 项目分享通知 | E02 | 4h | Slack API 集成 |
| Day 4 | P004 RBAC 深化 | E04 | 5h | 最复杂，单独冲刺 |
| Day 5 | P005 离线模式 | E05 | 3h | Workbox 配置 |
| Day 6 | P006 Analytics 趋势分析 | E06 | 3.5h | SVG 折线图 |
| Day 7-10 | 验证测试 + 收尾 | - | - | E2E + Lighthouse |

### 1.3 优先级排序依据

1. **P0（E01）**: Onboarding → Canvas 是用户体验核心断点，影响所有新用户
2. **P1（E02/E03/E04）**: 协作+安全增强，用户量覆盖广
3. **P2（E05/E06/E07）**: 离线可用+趋势分析+文档补全，次要优先级

---

## 2. Epic 实施步骤

### E01: Onboarding → Canvas 无断点

**工期**: 3h | **优先级**: P0 | **依赖**: S28 E03（AI 解析）

#### 开发步骤

1. **创建 `hooks/useCanvasPrefill.ts`**（新建）
   - 检查 localStorage `PENDING_TEMPLATE_REQ_KEY`
   - 返回 `{ state: 'loading' | 'prefilled' | 'empty', data }`
   - 处理 `{ raw, parsed: null }` AI 降级格式

2. **修改 `app/canvas/[id]/page.tsx`**
   - 挂载 `useCanvasPrefill` hook
   - 渲染前显示 `<CanvasSkeleton />`（100ms 内可见）
   - 数据就绪后替换为真实 Canvas 内容

3. **修改 `components/onboarding/ClarifyStep.tsx`**
   - AI 降级时存入 `localStorage` 格式改为 `{ raw, parsed: null }`
   - 确保 `raw` 字段始终存在

4. **修改 `hooks/useOnboarding.ts`**
   - 添加 `sessionStorage` 持久化（key: `onboarding_flow_{flowId}`）
   - Step 2→Step 5 刷新后进度不丢失

5. **创建 `components/canvas/CanvasSkeleton.tsx`**（新建）
   - 骨架屏组件，显示 Canvas 三栏占位

#### 验收门控

- [ ] `useCanvasPrefill` hook 单元测试覆盖
- [ ] Canvas skeleton 100ms 内可见，无白屏
- [ ] AI 降级 `{ raw, parsed: null }` 模式下 Canvas 仍能填充
- [ ] Onboarding Step 2→Step 5 刷新后进度保留
- [ ] `tsc --noEmit` 退出 0
- [ ] E2E: Onboarding→Canvas 跳转流程通过

---

### E02: 项目分享通知系统

**工期**: 4h | **优先级**: P1 | **依赖**: Slack Bot token

#### 开发步骤

1. **创建 `app/api/projects/[id]/share/notify/route.ts`**（新建）
   - POST endpoint，接收 `recipientId` + `message`
   - 调用 `NotificationService.triggerNotify()`
   - 去重：基于 `shareId + recipientId` 哈希
   - 错误处理：Slack 不可用时降级站内

2. **创建 `lib/notification/NotificationService.ts`**（新建）
   - `triggerNotify({ projectId, recipientId, channel })`
   - Slack DM 调用 `@slack/web-api`
   - 站内通知写入 `NotificationStore`
   - 返回 `{ success, notificationId, channel, deliveredAt }`

3. **修改 `components/canvas/share.ts`**（现有）
   - 分享成功后调用 `NotificationService.triggerNotify()`
   - 传入 `projectId` + `recipientId`

4. **创建 `components/dashboard/ShareBadge.tsx`**（新建）
   - 无 Slack 用户显示"新项目"badge
   - badge 数量 = unread share count
   - 点击跳转共享项目

#### 验收门控

- [ ] POST `/api/projects/:id/share/notify` 返回 200 + `{ success, notificationId }`
- [ ] Slack DM 30s 内送达（或降级站内）
- [ ] 重试不产生重复通知（去重检查）
- [ ] Slack token 无效时返回友好错误，无 crash
- [ ] Dashboard badge 显示正确数量
- [ ] `tsc --noEmit` 退出 0
- [ ] E2E: 分享→通知送达流程通过

---

### E03: Dashboard 全局搜索增强

**工期**: 1h | **优先级**: P1 | **依赖**: 无

#### 开发步骤

1. **修改 `components/dashboard/SearchBar.tsx`**
   - 搜索结果高亮使用 `<mark>` 标签
   - 非 `<span class="highlight">`
   - 匹配多个词全部高亮

2. **修改 `components/dashboard/DashboardPage.tsx`**
   - 无搜索结果时显示友好提示（"没有找到包含 xxx 的项目"）
   - 搜索输入时 100ms 内过滤响应

3. **创建 `tests/e2e/search.spec.ts`**（新建）
   - 搜索过滤 E2E 测试
   - 高亮可见性测试
   - 空结果提示测试

4. **验证 `GET /api/projects` 后端搜索接入**
   - 确认 `?search=xxx` 参数生效
   - 如未生效，记录为 Tech Debt

#### 验收门控

- [ ] 搜索结果使用 `<mark>` 标签高亮匹配文本
- [ ] 搜索 "登录" → 项目列表实时过滤 < 100ms
- [ ] 空搜索显示"没有找到包含 xxx 的项目"
- [ ] `tsc --noEmit` 退出 0
- [ ] `tests/e2e/search.spec.ts` 通过

---

### E04: RBAC 细粒度权限矩阵

**工期**: 5h | **优先级**: P1 | **依赖**: 无

#### 开发步骤

1. **创建 `lib/rbac/RBACService.ts`**（新建）
   - `getPermissions(role: TeamRole): ProjectPermission[]`
   - `canPerform(userId, projectId, action): boolean`
   - 权限矩阵：
     - `viewer`: `[view]`
     - `member`: `[view, edit]`
     - `admin`: `[view, edit, delete, manageMembers]`
     - `owner`: `[view, edit, delete, manageMembers]`

2. **修改 `lib/rbac/types.ts`**
   - 添加 `type ProjectPermission = 'view' | 'edit' | 'delete' | 'manageMembers'`
   - 添加 `type TeamRole = 'owner' | 'admin' | 'member' | 'viewer'`

3. **创建 `app/api/projects/[id]/role/route.ts`**（新建）
   - PUT endpoint：`PUT /api/projects/:id/role`
   - Body: `{ memberId, role }`
   - 权限验证：仅 owner/admin 可调用
   - 无权限返回 403 + toast

4. **修改 `components/project/ProjectCard.tsx`**
   - 显示用户权限级别 badge（viewer/member/admin）
   - badge 样式区分

5. **修改 `components/canvas/DeleteButton.tsx`**
   - `viewer`/`member` 角色时按钮 disabled（⚠️ disabled，非 hidden）
   - `admin`/`owner` 角色时正常显示

6. **修改 `lib/rbac/RBACGuard.tsx`**（新建）
   - React 组件形式的权限隔离
   - `<RBACGuard permission="delete">` 包裹删除区域

#### 验收门控

- [ ] `rbac.ts` 导出完整 `ProjectPermission` 类型
- [ ] `viewer` 角色编辑按钮 disabled，非 hidden
- [ ] `member` 角色看不到删除按钮
- [ ] 无权限操作 API 返回 403，前端显示 toast
- [ ] `tsc --noEmit` 退出 0
- [ ] E2E: 403 权限拦截通过

---

### E05: Canvas 离线模式

**工期**: 3h | **优先级**: P2 | **依赖**: 无

#### 开发步骤

1. **修改 `next.config.js`**
   - 启用 `serviceWorker` 配置
   - 配置 Workbox 插件

2. **创建 `public/sw.js`**（新建）
   - Workbox 缓存策略：
     - `cacheFirst` for 静态资源（JS/CSS/图片）
     - `networkFirst` for API（stale-while-revalidate）
   - App Shell 预缓存（index.html + JS + CSS）
   - 离线 fallback 响应

3. **创建 `public/manifest.json`**（新建）
   - PWA manifest：name, icons, start_url, display: standalone
   - theme_color, background_color

4. **创建 `components/canvas/OfflineBanner.tsx`**（新建）
   - 离线时显示 banner："离线模式，部分功能可能不可用"
   - 重新上线后 5s 内自动隐藏

5. **创建 `public/icons/`**（新建）
   - PWA 图标：192x192.png, 512x512.png

#### 验收门控

- [ ] `public/sw.js` 注册成功，console 无 SW 错误
- [ ] Chrome DevTools Offline 模式访问 `/canvas/:id` 可用（from cache）
- [ ] 离线时显示"离线模式" banner，不阻断使用
- [ ] Lighthouse PWA Score >= 70
- [ ] `tsc --noEmit` 退出 0

---

### E06: Analytics 趋势分析

**工期**: 3.5h | **优先级**: P2 | **依赖**: S14 E4

#### 开发步骤

1. **修改 `app/api/analytics/funnel/route.ts`**
   - GET 返回 30 天日/周聚合数据
   - Query params: `?range=7d|30d|90d`
   - Response 包含 `data[]` + `summary{}`
   - V1 方案：内存聚合，不改 schema

2. **创建 `lib/analytics/Aggregator.ts`**（新建）
   - `aggregateHistoricalData(projectId, range): AnalyticsFunnel[]`
   - 内存计算 + 趋势计算（与前一天差值）

3. **创建 `components/analytics/TrendChart.tsx`**（新建）
   - 纯 SVG 折线图（⚠️ 禁止引入 Recharts/Chart.js）
   - X 轴：时间（日期标签）
   - Y 轴：转化率（0-1）
   - 7d/30d/90d 切换按钮
   - 数据 < 3 条时显示空状态（不 crash）

4. **修改 `components/analytics/AnalyticsDashboard.tsx`**
   - 集成 TrendChart（漏斗图下方）
   - 导出 CSV 增加趋势数据列（date + conversionRate + trend）
   - CSV 编码：UTF-8 with BOM（Excel 兼容）

#### 验收门控

- [ ] `GET /api/analytics/funnel` 返回 30 天聚合数据
- [ ] TrendChart 纯 SVG 渲染（无外部 chart 库）
- [ ] 折线图支持 7d/30d/90d 切换
- [ ] 数据 < 3 条显示空状态，不 crash
- [ ] CSV 导出包含 date + conversionRate + trend 列
- [ ] `tsc --noEmit` 退出 0

---

### E07: Sprint 28 Specs 补全

**工期**: 2.5h | **优先级**: P2 | **依赖**: 无

#### 开发步骤

1. **创建 `specs/E03-ai-clarify.md`**
   - `/api/ai/clarify` 请求/响应完整 schema
   - 降级路径详细逻辑表格
   - 与 S28 IMPLEMENTATION_PLAN 对齐

2. **创建 `specs/E04-template-crud.md`**
   - CRUD API schema（POST/PUT/DELETE）
   - `/dashboard/templates` UI 布局
   - JSON 导入/导出格式

3. **创建 `specs/E06-error-boundary.md`**
   - DDSCanvasPage ErrorBoundary 包裹设计
   - Fallback UI 设计（"渲染失败" + "重试"按钮）
   - 边界条件表格

4. **创建 `specs/E07-mcp-server.md`**
   - GET `/api/mcp/health` 协议
   - MCP 集成测试用例（mcp-integration.spec.ts）
   - Claude Desktop 配置步骤

#### 验收门控

- [ ] `specs/E03-ai-clarify.md` 包含完整 API schema
- [ ] `specs/E04-template-crud.md` 包含 CRUD + UI 布局
- [ ] `specs/E06-error-boundary.md` 包含 Fallback 设计
- [ ] `specs/E07-mcp-server.md` 包含健康检查 + 测试用例
- [ ] 所有 4 个文件可读，无错误

---

## 3. File/Module Changes

### 新建文件

| 文件路径 | Epic | 说明 |
|---------|------|------|
| `hooks/useCanvasPrefill.ts` | E01 | 预填充 hook |
| `components/canvas/CanvasSkeleton.tsx` | E01 | 骨架屏组件 |
| `app/api/projects/[id]/share/notify/route.ts` | E02 | 通知 endpoint |
| `lib/notification/NotificationService.ts` | E02 | 通知服务 |
| `components/dashboard/ShareBadge.tsx` | E02 | 站内 badge |
| `tests/e2e/search.spec.ts` | E03 | 搜索 E2E |
| `lib/rbac/RBACService.ts` | E04 | 权限服务 |
| `app/api/projects/[id]/role/route.ts` | E04 | 权限变更 API |
| `lib/rbac/types.ts` | E04 | 权限类型定义 |
| `components/project/RBACGuard.tsx` | E04 | 权限隔离组件 |
| `public/sw.js` | E05 | Service Worker |
| `public/manifest.json` | E05 | PWA manifest |
| `components/canvas/OfflineBanner.tsx` | E05 | 离线 banner |
| `lib/analytics/Aggregator.ts` | E06 | 历史聚合器 |
| `components/analytics/TrendChart.tsx` | E06 | SVG 折线图 |
| `specs/E03-ai-clarify.md` | E07 | S28 spec 补全 |
| `specs/E04-template-crud.md` | E07 | S28 spec 补全 |
| `specs/E06-error-boundary.md` | E07 | S28 spec 补全 |
| `specs/E07-mcp-server.md` | E07 | S28 spec 补全 |

### 修改文件

| 文件路径 | Epic | 说明 |
|---------|------|------|
| `app/canvas/[id]/page.tsx` | E01 | 集成 useCanvasPrefill + skeleton |
| `components/onboarding/ClarifyStep.tsx` | E01 | AI 降级 { raw, parsed: null } |
| `hooks/useOnboarding.ts` | E01 | sessionStorage 持久化 |
| `components/canvas/share.ts` | E02 | 分享成功后触发通知 |
| `components/dashboard/SearchBar.tsx` | E03 | 添加 `<mark>` 高亮 |
| `components/project/ProjectCard.tsx` | E04 | 权限 badge |
| `components/canvas/DeleteButton.tsx` | E04 | 按权限 disabled/hidden |
| `next.config.js` | E05 | 启用 serviceWorker |
| `app/api/analytics/funnel/route.ts` | E06 | 返回历史聚合 |
| `components/analytics/AnalyticsDashboard.tsx` | E06 | 集成 TrendChart + CSV 增强 |

---

## 4. Test Coverage Plan

### 单元测试文件

| 测试文件 | 覆盖 Epic | 测试内容 |
|--------|---------|---------|
| `tests/unit/canvas-prefill.test.ts` | E01 | useCanvasPrefill, sessionStorage 持久化 |
| `tests/unit/notification.test.ts` | E02 | NotificationService, 去重, 降级 |
| `tests/unit/rbac.test.ts` | E04 | RBACService, 权限矩阵 |
| `tests/unit/service-worker.test.ts` | E05 | SW 注册, 离线缓存 |
| `tests/unit/analytics-funnel.test.ts` | E06 | 历史聚合 API, TrendChart |
| `tests/unit/trend-chart.test.ts` | E06 | SVG 折线图渲染, 空状态 |

### E2E 测试文件

| 测试文件 | 覆盖 Epic | 测试场景 |
|---------|---------|---------|
| `tests/e2e/onboarding-canvas.spec.ts` | E01 | Onboarding→Canvas 跳转 + skeleton |
| `tests/e2e/share-notify.spec.ts` | E02 | 分享→Slack DM→Badge |
| `tests/e2e/search.spec.ts` | E03 | 搜索过滤 + 高亮 + 空结果 |
| `tests/e2e/rbac-permissions.spec.ts` | E04 | viewer disabled, 403 拦截 |
| `tests/e2e/offline-canvas.spec.ts` | E05 | 离线加载 + banner + PWA |
| `tests/e2e/analytics-trend.spec.ts` | E06 | 趋势折线图 + CSV 导出 |

### 覆盖率目标

| 层级 | 目标 | 优先级 |
|-----|-----|--------|
| API Routes | 90% | 高 |
| Hooks | 85% | 高 |
| Service Worker | 覆盖 | 中 |
| 组件渲染 | 80% | 中 |

---

## 5. Risk Mitigation

| ID | Epic | 风险 | 影响 | 概率 | 缓解措施 |
|----|------|-----|------|------|---------|
| R1 | E01 | S28 E03 AI 未完成，E01 无依赖数据 | 高 | 中 | 独立实现降级 fallback，parsed: null 仍能填充 |
| R2 | E02 | Slack Bot token 无写入权限 | 中 | 低 | 先验证 token，权限不足降级站内通知 |
| R3 | E03 | 搜索 API 后端未接入 | 中 | 低 | 前端过滤已就绪，后端接入作为增量 Tech Debt |
| R4 | E04 | RBAC 改动面大，引入回归 | 中 | 中 | viewer disabled 优先于 hidden，充分 E2E 覆盖 |
| R5 | E06 | 历史数据 schema 需迁移 | 中 | 中 | V1 内存聚合，不改 schema |
| R6 | E05 | Service Worker 调试困难 | 中 | 中 | Workbox 提供日志，DevTools 验证缓存 |

---

## 6. 检查清单

### Sprint Overview
- [ ] Week 1/2 日历表与 PRD 一致
- [ ] 工期总和 22h，可加总验证
- [ ] 优先级 P0→P1→P2 排序正确

### Epic 步骤
- [ ] E01: 5 个开发步骤 + 6 项验收门控
- [ ] E02: 4 个开发步骤 + 6 项验收门控
- [ ] E03: 4 个开发步骤 + 4 项验收门控
- [ ] E04: 6 个开发步骤 + 6 项验收门控
- [ ] E05: 5 个开发步骤 + 5 项验收门控
- [ ] E06: 4 个开发步骤 + 6 项验收门控
- [ ] E07: 4 个开发步骤 + 4 项验收门控

### 文件改动
- [ ] 新建 19 个文件清单完整
- [ ] 修改 10 个文件清单完整

### 测试
- [ ] 6 个单元测试文件清单
- [ ] 6 个 E2E 测试文件清单
- [ ] 覆盖率目标明确

### 风险
- [ ] 6 条风险缓解措施完整
- [ ] 每条风险有触发条件 + 负责人

### 格式
- [ ] 简体中文
- [ ] 可直接作为开发 checklist
- [ ] 包含 `## 执行决策` 段落

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint29
- **执行日期**: 2026-05-07

---

## Epic 实现状态

### E01: Onboarding → Canvas 无断点 ✅

| 步骤 | 文件 | 状态 |
|------|------|------|
| useCanvasPrefill hook | `hooks/useCanvasPrefill.ts` | ✅ 已创建 |
| CanvasSkeleton 集成 | `components/canvas/CanvasPageSkeleton.tsx` | ✅ 已有，复用 |
| 动态画布路由 | `app/canvas/[id]/page.tsx` | ✅ 已创建 |
| AI 降级格式 | `components/onboarding/steps/PreviewStep.tsx` | ✅ 已修改 |
| sessionStorage 持久化 | `hooks/useOnboarding.ts` | ✅ 已修改 |

**Commit**: `3b78219c6` | **验证**: `tsc --noEmit` 退出 0

---

*文档版本: 1.0*
*创建时间: 2026-05-07*
*作者: Architect Agent*
