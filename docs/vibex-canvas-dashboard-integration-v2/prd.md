# PRD: Canvas-Dashboard 项目持久化集成 V2

**Project**: vibex-canvas-dashboard-integration-v2
**Stage**: create-prd
**PM**: PM
**Date**: 2026-04-15
**Status**: Draft

---

## 1. 执行摘要

### 背景

当前 `ProjectCreationStep.handleCreate()` 是 mock 实现（`setTimeout(2000)`），导致：
1. 创建的项目不持久化
2. Dashboard 看不到新项目
3. "View Project →" 按钮无路由功能

**V2 与 V1 的关键差异**：V2 已具备更好的实现起点——`error`/`createdProjectId` state 已存在，3 个单元测试已编写（但 handleCreate 仍是 mock）。

⚠️ **P0 风险**：`error` state 已定义但无 UI 渲染，API 失败时用户看不到任何提示。

### 目标

| 阶段 | 目标 | 方案 |
|------|------|------|
| Phase 1 | handleCreate 调用真实 API，打通创建→Dashboard 全链路 | Option A — `projectApi.createProject()` |
| Phase 2 | 三树数据随项目一并保存 | Epic 5 端点双写（待 Coord 评审） |

### 成功指标

| 指标 | 目标值 |
|------|--------|
| 单元测试通过率 | 3/3 PASS |
| API 调用正确性 | POST `/api/v1/projects` 返回 201 |
| Dashboard 刷新 | 新项目创建后 3s 内出现在列表 |
| 错误提示 | 失败时显示 error UI，非 alert |
| 导航正确性 | 100% 跳转到 `/project?id={projectId}` |

---

## 2. Epic 拆分

### Epic E5: Canvas-Dashboard 项目持久化（Phase 1）

**目标**: 将 `handleCreate` mock 替换为真实 API 调用，实现创建→持久化→Dashboard 显示全链路。

**工时**: 3h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S5.1 | handleCreate API 调用 | `await projectApi.createProject()` 替换 `setTimeout` | API 调用成功返回 201 |
| S5.2 | userId 获取 | 从 `useAuthStore.getState().user?.id` 取 userId | userId 正确传入 API |
| S5.3 | createdProjectId 写入 | 成功后 `setCreatedProjectId(created.id)` | state 正确写入 |
| S5.4 | 成功导航 | `router.push('/project?id={createdProjectId}')` | 页面跳转到正确 URL |
| S5.5 | error UI 渲染 | 失败时显示错误提示（非 alert） | ⚠️ P0: error state 无 UI 是当前最高风险 |
| S5.6 | 单元测试通过 | 3 个测试用例全部 PASS | `vitest ProjectCreationStep.test.tsx` |
| S5.7 | E2E 端到端验证 | Canvas 创建 → Dashboard 可见全链路 | Playwright E2E |

---

### Epic E6: Canvas 三树数据持久化（Phase 2，待定）

**目标**: 将 contexts, flows, components 三树数据随项目一并保存，在 Dashboard 打开项目时恢复。

**工时**: 5h | **优先级**: P1（待 Coord 评审后执行）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S6.1 | canvasProject 双写 | `/api/v1/canvas/project` 同步写 project + canvasProject | projectId 关联正确 |
| S6.2 | 三树数据加载 | Dashboard 打开项目时加载已保存的三树数据 | Canvas 状态完整恢复 |
| S6.3 | 加载状态 UI | 加载中显示 skeleton/spinner | 体验良好 |

---

### Epic 总览

| Epic | 描述 | 工时 | 优先级 | 状态 |
|------|------|------|--------|------|
| E5 | Canvas-Dashboard 项目持久化（Phase 1） | 3h | P0 | 本次范围 |
| E6 | Canvas 三树数据持久化（Phase 2） | 5h | P1 | 待 Coord 评审 |
| **Total** | | **8h** | | |

---

## 3. 功能点与验收标准

### Epic E5 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.1 | handleCreate API 调用 | `handleCreate` 调用 `projectApi.createProject({ name, description, userId })` 替代 `setTimeout(2000)` | `expect(mockCreateProject).toHaveBeenCalledWith(expect.objectContaining({ name: 'Test Project', userId: 'test-user-1' }))` | 【需页面集成】`components/flow-project/ProjectCreationStep.tsx` |
| F5.2 | userId 获取 | 从 `useAuthStore.getState().user?.id` 获取 userId | `expect(userId).toBeTruthy()` | 【需页面集成】同上 |
| F5.3 | createdProjectId 写入 | API 成功后 `setCreatedProjectId(created.id)` | `expect(screen.queryByText(/View Project/)).toBeTruthy()` 在成功状态后 | 【需页面集成】同上 |
| F5.4 | 成功导航 | `router.push('/project?id={createdProjectId}')` | `expect(router.push).toHaveBeenCalledWith('/project?id=proj-123')` | 【需页面集成】同上 |
| F5.5 | error UI 渲染 | `error` state 非 null 时显示错误提示（非 alert） | `expect(screen.getByText(/创建失败\|Network error/)).toBeVisible()` | 【需页面集成】同上 |
| F5.6 | 加载状态 | 创建中按钮显示 "Creating Project..."，禁用点击 | `expect(screen.getByRole('button', { name: /Creating Project/i })).toBeDisabled()` | 【需页面集成】同上 |
| F5.7 | 空名不调用 API | `projectName` 为空时 `handleCreate` 直接 return | `expect(mockCreateProject).not.toHaveBeenCalled()` | 【需页面集成】同上 |
| F5.8 | E2E 端到端 | Canvas 创建 → Dashboard 可见 | `expect(page.goto('/dashboard')).toContain('Test Project')` | 【需页面集成】`app/dashboard/page.tsx` |

