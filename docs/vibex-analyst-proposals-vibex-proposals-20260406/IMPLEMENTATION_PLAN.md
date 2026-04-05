# VibeX P0/P1 修复实施计划

> **项目**: vibex-analyst-proposals-vibex-proposals-20260406  
> **作者**: architect  
> **日期**: 2026-04-06  
> **版本**: v1.0

---

## 概述

本文档定义 E1–E6 共 6 个 Epic 的详细实施步骤、部署清单、回滚方案和成功标准。实施分为两个 Sprint：
- **Sprint 1**（P0 修复）：E1、E2、E3，预计 1.1h
- **Sprint 2**（P1 改进）：E4、E5、E6，预计 4h

---

## Epic E1: OPTIONS 预检路由修复

### 详细步骤

**Step 1: 定位当前路由注册位置**
```bash
# 搜索 gateway.ts 中 OPTIONS handler 的当前注册位置
grep -n "options\|\.options" /root/.openclaw/vibex/vibex-backend/src/gateway.ts
```
确认 `protected_.options` 目前在 `authMiddleware` 之后。

**Step 2: 调整注册顺序**
```typescript
// gateway.ts（修复后）
import { Hono } from 'hono'

const app = new Hono()

// ✅ E1: OPTIONS Handler 在 authMiddleware 之前注册
app.options('/v1/*', async (c) => {
  c.status(204)
  return c
})

// 鉴权中间件（所有非 OPTIONS 请求）
app.use('/v1/*', authMiddleware)

// 受保护的路由
app.post('/v1/*', protectedHandler)
app.get('/v1/*', protectedHandler)
```

**Step 3: 手动验证**
```bash
# 验证 OPTIONS 返回 204
curl -X OPTIONS -I https://api.vibex.top/v1/projects

# 验证 GET 不受影响
curl -X GET https://api.vibex.top/v1/projects -H "Authorization: Bearer <token>"
```

**Step 4: 回归测试**
```bash
cd /root/.openclaw/vibex
pnpm test -- --testPathPattern="preflight|options"
```

---

## Epic E2: Canvas Context 多选修复

### 详细步骤

**Step 1: 定位 BoundedContextTree.tsx**
```bash
find /root/.openclaw/vibex -name "BoundedContextTree.tsx" -type f
```

**Step 2: 分析 checkbox 的 onChange 当前绑定**
```typescript
// 当前（错误）
<Checkbox
  checked={isSelected}
  onChange={() => toggleContextNode(id)}   // ❌ 会改变 context node 状态
  // ...
/>
```

**Step 3: 修改 onChange 绑定**
```typescript
// 修复后
interface BoundedContextNode {
  id: string
  label: string
  type: string
  children?: BoundedContextNode[]
}

interface BoundedContextTreeProps {
  nodes: BoundedContextNode[]
  selectedNodeIds: string[]
  onToggleSelect: (nodeId: string) => void   // ✅ 多选状态回调
  // ...
}

// 在组件内部，checkbox 部分：
<Checkbox
  checked={selectedNodeIds.includes(node.id)}
  onChange={() => {
    // ✅ 调用多选回调，而非 toggleContextNode
    onToggleSelect(node.id)
  }}
  // ...
/>
```

**Step 4: 验证修复**
```bash
# Jest 单元测试
pnpm test -- --testPathPattern="BoundedContextTree" --verbose
```

**Step 5: 手动交互测试**
1. 打开 Canvas Context 页面
2. 勾选/取消勾选多个 checkbox
3. 确认 `selectedNodeIds` 状态正确更新
4. 确认原有的 `toggleContextNode` 功能（右键菜单等）不受影响

---

## Epic E3: generate-components flowId

### 详细步骤

**Step 1: 定位相关文件**
```bash
# 搜索 generate-components 相关的 schema 和 prompt 文件
find /root/.openclaw/vibex -type f \( -name "*.ts" -o -name "*.json" \) \
  -exec grep -l "generate-components\|flowId" {} \; 2>/dev/null
```

