# Vibex-Fourth Implementation Plan

**项目**: vibex-fourth — 协作功能渐进式集成 + 稳定性修复
**版本**: v1.0
**日期**: 2026-04-09
**架构师**: Architect Agent

---

## 1. 实施概述

### 1.1 目标

将 vibex-next E1-S4 协作功能代码集成到 vibex 主应用，分 3 个 Epic 交付：

| Epic | 目标 | 交付物 | 工期 |
|------|------|--------|------|
| E1 | 实时协作感知 | Firebase 接入 + PresenceLayer + ConflictBubble 集成 | 6.5h |
| E2 | 节点变更同步 | WebSocket 连接 + 节点同步 + ConflictBubble | 6h |
| E3 | 测试稳定性 | vitest 测试 + E2E 修复 + TypeScript 修复 | 8h |
| **合计** | | | **20.5h** |

### 1.2 Sprint 划分

```
Sprint 1（Day 1-3，~13h）
├── Day 1-2 AM: E1-S2 Firebase 真实接入
├── Day 2 PM: E1-S1 PresenceLayer 集成
└── Day 3: E2-S1 WebSocket 后端连接

Sprint 2（Day 4-6，~7.5h）
├── Day 4: E2-S2 ConflictBubble + E2-S3 降级 UI
├── Day 5: E3-S1 vitest 测试 + E3-S2 E2E 修复
└── Day 6: 缓冲 + ADR 更新
```

---

## 2. Sprint 1 详细计划

### 2.1 Day 1-2 AM: E1-S2 Firebase 真实接入（3h）

#### 任务清单

| # | 任务 | 产出文件 | 工时 | 依赖 |
|---|------|---------|------|------|
| 1.1 | 安装 firebase npm 包 | `pnpm add firebase` | 0.5h | - |
| 1.2 | 创建 `.env.local.example` | `vibex-fronted/.env.local.example` | 0.5h | - |
| 1.3 | 实现 `presence.ts` 真实 Firebase 操作 | `src/lib/firebase/presence.ts` | 1.5h | 1.1 |
| 1.4 | 实现 `usePresence` hook | `src/hooks/usePresence.ts` | 0.5h | 1.3 |
| 1.5 | 本地验证 Firebase 连接 | 浏览器验证 | 0.5h | 1.2, 1.4 |

#### 详细步骤

**Step 1.1: 安装 Firebase SDK**
```bash
cd /root/.openclaw/vibex/vibex-fronted
pnpm add firebase
```

**Step 1.2: 创建环境变量模板**
```bash
# .env.local.example
# Firebase Realtime Database
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

**Step 1.3: 改造 presence.ts（Mock → 真实 Firebase）**
```typescript
// src/lib/firebase/presence.ts
// 找到所有 TODO 标记，替换为真实 Firebase 实现

import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, onValue, onDisconnect, remove, update } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export async function setPresence(canvasId: string, userId: string, userName: string) {
  const presenceRef = ref(db, `presence/${canvasId}/${userId}`);
  await set(presenceRef, {
    userId,
    userName,
    onlineAt: Date.now(),
  });
  // 自动清理断线状态
  onDisconnect(presenceRef).remove();
}

export function subscribeToPresence(canvasId: string, callback: (others: PresenceUser[]) => void) {
  const presenceRef = ref(db, `presence/${canvasId}`);
  return onValue(presenceRef, (snapshot) => {
    const data = snapshot.val() || {};
    const others = Object.values(data) as PresenceUser[];
    callback(others);
  });
}

export function isFirebaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
  );
}
```

**验收标准**:
- [x] `firebase` 包已安装
- [x] `.env.local.example` 包含 6 个 `NEXT_PUBLIC_FIREBASE_*` 变量
- [x] `isFirebaseConfigured()` 在有环境变量时返回 `true`
- [ ] 两个浏览器 Tab 打开同一 Canvas，能互相看到对方头像

---

### 2.2 Day 2 PM: E1-S1 PresenceLayer 集成（1.5h）

#### 任务清单

| # | 任务 | 产出文件 | 工时 | 依赖 |
|---|------|---------|------|------|
| 2.1 | CanvasPage 引入 usePresence | `src/components/canvas/CanvasPage.tsx` | 0.5h | E1-S2 |
| 2.2 | CanvasPage 渲染 PresenceLayer | `src/components/canvas/CanvasPage.tsx` | 0.5h | 2.1 |
| 2.3 | Storybook PresenceLayer story 验收 | Storybook 浏览器验证 | 0.5h | 2.2 |

#### 详细步骤

**Step 2.1: CanvasPage 改造**
```tsx
// src/components/canvas/CanvasPage.tsx
import { usePresence } from '@/lib/firebase/presence';
import PresenceLayer from './components/canvas/PresenceLayer';

