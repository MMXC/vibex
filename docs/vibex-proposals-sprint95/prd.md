# Sprint95 PRD — Canvas Analytics & Public Sharing

**Project**: vibex-proposals-sprint95
**Sprint**: S95
**Date**: 2026-06-13
**Phase1 self-impl by coord**

---

### Epic 1: Canvas Analytics Dashboard

**Feature ID**: P001
**Type**: Frontend + Backend
**Description**: 为画布提供视觉化数据分析面板，利用 S94-E3 审计日志和 S94-E1 AI Insights 数据，展示访问趋势、编辑活跃度、参与者分布等关键指标。

### 1.1 功能范围

- 新增 `GET /api/canvas/[id]/analytics` API（支持 `?range=7d|30d|90d`）
- 新增 `AnalyticsDashboard.tsx` 组件（置于 canvas settings 页签下）
- 新增 `analyticsStore.ts` Zustand store
- 图表：折线图（访问趋势）+ 柱状图（action 分布）
- 支持导出分析报告为 CSV

### 1.2 用户故事

**US-E1-1**: 作为画布所有者，我希望能在一张仪表板上看到过去 7/30/90 天的访问量趋势，以便了解画布的使用情况。

**US-E1-2**: 作为画布所有者，我希望能看到参与画布编辑的用户分布，以便了解团队协作情况。

**US-E1-3**: 作为画布所有者，我希望能把分析报告导出为 CSV，以便在外部工具中进一步分析。

### 1.3 验收标准（DoD）

- [ ] `GET /api/canvas/[id]/analytics?range=7d` 返回 `{ views: { today, week, month }, editCount, uniqueUsers, shareCount, exportCount, dailyTrend: [{ date, views, edits }] }`
- [ ] D1 添加 `audit_logs.action_index` 复合索引（canvas_id + created_at）优化查询性能
- [ ] `AnalyticsDashboard.tsx` 在 canvas settings 页签显示，图表使用 CSS Modules 样式
- [ ] 折线图显示每日访问量（7天视图），使用 `<svg>` 绑定（不使用第三方图表库）
- [ ] `AnalyticsDashboard.test.tsx` 覆盖主要交互（range 切换、empty state）
- [ ] `analyticsStore.test.ts` 覆盖 store 方法

### 1.4 页面集成

- 集成到 `DDSCanvasPage.tsx` → settings 页签 → `<AnalyticsDashboard />`
- 路由不变

### 1.5 技术约束

- 后端使用 D1 聚合查询，`GROUP BY date(created_at)` 统计
- 前端图表使用原生 SVG，不引入 chart 库
- API 认证同现有 canvas 路由（需登录）

---

### Epic 2: Public Canvas Portal

**Feature ID**: P002
**Type**: Frontend + Backend
**Description**: 允许用户将画布发布为公开链接，无需登录即可查看只读版本。提供公开画布发现页面。

### 2.1 功能范围

- `PATCH /api/canvas/[id]/visibility` — 设置 `is_public` + 生成 `public_slug`
- `GET /api/public/canvas/[slug]` — 无需认证访问公开画布（返回画布数据）
- `GET /api/canvas/public` — 公开画布列表（分页，支持 sort）
- 前端：公开开关 + slug 配置 + `/public/[slug]` 页面 + 公开画布发现页

### 2.2 用户故事

**US-E2-1**: 作为画布所有者，我希望能把我的画布发布为公开链接，以便分享给任何人查看。

**US-E2-2**: 作为访客，我希望能在不登录的情况下查看公开画布，以便快速了解内容。

**US-E2-3**: 作为用户，我希望能在公开画布库中发现其他人的优秀画布，以便获得灵感。

### 2.3 验收标准（DoD）

- [ ] `PATCH /api/canvas/[id]/visibility` 请求体 `{ is_public: boolean, slug?: string }` → 返回 `{ slug, public_url }`
- [ ] `GET /api/public/canvas/[slug]` 无需认证，返回 `{ canvas: { id, name, nodes, edges, owner }, is_public: true }`
- [ ] 公开页面 `/public/[slug]` 渲染只读画布，无工具栏编辑按钮
- [ ] 公开画布发现页 `/canvas/public` 展示分页卡片列表（名称、创建者、预览缩略图）
- [ ] D1: `canvas_permissions` 添加 `is_public BOOLEAN DEFAULT 0` + `public_slug TEXT UNIQUE`
- [ ] `route.test.ts` 覆盖 visibility API + public access API（各 7 个 Jest 测试）
- [ ] `PublicCanvasPage.test.tsx` 覆盖只读渲染 + 404 场景

### 2.4 页面集成

- `DDSCanvasPage.tsx` → settings 页签 → 添加 `PublicVisibilitySection` 组件
- 新增路由 `src/app/canvas/public/page.tsx`（公开画布发现页）
- 新增路由 `src/app/public/[slug]/page.tsx`（公开画布只读页）

