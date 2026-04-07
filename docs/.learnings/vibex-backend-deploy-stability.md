# learnings: vibex-backend-deploy-stability

## 项目信息
- **名称**: vibex-backend-deploy-stability
- **目标**: 修复 Cloudflare Workers 后端部署稳定性问题
- **完成时间**: 2026-04-05
- **工期**: Phase1 分析 + Phase2 E1-E4 开发
- **结果**: ✅ 已完成

## 问题根因
| Epic | 问题 | 根因 |
|------|------|------|
| E1 SSE超时 | Worker 挂死，内存泄漏 | `aiService.chat()` 无超时，signal 未传递 |
| E2 CacheAPI限流 | 多 Worker 不共享限流计数 | RateLimitStore 用内存 Map |
| E3 Health端点 | 无法验证部署状态 | 无 /health 端点 |
| E4 Prisma条件加载 | PrismaClient 不适配 Workers | 全局 import 导致打包进 bundle |

## 关键修复
- E1: `AbortController.timeout(10000)` + `setTimeout` 清理
- E2: `caches.default` (Cloudflare Cache API) 跨 Worker 共享
- E3: Hono 路由注册 `GET /health`
- E4: `process.env.NODE_ENV` 检测 + D1 API fallback

## 经验教训
1. SSE 流必须有 AbortController 超时兜底
2. Workers 环境不能依赖内存状态，跨 Worker 必须用 Cache API
3. PrismaClient 在 Workers 只能 dev 加载，prod 用 `env.DB.prepare()`
4. /health 端点是 P1 基础设施，必须优先实现

## Epic 统计
| Epic | Commit | Changelog | 合并 |
|------|--------|-----------|------|
| E1 SSE超时 | `ac6c5b91` | ✅ | ✅ |
| E2 CacheAPI | `571e4c52` | ✅ | ✅ |
| E3 Health | `07bf360f` | ✅ | ✅ |
| E4 Prisma | `dfd08889` | ✅ | ✅ |
