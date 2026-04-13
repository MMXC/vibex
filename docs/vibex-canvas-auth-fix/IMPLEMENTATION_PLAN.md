# vibex-canvas-auth-fix — Implementation Plan

**项目**: vibex-canvas-auth-fix
**阶段**: Phase 1 — design-architecture (IMPLEMENTATION_PLAN)
**作者**: Architect
**日期**: 2026-04-13

---

## 1. 实施概述

基于 `architecture.md` 的技术设计，本计划将 4 个 Story 拆解为可执行的任务步骤。

### Epic F11 — 版本历史 401 修复

| ID | Story | 工时 | 依赖 | 优先级 |
|----|-------|------|------|--------|
| F11.1 | CanvasPage 接入确认 | 0h | — | P0 |
| F11.2 | 401 错误 UI 层差异化展示 | 0.5h | F11.1 | P0 |
| F11.3 | CORS 预检验证 | 0.5h | — | P1 |
| F11.4 | 端到端测试 | 1.0h | F11.2+F11.3 | P0 |

**总工时**: 2.0h（纯开发）+ 0.5h（CORS 验证）= 约 2.5h

---

## 2. 任务分解

### Task F11.1: CanvasPage 接入确认（0h）

**目标**: 确认 `canvas/page.tsx` 已正确接入 `VersionHistoryPanel` 和 `useVersionHistory`

**代码审查**:
```
vibex-fronted/src/components/canvas/CanvasPage.tsx:
  ✅ import { useVersionHistory } from '@/hooks/canvas/useVersionHistory'
  ✅ const versionHistory = useVersionHistory()
  ✅ <ProjectBar ... onOpenHistory={versionHistory.open} />
  ✅ <VersionHistoryPanel open={versionHistory.isOpen} onClose={versionHistory.close} />
```

**验收标准** ✅:
- [x] `import { useVersionHistory }` ✅ (CanvasPage.tsx:75)
- [x] `const versionHistory = useVersionHistory()` ✅ (CanvasPage.tsx:202)
- [x] `onOpenHistory={versionHistory.open}` ✅ (CanvasPage.tsx:514)
- [x] `<VersionHistoryPanel open={...} onClose={...}>` ✅ (CanvasPage.tsx:795-797)

**F11.1 确认结论**: CanvasPage 已正确接入 VersionHistoryPanel，无需开发，纯审查通过 ✅

---

### Task F11.2: 401 错误 UI 层差异化展示（0.5h）

#### F11.2.1: 修改 `useVersionHistory.ts`（15min）

**文件**: `vibex-fronted/src/hooks/canvas/useVersionHistory.ts`

**改动**:

```diff
export interface UseVersionHistoryReturn {
  // ...existing fields
+  /** 新增：最近一次加载/操作错误消息 */
+  error: string | null;
}

export function useVersionHistory(): UseVersionHistoryReturn {
  const [snapshots, setSnapshots] = useState<CanvasSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<CanvasSnapshot | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [creating, setCreating] = useState(false);
+  const [error, setError] = useState<string | null>(null);
```

**loadSnapshots catch block**:
```diff
    } catch (err) {
      canvasLogger.default.error('[useVersionHistory] loadSnapshots error:', err);
+     const msg = err instanceof Error ? err.message : '加载失败，请重试';
+     setError(msg);
    } finally {
      setLoading(false);
    }
```

**createSnapshot catch block**:
```diff
    } catch (err) {
      canvasLogger.default.error('[useVersionHistory] createSnapshot error:', err);
+     const msg = err instanceof Error ? err.message : '创建快照失败，请重试';
+     setError(msg);
      return null;
    }
```

**open() 清除旧错误**:
```diff
  const open = useCallback(() => {
    setIsOpen(true);
+   setError(null); // ← 打开时清除旧错误
    loadSnapshots();
  }, [loadSnapshots]);
```

