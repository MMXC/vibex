# PRD: vibex-canvas-auth-fix

**项目**: vibex-canvas-auth-fix
**阶段**: Phase 1 — create-prd
**作者**: PM
**日期**: 2026-04-13
**状态**: 待评审
**上游**: analysis.md（Analyst）, plan.md（Planning）

---

## 1. 执行摘要

### 背景

用户点击 Canvas 画布的"历史"按钮时，`GET /api/v1/canvas/snapshots` 返回 **401 Unauthorized**。

经 Analyst 代码审计确认：
- API 端点 `/v1/canvas/snapshots` 已正确注册在 Hono gateway（受保护路由）
- 前端 `canvasApi.listSnapshots()` 正确使用 `getAuthHeaders()` 读取 Bearer token
- **401 的根因是"用户未登录或 token 过期"**，而非端点不存在或 CORS 问题

### 目标

1. 已登录用户点击"历史" → 正常显示版本历史列表
2. 未登录/Token 过期用户点击"历史" → 显示清晰错误提示"登录已过期，请重新登录"
3. CORS 预检请求（OPTIONS）返回 204 而非 401

### 成功指标

- [ ] 未登录用户点击历史按钮 → 显示 401 error banner，提示"登录已过期，请重新登录"
- [ ] 已登录用户点击历史按钮 → VersionHistoryPanel 正常打开，列表正常加载
- [ ] `curl -X OPTIONS .../canvas/snapshots` → HTTP 204 + 含 Authorization 的 CORS headers
- [ ] 现有 17 个 `useVersionHistory` 测试继续通过
- [ ] 快照创建、恢复流程端到端验证通过

---

## 2. Epic 拆分

### Epic F11 — 版本历史 401 修复

| ID | Story | 描述 | 工时 | 依赖 | 优先级 |
|----|-------|------|------|------|--------|
| F11.1 | CanvasPage 接入确认 | 确认 `canvas/page.tsx` 已正确接入 `VersionHistoryPanel` 和 `useVersionHistory`，无需开发 | 0h | — | P0 |
| F11.2 | 401 错误 UI 层差异化展示 | `useVersionHistory` 暴露 `error` 状态，`VersionHistoryPanel` 从 hook 读取并显示 error banner | 0.5h | F11.1 | P0 |
| F11.3 | CORS 预检验证 | 用 curl 验证 OPTIONS 请求返回 204，含 Authorization CORS headers | 0.5h | — | P1 |
| F11.4 | 端到端测试 | 覆盖所有关键场景（已登录/未登录/空列表/创建/恢复/无 projectId） | 1.0h | F11.2+F11.3 | P0 |

**总工时**: 2.0h（纯开发）+ 0.5h（CORS 验证）= 约 2.5h

---

## 3. 验收标准

### Story F11.1 — CanvasPage 接入确认

**无需代码改动。** Analyst 审计确认 `canvas/page.tsx` 已完成接入：

| 检查项 | 状态 |
|--------|------|
| `import { useVersionHistory } from '@/hooks/canvas/useVersionHistory'` | ✅ |
| `const versionHistory = useVersionHistory()` | ✅ |
| `<ProjectBar onOpenHistory={versionHistory.open} />` | ✅ |
| `<VersionHistoryPanel open={versionHistory.isOpen} onClose={versionHistory.close} />` | ✅ |

**DoD（验收测试）**:
- [ ] 已登录用户在 Canvas 页面点击 ProjectBar 的"历史"按钮 → VersionHistoryPanel 从右侧滑出
- [ ] 点击面板关闭按钮 → 面板关闭

---

### Story F11.2 — 401 错误 UI 层差异化展示

**根因**: `useVersionHistory.loadSnapshots()` 捕获错误后仅打日志，`error` 未暴露给 UI。

**当前 `canvasApi.handleResponseError` 逻辑已正确**（抛出 `'登录已过期，请重新登录'`），但 hook 层吞掉了错误。

