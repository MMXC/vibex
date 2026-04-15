# Implementation Plan: Canvas-Dashboard Project Persistence V2

**Project**: vibex-canvas-dashboard-integration-v2
**Stage**: dev-dev-e5-canvas-dashboard ✅ + dev-tester-e5-canvas-dashboard ✅
**Date**: 2026-04-15
**Status**: ✅ All E5 phases complete
**Commits**: 4090fc26 (API替换) | 7be7ab79 (测试修复) | e78d5794 (changelog更新)

---

## 执行决策

| 决策 | 状态 | 执行项目 | 执行日期 |
|------|------|----------|----------|
| Phase 1 MVP | **待评审** | vibex-canvas-dashboard-integration-v2 | 待定 |

---

## Overview

| 属性 | 值 |
|------|-----|
| 总工时 | 3h |
| 优先级 | P0 |
| 依赖 | PRD → Architecture |
| 风险等级 | 低（V2 已有 error/createdProjectId state + 3 个 TDD 测试） |

---

## Phase 1: Canvas-Dashboard 项目持久化 MVP (3h)

### 1.1 文件清单

| 操作 | 文件 | 说明 |
|------|------|------|
| **修改** | `vibex-fronted/src/components/flow-project/ProjectCreationStep.tsx` | 替换 mock + error UI + 导航 |
| **修改** | `vibex-fronted/src/components/flow-project/ProjectCreationStep.module.css` | error UI 样式 |
| **修改** | `vibex-fronted/src/components/flow-project/__tests__/ProjectCreationStep.test.tsx` | 补充 TC4-TC7 |

### 1.2 步骤

#### Step 1: 添加 import（ProjectCreationStep.tsx 顶部）

```typescript
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
```

#### Step 2: 添加 router hook（组件顶部，after useMachine）

```typescript
const router = useRouter();
```

#### Step 3: 替换 handleCreate

```typescript
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

    send({
      type: 'SET_PROJECT_META',
      meta: {
        name: projectName,
        description: projectDesc,
        techStack: selectedStack,
        createdAt: new Date().toISOString(),
      },
    });

    setCreatedProjectId(created.id);
    setIsCreating(false);
    setIsComplete(true);
    send({ type: 'SAVE' } satisfies FlowEvent);
    router.push(`/project?id=${created.id}`);
  } catch (err) {
    setIsCreating(false);
    setError(err instanceof Error ? err.message : '创建失败，请重试');
  }
};
```

#### Step 4: 添加 error UI（在 `<div className={styles.form}>` 内部，`<button className={styles.createBtn}>` 之前）

```tsx
{error && (
  <div className={styles.errorBanner} role="alert">
    <span className={styles.errorIcon}>⚠</span>
    <span className={styles.errorText}>{error}</span>
    <button
      type="button"
      className={styles.errorClose}
      onClick={() => setError(null)}
      aria-label="关闭"
    >
      ×
    </button>
  </div>
)}
```

#### Step 5: 修改 success 卡片 View Project 按钮

```tsx
<button
  className={styles.viewBtn}
  onClick={() => router.push(`/project?id=${createdProjectId}`)}
>
  View Project →
</button>
```

#### Step 6: 添加 CSS（ProjectCreationStep.module.css 末尾）

```css
/* Error banner */
.errorBanner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
}

.errorIcon {
  font-size: 16px;
  flex-shrink: 0;
}

.errorText {
  flex: 1;
  color: #991b1b;
}

.errorClose {
  background: none;
  border: none;
  color: #dc2626;
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.errorClose:hover {
  color: #991b1b;
}
```

#### Step 7: 补充单元测试（TC4-TC7）

```typescript
// __tests__/ProjectCreationStep.test.tsx — 新增测试

it('shows error message when API call fails', async () => {
  mockCreateProject.mockRejectedValue(new Error('Network error'));
  render(<ProjectCreationStep />);
  const input = screen.getByPlaceholderText(/my-awesome-project/i);
  await act(async () => {
    input.focus();
    input.value = 'Fail Project';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const btn = screen.getByRole('button', { name: /Create Project/i });
  await act(async () => { btn.click(); });
  await waitFor(() => {
    expect(screen.getByRole('alert')).toBeVisible();
  });
});

it('shows "please login" when userId is null', async () => {
  vi.mocked(useAuthStore).mockReturnValue({ user: null });
  render(<ProjectCreationStep />);
  const input = screen.getByPlaceholderText(/my-awesome-project/i);
  await act(async () => {
    input.focus();
    input.value = 'Test';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const btn = screen.getByRole('button', { name: /Create Project/i });
  await act(async () => { btn.click(); });
  await waitFor(() => {
    expect(screen.getByText(/请先登录/)).toBeVisible();
  });
  expect(mockCreateProject).not.toHaveBeenCalled();
});
```

### 1.3 验收标准

- [x] `handleCreate` 调用 `projectApi.createProject()`（替换 `setTimeout(2000)`）
- [x] userId 为 null 时显示 "请先登录"
- [x] API 失败时 error banner 显示错误消息
- [x] API 成功时 `createdProjectId` 写入 state，success 卡片显示
- [x] "View Project →" 按钮可点击并跳转到 `/project?id=xxx`
- [x] TypeScript 编译无错误
- [x] Next.js build 通过

### 1.4 潜在问题

| 问题 | 缓解 |
|------|------|
| `vi.fn<typeof projectApi.createProject>()` 类型不兼容 | 使用 `vi.fn<(args: ProjectCreate[]) => Promise<Project>>()` 精确类型 |
| 测试中 `useAuthStore` mock 返回 null | 单独 mock `vi.mock('@/stores/authStore', ...)` |
| error UI 样式覆盖已有组件 | CSS 已隔离，不影响现有样式 |

---

## 2. Rollback Plan

| 问题 | 回滚方案 |
|------|----------|
| TypeScript 编译失败 | `git checkout -- ProjectCreationStep.tsx` |
| 单元测试失败 | 保留 `setTimeout(2000)`，分步替换 |
| error UI 不显示 | 检查 CSS 是否被其他规则覆盖 |

---

## 3. 测试命令

```bash
# 编译检查
cd vibex-fronted
npx tsc --noEmit src/components/flow-project/ProjectCreationStep.tsx

# 单元测试
npx vitest run src/components/flow-project/__tests__/ProjectCreationStep.test.tsx

# E2E 测试
npx playwright test e2e/canvas-project-creation.spec.ts

# API 手动验证
curl -X POST http://localhost:3001/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"test","description":"test","userId":"user_123"}'
# 期望: HTTP 201
```

---

## 4. Phase 2 预留（不包含在本次范围）

三树数据持久化预计工时 5h，需 Coord 评审后再执行。

---

*Generated by Architect Agent | 2026-04-15*