**return 暴露 error**:
```diff
  return {
    snapshots,
    loading,
    isOpen,
    selectedSnapshot,
    open,
    close,
    selectSnapshot,
    loadSnapshots,
    createSnapshot,
    createAiSnapshot,
    restoreSnapshot,
    restoring,
    creating,
+   error, // ← 新增
  };
```

**验收测试**:
- [ ] TypeScript 编译通过（`tsc --noEmit`）
- [ ] 现有 17 个测试通过（`npm test -- --run useVersionHistory`）

---

#### F11.2.2: 修改 `VersionHistoryPanel.tsx`（15min）

**文件**: `vibex-fronted/src/components/canvas/features/VersionHistoryPanel.tsx`

**改动**:

```diff
  const {
    snapshots,
    loading,
    isOpen,
    selectedSnapshot,
    selectSnapshot,
    loadSnapshots,
    createSnapshot,
    restoreSnapshot,
+   error: hookError, // ← 从 hook 读取
  } = useVersionHistory();

  // 保留本地 error state 用于 restoreSnapshot（handler 在组件内）
  const [restoring, setRestoring] = useState(false);  // ← 移到这里（已有）
  const [restoreError, setRestoreError] = useState<string | null>(null);
- const [error, setError] = useState<string | null>(null);  // ← 删除（用 hook error）
```

**Error Banner 渲染位置**（在快照列表上方）:
```tsx
{/* Error banner — 来自 hook（load/create 错误） */}
{hookError && (
  <div className={styles.errorBanner} role="alert">
    <span>❌ {hookError}</span>
  </div>
)}

{/* Restore error — 本地 state */}
{restoreError && (
  <div className={styles.errorBanner} role="alert">
    <span>❌ {restoreError}</span>
  </div>
)}
```

**handleCreate error 移除**（改为依赖 hook error）:
```diff
  const handleCreate = useCallback(async () => {
    setCreating(true);
-   setError(null);
    try {
      await createSnapshot();
    } catch (err) {
-     setError('创建快照失败，请重试');
+     // 错误由 hook error state 管理
      canvasLogger.VersionHistoryPanel.error(' create error:', err);
    } finally {
      setCreating(false);
    }
  }, [createSnapshot]);
```

**验收测试**:
- [ ] 未登录用户看到 "登录已过期，请重新登录" banner
- [ ] 网络/创建失败用户看到对应错误文案 banner
- [ ] 关闭面板后重新打开，error banner 消失
- [ ] 现有 `useVersionHistory` 测试继续通过

---

#### F11.2.3: TypeScript 类型更新（5min）

确保 `UseVersionHistoryReturn` 类型变更在类型定义文件中导出。

```ts
// 如果类型在单独文件定义，确保 error 字段已导出
// 检查路径: vibex-fronted/src/hooks/canvas/useVersionHistory.ts（内联定义，无需额外文件）
```

---

### Task F11.3: CORS 预检验证（0.5h）

#### F11.3.1: curl 验证命令

```bash
# 验证 OPTIONS 预检请求返回 204
curl -X OPTIONS "https://api.vibex.top/api/v1/canvas/snapshots" \
  -H "Origin: https://vibex-app.pages.dev" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,content-type" \
  -i

# 期望: HTTP/2 204 + 含 Authorization 的 CORS headers
```

**验收标准**:
| 检查点 | 期望值 |
|--------|--------|
| HTTP 状态码 | 204 No Content |
| Access-Control-Allow-Origin | `https://vibex-app.pages.dev` 或 `*` |
| Access-Control-Allow-Methods | 含 `GET` |
| Access-Control-Allow-Headers | 含 `authorization` |
| 响应体 | 空（非 401/500） |

**如返回 401**: 需检查 Hono `protected_.options('/*')` 是否包含 Authorization header。

---

### Task F11.4: 端到端测试（1.0h）

#### F11.4.1: 新增 MSW setup（15min）

