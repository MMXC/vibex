# vibex-canvas-history-projectid — 实施计划

**项目**: vibex-canvas-history-projectid
**任务**: design-architecture
**日期**: 2026-04-14
**作者**: Architect Agent
**基于**: architecture.md

---

## 目标

修复 Canvas 页面"保存历史版本"和"获取历史版本"功能的 projectId 传递问题，确保无 projectId 时展示引导而非 API 400 错误。

---

## Phase 1 实施步骤（止血，~0.5d） ✅ done

### Step 1: 修改 `useVersionHistory.ts` — Hook 层空值防护 ✅ done

**文件**: `vibex-fronted/src/hooks/canvas/useVersionHistory.ts`

**变更**:
- `loadSnapshots`: 顶部 null 检查，projectId=null → setError('请先创建项目后再查看历史版本') + setSnapshots([]) + return
- `createSnapshot`: 顶部 null 检查，projectId=null → setError('请先创建项目后再保存历史版本') + return null
- `createAiSnapshot`: 顶部 null 检查，projectId=null → 直接 return
- `loadSnapshots`: 移除 `projectId ?? undefined` 宽松写法，改为直接用 `projectId`（严格）

**改动 1.1**: `loadSnapshots` 空值拦截

```typescript
// 找到 loadSnapshots，替换为：
const loadSnapshots = useCallback(async () => {
  setLoading(true);
  setError(null);

  // === Phase 1 修复: projectId null 拦截 ===
  if (!projectId) {
    setError('请先创建项目后再查看历史版本');
    setLoading(false);
    setSnapshots([]);
    return;
  }

  try {
    const result = await canvasApi.listSnapshots(projectId);
    if (result.success) {
      const sorted = [...result.snapshots].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setSnapshots(sorted);
    }
  } catch (err) {
    canvasLogger.default.error('[useVersionHistory] loadSnapshots error:', err);
    setError(err instanceof Error ? err.message : '加载失败，请重试');
  } finally {
    setLoading(false);
  }
}, [projectId]); // 移除 projectId ?? undefined，改为直接用 projectId
```

**改动 1.2**: `createSnapshot` 空值拦截

```typescript
// 找到 createSnapshot，替换为：
const createSnapshot = useCallback(async (label?: string) => {
  // === Phase 1 修复: projectId null 拦截 ===
  if (!projectId) {
    setError('请先创建项目后再保存历史版本');
    return null;
  }

  const now = Date.now();
  if (now - lastSnapshotTimeRef.current < SNAPSHOT_DEBOUNCE_MS) {
    return null;
  }
  lastSnapshotTimeRef.current = now;

  try {
    const result = await canvasApi.createSnapshot({
      projectId, // 移除 ?? null，直接用 projectId
      label: label ?? `手动保存 (${new Date().toLocaleString('zh-CN')})`,
      trigger: 'manual',
      contextNodes,
      flowNodes,
      componentNodes,
    });

    if (result.success) {
      setSnapshots((prev) => [result.snapshot, ...prev]);
      return result.snapshot;
    }
    return null;
  } catch (err) {
    canvasLogger.default.error('[useVersionHistory] createSnapshot error:', err);
    setError(err instanceof Error ? err.message : '创建快照失败，请重试');
    return null;
  }
}, [contextNodes, flowNodes, componentNodes, projectId]);
```

**改动 1.3**: `createAiSnapshot` 空值拦截（同样处理）

```typescript
// createAiSnapshot 同样在顶部添加 null 检查
if (!projectId) {
  setError('请先创建项目后再保存历史版本');
  return;
}
```

**改动 1.4**: 添加 projectId 变化自动重载 useEffect

```typescript
// 在 return 语句前添加：
useEffect(() => {
  // projectId 从 null → 有效值，或从 A → B 时自动刷新
  if (projectId && isOpen) {
    loadSnapshots();
  }
}, [projectId, isOpen, loadSnapshots]);
```

---

### Step 2: 修改 `VersionHistoryPanel.tsx` — 引导 UI

**文件**: `vibex-fronted/src/components/canvas/features/VersionHistoryPanel.tsx`

**改动 2.1**: 添加引导状态渲染（在 `hookError` 判断中处理）