**Step 2: 修改 Schema**
```typescript
// 修复前
interface Component {
  id: string
  name: string
  type: string
  // flowId 缺失 ❌
}

// 修复后
interface Component {
  id: string
  name: string
  type: string
  flowId: string   // ✅ 新增，格式 /^flow-/
}
```

**Step 3: 修改 Prompt 模板**
```typescript
// 修复 prompt，明确要求输出 flowId
const GENERATE_COMPONENTS_PROMPT = `
Generate component definitions as JSON array.

Each component MUST include:
- id: unique identifier (e.g., "comp-001")
- name: display name (e.g., "UserProfile")
- type: component type (e.g., "button", "input", "card")
- flowId: flow identifier in format "flow-{uuid}" (e.g., "flow-abc123")

Example:
[
  {
    "id": "comp-001",
    "name": "SubmitButton",
    "type": "button",
    "flowId": "flow-550e8400-e29b-41d4-a716-446655440000"
  }
]
`.trim()
```

**Step 4: 添加验证逻辑**
```typescript
// 验证 AI 返回的 flowId 格式
function validateComponent(component: unknown): Component {
  const comp = component as Component
  if (!comp.flowId || !/^flow-/.test(comp.flowId)) {
    throw new Error(`Invalid flowId: ${comp.flowId}`)
  }
  return comp
}
```

**Step 5: 测试**
```bash
pnpm test -- --testPathPattern="generate-components"
```

---

## Epic E4: SSE 超时 + 连接清理

### 详细步骤

**Step 1: 定位 aiService.ts**
```bash
find /root/.openclaw/vibex -name "aiService.ts" -o -name "aiService.tsx" | head -5
```

**Step 2: 实现超时包装**
```typescript
// aiService.ts（修复后）
import { Hono } from 'hono'

const TIMEOUT_MS = 10000  // 10 秒超时

interface ChatRequest {
  messages: Array<{ role: string; content: string }>
  model?: string
}

export async function chat(req: ChatRequest): Promise<ReadableStream> {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout>

  // ✅ E4-S4.1: 设置超时
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort()
      reject(new Error('AI request timeout after 10s'))
    }, TIMEOUT_MS)
  })

  try {
    const stream = await Promise.race([
      aiProvider.chat(req.messages, { signal: controller.signal }),
      timeoutPromise
    ])

    // ✅ E4-S4.2: cancel() 时清理所有计时器
    return new ReadableStream({
      start(controller) {
        // ...
      },
      async pull(controller) {
        const { value, done } = await stream.reader.read()
        if (done) {
          controller.close()
          clearTimeout(timer)  // ✅ 正常结束时清理
          return
        }
        controller.enqueue(value)
      },
      cancel() {
        // ✅ 关键修复：cancel 时清理所有计时器
        if (timer) clearTimeout(timer)
        controller.abort()
        stream.reader.cancel()
      }
    })
  } catch (err) {
    if (timer) clearTimeout(timer)  // ✅ 异常时清理
    throw err
  }
}
```

**Step 3: 测试超时逻辑**
```typescript
// __tests__/aiService.test.ts
describe('SSE timeout', () => {
  it('times out after 10 seconds', async () => {
    jest.useFakeTimers()
    const chatPromise = chat({ messages: [] })
    jest.advanceTimersByTime(10001)
    await expect(chatPromise).rejects.toThrow('timeout')
  })

  it('cancel() clears timers', async () => {
    const stream = await chat({ messages: [] })
    const clearSpy = jest.spyOn(global, 'clearTimeout')
    await stream.cancel()
    expect(clearSpy).toHaveBeenCalled()
  })
})
```

---

## Epic E5: 分布式限流

### 详细步骤

