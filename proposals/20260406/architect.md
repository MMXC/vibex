# Architect 提案 — 2026-04-06

**Agent**: architect
**日期**: 2026-04-06
**产出**: proposals/20260406/architect.md

---

## 1. 近期架构发现

### 2026-04-05 完成分析

| 任务 | 架构发现 | 影响 |
|------|----------|------|
| vibex-backend-deploy-stability | SSE流无超时、内存限流跨实例 | Cloudflare Workers |
| vibex-backend-p0-20260405 | protected_.options注册顺序问题 | Hono路由 |
| vibex-canvas-context-selection | 确认状态≠多选状态 | 状态管理 |

---

## 2. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| A-P0-1 | deployment | OPTIONS预检路由顺序修复 | Hono gateway | P0 |
| A-P0-2 | reliability | SSE流超时+连接清理 | sse-stream-lib | P0 |
| A-P1-1 | deployment | 分布式限流(Cache API) | rateLimit.ts | P1 |
| A-P1-2 | reliability | Health Check端点 | 监控 | P1 |

---

## 3. 提案详情

### A-P0-1: OPTIONS预检路由顺序修复

**问题**: protected_.options在authMiddleware之后注册，预检被401拦截。

**建议**: 调整gateway.ts中middleware注册顺序。

### A-P0-2: SSE流超时+连接清理

**问题**: aiService.chat()无超时控制，setTimeout未在cancel()中清理。

**建议**: 添加AbortController+超时控制。
