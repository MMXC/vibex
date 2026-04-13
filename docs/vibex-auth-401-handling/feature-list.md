# Feature List: vibex-auth-401-handling

> Planning Output — Phase1 Step 2 (create-prd)
> Based on: docs/vibex-auth-401-handling/analysis.md
> Date: 2026-04-13

## Problem Frame

login/register 路由只返回 JSON token，不设置 httpOnly cookie。middleware 依赖 `auth_token` cookie 判断登录状态，导致登录成功后 middleware 仍读不到 cookie → 无限重定向循环（登录后仍被踢回登录页）。

## Feature List

| ID | 功能名 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|---------|---------|
| F1.1 | login 路由设置 httpOnly cookie | POST /api/v1/auth/login 在成功响应中设置 auth_token cookie | login 只返回 JSON 无 Set-Cookie | 0.5h |
| F1.2 | register 路由设置 httpOnly cookie | POST /api/v1/auth/register 在成功响应中设置 auth_token cookie | register 同 login | 0.5h |
| F1.3 | logout 路由清除 cookie | POST /api/v1/auth/logout 在成功响应中设置 maxAge=0 清空 auth_token cookie | logout 无 Set-Cookie 清理 | 0.5h |
| F2.1 | authStore logout 清理 cookie | logout() 中增加 document.cookie 清除 auth_token | 前端 logout 只清 sessionStorage，middleware 仍能读到旧 cookie | 0.5h |
| F2.2 | httpClient 双保险 Authorization header | 每次请求带上 Bearer token（cookie 失效时的备选） | 前端 httpClient 只有 cookie，cookie 失效则全部失败 | 0.5h |
| F3.1 | middleware 401 跳转测试 | 未登录访问受保护路径 → 307 重定向到 /auth?returnTo=X | 测试覆盖缺失 | 1h |
| F3.2 | 完整登录跳转 E2E | 未登录 → 访问 /canvas → 跳转登录 → 登录 → 回到 /canvas | E2E 路径缺失 | 1h |
| F3.3 | logout 后重定向验证 E2E | logout → 访问受保护页面 → 跳转登录页 | E2E 路径缺失 | 0.5h |

## Epic 划分

**Epic 1**: 后端 Cookie 设置（login/register/logout 路由设置/清除 httpOnly cookie）
**Epic 2**: 前端一致性（authStore logout 清理 + httpClient 双保险）
**Epic 3**: 测试覆盖（middleware + E2E 完整路径）

## 方案决策

- **推荐方案**: Option A（修复 Cookie 设置 + 前端一致性）
- **方案理由**: 解决架构性断裂，middleware 和前端行为一致；httpOnly cookie 防 XSS；双保险
- **不采用**: Option B（纯前端手动写 cookie，XSS 风险高）；Option C（移除 middleware cookie 依赖，破坏性变更，超出 scope）
