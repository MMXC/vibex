# Planning Feature List — vibex-canvas-404-post-project

**产出日期**: 2026-04-16
**来源**: analysis.md
**规划人**: PM

---

## 背景

`POST /api/v1/canvas/project` 返回 404，实际运行的是 Legacy Hono (`src/routes/v1/canvas/index.ts`)，其中没有 `POST /project` handler。App Router 的 `src/app/api/v1/canvas/project/route.ts` 存在但从未接入 Workers 网关。

---

## Feature List

| ID | 功能名 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|----------|----------|
| F1 | 在 Legacy Hono 中添加 POST /project handler | 在 canvas/index.ts 中添加与 generate-* 风格一致的 handler | Legacy Hono 中无 POST /project 端点 | 1.5 小时 |
| F2 | 认证中间件集成 | handler 中复用现有 authMiddleware，认证失败返回 401 | 认证流程需与现有端点一致 | 15 分钟 |
| F3 | D1 数据库操作 | 创建 project + contexts + flows + components 关联数据 | 需要将 App Router 的 D1 逻辑迁移到 Hono | 1 小时 |
| F4 | 验证 API 返回正确状态码 | POST 成功返回 201，缺少字段返回 400 | 确保端点行为符合 REST 规范 | 30 分钟 |

---

## Epic/Story 映射

| Epic | Story | 描述 | 工时 |
|------|-------|------|------|
| E1: 端点实现 | S1.1 | 在 canvas/index.ts 中添加 POST /project handler | 1.5 小时 |
| E1: 端点实现 | S1.2 | 复用 authMiddleware，认证失败返回 401 | 15 分钟 |
| E1: 端点实现 | S1.3 | D1 操作：创建 project + 关联数据 | 1 小时 |
| E2: 验收测试 | S2.1 | 验证 201/400/401 状态码，响应体结构正确 | 30 分钟 |

---

*Planning 完成时间: 2026-04-16 09:00*
