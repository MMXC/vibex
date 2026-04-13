# vibex-canvas-auth-fix: 需求分析报告

**项目**: vibex-canvas-auth-fix  
**阶段**: Phase 1 — analyze-requirements  
**作者**: Analyst  
**日期**: 2026-04-13  
**状态**: 分析完成，待 Architect 评审

---

## 业务场景分析

### 问题背景

用户点击 Canvas 画布的"历史"按钮时，尝试 `GET /api/v1/canvas/snapshots` 返回 **401 Unauthorized**。

经过代码审计，确认：

1. **API 端点存在且正确**：`/api/v1/canvas/snapshots` 已在 Hono gateway 注册（`protected_.route('/canvas/snapshots', canvasSnapshots)`），属于受保护路由（需认证）
2. **前端调用代码正确**：`canvasApi.listSnapshots()` 正确使用 `getAuthHeaders()` 从 `sessionStorage` 读取 `auth_token` 并以 `Authorization: Bearer <token>` 发送
3. **API 路径已修复**：E0 阶段已将 `/canvas/snapshots` 修正为 `/v1/canvas/snapshots`（commit `270858a2`）
4. **UI 未完全就绪**：ProjectBar 已有 `onOpenHistory` 槽位，但 `canvas/page.tsx` 尚未接入 `VersionHistoryPanel`

### 根本问题

**401 的根因是"未登录"，而非"端点不存在"或"CORS 预检"。**

前端 `canvasApi.ts` 的 `getAuthHeaders()` 从 `sessionStorage` 读取 token。如果用户未登录或 token 已过期，`getAuthHeaders()` 返回空对象，fetch 请求不带 `Authorization` header，导致受保护路由返回 401。

### 目标用户

- 已登录用户，在 Canvas 画布中查看历史快照版本
- 需要区分"未登录"与"端点不存在"两种 401 场景，给予不同提示

---

## 历史经验（Research 输出）

### 来自 `docs/learnings/canvas-cors-preflight-500.md`

**核心教训**：Canvas API 全部为 `protected_` 路由，认证依赖 `Authorization` header（Bearer token），不依赖 cookie。跨域调用时 CORS 配置需显式包含 `Authorization`。

**三层处理原则**：
- Gateway 层：`v1.options('/*')` 必须显式注册
- 子 app 层：`protected_.options('/*')` 放行预检
- 路由层：防御性处理 CORS headers

**验证命令**：
```bash
curl -X OPTIONS "https://api.vibex.top/api/v1/canvas/snapshots" \
  -H "Origin: https://vibex-app.pages.dev" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,content-type" \
  -i
# 期望: HTTP/2 204 + CORS headers (非 401/500)
```

### 来自 Git History（commit `270858a2`）

API 路径缺陷（缺少 `/v1/` 前缀）已在 E0 阶段修复。

### 来自 `docs/learnings/canvas-testing-strategy.md`

`useVersionHistory` hook 已有 17 个独立测试，覆盖创建、列表、恢复、边界状态。

---

## 技术方案选项

### 方案 A：前端 401 差异化提示 + 完善 UI 入口（推荐）

**思路**：401 的根因是用户未登录或 token 过期，前端应区分 401 与其他错误，给予对应提示。

**实现要点**：

1. **完善 Canvas 页面 UI 入口**：在 `canvas/page.tsx` 中接入 `VersionHistoryPanel`，绑定 `onOpenHistory` 回调
2. **前端错误区分**：在 `canvasApi.ts` 的 `listSnapshots()` 中，`handleResponseError` 已经处理 401 并清除 token、抛出 `'登录已过期，请重新登录'`。但需要确保 UI 层（`useVersionHistory.loadSnapshots()`）能正确显示该错误消息
3. **CORS 验证**：确认 `v1.options('/*')` 包含 `Access-Control-Allow-Headers: Authorization`
4. **边界情况处理**：projectId 为空时 `listSnapshots()` 发送无 projectId 的请求，后端应返回 400 而非 401

