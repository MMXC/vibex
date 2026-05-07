# E01: Onboarding → Canvas 无断点 — 详细规格

## 1. 范围

- S01.1: Canvas 预填充骨架屏
- S01.2: AI 降级 fallback 适配
- S01.3: sessionStorage Onboarding 持久化

## 2. S01.1: Canvas 预填充骨架屏

### 2.1 localStorage 键
```ts
const PENDING_TEMPLATE_REQ_KEY = 'vibex_pending_template_req'
```

### 2.2 app/canvas/[id]/page.tsx 修改点
```tsx
// 在 page.tsx render 前检查 localStorage
const pendingData = localStorage.getItem(PENDING_TEMPLATE_REQ_KEY)
const skeletonData = pendingData ? JSON.parse(pendingData) : null

return (
  <div className="canvas-page">
    {skeletonData ? (
      <CanvasSkeleton data={skeletonData} onReady={() => loadRealData()} />
    ) : (
      <NormalCanvas projectId={id} />
    )}
  </div>
)
```

### 2.3 验收标准
```ts
expect(Canvas page shows skeleton within 100ms of navigation)
expect(no white screen during data load)
expect(skeleton replaced by real content within 500ms)
```

## 3. S01.2: AI 降级 fallback

### 3.1 数据格式修正
```ts
// 正常情况
{ raw: "...", parsed: { featureName: "...", scenarios: [...] } }
// 降级情况
{ raw: "...", parsed: null, fallback: true }
```

### 3.2 Canvas 读取逻辑
```ts
const templateData = skeletonData
// 无论 parsed 是否为 null，只要 raw 存在就填充
if (templateData.raw) {
  renderWithDefaultTemplate(templateData.raw)
}
```

## 4. S01.3: sessionStorage 持久化

### 4.1 键设计
```ts
const ONBOARDING_STATE_KEY = 'vibex_onboarding_state'
// 存储格式: { currentStep: number, formData: object, flowId: string }
```

### 4.2 useOnboarding.ts 修改
```ts
// 每次 Step 变化时同步到 sessionStorage
useEffect(() => {
  sessionStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify({ currentStep, formData }))
}, [currentStep, formData])

// 初始化时从 sessionStorage 恢复
const [initialState] = useState(() => {
  const saved = sessionStorage.getItem(ONBOARDING_STATE_KEY)
  return saved ? JSON.parse(saved) : defaultState
})
```

## 5. DoD

- [ ] Canvas 首屏 skeleton 在 100ms 内可见，无白屏
- [ ] AI 降级模式下模板数据仍能填充
- [ ] Onboarding Step 2→Step 5 刷新后进度不丢失
- [ ] useCanvasPrefill hook 单元测试通过
- [ ] TS 编译 0 errors

---

## E02: 项目分享通知系统 — 详细规格

## 1. 范围

- S02.1: Slack 通知 Endpoint
- S02.2: 分享成功后触发通知
- S02.3: 站内通知 Badge

## 2. S02.1: Slack 通知 Endpoint

### 2.1 API 设计
```
POST /api/projects/:id/share/notify
Content-Type: application/json

Request:
{
  "fromUserId": "user_xxx",
  "toUserId": "user_yyy",
  "projectName": "登录模块设计",
  "projectUrl": "https://vibex.app/canvas/proj_xxx"
}

Response 200:
{
  "delivered": true,
  "channel": "slack"
}

Response 400:
{
  "delivered": false,
  "error": "SLACK_TOKEN_NO_PERMISSION"
}
```

### 2.2 Slack 消息格式
```
A 分享了项目「登录模块设计」给你
点击查看: https://vibex.app/canvas/proj_xxx
```

## 3. S02.2: canvas-share.ts 集成

### 3.1 触发点
```ts
// POST /v1/canvas-share 成功后
const shareResult = await canvasShare(projectId, { role, targetUserId })
if (shareResult.success) {
  await fetch(`/api/projects/${projectId}/share/notify`, {
    method: 'POST',
    body: JSON.stringify({ fromUserId, toUserId, projectName, projectUrl })
  })
}
```

## 4. S02.3: 站内 Badge

