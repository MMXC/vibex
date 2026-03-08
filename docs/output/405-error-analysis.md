# 405 Method Not Allowed 错误分析报告

## Problem Statement

**核心问题**: 前端注册接口返回 405 Method Not Allowed

**错误详情**:
```
POST https://vibex-app.pages.dev/api/auth/register → 405 Method Not Allowed
POST https://api.vibex.top/api/auth/register → 201 Created ✅
```

## Root Cause Analysis

### 1. 前端架构问题

**next.config.ts 配置**:
```typescript
const nextConfig: NextConfig = {
  output: 'export',  // ← 静态导出模式
  images: { unoptimized: true },
  trailingSlash: true,
};
```

**影响**:
- `output: 'export'` 生成纯静态 HTML 文件
- **不支持 API Routes** - 所有 `/api/*` 路由在构建时被忽略
- 静态站点无法处理 POST 请求

### 2. Cloudflare Pages 路由配置缺失

**问题**:
- 前端部署在 `vibex-app.pages.dev`
- 没有 `_redirects` 文件配置 API 代理
- 访问 `/api/auth/register` 时，Cloudflare Pages 找不到对应的静态文件

**验证**:
```bash
# 前端静态站点
POST https://vibex-app.pages.dev/api/auth/register → 405

# 后端 API
POST https://api.vibex.top/api/auth/register → 201
```

### 3. 根因总结

| 问题 | 详情 |
|------|------|
| **架构** | 前端使用 `output: 'export'` 静态导出 |
| **路由** | 缺少 Cloudflare Pages `_redirects` 配置 |
| **结果** | `/api/*` 请求无法到达后端 API |

## Proposed Solution

### 方案 A: 添加 Cloudflare Pages `_redirects` 文件（推荐）

**创建 `public/_redirects`**:
```
# API 代理 - 将前端 /api/* 重写到后端
/api/*  https://api.vibex.top/api/:splat  200

# SPA 路由回退
/*      /index.html   200
```

**优点**:
- ✅ 不需要修改代码
- ✅ 支持所有 HTTP 方法
- ✅ 保持前端静态部署

### 方案 B: 修改前端 API 配置

**修改 `.env.local`**:
```
NEXT_PUBLIC_API_BASE_URL=https://api.vibex.top
```

**修改 API 服务调用**:
```typescript
// 确保使用完整 URL
const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
```

### 方案 C: 使用 Cloudflare Workers 作为 API 网关

在 Cloudflare Workers 中配置路由：
```typescript
// workers/frontend-proxy.ts
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith('/api/')) {
      // 代理到后端 API
      return fetch(`https://api.vibex.top${url.pathname}`, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
    }
    
    // 其他请求返回静态内容
    return env.ASSETS.fetch(request);
  }
}
```

## Success Metrics

1. ✅ POST `/api/auth/register` 返回 201 或 400（业务错误），而非 405
2. ✅ 前端静态部署不受影响
3. ✅ API 调用正确路由到后端

## Action Items

| 序号 | 任务 | 负责人 | 优先级 |
|------|------|--------|--------|
| 1 | 创建 `public/_redirects` 文件 | dev | P0 |
| 2 | 验证 Cloudflare Pages 路由配置 | dev | P0 |
| 3 | 测试注册流程 | tester | P1 |

---

**分析时间**: 2026-02-28 20:11
**分析师**: analyst agent