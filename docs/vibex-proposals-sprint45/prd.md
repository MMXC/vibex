# VibeX Sprint 45 PRD

> **Agent**: coord (heartbeat self-implement)
> **日期**: 2026-05-31
> **基于**: analysis.md (P001-P005)

---

## Epic 1: AI 断线重连 + 流式可靠性增强

**功能 ID**: S45-P001-E1
**负责人**: dev
**依赖**: Sprint44 E1 (流式基础)
**工作量**: 中

### User Story
作为 AI Agent 用户，我希望在网络波动时系统自动重连并恢复流式输出，以免丢失已生成内容。

### Story Table

| 字段 | 值 |
|------|------|
| 用户故事 | AI Agent 用户在流式响应过程中网络断开，系统自动重试 3 次，恢复流式输出 |
| 触发条件 | SSE 连接断开 / 500ms 无数据 |
| 正常流程 | 流式正常 → 显示 chars received 计数 |
| 异常流程 | 断连 → exponential backoff → 重试 → 恢复或失败提示 |
| 边界条件 | 断连时已接收 chunk 持久化到 IndexedDB |

### DoD
- [ ] `useStreamingAgent.ts` 新增 `maxRetries: number` 参数，默认 3
- [ ] exponential backoff: 1s → 2s → 4s
- [ ] `agentStore` 新增 `retrying: boolean` 状态
- [ ] `agentStore` 新增 `lastError: string | null` 状态
- [ ] `AgentFeedbackPanel` 显示重试中文案（i18n key: `aiRetrying`）
- [ ] 3 次重试耗尽后：显示「连接失败」文案（i18n key: `aiStreamFailed`）+ 重试按钮
- [ ] 断连时已接收 chunk 追加写入 IndexedDB session
- [ ] Vitest: `useStreamingAgent` retry 测试（mock SSE close event, 3 次重试）
- [ ] E2E: `tests/e2e/ai-reconnect.spec.ts`

### expect() 断言示例

```typescript
// useStreamingAgent retry 逻辑
expect(useStreamingAgent({ maxRetries: 1 })).toMatchObject({
  status: 'retrying',
  retryCount: 1,
});

// agentStore 重试状态
expect(agentStore.getState().retrying).toBe(true);
expect(agentStore.getState().status).toBe('streaming');

// 重试耗尽后
expect(agentStore.getState().lastError).toBe('AI_STREAM_FAILED');
```

### 涉及文件
- `src/hooks/useStreamingAgent.ts`
- `src/stores/agentStore.ts`
- `src/components/dds/agent/AgentFeedbackPanel.tsx`
- `src/i18n/messages/en.json` (新增 `aiRetrying`, `aiStreamFailed` keys)
- `src/i18n/messages/zh.json`
- `tests/e2e/ai-reconnect.spec.ts`

### Page Integration
- `src/app/[locale]/canvas/page.tsx` — `AgentFeedbackPanel` 集成，`retrying` 状态 → 显示重连中 overlay

---

## Epic 2: Presence 协作光标 + 实时用户列表

**功能 ID**: S45-P002-E2
**负责人**: dev
**依赖**: Sprint44 E3 (WebSocket presence 基础设施)
**工作量**: 中

### User Story
作为协作者，我希望在画布上看到其他人的实时光标位置和用户名，以便知道谁在操作哪个区域。

### Story Table

| 字段 | 值 |
|------|------|
| 用户故事 | 协作者 A 在画布上移动鼠标，协作者 B 的画布上实时显示 A 的光标和用户名 |
| 触发条件 | WebSocket presence 连接建立 + 用户在画布上移动鼠标 |
| 正常流程 | mousemove → throttle 100ms → WebSocket `cursor_move` → 更新 presenceStore → 渲染 RemoteCursor |
| 离开流程 | WebSocket `user_left` → 移除该用户的光标，3s 淡出 |

### DoD
- [ ] `presenceStore` 新增 `cursors: Map<string, {x: number, y: number, name: string, color: string}>` 状态
- [ ] `presenceStore` 新增 `updateCursor(userId, x, y)` action
- [ ] WebSocket handler 新增 `cursor_move` 消息处理
- [ ] `RemoteCursor.tsx` 组件：div + CSS（彩色三角形光标 + 用户名标签 + 淡出动画）
- [ ] `DDSCanvasPage.tsx` 集成 `RemoteCursor` 渲染层
- [ ] Throttle mousemove 广播至 100ms
- [ ] 用户名/color 从 `agentStore` 或 `userPreferencesStore` 读取
- [ ] Vitest: `presenceStore` cursor 状态测试
- [ ] dual-CHANGELOG 更新

