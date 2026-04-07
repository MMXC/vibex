# Spec: Sprint 2 — 开发者体验

**Epic**: E6（开发者体验提升）
**Sprint**: Sprint 2
**工时**: 8h
**目标**: DX 提升 + 关键基础设施完善

---

## Spec E6-S1: 提案追踪 CLI 激活

### 1. 概述

提案追踪 CLI 工具存在但使用率为 0，需完善工具能力 + 文档推广。

### 2. 当前问题

- CLI 功能不完整（缺少关键子命令）
- 使用文档缺失或过时
- 与 team-tasks 系统集成不顺畅

### 3. 目标状态

```bash
# 可用命令
vibex proposal list --status pending
vibex proposal show <id>
vibex proposal update <id> --status done
vibex proposal export --format markdown
vibex proposal sync --agent dev  # 同步到 team-tasks
```

### 4. 验收标准

- CLI `vibex proposal --help` 输出完整使用说明
- 关键子命令可用（list/show/update/export）
- README.md 包含 CLI 使用示例

---

## Spec E6-S2: packages/types 可依赖化

### 1. 概述

`packages/types` 无法被 workspace 依赖，导致类型定义分散在各 package 中。

### 2. 目标状态

```typescript
// 在任意 workspace package 中可导入
import { Generation, FlowSession, Component } from '@vibex/types';

// packages/types/index.ts 导出完整
export * from './generation';
export * from './flow';
export * from './component';
```

### 3. 验收标准

- `packages/types` 有独立 `package.json`（name: `@vibex/types`）
- workspace 其他 package 可通过 `@vibex/types` 导入类型
- `tsc --noEmit` 在所有 workspace package 通过

---

## Spec E6-S3: componentStore 批量方法

### 1. 概述

`componentStore` 缺少批量操作方法，单个操作多次触发 store 更新。

### 2. 目标状态

```typescript
// stores/componentStore.ts
export const componentStore = {
  state: new Map<string, Component>(),

  upsertMany(components: Component[]) {
    components.forEach(c => this.state.set(c.id, c));
    // 单一事件触发（批量更新）
    this.notify();
  },

  deleteMany(ids: string[]) {
    ids.forEach(id => this.state.delete(id));
    this.notify();
  },

  getByFlowId(flowId: string): Component[] {
    return Array.from(this.state.values()).filter(c => c.flowId === flowId);
  },
};
```

### 3. 验收标准

- `upsertMany` 批量插入性能优于循环 `upsert`
- `deleteMany` 单一 `notify()` 调用
- 单元测试覆盖批量方法

---

## Spec E6-S4: AI Timeout 配置外化

### 1. 概述

AI timeout 硬编码，跨环境无法配置。

### 2. 目标状态

```typescript
// config/ai.ts
export const AI_CONFIG = {
  timeout: parseInt(process.env.AI_TIMEOUT_MS || '60000', 10), // 默认 60s
  maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3', 10),
  model: process.env.AI_MODEL || 'gpt-4o',
};

// services/llm.ts 使用
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.timeout);
```

### 3. 验收标准

- `AI_TIMEOUT_MS` 环境变量生效
- timeout 可测量（通过 Playwright E2E 测试验证 60s 超时触发）

---

## Spec E6-S5: 健康检查端点

### 1. 概述

缺少 `/health` 端点，无法判断服务可用性。

