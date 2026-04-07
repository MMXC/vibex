# Implementation Plan: VibeX Proposals 2026-04-06

> **项目**: vibex-tester-proposals-vibex-proposals-20260406  
> **阶段**: design-architecture → implementation  
> **作者**: architect (subagent)  
> **日期**: 2026-04-06  
> **版本**: v1.0

---

## 1. Sprint 概览

| Sprint | 周期 | Epic | 优先级 | 工时 |
|--------|------|------|--------|------|
| Sprint 1 | P0 修复 | E1, E2, E3 | P0 | 1.1h |
| Sprint 2 | P1 改进 | E4, E5, E6 | P1 | 4.0h |
| **合计** | | | | **5.1h** |

---

## 2. Sprint 1: P0 修复 (1.1h)

### Epic E1: OPTIONS 预检路由修复 (0.5h)

#### 步骤 1.1: 路由注册顺序调整

**目标文件**: `vibex-backend/src/gateway.ts`

```typescript
// 当前（错误）：authMiddleware 在 OPTIONS 之前
protected_.use(authMiddleware)
protected_.options(corsOptionsHandler)

// 修复后（正确）：OPTIONS 在 auth 之前
protected_.options(corsOptionsHandler)  // ← 移动到前面
protected_.use(authMiddleware)
```

**操作步骤**:
1. `grep -n "options\|authMiddleware" vibex-backend/src/gateway.ts`
2. 调整 `protected_.options()` 调用位置到 `protected_.use(authMiddleware)` 之前
3. 确认 `corsOptionsHandler` 在文件顶部 `import`
4. 验证无其他中间件依赖顺序

#### 步骤 1.2: CORS Handler 实现（如缺失）

**目标文件**: `vibex-backend/src/middleware/cors.ts` (新建或确认)

```typescript
export function corsOptionsHandler(
  req: NextRequest,
  res: NextResponse
): NextResponse | void {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  });
}
```

#### 步骤 1.3: 回归测试

```bash
# 本地验证
curl -X OPTIONS -I http://localhost:3000/v1/projects
# 期望: HTTP/1.1 204 No Content

# 运行测试
pnpm --filter vibex-backend test -- --testPathPattern="e1-options"
```

#### 回滚方案

**触发条件**: GET/POST 返回 500 或 auth 失效

```bash
# 回滚: git revert 或手动恢复顺序
git checkout HEAD -- vibex-backend/src/gateway.ts
```

---

### Epic E2: Canvas Context 多选修复 (0.3h)

#### 步骤 2.1: checkbox onChange 修复

**目标文件**: `vibex-fronted/src/components/BoundedContextTree.tsx`

**操作步骤**:
1. 搜索 `toggleContextNode` 在 checkbox 中的使用
2. 将 `<Checkbox onChange={() => toggleContextNode(node.id)} />` 改为
3. `<Checkbox onChange={() => onToggleSelect(node.id)} />`
4. 确保 `onToggleSelect` prop 正确传递到组件

```typescript
// 修复前
<Checkbox
  checked={selectedNodeIds.has(node.id)}
  onChange={() => toggleContextNode(node.id)}
/>

// 修复后
<Checkbox
  checked={selectedNodeIds.has(node.id)}
  onChange={() => onToggleSelect(node.id)}
/>
```

#### 步骤 2.2: 单元测试

```bash
pnpm --filter vibex-fronted test -- --testPathPattern="e2-canvas-checkbox"
```

#### 回滚方案

```bash
git checkout HEAD -- vibex-fronted/src/components/BoundedContextTree.tsx
```

---

### Epic E3: generate-components flowId (0.3h)

#### 步骤 3.1: Schema 添加 flowId

**目标文件**: `vibex-backend/src/schemas/component.ts`

```typescript
// 现有 schema 查找 Component 接口
export interface GeneratedComponent {
  id: string;
  name: string;
  type: string;
  // ... 现有字段
  flowId: string; // ← 新增
}
```

#### 步骤 3.2: Prompt 修复

**目标文件**: `vibex-backend/src/prompts/component-generation.ts`

```typescript
const COMPONENT_PROMPT = `
// ...
// 在输出格式说明中新增:
- flowId: string (格式: flow-{uuid}, 必须包含)
// ...
`.trim();
```

#### 步骤 3.3: 后端验证

**目标文件**: `vibex-backend/src/routes/component-generator.ts`

