# 实施计划: VibeX Backend Deploy Stability

> **项目**: vibex-backend-deploy-stability  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 实施顺序

```
Phase 1 (E1): SSE 超时 + 清理      ← 1.5h
Phase 2 (E2): Cache API 限流       ← 1.5h
Phase 3 (E3): /health 端点         ← 0.5h
Phase 4 (E4): Prisma 条件加载      ← 0.5h
```

**并行策略**: E1/E2/E3/E4 相互独立，Dev 可同时分配多个开发者实施。

---

## 2. 详细步骤

### Phase 1: SSE 超时 + 清理 (E1)

**目标文件**: `vibex-backend/src/lib/sse-stream-lib/index.ts`

**步骤 1.1** — 添加 AbortController 超时 (20min) ✅ DONE
```
1. 在 buildSSEStream() 的 start() 方法开头创建 AbortController ✅
2. 添加 setTimeout(() => abortController.abort(), 10000) ✅
3. 将 abortController.signal 传入 aiService.chat() 调用 ✅
4. 在 finally 块中 clearTimeout(timeoutId) ✅
```

**步骤 1.2** — 添加 SSE 连接清理 (50min) ✅ DONE
```
1. 在 ReadableStream 构造函数的 cancel() 方法中清理所有 timers ✅
2. 在 abortController.signal 上监听 'abort' 事件，触发 controller.close() ✅
3. 将所有 setTimeout/setInterval 的 ID 收集到 timers 数组 ✅
4. 编写单元测试覆盖超时场景和取消场景 ✅ (9 tests pass)
```

**步骤 1.3** — 验证 (20min) ✅ DONE
```
1. 运行 jest src/lib/sse-stream-lib/index.test.ts — 9/9 passed ✅
2. TypeScript — no errors in modified files ✅
```

### Phase 2: Cache API 限流 (E2)

**目标文件**: `vibex-backend/src/lib/rateLimit.ts` + `vibex-backend/wrangler.toml`

**步骤 2.1** — 重构 RateLimitStore (60min)
```
1. 将内存 Map 替换为 caches.default 读写
2. Cache Key 格式: `rl:{identifier}:{windowStart}`
3. Cache TTL: 60 秒
4. 保留原有接口: checkLimit(), getRemaining(), recordRequest()
5. 添加 try-catch 兜底（Cache API 不可用时降级）
```

**步骤 2.2** — 配置 wrangler.toml (10min)
```toml
# 在 wrangler.toml 中添加:
[caches]
  name = "RATE_LIMIT_CACHE"
```

**步骤 2.3** — 验证 (20min)
```
1. 运行 vitest rateLimit.test.ts
2. 多 Worker 压测验证限流一致性
```

### Phase 3: /health 端点 (E3)

**目标文件**: `vibex-backend/src/routes/v1/gateway.ts` (新增路由)

**步骤 3.1** — 实现 /health 路由 (20min)
```
1. 在 gateway.ts 中添加 GET /health 路由处理器
2. 返回 { status, env, timestamp, version }
3. 无需认证，Content-Type: application/json
```

**步骤 3.2** — 注册路由 (10min)
```
1. 在 gateway.ts 的公开路由区域添加 health 路由
2. 位置: 在 /auth 路由之后
```

**步骤 3.3** — 验证 (20min)
```
1. curl -s /health 验证返回 200
2. 集成监控探针测试
```

### Phase 4: Prisma 条件加载 (E4)

**目标文件**: `vibex-backend/src/lib/db.ts`

**步骤 4.1** — 添加环境检测 (20min)
```
1. 在 db.ts 顶部添加 process.env.NODE_ENV 检测
2. production 环境: 使用 env.DB.prepare() D1 API
3. 非 production 环境: 使用 PrismaClient
```

**步骤 4.2** — 配置构建排除 (20min)
```
1. 在 wrangler.toml 中配置 ignored_inline_data 排除 Prisma
2. postinstall 脚本验证 Prisma 不在生产构建中
```

**步骤 4.3** — 验证 (10min)
```
1. 检查部署日志无 PrismaClient 加载记录
2. 验证 dev 环境 PrismaClient 正常加载
```

---

## 3. 部署清单

| 步骤 | 操作 | 验证 |
|------|------|------|
| 1 | `wrangler deploy --dry-run` 检查构建产物 | 无 PrismaClient 产物 |
| 2 | `wrangler deploy` | 部署成功 |
| 3 | `curl https://api.vibex.top/health` | 返回 200 |
| 4 | SSE 流触发超时场景 | Worker 不挂死 |
| 5 | 多 Worker 并发压测 | 限流计数一致 |

---

## 4. 回滚方案

| 场景 | 回滚操作 |
|------|---------|
| SSE 超时破坏事件顺序 | 撤销 AbortController 改动，恢复原 `aiService.chat()` 调用 |
| Cache API 导致限流失效 | 临时回退到内存 Map（添加 `USE_IN_MEMORY_RATELIMIT=true` 特性开关） |
| /health 端点异常 | 从 gateway.ts 移除 health 路由，重新部署 |
| Prisma 加载问题 | 设置 `NODE_ENV=production`，确认 Prisma 不加载 |

---

## 5. 成功标准

- [ ] `vitest run` 全部通过
- [ ] `curl /health` 返回 200
- [x] SSE 流 10s 超时场景下 Worker 不挂死 — E1 实现了 AbortController 10s 超时
- [ ] 多 Worker 并发压测限流计数一致
- [ ] 生产构建产物不包含 PrismaClient

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
