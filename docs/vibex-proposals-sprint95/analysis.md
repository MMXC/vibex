# Sprint95 Analysis — Canvas Analytics & Public Sharing

**Project**: vibex-proposals-sprint95
**Sprint**: S95
**Date**: 2026-06-13
**Analyst**: coord (self-impl, all Phase1 agents stale)

---

## 1. 背景与上下文

S94 已完成 4 个 Epic：
- **S94-E1 Canvas AI Insights**: 健康评分 + 优化建议面板（HealthScorePanel + OptimizationPanel）
- **S94-E2 Advanced Canvas Sharing**: 角色选择（viewer/editor）+ 过期时间 + 密码保护 + 嵌入代码 + Webhooks
- **S94-E3 Canvas Audit Log**: 审计日志面板 + 设置标签 + D1 schema + API routes
- **S94-E4 Canvas Export as Code**: 4格式导出（React/SVG/MD/JSON）

## 2. 已有基础设施盘点

### 2.1 审计日志（S94-E3）
- D1 表：`audit_logs`（id/canvas_id/user_id/action/resource_type/resource_id/metadata/created_at）
- API: `GET /api/canvas/[id]/audit-logs`（支持 `?action=&start=&end=&limit=`）
- 前端：`AuditLogPanel.tsx`（按时间倒序展示日志列表）+ `AuditLogSettingsSection.tsx`
- Store: `auditLogStore.ts`

### 2.2 AI Insights（S94-E1）
- D1 表：`canvas_health`（canvas_id/health_score/insights_json/last_analyzed_at）
- API: `GET /api/canvas/[id]/health` + `POST /api/canvas/[id]/health/refresh`
- 前端：`HealthScorePanel.tsx`（健康分环形图）+ `OptimizationPanel.tsx`（优化建议列表）
- Store: `canvasHealthStore.ts`

### 2.3 高级分享（S94-E2）
- D1 表：`canvas_permissions`（扩展）
- API: `GET/POST/PATCH /api/canvas/[id]/permissions`（含 share_token/expiration/password）
- Webhook 通知: `POST` to user-configured URLs on permission changes
- 前端：分享面板增强（SharePanel.tsx）

### 2.4 导出（S94-E4）
- API: `POST /api/canvas/[id]/export`（支持 react/svg/markdown/json）
- 前端：`ExportControls.tsx` + `BatchExportPanel.tsx`

## 3. 识别到的缺口

### 3.1 缺口1: Canvas Analytics Dashboard（视觉化分析）

**现状**: S94-E3 审计日志只能展示原始日志列表，S94-E1 AI Insights 只显示当前健康分。两者都没有趋势分析或可视化图表。

**问题**:
- 用户无法看到画布使用趋势（访问量、编辑频率、参与人数随时间变化）
- 无法对比多个画布的活跃度
- 审计日志数据有结构但没有BI能力

**影响用户**: 所有画布创建者和团队管理员

**技术方案**:
1. **D1 聚合查询**: 利用现有 `audit_logs` 表，按 `created_at` 分组统计 `action` 分布
2. **新增 API**: `GET /api/canvas/[id]/analytics` — 返回 7d/30d/90d 统计数据
3. **前端面板**: `AnalyticsDashboard.tsx` — 折线图（访问趋势）+ 柱状图（action分布）+ 饼图（参与者占比）
4. **关键指标**: 访问次数、编辑次数、活跃协作者数、分享次数、导出次数

**验收标准**:
- [ ] API `GET /api/canvas/[id]/analytics?range=7d|30d|90d` 返回 JSON，含 `views/today`, `views/week`, `views/month`, `editCount`, `uniqueUsers`, `shareCount`, `exportCount`
- [ ] 前端 `AnalyticsDashboard.tsx` 在 canvas settings 页签下显示，默认显示 7 天数据
- [ ] 折线图显示每日访问量趋势（7天视图）
- [ ] 柱状图显示 action 分布（create/update/delete/share/export）
- [ ] Vitest 覆盖 API + Store + Component

**实现方案**: 见 prd.md E1

---

### 3.2 缺口2: Public Canvas Portal（公开画布）

**现状**: S94-E2 提供了高级分享（角色选择、过期、密码），但只能在登录用户之间分享。没有公开分享的机制。

**问题**:
- 用户无法将画布发布为公开链接（如 Figma 的 public share）
- 模板无法从"已发布的画布"创建
- 没有公开画布发现/浏览页面

**影响用户**: 需要对外展示画布成果的用户（如作品集、教学材料、公开文档）

**技术方案**:
1. **D1 schema**: `canvas_permissions` 扩展 `is_public` + `public_slug` 字段
2. **新增 API**:
   - `PATCH /api/canvas/[id]/visibility` — 设置公开/私有，生成 slug
   - `GET /api/public/canvas/[slug]` — 公开访问（无需登录）
   - `GET /api/canvas/public` — 公开画布发现列表（支持 page/sort）
