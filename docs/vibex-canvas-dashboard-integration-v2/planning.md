# Planning: Canvas-Dashboard Integration V2

**Project**: vibex-canvas-dashboard-integration-v2
**Stage**: create-prd (Planning Phase)
**Author**: PM
**Date**: 2026-04-15
**Origin**: docs/vibex-canvas-dashboard-integration-v2/analysis.md

---

## 规划说明

### 推荐方案

**Option A** — 直接替换 `handleCreate` mock 为真实 API 调用。

理由：
1. V2 测试文件已锁定 Option A 方向（`projectApi.createProject()` + authStore userId）
2. 已有 `error` 和 `createdProjectId` state，实现起点优于 V1
3. 工时最短（2-3h），ROI 最高
4. 与 Dashboard 完全兼容（同数据源）

### 关键实现决策

| 决策 | 选型 | 理由 |
|------|------|------|
| API 调用目标 | `projectApi.createProject()` | 测试文件已假设此 API |
| userId 来源 | `useAuthStore.getState().user?.id` | 测试 mock 已锁定此结构 |
| 错误处理 | `setError(err.message)` + UI 渲染 | ⚠️ 当前 `error` state 无 UI 渲染，是 P0 风险 |
| 导航 | `router.push('/project?id={createdProjectId}')` | Dashboard 项目详情页 |
| 测试先决 | 3 个单元测试必须通过 | 测试已存在，是规格的事实来源 |

---

## Feature List

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|----------|----------|
| F5.1 | handleCreate API 替换 | `setTimeout(2000)` → `await projectApi.createProject({ name, description, userId })` | Canvas 创建流程是 mock | 1h |
| F5.2 | userId 获取 | 从 `useAuthStore.getState().user?.id` 获取 userId | userId 获取路径已由测试 mock 确定 | 0.25h |
| F5.3 | createdProjectId 写入 | API 成功后 `setCreatedProjectId(created.id)` | createdProjectId state 存在但未写入 | 0.25h |
| F5.4 | "View Project →" 导航 | 按钮改为 `router.push('/project?id={createdProjectId}')` | 按钮无路由功能 | 0.25h |
| F5.5 | error state UI 渲染 | `error` 不为 null 时显示错误提示（非 alert） | ⚠️ error state 存在但无 UI 渲染（高风险） | 0.5h |
| F5.6 | 单元测试通过 | 3 个测试用例全部 PASS | 测试已写但 handleCreate 仍是 mock | 0.25h |
| F5.7 | E2E 端到端覆盖 | Canvas 创建 → Dashboard 可见全链路验证 | 无 E2E 覆盖 | 0.5h |

---

## Epic 拆分

### Epic E5: Canvas-Dashboard 项目持久化（Phase 1）

**目标**: 将 `handleCreate` mock 替换为真实 API，打通创建→持久化→Dashboard 显示全链路。

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S5.1 | handleCreate API 调用 | `await projectApi.createProject()` 替换 `setTimeout` | 测试 `calls projectApi.createProject when form is submitted` 通过 |
| S5.2 | userId 获取 | 从 authStore 取 userId 传入 API | API 接受 `{ name, description, userId }` |
| S5.3 | createdProjectId 写入 | 成功后 `setCreatedProjectId(created.id)` | 按钮导航用到 createdProjectId |
| S5.4 | 成功导航 | `router.push('/project?id={createdProjectId}')` | 页面跳转到正确 URL |
| S5.5 | error UI 渲染 | 失败时显示错误提示（非 alert） | ⚠️ 高优先级：当前无 UI |
| S5.6 | 单元测试通过 | 3 个测试用例全部 PASS | `vitest ProjectCreationStep.test.tsx` 全绿 |
| S5.7 | E2E 端到端验证 | 创建 → Dashboard 可见 | Playwright E2E 全链路 |

**Epic E5 工时合计**: 3h

---

### Epic E6: Canvas 三树数据持久化（Phase 2，待定）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S6.1 | canvasProject 双写 | Epic 5 端点同步写 project + canvasProject | projectId 关联正确 |
| S6.2 | 三树数据加载 | Dashboard 打开项目时恢复三树 | Canvas 状态完整 |
| S6.3 | 加载状态 UI | skeleton/spinner | 体验良好 |

**Epic E6 工时合计**: 5h（Phase 2 范围）

---

## 工时汇总

| Epic | 工时 | 优先级 | 状态 |
|------|------|--------|------|
| E5 (Phase 1) | 3h | P0 | 本次 PRD 范围 |
| E6 (Phase 2) | 5h | P1 | 待 Coord 评审 |
| **Total** | **8h** | | |

---

## DoD (Definition of Done)

### Epic E5 DoD

- [ ] `handleCreate` 调用 `projectApi.createProject()`（mock 已移除）
- [ ] `userId` 从 `useAuthStore.getState().user?.id` 正确获取
- [ ] 成功后 `setCreatedProjectId(created.id)` 写入
- [ ] `router.push('/project?id={createdProjectId}')` 跳转正确
- [ ] `error` state 有 UI 渲染（非 alert）
- [ ] 3 个单元测试全部通过
- [ ] E2E 端到端全链路验证通过

### Epic E6 DoD

- [ ] canvasProject 创建时同步写 project
- [ ] Dashboard 打开项目时三树数据完整恢复
- [ ] 加载中显示 skeleton/spinner
