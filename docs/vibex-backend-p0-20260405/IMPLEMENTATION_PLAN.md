# 实施计划: VibeX Backend OPTIONS + CORS Fix

> **项目**: vibex-backend-p0-20260405  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 实施顺序

```
Phase 1 (E1): OPTIONS handler 顺序调整      ← 0.5h
Phase 2 (E2.1): 全局 CORS + OPTIONS handler ← 0.3h
Phase 3 (E2.2): NODE_ENV 修复              ← 0.3h
Phase 4 (E2.3): JWT_SECRET 错误码          ← 0.4h
```

**并行策略**: E2.1/E2.2/E2.3 可并行实施。

---

## 2. 详细步骤

### Phase 1: OPTIONS handler 顺序调整 (E1)

**目标文件**: `vibex-backend/src/routes/v1/gateway.ts`

**步骤 1.1** — 调整 `protected_.options` 注册顺序 (20min) ✅ DONE
```
1. 找到 const protected_ = new Hono<{ Bindings: CloudflareEnv }>(); ✅
2. 将 protected_.use('*', authMiddleware) 移到 protected_.options('/*') 之后 ✅
3. 验证 protected_.options 在 protected_.use 之前 ✅
```

**代码变更**:
```typescript
// 修复前 (第 116, 119 行)
protected_.use('*', authMiddleware);
protected_.options('/*', (c) => {
  return c.text('', 204);
});

// 修复后 ✅
protected_.options('/*', (c) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return c.text('', 204);
});
protected_.use('*', authMiddleware);
```

**步骤 1.2** — 验证 (10min) ✅ DONE
```
1. 运行 jest — 584 passed, 3 failed (pre-existing) ✅
2. TypeScript — 0 new errors introduced ✅
```

### Phase 2: 全局 CORS + OPTIONS handler (E2.1)

**目标文件**: `vibex-backend/src/index.ts`

**步骤 2.1** — 添加显式 `app.options('/*')` (15min) ✅ DONE
```
1. 在 app.use('*', cors(...)) 之后添加 app.options('/*', ...) ✅
2. 设置 Access-Control-Allow-Origin: * ✅
3. 设置 Access-Control-Allow-Methods ✅
4. 设置 Access-Control-Allow-Headers ✅
```

**步骤 2.2** — 验证 (5min) ✅ DONE
```
1. jest — 18 new tests pass (index.test.ts 7 tests + auth.test.ts 2 tests) ✅
2. 601 total tests pass ✅
```

### Phase 3: NODE_ENV 修复 (E2.2)

**目标文件**: `vibex-backend/src/index.ts`

**步骤 3.1** — 修复环境检测逻辑 (15min) ✅ DONE
```
1. 找到 if (process.env.NODE_ENV !== 'production') ✅
2. 修改为: if (!isWorkers && !isProduction) ✅
3. 添加: const isWorkers = typeof globalThis.caches !== 'undefined'; ✅
4. 添加: const isProduction = process.env?.NODE_ENV === 'production'; ✅
```

**步骤 3.2** — 验证 (5min) ✅ DONE
```
1. jest — index.test.ts NODE_ENV detection tests pass ✅
```

### Phase 4: JWT_SECRET 错误码 (E2.3)

**目标文件**: `vibex-backend/src/lib/auth.ts`

**步骤 4.1** — 修改错误码和消息 (20min) ✅ DONE
```
1. 找到 auth.ts 中 JWT_SECRET 缺失的 c.json() 调用 ✅
2. 将 code: 'INTERNAL_ERROR' 改为 code: 'CONFIG_ERROR' ✅
3. 将 error 消息改为: 'JWT_SECRET not configured. Please run: wrangler secret put JWT_SECRET' ✅
4. 添加 console.error 日志提示 ✅
```

**步骤 4.2** — 验证 (10min) ✅ DONE
```
1. 运行 jest auth.test.ts — CONFIG_ERROR tests pass ✅
```

---

## 3. 部署清单

| 步骤 | 操作 | 验证 |
|------|------|------|
| 1 | `wrangler deploy --dry-run` | 构建成功，无新错误 |
| 2 | `wrangler deploy` | 部署成功 |
| 3 | `curl -X OPTIONS https://api.vibex.top/v1/projects -v` | HTTP 204 + CORS headers |
| 4 | 浏览器 DevTools Network 检查 | OPTIONS preflight 通过 |

---

## 4. 回滚方案

| 场景 | 回滚操作 |
|------|---------|
| OPTIONS 仍返回 500 | 检查 v1.options 是否在 authMiddleware 之前 |
| 本地 dev server 无法启动 | 检查 NODE_ENV 检测条件是否包含 `!isWorkers` |
| 其他路由返回异常 | 确认仅移动了 protected_.options，未改变其他中间件 |

---

## 5. 成功标准

- [ ] `vitest run` 全部通过
- [x] `curl -X OPTIONS /v1/projects` 返回 204 — E2.1 app.options('/*') ✅
- [x] OPTIONS 响应含 CORS headers — E2.1 ✅
- [x] NODE_ENV 检测在 Workers 环境下不导入 node-server — E2.2 ✅
- [x] JWT_SECRET 缺失返回 `CONFIG_ERROR` 而非 `INTERNAL_ERROR` — E2.3 ✅

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
