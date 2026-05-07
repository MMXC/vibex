# VibeX Sprint 29 — 开发约束文档

**Agent**: architect
**日期**: 2026-05-07
**项目**: vibex-proposals-sprint29
**执行决策**: 已采纳 | 执行项目: vibex-proposals-sprint29 | 执行日期: 2026-05-07

---

## 1. 开发规范

### 1.1 TypeScript

| 规则 | 要求 |
|------|------|
| 严格模式 | `tsconfig.json` 中 `strict: true` |
| 禁止 `any` | 启用 `noImplicitAny: true`；需妥协时用 `unknown` |
| 类型导出 | 公开 API 必须有类型声明，禁止裸类型 |
| 禁止 `as` 断言 | 业务逻辑中禁止类型断言，优先用类型守卫 |

```typescript
// ✅ 正确
function getProject(id: string): Project | null { ... }

// ❌ 禁止
function getProject(id: any): any { ... }
```

### 1.2 代码风格

| 工具 | 配置 | 规则集 |
|------|------|--------|
| ESLint | `.eslintrc.json` | `next/core-web-vitals` + `typescript-eslint/recommended` |
| Prettier | `.prettierrc` | 单引号、分号结尾、printWidth: 100 |
| 提交前检查 | pre-commit hook | `lint-staged` 运行 `eslint --fix && prettier --write` |

```bash
# CI 必须通过
npm run lint
npm run format:check

# 本地修复
npm run lint:fix
npm run format:write
```

### 1.3 目录结构约定

```
src/
├── app/                    # Next.js App Router 页面
│   ├── api/                # API Routes
│   │   └── v1/             # 版本化 API（/api/v1/）
│   ├── canvas/[id]/        # Canvas 页面
│   ├── dashboard/          # Dashboard 页面
│   └── onboarding/         # Onboarding 页面
├── components/             # React 组件
│   ├── ui/                 # 基础 UI（Button, Input, Badge）
│   ├── canvas/             # Canvas 相关组件
│   ├── dashboard/          # Dashboard 相关组件
│   └── analytics/         # Analytics 相关组件
├── hooks/                  # React Hooks（use* 前缀）
├── services/               # 业务逻辑层
├── lib/                    # 工具函数
├── types/                  # TypeScript 类型定义
└── specs/                  # Epic 规格文档（E0X-name.md）
```

---

## 2. API 设计规范

### 2.1 RESTful 约定

| 操作 | HTTP 方法 | 路径 | 响应 |
|------|----------|------|------|
| 列举项目 | `GET` | `/api/v1/projects` | 200 + `Project[]` |
| 创建项目 | `POST` | `/api/v1/projects` | 201 + `Project` |
| 获取项目 | `GET` | `/api/v1/projects/:id` | 200 + `Project` |
| 更新项目 | `PATCH` | `/api/v1/projects/:id` | 200 + `Project` |
| 删除项目 | `DELETE` | `/api/v1/projects/:id` | 204 或 403 |
| 分享通知 | `POST` | `/api/v1/projects/:id/share/notify` | 200 + `{ sent: boolean }` |

### 2.2 错误码规范

| HTTP 状态码 | 含义 | 前端行为 |
|------------|------|----------|
| `400` | 请求参数错误 | 显示字段级错误提示 |
| `401` | 未认证 | 跳转登录页 |
| `403` | 无权限（RBAC） | 显示 toast "权限不足"，禁止操作 |
| `404` | 资源不存在 | 显示"项目不存在" |
| `429` | 请求频率超限 | 显示"操作太频繁，请稍后再试" |
| `500` | 服务器内部错误 | 显示"服务器异常，请稍后再试" |

**错误响应格式**：

```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "您没有权限执行此操作",
    "details": {}
  }
}
```

### 2.3 API 版本策略

- 所有 API 统一前缀 `/api/v1/`
- 破坏性变更须发布新版本 `/api/v2/`
- 废弃版本须在 `Deprecation` 响应头标注

---

## 3. 前端组件规范

### 3.1 组件文件结构

```
components/
└── FeatureName/
    ├── index.ts                    # 导出入口
    ├── FeatureName.tsx              # 主组件
    ├── FeatureName.test.tsx         # 单元测试
    ├── FeatureNameSkeleton.tsx      # Skeleton 组件（需E2E）
    ├── useFeatureName.ts            # 关联 Hook（可选）
    └── types.ts                     # 类型定义（可选）
```

### 3.2 React Hooks 命名规范

