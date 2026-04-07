# Spec — Epic 2: P1 可维护性改进

**Project:** vibex-architect-proposals-vibex-proposals-20260408
**Epic:** Epic 2 — P1 Maintainability Improvements
**Sprint:** Sprint 2 (7d)
**Status:** Draft
**Date:** 2026-04-08

---

## 概述

Epic 2 在 Epic 1 建立的类型安全和 Store 治理基础上，解决 API 可维护性和协作功能缺失问题：

1. v1/canvas API 387 行单文件 → 独立路由 + 独立测试
2. Canvas 实时协作 WebSocket + SSE MVP
3. Legacy store 残留引用彻底清理

**前置依赖:** Epic 1（P0-2 Store 治理需先建立统一数据模型）

---

## Story 2.1 — Ar-P1-1: v1/canvas 路由拆分

### 背景

`routes/v1/canvas/index.ts` 387 行，包含 3 个生成端点的全部逻辑：
- `POST /generate-contexts`
- `POST /generate-flows`
- `POST /generate-components`

单文件导致：无法独立测试、单点故障、扩展困难。

### 实现方案

**目标目录结构：**
```
routes/v1/canvas/
├── index.ts           # 路由注册（≤ 50 行）
├── contexts.ts        # generate-contexts 逻辑（~120 行）
├── flows.ts           # generate-flows 逻辑（~120 行）
├── components.ts      # generate-components 逻辑（~120 行）
├── types.ts           # 共享 DTO 类型
├── __tests__/
│   ├── contexts.test.ts
│   ├── flows.test.ts
│   └── components.test.ts
└── __fixtures__/
    ├── contexts.fixture.ts
    └── flows.fixture.ts
```

**文件: `routes/v1/canvas/index.ts`**（重构，≤ 50 行）

```typescript
import { Hono } from 'hono';
import { contextsRouter } from './contexts';
import { flowsRouter } from './flows';
import { componentsRouter } from './components';

const canvas = new Hono();

canvas.post('/generate-contexts', contextsRouter);
canvas.post('/generate-flows', flowsRouter);
canvas.post('/generate-components', componentsRouter);

// Health check (optional)
canvas.get('/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

export default canvas;
```

**文件: `routes/v1/canvas/contexts.ts`**

```typescript
import type { Context, Next } from 'hono';
import { z } from 'zod';

const GenerateContextsSchema = z.object({
  projectId: z.string().min(1),
  domain: z.string().optional(),
  options: z.object({
    maxDepth: z.number().min(1).max(10).default(3),
    includeRelations: z.boolean().default(true),
  }).optional(),
});

const contextsRouter = async (c: Context, next: Next) => {
  const body = await c.req.json();
  
  const parseResult = GenerateContextsSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: 'Invalid request', details: parseResult.error.issues }, 400);
  }

  const { projectId, domain, options } = parseResult.data;

  try {
    const contexts = await generateContexts({
      projectId,
      domain,
      maxDepth: options?.maxDepth ?? 3,
      includeRelations: options?.includeRelations ?? true,
    });

    return c.json({ data: contexts, meta: { count: contexts.length } }, 201);
  } catch (error) {
    console.error('generate-contexts error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
};

async function generateContexts(params: {
  projectId: string;
  domain?: string;
  maxDepth: number;
  includeRelations: boolean;
}) {
  // Move existing logic from index.ts here
  // ...
  return [];
}

export { contextsRouter };
```

**文件: `routes/v1/canvas/__tests__/contexts.test.ts`**

