# Epic E08 Spec: 离线模式提示

> **Epic ID**: E08
> **Epic 名称**: 离线模式提示
> **优先级**: P2
> **预计工时**: 1h
> **关联 Feature**: F08
> **关联提案**: P008

---

## 1. 概述

检测网络状态变化，在网络断开时显示明确提示，并将用户操作本地缓存，恢复网络后自动同步，避免操作丢失。

---

## 2. 用户流程

```
用户在线操作
    ↓
网络断开（offline 事件）
    ↓
显示离线提示条
    ↓
用户操作存入本地队列
    ↓
网络恢复（online 事件）
    ↓
隐藏离线提示条
    ↓
自动同步队列中的操作
    ↓
显示同步成功提示
```

---

## 3. 组件设计

### 3.1 OfflineBanner

| 属性 | 类型 | 说明 |
|------|------|------|
| isOffline | boolean | 是否离线状态 |

**位置**: 页面顶部固定
**内容**: "网络已断开，部分功能不可用"

### 3.2 OperationQueue

```typescript
interface QueuedOperation {
  id: string
  type: 'save' | 'create' | 'update' | 'delete'
  payload: any
  timestamp: string
  retries: number
}
```

---

## 4. 实现细节

```typescript
// src/hooks/useNetworkStatus.ts
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  return isOnline
}

// src/services/syncQueue.ts
class SyncQueue {
  private queue: QueuedOperation[] = []
  
  async add(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>) {
    this.queue.push({
      ...operation,
      id: generateId(),
      timestamp: new Date().toISOString(),
      retries: 0
    })
    localStorage.setItem('pending_operations', JSON.stringify(this.queue))
  }
  
  async sync() {
    while (this.queue.length > 0) {
      const op = this.queue[0]
      try {
        await this.executeOperation(op)
        this.queue.shift()
      } catch (e) {
        if (op.retries >= 3) {
          this.queue.shift()
          // 通知用户失败
        } else {
          op.retries++
        }
      }
    }
    localStorage.setItem('pending_operations', JSON.stringify(this.queue))
  }
}
```

---

## 5. Stories 实现细节

### E08-S1: 网络状态检测（0.5h）

- [ ] 创建 `useNetworkStatus` hook
- [ ] 监听 online/offline 事件
- [ ] 初始状态检测

### E08-S2: 离线提示与恢复（0.5h）

- [ ] `OfflineBanner` 组件
- [ ] `SyncQueue` 服务实现
- [ ] 自动同步逻辑
- [ ] 同步结果提示

---

## 6. 验收测试用例

```typescript
describe('E08 离线模式提示', () => {
  it('E08-S1: 离线时显示提示条', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: false })
      window.dispatchEvent(new Event('offline'))
    })
    await expect(page.locator('.offline-banner')).toBeVisible()
    await expect(page.locator('.offline-banner')).toContainText('网络已断开')
  })

  it('E08-S1: 在线时隐藏提示条', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: true })
      window.dispatchEvent(new Event('online'))
    })
    await expect(page.locator('.offline-banner')).not.toBeVisible()
  })

  it('E08-S2: 操作队列缓存', async ({ page }) => {
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: false })
    })
    await page.click('#save-btn')
    const queue = await page.evaluate(() => 
      JSON.parse(localStorage.getItem('pending_operations') || '[]')
    )
    expect(queue.length).toBe(1)
  })
})
```
