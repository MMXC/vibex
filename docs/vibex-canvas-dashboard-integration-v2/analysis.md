# Analysis: Canvas-Dashboard 项目创建集成 V2

**Project:** vibex-canvas-dashboard-integration-v2  
**Stage:** analyze-requirements  
**Author:** analyst  
**Date:** 2026-04-15  
**Status:** ✅ Complete

---

## 0. Research Summary

### 与 V1 的关系

本分析基于 V1（`docs/vibex-internal-tools/analysis.md`）完成，核心发现与 V1 一致：
- `ProjectCreationStep.handleCreate()` 是 mock（`setTimeout(2000)`）
- `projectApi.createProject()` 已就绪，签名：`{ name, description, userId }`
- `/api/v1/projects` POST 后端端点已实现
- Dashboard `useProjects` + React Query 数据层已就绪

### V2 新增上下文

| 发现 | 说明 |
|------|------|
| `ProjectCreationStep.tsx` 已有 `error` 和 `createdProjectId` state | 实现起点已备（2 行 git diff） |
| 测试文件已写好 | `__tests__/ProjectCreationStep.test.tsx` 假设调用 `projectApi.createProject()` |
| 测试覆盖 3 个 case | 成功调用 / 失败提示 / 空名不请求 |
| mock 仍未替换 | 测试已写但 `handleCreate` 仍用 `setTimeout(2000)` |

### 根因确认

V1 分析结论仍然成立：**Canvas 项目创建从未真正落地**。V2 在 V1 基础上有了明确的 TDD 起点，但 `handleCreate` 核心逻辑未动。

---

## 1. Business Scenario

### 用户旅程（现状 + 目标）

```
【现状】
Canvas 画布页
  → 点击"创建项目" → ProjectCreationStep（填项目名+技术栈）
  → 点击"Create Project →"
  → 2 秒 mock 等待 → 显示成功卡片
  → 点击"View Project →" → 无效按钮（无路由）
  → 手动去 Dashboard → 新项目不存在 ❌

【目标】
Canvas 画布页
  → 点击"创建项目" → ProjectCreationStep
  → 点击"Create Project →"
  → 调用 projectApi.createProject() → 201 返回
  → 显示成功卡片，createdProjectId 写入 state
  → "View Project →" 链接指向 /project?id={createdProjectId}
  → Dashboard 项目列表已自动刷新 ✅
```

### JTBD（Jobs-To-Be-Done）

| # | Job | 优先级 | 对应 V1 |
|---|-----|--------|---------|
| J1 | 用户在 Canvas 填写项目信息后，项目能持久化并出现在 Dashboard 项目列表中 | P0 | J1 |
| J2 | Canvas 创建项目后，能直接跳转到该项目的详情页 | P0 | J2 |
| J3 | 创建失败时，用户看到明确的错误提示而非沉默失败 | P1 | 隐含在 AC4 |
| J4 | Dashboard 在新项目创建后能自动刷新 | P1 | J4（React Query invalidate） |

---

## 2. Technical Situation

### 现有能力盘点

| 能力 | 状态 | 位置 |
|------|------|------|
| `projectApi.createProject()` 前端 API | ✅ 已实现 | `services/api/modules/project.ts` |
| `/api/v1/projects` POST 后端端点 | ✅ 已实现 | `vibex-backend/src/app/api/v1/projects/route.ts` |
| `useProjects` + React Query | ✅ 已实现 | `hooks/queries/useProjects.ts` |
| `ProjectCreationStep` UI | ✅ 已实现 | `components/flow-project/ProjectCreationStep.tsx` |
| 错误 state + createdProjectId state | ✅ 已添加 | 同上（2 行 diff） |
| 单元测试（3 cases） | ✅ 已编写 | `__tests__/ProjectCreationStep.test.tsx` |
| `handleCreate` 真实 API 调用 | ❌ 未实现 | — |
| 成功后的 createdProjectId 写入 state | ❌ 未实现 | — |
| "View Project →" 按钮路由跳转 | ❌ 未实现 | — |
| React Router / Link 跳转 | ❌ 未实现 | — |

### V2 相比 V1 的关键差异

V2 的 TDD 测试已先于实现存在。测试文件的 mock 和断言是事实上的规格：

```typescript
// 测试已假设的 API 调用
projectApi.createProject(expect.objectContaining({
  name: 'Test Project',
  description: undefined,
  userId: 'test-user-1',
}));

// 错误时显示 "创建失败|Network error|Failed to fetch"
```

这意味着 V2 的实现必须：
1. 调用 `projectApi.createProject()`（非 canvas 专属端点）
2. 从 `useAuthStore` 获取 `userId`
3. 失败时设置 `error` state
4. 成功后设置 `createdProjectId`

---

## 3. Solution Options

### Option A: 直接替换 — `handleCreate` 调用 `projectApi.createProject()`（V2 方向）

**思路：** 保持 TDD 测试方向不变，替换 `handleCreate` 的 mock `setTimeout` 为真实 API 调用。

