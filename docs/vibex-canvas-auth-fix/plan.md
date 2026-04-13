# vibex-canvas-auth-fix: 实施计划

**项目**: vibex-canvas-auth-fix
**阶段**: Phase 2 — plan
**分类**: Lightweight（bounded fix, ~2.5h）
**基于**: Solution A（前端 401 差异化提示 + 完善 UI 入口）
**日期**: 2026-04-13

---

## Epic 拆分

### Epic F11 — 版本历史 401 修复

**目标**: 修复用户点击"历史"按钮时因未登录导致的 401 问题，提供清晰的错误提示，并完善 VersionHistoryPanel 的 UI 集成。

**依赖关系**:

```
F11.1 (VersionHistoryPanel 接入)
    ↓
F11.2 (401 错误展示)
    ↓
F11.3 (CORS 验证)
    ↓
F11.4 (端到端测试)
```

---

## Feature 清单

| ID | Feature | 估算工时 | 难度 | 依赖 |
|----|---------|---------|------|------|
| F11.1 | CanvasPage 接入 VersionHistoryPanel | 0.5h | 低 | — |
| F11.2 | 401 错误在 UI 层差异化展示 | 0.5h | 低 | F11.1 |
| F11.3 | CORS 验证（curl 测试） | 0.5h | 低 | — |
| F11.4 | 端到端测试 | 1.0h | 中 | F11.1+F11.2 |

---

## Feature 详情

### F11.1 — CanvasPage 接入 VersionHistoryPanel

**当前状态**: `CanvasPage` 已 import `VersionHistoryPanel` 并渲染，但 `ProjectBar.onOpenHistory` 绑定的是 `versionHistory.open`。hook 已就绪，集成链路已通。

**现状确认**:
- `CanvasPage.tsx` L77-78: `import { useVersionHistory } from '@/hooks/canvas/useVersionHistory'` ✅
- `CanvasPage.tsx` L179: `const versionHistory = useVersionHistory()` ✅
- `CanvasPage.tsx` L305: `<ProjectBar onOpenHistory={versionHistory.open} .../>` ✅
- `CanvasPage.tsx` L430-433: `<VersionHistoryPanel open={versionHistory.isOpen} onClose={versionHistory.close} />` ✅

**结论**: F11.1 已完成，无需额外开发工作。验收以功能测试为准。

**Definition of Done**:
- [ ] 已登录用户在 Canvas 页面点击 ProjectBar 的"历史"按钮 → VersionHistoryPanel 从右侧滑出
- [ ] 面板关闭按钮正常响应

---

### F11.2 — 401 错误在 UI 层差异化展示

**问题**: `loadSnapshots()` 捕获错误后仅 `canvasLogger.default.error()` 打印，UI 层无 error 状态展示。用户看到加载失败但无明确原因。

**当前代码** (`useVersionHistory.ts` L75-86):
```ts
const loadSnapshots = useCallback(async () => {
  setLoading(true);
  try {
    const result = await canvasApi.listSnapshots(projectId ?? undefined);
    if (result.success) { ... }
  } catch (err) {
    canvasLogger.default.error('[useVersionHistory] loadSnapshots error:', err);
    // ⚠️ error 未暴露给 UI
  } finally {
    setLoading(false);
  }
}, [projectId]);
```

**当前 `canvasApi.handleResponseError` 逻辑** (`canvasApi.ts` L144-155):
```ts
if (res.status === 401) {
  sessionStorage.removeItem('auth_token');
  throw new Error('登录已过期，请重新登录'); // ← 已正确抛出
}
```

**实现方案**:

1. **`useVersionHistory`** — 暴露 `error` 状态 + `error` 字段到 `UseVersionHistoryReturn` 接口（`useVersionHistory.ts`）
2. **`VersionHistoryPanel`** — 接收并显示 error banner（`VersionHistoryPanel.tsx` 已有 `error` state 和 `errorBanner` UI，无需改动）

**改动范围**:

**`useVersionHistory.ts`**:
```ts
// Add to interface
interface UseVersionHistoryReturn {
  ...
  /** 最近一次加载/操作错误消息 */
  error: string | null;
}

// Add state
const [error, setError] = useState<string | null>(null);

// In loadSnapshots catch block:
} catch (err) {
  canvasLogger.default.error('[useVersionHistory] loadSnapshots error:', err);
  const msg = err instanceof Error ? err.message : '加载失败，请重试';
  setError(msg); // ← 新增
} finally { ... }

// In createSnapshot catch block:
} catch (err) {
  canvasLogger.default.error('[useVersionHistory] createSnapshot error:', err);
  const msg = err instanceof Error ? err.message : '创建快照失败，请重试';
  setError(msg); // ← 新增
}

// In restoreSnapshot catch block:
// Already has setError('恢复失败，请重试') in VersionHistoryPanel.tsx handler
// → 需要在 hook 层也暴露，VersionHistoryPanel 从 hook 读 error

// Add error clearing on open
const open = useCallback(() => {
  setIsOpen(true);
  setError(null); // ← 新增：打开时清除旧错误
  loadSnapshots();
}, [loadSnapshots]);
```

