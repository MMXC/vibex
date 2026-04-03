# AGENTS.md — VibeX 产品体验增强开发约束

**项目**: vibex-analyst-proposals-20260403_024652
**版本**: v1.0
**日期**: 2026-04-03
**角色**: Architect

---

## 1. 架构约束

### 1.1 前端组件约束

| 约束 | 描述 | 违规处理 |
|------|------|---------|
| **禁止直接引用 canvasStore 主入口** | 所有 canvas 相关状态必须通过子 store 访问 | ESLint rule: no-import-from-parent-store |
| **禁止内联样式** | 所有颜色/间距使用 design-tokens.css 变量 | ESLint rule: no-inline-styles |
| **禁止 console.log** | 使用 `useToast` 或 `logger` | `grep -rn "console.log" --include="*.tsx" components/` 需返回空 |
| **禁止 any 类型** | 严格 TypeScript，所有类型显式声明 | `tsc --strict` 无错误 |
| **新组件必须 CSS Modules** | 不允许 styled-components 或内联 | `*.module.css` 文件存在 |
| **Feedback Dialog 必须在 Fabric 弹窗之上** | z-index 层级：Feedback FAB > 任何 Modal | 验证在不同 Panel 展开时 FAB 始终可见 |

### 1.2 后端路由约束

| 约束 | 描述 | 违规处理 |
|------|------|---------|
| **所有 POST/PUT 必须 Zod 验证** | 新增端点必须使用 Zod schema | Jest 测试验证 400 响应 |
| **禁止直接拼接 SQL** | 使用 Drizzle ORM 或参数化查询 | ESLint rule: no-template-literals-in-sql |
| **错误响应格式统一** | `{ error: string, code?: string }` | api-contract.yaml 对齐 |
| **敏感数据不写入日志** | webhook URL、API token 仅在 env | `grep -n "process.env" routes/` 验证 |
| **async/await 必须 try/catch** | 所有路由 handler 必须捕获异常 | Jest 验证 error 路径 |

### 1.3 数据库约束

| 约束 | 描述 |
|------|------|
| **所有新表必须有 created_at** | 使用 `INTEGER DEFAULT (unixepoch())` |
| **所有外键必须有 ON DELETE** | CASCADE 或 SET NULL，明确处理 |
| **禁止 DROP TABLE** | 仅 ALTER TABLE 增加列，不删除 |
| **表名使用 snake_case** | `share_tokens` 而非 `shareTokens` |

---

## 2. API 契约约束

### 2.1 新增端点命名规范

```
POST   /api/feedback              — Feedback 提交
GET    /api/feedback              — Feedback 列表（仅 PM）
PATCH  /api/feedback/:id          — Feedback 状态更新
POST   /api/share                 — 生成分享链接
GET    /api/share/:token          — 通过 token 获取分享数据
POST   /api/snapshots             — 创建快照
GET    /api/snapshots             — 快照列表
GET    /api/snapshots/:id         — 快照详情
GET    /api/snapshots/diff        — 快照对比
POST   /api/collaborators/invite   — 邀请协作者
POST   /api/collaborators/accept   — 接受邀请
GET    /api/collaborators          — 协作者列表
DELETE /api/collaborators/:id     — 移除协作者
POST   /api/analytics/track        — 埋点上报
GET    /api/analytics/summary      — 聚合指标
GET    /api/quality/trend          — 质量趋势
POST   /api/quality/sync          — CI 数据同步（内部）
```

### 2.2 API 错误码规范

| HTTP Status | Code | 含义 |
|-------------|------|------|
| 400 | VALIDATION_ERROR | 输入验证失败 |
| 401 | UNAUTHORIZED | 未登录 |
| 403 | FORBIDDEN | 权限不足 |
| 403 | TOKEN_EXPIRED | 分享链接已过期 |
| 403 | TOKEN_NOT_FOUND | 分享链接不存在 |
| 404 | NOT_FOUND | 资源不存在 |
| 429 | RATE_LIMITED | 请求过于频繁 |
| 500 | INTERNAL_ERROR | 服务器错误 |

---

## 3. 测试约束

### 3.1 必须覆盖的场景