export default function CanvasPage({ params }: { params: { id: string } }) {
  const canvasId = params.id;
  // 从 auth context 获取当前用户信息
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';
  const userName = user?.name || 'Anonymous';

  // E1-S1: 初始化 Presence
  const { others } = usePresence(canvasId, userId, userName);

  return (
    <div className="canvas-container">
      {/* ... 现有 Canvas 代码 ... */}
      
      {/* E1-S1: 协作者头像层 */}
      <PresenceLayer others={others} />
    </div>
  );
}
```

**验收标准**:
- [x] `CanvasPage.tsx` 包含 `usePresence` hook 调用
- [x] `<PresenceLayer others={others} />` 已挂载
- [ ] 多个用户在线时，协作者头像显示正确
- [x] 头像超过 10 个时超出部分不渲染（usePresence slice(0,10)）

---

### 2.3 Day 3: E2-S1 WebSocket 后端连接（6h）

#### 任务清单

| # | 任务 | 产出文件 | 工时 | 依赖 |
|---|------|---------|------|------|
| 3.1 | 激活后端 WebSocket 端点 | `vibex-backend/src/services/websocket/index.ts` | 2h | - |
| 3.2 | 配置 Cloudflare Workers WebSocket | `wrangler.toml` | 1h | 3.1 |
| 3.3 | CanvasStore 集成 collaborationSync | `src/stores/canvasStore.ts` | 1.5h | - |
| 3.4 | useCollaboration 集成到 CanvasPage | `src/components/canvas/CanvasPage.tsx` | 1h | 3.3 |
| 3.5 | E2E WebSocket 连接验证 | `tests/e2e/` | 0.5h | 3.4 |

#### 详细步骤

**Step 3.1: 后端 WebSocket 端点激活**
```typescript
// vibex-backend/src/services/websocket/index.ts
// 确认 WebSocket handler 已实现，激活路由

import { CollaborationService } from '../CollaborationService';
import { connectionPool } from './connectionPool';

export async function handleWebSocket(ctx: Context) {
  const env = ctx.env;
  const url = new URL(ctx.request.url);
  const roomId = url.searchParams.get('roomId');
  
  if (!roomId) {
    return ctx.json({ error: 'roomId required' }, 400);
  }

  // Upgrade to WebSocket
  const upgraded = ctx.env.waitUntil(
    handleConnection(ctx, roomId, env)
  );
  
  return upgraded;
}

async function handleConnection(ctx: Context, roomId: string, env: Env) {
  const service = new CollaborationService(connectionPool, env);
  const room = service.getOrCreateRoom(roomId);
  
  // WebSocket 消息处理循环
  // 参考 CollaborationService.ts 现有实现
}
```

**Step 3.3: CanvasStore 集成**
```typescript
// src/stores/canvasStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { initCollaborationSync, handleRemoteNodeSync } from '@/lib/canvas/collaborationSync';

interface CanvasStore {
  nodes: Record<string, Node>;
  sync: (nodeId: string) => void;
  // ... existing code
}

