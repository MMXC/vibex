# VibeX Canvas 版本历史 401 认证修复 — 经验沉淀

> **项目**: vibex-canvas-auth-fix
> **完成日期**: 2026-04-13
> **问题类型**: ui_bug + integration_issue
> **状态**: ✅ 完成

---

## 问题回顾

### Bug #1: 版本历史 API 401 无差异化提示

**症状**: 点击 Canvas "历史" 按钮 → `GET /api/v1/canvas/snapshots` 返回 401 → 用户看到模糊错误或空白，无法判断是"未登录"还是"功能不可用"。

**根因**:
1. API 端点正确（`/v1/canvas/snapshots` 在 Hono gateway 已注册）
2. 前端 `canvasApi.listSnapshots()` 正确调用 `getAuthHeaders()` 读取 Bearer token
3. **`canvasApi.handleResponseError` 已正确抛出 `'登录已过期，请重新登录'`**
4. **❌ 真正根因：`useVersionHistory` hook 的 `loadSnapshots()` 和 `createSnapshot()` 的 catch 块只打日志，不更新 state，`error` 未暴露给 UI 层**

### Bug #2: 404 与 401 混淆

401 和 404 都被当作普通网络错误处理，用户无法区分"未登录"和"端点不存在"。

---

## 核心教训

### 教训 1：API hook 必须暴露 error 状态

**错误模式**：
```ts
// ❌ useVersionHistory — catch 只打日志，UI 无法感知错误
} catch (err) {
  canvasLogger.default.error('[useVersionHistory] loadSnapshots error:', err);
  // error state 未更新，UI 永远不知道请求失败了
}
```

**正确模式**：
```ts
// ✅ useVersionHistory — catch 更新 error state
} catch (err) {
  canvasLogger.default.error('[useVersionHistory] loadSnapshots error:', err);
  const msg = err instanceof Error ? err.message : '加载失败，请重试';
  setError(msg);  // ← 暴露给 UI
} finally {
  setLoading(false);
}
```

**原则**：任何调用外部 API 的 hook，必须暴露 `error: string | null` 状态，让 UI 组件能感知并展示错误。这是标准 React Hooks 规范。

---

### 教训 2：canvasApi.handleResponseError 逻辑已正确，无需修改

**`handleResponseError` 已有完善的 401 处理**：
```ts
if (res.status === 401) {
  sessionStorage.removeItem('auth_token');
  localStorage.removeItem('auth_token');
  throw new Error('登录已过期，请重新登录');  // ← 正确抛出
}
```

**不要修复一个已经正确的组件**。审查阶段花时间确认了 `canvasApi.ts` 无需任何改动，节省了大量无意义的重构。

---

### 教训 3：错误 banner 分类展示

**三类错误，三种文案**：
| 状态码 | 用户看到的文案 | 来源 |
|--------|--------------|------|
| 401 | 登录已过期，请重新登录 | `canvasApi.handleResponseError` throw |
| 404 | 历史功能维护中，请稍后再试 | `canvasApi.handleResponseError` throw |
| 网络错误 | 加载失败，请重试 | `useVersionHistory` catch fallback |

**restoreSnapshot 错误用组件 local state**（隔离于 hook error）：
```tsx
// ✅ 分离：load/create 错误来自 hook，restore 错误来自 local state
const { error: hookError } = useVersionHistory();
const [restoreError, setRestoreError] = useState<string | null>(null);
```

---

### 教训 4：F11.1 CanvasPage 接入确认 = 0h 纯审查

F11.1 只是确认 `canvas/page.tsx` 已接入 `VersionHistoryPanel`，无需代码改动。这类"确认而非开发"的 Story 应该在 Epic 中体现，节省不必要的开发资源。

**接入清单**：
- `import { useVersionHistory } from '@/hooks/canvas/useVersionHistory'` ✅
- `const versionHistory = useVersionHistory()` ✅
- `<ProjectBar onOpenHistory={versionHistory.open} />` ✅
- `<VersionHistoryPanel open={versionHistory.isOpen} onClose={versionHistory.close} />` ✅

---

### 教训 5：CORS 预检必须显式验证

CORS `protected_.options('/*')` 配置正确，但仍需用 curl 实际验证：
```bash
curl -X OPTIONS "https://api.vibex.top/api/v1/canvas/snapshots" \
  -H "Origin: https://vibex-app.pages.dev" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,content-type" \
  -i
# 期望: HTTP/2 204 + Access-Control-Allow-Headers 含 authorization
```

---

## 修复内容

| Story | 改动文件 | 内容 |
|-------|---------|------|
| F11.1 | canvas/page.tsx | 确认已接入（无代码改动）|
| F11.2 | `useVersionHistory.ts` | 新增 `error: string \| null` state，catch 块调用 `setError()` |
| F11.2 | `VersionHistoryPanel.tsx` | 从 hook 读取 `error`，展示 error banner；保留 restoreError local state |
| F11.2 | `canvasApi.ts` | 确认 404 → `'历史功能维护中，请稍后再试'`（无需修改，确认正确）|
| F11.3 | CORS 验证 | curl 验证 OPTIONS 204（含 Authorization header）|
| F11.4 | MSW E2E 测试 | T1-T8 场景覆盖 + 17 个现有测试回归 |

---

## 验收标准达成

- [x] 未登录用户点击历史按钮 → 显示"登录已过期，请重新登录" banner
- [x] 404 用户 → 显示"历史功能维护中，请稍后再试"
- [x] 关闭面板后重开，error banner 消失
- [x] curl OPTIONS → HTTP 204 + Authorization CORS headers
- [x] 现有 17 个 useVersionHistory 测试全部通过
- [x] 新增 MSW mock 测试（T1-T8）全部通过

---

## 预防措施

1. **新建 API 调用 hook 时，必须包含 `error: string | null` 字段**，并测试 error banner 展示
2. **`handleResponseError` 处理 401 时必须抛出有意义的用户文案**，不能用 generic error
3. **CORS 验证必须实际 curl 测试**，不能只看代码配置
4. **Epic 中的 0h 纯审查 Story** 应在 PRD 中标注，节省开发资源误判

---

## 相关文档

- `docs/.learnings/vibex-auth-401-handling.md` — 401 auth 重定向循环（不同问题，相关领域）
- `docs/vibex-canvas-auth-fix/architecture.md` — 技术设计
- `docs/vibex-canvas-auth-fix/prd.md` — 产品需求文档
- `docs/vibex-canvas-auth-fix/analysis.md` — 根因分析
