# VibeX 产品体验增强 — 实施计划

**项目**: vibex-analyst-proposals-20260403_024652
**版本**: v1.0
**日期**: 2026-04-03

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-analyst-proposals-20260403_024652
- **执行日期**: 2026-04-03

---

## 1. Sprint 规划总览

| Sprint | Epics | 总工时 | 目标 |
|--------|-------|--------|------|
| Sprint 1 | E1 (Phase感知) + E3 (Feedback) | 7h | 画布 UX 增强 + 反馈闭环 |
| Sprint 2 | E2 前半 (S2.1+S2.3) | 5h | 分享链接 + 快照保存 |
| Sprint 3 | E2 后半 (S2.2+S2.4) | 5h | 协作者管理 + 版本对比 |
| Sprint 4 | E4 (Analytics) + E5 (Quality) | 10h | 数据基础设施 + 质量可视化 |
| Sprint 0 | DDL 迁移 + Schema 创建 | 2h | 数据库基础设施 |

**总工时**: 29h（不含 Sprint 0 DDL 迁移）

---

## 2. Sprint 0: 数据库基础设施 (2h)

### 目标
创建所有新表 + 索引，为 Sprint 1-4 提供存储基础。

### 任务

```
T0.1: 创建 DDL 迁移脚本
  - 新增表: share_tokens, collaborators, snapshots, feedback, analytics_events, quality_metrics, quality_alerts
  - 新增索引
  - 文件: vibex-backend/src/migrations/001_new_tables.sql

T0.2: 执行迁移（本地 + Staging 验证）
  - wrangler d1 migrations apply vibex-backend --env staging
  - 验证表创建成功

T0.3: D1 Schema 文档更新
  - 更新 api-contract.yaml 新增端点
```

### 验收标准
- [ ] `SELECT * FROM share_tokens` 返回空表（表存在）
- [ ] `SELECT * FROM feedback` 返回空表（表存在）
- [ ] `SELECT * FROM quality_metrics` 返回空表（表存在）
- [ ] api-contract.yaml 包含所有新端点定义

### 依赖
- 无

---

## 3. Sprint 1: E1 + E3 (7h)

### 3.1 Epic 1: Phase 状态感知层 (3h)

#### 任务序列

```
E1.1: PhaseIndicator 组件开发 (1h)
  文件: components/canvas/PhaseIndicator.tsx
  组件: 三段式 ●○○ 指示器 + 当前阶段文案
  状态: 订阅 canvasStore.phase
  验证: Jest + Playwright

E1.2: GuideCard 组件开发 (1h)
  文件: components/canvas/GuideCard.tsx
  组件: 首次访问引导卡片，支持关闭
  状态: localStorage 'seenGuide' 控制显示
  验证: Playwright (首次访问/非首次访问)

E1.3: 示例项目数据 (0.5h)
  文件: lib/canvas/exampleData.ts
  内容: 完整三树结构示例（电商场景）
  验证: loadExampleData() 后节点数 >= 3

E1.4: ExampleLoader 集成 (0.5h)
  文件: CanvasPage.tsx 集成 GuideCard
  按钮: GuideCard 内的「查看示例」触发 loadExampleData
  验证: Playwright E2E
```

#### 验收标准
- [ ] `expect(PhaseIndicator).toBeVisible()` 在 CanvasPage 顶部
- [ ] 首次访问 GuideCard 可见，关闭后刷新不再显示
- [ ] 示例项目加载后 `contextNodes.length >= 3`
- [ ] TabBar 切换 Phase 时指示器状态同步更新

#### 依赖
- Sprint 0 (E1 无数据库依赖)

---

### 3.2 Epic 3: Feedback 收集 (4h)

#### 任务序列

```
E3.1: Feedback FAB 按钮 (0.5h)
  文件: components/canvas/feedback/FeedbackFAB.tsx
  定位: 右下角 fixed，z-index 最高
  验证: `expect(fabButton).toBeVisible()`

E3.2: FeedbackDialog + 表单验证 (1.5h)
  文件: components/canvas/feedback/FeedbackDialog.tsx
  字段: type(必填) + description(必填，1-500字) + screenshot(可选)
  验证: 必填项未填时按钮禁用，填完后提交

E3.3: /api/feedback POST 端点 (1h)
  文件: routes/feedback.ts
  逻辑: 验证 → 写入 D1 → 触发 GitHub Issue (Bug) → Slack Webhook
  验证: Jest unit + E2E

E3.4: Screenshot 压缩上传 (0.5h)
  文件: lib/feedback/screenshot.ts
  工具: canvas.toBlob() → 压缩 → 转为 File
  限制: 最大 5MB，超过则提示用户
  验证: 大文件自动提示

E3.5: GitHub Issue 创建集成 (0.5h)
  文件: services/githubIssue.ts
  触发: feedback.type === 'bug'
  标签: feedback, bug
  验证: E2E (mock GitHub API)
```

