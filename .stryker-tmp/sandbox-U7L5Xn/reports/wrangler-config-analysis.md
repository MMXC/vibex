# VibeX 前端 wrangler.toml 配置问题根因分析报告

## 问题概述

**现象**: 前端部署到 Cloudflare Pages 后 API 请求失败

**分析时间**: 2026-03-01 14:28

**影响范围**: 所有依赖环境变量的 API 调用

---

## 1. 根因分析

### 1.1 问题链路追踪

```
用户请求 → Cloudflare Pages 部署 → wrangler.toml 环境变量注入
                                            ↓
                              API_BASE_URL = "https://api.vibex.top"
                                            ↓
                              Next.js 构建时读取环境变量
                                            ↓
                              process.env.NEXT_PUBLIC_API_BASE_URL = undefined
                                            ↓
                              fallback = 'https://api.vibex.top' (缺少 /api)
                                            ↓
                              API 请求 404
```

### 1.2 根因识别

| 问题 | 根因 | 影响 |
|------|------|------|
| **变量名不匹配** | Cloudflare Pages 变量命名规范与 Next.js 不一致 | 环境变量未注入 |
| **值缺少 /api 后缀** | 配置时遗漏后端路由前缀 | API 路径 404 |
| **硬编码 fallback** | 代码中硬编码不完整的 URL | 生产环境异常 |

### 1.3 为什么变量名不匹配？

**Cloudflare Pages 环境变量注入机制**:
- wrangler.toml 中定义的 `[vars]` 会直接注入到运行时
- 变量名需要与代码中 `process.env.XXX` 完全匹配

**Next.js 环境变量规范**:
- 只有 `NEXT_PUBLIC_` 前缀的变量会被打包到客户端代码
- 服务端代码可以访问所有环境变量
- 构建时变量会被内联替换

**冲突点**:
```toml
# wrangler.toml
[vars]
API_BASE_URL = "..."  # ❌ 缺少 NEXT_PUBLIC_ 前缀
```

```typescript
// 代码中
process.env.NEXT_PUBLIC_API_BASE_URL  # ✅ 需要 NEXT_PUBLIC_ 前缀
```

---

## 2. 配置检查清单

### 2.1 当前配置状态

| 配置文件 | 变量名 | 值 | 状态 |
|----------|--------|-----|------|
| `.env.local` | `NEXT_PUBLIC_API_BASE_URL` | `https://api.vibex.top/api` | ✅ 正确 |
| `wrangler.toml` | `API_BASE_URL` | `https://api.vibex.top` | ❌ 错误 |
| `chat/page.tsx:67` | 硬编码 fallback | `https://api.vibex.top` | ❌ 错误 |
| `api.ts:156` | 硬编码 fallback | `/api` | ⚠️ 不完整 |

### 2.2 需要检查的其他配置

| 文件 | 检查项 | 状态 |
|------|--------|------|
| `next.config.ts` | env 配置 | 待检查 |
| `package.json` | 构建脚本 | 待检查 |
| `Dockerfile` | 环境变量 | 待检查 |

---

## 3. 完整修复方案

### 3.1 wrangler.toml 修复

```toml
name = "vibex-frontend"
pages_build_output_dir = "./out"

# 环境变量配置 - 使用正确的变量名和完整 URL
[vars]
NEXT_PUBLIC_API_BASE_URL = "https://api.vibex.top/api"
NEXT_PUBLIC_APP_URL = "https://dev.vibex.top"

# 生产环境配置
[env.production]
name = "vibex-frontend-prod"

[env.production.vars]
NEXT_PUBLIC_API_BASE_URL = "https://api.vibex.top/api"
NEXT_PUBLIC_APP_URL = "https://vibex.top"

# 预览环境配置
[env.preview]
name = "vibex-frontend-preview"

[env.preview.vars]
NEXT_PUBLIC_API_BASE_URL = "https://api.vibex.top/api"
NEXT_PUBLIC_APP_URL = "https://preview.vibex.top"
```

### 3.2 chat/page.tsx 修复

```typescript
// 修复前 (第 67 行)
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top'

// 修复后
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top/api'
```

### 3.3 api.ts 修复 (建议)

```typescript
// 修复前 (第 156 行)
constructor(baseURL: string = process.env.NEXT_PUBLIC_API_BASE_URL || '/api')

// 修复后
constructor(baseURL: string = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top/api')
```

---

## 4. 环境变量配置规范

### 4.1 命名规范

| 场景 | 前缀 | 示例 |
|------|------|------|
| 客户端可访问 | `NEXT_PUBLIC_` | `NEXT_PUBLIC_API_BASE_URL` |
| 仅服务端访问 | 无前缀 | `DATABASE_URL` |

### 4.2 配置文件优先级

```
1. 系统环境变量 (最高)
2. .env.local (本地开发)
3. .env.production (生产构建)
4. wrangler.toml [vars] (Cloudflare Pages)
5. 代码 fallback (最低)
```

### 4.3 Cloudflare Pages 部署注意事项

1. **构建时变量**: 需要在 Cloudflare Dashboard 设置
2. **运行时变量**: 通过 wrangler.toml `[vars]` 配置
3. **敏感信息**: 使用 Cloudflare Secrets 管理

---

## 5. 验证清单

### 5.1 本地验证

```bash
# 1. 检查环境变量配置
cat .env.local
# 预期: NEXT_PUBLIC_API_BASE_URL=https://api.vibex.top/api

# 2. 构建测试
npm run build

# 3. 检查构建产物中的变量
grep -r "api.vibex.top" .next/
```

### 5.2 部署验证

```bash
# 1. 部署到 Cloudflare Pages
npx wrangler pages deploy ./out

# 2. 检查环境变量注入
curl -s https://vibex-app.pages.dev | grep -o 'api.vibex.top[^"]*'

# 3. API 连通性测试
curl -X POST https://vibex-app.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

### 5.3 功能验证

| 功能 | 测试用例 | 预期结果 |
|------|----------|----------|
| 用户注册 | POST /api/auth/register | 201 或 409 |
| 用户登录 | POST /api/auth/login | 200 + token |
| SSE 聊天 | GET /api/chat/stream | 200 + 流式响应 |
| 项目列表 | GET /api/projects | 200 + 项目数组 |

---

## 6. 总结

### 问题统计

| 问题类型 | 数量 | 优先级 |
|----------|------|--------|
| 变量名不匹配 | 1 处 | P0 |
| 缺少 /api 后缀 | 2 处 | P0 |
| 硬编码 fallback | 2 处 | P1 |

### 修复优先级

1. **P0**: wrangler.toml 变量名修复
2. **P0**: chat/page.tsx fallback 修复
3. **P1**: api.ts fallback 修复

### 后续建议

1. 建立环境变量配置文档
2. 添加构建时环境变量校验
3. 统一本地/生产环境配置管理

---

**分析完成时间**: 2026-03-01 14:28
**分析者**: Analyst Agent