### 4.1 数据结构
```ts
// GET /api/users/me/shared-projects
// 返回 { unreadCount: number, projects: SharedProject[] }
```

### 4.2 Badge 渲染
```tsx
{unreadCount > 0 && (
  <span className="new-project-badge">{unreadCount}</span>
)}
```

## 5. DoD

- [ ] Slack DM 在分享后 30s 内送达目标用户
- [ ] 重试不产生重复通知
- [ ] Slack token 无效时显示友好错误，不 crash
- [ ] 无 Slack 用户在 Dashboard 看到"新项目"badge
- [ ] TS 编译 0 errors

---

## E03: Dashboard 全局搜索增强 — 详细规格

## 1. 范围

- S03.1: 搜索结果高亮
- S03.2: 无结果提示 + E2E 测试

## 2. S03.1: 搜索高亮

### 2.1 高亮实现
```tsx
const highlightMatch = (text: string, query: string) => {
  if (!query) return text
  const regex = new RegExp(`(${query})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i}>{part}</mark> : part
  )
}

// 使用
<span>{highlightMatch(project.name, searchQuery)}</span>
```

### 2.2 验收标准
```ts
expect(search result highlights matched substring with <mark> tag)
expect(multiple matches all highlighted)
expect(<mark> styled with background: #fff3cd)
```

## 3. S03.2: 无结果提示

### 3.1 空状态组件
```tsx
{filteredProjects.length === 0 && (
  <div className="search-empty">
    <span>没有找到包含 "{searchQuery}" 的项目</span>
  </div>
)}
```

### 3.2 响应时间
```ts
expect(filteredProjects computed in < 100ms)
expect(input change to filtered result visible in < 100ms)
```

## 4. DoD

- [ ] 搜索结果高亮匹配文本（<mark> 标签）
- [ ] 搜索空结果显示友好提示
- [ ] 搜索过滤响应 < 100ms
- [ ] e2e test search.spec.ts 通过

---

## E04: RBAC 细粒度权限矩阵 — 详细规格

## 1. 范围

- S04.1: 权限类型扩展
- S04.2: 权限 Badge + UI 隔离
- S04.3: API 权限拦截

## 2. S04.1: rbac.ts 扩展

### 2.1 类型定义
```ts
// types/rbac.ts
export type ProjectPermission = 'view' | 'edit' | 'delete' | 'manageMembers'

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer'

export const ROLE_PERMISSIONS: Record<TeamRole, ProjectPermission[]> = {
  viewer: ['view'],
  member: ['view', 'edit'],
  admin: ['view', 'edit', 'delete', 'manageMembers'],
  owner: ['view', 'edit', 'delete', 'manageMembers']
}

export function hasPermission(role: TeamRole, permission: ProjectPermission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}
```

### 2.2 验收标准
```ts
expect(rbac.ts exports ProjectPermission type)
expect(TeamRole includes 'viewer')
expect(hasPermission('viewer', 'edit') === false)
expect(hasPermission('admin', 'delete') === true)
```

## 3. S04.2: UI Badge

```tsx
// ProjectCard.tsx
const RoleBadge = ({ role }: { role: TeamRole }) => (
  <span className={`role-badge role-${role}`}>{roleLabel[role]}</span>
)

// Canvas 删除按钮
{hasPermission(currentUserRole, 'delete') && (
  <Button onClick={handleDelete} className="delete-btn">删除</Button>
)}
```

## 4. S04.3: API 拦截

```ts
// middleware/rbac.ts
export async function checkProjectPermission(req, res, next) {
  const { role } = await getUserProjectRole(req.userId, req.params.projectId)
  if (!hasPermission(role, req.permission)) {
    return res.status(403).json({ error: 'PERMISSION_DENIED', message: '权限不足' })
  }
  next()
}
```

## 5. DoD

- [ ] rbac.ts 导出完整 ProjectPermission 类型
- [ ] viewer 角色在 ProjectCard 显示 badge，编辑按钮 disabled
- [ ] member 角色看不到删除按钮
- [ ] 无权限操作 API 返回 403，前端显示 toast
- [ ] TS 编译 0 errors

---

## E05: Canvas 离线模式 — 详细规格

## 1. 范围

- S05.1: Service Worker 配置
- S05.2: Canvas 离线可用 + Banner
- S05.3: Lighthouse PWA 评分

## 2. S05.1: Service Worker

### 2.1 next.config.js
```js
// next.config.js
module.exports = {
  experimental: {
    serviceWorker: true
  }
}
```

### 2.2 public/sw.js (Workbox)
```js
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst } from 'workbox-strategies'