**改动范围**：
- `vibex-fronted/src/app/canvas/page.tsx` — 接入 VersionHistoryPanel
- `vibex-fronted/src/components/canvas/features/VersionHistoryPanel.tsx` — 完善错误展示
- `vibex-backend/src/routes/v1/gateway.ts` — 确认 CORS headers
- `vibex-fronted/src/hooks/canvas/useVersionHistory.ts` — 暴露 error 状态给 UI

**优点**：改动最小，风险低，用户体验好  
**缺点**：未解决 token 刷新机制

### 方案 B：方案 A + Token 刷新机制

在 401 时自动尝试 token 刷新，刷新成功则重试原请求。

**改动范围**：在 `useVersionHistory` 或 `canvasApi` 层统一处理 token 刷新逻辑。

**优点**：提升用户体验，减少重新登录  
**缺点**：涉及认证流程核心逻辑，改动范围较大

---

## 可行性评估

### 技术可行性

| 维度 | 评估 |
|------|------|
| API 端点存在 | ✅ `/v1/canvas/snapshots` 已存在于 Hono gateway |
| 认证机制 | ✅ Bearer token 认证，getAuthHeaders 已实现 |
| CORS 配置 | ✅ `protected_.options('/*')` 已配置含 Authorization |
| 前端调用代码 | ✅ `canvasApi.listSnapshots()` 正确实现 |
| UI 入口 | ⚠️ 未完整接入，需在 canvas/page.tsx 接入 |
| 错误区分 | ⚠️ handleResponseError 已处理，但 UI 层展示不完整 |

**结论**：**有条件推荐**。核心 API 链路是通的，401 是预期行为（用户未登录），主要工作是完善 UI 入口和错误展示。

### 工期估算

| 任务 | 估算工时 | 难度 |
|------|---------|------|
| 接入 VersionHistoryPanel 到 canvas/page.tsx | 0.5h | 低 |
| 完善 401 错误展示（UI 层） | 0.5h | 低 |
| CORS 验证（curl 测试） | 0.5h | 低 |
| 端到端测试 | 1h | 中 |
| **合计** | **2.5h** | — |

---

## 风险矩阵

| 风险 | 可能性 | 影响 | 等级 | 缓解措施 |
|------|--------|------|------|----------|
| 401 因 token 过期而非未登录 | 高 | 中 | 🟡 中 | 401 提示"登录已过期，请重新登录"而非"请先登录" |
| projectId 为空导致请求失败 | 中 | 低 | 🟢 低 | 后端返回 400，前端确保 projectId 存在 |
| CORS 预检失败（OPTIONS 无 Authorization） | 低 | 高 | 🟡 中 | 用 curl 验证 OPTIONS 响应 |
| 部署后 Cloudflare 1101 crash | 低 | 高 | 🟡 中 | 用 `npx wrangler rollback` 回滚 |

---

## 验收标准

### 功能性

- [ ] 未登录用户点击"历史"按钮 → 显示"登录已过期，请重新登录"提示（401 差异化）
- [ ] 已登录用户点击"历史"按钮 → 正常显示版本历史列表
- [ ] 快照列表为空时 → 显示"暂无版本记录"占位符
- [ ] 点击"保存当前版本" → 成功创建快照，列表更新
- [ ] 点击"恢复" → 成功恢复画布状态

### 非功能性

- [ ] CORS 验证：curl OPTIONS 请求返回 204（非 401）
- [ ] `canvasApi.listSnapshots()` 无 projectId 时后端返回 400（非 401）
- [ ] `useVersionHistory` 测试通过（17 个现有测试 + 新增 401 场景测试）

---

## JTBD（Jobs-To-Be-Done）

1. **查看历史版本**：作为已登录用户，我想查看 Canvas 画布的历史快照列表，了解之前保存的状态
2. **恢复历史版本**：作为已登录用户，我想恢复到某个历史快照，继续之前的工作
3. **保存当前版本**：作为已登录用户，我想手动保存当前画布状态为新快照
4. **理解错误原因**：作为用户，当 401 发生时，我需要知道是"登录过期"而非"功能不可用"

---

## 执行决策

- **决策**: 待评审
- **执行项目**: 无
- **执行日期**: 待定

---

## 下一步

交给 Architect 评审，确认方案 A 或方案 B 方向后，进入 implement-requirements 阶段。