```typescript
function validateFlowId(component: GeneratedComponent): void {
  if (!component.flowId) {
    throw new ValidationError('flowId is required');
  }
  if (component.flowId === 'unknown') {
    throw new ValidationError('flowId cannot be unknown');
  }
  if (!/^flow-/.test(component.flowId)) {
    throw new Error(`flowId must start with 'flow-', got: ${component.flowId}`);
  }
}
```

#### 回滚方案

```bash
git checkout HEAD -- vibex-backend/src/schemas/component.ts
git checkout HEAD -- vibex-backend/src/prompts/component-generation.ts
```

---

## 3. Sprint 2: P1 改进 (4.0h)

### Epic E4: SSE 超时 + 连接清理 (1.5h)

#### 步骤 4.1: SSE Stream 库实现

**目标文件**: `vibex-backend/src/lib/sse-stream-lib/stream.ts` (新建)

```typescript
// 新建文件，参考 architecture.md 4.4 接口定义
// 实现:
// - SSEReadableStream 类
// - createChatStream() 包装器
// - cancel() 中 clearTimeout 清理
```

**操作步骤**:
1. 创建 `sse-stream-lib/` 目录
2. 实现 `stream.ts`
3. 实现 `index.ts` (导出)
4. 编写单元测试 `stream.test.ts`

#### 步骤 4.2: Chat Route 集成

**目标文件**: `vibex-backend/src/routes/chat.ts`

```typescript
// 替换现有流式响应
import { createChatStream } from '@/lib/sse-stream-lib';

// 修改前
const stream = await aiService.chat(req);

// 修改后
const stream = await createChatStream(req, { timeoutMs: 10_000 });
return new Response(stream, {
  headers: { 'Content-Type': 'text/event-stream' }
});
```

#### 步骤 4.3: 环境变量配置

```bash
# .env.local (可选，有默认值)
SSE_TIMEOUT_MS=10000
```

#### 回滚方案

```bash
# 恢复 chat.ts
git checkout HEAD -- vibex-backend/src/routes/chat.ts
# 删除 sse-stream-lib/ 目录（如果单独 commit）
```

---

### Epic E5: 分布式限流 (1.5h)

#### 步骤 5.1: RateLimit 实现替换

**目标文件**: `vibex-backend/src/lib/rateLimit.ts`

**操作步骤**:
1. 备份现有实现 (注释保留)
2. 重写 `checkRateLimit()` 使用 `caches.default`
3. 保留原接口签名（`RateLimitResult` 类型不变）

```typescript
// 关键变更
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const cache = caches.default;  // ← 替换内存 Map
  const cacheKey = `ratelimit:${key}`;
  // ... Cache API 实现
}
```

#### 步骤 5.2: wrangler.toml 确认

```bash
# 检查 vibex-backend/wrangler.toml
# 确保 compat_date >= 2022-10-10 (Cache API 支持)
grep "compatibility_date" vibex-backend/wrangler.toml
```

#### 步骤 5.3: 多 Worker 集成测试

```bash
# 部署到 preview 环境
wrangler deploy --env preview

# 模拟多 Worker 并发
for i in {1..20}; do
  curl -s -o /dev/null -w "%{http_code}\n" https://vibex-backend.preview.workers.dev/api/chat &
done
wait
# 验证 429 响应出现
```

#### 回滚方案

```bash
# 恢复内存 Map 实现
git checkout HEAD -- vibex-backend/src/lib/rateLimit.ts
wrangler deploy --env preview
```

---

### Epic E6: test-notify 去重 (1.0h)

#### 步骤 6.1: 去重模块实现

**目标文件**: `vibex-backend/src/lib/dedup.ts` (新建)

**操作步骤**:
1. 创建 `dedup.ts`
2. 实现 `checkDedup()` 和 `recordSend()`
3. 实现 `readCache()` / `writeCache()` (JSON 文件)
4. 编写单元测试 `dedup.test.ts`

#### 步骤 6.2: test-notify 集成

**目标文件**: `vibex-backend/scripts/test-notify.js` (或 `services/NotificationService.ts`)

```javascript
// 在发送前调用 checkDedup
import { checkDedup, recordSend } from '../src/lib/dedup';

async function sendTestNotification(payload) {
  const key = `${payload.event}:${payload.testId}`;
  const result = checkDedup(key);

  if (result.skipped) {
    console.log(`[dedup] Skipped: ${key}`);
    return { skipped: true };
  }

  await doSend(payload); // 实际发送逻辑
  recordSend(key);
  return { skipped: false };
}
```