// 预缓存所有 webpack 资源（自动注入）
precacheAndRoute(self.__WB_MANIFEST)

// 静态资源 cache-first
registerRoute(
  /\.(png|jpg|svg|ico)$/,
  new CacheFirst({ cacheName: 'static-assets' })
)

// API network-first
registerRoute(
  /\/api\//,
  new NetworkFirst({ cacheName: 'api-cache', networkTimeoutSeconds: 3 })
)
```

## 3. S05.2: 离线 Banner

```tsx
// CanvasPage.tsx
const [isOffline, setIsOffline] = useState(false)

useEffect(() => {
  const handleOffline = () => setIsOffline(true)
  const handleOnline = () => setIsOffline(false)
  window.addEventListener('offline', handleOffline)
  window.addEventListener('online', handleOnline)
  return () => {
    window.removeEventListener('offline', handleOffline)
    window.removeEventListener('online', handleOnline)
  }
}, [])

return (
  <>
    {isOffline && (
      <div className="offline-banner">离线模式 — 部分功能可能不可用</div>
    )}
    <CanvasContent />
  </>
)
```

## 4. S05.3: PWA Manifest

```json
// public/manifest.json
{
  "name": "VibeX",
  "short_name": "VibeX",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0070f3",
  "icons": [...]
}
```

## 5. DoD

- [ ] Chrome DevTools Offline 模式 /canvas/:id 仍可加载
- [ ] 离线时显示"离线模式"banner，不阻断使用
- [ ] 重新上线后 5s 内自动同步
- [ ] Lighthouse PWA Score >= 70
- [ ] TS 编译 0 errors

---

## E06: Analytics 趋势分析 — 详细规格

## 1. 范围

- S06.1: 历史数据聚合 API
- S06.2: 趋势折线图组件
- S06.3: CSV 导出含趋势数据

## 2. S06.1: 历史数据聚合

### 2.1 API 扩展
```
GET /api/analytics/funnel?range=30d

Response 200:
{
  "funnel": [...],  // 现有漏斗数据
  "trend": [
    { "date": "2026-04-07", "conversionRate": 0.32 },
    { "date": "2026-04-08", "conversionRate": 0.35 },
    ...
  ]
}
```

### 2.2 聚合逻辑（内存计算，不改 schema）
```ts
// 在内存中按日聚合历史数据
const dailyAggregates = aggregateByDay(rawData, 30)
```

## 3. S06.2: TrendChart.tsx（纯 SVG）

### 3.1 组件接口
```tsx
interface TrendChartProps {
  data: Array<{ date: string; conversionRate: number }>
  range: '7d' | '30d' | '90d'
  onRangeChange: (range: '7d' | '30d' | '90d') => void
}
```

### 3.2 SVG 折线图
- X 轴：时间刻度
- Y 轴：转化率（0-100%）
- 数据点：圆点标记
- 线条：贝塞尔曲线连接
- 网格：水平虚线辅助

## 4. S06.3: CSV 导出扩展

```ts
// exportFunnelCSV 修改
export const exportFunnelCSV = (data) => {
  const headers = ['日期', '转化率', '趋势']
  const rows = data.trend.map(d => [
    d.date,
    `${(d.conversionRate * 100).toFixed(1)}%`,
    getTrendDirection(d.conversionRate) // ↑/↓/→
  ])
  downloadCSV([headers, ...rows])
}
```

## 5. DoD

- [ ] GET /api/analytics/funnel 返回 30 天聚合数据
- [ ] TrendChart.tsx 正确渲染 SVG 折线图
- [ ] 7d / 30d / 90d 切换正确切换数据范围
- [ ] CSV 导出包含趋势数据列
- [ ] 数据 < 3 条时显示空状态，不 crash
- [ ] TS 编译 0 errors
