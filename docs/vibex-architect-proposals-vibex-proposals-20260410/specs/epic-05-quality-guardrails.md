# SPEC — Epic 5: 质量保障与规范

**项目**: vibex-architect-proposals-vibex-proposals-20260410
**Epic**: Epic 5 — 质量保障与规范
**Stories**: ST-08, ST-09
**总工时**: 12h
**状态**: Ready for Development

---

## 1. Overview

建立 SSR-Safe 编码规范防止 hydration mismatch，并添加健康检查端点支撑部署验证和监控告警。

---

## 2. Story: ST-08 — SSR-Safe 编码规范（8h）

### 2.1 目标
编写 SSR-Safe 编码规范文档，建立 ESLint 规则检测 SSR-Unsafe 模式，并修复现有违规代码。

### 2.2 常见 SSR-Unsafe 模式

| 模式 | 问题 | 替代方案 |
|------|------|---------|
| `setInterval(fn, delay)` | SSR 无 timer API | 使用 `useEffect` + cleanup |
| `window.matchMedia(q)` | SSR 无 window | `useMediaQuery` hook |
| `toLocaleDateString()` | 时区差异导致 hydration mismatch | `date-fns` 库或服务端格式化 |
| `dangerouslySetInnerHTML` | SSR/CSR 输出可能不同 | 避免或显式标记 |
| `document.cookie` | SSR 无 document | 仅在 client components 中使用 |
| 组件顶层调用浏览器 API | SSR 时崩溃 | 移入 `useEffect` |

### 2.3 规范文档结构

```markdown
# docs/ssr-safe-coding-guidelines.md

## 1. 原则
- 所有浏览器 API 调用必须位于 `useEffect` 或 client-side lifecycle 中
- 组件顶层禁止直接调用 `window.*`、`document.*`、`navigator.*`
- 时区/格式化操作优先在服务端完成，客户端只做展示

## 2. 检查规则

### 2.1 禁止 setInterval
```typescript
// ❌ 禁止（组件顶层）
setInterval(() => {...}, 1000);

// ✅ 允许（useEffect cleanup）
useEffect(() => {
  const id = setInterval(() => {...}, 1000);
  return () => clearInterval(id);
}, []);
```

### 2.2 禁止 window/document 在组件顶层
```typescript
// ❌ 禁止
const isMobile = window.matchMedia('...').matches;

// ✅ 允许
const isMobile = useMediaQuery('...');
```

## 3. ESLint 配置
使用 `@next/react-compiler` 或自定义 ESLint rule 检测违规模式。
```

### 2.4 ESLint Rule 配置

```javascript
// eslint.config.mjs (或 .eslintrc.js)
export default [
  {
    name: 'SSR-Safe Rules',
    rules: {
      'no-restricted-globals': ['error', 'window', 'document', 'navigator', 'location'],
      'no-new-object': 'off', // 允许普通对象，但阻止某些已知 unsafe 模式
    },
    // 或使用 @typescript-eslint 结合自定义 rule
  }
];
```

自定义 rule 示例（检测 `setInterval` 在 JSX 组件顶层）:

```typescript
// lib/eslint-rules/no-ssr-unsafe-timer.ts
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Detect SSR-unsafe timer usage' },
  },
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type === 'Identifier' && callee.name === 'setInterval') {
          // 检查是否在 useEffect 或 event handler 内
          if (!isInsideEffect(context) && !isInsideHandler(context)) {
            context.report({ node, messageId: 'noSetIntervalTopLevel' });
          }
        }
      },
    };
  },
};
```

### 2.5 现有违规代码修复

```bash
# 扫描现有违规
grep -rn "setInterval" vibex-fronted/src/components/ --include="*.tsx"
grep -rn "window\." vibex-fronted/src/components/ --include="*.tsx" | grep -v "useEffect"

# 预期修复点（根据实际情况调整）
# - components/Canvas/CanvasRenderer.tsx (如有)
# - components/Diagnostic/DiagnosticPanel.tsx (如有)
```

### 2.6 验收条件

| 条件 | 验证方式 |
|------|---------|
| `docs/ssr-safe-coding-guidelines.md` 存在 | `ls docs/ssr-safe-coding-guidelines.md` |
| ESLint SSR 规则已启用 | `pnpm lint` 在 CI 中检测 SSR 违规 |
| `grep -rn "setInterval" src/components/` 返回空（顶层调用） | 扫描结果为空 |
| CI 阻止 SSR-Unsafe 代码合并 | PR check 失败 |

### 2.7 验收测试

