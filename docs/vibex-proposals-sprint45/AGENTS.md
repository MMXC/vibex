# VibeX Sprint 45 实施计划

---

## Epic 1: AI 断线重连 (P001)

### DoD Checklist
- [ ] `src/hooks/useStreamingAgent.ts` 新增 `maxRetries` 参数
- [ ] exponential backoff: 1s → 2s → 4s
- [ ] `src/stores/agentStore.ts` 新增 `retrying` + `lastError` 状态
- [ ] `src/components/dds/agent/AgentFeedbackPanel.tsx` 显示重试中/失败文案
- [ ] i18n 新增 `aiRetrying`, `aiStreamFailed` keys
- [ ] 断连时 chunk 写入 IndexedDB
- [ ] Vitest: retry 逻辑测试
- [ ] E2E: `ai-reconnect.spec.ts`

### Pipeline Order
1. `useStreamingAgent` retry 逻辑
2. `agentStore` 状态扩展
3. `AgentFeedbackPanel` UI 更新
4. i18n 更新
5. 测试 + CHANGELOG

### 测试策略
- Vitest unit test: mock SSE EventSource `error` event
- E2E: Playwright 模拟断网场景（network offline API）

---

## Epic 2: Presence 光标 (P002)

### DoD Checklist
- [ ] `src/stores/presenceStore.ts` 新增 `cursors` Map + `updateCursor` action
- [ ] WebSocket handler 新增 `cursor_move` 消息处理
- [ ] `src/components/dds/presence/RemoteCursor.tsx` + CSS
- [ ] `DDSCanvasPage.tsx` 渲染 RemoteCursor 层
- [ ] mousemove throttle 100ms
- [ ] 用户名/color 从 store 读取
- [ ] Vitest: cursor 状态测试
- [ ] dual-CHANGELOG

### Pipeline Order
1. `presenceStore` 扩展
2. WebSocket handler
3. `RemoteCursor` 组件
4. `DDSCanvasPage` 集成
5. 测试 + CHANGELOG

### 测试策略
- Vitest: presenceStore action 测试
- Manual: 多 tab 打开同一画布测试光标同步

---

## Epic 3: MiniMap (P003)

### DoD Checklist
- [ ] `DDSFlow.tsx` 导入 `MiniMap, Controls, Background` from `@xyflow/react`
- [ ] MiniMap: 右下角 150×100px，深色主题
- [ ] Controls: 左下角，zoom + fit
- [ ] Background: dots 网格
- [ ] MiniMap 点击跳转视口
- [ ] Vitest snapshot 测试
- [ ] dual-CHANGELOG

### Pipeline Order
1. `DDSFlow.tsx` 集成 MiniMap + Controls + Background
2. 样式调优
3. 测试 + CHANGELOG

### 测试策略
- Vitest snapshot: DDSFlow render 测试

---

## Epic 4: 模板版本管理 (P004)

### DoD Checklist
- [ ] `RequirementTemplate` 增 `version: number` 字段
- [ ] `templateStore` 增 `templateHistory` Map
- [ ] `saveTemplateVersion(id)` + `getTemplateHistory(id)` actions
- [ ] `TemplateHistoryPanel.tsx` + CSS（侧边抽屉）
- [ ] Export → JSON download
- [ ] Import → file upload + merge
- [ ] Vitest: version 相关测试
- [ ] dual-CHANGELOG

### Pipeline Order
1. Type interface 扩展
2. `templateStore` 扩展
3. HistoryPanel 组件
4. Export/Import 功能
5. 测试 + CHANGELOG

### 测试策略
- Vitest: templateStore version action 测试

---

## Epic 5: Snapshot 分享 (P005)

### DoD Checklist
- [ ] `POST /api/snapshot` — D1 INSERT
- [ ] `GET /api/snapshot/:id` — D1 SELECT
- [ ] `src/app/snapshot/[id]/page.tsx` — 公开只读页
- [ ] `SnapshotCanvas.tsx` — 只读渲染
- [ ] `ShareButton.tsx` — 复制链接
- [ ] 路由守卫：创建需 auth，读取公开
- [ ] per-user row limit: 10
- [ ] Vitest: API route 测试
- [ ] dual-CHANGELOG

### Pipeline Order
1. D1 schema: `snapshots(id, canvasJSON, userId, createdAt)`
2. API routes
3. SnapshotCanvas 组件
4. ShareButton 集成
5. 测试 + CHANGELOG

### 测试策略
- Vitest: API route 测试（mock D1）
- Manual: 创建 snapshot → 访问公开链接

---

## 跨 Epic 技术依赖

```
E1 (useStreamingAgent) ─┐
                         ├─ 独立，无交叉依赖
E2 (presenceStore)  ────┤
E3 (DDSFlow)       ────┤
E4 (templateStore)  ────┤
E5 (snapshot API)  ────┘
```

**Pipeline 顺序**: E1 → E2 → E3 → E4 → E5（可并行开发）

---

## 测试覆盖率目标

| Epic | 单元测试 | E2E |
|------|---------|-----|
| E1 | useStreamingAgent retry | ai-reconnect.spec |
| E2 | presenceStore cursor | manual multi-tab |
| E3 | DDSFlow snapshot | - |
| E4 | templateStore version | - |
| E5 | API route mock | manual share link |