```typescript
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, httpDiff } from 'msw';

// Mock external dependencies (AI service, D1 DB, etc.)
const server = setupServer(
  http.post('https://api.openai.com/v1/chat/completions', () => {
    return new HttpResponse(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ contexts: [] }) } }],
    }));
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

describe('POST /generate-contexts', () => {
  test('returns 201 with contexts array', async () => {
    const res = await fetch('/api/v1/canvas/generate-contexts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj-123' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toBeInstanceOf(Array);
  });

  test('returns 400 for missing projectId', async () => {
    const res = await fetch('/api/v1/canvas/generate-contexts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid request');
  });

  test('respects maxDepth option', async () => {
    const res = await fetch('/api/v1/canvas/generate-contexts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj-123', options: { maxDepth: 5 } }),
    });
    expect(res.status).toBe(201);
  });

  test('rejects maxDepth > 10', async () => {
    const res = await fetch('/api/v1/canvas/generate-contexts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'proj-123', options: { maxDepth: 15 } }),
    });
    expect(res.status).toBe(400);
  });
});
```

### 验收标准

- [ ] `wc -l routes/v1/canvas/index.ts` ≤ 50 行
- [ ] 每个端点（contexts/flows/components）有独立 `.ts` 文件
- [ ] 每个端点有独立 Vitest 测试文件，覆盖率 ≥ 80%
- [ ] `pnpm test:unit routes/v1/canvas/ --run` 全通过
- [ ] `pnpm test:e2e canvas/` 全部通过

---

## Story 2.2 — Ar-P1-2: Canvas 实时协作 MVP

### 背景

WebSocket 基础设施已存在于 `/services/websocket/`，但未集成到 Canvas。需要实现：
- Cursor presence（用户游标位置共享）
- SSE 状态推送（canvas 对象变更实时推送）
- 多用户冲突检测（基础乐观锁）

### 实现方案

**Phase 1: WebSocket Presence Layer（2d）**

利用现有 WebSocket 基础设施，新建 Canvas presence 层：

**文件: `services/websocket/canvasPresence.ts`**

```typescript
import { WebSocketManager } from './wsManager';

interface CursorPosition {
  userId: string;
  userName: string;
  color: string; // per-user cursor color
  x: number;
  y: number;
  timestamp: number;
}

interface CanvasRoom {
  canvasId: string;
  users: Map<string, { ws: WebSocket; cursor: CursorPosition | null }>;
}

export class CanvasPresenceService {
  private rooms = new Map<string, CanvasRoom>();
  private wsManager: WebSocketManager;

  constructor(wsManager: WebSocketManager) {
    this.wsManager = wsManager;
    this.registerHandlers();
  }

  private registerHandlers() {
    this.wsManager.on('canvas:join', ({ canvasId, userId, userName }) => {
      this.joinRoom(canvasId, userId, userName);
    });

    this.wsManager.on('canvas:leave', ({ canvasId, userId }) => {
      this.leaveRoom(canvasId, userId);
    });

    this.wsManager.on('canvas:cursor', ({ canvasId, userId, x, y }) => {
      this.updateCursor(canvasId, userId, x, y);
    });
  }

  joinRoom(canvasId: string, userId: string, userName: string) {
    let room = this.rooms.get(canvasId);
    if (!room) {
      room = { canvasId, users: new Map() };
      this.rooms.set(canvasId, room);
    }

    const color = this.assignUserColor(room);
    const ws = this.wsManager.getSocket(userId);
    room.users.set(userId, { ws, cursor: null });

    // Notify others
    this.broadcast(canvasId, {
      type: 'user:joined',
      userId,
      userName,
      color,
      activeUsers: this.getActiveUsers(canvasId),
    }, userId);

    // Send current state to new user
    this.sendTo(userId, {
      type: 'room:state',
      canvasId,
      activeUsers: this.getActiveUsers(canvasId),
    });
  }

  updateCursor(canvasId: string, userId: string, x: number, y: number) {
    const room = this.rooms.get(canvasId);
    if (!room) return;

    const userEntry = room.users.get(userId);
    if (!userEntry) return;

    userEntry.cursor = { userId, userName: 'TBD', color: 'TBD', x, y, timestamp: Date.now() };

    // Broadcast to all other users in the room
    this.broadcast(canvasId, {
      type: 'cursor:update',
      userId,
      x,
      y,
      timestamp: Date.now(),
    }, userId);
  }

  leaveRoom(canvasId: string, userId: string) {
    const room = this.rooms.get(canvasId);
    if (!room) return;

    room.users.delete(userId);

    this.broadcast(canvasId, {
      type: 'user:left',
      userId,
      activeUsers: this.getActiveUsers(canvasId),
    });

    if (room.users.size === 0) {
      this.rooms.delete(canvasId);
    }
  }

  private broadcast(canvasId: string, message: unknown, excludeUserId?: string) {
    const room = this.rooms.get(canvasId);
    if (!room) return;

    const payload = JSON.stringify(message);
    for (const [uid, entry] of room.users) {
      if (uid !== excludeUserId && entry.ws.readyState === 1) { // OPEN
        entry.ws.send(payload);
      }
    }
  }

  private sendTo(userId: string, message: unknown) {
    // send to specific user
  }

  private assignUserColor(room: CanvasRoom): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    const usedColors = new Set([...room.users.values()].map(u => u.cursor?.color));
    return colors.find(c => !usedColors.has(c)) ?? colors[0];
  }

  private getActiveUsers(canvasId: string) {
    const room = this.rooms.get(canvasId);
    if (!room) return [];
    return [...room.users.entries()].map(([userId, entry]) => ({
      userId,
      color: entry.cursor?.color,
      hasCursor: !!entry.cursor,
    }));
  }

  getRoomCount(): number {
    return this.rooms.size;
  }
}
```