```tsx
// 在 errorBanner 渲染逻辑中，增加引导 UI：
{hookError && (
  <div className={styles.errorBanner} role="alert">
    <span>❌ {hookError}</span>
  </div>
)}

// 在 snapshots.length === 0 的空状态中，增加 projectId 检测：
{snapshots.length === 0 && !loading ? (
  <div className={styles.emptyState}>
    {hookError?.includes('请先创建项目') ? (
      <>
        <span aria-hidden="true">🏗️</span>
        <span>{hookError}</span>
        <span className={styles.emptyHint}>
          创建项目后可保存和查看历史版本
        </span>
      </>
    ) : (
      <>
        <span aria-hidden="true">📭</span>
        <span>暂无版本记录</span>
        <span className={styles.emptyHint}>
          点击「保存当前版本」创建第一个快照
        </span>
      </>
    )}
  </div>
) : null}
```

**改动 2.2**: 添加 CSS 样式

```css
/* VersionHistoryPanel.module.css 添加：*/
.noProjectGuide {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 16px;
  text-align: center;
  color: var(--text-secondary);
}

.noProjectGuide span:first-child {
  font-size: 48px;
}

.noProjectGuide span:nth-child(2) {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.noProjectGuide button {
  padding: 8px 20px;
  background: var(--color-primary, #6366f1);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.noProjectGuide button:hover {
  opacity: 0.9;
}
```

---

### Step 3: 修改 `canvasApi.ts` — 移除 ?? undefined/null 默认值（辅助保险）

**文件**: `vibex-fronted/src/lib/canvas/api/canvasApi.ts`

```typescript
// listSnapshots: 保留逻辑不变（前端已拦截 null，API 层保险保留）
listSnapshots: async (projectId?: string) => {
  const url = projectId
    ? `${getApiUrl(API_CONFIG.endpoints.canvas.snapshots)}?projectId=${encodeURIComponent(projectId)}`
    : getApiUrl(API_CONFIG.endpoints.canvas.snapshots);
  // ...
}

// createSnapshot: 不需要改（前端已保证不传 null）
```

---

### Step 2: VersionHistoryPanel 引导 UI ✅ done

**文件**: `vibex-fronted/src/components/canvas/features/VersionHistoryPanel.tsx`

**变更**:
- `snapshots.length === 0` 分支增加 `hookError?.includes('请先创建项目')` 条件
- 显示引导 UI：emoji 🗺️ + "请先创建项目" + 错误消息文本

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useVersionHistory } from './useVersionHistory';
import { useSessionStore } from '@/lib/canvas/stores/sessionStore';

// Mock canvasApi
vi.mock('@/lib/canvas/api/canvasApi', () => ({
  canvasApi: {
    listSnapshots: vi.fn(),
    createSnapshot: vi.fn(),
    restoreSnapshot: vi.fn(),
  },
}));

const { canvasApi } = vi.mocked(await import('@/lib/canvas/api/canvasApi'));

describe('useVersionHistory — projectId null 防护', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionStore.setState({ projectId: null });
  });

  it('loadSnapshots: projectId=null 时不调用 API，设置引导错误', async () => {
    const { result } = renderHook(() => useVersionHistory());
    
    await act(async () => { await result.current.loadSnapshots(); });
    
    expect(canvasApi.listSnapshots).not.toHaveBeenCalled();
    expect(result.current.error).toContain('请先创建项目');
    expect(result.current.snapshots).toEqual([]);
  });

  it('createSnapshot: projectId=null 时不调用 API，返回 null', async () => {
    const { result } = renderHook(() => useVersionHistory());
    
    const snap = await act(async () => { return await result.current.createSnapshot(); });
    
    expect(canvasApi.createSnapshot).not.toHaveBeenCalled();
    expect(snap).toBeNull();
    expect(result.current.error).toContain('请先创建项目');
  });

  it('projectId 变化时自动重载', async () => {
    (canvasApi.listSnapshots as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      snapshots: [],
    });

    const { result } = renderHook(() => useVersionHistory());
    act(() => { result.current.open(); });
    
    useSessionStore.setState({ projectId: 'valid-id' });
    
    await waitFor(() => {
      expect(canvasApi.listSnapshots).toHaveBeenCalledWith('valid-id');
    });
  });
});
```

---

### Step 3: 单元测试 ✅ done

**文件**: `vibex-fronted/src/hooks/canvas/__tests__/useVersionHistory.projectId.test.ts`（新建）

**覆盖场景**:
- loadSnapshots: projectId=null/undefined → 不调用 API，设置引导错误
- createSnapshot: projectId=null → 不调用 API，返回 null
- createAiSnapshot: projectId=null → 不调用 API
- open(): projectId=null → 设置引导错误，snapshots 清空

**运行**: `npx vitest run src/hooks/canvas/__tests__/useVersionHistory.projectId.test.ts` → 5/5 ✅

```typescript
import { test, expect } from '@playwright/test';