#### 步骤 6.3: 测试验证

```bash
# 运行去重测试
pnpm --filter vibex-backend test -- --testPathPattern="e6-dedup"

# 手动测试
node scripts/test-notify.js --event test --testId demo-123
node scripts/test-notify.js --event test --testId demo-123  # 应跳过
```

#### 回滚方案

```bash
# 恢复 test-notify.js
git checkout HEAD -- vibex-backend/scripts/test-notify.js
# 删除 dedup.ts 和 .dedup-cache.json
```

---

## 4. 部署清单

### 4.1 部署前检查

| # | 检查项 | 验证命令 | 通过标准 |
|---|--------|----------|----------|
| 1 | E1 OPTIONS 返回 204 | `curl -X OPTIONS -I /v1/projects` | HTTP 204 |
| 2 | E2 checkbox 单元测试通过 | `pnpm test e2-canvas-checkbox` | 100% pass |
| 3 | E3 flowId schema 验证通过 | `pnpm test e3-flowid` | 100% pass |
| 4 | E4 SSE 超时测试通过 | `pnpm test e4-sse` | 100% pass |
| 5 | E5 限流测试通过 | `pnpm test e5-ratelimit` | 100% pass |
| 6 | E6 去重测试通过 | `pnpm test e6-dedup` | 100% pass |
| 7 | 整体覆盖率 ≥ 80% | `pnpm test -- --coverage` | lines ≥ 80% |
| 8 | lint 通过 | `pnpm lint` | 0 errors |
| 9 | TypeScript 编译 | `pnpm build` | 0 errors |

### 4.2 部署步骤

```bash
# 1. 本地测试全量通过
pnpm --filter vibex-backend test

# 2. 构建
pnpm --filter vibex-backend build

# 3. 部署到 preview
wrangler deploy --env preview

# 4. E2E 冒烟测试
pnpm --filter vibex-backend playwright -- --grep "smoke"

# 5. 部署到 production
wrangler deploy --env production

# 6. 验证生产环境
curl -X OPTIONS -I https://api.vibex.com/v1/projects
```

### 4.3 回滚步骤

```bash
# 单 Epic 回滚（推荐）
git revert <commit-hash>
wrangler deploy

# 全量回滚
wrangler rollback --env production
```

---

## 5. 成功标准

### 5.1 验收标准 (AC)

| AC | 描述 | 验证方法 |
|----|------|----------|
| AC1 | OPTIONS 预检返回 204 + CORS headers | `curl -X OPTIONS -I /v1/projects` → 204 |
| AC2 | Canvas checkbox 多选功能可用 | Playwright E2E 测试通过 |
| AC3 | generate-components 输出正确 flowId | `expect(flowId).toMatch(/^flow-/)` |
| AC4 | SSE 流 10s 超时，Worker 不挂死 | Jest fake timers 测试通过 |
| AC5 | 限流跨 Worker 一致 | 并发 100 请求，429 出现 |
| AC6 | test-notify 5 分钟去重 | 重复请求 → `skipped: true` |

### 5.2 质量门禁

| 指标 | 目标 | 当前 |
|------|------|------|
| 测试覆盖率 | ≥ 80% lines | - |
| 单元测试通过率 | 100% | - |
| E2E 测试通过率 | 100% | - |
| P0 Bug | 0 残留 | 0 |
| P1 Bug | ≤ 2 残留 | - |
| Breaking Changes | 0 | 0 |

---

## 6. 时间线

```
Day 1
├── 09:00  Sprint 1 开始
│   ├── E1 OPTIONS 修复 (0.5h)
│   ├── E2 Canvas checkbox (0.3h)
│   └── E3 flowId 修复 (0.3h)
├── 10:00  Sprint 1 测试 + Code Review
├── 10:30  Sprint 1 部署到 preview
│
├── 10:30  Sprint 2 开始
│   ├── E4 SSE 超时 (1.5h)
│   ├── E5 分布式限流 (1.5h)
│   └── E6 test-notify 去重 (1.0h)
├── 14:30  Sprint 2 测试 + Code Review
├── 15:00  Sprint 2 部署到 preview
│
├── 15:30  全量 E2E 测试
├── 16:00  部署到 production
└── 16:30  验证 + 文档更新
```

---

## 7. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-dev-proposals-vibex-proposals-20260406
- **执行日期**: 2026-04-06

---

*文档版本: v1.0 | 最后更新: 2026-04-06*
