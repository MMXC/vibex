# learnings: vibex-backend-p0-20260405

## 项目信息
- **名称**: vibex-backend-p0-20260405
- **目标**: 修复 VibeX 后端服务不可达问题（OPTIONS 返回 HTTP 500，Cloudflare 1101）
- **完成时间**: 2026-04-05
- **工期**: Phase1 分析 + Phase2 E1-E3 开发
- **结果**: ✅ 已完成并合并至 origin/main

## 问题根因
1. **E1**: gateway.ts 中 `protected_.options('/*')` 在 authMiddleware **之后**注册 → preflight 请求被拦截
2. **E2.1**: index.ts 无全局 OPTIONS handler → 其他路由 preflight 失败
3. **E2.2**: NODE_ENV 缺失导致 PrismaClient 在 Workers 环境报错
4. **E2.3**: JWT_SECRET 未配置时错误消息不含操作指引

## 关键决策
- Cloudflare 1101 = 源站不可达，本质是 OPTIONS 预检请求未正确处理导致 CORS 失败
- 修复策略：分层处理 — 全局 handler (E2.1) + 特定路由修复 (E1) + 环境检测 (E2.2) + 错误优化 (E2.3)

## 经验教训
1. CORS preflight 必须放在 authMiddleware **之前**注册
2. Workers 环境不认 `process.env.NODE_ENV`，需用 `isWorkers()` 检测
3. JWT_SECRET 缺失应给出清晰的操作指引（`wrangler secret put`）
4. CI 中 OPTIONS 请求失败会导致整个 API 不可用（P0 问题）

## Epic 统计
| Epic | Dev Commit | 测试 | 合并 |
|------|-----------|------|------|
| E1 OPTIONS顺序 | `9d915fe9` | ✅ | ✅ |
| E2.1 全局CORS | `2b0d72b8` | ✅ | ✅ |
| E2.2 NODE_ENV | `2b0d72b8` | ✅ | ✅ |
| E2.3 JWT错误码 | `2b0d72b8` | ✅ | ✅ |