**Step 1: 替换 rateLimit.ts 实现**
```typescript
// rateLimit.ts（修复后）
import { caches } from '__STATIC_CONTENT_MANIFEST'

interface RateLimitOptions {
  limit: number
  windowMs: number
}

export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rate:${identifier}`
  const cache = caches.default

  // 查询当前计数
  const cached = await cache.match(key)
  const count = cached ? parseInt(await cached.text(), 10) : 0

  if (count >= options.limit) {
    return { allowed: false, remaining: 0 }
  }

  const newCount = count + 1
  const ttlSeconds = Math.ceil(options.windowMs / 1000)

  await cache.put(key, new Response(String(newCount)), {
    expirationTtl: ttlSeconds
  })

  return {
    allowed: true,
    remaining: options.limit - newCount
  }
}

export function isRateLimited(identifier: string): boolean {
  return checkRateLimit(identifier, {
    limit: 100,
    windowMs: 60_000
  }).then(r => !r.allowed)
}
```

**Step 2: 配置 wrangler.toml**
```toml
# wrangler.toml
name = "vibex-api"
main = "src/index.ts"
compatibility_date = "2024-04-01"

# ✅ E5: 确保 Cache API 可用
node_compat = true

[observability]
enabled = true
```

**Step 3: 验证多 Worker 一致性**
```typescript
// __tests__/rateLimit.test.ts
describe('distributed rate limit', () => {
  it('enforces consistent limit across workers', async () => {
    // 模拟 100 并发请求
    const promises = Array(100).fill(null).map(() =>
      checkRateLimit('test-key', { limit: 50, windowMs: 60_000 })
    )
    const results = await Promise.all(promises)
    const allowed = results.filter(r => r.allowed).length
    const denied = results.filter(r => !r.allowed).length

    expect(allowed).toBeLessThanOrEqual(50)
    expect(denied).toBeGreaterThanOrEqual(50)
  })
})
```

---

## Epic E6: test-notify 去重

### 详细步骤

**Step 1: 创建 dedup.js 模块**
```typescript
// dedup.ts（新建）
import { readFileSync, writeFileSync, existsSync } from 'fs'

const CACHE_FILE = '.dedup-cache.json'
const DEDUP_WINDOW_MS = 5 * 60 * 1000  // 5 分钟

interface DedupEntry {
  timestamp: number
}