```typescript
// Feedback Dialog
expect('必填项未填时提交按钮禁用')
expect('描述超过500字时显示错误')
expect('提交成功显示Toast')
expect('截图超过5MB时提示用户')

// Share Link
expect('有效token返回项目数据')
expect('无效token返回403')
expect('过期token返回403')

// Analytics Track
expect('批量上报事件数量正确')
expect('匿名化projectId不包含用户标识')

// Quality Alert
expect('通过率90%不触发报警')
expect('通过率85%触发Slack通知')
expect('24h内相同报警不重复发送')
```

### 3.2 测试框架规范

| 约束 | 规范 |
|------|------|
| **单元测试** | Jest（项目标准） |
| **E2E 测试** | Playwright（已有配置） |
| **禁止 vitest** | 项目未安装 vitest，使用 jest |
| **Mock GitHub API** | 使用 nock 拦截 gh API 请求 |
| **Mock Slack Webhook** | 使用 nock 拦截 Slack 请求 |
| **E2E 测试隔离** | 每个 spec 使用独立数据库 fixture |

### 3.3 DoD 要求（Definition of Done）

**功能点完成的判断标准**（所有条件同时满足）：

1. ✅ 代码已合并到 main 分支
2. ✅ 所有 Jest 单元测试通过
3. ✅ 所有 Playwright E2E 测试通过
4. ✅ api-contract.yaml 更新（新增端点已定义）
5. ✅ CHANGELOG.md 已更新
6. ✅ 文档已更新（若涉及 API 变更）

---

## 4. 性能约束

| 指标 | 阈值 | 测量方法 |
|------|------|---------|
| Feedback 提交响应时间 | < 500ms | Playwright Performance API |
| Analytics 页面加载 | < 2s | Playwright `page.waitForLoadState('networkidle')` |
| Quality 趋势图渲染 | < 1s | Playwright Performance API |
| TrackSDK 单次调用 | < 10ms | `performance.now()` 测量 |
| Screenshot 压缩 | < 200ms | `performance.now()` 测量 |

---

## 5. 安全约束

| 约束 | 描述 | 验证方法 |
|------|------|---------|
| **Feedback XSS 防护** | 描述字段禁止 HTML 渲染 | DOMPurify sanitize |
| **分享链接不可预测** | 使用 crypto.randomUUID() v4 | Jest 验证 token 熵 |
| **GitHub Issue 注入防护** | 不使用 shell 拼接 | 纯 API 调用，无 shell |
| **Screenshot 文件大小** | 前端压缩 + 后端验证 | E2E 测试大文件上传 |
| **Slack Webhook URL** | 仅在 env，不在代码 | `grep -rn "slack.webhook" routes/` 返回空 |
| **权限校验** | 所有写操作验 user_id | 单元测试验证 403 |

---

## 6. Git 约束

| 约束 | 描述 |
|------|------|
| **Commit 消息格式** | `{Epic}.{Story}: {简短描述}` (如 `E3.2: feedback form validation`) |
| **Branch 命名** | `feat/{epic}-{story}` (如 `feat/E3-feedback-dialog`) |
| **PR 标题** | `[E{Epic}] {功能描述}` (如 `[E3] Feedback 收集机制`) |
| **每个 Story 独立 PR** | 不在一个 PR 内混合多个 Story |
| **PR 必须包含测试** | 无测试的 PR Reviewer 可直接驳回 |

---

## 7. Feature Flag 约束

```typescript
// 所有 Epic 2/3/4/5 功能必须用 Feature Flag 包裹
import { flags } from '@/lib/featureFlags';

// 在组件中
{flags.epic3_feedback() && <FeedbackFAB />}

// 在 API 中
if (!flags.epic4_analytics() && req.url.includes('/analytics')) {
  return Response.json({ error: 'Not enabled' }, { status: 404 });
}
```

---

## 8. 合规约束

| 约束 | 描述 |
|------|------|
| **无个人追踪** | Analytics 数据不含 user_id、IP、邮箱 |
| **数据保留期限** | Analytics events 保留 90 天后自动清理 |
| **Feedback 数据保留** | 保留 1 年后归档 |
| **Quality 数据保留** | 保留最近 100 次构建数据 |
| **Feedback 截图** | 存储在 R2 或外部 CDN，不存入 D1 |
