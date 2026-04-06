# E1-API认证中间件 实现方案

## 背景

**D-P0-1**: 15+ API 路由无认证检查，任何人可消耗 LLM 配额。已存在 `getAuthUser()` JWT 验证函数。

## 分析

### 现有代码结构

- `vibex-backend/src/lib/auth.ts` - 已存在 JWT 验证函数:
  - `getAuthUser(request: Request, jwtSecret: string)` - 从 Request 提取 JWT payload
  - `authMiddleware` - Hono 风格中间件
  - `verifyToken` / `generateToken` - JWT 操作
- `vibex-backend/src/lib/env.ts` - Cloudflare Workers 环境变量类型

### 影响范围

所有未认证的 API 路由都需要添加认证检查。

## 方案设计

### 创建 apiAuth.ts 中间件工具

创建 `vibex-backend/src/lib/apiAuth.ts`，提供:
- `checkAuth()` - 检查认证并返回错误响应
- `withAuth()` - HOC 包装器
- `optionalAuth()` - 可选认证
- `requireAuth()` - 直接认证检查

### 路由保护策略

| 路由 | 方法 | 状态 | 说明 |
|------|------|------|------|
| `/api/v1/chat` | POST | ✅ 已添加认证 | LLM 调用 |
| `/api/v1/canvas/generate` | POST | ✅ 已添加认证 | LLM 调用 |
| `/api/v1/canvas/generate-contexts` | POST | ✅ 已添加认证 | LLM 调用 |
| `/api/v1/canvas/generate-components` | POST | ✅ 已添加认证 | LLM 调用 |
| `/api/v1/canvas/generate-flows` | POST | ✅ 已添加认证 | LLM 调用 |
| `/api/v1/canvas/stream` | GET | ✅ 已添加认证 | SSE 流 |
| `/api/v1/canvas/status` | GET | ✅ 已添加认证 | 进度查询 |
| `/api/v1/canvas/export` | GET | ✅ 已添加认证 | 项目导出 |
| `/api/v1/canvas/project` | POST | ✅ 已添加认证 | 项目创建 |
| `/api/v1/ai-ui-generation` | POST | ✅ 已添加认证 | LLM 调用 |
| `/api/v1/domain-model/[projectId]` | GET/POST | ✅ 已添加认证 | 领域模型 |
| `/api/v1/prototype-snapshots` | GET/POST | ✅ 已添加认证 | 快照管理 |
| `/api/v1/agents` | GET/POST | ✅ 已添加认证 | Agent 管理 |
| `/api/v1/pages` | GET/POST | ✅ 已添加认证 | 页面管理 |
| `/api/v1/analyze/stream` | GET | ✅ 已添加认证 | SSE 流 |
| `/api/chat` | POST | ✅ 已添加认证 | LLM 调用 |

### 豁免路由 (无需认证)

- `GET /api/v1/canvas/health` - 健康检查
- `POST /api/v1/auth/login` - 登录
- `POST /api/v1/auth/register` - 注册
- `POST /api/v1/auth/logout` - 登出

## 验收标准

- [x] `npm run build` 通过
- [x] 所有受保护路由添加 JWT 认证检查
- [x] 无效/缺失 JWT 返回 401 Unauthorized
- [x] 豁免路由保持公开访问
- [x] 代码已提交并推送

## 产出物

- `vibex-backend/src/lib/apiAuth.ts` - 认证中间件工具
- 16 个路由文件添加认证检查