3. **前端组件**:
   - `PublicVisibilitySection.tsx` — 设置面板中的公开开关 + slug 配置
   - `PublicCanvasPage.tsx` — `/public/[slug]` 路由，只读展示页面
   - `PublicGallerySection.tsx` — 公开画布发现页面

**验收标准**:
- [ ] 画布主人可将画布设为"公开"，生成唯一 slug
- [ ] 公开画布可通过 `/public/[slug]` 无需登录访问（只读）
- [ ] 公开画布列表页 `/canvas/public` 展示分页画布卡片
- [ ] 公开页面保持只读，不显示工具栏编辑按钮
- [ ] Jest 覆盖 API routes + Vitest 覆盖组件

**实现方案**: 见 prd.md E2

---

### 3.3 缺口3: Collaboration Presence Improvements（实时协作体验）

**现状**: 已有 WebSocket presence（用户头像 + 光标位置），但协作体验仍有改进空间。

**问题**:
- 无法知道谁正在编辑特定节点
- 无法通过 @mention 发起实时协作邀请
- 没有协作者编辑锁（多人同时编辑同一节点时的冲突提示）

**影响用户**: 多协作者同时编辑画布的场景

**技术方案**:
1. **节点编辑锁 API**: `POST /api/canvas/[id]/nodes/[nodeId]/lock` — 声明编辑锁（TTL 60s）
2. **前端增强**:
   - `CollaboratorEditorBadge.tsx` — 节点上显示正在编辑的用户头像
   - `LockIndicator.tsx` — 节点被锁定时显示锁图标 + 用户名
3. **乐观 UI**: 锁获取成功 → 显示"正在编辑 [用户名]"；锁失败 → 显示"该节点正被 [用户名] 编辑"

**验收标准**:
- [ ] `POST /api/canvas/[id]/nodes/[nodeId]/lock` 返回 `{ acquired: bool, locked_by: userId }`
- [ ] 前端在节点上显示正在编辑的用户头像（超过 5s 无心跳自动消失）
- [ ] 被锁节点无法直接编辑，悬停显示锁定者信息
- [ ] Vitest 覆盖 lock store + component

**实现方案**: 见 prd.md E3

---

### 3.4 缺口4: Canvas Export Templates（模板化导出）

**现状**: S94-E4 导出支持 React/SVG/MD/JSON 格式，但导出配置（模板）无法保存和复用。

**问题**:
- 用户每次导出都要重新配置（缩放、主题、节点筛选）
- 无法保存"移动端视图"或"演示模式"等预设
- 无法团队共享导出模板

**影响用户**: 需要频繁以特定格式导出的用户

**技术方案**:
1. **D1 schema**: `canvas_export_profiles`（id/canvas_id/name/config_json/created_by/created_at）
2. **API**:
   - `GET /api/canvas/[id]/export-profiles` — 列表
   - `POST /api/canvas/[id]/export-profiles` — 创建
   - `DELETE /api/canvas/[id]/export-profiles/[profileId]` — 删除
3. **Store**: `exportProfileStore.ts` — 管理模板 CRUD
4. **前端**: `ExportProfilePanel.tsx` — 模板管理面板 + 快速应用

**验收标准**:
- [ ] 用户可创建命名导出模板（含 format/scale/include 参数）
- [ ] 导出菜单中可直接选择保存的模板一键导出
- [ ] 模板可在画布内复用
- [ ] Jest 覆盖 API + Vitest 覆盖 Store + Component

**实现方案**: 见 prd.md E4

---

## 4. 技术风险评估

| 风险 | 等级 | 缓解 |
|------|------|------|
| D1 聚合查询性能（审计日志表大） | 中 | 限制时间范围，默认 7d；添加索引 |
| 公开页面 SEO 优化 | 低 | 先做功能，SEO 后续迭代 |
| WebSocket 编辑锁一致性 | 中 | TTL 60s + 心跳续期 + 乐观 UI |
| 导出模板与现有导出流程的集成 | 低 | 扩展现有 ExportMenu，不改核心逻辑 |

## 5. 需求优先级排序

| ID | 需求 | 优先级 | 原因 |
|----|------|--------|------|
| P001 | Canvas Analytics Dashboard | P0 | 直接利用 S94 审计日志数据，价值明显 |
| P002 | Public Canvas Portal | P1 | 差异化能力，扩大用户群 |
| P003 | Collaboration Node Locking | P1 | 提升协作体验，减少冲突 |
| P004 | Export Profile Templates | P2 | 便利性功能，不影响核心导出 |

## 6. 结论

S95 聚焦 **Canvas Analytics & Public Sharing**：
- **E1**: Canvas Analytics Dashboard（利用 S94-E3 审计日志 + S94-E1 AI Insights 数据）
- **E2**: Public Canvas Portal（扩展 S94-E2 分享能力）
- **E3**: Node Edit Locking（增强实时协作）
- **E4**: Export Profile Templates（扩展 S94-E4 导出能力）

所有 Epic 均在 S94 基础设施之上扩展，技术风险可控。