### 2.5 技术约束

- 公开页面只读，不暴露任何 mutation API
- slug 唯一性校验（已存在 slug 冲突返回 409）
- 公开画布列表仅展示已标记 `is_public` 的画布

---

### Epic 3: Node Edit Locking

**Feature ID**: P003
**Type**: Frontend + Backend
**Description**: 协作者在编辑特定节点时声明编辑锁，防止多人同时修改同一节点产生冲突。

### 3.1 功能范围

- `POST /api/canvas/[id]/nodes/[nodeId]/lock` — 获取节点编辑锁（TTL 60s）
- `DELETE /api/canvas/[id]/nodes/[nodeId]/lock` — 释放锁
- 前端：`CollaboratorEditorBadge.tsx`（节点上显示锁定者）+ `LockIndicator.tsx`（锁定图标）

### 3.2 用户故事

**US-E3-1**: 作为协作者，我希望在编辑节点时能声明编辑锁，以便其他用户知道我正在编辑。

**US-E3-2**: 作为协作者，我希望在尝试编辑被锁定的节点时看到提示，以便知道谁正在编辑。

### 3.3 验收标准（DoD）

- [ ] `POST /api/canvas/[id]/nodes/[nodeId]/lock` 返回 `{ acquired: true, locked_by: userId, expires_at: timestamp }`
- [ ] 若节点已被他人锁定（TTL 未到期），返回 `{ acquired: false, locked_by: userId, expires_at: timestamp }`
- [ ] 锁自动过期（TTL 60s），无心跳续期
- [ ] `CollaboratorEditorBadge.tsx` 在节点上显示锁定者头像（超过 TTL 自动消失）
- [ ] 被锁节点悬停显示"该节点正被 [用户名] 编辑"提示
- [ ] `nodeLockStore.test.ts` 覆盖 lock/unlock/store 方法（Vitest）
- [ ] `CollaboratorEditorBadge.test.tsx` 覆盖显示/隐藏逻辑（Vitest）

### 3.4 页面集成

- `DDSCanvasPage.tsx` 中节点渲染区域集成 `CollaboratorEditorBadge`
- Lock 状态通过现有 WebSocket presence channel 广播（复用 `user_x/user_y` 广播机制）

### 3.5 技术约束

- 使用 Redis-style TTL 或 D1 行级 TTL（`expires_at` 字段）
- 无需新增 D1 表，锁状态存于现有 presence WebSocket 消息中

---

### Epic 4: Export Profile Templates

**Feature ID**: P004
**Type**: Frontend + Backend
**Description**: 允许用户保存和复用导出配置（格式、缩放、节点筛选），提升导出效率。

### 4.1 功能范围

- `GET/POST/DELETE /api/canvas/[id]/export-profiles` API
- `exportProfileStore.ts` Zustand store
- `ExportProfilePanel.tsx` 模板管理面板（创建/删除/选择模板）
- 导出菜单中增加"使用模板"选项

### 4.2 用户故事

**US-E4-1**: 作为用户，我希望能把常用的导出配置保存为模板，以便一键导出。

**US-E4-2**: 作为用户，我希望能在导出菜单中快速选择已保存的模板。

### 4.3 验收标准（DoD）

- [ ] `POST /api/canvas/[id]/export-profiles` 请求体 `{ name, format, scale, includeNodes?, includeEdges? }` → 返回 `{ id, name, ... }`
- [ ] `GET /api/canvas/[id]/export-profiles` 返回当前画布所有模板列表
- [ ] `DELETE /api/canvas/[id]/export-profiles/[profileId]` 删除模板
- [ ] `ExportProfilePanel.tsx` 支持创建/命名/删除模板
- [ ] `ExportMenu.tsx` 中增加"从模板导出"选项（下拉选择已保存模板）
- [ ] D1: `canvas_export_profiles` 表（id/canvas_id/name/format/scale/include_nodes/include_edges/created_by/created_at）
- [ ] `route.test.ts` 覆盖 CRUD（7 个 Jest 测试）
- [ ] `exportProfileStore.test.ts` 覆盖 store 方法（Vitest）

### 4.4 页面集成

- `DDSCanvasPage.tsx` → settings 页签 → `<ExportProfilePanel />`
- `ExportMenu.tsx` → 下拉菜单增加"模板"子菜单项

### 4.5 技术约束

- 模板仅限画布所有者使用（无需权限系统）
- 模板配置继承现有导出逻辑，仅保存配置不改变导出行为

---

## 全局验收条件

- 所有 API routes 需通过 TypeScript 类型检查
- 所有 Vitest/Jest 测试需通过（`pnpm test` + `pnpm exec vitest run`）
- 样式使用 CSS Modules，符合 `DESIGN.md` 规范
- 不引入新的外部依赖库
