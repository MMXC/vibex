# AGENTS.md: Canvas-Dashboard Integration V2 开发约束

**Project**: vibex-canvas-dashboard-integration-v2
**Stage**: agents-constraints
**Date**: 2026-04-15

---

## 开发规范

### 强制规则

1. **禁止修改后端 API 端点**
   - Phase 1 仅修改前端组件，不修改 `/api/v1/projects` 后端端点
   - API 签名 `{name, description, userId}` 已固定

2. **TDD 优先**
   - V2 已有 3 个单元测试（TDD 驱动）
   - 修改 `handleCreate` 前先确认测试断言，确保修改后测试通过
   - 禁止破坏已有测试（TC1-TC3）

3. **error UI 必须实现**
   - AC4（error state 有 UI 渲染）是 P0 风险，**必须实现**
   - 用 inline error banner（非 Toast，非 alert）
   - 贴近表单风格（红色边框，左侧警告图标）

4. **userId 获取路径**
   - 使用 `useAuthStore.getState().user?.id`
   - **不要**用 `getUserId()`（来自 auth-token.ts）—— authStore 是 Zustand 状态，优先级更高
   - 必须 null 检查：`if (!userId) { setError('请先登录'); return; }`

5. **router.push 在 API 调用之后**
   - `router.push` 只在 `try` 块成功路径中调用
   - `catch` 块中**不调用** `router.push`（留在当前页显示错误）

6. **flowMachine 状态在 API 成功后更新**
   - `send({ type: 'SET_PROJECT_META', ... })` 和 `send({ type: 'SAVE' })` 只在 try 块中调用
   - 禁止在 API 调用前更新状态（避免创建失败但状态已脏）

7. **Dashboard 刷新**
   - 不需要手动 `queryClient.invalidateQueries`
   - `projectApi.createProject()` 内部已调用 `cache.remove()`，Dashboard 的 `useProjects()` 自动 refetch

8. **测试 mock 类型安全**
   - `vi.fn<typeof projectApi.createProject>` 可能类型不兼容
   - 使用显式类型：`vi.fn<(args: ProjectCreate[]) => Promise<Project>>()`

---

## 文件修改规则

### handleCreate 实现

```typescript
// ✅ 正确：完整实现
const handleCreate = async () => {
  if (!projectName.trim()) return;
  setIsCreating(true);
  setError(null);

  try {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      setError('请先登录');
      setIsCreating(false);
      return;
    }

    const created = await projectApi.createProject({
      name: projectName,
      description: projectDesc,
      userId,
    });

    send({ type: 'SET_PROJECT_META', meta: {...} });
    setCreatedProjectId(created.id);
    setIsComplete(true);
    send({ type: 'SAVE' } satisfies FlowEvent);
    router.push(`/project?id=${created.id}`);
  } catch (err) {
    setIsCreating(false);
    setError(err instanceof Error ? err.message : '创建失败，请重试');
  }
};

// ❌ 错误：API 调用前更新状态
const handleCreate = async () => {
  send({ type: 'SET_PROJECT_META', ... }); // ❌ 失败时状态已脏
  await projectApi.createProject(...);
};

// ❌ 错误：catch 中路由跳转
catch (err) {
  router.push('/project?id=xxx'); // ❌ 永远不应在 catch 中跳转
}
```

### error UI 渲染

```tsx
// ✅ 正确：inline error banner
{error && (
  <div className={styles.errorBanner} role="alert">
    <span className={styles.errorIcon}>⚠</span>
    <span className={styles.errorText}>{error}</span>
    <button type="button" className={styles.errorClose} onClick={() => setError(null)}>×</button>
  </div>
)}

// ❌ 错误：alert
catch (err) {
  alert(err.message); // ❌ PRD 明确禁止
}

// ❌ 错误：Toast（不适用此场景）
catch (err) {
  showToast(err.message, 'error'); // ❌ 应为 inline error
}
```

### userId 获取

```typescript
// ✅ 正确：useAuthStore Zustand store
import { useAuthStore } from '@/stores/authStore';
const userId = useAuthStore.getState().user?.id;

// ❌ 错误：auth-token lib（返回字符串，可能不一致）
import { getUserId } from '@/lib/auth-token';
const userId = getUserId(); // ❌ 不一致
```

---

## 命名规范

| 实体 | 命名规则 | 示例 |
|------|----------|------|
| CSS class | BEM-ish, `.errorBanner` / `.errorIcon` / `.errorClose` | `.errorBanner` |
| state | camelCase，语义化 | `createdProjectId`（已有） |
| test case | 描述行为 | `it('shows error message when API call fails')` |
| error 消息 | 用户可读，中文 | `'请先登录'`, `'创建失败，请重试'` |

---

## 提交规范

```bash
# Phase 1: handleCreate API 调用
git commit -m "feat(canvas): replace ProjectCreationStep mock with real API

- Call projectApi.createProject() in handleCreate()
- Add useAuthStore.getState().user?.id for userId
- Add inline error banner UI (role=alert)
- Add router.push('/project?id=') on success
- Add createdProjectId state on success
- Update success card View Project button

Closes: vibex-canvas-dashboard-integration-v2"

# 测试补充
git commit -m "test(canvas): add TC4-TC7 unit tests for error/redirect paths

- Add error UI visibility test
- Add 'please login' when userId null test
- Add router.push success redirect test"
```

---

## PR 清单

- [ ] `handleCreate` 调用 `projectApi.createProject()`
- [ ] userId null 检查显示 "请先登录"
- [ ] catch 块中 `setError(err.message)`
- [ ] error banner 在表单内渲染（role=alert）
- [ ] 成功时 `setCreatedProjectId(created.id)` + `setIsComplete(true)`
- [ ] "View Project →" 按钮 `onClick={() => router.push(...)}`
- [ ] 3 个已有测试 + 新增测试全部 PASS
- [ ] TypeScript 编译无错误
- [ ] CSS errorBanner 样式不覆盖其他组件

---

## 依赖项

| 依赖 | 版本要求 | 说明 |
|------|----------|------|
| Next.js | 14+ | App Router, `useRouter` |
| @tanstack/react-query | ^5 | `projectApi` 内部使用 |
| zustand | ^4 | `flowMachine`, `useAuthStore` |
| vitest | latest | 单元测试 |
| playwright | latest | E2E |

---

## 性能要求

| 指标 | 目标 |
|------|------|
| API 调用延迟 | < 500ms |
| 用户感知创建时间 | < 2s（含网络） |
| error UI 渲染 | < 50ms |
| Dashboard 自动刷新 | 0 成本（cache.remove 触发） |

---

## Phase 2 约束（预留）

Phase 2 开始前必须完成：
1. Coord 评审三树数据持久化方案
2. `prisma.canvasProject` + `prisma.project` 双写一致性方案
3. `flowMachine.context` 序列化大小评估

---

*Generated by Architect Agent | 2026-04-15*
