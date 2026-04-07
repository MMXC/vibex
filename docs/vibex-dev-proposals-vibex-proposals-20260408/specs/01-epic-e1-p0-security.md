# SPEC: E1 - P0 安全修复 — Workers 运行时兼容性

> **所属 Epic**: E1
> **PRD**: vibex-dev-proposals-vibex-proposals-20260408/prd.md
> **状态**: Ready for Dev
> **依赖**: analysis.md, dev.md

---

## 1. 概述

修复 3 个 Cloudflare Workers 运行时不兼容问题。这些问题直接导致生产环境中 CollaborationService、ConnectionPool、NotificationService 无法正常工作。

---

## 2. S1.1: CollaborationService 乐观锁修复

### 文件

- `vibex-backend/src/services/CollaborationService.ts`

### 变更

**问题**: `acquireLock` 每次都覆写 lock 文件，不检查是否已存在。TTL 在 `hasLock` 中做比较，但 `acquireLock` 没有调用它。

**修复**:

```typescript
async acquireLock(projectId: string, stageId: string, ttlMs = 300_000): Promise<void> {
  // Step 1: 检查是否存在有效 lock（乐观锁语义）
  if (await this.hasLock(projectId, stageId)) {
    throw new LockHeldError(`Lock already held for ${projectId}/${stageId}`);
  }
  await fs.mkdir(this.lockDir, { recursive: true });
  const lockFile = this.lockPath(projectId, stageId);
  const content = JSON.stringify({ projectId, stageId, acquiredAt: Date.now(), ttlMs });
  await fs.writeFile(lockFile, content, 'utf-8');
}

async refreshLock(projectId: string, stageId: string): Promise<void> {
  const lockFile = this.lockPath(projectId, stageId);
  const raw = await fs.readFile(lockFile, 'utf-8');
  const lock = JSON.parse(raw);
  lock.acquiredAt = Date.now(); // 刷新时间
  await fs.writeFile(lockFile, JSON.stringify(lock), 'utf-8');
}

async hasLock(projectId: string, stageId: string): Promise<boolean> {
  const lockFile = this.lockPath(projectId, stageId);
  try {
    const raw = await fs.readFile(lockFile, 'utf-8');
    const lock = JSON.parse(raw);
    const age = Date.now() - lock.acquiredAt;
    return age < lock.ttlMs;
  } catch {
    return false;
  }
}
```

**新增错误类型**:

```typescript
export class LockHeldError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LockHeldError';
  }
}
```

**新增方法**:

- `refreshLock(projectId, stageId)` — 刷新已有 lock 的 TTL
- `hasLock(projectId, stageId)` — 检查 lock 是否存在且有效（公开）
- `LockHeldError` — 专用错误类型

### 验收

```typescript
// spec: CollaborationService.lock.spec.ts
describe('CollaborationService lock semantics', () => {
  it('should throw LockHeldError when lock already exists', async () => { ... });
  it('should throw LockRequiredError when lock has expired', async () => { ... });
  it('should extend TTL when refreshLock is called', async () => { ... });
  it('should allow re-acquire after explicit release', async () => { ... });
  it('should return false from hasLock when no lock exists', async () => { ... });
});
```

---

## 3. S1.2: ConnectionPool 移除 setInterval

### 文件

- `vibex-backend/src/services/websocket/connectionPool.ts`

### 变更

**问题**: `startHeartbeat()` 使用 `setInterval`，CF Workers 不支持。

**修复**: 移除 `startHeartbeat()`，改为按需检查：

```typescript
private lastCheck = 0;
private readonly CHECK_INTERVAL = 30_000; // 30s

private checkIfNeeded(): void {
  const now = Date.now();
  if (now - this.lastCheck > this.CHECK_INTERVAL) {
    this.lastCheck = now;
    this.checkConnections();
  }
}

// 在所有公开方法中调用
broadcastToRoom(roomId: string, message: any): number {
  this.checkIfNeeded(); // ← 每次广播时顺便检查
  // ...
}

sendToUser(userId: string, message: any): number {
  this.checkIfNeeded(); // ← 每次发送时检查
  // ...
}

add(conn: Connection): boolean {
  // ...
  this.checkIfNeeded(); // ← 新连接加入时检查
  return true;
}
```

