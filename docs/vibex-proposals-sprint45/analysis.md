# Sprint 45 提案分析

> **Agent**: coord (heartbeat self-implement)
> **日期**: 2026-05-31
> **触发**: analyst CLI-dispatch ghost — analyst 派发后 8h+ 无输出，coord 自举完成 Sprint45 提案分析，基于 Sprint44 (E1-E5) 交付成果识别下一批高优先级功能增强。

---

## 背景：Sprint44 交付成果

| Epic | 名称 | 状态 | 关键产出 |
|------|------|------|---------|
| E1 | AI 多轮会话管理 | ✅ | IndexedDB 持久化、分支管理、流式进度 |
| E2 | 画布模板分类+收藏 | ✅ | inferCategory、Favorites Star、分类筛选 |
| E3 | 协作节点锁定 | ✅ | 🔒锁overlay、presenceStore lock/unlock |
| E4 | 撤销历史面板 | ✅ | selectiveUndo、HistoryPanel 侧边栏 |
| E5 | 移动端触控 | ✅ | pinch-to-zoom、双指平移、双击选中 |

---

## P001 (P0) — AI 断线重连 + 流式可靠性增强

### 问题真实性
**高** — SSE 流式在网络波动时直接失败，用户丢失 session 内容，已有多次反馈。

### 根因
- `useStreamingAgent` 无 retry/backoff
- `AbortController` 断开后 `agentStore` 状态卡在 `streaming`
- 无 session 内容兜底持久化

### 技术可行性
**高** — 基础设施完整，只需 retry 逻辑封装 + 状态清理 + IndexedDB 兜底。

### DoD
- `useStreamingAgent` 支持 `maxRetries` + exponential backoff
- `agentStore` 新增 `retrying` 状态
- 重试耗尽后显示 i18n key `aiStreamFailed`
- 断连 chunk 写入 IndexedDB
- Vitest 覆盖断连/重试场景
- E2E: `ai-reconnect.spec.ts`

---

## P002 (P0) — Presence 协作光标 + 实时用户列表

### 问题真实性
**高** — 协作者无法感知彼此在画布上的位置，只能看到锁定状态，不知道谁在哪里。

### 根因
- `presenceStore` 无 `cursors` 状态
- `RemoteCursor` 组件（Firebase版）已移除，WebSocket版未重建
- WebSocket 未广播 cursor 位置

### 技术可行性
**高** — WebSocket 基础设施已就绪（Sprint43）。

### DoD
- `presenceStore` 新增 `cursors` + `updateCursor`
- WebSocket handler 处理 `cursor_move` 消息
- `RemoteCursor.tsx` 组件重建
- `DDSCanvasPage` 渲染所有远程光标
- Throttle 100ms
- Vitest cursor 状态测试
- dual-CHANGELOG

---

## P003 (P1) — 画布 MiniMap + 视口导航控件

### 问题真实性
**中** — 大画布场景确实需要全局导航，但 MVP 可用性影响有限。

### 根因
- `@xyflow/react` 内置 MiniMap 组件存在但未集成
- Sprint39 PRD 提过但未实施

### 技术可行性
**高** — 内置组件，无需新包。

### DoD
- `DDSFlow.tsx` 集成 `MiniMap`（右下角 150×100px，深色）
- `Controls`（左下角）
- `Background`（网格）
- MiniMap 点击跳转视口
- Vitest snapshot 测试
- dual-CHANGELOG

---

## P004 (P1) — 模板版本管理 + 导入/导出

### 问题真实性
**中** — 有一定需求，但单人使用场景下版本历史价值有限。

### 根因
- `RequirementTemplate` 无 version 字段
- 无模板序列化能力

### 技术可行性
**中** — 需扩展存储模型，单人版 MVP 可行。

### DoD
- `RequirementTemplate` 增 version/createdAt/updatedAt
- `templateStore` 增版本历史（最多 5 个版本）
- `TemplateGallery` 增「历史」按钮
- `exportTemplate` → JSON download
- `importTemplate` → file upload
- Vitest version 相关测试
- dual-CHANGELOG

---

## P005 (P2) — 画布快照分享 + 公开链接

### 问题真实性
**中** — 分享需求存在，但可通过 PNG 导出临时满足。

### 根因
- 无 snapshot 存储机制
- 无公开只读渲染页

### 技术可行性
**中** — 需后端 D1 存储，工作量中等。

### DoD
- `POST /api/snapshot` → D1，生成 ID
- `GET /api/snapshot/:id` → 返回画布 JSON
- `/snapshot/[id]/page.tsx` → 公开只读页
- ShareButton → 复制分享链接
- Vitest API route 测试
- dual-CHANGELOG

---

## 优先级 & Epic 分配

| 提案 | 优先级 | Epic | 依赖 |
|------|--------|------|------|
| P001 AI断线重连 | P0 | E1 | Sprint44 E1 |
| P002 Presence光标 | P0 | E2 | Sprint44 E3 |
| P003 MiniMap | P1 | E3 | 独立 |
| P004 模板版本 | P1 | E4 | Sprint44 E2 |
| P005 快照分享 | P2 | E5 | 需后端 |