```bash
# 安装 MSW（如果尚未安装）
cd vibex-fronted
npm install --save-dev msw@^2.7.0
npx msw init public/ --save
```

**新增测试文件**: `src/hooks/canvas/__tests__/useVersionHistory.error.test.ts`

#### F11.4.2: 测试用例实现（45min）

覆盖 8 个场景（T3-T8）：

```ts
describe('useVersionHistory — 401 错误处理', () => {
  // T3: 未登录 401
  it('未登录用户看到"登录已过期，请重新登录" error', async () => {
    server.use(
      rest.get('/api/v1/canvas/snapshots', (req, res, ctx) => {
        return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
      })
    );
    // ...
  });

  // T4: 错误清除
  it('关闭面板后重新打开，error 状态清除', async () => {
    // ...
  });
});

describe('useVersionHistory — 网络错误处理', () => {
  // T8: 网络不可用
  it('网络不可用显示"加载失败，请重试"', async () => {
    server.use(
      rest.get('/api/v1/canvas/snapshots', (req, res) => {
        return res.networkError('Failed to fetch');
      })
    );
    // ...
  });
});

describe('useVersionHistory — 400 错误处理', () => {
  // T7: projectId 为空
  it('无 projectId 参数后端返回 400', async () => {
    server.use(
      rest.get('/api/v1/canvas/snapshots', (req, res, ctx) => {
        if (!req.url.searchParams.get('projectId')) {
          return res(ctx.status(400), ctx.json({ error: 'projectId is required' }));
        }
        return res(ctx.status(200), ctx.json({ success: true, snapshots: [] }));
      })
    );
    // ...
  });
});
```

#### F11.4.3: 回归测试（0min，自动）

```bash
# 运行所有测试
cd vibex-fronted && npm test -- --run

# 预期: 17 个现有测试 + 8 个新增测试 = 25 个测试通过
```

---

## 3. 实施顺序

```
F11.1 (审查) → F11.2 (useVersionHistory.ts + VersionHistoryPanel.tsx) → F11.3 (curl 验证) → F11.4 (测试)
```

**并行任务**: F11.3（CORS 验证）可在 F11.2 开发期间并行执行 curl 测试。

---

## 4. 验收清单

- [ ] F11.1: CanvasPage 已正确接入 VersionHistoryPanel（代码审查）
- [ ] F11.2: `useVersionHistory` 暴露 `error: string | null` 字段
- [ ] F11.2: 未登录用户看到 "登录已过期，请重新登录" banner
- [ ] F11.2: 网络/创建失败用户看到对应错误文案 banner
- [ ] F11.2: 关闭/重开面板，error 状态正确清除
- [ ] F11.2: TypeScript 编译通过
- [ ] F11.2: 现有 17 个 `useVersionHistory` 测试继续通过
- [ ] F11.3: curl OPTIONS 请求返回 HTTP 204
- [ ] F11.3: `Access-Control-Allow-Headers` 包含 `authorization`
- [ ] F11.4: T3-T8 测试全部通过
- [ ] F11.4: 总计 25 个测试通过（17 回归 + 8 新增）

---

## 5. 回滚计划

| 场景 | 回滚操作 |
|------|---------|
| TypeScript 编译失败 | `git checkout -- vibex-fronted/src/hooks/canvas/useVersionHistory.ts` |
| 测试失败 | `git checkout -- vibex-fronted/src/hooks/canvas/__tests__/` |
| 部署后 crash | `npx wrangler rollback` |

---

## 6. 产出文件清单

| 文件 | 动作 |
|------|------|
| `vibex-fronted/src/hooks/canvas/useVersionHistory.ts` | 修改 |
| `vibex-fronted/src/components/canvas/features/VersionHistoryPanel.tsx` | 修改 |
| `vibex-fronted/src/hooks/canvas/__tests__/useVersionHistory.error.test.ts` | 新增 |
| `vibex-fronted/package.json`（如需安装 msw） | 修改（如需） |