**删除**:

- `startHeartbeat()` 方法
- `heartbeatTimer` 属性
- `stopHeartbeat()` 方法（如存在）

### 验收

```typescript
// spec: connectionPool.heartbeat.spec.ts
describe('ConnectionPool heartbeat', () => {
  it('should not contain setInterval or setTimeout', () => { ... });
  it('should remove timed-out connection on broadcastToRoom', async () => { ... });
  it('should remove timed-out connection on sendToUser', async () => { ... });
  it('should not remove healthy connection on broadcastToRoom', async () => { ... });
  it('should check at most once per CHECK_INTERVAL (30s)', async () => { ... });
});
```

---

## 4. S1.3: NotificationService KV 切换

### 文件

- `vibex-backend/src/services/NotificationService.ts`

### 变更

**问题**: 使用 `fs.readFile/writeFile`，CF Workers 无本地文件系统。

**修复**:

```typescript
import type { KVNamespace } from '@cloudflare/workers-types';

export class NotificationService {
  private kv: KVNamespace;
  private readonly ttlMs: number;

  constructor(kv: KVNamespace, ttlMs = 30 * 60 * 1000) {
    this.kv = kv;
    this.ttlMs = ttlMs;
  }

  private computeKey(channel: string, text: string): string {
    return crypto.subtle
      ? crypto.subtle.digestSync('SHA-256', new TextEncoder().encode(`${channel}:${text}`))
      : `${channel}:${text}`.split('').reduce((a, b) => { a = (a << 5) - a + b.charCodeAt(0); return a & a; }, 0).toString(36);
  }

  async isDuplicate(channel: string, text: string): Promise<boolean> {
    const key = this.computeKey(channel, text);
    const cached = await this.kv.get(key);
    return cached !== null;
  }

  async send(notification: SlackNotification): Promise<SendResult> {
    const key = this.computeKey(notification.channel, notification.text);
    const existing = await this.kv.get(key);
    if (existing) return { skipped: true, reason: 'duplicate' };

    await this.kv.put(key, JSON.stringify({ sentAt: Date.now() }), {
      expirationTtl: Math.floor(this.ttlMs / 1000),
    });

    // ...send to Slack
    return { skipped: false, sentAt: Date.now() };
  }
}
```

**删除**:
- `loadCache()` / `saveCache()` 方法
- `cachePath` / `entries` / `loaded` 属性
- `fs.readFile` / `fs.writeFile` 调用

**新增**:
- `computeKey()` 方法（SHA-256 哈希，用于 KV key）
- `isDuplicate()` 公开方法

### 验收

```typescript
// spec: NotificationService.kv.spec.ts
describe('NotificationService KV integration', () => {
  it('should call KV.put instead of fs.writeFile', async () => { ... });
  it('should set expirationTtl to 1800 seconds (30min)', async () => { ... });
  it('should skip duplicate within TTL window', async () => { ... });
  it('should allow send after TTL expires', async () => { ... });
  it('should deduplicate identical channel+text pairs', async () => { ... });
  it('should generate consistent key for same channel+text', async () => { ... });
});
```

---

## 5. E1 Epic DoD Checklist

- [ ] D-P0-1: 3 个 `expect()` 断言测试全部通过
- [ ] D-P0-2: `setInterval`/`setTimeout` 在 ConnectionPool 源码中零出现
- [ ] D-P0-3: KV API 测试覆盖 5 个场景
- [ ] **Staging 验证通过**（强制 Gate）
- [ ] 无 Vitest/Jest 语法混用（全文统一）
- [ ] `npm run test -- --run` 全部通过