```typescript
test('docs/ssr-safe-coding-guidelines.md 存在', () => {
  expect(fs.existsSync('docs/ssr-safe-coding-guidelines.md')).toBe(true);
});

test('ESLint 检测到 setInterval 顶层调用', () => {
  const results = runESLint(['src/components/Canvas.tsx']);
  expect(results.some(r => r.message.includes('setInterval'))).toBe(true);
});

test('现有 setInterval 调用位于 useEffect 中', () => {
  const files = glob.sync('src/components/**/*.tsx');
  const violations = files.filter(f => hasTopLevelSetInterval(f));
  expect(violations).toHaveLength(0);
});
```

---

## 3. Story: ST-09 — 健康检查端点（4h）

### 3.1 目标
在 `vibex-backend` 添加 `/health` 端点，验证 DB、KV、AI 服务可达性，用于部署验证和监控告警。

### 3.2 实施步骤

#### 3.2.1 健康检查路由

```typescript
// vibex-backend/src/routes/health.ts

import { Hono } from 'hono';
import { getDB } from '../db';
import { getKV } from '../kv';
import { testAIConnection } from '../services/ai-service';

const app = new Hono();

app.get('/', async (c) => {
  const checks: Record<string, { status: 'ok' | 'error'; latencyMs?: number; error?: string }> = {};

  // DB check
  try {
    const db = getDB();
    const start = Date.now();
    await db.prepare('SELECT 1').first();
    checks.db = { status: 'ok', latencyMs: Date.now() - start };
  } catch (err) {
    checks.db = { status: 'error', error: (err as Error).message };
  }

  // KV check
  try {
    const kv = getKV();
    const start = Date.now();
    await kv.get('__health_check__');
    checks.kv = { status: 'ok', latencyMs: Date.now() - start };
  } catch (err) {
    checks.kv = { status: 'error', error: (err as Error).message };
  }

  // AI check
  try {
    const start = Date.now();
    await testAIConnection({ timeoutMs: 5000 }); // 5s 健康探测
    checks.ai = { status: 'ok', latencyMs: Date.now() - start };
  } catch (err) {
    checks.ai = { status: 'error', error: (err as Error).message };
  }

  const allOk = Object.values(checks).every(c => c.status === 'ok');

  return c.json({
    status: allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  }, allOk ? 200 : 503);
});

export default app;
```

#### 3.2.2 注册路由

```typescript
// vibex-backend/src/index.ts (或 gateway.ts)
import { healthApp } from './routes/health';

app.route('/health', healthApp);
```

#### 3.2.3 部署验证

```bash
# 部署后验证
curl https://api.vibex.top/health
# 预期: { "status": "healthy", "timestamp": "...", "checks": { "db": { "status": "ok" }, ... } }
```

### 3.3 验收条件

| 条件 | 验证方式 |
|------|---------|
| `GET /health` 返回 200 | `curl /health` → status 200 |
| body 包含 `db`、`kv`、`ai` 字段 | JSON schema 验证 |
| `status` 字段为 `healthy` 或 `degraded` | 值类型检查 |
| DB/KV/AI 任一故障时返回 503 | 模拟故障场景 |

### 3.4 验收测试

```typescript
test('GET /health 返回 200 且包含三个服务状态', async () => {
  const res = await fetch('/health');
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body).toHaveProperty('db');
  expect(body).toHaveProperty('kv');
  expect(body).toHaveProperty('ai');
  expect(body).toHaveProperty('timestamp');
  expect(body.status).toBe('healthy');
});

test('健康检查包含 latencyMs', async () => {
  const body = await fetch('/health').then(r => r.json());
  expect(body.db.latencyMs).toBeGreaterThanOrEqual(0);
  expect(body.db.status).toBe('ok');
});

test('服务故障时返回 503', async () => {
  // Mock KV 失败
  vi.spyOn(kv, 'get').mockRejectedValueOnce(new Error('KV unavailable'));
  const res = await fetch('/health');
  expect(res.status).toBe(503);
  const body = await res.json();
  expect(body.status).toBe('degraded');
});
```

---

## 4. DoD Checklist — Epic 5

- [ ] `docs/ssr-safe-coding-guidelines.md` 存在且内容完整
- [ ] ESLint SSR 规则已部署并启用
- [ ] 现有 SSR-Unsafe 代码已修复
- [ ] `GET /health` 返回 200，body 包含 `{ db, kv, ai }` 字段
- [ ] 健康检查端点已在生产环境验证
- [ ] `pnpm test` 全部通过
- [ ] PR 已合并到 main

---

*Spec 由 PM Agent 基于 architect 分析文档生成 — 2026-04-10*
