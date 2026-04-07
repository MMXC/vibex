# PRD: VibeX Backend Deploy Stability

> **项目**: vibex-backend-deploy-stability  
> **目标**: 防止后端部署导致 Worker 崩溃  
> **分析者**: analyst agent  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
VibeX 后端部署在 Cloudflare Workers + D1 上，SSE 流无超时控制导致 Worker 挂死，内存 RateLimit 在多 Worker 实例间不共享导致限流失效。

### 目标
- P0: 修复 SSE 超时问题，防止 Worker 无限期等待
- P0: 实现分布式限流，确保多 Worker 实例限流一致性
- P1: 添加 Health Check 端点，支持部署验证和监控
- P2: 确保 Prisma 仅在本地 dev 环境加载

### 成功指标
- SSE 流 10s 无响应自动关闭（AC1）
- Rate limit 在多 Worker 间一致（AC2）
- GET /health 返回 200（AC3）
- Prisma 不在生产环境加载（AC4）

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | 关联风险 |
|------|------|--------|------|----------|
| E1 | SSE 稳定性修复 | P0 | 1.5h | SSE AI 调用无超时 + 连接关闭无清理 |
| E2 | 分布式限流 | P0 | 1.5h | 内存 RateLimit 跨实例不共享 |
| E3 | Health Check 端点 | P1 | 0.5h | 无 Health Check 端点 |
| E4 | Prisma 条件加载 | P2 | 0.5h | Prisma PoolManager 不适配 Workers |
| **合计** | | | **4h** | |

---

### Epic 1: SSE 稳定性修复

**问题根因**: `buildSSEStream` 中 `aiService.chat()` 无超时控制，客户端断开后 SSE 流继续运行，计时器未清理。

**Story 清单**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | SSE 超时控制 | 0.5h | 见下方 AC |
| S1.2 | SSE 连接清理 | 1h | 见下方 AC |

**S1.1 验收标准**:
- `expect(buildSSEStream(...)).toBeInstanceOf(ReadableStream)` ✓
- SSE 流 10s 无响应时抛出异常或触发 cancel
- `AbortController.timeout(10000)` 应用于 aiService.chat 调用
- 超时时 `controller.close()` 被调用

**S1.2 验收标准**:
- ReadableStream.cancel() 被调用时，setTimeout 计时器被清理
- `controller.close()` 在 AbortSignal 上绑定
- 客户端断开后 1s 内 SSE 流停止

**DoD**:
- [ ] `buildSSEStream` 使用 AbortController.timeout(10000)
- [ ] ReadableStream.cancel() 清理所有计时器
- [ ] `controller.close()` 在 AbortSignal 上监听
- [ ] 单元测试覆盖超时和取消场景

---

### Epic 2: 分布式限流

**问题根因**: `RateLimitStore` 使用内存 Map，单实例存储，多 Worker 请求被不同实例处理时限流失效。

**Story 清单**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | Cache API 替代内存存储 | 1h | 见下方 AC |
| S2.2 | 限流一致性验证 | 0.5h | 见下方 AC |

**S2.1 验收标准**:
- `expect(caches.default.match(...)).toBeDefined()` ✓
- Rate limit 使用 `caches.default` 而非内存 Map
- TTL 到期后缓存自动失效
- 读取/写入使用 `caches.default.put()` 和 `caches.default.match()`

**S2.2 验收标准**:
- 并发请求命中不同 Worker 实例时，限流计数一致
- 多 Worker 场景下测试用例通过
- 100 并发请求后触发限流，后续请求返回 429

**DoD**:
- [ ] `rateLimit.ts` 迁移到 `caches.default`
- [ ] 保留原有接口（checkLimit, getRemaining, recordRequest）
- [ ] 单元测试覆盖 Cache 读取/写入
- [ ] 集成测试验证多 Worker 一致性

---

### Epic 3: Health Check 端点

**问题根因**: 无 `/health` 端点，无法验证部署是否成功，无法接入自动监控。

**Story 清单**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | /health 路由实现 | 0.5h | 见下方 AC |

**S3.1 验收标准**:
- `expect(response.status).toBe(200)` ✓
- GET /health 返回 `{ status: "ok", env: "production", timestamp: ... }`
- 响应 Content-Type: application/json
- 端点不需要认证（公开）
- 路由在 gateway.ts 中注册

**DoD**:
- [ ] `/health` 路由在 `gateway.ts` 中注册
- [ ] 返回 JSON 格式 `{ status, env, timestamp }`
- [ ] curl 验证返回 200
- [ ] 端点无认证

---

### Epic 4: Prisma 条件加载

**问题根因**: `PrismaClient` 基于 Node.js 连接池，不兼容 Cloudflare Workers V8 isolates，生产环境可能引发连接泄漏。

**Story 清单**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S4.1 | 环境检测逻辑 | 0.5h | 见下方 AC |

