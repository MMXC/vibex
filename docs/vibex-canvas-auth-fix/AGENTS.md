# vibex-canvas-auth-fix — Agent Development Constraints

**项目**: vibex-canvas-auth-fix
**阶段**: Phase 1 — design-architecture (AGENTS.md)
**作者**: Architect
**日期**: 2026-04-13

---

## 1. 开发约束

### 1.1 核心原则

- **无新增生产依赖** — 现有依赖已满足需求，只需安装 MSW 作为 dev 依赖
- **向后兼容** — 现有 17 个 `useVersionHistory` 测试必须继续通过
- **最小改动** — 只改 2 个文件：`useVersionHistory.ts` + `VersionHistoryPanel.tsx`
- **错误隔离** — `load/create` 错误由 hook state 管理，`restore` 错误由组件 local state 管理

### 1.2 TypeScript 规范

- 禁止使用 `any` 类型泄漏
- `error` 字段必须显式类型声明：`error: string | null`
- 所有 catch 块必须提取错误消息（`err instanceof Error ? err.message : '加载失败，请重试'`）

### 1.3 日志规范

- 使用 `canvasLogger.default.error()` 记录错误（已在 `useVersionHistory.ts` 中使用）
- 禁止在错误处理中使用 `console.error`

### 1.4 测试规范

- 新增测试使用 MSW 模拟 HTTP 响应（不依赖真实 API）
- 每个测试用例必须独立（`beforeEach` 重置状态）
- 测试文件命名：`useVersionHistory.error.test.ts`
- 运行命令：`cd vibex-fronted && npm test -- --run`

### 1.5 禁止事项

- ❌ 禁止修改 `canvasApi.ts` 中的 `handleResponseError` 逻辑
- ❌ 禁止修改 `canvasApi.ts` 中的 `getAuthHeaders` 逻辑
- ❌ 禁止在后端添加新 API 端点
- ❌ 禁止修改现有 17 个测试用例
- ❌ 禁止在 `useVersionHistory` hook 中发起额外的 API 请求

---

## 2. 文件改动规范

### 2.1 `useVersionHistory.ts` — 改动规范

**可改动区域**（标记 `// F11.2 改动`）:
1. `UseVersionHistoryReturn` interface — 新增 `error: string | null`
2. `useState<string | null>(null)` — 新增 error state
3. `loadSnapshots()` catch block — 新增 `setError(msg)`
4. `createSnapshot()` catch block — 新增 `setError(msg)`
5. `open()` callback — 新增 `setError(null)`
6. return 对象 — 新增 `error`

**不可改动区域**:
- `createAiSnapshot` 和 `restoreSnapshot` 的 catch block（除非 PRD 明确要求）
- `lastSnapshotTimeRef` 防抖逻辑
- Store selectors（已有）

### 2.2 `VersionHistoryPanel.tsx` — 改动规范

**可改动区域**:
1. `useVersionHistory` 解构 — 新增 `error: hookError`
2. 移除组件内的 `error` state（用于 load/create）
3. Error Banner JSX — 渲染 `hookError`（保留 `restoreError` 用于 restore 场景）

**不可改动区域**:
- `handleRestore` 和 `handleCreate` 的调用逻辑（只改 error state 来源）
- 快照列表渲染逻辑
- CSS Module 类名

---

## 3. CORS 验证规范

### 3.1 验证命令

```bash
curl -X OPTIONS "https://api.vibex.top/api/v1/canvas/snapshots" \
  -H "Origin: https://vibex-app.pages.dev" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,content-type" \
  -i
```

### 3.2 期望结果

| 检查点 | 期望值 |
|--------|--------|
| HTTP 状态码 | 204 |
| Access-Control-Allow-Origin | `https://vibex-app.pages.dev` 或 `*` |
| Access-Control-Allow-Methods | 含 `GET` |
| Access-Control-Allow-Headers | 含 `authorization` |

### 3.3 如返回 401 的处理

如果 OPTIONS 返回 401，需检查后端 `vibex-backend/src/routes/v1/gateway.ts` 中 `protected_.options('/*')` 的 CORS 配置。

---

## 4. 代码审查检查单

### PR 提交前必须通过的检查

- [ ] `npm run type-check` 通过（无 TypeScript 错误）
- [ ] `npm test -- --run useVersionHistory` 通过（25 个测试）
- [ ] 新增代码有 `// F11.2` 注释标记
- [ ] 无 `console.error` / `console.log`
- [ ] `error` 字段已导出在 `UseVersionHistoryReturn` interface

### 提交信息格式

```
fix(canvas): F11.2 暴露 useVersionHistory error 状态

- useVersionHistory 新增 error: string | null
- VersionHistoryPanel 从 hook 读取 error 并显示 banner
- 401 场景显示"登录已过期，请重新登录"
```

---

## 5. 依赖清单

### 5.1 新增依赖

```json
{
  "devDependencies": {
    "msw": "^2.7.0"
  }
}
```

### 5.2 现有依赖（无需变更）

- `vitest` — 测试框架
- `@testing-library/react` — React 组件测试
- `zod` — 已有，无需新增
- `zustand` — 状态管理，已有

---

## 6. 验收测试命令

```bash
# 1. TypeScript 类型检查
cd vibex-fronted && npx tsc --noEmit

# 2. 运行 useVersionHistory 相关测试
cd vibex-fronted && npm test -- --run useVersionHistory

# 3. 验证 CORS 预检（手动执行）
curl -X OPTIONS "https://api.vibex.top/api/v1/canvas/snapshots" \
  -H "Origin: https://vibex-app.pages.dev" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,content-type" \
  -i

# 4. 全量测试（可选）
cd vibex-fronted && npm test -- --run
```
