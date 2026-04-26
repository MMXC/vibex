# Spec — E8: Canvas 协作冲突解决

## 数据模型

```typescript
// Firebase RTDB 结构
/canvas/{canvasId}/locks/{cardId}
{
  "lockedBy": "userId",
  "lockedAt": 1714123456789,  // timestamp
  "username": "Alice"
}

/canvas/{canvasId}/cards/{cardId}
{
  "id": "cardId",
  "data": { ... },
  "lastModified": 1714123456789,  // timestamp，仲裁唯一依据
  "lastModifiedBy": "userId"
}
```

## Zustand Store 扩展

```typescript
interface CanvasStore {
  lockedCards: Record<string, { lockedBy: string; lockedAt: number; username: string }>
  localDrafts: Record<string, { data: CardData; lastModified: number }>

  lockCard(cardId: string, userId: string): void
  unlockCard(cardId: string): void
  updateCard(cardId: string, data: CardData): void
  checkConflict(cardId: string, remoteData: CardData): ConflictResult | null
  resolveConflict(cardId: string, strategy: 'keep-local' | 'use-remote'): void
}

interface ConflictResult {
  cardId: string
  localVersion: CardData
  remoteVersion: CardData
  remoteLastModified: number
  localLastModified: number
}
```

## LWW 仲裁策略

```
if (remote.lastModified > local.lastModified) {
  // 远程更新，自动采用远程（无 ConflictBubble）
  adoptRemote(cardId, remote)
} else {
  // 本地更新，弹出 ConflictBubble
  showConflictBubble(cardId, local, remote)
}
```

## ConflictBubble UI

**位置**: 卡片上方居中弹出
**设计**: 玻璃态风格，参考 DESIGN.md
**内容**:
- 标题: "冲突检测"
- diff 展示: 本地版本 vs 远程版本（统一颜色）
- 按钮: "保留我的版本" / "采用最新版本"

**行为**:
- 出现时禁止画布其他操作
- ESC 键默认选择「采用最新版本」
- 选择后关闭弹窗，执行对应策略

## 锁超时

```typescript
// 客户端定时器
const LOCK_TIMEOUT_MS = 60000
setInterval(() => {
  const now = Date.now()
  for (const [cardId, lock] of Object.entries(store.lockedCards)) {
    if (now - lock.lockedAt > LOCK_TIMEOUT_MS && lock.lockedBy === currentUserId) {
      store.unlockCard(cardId)
    }
  }
}, 10000) // 每 10 秒检查
```

## 降级策略

```typescript
// 所有 Firebase 调用必须包裹
if (isFirebaseConfigured()) {
  // Firebase 路径
} else {
  // 降级路径：本地状态，不报错
  console.warn('[Canvas] Firebase not configured, running in local-only mode')
}
```

## E2E 测试场景

```typescript
// tests/e2e/canvas-collaboration.spec.ts

describe('Canvas Collaboration E2E', () => {
  it('E8-S1: card lock visible to other users', async () => {
    // userA locks card
    // userB sees lock state
  })

  it('E8-S2: ConflictBubble appears on conflict', async () => {
    // userA edits card (local draft)
    // userB edits and saves same card (remote update)
    // ConflictBubble appears for userA
  })

  it('E8-S2: keep-local resolves conflict', async () => {
    // userA keeps local
    // verify remote data === local data
  })

  it('E8-S2: use-remote resolves conflict', async () => {
    // userA uses remote
    // verify local data === remote data
  })

  it('E8-S3: LWW — last write wins', async () => {
    // userA saves at t=1000
    // userB saves at t=2000
    // verify final state === userB version
  })

  it('E8: Firebase unconfigured path', async () => {
    // set isFirebaseConfigured = false
    // verify no errors, local-only mode works
  })
})
```