**S4.1 验收标准**:
- `expect(process.env.NODE_ENV).not.toBe('production')` → Prisma 不加载 ✓
- `process.env.NODE_ENV === 'production'` 时使用 D1 API (`env.DB.prepare()`)
- `process.env.NODE_ENV !== 'production'` 时使用 PrismaClient
- PrismaClient 在生产环境打包中不存在

**DoD**:
- [ ] `db.ts` 中添加 `process.env.NODE_ENV` 检测
- [ ] 生产环境使用 `env.DB.prepare()` 替代 PrismaClient
- [ ] wrangler.toml 中配置 `ignored_inline_data` 排除 Prisma
- [ ] 部署日志中无 PrismaClient 加载记录

---

## 3. 功能点汇总

| ID | 功能点 | 描述 | Epic | 验收标准 | 页面集成 |
|----|--------|------|------|----------|----------|
| F1.1 | SSE 超时控制 | AbortController.timeout(10s) 包装 aiService.chat | E1 | expect(buildSSEStream(opts).read()).rejects.toThrow() | 无 |
| F1.2 | SSE 连接清理 | cancel() 回调清理计时器 + AbortSignal 绑定 | E1 | expect(stream.canceled).toBe(true) when client disconnects | 无 |
| F2.1 | Cache API 限流 | 使用 caches.default 替代内存 Map | E2 | expect(caches.default.match(key)).toBeDefined() | 无 |
| F2.2 | 限流一致性测试 | 多 Worker 场景限流计数一致 | E2 | expect(limitCount).toBeGreaterThanOrEqual(100) after 100 requests | 无 |
| F3.1 | /health 端点 | 返回 { status, env, timestamp } | E3 | expect(fetch('/health').status).toBe(200) | 无 |
| F4.1 | Prisma 条件加载 | NODE_ENV 检测切换 DB 客户端 | E4 | expect(productionBuild).not.toContain('PrismaClient') | 无 |

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | SSE 流启动 | 10s 无响应 | Worker 不挂死，流自动关闭 |
| AC2 | 并发 100 请求 | 命中不同 Worker | 限流计数一致，后续请求返回 429 |
| AC3 | 部署完成 | GET /health | 返回 200 + JSON body |
| AC4 | 生产构建 | 检查打包产物 | PrismaClient 不存在于产物中 |
| AC5 | 客户端断开 | SSE 流运行中 | 1s 内流停止，计时器清理 |
| AC6 | 内存 Map 存储 | rateLimit.check() 调用 | 使用 caches.default 而非 Map |

---

## 5. DoD (Definition of Done)

### Epic 1: SSE 稳定性修复
- [ ] `src/lib/sse-stream-lib/index.ts` 中添加 `AbortController.timeout(10000)`
- [ ] `ReadableStream.cancel()` 回调清理所有 setTimeout
- [ ] `controller.close()` 在 AbortSignal 上监听客户端断开
- [ ] 单元测试: `jest sse-stream-lib.test.ts` 全部通过

### Epic 2: 分布式限流
- [ ] `src/lib/rateLimit.ts` 迁移到 `caches.default`
- [ ] 保留原有接口: `checkLimit()`, `getRemaining()`, `recordRequest()`
- [ ] wrangler.toml 配置 `caches` section
- [ ] 集成测试: 多 Worker 压测通过

### Epic 3: Health Check 端点
- [ ] `src/routes/health.ts` 实现
- [ ] 路由在 `src/gateway.ts` 中注册
- [ ] curl 验证: `curl -s /health` 返回 200

### Epic 4: Prisma 条件加载
- [ ] `src/lib/db.ts` 添加 `NODE_ENV` 检测
- [ ] 生产环境使用 `env.DB.prepare()` D1 API
- [ ] `wrangler.toml` 排除 Prisma 依赖

---

## 6. 实施计划

### Sprint 1 (4h)

| 阶段 | 内容 | 工时 | 产出 |
|------|------|------|------|
| Phase 1 | E1: SSE 超时 + 清理 | 1.5h | sse-stream-lib 修复 |
| Phase 2 | E2: Cache API 限流 | 1.5h | rateLimit.ts 重构 |
| Phase 3 | E3: /health 端点 | 0.5h | health.ts + gateway 注册 |
| Phase 4 | E4: Prisma 条件加载 | 0.5h | db.ts 环境检测 |

### 依赖关系
- E3 (Health Check) 可独立实施
- E1, E2, E4 相互独立，可并行开发

---

## 7. 非功能需求

| 需求 | 描述 |
|------|------|
| 性能 | SSE 超时修复后，Worker 响应时间 < 15s（含超时） |
| 可观测性 | /health 端点支持外部监控探针 |
| 兼容性 | 修改不破坏现有 SSE 客户端 |
| 安全性 | /health 端点公开但仅返回状态信息 |

---

## 8. 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| 超时修复破坏 SSE 事件顺序 | 仅在 start() 外层加 try-catch，事件内部不受影响 |
| Cache API 部署需额外配置 | wrangler.toml 默认启用 Cache API |
| Prisma 条件加载遗漏 | 部署前检查打包产物 |

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