| 类型 | 命名 | 示例 |
|------|------|------|
| 自定义 Hook | `use` + 名词 | `useProjectSearch`、`useCanvasPrefill` |
| 状态 Hook | `useState` | `const [loading, setLoading] = useState(false)` |
| 副作用 Hook | `useEffect` | 数据获取、订阅 |
| 上下文 | `use` + Context 名 | `useAuth()` |

**特殊约束（Sprint 29）**：
- `useCanvasPrefill` 为 Onboarding → Canvas 预填充的唯一入口，禁止在其他 hook 中重复实现预填充逻辑

### 3.3 状态管理约定

| 场景 | 方案 | 说明 |
|------|------|------|
| 页面级状态 | `useState` + `useReducer` | 不上 Redux |
| 跨组件共享 | React Context | 按业务域划分 Context |
| 服务端数据 | React Query / SWR | 缓存 + 预取 |
| Onboarding 进度 | sessionStorage | 页面刷新不丢失 |
| Canvas 预填充 | localStorage + `useCanvasPrefill` | Onboarding 跳转时注入 |

---

## 4. 测试规范

### 4.1 测试覆盖率要求

| 测试类型 | 覆盖要求 | 工具 |
|---------|---------|------|
| 单元测试 | **> 80%** | Vitest + React Testing Library |
| 集成测试 | 核心业务流程 | Vitest |
| E2E 测试 | 关键用户路径 | Playwright |

### 4.2 E2E 命名约定

| 文件 | 命名规则 | 示例 |
|------|---------|------|
| 搜索测试 | `search.spec.ts` | `e2e/search.spec.ts` |
| Canvas 测试 | `canvas.spec.ts` | `e2e/canvas.spec.ts` |
| Onboarding 测试 | `onboarding.spec.ts` | `e2e/onboarding.spec.ts` |
| 通知测试 | `notification.spec.ts` | `e2e/notification.spec.ts` |

### 4.3 Mock 策略

| 场景 | 工具 | 约定 |
|------|------|------|
| API Mock | MSW (Mock Service Worker) | `src/mocks/handlers.ts` |
| Firebase | `firebase-mock` | 禁止 Mock 具体实现细节 |
| Slack API | Inline mock | S02.1/S02.2 使用 Jest.fn() |
| localStorage | `localStorageMock` | `src/test/utils/localStorage.ts` |

---

## 5. 安全规范

### 5.1 环境变量命名

| 类别 | 前缀 | 示例 |
|------|------|------|
| Firebase | `FIREBASE_` | `FIREBASE_API_KEY`、`FIREBASE_AUTH_DOMAIN` |
| OpenAI | `OPENAI_` | `OPENAI_API_KEY`、`OPENAI_MODEL` |
| Slack | `SLACK_` | `SLACK_BOT_TOKEN`、`SLACK_SIGNING_SECRET` |
| 内部 | `VIBEX_` | `VIBEX_API_URL`、`VIBEX_ENV` |

### 5.2 密钥保护

| 规则 | 说明 |
|------|------|
| 禁止客户端暴露 | 所有密钥在 `.env.server` 或 `.env.local`，`NEXT_PUBLIC_` 仅用于公开配置 |
| 禁止硬编码 | API 密钥、Token 不得出现在源码中 |
| 提交前检查 | pre-commit 运行 `git secrets` 或自定义扫描脚本 |

---

## 6. Git Workflow

### 6.1 分支命名

| 类型 | 格式 | 示例 |
|------|------|------|
| 功能分支 | `feat/s29-epic-XX-description` | `feat/s29-e01-canvas-prefill` |
| 修复分支 | `fix/s29-epic-XX-issue` | `fix/s29-e04-rbac-403` |
| 文档分支 | `docs/s29-epic-XX` | `docs/s29-e07-specs-completion` |
| 重构分支 | `refactor/s29-epic-XX` | `refactor/s29-e05-offline-mode` |

### 6.2 PR Checklist

> 提交 PR 前必须确认以下所有条目

- [ ] `tsc --noEmit` 通过
- [ ] `npm run lint` 通过
- [ ] 单元测试覆盖率 > 80%（`npm run test:coverage`）
- [ ] 相关 E2E 测试通过（`npx playwright test`）
- [ ] 相关 Epic 的 DoD 满足（见本文档 Epic-specific Constraints）
- [ ] PR 描述包含：改了什么、为什么改、测试结果
- [ ] 审查者至少 1 人 approval
- [ ] 无敏感信息泄露（密钥、日志中的用户数据）

---

## 7. 性能门控

### 7.1 CI 必须通过的门控