function loadCache(): Record<string, DedupEntry> {
  try {
    if (!existsSync(CACHE_FILE)) return {}
    return JSON.parse(readFileSync(CACHE_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

function saveCache(cache: Record<string, DedupEntry>): void {
  // 清理过期条目后再写入
  const now = Date.now()
  const cleaned: Record<string, DedupEntry> = {}
  for (const [k, v] of Object.entries(cache)) {
    if (now - v.timestamp < DEDUP_WINDOW_MS) {
      cleaned[k] = v
    }
  }
  writeFileSync(CACHE_FILE, JSON.stringify(cleaned, null, 2))
}

export function checkDedup(key: string): { skipped: boolean } {
  const cache = loadCache()
  const entry = cache[key]

  if (entry && Date.now() - entry.timestamp < DEDUP_WINDOW_MS) {
    return { skipped: true }  // 重复
  }
  return { skipped: false }
}

export function recordSend(key: string): void {
  const cache = loadCache()
  cache[key] = { timestamp: Date.now() }
  saveCache(cache)
}

export function clearDedupCache(): void {
  if (existsSync(CACHE_FILE)) {
    writeFileSync(CACHE_FILE, '{}')
  }
}
```

**Step 2: 集成到 test-notify.ts**
```typescript
// test-notify.ts（集成后）
import { checkDedup, recordSend } from './dedup'

export async function handleTestNotify(event: TestEvent): Promise<void> {
  const dedupKey = `test:${event.testId}:${event.status}`

  // ✅ E6: 去重检查
  const { skipped } = checkDedup(dedupKey)
  if (skipped) {
    console.log(`[dedup] Skipped duplicate notification: ${dedupKey}`)
    return
  }

  // 发送 webhook
  await sendWebhook(event)

  // ✅ E6: 记录发送
  recordSend(dedupKey)
}
```

**Step 3: 测试去重逻辑**
```typescript
// __tests__/dedup.test.ts
describe('test-notify deduplication', () => {
  beforeEach(() => clearDedupCache())

  it('skips duplicate within 5 minutes', () => {
    const key = 'test:001:fail'
    expect(checkDedup(key).skipped).toBe(false)  // 首次

    recordSend(key)
    expect(checkDedup(key).skipped).toBe(true)  // 5min 内重复
  })

  it('allows after 5 minutes', () => {
    jest.useFakeTimers()
    const key = 'test:001:fail'

    recordSend(key)
    jest.advanceTimersByTime(5 * 60 * 1000 + 1)  // 超窗口

    expect(checkDedup(key).skipped).toBe(false)
    jest.useRealTimers()
  })
})
```

---

## 部署清单

### Sprint 1 部署（E1–E3）

| # | 检查项 | 状态 | 备注 |
|---|--------|------|------|
| 1 | `gateway.ts` OPTIONS 路由顺序已调整 | ☐ | 在 authMiddleware 之前 |
| 2 | `BoundedContextTree.tsx` checkbox onChange 已修复 | ☐ | 改为 onToggleSelect |
| 3 | generate-components schema 已添加 flowId | ☐ | 格式 /^flow-/ |
| 4 | generate-components prompt 已更新 | ☐ | 明确要求 flowId |
| 5 | `curl -X OPTIONS /v1/projects` 返回 204 | ☐ | CORS headers 正常 |
| 6 | GET/POST 回归测试通过 | ☐ | 不受 E1 影响 |
| 7 | Canvas checkbox 多选测试通过 | ☐ | selectedNodeIds 正确 |
| 8 | flowId 输出测试通过 | ☐ | 非 unknown |
| 9 | ESLint 检查通过 | ☐ | `pnpm lint` |
| 10 | TypeScript 编译通过 | ☐ | `pnpm tsc --noEmit` |

### Sprint 2 部署（E4–E6）

| # | 检查项 | 状态 | 备注 |
|---|--------|------|------|
| 1 | aiService.ts 超时已实现 | ☐ | 10s AbortController |
| 2 | ReadableStream.cancel() 清理 timer | ☐ | clearTimeout 调用 |
| 3 | rateLimit.ts 使用 Cache API | ☐ | 替代内存 Map |
| 4 | wrangler.toml Cache API 配置 | ☐ | node_compat = true |
| 5 | dedup.js 模块已创建 | ☐ | 5min 去重窗口 |
| 6 | test-notify.js 集成去重 | ☐ | checkDedup + recordSend |
| 7 | SSE 超时 jest 测试通过 | ☐ | 10s + cancel 清理 |
| 8 | 限流并发测试通过 | ☐ | 100 并发一致 |
| 9 | test-notify 去重测试通过 | ☐ | 5min 窗口 |
| 10 | 集成测试通过 | ☐ | E1–E6 端到端 |
| 11 | wrangler 部署成功 | ☐ | `wrangler deploy` |
| 12 | 线上回归验证 | ☐ | OPTIONS + Canvas + flowId |

---

## 回滚方案

### 回滚策略

**原则**: 小步部署，每完成一个 Epic 可独立回滚。

#### E1 回滚
```bash
# 立即回滚：将 OPTIONS handler 移回 authMiddleware 之后
# 编辑 gateway.ts，恢复原顺序
git checkout HEAD -- vibex-backend/src/gateway.ts

# 验证
curl -X OPTIONS -I https://api.vibex.top/v1/projects
```

#### E2 回滚
```bash
# 回滚 checkbox onChange 修复
git checkout HEAD -- vibex-fronted/src/components/BoundedContextTree.tsx

# 验证 Canvas 页面加载正常
```

#### E3 回滚
```bash
# 回滚 schema 和 prompt 修改
git checkout HEAD -- \
  vibex-backend/src/generate-components/schema.ts \
  vibex-backend/src/generate-components/prompts.ts

# 验证生成功能基本可用（flowId 可能为 unknown）
```

#### E4 回滚
```bash
# 回滚 aiService.ts
git checkout HEAD -- vibex-backend/src/services/aiService.ts

# 验证 SSE 流基本可用（无超时控制）
```

#### E5 回滚
```bash
# 回滚 rateLimit.ts 和 wrangler.toml
git checkout HEAD -- \
  vibex-backend/src/middleware/rateLimit.ts \
  wrangler.toml

# 注意：回滚后限流降级为单 Worker 内存 Map
# 需要通知团队，限流不再跨 Worker 一致
```

#### E6 回滚
```bash
# 回滚 test-notify.js 和 dedup.js
git checkout HEAD -- \
  vibex-backend/src/services/test-notify.ts \
  vibex-backend/src/utils/dedup.ts

# 验证：重复 webhook 会重新发送（无去重）
```

### 紧急回滚触发条件

| 条件 | 触发动作 |
|------|----------|
| OPTIONS 返回 500 或认证失败 | 立即回滚 E1 |
| Canvas checkbox 导致页面崩溃 | 立即回滚 E2 |
| SSE 流无法关闭、Worker 挂死 | 立即回滚 E4 |
| 限流完全失效（无限制） | 立即回滚 E5 |
| test-notify 静默丢失所有通知 | 立即回滚 E6 |

---

## 成功标准

### P0 Epic 成功标准（E1–E3）

| Epic | 成功条件 | 验证方法 |
|------|----------|----------|
| E1 | `OPTIONS /v1/projects` → 204 + CORS headers | `curl -X OPTIONS -I` |
| E1 | GET/POST 不返回 500 | 回归测试 100% 通过 |
| E2 | checkbox 点击 → `onToggleSelect` 被调用 | Jest 断言 |
| E2 | `toggleContextNode` 功能不受影响 | 手动测试右键菜单 |
| E3 | `component.flowId` 匹配 `/^flow-/` | Jest 断言 |
| E3 | `flowId` 不为 `unknown` | AI 输出测试 |

### P1 Epic 成功标准（E4–E6）

| Epic | 成功条件 | 验证方法 |
|------|----------|----------|
| E4 | SSE 流 10s 无响应自动关闭 | Jest 超时测试 |
| E4 | `cancel()` 调用 `clearTimeout` | Spy 断言 |
| E4 | Worker 不挂死（内存稳定） | 压测后 `process.memoryUsage()` |
| E5 | 100 并发请求 → 限流计数一致 | 集成测试 |
| E5 | 多 Worker 环境下 429 返回一致 | 手动多区域测试 |
| E6 | 5min 内重复 → `skipped: true` | Jest 去重测试 |
| E6 | 重复 webhook → 实际发送 1 次 | Spy 计数断言 |

### 全局成功标准

| 标准 | 指标 | 目标 |
|------|------|------|
| 代码覆盖 | Jest 覆盖率 | > 80% |
| ESLint | `pnpm lint` | 0 errors, 0 warnings |
| TypeScript | `pnpm tsc --noEmit` | 编译通过 |
| E2E 回归 | Playwright E2E 测试 | 全量通过 |
| 部署 | wrangler deploy | 成功 |
| 回归验证 | 线上功能 | OPTIONS + Canvas + flowId 全部正常 |

---

## 时间线

```
Day 1 (2026-04-06)
├── Sprint 1: P0 修复 (1.1h)
│   ├── E1: OPTIONS 预检路由修复 (0.5h)
│   ├── E2: Canvas Context 多选修复 (0.3h)
│   └── E3: generate-components flowId (0.3h)
│
Day 1-2 (2026-04-06 ~ 2026-04-07)
└── Sprint 2: P1 改进 (4h)
    ├── E4: SSE 超时 + 连接清理 (1.5h)
    ├── E5: 分布式限流 (1.5h)
    └── E6: test-notify 去重 (1h)

Day 2 (2026-04-07)
├── 集成测试
└── 部署验证
```