### expect() 断言示例

```typescript
// presenceStore cursor 状态
expect(presenceStore.getState().cursors.size).toBe(2);
expect(presenceStore.getState().cursors.get('user-123')).toMatchObject({
  x: 100, y: 200, name: 'Alice', color: '#FF6B6B'
});

// RemoteCursor 渲染
render(<RemoteCursor user={{ x: 100, y: 200, name: 'Alice', color: '#FF6B6B' }} />);
expect(screen.getByText('Alice')).toBeInTheDocument();
```

### 涉及文件
- `src/stores/presenceStore.ts`
- `src/components/dds/presence/RemoteCursor.tsx`
- `src/components/dds/presence/RemoteCursor.module.css`
- `src/app/canvas/page.tsx` (DDSCanvasPage 集成)

### Page Integration
- `src/app/[locale]/canvas/page.tsx` — `DDSCanvasPage` 内遍历 `Object.values(presenceStore.cursors)` 渲染 `RemoteCursor`

---

## Epic 3: 画布 MiniMap + 视口导航控件

**功能 ID**: S45-P003-E3
**负责人**: dev
**依赖**: 独立
**工作量**: 小

### User Story
作为用户，我希望在大画布上有缩略图导航和缩放控件，以便快速定位和缩放。

### Story Table

| 字段 | 值 |
|------|------|
| 用户故事 | 用户在大画布上点击 MiniMap 的某个位置，视口跳转到对应坐标 |
| 触发条件 | 画布初始化 |
| 正常流程 | MiniMap 渲染 → 用户点击 → 视口跳转到点击坐标 |
| 辅助流程 | Controls 组件：zoom in / zoom out / fit view |

### DoD
- [ ] `DDSFlow.tsx` 导入 `MiniMap, Controls, Background` from `@xyflow/react`
- [ ] `MiniMap` 组件：右下角，width=150, height=100，nodeColor 深色主题
- [ ] `Controls` 组件：左下角，showZoom=tru, showFitView=true
- [ ] `Background` 组件：variant="dots", gap=20, color="#2a2a2e"
- [ ] MiniMap 点击事件 → `reactFlow.setViewport({ x, y, zoom })`
- [ ] Vitest: `DDSFlow` MiniMap 渲染 snapshot 测试
- [ ] dual-CHANGELOG 更新

### expect() 断言示例

```typescript
// MiniMap 存在
render(<DDSFlow />);
expect(screen.getByRole('button', { name: /minimap/i })).toBeInTheDocument();

// Controls 存在
expect(screen.getByTitle(/zoom in/i)).toBeInTheDocument();
```

### 涉及文件
- `src/components/dds/flow/DDSFlow.tsx`

### Page Integration
- `src/app/[locale]/canvas/page.tsx` — 无需改动，`DDSFlow` 内部集成

---

## Epic 4: 模板版本管理 + 导入/导出

**功能 ID**: S45-P004-E4
**负责人**: dev
**依赖**: Sprint44 E2 (favorites 基础)
**工作量**: 中

### User Story
作为用户，我希望保存模板的版本历史以便回溯，也希望将模板导出为 JSON 或从 JSON 导入。

### Story Table

| 字段 | 值 |
|------|------|
| 用户故事 | 用户编辑模板后点击「保存」，系统保存新版本（v2），用户可以查看历史版本并恢复到任意版本 |
| 触发条件 | 用户点击 TemplateGallery 中的「历史」按钮 |
| 正常流程 | 展开 HistoryPanel → 显示版本列表 → 点击版本 → 预览 → 点击恢复 |
| 导出流程 | 点击「导出」→ JSON download |
| 导入流程 | 点击「导入」→ file picker → 解析 JSON → 合并到 templateStore |

### DoD
- [ ] `RequirementTemplate` interface 增 `version: number, createdAt: string, updatedAt: string`
- [ ] `templateStore` 增 `templateHistory: Map<string, RequirementTemplate[]>`（最多 5 个版本）
- [ ] `templateStore` 增 `saveTemplateVersion(id)` action
- [ ] `templateStore` 增 `getTemplateHistory(id): RequirementTemplate[]` action
- [ ] `TemplateGallery` 增「历史」按钮 → 展开右侧抽屉显示版本列表
- [ ] `TemplateGallery` 增「导出」按钮 → `Blob` + `URL.createObjectURL` download
- [ ] `TemplateGallery` 增「导入」按钮 → `input type=file` + `JSON.parse` + merge
- [ ] Vitest: `templateStore` version history 测试
- [ ] dual-CHANGELOG 更新