**Phase 2: SSE 状态推送（2d）**

复用现有 SSE 基础设施推送 canvas 状态变更：

**文件: `services/sse/canvasEmitter.ts`**

```typescript
import { EventEmitter } from 'events';

class CanvasStateEmitter extends EventEmitter {
  emitCanvasEvent(canvasId: string, event: CanvasStateEvent) {
    this.emit(`canvas:${canvasId}`, event);
  }

  subscribeToCanvas(canvasId: string, callback: (event: CanvasStateEvent) => void) {
    this.on(`canvas:${canvasId}`, callback);
    return () => this.off(`canvas:${canvasId}`, callback);
  }
}

export const canvasStateEmitter = new CanvasStateEmitter();

// Integration with canvas store
// When canvas objects are created/updated/deleted:
canvas.on('object:created', (object: CanvasObject) => {
  canvasStateEmitter.emitCanvasEvent(canvasId, {
    type: 'object:created',
    object,
    userId: currentUserId,
    timestamp: Date.now(),
  });
});
```

**前端集成（`vibex-fronted/src/hooks/useCanvasPresence.ts`）：**

```typescript
import { useEffect, useRef, useState } from 'react';

interface ActiveUser {
  userId: string;
  userName: string;
  color: string;
  cursor: { x: number; y: number } | null;
}

export function useCanvasPresence(canvasId: string, enabled: boolean = true) {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const ws = new WebSocket(`${WS_BASE}/canvas`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'canvas:join', canvasId, userId, userName }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'room:state') {
        setActiveUsers(msg.activeUsers);
      }
      if (msg.type === 'cursor:update') {
        setActiveUsers(prev =>
          prev.map(u => u.userId === msg.userId ? { ...u, cursor: { x: msg.x, y: msg.y } } : u)
        );
      }
      if (msg.type === 'user:joined' || msg.type === 'user:left') {
        setActiveUsers(msg.activeUsers);
      }
    };

    return () => {
      ws.send(JSON.stringify({ type: 'canvas:leave', canvasId, userId }));
      ws.close();
    };
  }, [canvasId, enabled]);

  const updateCursor = (x: number, y: number) => {
    wsRef.current?.send(JSON.stringify({ type: 'canvas:cursor', canvasId, x, y }));
  };

  return { activeUsers, updateCursor };
}
```

### 验收标准