export const useCanvasStore = create<CanvasStore>()(
  immer((set, get) => ({
    nodes: {},
    
    sync: (nodeId: string) => {
      // E2-S1: 初始化协作同步
      initCollaborationSync({
        roomId: get().projectId,
        onRemoteUpdate: (nodeId, data) => {
          handleRemoteNodeSync(nodeId, data);
          set((state) => {
            state.nodes[nodeId] = { ...state.nodes[nodeId], ...data };
          });
        },
      });
    },
    // ... existing code
  }))
);
```

**验收标准**:
- [ ] 后端 WebSocket 端点在 staging 环境可连接
- [ ] 前端 `useCollaboration` 在加入 room 后 `isConnected = true`
- [ ] 节点创建（broadcastNodeCreate）在另一个浏览器 Tab 可见
- [ ] WebSocket 断开后，指数退避重连（1s→2s→4s→8s→16s）正确执行
- [ ] 超过最大重试次数（5 次）后降级为单用户模式

---

## 3. Sprint 2 详细计划

### 3.1 Day 4: E2-S2 ConflictBubble + E2-S3 降级 UI（4h）

#### 任务清单

| # | 任务 | 产出文件 | 工时 | 依赖 |
|---|------|---------|------|------|
| 4.1 | ConflictBubble 集成到 CanvasPage | `src/components/canvas/CanvasPage.tsx` | 1h | E2-S1 |
| 4.2 | 实现 OfflineBanner 组件 | `src/components/canvas/OfflineBanner.tsx` | 1h | - |
| 4.3 | WebSocket 断线重连 UI 绑定 | `src/components/canvas/CanvasPage.tsx` | 1h | 4.1, 4.2 |
| 4.4 | 5 分钟冲突抑制逻辑 | `src/lib/canvas/collaborationSync.ts` | 1h | 4.1 |

#### 详细步骤

**Step 4.2: OfflineBanner 组件**
```tsx
// src/components/canvas/OfflineBanner.tsx
'use client';

interface OfflineBannerProps {
  onRetry?: () => void;
}

export default function OfflineBanner({ onRetry }: OfflineBannerProps) {
  return (
    <div 
      data-testid="offline-banner"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500/20 border border-yellow-500 px-6 py-3 rounded-lg"
    >
      <span>协作模式已降级，当前为单用户模式</span>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="ml-4 text-yellow-400 hover:text-yellow-300"
        >
          重试连接
        </button>
      )}
    </div>
  );
}
```

**Step 4.4: 5 分钟冲突抑制逻辑**
```typescript
// src/lib/canvas/collaborationSync.ts
const CONFLICT_SUPPRESS_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface ConflictState {
  lastConflictNodeId: string | null;
  lastConflictTime: number | null;
}

const conflictState: ConflictState = {
  lastConflictNodeId: null,
  lastConflictTime: null,
};