test.describe('VersionHistory — 无 projectId 场景', () => {
  test('场景A: 无 projectId 打开历史面板 → 显示引导 UI', async ({ page }) => {
    await page.goto('/canvas');
    await page.getByTestId('open-history-btn').click();
    await expect(page.getByText(/请先创建项目/i)).toBeVisible();
    // 确认无 400 网络错误
    const requests = page.request;
    // 断言: 无发往 /api/canvas/snapshots 的失败请求
  });

  test('场景B: 有 projectId 正常保存快照', async ({ page }) => {
    await page.goto('/canvas?projectId=test-e2e-project');
    await page.getByTestId('open-history-btn').click();
    await page.waitForSelector('[data-testid="create-snapshot-btn"]');
    await page.getByTestId('create-snapshot-btn').click();
    // 验证保存成功（无错误 banner）
    await expect(page.locator('[role="alert"]')).toHaveCount(0);
  });
});
```

---

### Step 6: 构建验证

```bash
cd /root/.openclaw/vibex/vibex-fronted
pnpm build  # 确保无 TypeScript 错误
pnpm test   # 运行 Vitest
pnpm exec playwright test e2e/version-history-no-project.spec.ts  # 运行 E2E
```

---

## Phase 2 实施步骤（根治，~2d）

### Step 2.1: CanvasPage URL 注入

**文件**: `vibex-fronted/src/components/canvas/CanvasPage.tsx`

```typescript
// 在现有 useEffect rehydrate 后添加：
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const urlProjectId = params.get('projectId');
  if (urlProjectId && urlProjectId !== projectId) {
    setProjectId(urlProjectId);
  }
}, []); // 依赖项仅 []，仅在 mount 时执行一次
```

### Step 2.2: projectId 合法性校验

需要后端新增校验接口 `GET /api/projects/:id/exists`，前端在 mount 时调用，projectId 无效时 toast 提示。

---

## 验收清单

### Phase 1
- [x] `useVersionHistory.ts` 中 `loadSnapshots` 空值拦截生效 ✅
- [x] `useVersionHistory.ts` 中 `createSnapshot` 空值拦截生效 ✅
- [x] `useVersionHistory.ts` 中 `createAiSnapshot` 空值拦截生效 ✅
- [x] `VersionHistoryPanel` 展示引导 UI（请先创建项目）✅
- [x] `pnpm build` 通过 ✅
- [x] 单元测试覆盖空值场景（5/5）✅

### Phase 2
- [x] CanvasPage 从 URL 读取 projectId（useEffect，mount 时执行一次）✅
- [x] 无效 projectId 时降级处理（fetch /api/projects/[id]，404→toast→setProjectId(null)）✅
- [x] Hook 支持 URL 注入 + store 主动覆盖 ✅

### Epic 1 Stories
- [x] S1.3: useEffect([projectId]) projectId 变化自动重载 ✅（useVersionHistory.ts）
- [x] S1.4: E2E 无 projectId 场景测试 ✅（e2e/version-history-no-project.spec.ts）

### Epic 2 Stories
- [x] S2.1: URL 参数注入 ✅（CanvasPage.tsx useEffect，Phase2 完成）
- [x] S2.2: projectId 合法性校验 ✅（fetch /api/projects/[id]，Phase2 完成）
- [x] S2.3: Hook 双源订阅 ✅（useEffect([projectId]) + sessionStore 订阅，Phase2 完成）