### Epic E6 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F6.1 | canvasProject + project 双写 | `/api/v1/canvas/project` 创建 canvasProject 时同步写 project | `expect(project.canvasProject).toBeDefined()` | 【需页面集成】`vibex-backend/src/app/api/v1/canvas/project/route.ts` |
| F6.2 | 三树数据加载 | Dashboard 打开项目时从 canvasProject 加载三树 | `expect(canvasStore.contexts).toEqual(savedContexts)` | 【需页面集成】`app/project/page.tsx` |
| F6.3 | 加载状态 UI | 加载中显示 skeleton/spinner | `expect(screen.getByTestId('canvas-loading')).toBeVisible()` | 【需页面集成】同上 |

---

## 4. 验收标准汇总

| ID | Given | When | Then | 优先级 |
|----|-------|------|------|--------|
| AC1 | `handleCreate` | 点击"Create Project" | `projectApi.createProject()` 被调用，`userId` 正确传入 | P0 |
| AC2 | API 返回 201 | `handleCreate` 执行完成 | `createdProjectId` 写入 state，`isComplete=true` | P0 |
| AC3 | 创建成功 | 成功卡片渲染后点击"View Project →" | `router.push('/project?id={createdProjectId}')` 被调用 | P0 |
| AC4 | API 失败 | `projectApi.createProject()` 抛出异常 | `error` state 非 null，UI 显示错误提示（非 alert） | P0 |
| AC5 | 创建中 | `isCreating=true` | 按钮禁用，显示 "Creating Project..." | P0 |
| AC6 | `projectName` 为空 | 点击"Create Project" | API 不被调用，按钮禁用 | P0 |
| AC7 | Dashboard | 新项目创建后 | 3s 内出现在项目列表（cache invalidation） | P0 |
| AC8 | 单元测试 | 运行 `vitest ProjectCreationStep.test.tsx` | 3/3 PASS | P0 |
| AC9 | E2E | Canvas 创建项目后 | Dashboard 页面包含新项目名称 | P0 |
| AC10 | Phase 2（待定） | canvasProject 创建 | 同步创建 project 记录并关联 | P1 |
| AC11 | Phase 2（待定） | Dashboard 打开已保存项目 | Canvas 加载已保存的 contexts, flows, components | P1 |

---

## 5. DoD (Definition of Done)

### Epic E5 Definition of Done

- [ ] `handleCreate` 调用 `projectApi.createProject()`（mock `setTimeout(2000)` 已移除）
- [ ] `userId` 从 `useAuthStore.getState().user?.id` 正确获取并传入 API
- [ ] 成功后 `setCreatedProjectId(created.id)` 写入 state
- [ ] 成功后 `router.push('/project?id={createdProjectId}')` 跳转正确
- [ ] `error` state 有 UI 渲染——错误消息在表单或按钮区域显示（非 alert）
- [ ] `isCreating` 时按钮禁用，显示 "Creating Project..."
- [ ] 3 个单元测试全部通过（`vitest ProjectCreationStep.test.tsx`）
- [ ] E2E 端到端全链路验证通过（Canvas 创建 → Dashboard 可见）

### Epic E6 Definition of Done

- [ ] `/api/v1/canvas/project` 创建 canvasProject 时同步写 project
- [ ] Dashboard 打开项目时 Canvas 加载已保存的三树状态
- [ ] 加载中显示 skeleton/spinner
- [ ] 三树数据加载后 Canvas 状态完整恢复

---

## 6. 依赖

| 依赖 | 说明 | 状态 |
|------|------|------|
| `projectApi.createProject()` | 前端 API 封装 | ✅ 已实现 |
| `/api/v1/projects` POST | 后端端点 | ✅ 已实现 |
| `useAuthStore` | 认证状态 | ✅ 已实现（测试 mock 确定结构） |
| `flowMachine` | Canvas 状态管理 | ✅ 已实现 |
| 3 个单元测试 | ProjectCreationStep.test.tsx | ✅ 已编写（mock 已锁 API 签名） |
| `useRouter` | Next.js 路由 | ⚠️ 需确认已安装/引入 |
| Toast/error 组件 | 错误提示 UI | ⚠️ 当前无 error UI，需实现 |
| `useProjects` + React Query | Dashboard 数据层 | ✅ 已实现 |

---

## 7. Open Questions

| 问题 | 状态 | 说明 |
|------|------|------|
| error UI 用什么组件？ | 待实现决策 | 分析报告未指定，可选：inline text / toast / banner |
| `useRouter` 是否已在组件中引入？ | 待确认 | 需检查现有 import |
| `useAuthStore` 真实 user 字段结构 | 待确认 | 测试 mock 假设 `{ id: 'test-user-1' }` |
| E2E 测试文件位置 | 待决策 | 放在 `e2e/` 目录哪个文件？ |