| 门控 | 要求 | 命令 |
|------|------|------|
| TypeScript 编译 | `tsc --noEmit` exit 0 | `npm run type-check` |
| ESLint | 0 errors | `npm run lint` |
| 单元测试 | > 80% | `npm run test:coverage` |
| E2E | 100% pass | `npx playwright test` |

### 7.2 性能指标

| 指标 | 目标 | 测量方法 |
|------|------|----------|
| Lighthouse PWA Score | **≥ 70** | `lhci autorun` |
| 搜索过滤响应 | **< 100ms** | DevTools Performance |
| Canvas 首屏 skeleton | **100ms 内可见** | Playwright `page.waitForSelector` |
| Slack 通知送达 | **< 30s** | S02.1 E2E test |
| Slack API 超时 | **< 3s** | Timeout 配置 |

---

## 8. Epic-specific Constraints

> 每个 Epic 的特殊约束，优先级高于通用规范。

### E01: Onboarding → Canvas 无断点

| 约束 | 规则 |
|------|------|
| sessionStorage 跨标签页 | 不可共享，使用 localStorage 做跨标签页通信 |
| AI 降级格式 | 降级时存入 `{ raw: string, parsed: null }`，Canvas 读取时兼容 |
| Canvas skeleton | 100ms 内可见，无白屏；使用 Skeleton 组件 |
| 预填充入口 | 统一使用 `useCanvasPrefill` hook，禁止在页面组件中直接读 localStorage |

```typescript
// AI 降级存储格式
localStorage.setItem(PENDING_TEMPLATE_REQ_KEY, JSON.stringify({
  raw: rawText,
  parsed: null  // AI 降级时不解析
}));

// useCanvasPrefill 读取兼容
const prefilled = useCanvasPrefill(projectId);
// 兼容 { raw: string, parsed: null } 和 { raw: string, parsed: ParsedData }
```

### E02: 项目分享通知

| 约束 | 规则 |
|------|------|
| 通知时效 | Slack DM 30s 内送达，API 超时 < 3s |
| 通知去重 | 基于 `shareId + recipientId` 去重，禁止重复投递 |
| 降级路径 | 无 Slack 用户 → 站内 badge（`Dashboard.showShareBadge`） |

```typescript
// 去重键
const dedupKey = `${shareId}:${recipientId}`;
const sent = await notificationService.send(slackUserId, message);
// 去重存储：Redis SETNX 或 DB unique index
```

### E03: Dashboard 全局搜索

| 约束 | 规则 |
|------|------|
| 搜索高亮 | 使用 `<mark>` 标签，禁止 `<span class="highlight">` |
| 搜索策略 | 前端过滤优先，后端接入作为增量优化（当前 `useProjectSearch` 已满足） |
| 响应时间 | 过滤响应 < 100ms |

```tsx
// ✅ 正确
return <mark key={i}>{match}</mark>;

// ❌ 禁止
return <span className="highlight">{match}</span>;
```

### E04: RBAC 细粒度权限

| 约束 | 规则 |
|------|------|
| 权限类型 | `ProjectPermission: view | edit | delete | manageMembers` |
| 团队角色 | `TeamMember.role: owner | admin | member | viewer` |
| viewer UI | 编辑按钮 `disabled`，非 `hidden`（保持可见性） |
| 无权限响应 | API 返回 403 + 前端 toast "权限不足" |

```typescript
// types/rbac.ts
export type ProjectPermission = 'view' | 'edit' | 'delete' | 'manageMembers';
export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

// 权限判断
const canEdit = permissions.includes('edit');
// viewer → disabled，非 hidden
<Button disabled={!canEdit}>编辑</Button>
```

### E05: Canvas 离线模式

| 约束 | 规则 |
|------|------|
| 缓存策略 | Workbox: `cache-first` (静态资源) / `network-first` (API) |
| SW 注册位置 | `public/sw.js`（必须在 public 目录） |
| 离线 Banner | 文案固定："离线模式，部分功能可能不可用" |
| PWA manifest | 必须存在 `public/manifest.json` |

```javascript
// next.config.js
module.exports = {
  experimental: {
    // Service Worker 配置（Next.js 13+ 内置支持）
  }
};

// public/sw.js（简化）
import { precacheAndRoute } from 'workbox-precaching';
precacheAndRoute(self.__WB_MANIFEST);
```

### E06: Analytics 趋势分析

