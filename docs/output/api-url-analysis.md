# API_BASE_URL 配置分析报告

## Problem Statement

**核心问题**: 前端 API_BASE_URL 配置缺少 `/api` 后缀，导致请求路径错误

**当前状态**:
```
当前配置: NEXT_PUBLIC_API_BASE_URL=https://api.vibex.top
实际请求: https://api.vibex.top/auth/register → 404 ❌
正确请求: https://api.vibex.top/api/auth/register → 409 ✅
```

## Root Cause Analysis

### 1. 后端路由结构

**后端入口文件 `src/index.ts`**:
```typescript
// API Routes - 所有路由都有 /api 前缀
app.route('/api/projects', projects);
app.route('/api/pages', pages);
app.route('/api/agents', agents);
app.route('/api/chat', chat);
app.route('/api/auth', auth);      // ← /api/auth
app.route('/api/users', users);
app.route('/api/messages', messages);
app.route('/api/flows', flows);
```

**路由映射**:
| 后端路由 | 实际路径 |
|----------|----------|
| `/api/auth` | `/api/auth/login`, `/api/auth/register` |
| `/api/projects` | `/api/projects`, `/api/projects/:id` |
| `/api/chat` | `/api/chat/stream` |

### 2. 前端 API 调用

**前端 API 服务 `src/services/api.ts`**:
```typescript
// 注册
async register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await this.client.post<any>('/auth/register', data);
  // ...
}

// 登录
async login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await this.client.post<any>('/auth/login', credentials);
  // ...
}
```

### 3. 路径拼接问题

**当前配置**:
```
baseURL: https://api.vibex.top
请求路径: /auth/register
实际URL: https://api.vibex.top/auth/register → 404 ❌
```

**正确配置**:
```
baseURL: https://api.vibex.top/api
请求路径: /auth/register
实际URL: https://api.vibex.top/api/auth/register → 409 ✅
```

### 4. 验证结果

| 测试 URL | HTTP 状态 | 说明 |
|----------|-----------|------|
| `https://api.vibex.top/auth/register` | 404 | 路径错误 |
| `https://api.vibex.top/api/auth/register` | 409 | 正确（用户已存在） |
| `https://api.vibex.top/health` | 404 | 无此端点 |
| `https://api.vibex.top/` | 200 | 根路径正常 |

## Proposed Solution

### 方案: 修改前端环境变量

**修改 `.env.local`**:
```bash
# 修改前
NEXT_PUBLIC_API_BASE_URL=https://api.vibex.top

# 修改后
NEXT_PUBLIC_API_BASE_URL=https://api.vibex.top/api
```

**影响范围**:
- 所有 API 请求将正确路由到 `/api/*` 端点
- 包括：auth, projects, pages, agents, chat, users, messages, flows

**验证命令**:
```bash
# 测试登录
curl -X POST https://api.vibex.top/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# 测试注册
curl -X POST https://api.vibex.top/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"new@test.com","password":"test123"}'
```

## Success Metrics

1. ✅ `POST /auth/login` 返回 200 或 401，而非 404
2. ✅ `POST /auth/register` 返回 201 或 409，而非 404
3. ✅ 用户可以正常登录注册

## Action Items

| 序号 | 任务 | 负责人 | 优先级 |
|------|------|--------|--------|
| 1 | 修改 `.env.local` 添加 `/api` 后缀 | dev | P0 |
| 2 | 重新构建并部署前端 | dev | P0 |
| 3 | 验证注册登录流程 | tester | P1 |

---

**分析时间**: 2026-03-01 00:22
**分析师**: analyst agent