export function shouldShowConflictBubble(nodeId: string): boolean {
  const now = Date.now();
  if (
    conflictState.lastConflictNodeId === nodeId &&
    conflictState.lastConflictTime &&
    now - conflictState.lastConflictTime < CONFLICT_SUPPRESS_INTERVAL
  ) {
    return false; // 5 分钟内相同节点冲突不重复显示
  }
  conflictState.lastConflictNodeId = nodeId;
  conflictState.lastConflictTime = now;
  return true;
}
```

**验收标准**:
- [ ] ConflictBubble 在 LWW 冲突发生时可见
- [ ] "了解"按钮点击后 5 分钟内相同节点冲突不重复显示
- [ ] WebSocket 断开后 OfflineBanner 显示
- [ ] 重连成功后 OfflineBanner 隐藏

---

### 3.2 Day 5: E3-S1 vitest 测试 + E3-S2 E2E 修复（3h）

#### 任务清单

| # | 任务 | 产出文件 | 工时 | 依赖 |
|---|------|---------|------|------|
| 5.1 | 创建 sseToQueryBridge.ts | `src/lib/api/sseToQueryBridge.ts` | 1.5h | - |
| 5.2 | vitest 测试覆盖 6 个 canvas hooks | `tests/hooks/*.test.ts` | 1h | 5.1 |
| 5.3 | E2E 测试 waitForTimeout 重构 | `tests/e2e/*.spec.ts` | 0.5h | - |

#### 详细步骤

**Step 5.1: 创建 SSE Bridge**
```typescript
// src/lib/api/sseToQueryBridge.ts
import { QueryClient } from '@tanstack/react-query';
import { produce } from 'immer';

export function createSSEBridge(queryClient: QueryClient) {
  return {
    setQueryData(event: CanvasSSEEvent) {
      const { type, projectId, data } = event;
      
      if (type === 'node_update') {
        const queryKey = ['components', projectId, data.nodeId];
        queryClient.setQueryData(queryKey, (old) => 
          produce(old, (draft) => {
            Object.assign(draft, data);
          })
        );
      }
      // ... handle other event types
    },
  };
}
```

**Step 5.3: E2E waitForTimeout 重构**
```bash
# 扫描所有 waitForTimeout
grep -r "waitForTimeout" tests/e2e/ --include="*.spec.ts"

# 替换为 waitForSelector
# Before
await page.waitForTimeout(2000);

# After
await page.waitForSelector('[data-testid="some-element"]', { timeout: 5000 });
```

**验收标准**:
- [x] `grep "waitForTimeout" tests/e2e/*.spec.ts` → 0 results (>50ms)
- [ ] `@ci-blocking` 标记全部清除
- [ ] E2E 测试在 CI 稳定通过（flaky rate < 10%）

---

### 3.3 Day 6: 缓冲 + ADR 更新（1.5h）

#### 任务清单

| # | 任务 | 产出文件 | 工时 | 依赖 |
|---|------|---------|------|------|
| 6.1 | ADR-003 更新（WebSocket + LWW）| `docs/adr/ADR-003.md` | 0.5h | E2-S1 |
| 6.2 | ADR-004 更新（Firebase 配置）| `docs/adr/ADR-004.md` | 0.5h | E1-S2 |
| 6.3 | ADR-006 更新（SSE + Query）| `docs/adr/ADR-006.md` | 0.5h | E3-S1 |
| 6.4 | 最终回归测试 | CI pipeline | - | 所有 Epic |

---

## 4. 降级策略

### 4.1 Firebase 环境变量缺失

| 场景 | 处理方式 |
|------|---------|
| dev 环境 | 使用 `.env.local.example` 提示配置；console warning |
| prod 环境 | `isFirebaseConfigured()` 返回 false；协作功能降级为单用户模式 |

### 4.2 Cloudflare Workers WebSocket 不支持

| 场景 | 处理方式 |
|------|---------|
| WebSocket 连接失败 | 使用 SSE 长轮询 + Firebase 广播作为降级 |
| 节点同步 | Firebase Realtime Database 存储最新状态，轮询获取 |
| 实时性 | 降级为"最终一致"（非实时），延迟约 2-5s |

### 4.3 WebSocket 重连失败

| 场景 | 处理方式 |
|------|---------|
| 5 次重连失败 | 降级为单用户模式，显示 OfflineBanner |
| 30s 后 | 自动触发 `retryFirebase()` 尝试重新连接 |

---

## 5. 验收检查单

### Sprint 1 验收

- [x] E1-S2: Firebase 真实接入完成
- [x] E1-S1: PresenceLayer 集成完成
- [ ] E2-S1: WebSocket 后端连接完成
- [ ] `pnpm lint` 通过
- [ ] `npx tsc --noEmit` 通过

### Sprint 2 验收

- [ ] E2-S2: ConflictBubble 集成完成
- [ ] E2-S3: 降级 UI 完成
- [ ] E3-S1: vitest 测试覆盖率 ≥ 80%
- [x] E3-S2: E2E 测试稳定（waitForTimeout > 50ms 已消除）
- [ ] ADR-003/004/006 更新为 "Implemented"
- [x] `pnpm build` 输出 0 TypeScript 错误

---

## 6. 技术债务

| # | 技术债务 | 优先级 | 备注 |
|---|---------|--------|------|
| TD1 | E1-S4 SSE → Query 缓存桥接（待完成）| P1 | Sprint 2 核心任务 |
| TD2 | TanStack Query SSE 数据隔离（待修复）| P1 | Sprint 2 核心任务 |
| TD3 | E2E 测试 waitForTimeout 重构 | P2 | Sprint 2 完成 |
| TD4 | `@ci-blocking` 标记清除 | P2 | Sprint 2 完成 |

---

## 7. 风险缓解检查单

- [ ] Firebase 项目已创建并凭证已提供（Coord 确认）
- [ ] Cloudflare Workers 支持 WebSocket（Architect 确认）
- [ ] CanvasPage auth context 提供 userId（Dev 确认）
- [ ] 每个 Epic 开始前执行 `pnpm build` 验证
- [ ] Storybook Chromatic Diff Block Merge 配置完成

---

*Architect Agent | 2026-04-09 | Vibex-Fourth Implementation Plan*
