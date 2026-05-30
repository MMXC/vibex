# VibeX Sprint 45 架构设计

> **Agent**: coord (heartbeat self-implement)
> **日期**: 2026-05-31
> **Sprint**: Sprint 45

---

## 架构决策 1: AI 流式重试机制

### 技术方案
在 `useStreamingAgent` 层实现 exponential backoff 重试，不修改 SSE 协议。

**方案 A（选用）: Hook 层重试**
```
SSE 断开 → 触发 retry → 重新发起 fetch → 累积 chunk
```
- 优点：实现简单，不涉及后端
- 缺点：已完成 chunk 可能有重复（需 dedup）

**方案 B: 后端 SSE 重连**
- 需要后端维护 session 状态，复杂度高

**推荐**: 方案 A，MVP 可行。

### 风险
- SSE 不可重入：已完成 chunk 可能被追加两次
- **缓解**: dedup 策略（基于 chunk index/timestamp）

---

## 架构决策 2: Presence Cursor 广播

### 技术方案
复用现有 WebSocket presence channel，新增 `cursor_move` 消息类型。

**消息格式**:
```typescript
interface CursorMoveMessage {
  type: 'cursor_move';
  userId: string;
  x: number;
  y: number;
  timestamp: number;
}
```

**Store 扩展**:
```typescript
cursors: Map<string, {x: number, y: number, name: string, color: string}>
```

**Throttle**: 100ms 客户端节流，避免消息风暴。

---

## 架构决策 3: MiniMap 集成

### 技术方案
使用 `@xyflow/react` 内置 `MiniMap` 组件，无额外安装。

**关键配置**:
```typescript
<MiniMap
  nodeColor={(node) => '#374151'}
  maskColor="rgba(0,0,0,0.6)"
  style={{ width: 150, height: 100, bottom: 16, right: 16 }}
  onClick={(event, node) => reactFlow.setViewport({ x: node.x, y: node.y, zoom: 1 })}
/>
```

---

## 架构决策 4: Snapshot 公开分享

### 技术方案
后端 D1 存储 snapshot JSON，Cloudflare Pages 部署公开只读页。

**API 设计**:
```
POST /api/snapshot  → D1 INSERT → { id: string }
GET  /api/snapshot/:id → D1 SELECT → { canvasJSON }
```

**路由**: `src/app/snapshot/[id]/page.tsx` — Next.js App Router 动态路由，SSG/SSR 均可。

**安全**: 未登录用户可访问 GET（公开），POST 需要 auth token。D1 row limit 每人 10 条。

---

## 技术比较

| 功能 | 方案 | 风险 | 复杂度 |
|------|------|------|--------|
| AI 重试 | Hook 层 retry | chunk dedup | 中 |
| Cursor 广播 | WebSocket 新消息类型 | 消息风暴 | 中 |
| MiniMap | @xyflow/react 内置 | 大画布性能 | 低 |
| 模板版本 | 前端 Map 存储 | 无云端同步 | 中 |
| Snapshot 分享 | D1 + 公开路由 | 滥用防护 | 中 |

---

## 风险表

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| SSE 重试 chunk 重复 | 中 | 中 | dedup by chunk index |
| Cursor 消息风暴 | 中 | 高 | 100ms throttle |
| MiniMap 大画布性能 | 低 | 低 | lazy update |
| Snapshot D1 滥用 | 中 | 中 | per-user row limit 10 |