- [ ] 两个浏览器 tab 同时打开同一 canvas，cursor 位置同步延迟 < 500ms
- [ ] WebSocket 连接数 ≥ 2 时无内存泄漏（通过 `getRoomCount()` 验证）
- [ ] Playwright E2E: `expect(page2.locator('.cursor-indicator')).toBeVisible()`
- [ ] canvas 对象增删改时 SSE 订阅者收到推送（< 200ms）

---

## Story 2.3 — Ar-P1-3: Legacy Store 清理

### 背景

`canvas-optimization-roadmap E2` 已删除 `canvasStore.ts`，但仍有残留引用：
- Phase2 canvasStore 已删但仍有部分接口 re-export
- 2026-04-05 `canvas-button-cleanup` 分支引用了部分 deprecated 接口
- `canvasHistoryStore.ts` 已被 `06ad16d8` 删除，但导入未清理

### 实现方案

**Step 1: 全面扫描**

```bash
# 扫描所有 legacy store 残留引用
grep -rn "canvasStore\b\|canvasHistoryStore\b\|deprecatedStore\b" \
  vibex-fronted/src/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v node_modules \
  | grep -v @deprecated
```

**Step 2: 分类处理**

每条引用的处理决策：

| 类型 | 决策 |
|------|------|
| 导入已删除的 store | 修复 import 路径或删除导入行 |
| 仍使用但应迁移 | 分配到 Epic 1 Story 1.2（Store 治理）合并 |
| 已在 E2 删除但有 re-export | 删除 re-export |
| 真正废弃 | 添加 `@deprecated` 注释，设定 2026-04-15 删除 deadline |

**Step 3: 废弃注释模板**

```typescript
// vibex-fronted/src/stores/deprecated/legacyCanvasStore.ts

/**
 * @deprecated 2026-04-05 — 已迁移至 canvasStore
 * 
 * 迁移路径:
 * - Flow 数据 → canvasStore.flows
 * - Context 数据 → canvasStore.contexts
 * - Selection 数据 → canvasStore.selection
 * 
 * 截止日期: 2026-04-15（届时此文件将被删除）
 * 负责人: @team
 * 
 * 最后使用位置:
 * - src/components/canvas/ClearCanvasButton.tsx (将在 2026-04-10 修复)
 */
export const legacyCanvasStore = { /* ... */ };
```

**Step 4: CI 自动化检查**

```yaml
# .github/workflows/check-legacy-cleanup.yml
- name: Check for legacy store references
  run: |
    COUNT=$(grep -rn "canvasStore\b" vibex-fronted/src/ \
      --include="*.ts" --include="*.tsx" \
      | grep -v node_modules | grep -v "@deprecated" \
      | wc -l)
    if [ "$COUNT" -gt 0 ]; then
      echo "Found $COUNT legacy canvasStore references (non-deprecated)"
      grep -rn "canvasStore\b" vibex-fronted/src/ \
        --include="*.ts" --include="*.tsx" \
        | grep -v node_modules | grep -v "@deprecated"
      exit 1
    fi
```

### 验收标准

- [ ] `grep -rn "@deprecated" vibex-fronted/src/stores/ | wc -l` ≥ legacy store 总数
- [ ] `grep -rn "canvasStore\b" vibex-fronted/src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v "@deprecated" | wc -l` = 0
- [ ] 所有 legacy store 有完整 `@deprecated` 注释（含迁移路径 + 截止日期）
- [ ] CI 在 2026-04-15 后拒绝包含废弃 store 引用的 PR

---

## 技术债务追踪

Epic 2 完成后：

- [ ] 更新 `docs/learnings/canvas-testing-strategy.md` — 添加 WebSocket 测试规范
- [ ] 新建 `docs/learnings/canvas-realtime-collaboration.md` — 协作功能架构文档
- [ ] 更新 `api-contract.yaml` 反映路由拆分后的新结构
