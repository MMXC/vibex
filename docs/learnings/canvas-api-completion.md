# 经验沉淀: canvas-api-completion

> **项目**: canvas-api-completion
> **完成时间**: 2026-04-05
> **沉淀时间**: 2026-04-05 15:15

---

## 问题描述

Canvas 功能缺少完整的 REST API 支持：Flows CRUD API 和 Snapshot API 未实现。

## 解决方案

### E1 (Flows CRUD API) ✅
- `/api/v1/canvas/flows` REST API 实现
- GET list / POST create / GET/:id / PUT/:id / DELETE/:id
- Hono + D1，protected route，pagination，FlowData JSON columns
- 14 个单元测试全部通过

### E2 (Snapshot API) ✅
- `/api/v1/canvas/snapshots` REST API 实现
- 18 个 snapshot 单元测试
- 修复了 Route 顺序问题（GET /latest 在 GET /:id 之前）
- 修复了版本冲突判断（< 改为 <=）

## 关键教训

### 1. Route 顺序敏感性问题
**发现**: Hono 中 `GET /latest` 必须放在 `GET /:id` 之前，否则 `/latest` 会被 `:id` 匹配为 `id=latest`。

**防范**: 所有 REST API 在设计时必须标注 route 匹配优先级，测试覆盖要包含边界路径（如 `/latest`、`/first` 等特殊路径）。

### 2. Snapshot 测试的 Snapshot Testing 价值
**发现**: Snapshot API 的 18 个测试用例验证了 `expect().toMatchSnapshot()` 模式的有效性。

**防范**: 对于结构化数据 API（JSON 响应），snapshot testing 比手动断言更高效，建议作为 API 测试的默认模式。

### 3. 子项目目录结构
**发现**: 多个提案共享 `proposals/20260405-1321/` 目录，通过子目录区分项目。

**经验**: 统一提案目录结构便于跨项目参考和汇总，但会导致目录名包含时间戳（不够语义化）。

---

## 跨项目高阶模式

待沉淀到 MEMORY.md