#### 验收标准
- [ ] FAB 按钮在 Canvas 任意位置可见
- [ ] 提交 Bug 反馈后 GitHub Issue 创建成功（带 label）
- [ ] 提交后 #pm-channel 收到 Slack 通知（< 5s）
- [ ] feedback 表有对应记录

#### 依赖
- Sprint 0 (feedback 表)

---

## 4. Sprint 2: E2 前半 (5h)

### 4.1 Epic 2 Part 1: 分享链接 + 快照 (5h)

#### 任务序列

```
E2.1: /api/share POST 端点 (1h)
  文件: routes/share.ts
  逻辑: 生成 UUID token → 写入 share_tokens → 返回 URL
  验证: POST 返回 200 + token 格式正确

E2.2: /api/share/[token] GET 端点 (1h)
  文件: routes/share.$token.ts
  逻辑: 查询 token → 验证未过期 → 返回项目数据
  验证: 有效 token 返回数据，无效/过期返回 403

E2.3: ShareButton 组件 (0.5h)
  文件: components/canvas/share/ShareButton.tsx
  位置: ProjectBar 区域
  验证: 点击生成链接并复制到剪贴板

E2.4: /api/snapshots POST/GET 端点 (1.5h)
  文件: routes/snapshots.ts + routes/snapshots.$id.ts
  逻辑: 保存完整三树 JSON / 查询快照列表
  验证: POST 创建成功，GET 返回列表

E2.5: SnapshotPanel 组件 (1h)
  文件: components/canvas/snapshot/SnapshotPanel.tsx
  功能: 快照列表 + 预览 + 创建快照
  验证: 快照创建成功后可预览
```

#### 验收标准
- [ ] 分享链接在无账号状态下可访问项目数据
- [ ] 快照保存后可在列表中找到并预览内容
- [ ] SnapshotPanel 与 CanvasPage 集成正常

#### 依赖
- Sprint 0 (share_tokens 表 + snapshots 表)

---

## 5. Sprint 3: E2 后半 (5h)

### 5.1 Epic 2 Part 2: 协作者 + 版本对比 (5h)

#### 任务序列

```
E2.6: /api/collaborators 端点 (2h)
  文件: routes/collaborators.ts
  端点: POST /invite, POST /accept, GET, DELETE
  验证: 邀请 → 接受 → 协作者出现在项目

E2.7: CollaboratorPanel 组件 (1h)
  文件: components/project-settings/CollaboratorPanel.tsx
  位置: ProjectSettings 页面
  验证: 添加/移除协作者生效

E2.8: Snapshot Diff API (1h)
  文件: routes/snapshots/diff.ts
  逻辑: 获取两个快照 → JSON diff → 返回 added/removed/modified
  验证: 返回正确的 diff 结构

E2.9: DiffViewer 组件 (1h)
  文件: components/canvas/snapshot/DiffViewer.tsx
  功能: side-by-side diff，高亮绿/红/黄
  验证: 新增绿色、删除红色、修改黄色
```

#### 验收标准
- [ ] 协作者可通过邮箱邀请并接受
- [ ] DiffViewer 正确高亮新增/删除/修改节点
- [ ] viewer 角色无法编辑项目

#### 依赖
- Sprint 0 (collaborators 表)
- Sprint 2 (E2.4 SnapshotPanel)

---

## 6. Sprint 4: E4 + E5 (10h)

### 6.1 Epic 4: Analytics 指标体系 (6h)

#### 任务序列

```
E4.1: TrackSDK 开发 (1h)
  文件: lib/analytics/track.ts
  接口: trackEvent(eventName, data)
  特性: debounce 5s 批量上报，失败重试
  验证: Jest unit

E4.2: /api/analytics/track 端点 (0.5h)
  文件: routes/analytics-track.ts
  验证: 事件写入 analytics_events 表

E4.3: Analytics Dashboard 页面 (3h)
  文件: app/analytics/page.tsx
  图表: 项目完成率漏斗 + Phase 分布 + 节点数分布
  组件: Recharts LineChart + BarChart
  验证: 页面加载 < 2s

E4.4: /api/analytics/summary 聚合端点 (1.5h)
  文件: routes/analytics-summary.ts
  查询: D1 COUNT/GROUP BY
  缓存: 1h TTL (in-memory)
  验证: Jest + D1 直接查询验证
```

