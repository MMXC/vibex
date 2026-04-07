# VibeX P0 Bug 修复实施计划

> **项目**: vibex-p0-fixes-20260406  
> **作者**: architect  
> **日期**: 2026-04-06  
> **版本**: v1.0

---

## Sprint 1 (P0, 1.1h)

### E1: OPTIONS 预检 CORS 修复（0.5h）

**Step 1: 定位 gateway.ts**
```bash
grep -n "options\|\.options\|authMiddleware" \
  /root/.openclaw/vibex/vibex-backend/src/routes/v1/gateway.ts | head -20
```

**Step 2: 调整 OPTIONS 注册顺序**
```typescript
// 修复后
app.options('/v1/*', optionsHandler)   // 1. OPTIONS 在最前
app.use('/v1/*', authMiddleware)         // 2. 鉴权中间件
```

**Step 3: 验证**
```bash
curl -X OPTIONS -I https://api.vibex.top/v1/projects
# 应返回 204
```

---

### E2: Canvas Context checkbox 修复（0.3h）

**Step 1: 定位 BoundedContextTree.tsx checkbox**
```bash
grep -n "onChange\|Checkbox" \
  /root/.openclaw/vibex/vibex-fronted/src/components/canvas/BoundedContextTree.tsx | head -20
```

**Step 2: 修复 onChange**
```typescript
// 修复前
onChange={() => toggleContextNode(node.id)}

// 修复后
onChange={() => onToggleSelect(node.id)}
```

---

### E3: generate-components flowId 修复（0.3h）

**Step 1: 定位 schema 和 prompt**
```bash
find /root/.openclaw/vibex -path "*/.stryker-*" -prune -o \
  -name "*.ts" -exec grep -l "flowId\|generate-components" {} \; 2>/dev/null | grep -v stryker
```

**Step 2: 在 schema 中添加 flowId**
```typescript
interface GeneratedComponent {
  id: string
  name: string
  type: string
  flowId: string   // ✅ 新增
}
```

**Step 3: 更新 prompt**
```typescript
// "Output JSON with: id, name, type, flowId (format: flow-xxx)"
```

---

## Sprint 2 (P1, 2.5h)

### E4: SSE 超时 + 连接清理（1.5h）

**Step 1: 定位 aiService.ts**
```bash
find /root/.openclaw/vibex -path "*/.stryker-*" -prune -o \
  -name "aiService.ts" -print 2>/dev/null | grep -v stryker | head -3
```

**Step 2: 实现超时 + cancel 清理**
```typescript
// aiService.ts
const TIMEOUT_MS = 10000
let timer: ReturnType<typeof setTimeout>

const timeoutPromise = new Promise<never>((_, reject) => {
  timer = setTimeout(() => {
    controller.abort()
    reject(new Error('timeout'))
  }, TIMEOUT_MS)
})

return new ReadableStream({
  cancel() {
    if (timer) clearTimeout(timer)  // ✅ 清理
    controller.abort()
  }
})
```

---

### E5: test-notify 去重（1h）

**Step 1: 创建 dedup.js**
```typescript
// dedup.js
const CACHE_FILE = '.dedup-cache.json'
const DEDUP_WINDOW_MS = 5 * 60 * 1000

export function checkDedup(key: string): { skipped: boolean }
export function recordSend(key: string): void
```

**Step 2: 集成到 test-notify.js**
```typescript
import { checkDedup, recordSend } from './dedup'

const dedupKey = `test:${event.testId}:${event.status}`
const { skipped } = checkDedup(dedupKey)
if (skipped) return
await sendWebhook(event)
recordSend(dedupKey)
```

---

## 部署清单

| # | 检查项 | 状态 |
|---|--------|------|
| 1 | gateway.ts OPTIONS 顺序已调整 | ☐ |
| 2 | curl -X OPTIONS 返回 204 | ☐ |
| 3 | BoundedContextTree checkbox onChange 已修复 | ☐ |
| 4 | schema 已添加 flowId | ☐ |
| 5 | prompt 明确要求 flowId | ☐ |
| 6 | aiService.ts 超时已实现 | ☐ |
| 7 | cancel() 清理 timer | ☐ |
| 8 | dedup.js 已创建 | ☐ |
| 9 | test-notify.js 集成去重 | ☐ |
| 10 | Jest 测试通过 | ☐ |

---

## 回滚方案

| Epic | 回滚命令 |
|------|----------|
| E1 | `git checkout HEAD -- vibex-backend/src/routes/v1/gateway.ts` |
| E2 | `git checkout HEAD -- vibex-fronted/src/components/canvas/BoundedContextTree.tsx` |
| E3 | `git checkout HEAD -- vibex-backend/src/generate-components/schema.ts` |
| E4 | `git checkout HEAD -- vibex-backend/src/services/aiService.ts` |
| E5 | `git checkout HEAD -- vibex-backend/src/services/dedup.ts` |

---

## 成功标准

| Epic | 成功条件 | 验证 |
|------|----------|------|
| E1 | OPTIONS 返回 204 + CORS | curl 验证 |
| E2 | checkbox 点击 selectedNodeIds 更新 | Jest 断言 |
| E3 | flowId 不是 unknown | AI 输出测试 |
| E4 | 10s 超时 + cancel 清理 | Jest 超时测试 |
| E5 | 5min 去重跳过 | Jest 去重测试 |
