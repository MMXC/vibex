# VibeX P0/P1 修复开发规范

> **项目**: vibex-analyst-proposals-vibex-proposals-20260406  
> **作者**: architect  
> **日期**: 2026-04-06  
> **版本**: v1.0

---

## 概述

本文档为 E1–E6 修复项定义强制规范、代码风格、测试要求和审查清单。所有参与此项目的 Agent 必须遵循本文档。

---

## 强制规范

### 代码所有权

- **禁止** 直接修改 `gateway.ts`、`aiService.ts`、`rateLimit.ts` 等核心文件而不通知 reviewer
- 每个 Epic 修复创建独立分支：`feat/E1-options-preflight`、`feat/E2-canvas-checkbox` 等
- PR 标题格式：`[E{编号}] {简短描述}`

### 变更范围

- **E1**: 仅修改 `gateway.ts` 中 OPTIONS handler 的注册顺序
- **E2**: 仅修改 `BoundedContextTree.tsx` 中 checkbox 的 `onChange` 绑定
- **E3**: 仅修改 schema 和 prompt 文件，不涉及 API 接口签名
- **E4**: 仅修改 `aiService.ts` 的超时和 cancel 逻辑
- **E5**: 仅修改 `rateLimit.ts` 的存储实现，不改接口
- **E6**: 新建 `dedup.ts`，修改 `test-notify.ts` 集成点

> ⚠️ **范围守卫**: 每次提交必须说明改动了哪些文件的哪些行。如果改动超出上述范围，需在 PR 描述中额外说明原因。

### 中间件顺序（E1 专用）

```typescript
// ✅ 正确顺序
app.options('/v1/*', optionsHandler)   // 1. OPTIONS 在最前
app.use('/v1/*', authMiddleware)         // 2. 鉴权中间件
app.post('/v1/*', protectedHandler)     // 3. 业务路由

// ❌ 禁止顺序
app.use('/v1/*', authMiddleware)         // 错误：OPTIONS 也会被拦截
app.options('/v1/*', optionsHandler)
```

### 禁止事项

| 禁止项 | 原因 |
|--------|------|
| 在 E1 修改中调整其他中间件 | 引入不可预期的影响 |
| 在 E2 修改中同时修改 `toggleContextNode` | 应保持独立职责 |
| 在 E3 修改中改 API 接口签名 | 影响前端调用方 |
| 在 E4 修改中删除 `clearTimeout` | 引入内存泄漏 |
| 在 E5 修改中改变 `checkRateLimit` 接口 | 影响所有调用方 |
| 在 E6 修改中删除原有 test-notify 逻辑 | 仅叠加去重 |

---

## 代码风格

### TypeScript

- **严格模式**: `strict: true` 必须开启
- **类型导出**: 所有接口和类型必须显式导出
- **禁止 `any`**: 使用 `unknown` + 类型守卫
- **禁止内联类型**: 使用 `interface` 或 `type` 定义

```typescript
// ✅ 正确示例
export interface Component {
  id: string
  name: string
  type: string
  flowId: string
}

// ❌ 错误示例
const component = { id: '1', name: 'test', flowId: 'unknown' }
```

### 错误处理

- 所有 `async` 函数必须有 `try-catch` 或 `.catch()`
- 错误信息必须包含上下文：`throw new Error(\`rateLimit: failed for key \${key}\`)`
- 禁止裸露的 `throw err`，必须包装

```typescript
// ✅ 正确示例
try {
  const result = await cache.match(key)
  return result ? parseInt(await result.text(), 10) : 0
} catch (err) {
  throw new Error(`cache read failed: ${(err as Error).message}`)
}

// ❌ 错误示例
try {
  return parseInt(await (await cache.match(key)).text(), 10)
} catch {
  return 0  // 静默失败
}
```

### 命名规范

| 场景 | 规范 | 示例 |
|------|------|------|
| 文件名 | kebab-case | `dedup.ts`、`rate-limit.ts` |
| 函数名 | camelCase | `checkDedup`、`checkRateLimit` |
| 常量 | SCREAMING_SNAKE_CASE | `DEDUP_WINDOW_MS`、`TIMEOUT_MS` |
| 接口 | PascalCase | `DedupEntry`、`RateLimitOptions` |
| 测试文件 | `*.test.ts` | `dedup.test.ts` |

### 导入顺序

```typescript
// 1. Node.js 内置模块
import { readFileSync, writeFileSync } from 'fs'

// 2. 第三方库
import { Hono } from 'hono'
import { caches } from '__STATIC_CONTENT_MANIFEST'

// 3. 项目内部模块
import { validateComponent } from './schema'
import { sendWebhook } from '../services/webhook'

// 4. 类型定义
import type { Component, FlowId } from './types'
```

---

## 测试要求

### 测试覆盖率门槛

| Epic | 覆盖率目标 | 核心断言 |
|------|-----------|----------|
| E1 | 100% | OPTIONS 返回 204、CORS headers、无 401 |
| E2 | 90% | `onToggleSelect` 被调用、`toggleContextNode` 不被调用 |
| E3 | 95% | `flowId` 匹配 `/^flow-/`、非 `unknown` |
| E4 | 90% | 10s 超时、`clearTimeout` 被调用 |
| E5 | 85% | Cache API 可用、并发限流一致 |
| E6 | 95% | 5min 去重、首次通过、超时后重发 |

### Jest 测试规范