#### 改动 1: `useVersionHistory.ts`

```ts
// interface 新增字段
interface UseVersionHistoryReturn {
  // ...existing fields
  /** 最近一次加载/操作错误消息 */
  error: string | null;
}

// state
const [error, setError] = useState<string | null>(null);

// loadSnapshots catch block:
} catch (err) {
  canvasLogger.default.error('[useVersionHistory] loadSnapshots error:', err);
  const msg = err instanceof Error ? err.message : '加载失败，请重试';
  setError(msg);
}

// createSnapshot catch block:
} catch (err) {
  canvasLogger.default.error('[useVersionHistory] createSnapshot error:', err);
  const msg = err instanceof Error ? err.message : '创建快照失败，请重试';
  setError(msg);
}

// open() 中清除旧错误:
const open = useCallback(() => {
  setIsOpen(true);
  setError(null); // 打开时清除旧错误
  loadSnapshots();
}, [loadSnapshots]);
```

#### 改动 2: `VersionHistoryPanel.tsx`

```tsx
// 改为从 hook 读取 error（移除 local error state for load/create）
const error = versionHistory.error;
// 保留本地 error state 用于 restoreSnapshot（handler 在组件内）
const [restoreError, setRestoreError] = useState<string | null>(null);
```

#### 验收标准（可写 expect() 断言）:

```ts
// F11.2 AC1: 未登录用户触发 401
// GIVEN: 用户未登录（sessionStorage 无 auth_token）
// WHEN: 用户点击"历史"按钮
// THEN: 页面显示 error banner，textContent 含 "登录已过期，请重新登录"
expect(screen.getByRole('alert')).toHaveTextContent(/登录已过期，请重新登录/);

// F11.2 AC2: 错误清除
// GIVEN: 未登录用户已看到 401 error banner
// WHEN: 用户关闭 VersionHistoryPanel
// THEN: 再次打开面板时，error banner 不再显示
expect(screen.queryByRole('alert')).toBeNull();

// F11.2 AC3: 网络失败
// GIVEN: 网络不可用
// WHEN: 用户点击"历史"按钮
// THEN: 显示 "加载失败，请重试" banner

// F11.2 AC4: 创建失败
// WHEN: 用户点击"保存当前版本"但请求失败
// THEN: 显示 "创建快照失败，请重试" banner
```

**DoD**:
- [ ] `useVersionHistory` 暴露 `error: string | null` 字段
- [ ] 未登录用户看到 "登录已过期，请重新登录" banner
- [ ] 网络/创建失败用户看到对应错误文案 banner
- [ ] 关闭面板后重新打开，error banner 消失
- [ ] 现有 `useVersionHistory` 测试继续通过（17 个）

---

### Story F11.3 — CORS 预检验证

**目标**: 确认 OPTIONS 预检请求正常。

#### 验证命令

```bash
curl -X OPTIONS "https://api.vibex.top/api/v1/canvas/snapshots" \
  -H "Origin: https://vibex-app.pages.dev" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,content-type" \
  -i
```

#### 验收标准

| 检查点 | 期望值 | 实际 |
|--------|--------|------|
| HTTP 状态码 | 204 No Content | 待验证 |
| Access-Control-Allow-Origin | `https://vibex-app.pages.dev` 或 `*` | 待验证 |
| Access-Control-Allow-Methods | 含 `GET` | 待验证 |
| Access-Control-Allow-Headers | 含 `authorization` | 待验证 |
| 响应体 | 空（非 401/500） | 待验证 |

**DoD**:
- [ ] curl OPTIONS 请求返回 HTTP 204
- [ ] `Access-Control-Allow-Headers` 包含 `authorization`
- [ ] 无 401/500 错误

---

### Story F11.4 — 端到端测试

#### 测试场景矩阵

