# VibeX Sprint 84 — 系统架构

> **Date**: 2026-06-10
> **Sprint**: 84

---

## 一、当前系统状态

### 1.1 前端架构

```
vibex-fronted/
├── src/
│   ├── app/                    # Next.js App Router
│   ├── components/             # React 组件
│   │   ├── VersionTimeline/    # S83-E1 时间轴组件
│   │   ├── ImportShareDialog/  # S83-E2 分享链接导入
│   │   ├── ConflictConfirmToast/ # S83-E3 冲突确认
│   │   └── TagSelector/        # S83-E4 标签选择器
│   ├── stores/                 # Zustand 状态管理
│   │   ├── canvasTimelineStore.ts  # S83-E1
│   │   └── tagStore.ts         # S83-E4
│   └── lib/
│       └── services/          # API 服务层
│           └── TagService.ts   # S83-E4
```

**状态管理**：
- Zustand stores for local UI state
- TanStack Query for server state
- No Redux dependency

**样式系统**：
- CSS Modules + CSS Variables (design-tokens.css)
- No Tailwind, no inline styles

### 1.2 后端架构

```
vibex-backend/src/
├── index.ts                    # Cloudflare Worker 入口
├── routes/
│   └── canvas.ts              # Canvas CRUD API
└── db/
    └── schema.ts              # D1 SQLite schema
```

**部署**：Cloudflare Workers + D1 + R2

---

## 二、Proposed Changes

### 2.1 F01: 版本 Diff 对比

**新增 API**：
```
GET /api/canvas/:id/diff?from={versionId}&to={versionId}
Response: {
  added: CanvasNode[],
  removed: CanvasNode[],
  modified: { nodeId: string, before: CanvasNode, after: CanvasNode }[],
  from: string,
  to: string
}
```

**新增数据模型**：
```typescript
// 已有 models 不变，新增 diff 类型
interface CanvasDiff {
  added: CanvasNode[];
  removed: CanvasNode[];
  modified: ModifiedNode[];
}
```

**性能考虑**：
- Diff 计算在边缘 Worker 进行，支持流式返回
- 大型画布（>1000 nodes）分批返回，客户端虚拟化渲染
- 缓存策略：相同 from+to 的 diff 结果缓存 5 分钟

### 2.2 F02: 协作者在线状态

**WebSocket 消息扩展**：
```typescript
// 新增 presence 事件
interface PresenceEvent {
  type: 'presence';
  action: 'join' | 'leave' | 'move';
  userId: string;
  userName: string;
  userColor: string;  // 颜色池分配
  cursorPosition?: { x: number; y: number };
  nodeLock?: string; // 锁定的节点 ID
  timestamp: number;
}
```

**新增数据表**：
```sql
CREATE TABLE collaboration_sessions (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  joined_at INTEGER NOT NULL,
  last_active_at INTEGER NOT NULL
);
```

**状态管理**：
- Zustand slice: `presenceStore`
- 数据结构：`Map<userId, PresenceData>`

**性能考虑**：
- Presence 广播限频：每 100ms 最多一次位置更新
- 协作者数量上限：10 人（超出时显示警告）
- 断线检测：WebSocket ping/pong，30s 无响应视为离线

### 2.3 F03: 快速跳转面板

**新增数据源**：
- 画布列表：`/api/canvas/list` (已有)
- 最近访问：localStorage `recentCanvases` (新增)
- 版本节点：时间轴数据 (已有 via canvasTimelineStore)

**搜索实现**：
- 前端模糊搜索：Fuse.js
- 搜索索引：标题 + 标签 + 创建者
- 搜索结果上限：20 条

### 2.4 F04: 模板搜索增强与收藏

**新增 API**：
```
POST /api/templates/:id/favorite   # 收藏
DELETE /api/templates/:id/favorite # 取消收藏
GET /api/templates/favorites       # 我的收藏列表
GET /api/templates/search?q={query}&tags={tag1,tag2}
```

**新增数据表**：
```sql
CREATE TABLE user_template_favorites (
  user_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, template_id)
);
```

**搜索增强**：
- Fuse.js 模糊搜索：支持 typo 容错
- 搜索权重：标题 (0.5) + 标签 (0.3) + 描述 (0.2)
- 搜索结果缓存：30 秒

### 2.5 F05: 全局键盘快捷键

**存储**：
```typescript
// localStorage key: 'vibex-shortcuts'
interface ShortcutConfig {
  save: string;
  undo: string;
  redo: string;
  jump: string;
  fullscreen: string;
  toggleSidebar: string;
  help: string;
}
```

**快捷键映射**：
```typescript
// 默认值
const DEFAULT_SHORTCUTS = {
  save: 'ctrl+s',
  undo: 'ctrl+z',
  redo: 'ctrl+y',
  jump: 'ctrl+k',
  fullscreen: 'f11',
  toggleSidebar: 'ctrl+b',
  help: 'ctrl+/',
};
```

---

## 三、API 设计总结

| Feature | Method | Endpoint | 说明 |
|---------|--------|----------|------|
| F01 | GET | `/api/canvas/:id/diff` | 版本 diff |
| F02 | WS | `presence` event | 在线状态 (已有 WS 扩展) |
| F04 | POST | `/api/templates/:id/favorite` | 收藏模板 |
| F04 | DELETE | `/api/templates/:id/favorite` | 取消收藏 |
| F04 | GET | `/api/templates/search` | 增强搜索 |

---

## 四、性能考量

| Feature | 风险 | 缓解 |
|---------|------|------|
| F01 Diff | 大画布 diff 计算慢 | 边缘计算 + 流式返回 + 虚拟化 |
| F02 Presence | WS 消息风暴 | 限频 100ms + 协作者上限 10 |
| F03 Jump | 搜索卡顿 | Fuse.js 本地搜索 + 索引缓存 |
| F04 Search | 模板数量增长 | 分页 + 缓存 30s |
| F05 Shortcuts | 快捷键冲突 | 冲突检测 + 静默降级 |

---

## 五、测试策略

- **单元测试**：vitest，store 和组件隔离测试
- **E2E 测试**：Playwright，覆盖关键用户流程
- **WS 测试**：mock ws-server，测试 presence 逻辑
- **性能测试**：大画布 diff（1000+ 节点）渲染性能