```typescript
const handleCreate = async () => {
  if (!projectName.trim()) return;
  setIsCreating(true);
  setError(null);

  try {
    const userId = useAuthStore.getState().user?.id; // 或从 authStore 取
    const created = await projectApi.createProject({
      name: projectName,
      description: projectDesc,
      userId,
    });
    setCreatedProjectId(created.id);
    send({ type: 'SET_PROJECT_META', meta: { name: projectName, description: projectDesc, createdAt: new Date().toISOString() } } satisfies FlowEvent);
    setIsComplete(true);
    send({ type: 'SAVE' } satisfies FlowEvent);
  } catch (err) {
    setError(err instanceof Error ? err.message : '创建失败，请重试');
  } finally {
    setIsCreating(false);
  }
};
```

"View Project →" 按钮改为 `<Link href={/project?id=${createdProjectId}}>` 或 `router.push()`。

**工时估算：** 2-3h（实现 + 测试通过 + QA）

---

### Option B: 完整 Epic 5 端点 — 调用 `/api/v1/canvas/project`

**思路：** 用 Epic 5 的 canvas 专属端点，保存完整三树数据，同时关联标准 project。

**问题：** Epic 5 端点签名与 `flowMachine.context` 不对齐，需要额外数据映射层。

**工时估算：** 4-6h（后端修改 + 前端适配 + 测试）

---

## 4. Recommended Solution

**推荐 Option A。**

理由：
1. V2 测试文件已锁定 Option A 方向——`projectApi.createProject()` 调用，userId 从 authStore 取
2. 与 Dashboard 完全兼容（同数据源）
3. 工时最短（2-3h），ROI 最高
4. Option B 的三树数据保存属于 Phase 2，不应阻塞核心路径

---

## 5. Preliminary Risk Identification

| 风险 | 影响 | 可能性 | 缓解 |
|------|------|--------|------|
| `useAuthStore` 无 `user` 时 `userId` 为 `undefined` → API 400 | 高 | 低 | authStore 已有保护；测试 mock 已处理 |
| 创建成功后 React Query 未 invalidate → Dashboard 不刷新 | 中 | 低 | `projectApi.createProject()` 已调用 cache.remove |
| "View Project →" 按钮在 `isComplete=false` 时渲染异常 | 低 | 中 | 按钮已包裹在 `if (isComplete)` 分支内 |
| `error` state 在 UI 中无渲染 | 高 | 高 | ⚠️ **必须补 UI 渲染逻辑**（见 AC5） |
| V2 测试依赖 `useAuthStore` mock，但 authStore 真实实现未知 | 中 | 中 | 先运行现有测试，看 mock 是否匹配真实 API |

---

## 6. Acceptance Criteria

### Phase 1（必须验收）

- [ ] **AC1:** `handleCreate` 调用 `projectApi.createProject()` 并正确传递 `{ name, description, userId }`（由现有测试 `ProjectCreationStep.test.tsx` 保证）
- [ ] **AC2:** 成功响应后 `createdProjectId` 写入 state，`isComplete=true`
- [ ] **AC3:** "View Project →" 按钮路由到 `/project?id={createdProjectId}`
- [ ] **AC4:** API 失败时 `error` state 被设置（由测试 `shows error message when API call fails` 保证）
- [ ] **AC5:** `error` state 在 UI 中渲染（非 alert，贴近当前 UI 风格的错误提示）
- [ ] **AC6:** Dashboard 项目列表包含新创建的项目（通过 `queryClient.invalidateQueries` 或 API cache invalidation）
- [ ] **AC7:** 现有 3 个单元测试全部通过（`vitest`）
- [ ] **AC8:** E2E 测试覆盖创建全路径（从 Canvas 创建 → Dashboard 可见）

### Phase 2（待定）

- [ ] **AC9:** Canvas 三树数据（contexts, flows, components）随项目保存
- [ ] **AC10:** 从 Dashboard 打开项目时，Canvas 加载已保存的三树状态

---

## 7. Implementation Gap Analysis（相对于已有代码）

| 已有（V2 起点） | 缺失（需要实现） |
|----------------|----------------|
| `error` state | `error` UI 渲染 |
| `createdProjectId` state | `createdProjectId` 写入逻辑 |
| 3 个单元测试 | `handleCreate` 真实逻辑替换 mock |
| `projectApi.createProject()` API | router.push 导航 |
| `useAuthStore` mock | 确认真实 authStore 的 user 字段结构 |

### 最小实现清单（5 项）

1. 替换 `setTimeout(2000)` → `await projectApi.createProject({...})`
2. try/catch 包裹，catch 中 `setError(err.message)`
3. 成功后 `setCreatedProjectId(created.id)` + `setIsComplete(true)`
4. "View Project →" 按钮改为 `<Link href={/project?id=${createdProjectId}}>`
5. 补 `error` 的 UI 渲染（在表单或按钮区域）

---

## 执行决策

- **决策**: 推荐（Phase 1 Option A）
- **执行项目**: vibex-canvas-dashboard-integration-v2
- **执行日期**: 待定
- **执行范围**: 实现 `handleCreate` 真实逻辑 + error UI + 导航链接

---

## 来源

- V1 分析: `docs/vibex-internal-tools/analysis.md`
- 相关 learnings: `docs/learnings/canvas-api-completion.md`, `docs/learnings/canvas-cors-preflight-500.md`