| # | 场景 | 角色 | 预期结果 | 测试方式 |
|---|------|------|---------|----------|
| T1 | 历史按钮 → 面板打开 | 已登录，有快照 | VersionHistoryPanel 打开，列表加载中，显示快照 | 人工/QA |
| T2 | 历史按钮 → 空列表 | 已登录，无快照 | 显示"暂无版本记录"占位符 | 人工/QA |
| T3 | 历史按钮 → 401 | **未登录** | 显示"登录已过期，请重新登录" banner | **expect() 测试** |
| T4 | 错误清除 | 未登录→关闭→重新打开 | 再次打开时无 error banner | **expect() 测试** |
| T5 | 保存当前版本 | 已登录 | 快照创建成功，列表更新 | 人工/QA |
| T6 | 恢复历史版本 | 已登录 | 画布状态恢复，面板关闭 | 人工/QA |
| T7 | projectId 为空 | 任意 | 后端返回 400（非 401） | curl/expect() |
| T8 | 网络失败 | 任意 | 显示"加载失败，请重试" banner | expect() |

**DoD**:
- [ ] T1-T8 全部通过
- [ ] 现有 17 个 `useVersionHistory` 测试继续通过
- [ ] `canvasApi.listSnapshots()` 无 projectId → HTTP 400

---

## 4. DoD (Definition of Done)

### 研发完成标准（所有 Story 共同）

- [ ] `useVersionHistory` 暴露 `error: string | null`，类型正确
- [ ] `VersionHistoryPanel` 从 hook 读取 error，banner 显示正确
- [ ] 401 场景显示"登录已过期，请重新登录"（非模糊错误）
- [ ] 关闭/重开面板，error 状态正确清除
- [ ] curl OPTIONS → HTTP 204，含 Authorization CORS headers
- [ ] 端到端 T1-T8 全部通过
- [ ] 现有 17 个 `useVersionHistory` 测试继续通过（`npm test`）
- [ ] 无 TypeScript 编译错误

### 页面集成标注

| ID | 功能 | 页面集成 | 备注 |
|----|------|---------|------|
| F11.1 | CanvasPage 接入 | ✅ `canvas/page.tsx` | 已完成 |
| F11.2 | 401 错误展示 | ✅ `VersionHistoryPanel.tsx` + `useVersionHistory.ts` | 需开发 |
| F11.3 | CORS 验证 | ❌ 无需页面 | curl 验证 |
| F11.4 | 端到端测试 | ✅ 涉及 canvas/page.tsx | QA 验证 |

---

## 5. 功能点一览

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F11.1 | CanvasPage 接入确认 | 确认已接入 VersionHistoryPanel | 人工点击验证面板打开/关闭 | `canvas/page.tsx` |
| F11.2 | 401 错误 banner | hook 暴露 error，Panel 显示 banner | `expect(alert).toHaveTextContent(/登录已过期/)` | `useVersionHistory.ts` + `VersionHistoryPanel.tsx` |
| F11.3 | CORS 预检验证 | curl 验证 OPTIONS 204 | curl 返回 204，含 Authorization header | 无 |
| F11.4 | 端到端测试 | T1-T8 场景覆盖 | 7 场景全部通过 | canvas/page.tsx |

---

## 6. 驳回自查清单

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言
- [x] DoD 章节存在且具体
- [x] 功能点模糊 → 已细化到 hook state 级别
- [x] 验收标准缺失 → 每个 Story 均有 3-4 条
- [x] 涉及页面但未标注【需页面集成】→ 已标注
- [x] 未执行 Planning → 已生成 plan.md（Lightweight）

---

## 7. 执行决策

- **决策**: 待 Architect 评审确认方案 A 方向
- **执行项目**: 无
- **执行日期**: 待定

---

## 8. 产出物

| 产出 | 路径 |
|------|------|
| 分析报告 | `docs/vibex-canvas-auth-fix/analysis.md` |
| 实施计划 | `docs/vibex-canvas-auth-fix/plan.md` |
| 本 PRD | `docs/vibex-canvas-auth-fix/prd.md` |
| 详细规格 | `docs/vibex-canvas-auth-fix/specs/` |