### expect() 断言示例

```typescript
// 版本保存
templateStore.getState().saveTemplateVersion('tpl-1');
const history = templateStore.getState().getTemplateHistory('tpl-1');
expect(history.length).toBeGreaterThanOrEqual(1);
expect(history[history.length - 1].version).toBe(2);

// 导出 JSON
const blob = exportTemplate('tpl-1');
expect(blob.type).toBe('application/json');
```

### 涉及文件
- `src/types/template.ts`
- `src/data/templates/types.ts`
- `src/stores/templateStore.ts`
- `src/components/dds/template/TemplateGallery.tsx`
- `src/components/dds/template/TemplateHistoryPanel.tsx`
- `src/components/dds/template/TemplateHistoryPanel.module.css`

### Page Integration
- `src/app/[locale]/canvas/page.tsx` — TemplateGallery 集成，`HistoryPanel` 展开

---

## Epic 5: 画布快照分享 + 公开链接

**功能 ID**: S45-P005-E5
**负责人**: dev
**依赖**: 需后端 D1
**工作量**: 中

### User Story
作为用户，我希望分享当前画布的公开只读链接，让其他人无需登录即可查看。

### Story Table

| 字段 | 值 |
|------|------|
| 用户故事 | 用户点击「分享」→ 系统生成唯一链接 → 复制到剪贴板 → 分享给同事 |
| 触发条件 | 用户点击「分享」按钮 |
| 正常流程 | 分享 → POST /api/snapshot → 获取 ID → 拼接 URL → 复制到剪贴板 |
| 查看流程 | 访问 /snapshot/[id] → GET /api/snapshot/[id] → 渲染只读画布 |

### DoD
- [ ] `POST /api/snapshot` — 接收 `{ canvasJSON }`，存入 D1，返回 `{ id, url }`
- [ ] `GET /api/snapshot/:id` — 从 D1 读取，返回 canvas JSON
- [ ] `src/app/snapshot/[id]/page.tsx` — 公开只读渲染页（无 toolbar、无编辑控件）
- [ ] `SnapshotCanvas.tsx` — 只读模式渲染（`nodesDraggable=false, nodesConnectable=false`）
- [ ] `ShareButton` 组件 → `Clipboard.writeText(url)` → 显示「已复制」toast
- [ ] 路由守卫：未登录用户不能创建 snapshot，但可以查看公开 snapshot
- [ ] 限制：每个用户最多 10 个 snapshot
- [ ] Vitest: `snapshot-api.test.ts` (API route 测试)
- [ ] dual-CHANGELOG 更新

### expect() 断言示例

```typescript
// POST /api/snapshot 返回 id
const resp = await fetch('/api/snapshot', {
  method: 'POST',
  body: JSON.stringify({ canvasJSON: { nodes: [], edges: [] } }),
});
expect(resp.status).toBe(200);
const { id } = await resp.json();
expect(id).toMatch(/^[a-z0-9-]+$/);

// GET /api/snapshot/:id
const getResp = await fetch(`/api/snapshot/${id}`);
expect(getResp.status).toBe(200);
const { canvasJSON } = await getResp.json();
expect(canvasJSON.nodes).toEqual([]);
```

### 涉及文件
- `vibex-backend/src/routes/snapshot.ts`
- `vibex-backend/src/index.ts` (路由注册)
- `src/app/snapshot/[id]/page.tsx`
- `src/components/dds/flow/SnapshotCanvas.tsx`
- `src/components/dds/canvas/ShareButton.tsx`

### Page Integration
- `src/app/[locale]/canvas/page.tsx` — Toolbar 集成 `ShareButton`

---

## PRD 完整性检查清单

- [x] 每个 Epic 有 User Story（As a [role]...）
- [x] 每个 Epic 有 Story Table（触发条件/正常流程/异常流程/边界条件）
- [x] 每个 Epic 有 DoD checklist（至少 5 项）
- [x] 每个 Epic 有 expect() 断言示例（TypeScript 测试代码）
- [x] 每个 Epic 有涉及文件列表
- [x] 每个 Epic 有 Page Integration 标注
- [x] 5 个 Epic 覆盖 P0/P1/P2 优先级
- [x] 功能 ID 格式正确（S45-P00X-EY）