#### 验收标准
- [ ] `/analytics` 页面可访问，仅 PM 角色
- [ ] 显示最近 7 天项目完成率
- [ ] 图表加载 < 2s
- [ ] 无个人用户追踪数据

#### 依赖
- Sprint 0 (analytics_events 表)

---

### 6.2 Epic 5: 质量仪表盘 (4h)

#### 任务序列

```
E5.1: CI 数据拉取脚本 (1.5h)
  文件: scripts/sync-quality-metrics.ts (独立脚本)
  触发: GitHub Actions workflow_dispatch 或定时
  逻辑: GitHub API → 解析 test results → 写入 quality_metrics
  验证: 脚本执行后 quality_metrics 有新记录

E5.2: /api/quality/trend 端点 (0.5h)
  文件: routes/quality-trend.ts
  查询: 最近 N 次构建数据
  验证: 返回正确格式的 trend 数据

E5.3: Quality 页面 + 趋势图 (1.5h)
  文件: app/quality/page.tsx
  图表: E2E 通过率折线图 + TS 错误数
  验证: 图表加载 < 1s，hover 显示数值

E5.4: 质量报警逻辑 (0.5h)
  文件: routes/quality/sync.ts (集成在 E5.1)
  逻辑: 通过率 < 90% → 查询 quality_alerts 去重 → 发送 Slack
  验证: 通过率 85% 时 #coord 收到告警
```

#### 验收标准
- [ ] `/quality` 页面显示最近 10 次构建趋势
- [ ] E2E 通过率 < 90% 时触发 Slack 报警
- [ ] 报警重复间隔 >= 24h（去重生效）
- [ ] 趋势图 hover 显示具体数值

#### 依赖
- Sprint 0 (quality_metrics 表 + quality_alerts 表)
- GitHub API token 配置

---

## 7. 测试策略

### 7.1 测试覆盖要求

| Epic | 单元测试 | 集成测试 | E2E |
|------|---------|---------|-----|
| E1 | PhaseIndicator render | — | GuideCard 首次/非首次 |
| E2 | Share token 生成 | Snapshot CRUD | 分享链接无账号访问 |
| E3 | Feedback 表单验证 | /feedback POST | FAB + Dialog + Slack |
| E4 | TrackSDK debounce | /analytics/summary | Analytics Dashboard |
| E5 | 报警去重逻辑 | /quality/trend | Quality 页面 + 报警 |

**覆盖率目标**: 核心逻辑 > 80%，UI 组件 Jest snapshots。

### 7.2 回归测试

所有 Sprint 结束后执行：
```bash
# Canvas 核心流程
npx playwright test journey-create-context.spec.ts
npx playwright test journey-generate-flow.spec.ts

# 新功能 E2E
npx playwright test feedback-fab.spec.ts
npx playwright test share-link.spec.ts
npx playwright test analytics-page.spec.ts
npx playwright test quality-page.spec.ts
```

---

## 8. 部署计划

### 阶段一：Sprint 0-1 (不破坏现有功能)
- 数据库迁移（向后兼容）
- E1 + E3 作为 Feature Flag，默认开启

### 阶段二：Sprint 2-3
- E2 Feature Flag，默认关闭
- 分享链接公开前需 PM 确认

### 阶段三：Sprint 4
- E4 + E5 Feature Flag，默认关闭
- Analytics/Quality 页面仅 PM 可见（权限控制）

### Feature Flag 实现
```typescript
// lib/featureFlags.ts
export const flags = {
  epic1_phaseIndicator: () => true,   // E1 已上线
  epic2_sharing: () => process.env.NEXT_PUBLIC_FLAG_E2 === 'on',
  epic3_feedback: () => process.env.NEXT_PUBLIC_FLAG_E3 === 'on',
  epic4_analytics: () => process.env.NEXT_PUBLIC_FLAG_E4 === 'on',
  epic5_quality: () => process.env.NEXT_PUBLIC_FLAG_E5 === 'on',
};
```

---

## 9. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| DDL 迁移失败阻塞现有功能 | 低 | 高 | 先在 staging 验证，回滚脚本就绪 |
| GitHub API rate limit | 中 | 低 | 轮询间隔 1h，每小时 1 次请求 |
| Slack Webhook 失败不阻塞反馈提交 | 高 | 低 | 异步发送，失败写入 error log |
| Analytics 查询性能（D1 聚合） | 中 | 中 | 添加索引，限制 days 参数 |
| Screenshot 上传大文件 | 中 | 低 | 前端压缩 + 后端 5MB 限制 |