**`VersionHistoryPanel.tsx`** — 改为从 hook 读取 error：
```ts
// Current: const [error, setError] = useState<string | null>(null);
// Change to: const error = versionHistory.error;
// Remove local error state for loadSnapshots/createSnapshot (keep only for restore which is local)
```

**验收标准** (Testable):

```ts
// F11.2 AC1: 未登录用户触发 401
expect(screen.queryByRole('alert')).toBeNull(); // 初始无 error banner
await user.click(screen.getByTestId('history-btn'));
await waitFor(() => {
  expect(screen.getByRole('alert')).toHaveTextContent(/登录已过期，请重新登录/);
});

// F11.2 AC2: 错误清除
await user.click(screen.getByTestId('close-history-btn'));
await waitFor(() => {
  expect(screen.queryByRole('alert')).toBeNull();
});
```

**Definition of Done**:
- [ ] `useVersionHistory` 暴露 `error: string | null` 字段
- [ ] 401 错误显示为 `登录已过期，请重新登录` banner
- [ ] 网络失败显示为 `加载失败，请重试` banner
- [ ] 关闭面板后重新打开，错误 banner 消失

---

### F11.3 — CORS 验证

**目标**: 用 curl 验证 OPTIONS 预检请求正常返回 204（含 Authorization header）。

**验证命令**（参考 analysis.md）:
```bash
curl -X OPTIONS "https://api.vibex.top/api/v1/canvas/snapshots" \
  -H "Origin: https://vibex-app.pages.dev" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,content-type" \
  -i
```

**验收标准**:

| 检查点 | 期望值 |
|--------|--------|
| HTTP 状态码 | 204 No Content |
| Access-Control-Allow-Origin | `https://vibex-app.pages.dev`（或 `*`） |
| Access-Control-Allow-Methods | 含 `GET` |
| Access-Control-Allow-Headers | 含 `authorization` |
| 响应体 | 空（无 401/500） |

**Definition of Done**:
- [ ] curl OPTIONS 请求返回 HTTP 204（非 401/500）
- [ ] CORS headers 包含 Authorization

---

### F11.4 — 端到端测试

**测试场景**:

| # | 场景 | 预期结果 |
|---|------|---------|
| T1 | 已登录用户点击"历史"按钮 | VersionHistoryPanel 打开，列表加载中 |
| T2 | 已登录 + 有快照 | 显示快照列表，最新在前 |
| T3 | 已登录 + 无快照 | 显示"暂无版本记录"占位符 |
| T4 | 未登录用户点击"历史" | 显示"登录已过期，请重新登录" banner |
| T5 | 点击"保存当前版本" | 创建成功，列表更新 |
| T6 | 点击"恢复"某个快照 | 画布状态恢复，面板关闭 |
| T7 | projectId 为空时调用 | 后端返回 400（非 401） |

**Definition of Done**:
- [ ] 所有 7 个场景通过人工或自动化测试验证

---

## 测试场景清单

| ID | Feature | 测试描述 |
|----|---------|---------|
| T1 | F11.1 | 已登录用户在 Canvas 点击"历史" → 面板打开 |
| T2 | F11.1 | 面板关闭按钮 → 面板关闭 |
| T3 | F11.2 | 未登录用户点击"历史" → 显示 401 error banner |
| T4 | F11.2 | 关闭面板后重新打开 → 错误清除 |
| T5 | F11.2 | 网络失败 → 显示"加载失败" banner |
| T6 | F11.3 | curl OPTIONS → 204 + CORS headers |
| T7 | F11.4 | 完整流程（登录→历史→快照→恢复）→ 成功 |

---

## 实现顺序

1. **F11.3**（CORS 验证）— 无代码改动，纯验证，5 分钟
2. **F11.2**（401 错误展示）— 改 `useVersionHistory.ts`，约 0.5h
3. **F11.1**（集成确认）— 确认 `CanvasPage` 接入正确，无需开发
4. **F11.4**（端到端测试）— 人工测试 + curl 验证

---

## 风险

| 风险 | 等级 | 缓解 |
|------|------|------|
| CORS 预检失败 | 🟡 中 | 用 curl 提前验证 |
| Token 过期（非未登录）| 🟡 中 | 错误文案用"登录已过期"，区分未登录 |

---

## 验收总览

- [ ] `curl -X OPTIONS .../canvas/snapshots` → HTTP 204
- [ ] 已登录用户：历史按钮 → 面板正常打开，列表正常
- [ ] 未登录用户：历史按钮 → "登录已过期，请重新登录" banner
- [ ] 快照创建、恢复流程正常
- [ ] 现有 17 个 `useVersionHistory` 测试继续通过