### 2. 目标状态

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    db: await checkDatabase(),
    memory: process.memoryUsage(),
  };

  const allHealthy = Object.values(checks).every(
    v => typeof v !== 'object' || v.status === 'ok'
  );

  return Response.json(checks, {
    status: allHealthy ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
```

### 3. 验收标准

- `GET /health` 返回 200 且 `status: 'ok'`
- 数据库连接检测（超时 2s）
- 内存使用量报告
- 监控服务可轮询 `/health`

---

## Spec E6-S6: SSR-Safe 规范建立

### 1. 概述

缺少 SSR 环境下安全使用组件的规范，导致水合不匹配（hydration mismatch）。

### 2. 规范内容

```typescript
// docs/ssr-safe.md

## SSR-Safe 规则

### 1. 浏览器 API 守卫
```typescript
// ❌ 错误
const isClient = typeof window !== 'undefined';

// ✅ 正确：useEffect 延迟客户端逻辑
useEffect(() => {
  // 客户端专属代码
  const handler = () => { ... };
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);
```

### 2. 动态导入
```typescript
// ❌ 错误：SSR 时直接使用浏览器 API
const HeavyComponent = require('./HeavyComponent');

// ✅ 正确：动态导入（自动 SSR-safe）
const HeavyComponent = dynamic(() => import('./HeavyComponent'));
```

### 3. LocalStorage 访问
```typescript
// ❌ 错误
const stored = localStorage.getItem('key');

// ✅ 正确
const [stored, setStored] = useState(null);
useEffect(() => {
  setStored(localStorage.getItem('key'));
}, []);
```

### 4. 文档化要求
- 所有使用浏览器 API 的组件必须添加 `// SSR-safe` 注释
- 新增组件 code review 时检查 SSR 安全性
```

### 3. 验收标准

- `docs/ssr-safe.md` 规范文档存在
- 关键组件添加 SSR 注释
- CI lint 规则检查 `localStorage`/`window` 在组件顶层使用

---

## Spec E6-S7: clarificationId 数据库索引

### 1. 概述

`clarificationId` 字段缺少索引，查询性能差。

### 2. 修复方案

```typescript
// prisma/migrations/xxx_add_clarification_id_index.ts
module.exports = {
  async up(db) {
    await db.runSql(`
      CREATE INDEX IF NOT EXISTS "idx_clarification_id"
      ON "Component"("clarificationId")
      WHERE "clarificationId" IS NOT NULL;
    `);
  },
  async down(db) {
    await db.runSql('DROP INDEX IF EXISTS "idx_clarification_id";');
  },
};
```

### 3. 验收标准

- 迁移执行成功
- `EXPLAIN` 查询计划显示使用索引
- 查询性能可测量提升（`clarificationId` 查询 < 50ms）

---

## Spec E6-S8: Flow 执行层 TODO 清理

### 1. 概述

`flow-execution` 模块存在空实现 TODO，状态不明确。

### 2. 处理策略

| TODO 类型 | 处理方式 |
|----------|----------|
| 已知功能，未实现 | 补充实现 + 单元测试 |
| 已知废弃 | 移除代码 + 更新 schema |
| 未知 TODO | 分配 owner，1 周内确认 |

### 3. 验收标准

- `flow-execution` 模块无悬空 TODO（`grep -r "TODO" flow-execution/` 为空）
- 所有实现有对应单元测试

---

## Spec E6-S9: Canvas ComponentRegistry 版本化

### 1. 概述

ComponentRegistry 无版本化机制，组件重载后状态不一致。

### 2. 目标状态

```typescript
// 注册时带版本号
registry.register('Button', ButtonComponent, { version: '1.0.0' });

// 重载检测
registry.onReload((prevVersion, nextVersion) => {
  console.log(`ComponentRegistry reloaded: ${prevVersion} → ${nextVersion}`);
  // 重新初始化画布状态
});
```

### 3. 验收标准

- Registry 初始化输出版本号
- 重载前后版本号可追踪
- 重载后画布状态一致性（E2E 测试验证）

---

## Spec E6-S10: OPTIONS 预检 CORS 修复

### 1. 概述

CORS 预检请求（OPTIONS）被 401 拦截，应返回 200。

### 2. 目标状态

```typescript
// middleware/cors.ts
export function corsMiddleware(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  return null; // 继续后续处理
}
```

### 3. 验收标准

- `OPTIONS /api/xxx` 返回 200
- CORS headers 正确返回
- 非 OPTIONS 请求行为不变

---

## Spec E6-S1x: Workers 内存缓存隔离

### 1. 概述

Cloudflare Workers 环境中，内存缓存跨请求泄漏。

### 2. 问题分析

Workers 使用 V8 isolates，请求间内存隔离。但某些全局变量（如 `globalThis`）可能意外共享。

### 3. 目标状态

```typescript
// 确保每个请求使用独立的缓存实例
export function createRequestScopedCache<T>(
  factory: () => T
): () => T {
  const cache = new Map<string, T>();
  return () => {
    const key = crypto.randomUUID();
    if (!cache.has(key)) {
      cache.set(key, factory());
    }
    return cache.get(key)!;
  };
}
```

### 4. 验收标准

- 跨请求内存隔离（无共享状态）
- 内存使用随请求增长后稳定（无泄漏）