```typescript
// ✅ 正确的 Jest 测试结构
describe('E1: OPTIONS preflight', () => {
  describe('OPTIONS /v1/projects', () => {
    it('returns 204', async () => {
      const res = await request(app).options('/v1/projects')
      expect(res.status).toBe(204)
    })

    it('includes CORS headers', async () => {
      const res = await request(app).options('/v1/projects')
      expect(res.headers['access-control-allow-origin']).toBe('*')
    })

    it('does not return 401', async () => {
      const res = await request(app).options('/v1/projects')
      expect(res.status).not.toBe(401)
    })
  })

  describe('GET /v1/projects (regression)', () => {
    it('works normally after E1 fix', async () => {
      const res = await request(app)
        .get('/v1/projects')
        .set('Authorization', 'Bearer test-token')
      expect([200, 401]).toContain(res.status)  // 200=有权限，401=无权限，都算正常
    })
  })
})
```

### 模拟（Mock）规范

```typescript
// ✅ 正确的 mock：模拟外部依赖，不模拟内部逻辑
jest.mock('__STATIC_CONTENT_MANIFEST', () => ({
  caches: {
    default: {
      match: jest.fn().mockResolvedValue(null),
      put: jest.fn().mockResolvedValue(undefined)
    }
  }
}))

// ❌ 错误：mock 了需要测试的函数本身
jest.mock('./rateLimit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true })
}))
```

### 测试数据

- 使用 `beforeEach` 重置测试状态
- 去重测试（E6）使用 `beforeEach(() => clearDedupCache())`
- 超时测试（E4）使用 `jest.useFakeTimers()` / `jest.useRealTimers()` 成对使用

---

## 审查清单

### PR 提交前自检

| # | 检查项 | E1 | E2 | E3 | E4 | E5 | E6 |
|---|--------|----|----|----|----|----|----|
| 1 | 改动文件不超过规定范围 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 2 | TypeScript 编译通过 `pnpm tsc --noEmit` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 3 | ESLint 检查通过 `pnpm lint` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 4 | 所有新增类型已导出 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 5 | 错误处理有上下文信息 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 6 | 无裸 `throw` 或 `catch {}` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 7 | Jest 测试覆盖率达到门槛 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 8 | 每个测试有明确的 `it` 描述 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 9 | 测试使用真实断言而非模糊断言 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 10 | 回归测试已运行 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

### Reviewer 审查点

#### E1: OPTIONS 预检路由
- [ ] `gateway.ts` 中 OPTIONS handler 确实在 authMiddleware 之前
- [ ] OPTIONS 请求不携带 Authorization 时返回 204（无 401）
- [ ] GET/POST 请求行为未改变
- [ ] 多个 OPTIONS 路径（如 `/v1/*`、`/v1/projects`）均测试

#### E2: Canvas Context 多选
- [ ] checkbox `onChange` 只调用 `onToggleSelect`，不调用 `toggleContextNode`
- [ ] `toggleContextNode` 的其他调用路径（右键菜单等）未受影响
- [ ] 多选状态下切换单个 checkbox 行为正确
- [ ] 全选/取消全选场景正常

#### E3: generate-components flowId
- [ ] schema 中 `flowId: string` 已添加
- [ ] prompt 明确要求输出 `flowId: "flow-{uuid}"`
- [ ] AI 输出验证正则 `/^flow-/` 正确
- [ ] flowId 为空或 unknown 时有 fallback 或错误处理

#### E4: SSE 超时
- [ ] `AbortController.timeout(10000)` 正确设置
- [ ] `ReadableStream.cancel()` 中调用 `clearTimeout`
- [ ] 正常结束时也清理了 timer（`pull` 中的 `controller.close()` 路径）
- [ ] 异常路径（catch）中清理了 timer
- [ ] Worker 在超时后保持可用（无内存泄漏）

#### E5: 分布式限流
- [ ] `caches.default` 替代了内存 Map
- [ ] `checkRateLimit` 接口签名未改变
- [ ] TTL 设置正确（`expirationTtl`）
- [ ] 100 并发测试验证限流一致性
- [ ] Cache 未命中时（首次请求）计数正确（从 1 而非 0 开始）

#### E6: test-notify 去重
- [ ] `dedup.ts` 中 `checkDedup` 和 `recordSend` 成对使用
- [ ] 5 分钟窗口（`5 * 60 * 1000`）正确
- [ ] `.dedup-cache.json` 写入后立即可读
- [ ] 过期条目自动清理
- [ ] 去重检查在 webhook 发送**之前**，避免重复发送

### 集成审查

- [ ] E1–E3 修复后，Canvas 完整流程可走通（OPTIONS → generate → 多选）
- [ ] E4–E6 部署后，SSE 流 + 限流 + 通知组合正常工作
- [ ] Playwright E2E 测试覆盖 OPTIONS 预检场景

### 部署审查

- [ ] `wrangler deploy` 成功
- [ ] 线上 OPTIONS 路由返回 204（curl 验证）
- [ ] 线上 Canvas checkbox 可正常多选
- [ ] 线上 SSE 流 10s 超时行为正常
- [ ] 线上限流在多区域请求下保持一致
- [ ] 线上 test-notify 重复事件在 5min 内不重复发送

---

## 工作流程

```
1. 领取任务
   → 从 AGENTS.md 确认当前 Epic 编号
   → 创建分支: feat/E{编号}-{short-name}

2. 实现
   → 按 IMPLEMENTATION_PLAN.md 步骤执行
   → 遵循 AGENTS.md 代码风格

3. 测试
   → 每个 Epic 独立运行测试
   → `pnpm test -- --testPathPattern="E{编号}"`

4. 自检
   → PR 提交前运行审查清单
   → 确保所有 ☐ 变为 ☑

5. 提交 PR
   → 标题: [E{编号}] {描述}
   → 正文包含: 改动文件清单、测试结果、集成说明

6. 合并后
   → 触发 wrangler deploy
   → 线上验证
```