| 约束 | 规则 |
|------|------|
| 图表技术 | **纯 SVG**，禁止引入 Recharts / Chart.js |
| 历史聚合 | 内存计算（不改 schema），API `/api/analytics/funnel` 返回 30 天聚合 |
| 空状态 | 数据 < 3 条时显示空状态提示，不 crash |
| CSV 编码 | **UTF-8 with BOM**（Excel 兼容） |

```tsx
// TrendChart.tsx — 纯 SVG 实现
// X 轴：时间（7d/30d/90d 切换）
// Y 轴：转化率
// 数据点 < 3 → 渲染空状态组件（不 crash）
```

```typescript
// CSV 导出编码（UTF-8 with BOM）
const BOM = '\uFEFF';
const csvContent = BOM + headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
```

### E07: Sprint 28 Specs 补全

| 约束 | 规则 |
|------|------|
| 文件命名 | `E0X-name.md` 格式 |
| 文档结构 | 背景 + 范围 + 技术架构 + API 规格 + 验收标准 |
| 对齐目标 | 与 S28 `IMPLEMENTATION_PLAN` 完全对齐 |

**需补全的 spec 文件**：

| 文件 | 状态 |
|------|------|
| `specs/E01-realtime-collab.md` | ✅ 已存在 |
| `specs/E02-perf-optimization.md` | ✅ 已存在 |
| `specs/E03-ai-clarify.md` | ❌ 缺失 |
| `specs/E04-template-crud.md` | ❌ 缺失 |
| `specs/E05-prd-canvas.md` | ✅ 已存在 |
| `specs/E06-error-boundary.md` | ❌ 缺失 |
| `specs/E07-mcp-server.md` | ❌ 缺失 |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint29
- **执行日期**: 2026-05-07

---

## 附录 A: DoD 检查清单（按 Epic）

### E01: Onboarding → Canvas 无断点

- [ ] Canvas skeleton 100ms 内可见，无白屏
- [ ] AI 降级模式下 `{ raw, parsed: null }` 格式存储 + 读取兼容
- [ ] Onboarding Step 2 → Step 5 刷新后进度不丢失（sessionStorage）
- [ ] `useCanvasPrefill` hook 单元测试通过
- [ ] `tsc --noEmit` exit 0

### E02: 项目分享通知

- [ ] Slack DM 30s 内送达，超时 < 3s
- [ ] 基于 `shareId + recipientId` 去重，无重复通知
- [ ] 无 Slack 用户 Dashboard 显示"新项目"badge
- [ ] Slack token 无效时显示友好错误，不 crash

### E03: Dashboard 全局搜索

- [ ] 搜索结果使用 `<mark>` 高亮
- [ ] 空搜索显示"没有找到包含 xxx 的项目"
- [ ] 搜索过滤响应 < 100ms
- [ ] `search.spec.ts` E2E 测试通过

### E04: RBAC 细粒度权限

- [ ] `rbac.ts` 导出 `ProjectPermission: view|edit|delete|manageMembers`
- [ ] `TeamMember.role` 含 `viewer`
- [ ] viewer 角色编辑按钮 `disabled`（非 `hidden`）
- [ ] member 角色看不到删除按钮
- [ ] 无权限 API 返回 403 + 前端 toast

### E05: Canvas 离线模式

- [ ] `public/sw.js` 存在并正确注册
- [ ] Chrome DevTools Offline 模式 Canvas 可加载（缓存）
- [ ] 离线时显示"离线模式，部分功能可能不可用" banner
- [ ] `public/manifest.json` 存在
- [ ] Lighthouse PWA Score ≥ 70

### E06: Analytics 趋势分析

- [ ] `GET /api/analytics/funnel` 返回 30 天聚合数据
- [ ] `TrendChart.tsx` 纯 SVG 实现，无 Recharts/Chart.js
- [ ] 7d / 30d / 90d 切换正确
- [ ] CSV 含 `date, conversionRate, trend` 列
- [ ] CSV 编码 UTF-8 with BOM
- [ ] 数据 < 3 条时显示空状态，不 crash

### E07: Sprint 28 Specs 补全

- [ ] `specs/E03-ai-clarify.md` 包含完整 API schema
- [ ] `specs/E04-template-crud.md` 包含 CRUD schema + UI 布局
- [ ] `specs/E06-error-boundary.md` 包含 Fallback 设计 + 边界条件
- [ ] `specs/E07-mcp-server.md` 包含健康检查协议 + 集成测试用例
- [ ] 所有 spec 与 S28 `IMPLEMENTATION_PLAN` 对齐

---

*本文档由 architect 基于 PRD（prd.md）和 Analyst 报告（analysis.md）产出，作为 Sprint 29 团队开发约束基准线。*