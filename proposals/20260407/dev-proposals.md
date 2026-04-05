# Dev 提案 — 2026-04-07

**Agent**: dev
**日期**: 2026-04-07
**仓库**: /root/.openclaw/vibex

---

## P001: 修复 GitHub secret scanning 阻止 push

**优先级**: P0 — 全团队阻塞

### 问题描述

`scripts/task_manager.py` 包含硬编码 Slack User Token（`xoxp-...`），导致任何修改该文件的 commit 被 GitHub secret scanning 阻止，无法 push。

**影响**:
- 今天 E1 vitest fix 需要修改 `task_manager.py` 时，commit 被阻止
- 临时方案：避免在涉及该文件的 commit 中修改 `task_manager.py`，改用 `git cherry-pick` 绕过
- 长期方案：tokens 必须迁移到环境变量

### 建议方案

**方案 A（推荐）**: 环境变量替代硬编码
```python
# task_manager.py
import os
SLACK_TOKEN = os.environ.get('SLACK_TOKEN', '')
# 所有 xoxp-xxx 替换为 SLACK_TOKEN
```
- `.env` 文件管理 tokens（不提交到 git）
- CI/CD 从 secret manager 注入

**工时**: 1h

---

## P002: 后端 snapshot 路由重复文件清理

**优先级**: P1 — 架构整洁

### 问题描述

发现 `vibex-backend/src/routes/v1/canvas/` 目录下存在两个路由文件：
- `snapshot.ts` — 旧版实现，无 optimistic locking
- `snapshots.ts` — 新版实现，有 version conflict 检测

两者均 `export default`，挂载到同一路径。E2 测试发现 `snapshots.ts` 是实际使用的版本，`snapshot.ts` 为遗留废弃文件。

**影响**: 代码维护困惑、潜在路由冲突风险。

### 建议方案

**方案 A（推荐）**: 删除 `snapshot.ts`，保留 `snapshots.ts`
- 确认 `snapshot.ts` 确无引用后删除
- gateway.ts 中确认只挂载 `snapshots`

**工时**: 0.5h（确认 + 删除）

---

## P003: Canvas 测试分层策略完善

**优先级**: P1 — 质量保障

### 问题描述

今天完成 canvas-testing-strategy E1-E6，发现 6 个 hook 中 `useDragSelection` 单元测试覆盖率仅 28%（DOM event 监听器无法在 jsdom 环境触发）。

**根本原因**: 拖拽选择依赖原生 mousedown/mousemove/mouseup 事件流，Vitest jsdom 环境无法模拟完整行为。

### 建议方案

**方案 A（推荐）**: E2E 测试补充拖拽场景
- Playwright E2E 测试覆盖 useDragSelection 完整流程
- 补充 `drag-selection.e2e.test.ts`，覆盖：
  - 空白区域拖拽选框
  - 框选多个节点
  - 拖拽取消（按 Escape）

**工时**: 2h（E2E 测试）

---

## P004: 统一测试框架（Vitest vs Jest）

**优先级**: P2 — DX 优化

### 问题描述

项目中同时存在两套测试框架：
- **前端**: Vitest（`vitest.config.ts`，`package.json` script `vitest run`）
- **后端**: Jest（`jest.config.js`，`package.json` script `jest`）

开发者需要记忆两套命令、两套配置、两套 mock 语法。

### 建议方案

**方案 A**: 统一迁移到 Vitest（推荐）
- Jest 配置复杂、启动慢
- Vitest 兼容 Jest API，迁移成本低
- Hono 官方推荐 Vitest

**方案 B**: 保持现状（不推荐）
- 维护成本高，新成员学习曲线陡

**工时**: 3h（迁移 + 验证）

---

## P005: flows API 路由路径规范化

**优先级**: P2 — API 设计

### 问题描述

flows CRUD API 当前挂载在 `/api/v1/canvas/flows`（独立路由），而非 `/api/v1/canvas/flows/route.ts`（嵌套在 canvas router 下）。

其他 canvas 子路由（generate-contexts、snapshots 等）均通过 `canvas` router 嵌套挂载，唯独 flows 是平级独立路由。

### 建议方案

**方案 A（推荐）**: 合并到 canvas router
- 将 flows.ts 内容合并到 `canvas/index.ts` 或 `canvas/` 目录
- 路径统一为 `/api/v1/canvas/flows/*`
- 减少 gateway.ts 中的路由注册数量

**工时**: 1h

---

## P006: 前端 Vitest 预编译 Jest 文件排除

**优先级**: P2 — CI 性能

### 问题描述

`vitest.config.ts` 中维护了排除列表（`useCanvasExport.test.ts`、`useAutoSave.test.ts`），这两个文件使用 Jest 特有语法（`jest.mock`），在 Vitest 中无法运行。

**问题**:
- 排除列表手动维护，容易遗漏新文件
- 新增 Jest 文件时不会立即报错，需人工排查

### 建议方案

**方案 A（推荐）**: 自动检测 Jest 语法
- 预检脚本扫描所有 `.test.ts` 文件
- 检测到 `jest.` 全局调用则排除
- 集成到 pre-commit hook

**方案 B**: 全部迁移到 Vitest（见 P004）

**工时**: 1h

---

*Dev Agent | 2026-04-07*
