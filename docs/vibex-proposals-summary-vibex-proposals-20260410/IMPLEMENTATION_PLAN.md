# IMPLEMENTATION_PLAN: VibeX Quality Governance 2026-04-10

> **项目**: vibex-proposals-summary-vibex-proposals-20260410  
> **作者**: Architect  
> **日期**: 2026-04-10  
> **版本**: v1.0

---

## 1. Sprint 规划（Phase1 止血）

| Sprint | 周期 | 内容 | 工时 | 产出 |
|--------|------|------|------|------|
| Sprint 0 | Day 0.5 | E1: Team Blocking Unlock | 0.5h | task_manager.py 修复 |
| Sprint 1 | Day 1 | E2: Runtime Crash Fixes | 2.5h | streaming + Workers 修复 |
| Sprint 2 | Day 2 | E3: Type Safety + Schema | 4.5h | Zod 统一 + any 清理 |
| Sprint 3 | Day 3 | E4: Test Infrastructure | 3.5h | Playwright 配置统一 |
| Sprint 4 | Day 4 | E5: Vitest Migration | 4h | 测试框架统一 |
| Sprint 5 | Day 5 | E7: Features | 6h | 模板库 + 引导流程 |
| Sprint 6-9 | Day 6-9 | E6: DX Improvements | 8h | P1 问题修复 |
| Sprint 10-18 | Day 10-18 | E8: P2 Features | 39h | P2 问题 |
| Sprint 19-27 | Day 19-27 | E9: P3 Features | 23h | P3 问题 |

**总工时**: ~91h | **团队**: 2 Dev | **周期**: ~9 周（以 2 Dev 计）

---

## 2. Phase1 Sprint 详细计划

### Sprint 0: E1 Team Blocking（0.5h）

**Task P0-1: task_manager token 环境变量化**

```bash
# 修复前
SLACK_BOT_TOKEN = "xoxb-xxxx"  # 硬编码

# 修复后
import os
SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN")
if not SLACK_BOT_TOKEN:
    raise ValueError("SLACK_BOT_TOKEN is required")
```

**验证**:
```bash
# 推送后 GitHub secret scanning 不报警
git commit -m "fix: P0-1 env var for Slack token"
git push
# 在 GitHub PR 页面确认无 secret scanning 警告
```

---

### Sprint 1: E2 Runtime Crash（2.5h）

**Task P0-2: createStreamingResponse 闭包修复（0.5h）**

```typescript
// lib/streaming.ts
export function createStreamingResponse(
  generator: AsyncGenerator<Uint8Array>,
  options: { signal?: AbortSignal; timeout?: number } = {}
) {
  // 修复: 添加 AbortController + timeout 控制
  // 修复: 正确处理 cancel 回调
  return new Response(new ReadableStream({ /* ... */ }));
}
```

**Task P0-3: PrismaClient Workers 守卫（1h）**

```typescript
// lib/prisma.ts
export function getPrisma(): PrismaClient {
  // Workers 环境检测
  const isWorkers = typeof globalThis !== 'undefined' && 'caches' in globalThis;
  if (isWorkers) return new PrismaClient(); // 每次请求新实例
  // Node.js: 全局单例
  if (!globalThis.__prisma) globalThis.__prisma = new PrismaClient();
  return globalThis.__prisma;
}
```

**Task P0-7: SSE Stream 超时控制（1h）**

```typescript
// 所有 streaming 路由添加 AbortController
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 60000);

try {
  for await (const chunk of stream) {
    controller.signal.throwIfAborted();
    writer.write(chunk);
  }
} finally {
  clearTimeout(timeout);
}
```

**验收**:
```bash
# wrangler deploy 成功
pnpm run deploy  # 无 PrismaClient 错误

# streaming timeout 测试
curl -X POST /api/v1/canvas/stream --max-time 65
# 应在 60s 超时，无内存泄漏
```

---

### Sprint 2: E3 Type Safety（4.5h）

**Task P0-4: ESLint no-explicit-any 清理（1h）**

```bash
# 识别所有 any
grep -rn "as any\|: any\|any)" vibex-fronted/src/ vibex-backend/src/ | grep -v node_modules

# 修复策略
# 1. 优先用具体类型替换
# 2. 无法确定时用 unknown + 类型守卫
# 3. 确需 any 时用 @ts-expect-error 注释（需评审）
```

**Task P0-6: Schema Drift 修复（2h）**

```typescript
// packages/types/src/schemas/canvas.ts
// 统一: sessionId → generationId
export const GenerationIdSchema = z.string().uuid();

export const GenerateComponentsSchema = z.object({
  projectId: z.string().min(1),
  prompt: z.string().min(1).max(5000),
  generationId: GenerationIdSchema.optional(), // 统一命名
});

// 后端路由使用
import { GenerateComponentsSchema } from '@vibex/types';
app.post('/api/v1/canvas/generate', async (c) => {
  const body = await c.req.json();
  const result = GenerateComponentsSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Validation failed', details: result.error.flatten() }, 400);
  }
  // 使用 result.data（类型安全）
});
```

**Task P1-7: selectedNodeIds 类型统一（0.5h）**

```typescript
// 全局统一为 Set<string>
export type NodeIdSet = Set<string>;
export const emptyNodeSet = (): NodeIdSet => new Set<string>();
```

**Task P1-1: getRelationsForEntities 修复（1h）**

```typescript
// 修复前: 只取第一个
const entity = entityIds[0]; // BUG: 只能取一个

// 修复后: 全量查询
const entities = await prisma.entity.findMany({
  where: { id: { in: entityIds } },
});
```

**验收**:
```bash
pnpm exec tsc --noEmit  # 0 errors
grep -rn "as any" src/ | wc -l  # 应为 0
```

---

### Sprint 3: E4 Test Infrastructure（3.5h）

**Task P0-11: Playwright 配置统一（1h）**

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  timeout: 30000, // 统一 30s
  use: { baseURL: 'http://localhost:3000' },
  // 移除所有 grepInvert
});
```

**Task P0-12: stability.spec.ts 路径修复（0.5h）**

```typescript
// 修复前
if (!fs.existsSync('./e2e/')) {  // 永远为 true
  throw new Error('E2E dir not found');
}

// 修复后
import { testDir } from '@playwright/test';
if (!fs.existsSync(testDir)) {
  throw new Error(`E2E dir not found at ${testDir}`);
}
```

**Task P0-13: @ci-blocking grepInvert 移除（1h）**

```typescript
// 移除所有 grepInvert 配置
// 确保 @ci-blocking 测试正常执行
```

**Task P0-5: flowId E2E 验证（1h）**

```typescript
test('generate-components includes valid flowId', async ({ page }) => {
  await page.goto('/dashboard');
  await page.fill('[data-testid="requirement-input"]', 'create a login form');
  await page.click('[data-testid="analyze-button"]');

  // 验证 flowId 存在
  const flowId = await page.evaluate(() =>
    window.__FLOW_ID__
  );
  expect(flowId).toMatch(/^[0-9a-f-]{36}$/);
});
```

**验收**:
```bash
pnpm playwright test  # 全部运行（不再跳过）
grep -rn "grepInvert" playwright.config.ts  # 无结果
```

---

### Sprint 4: E5 Vitest Migration（4h）

**Task P0-8: Jest → Vitest 迁移（2h）**

```bash
# 1. 安装 Vitest
pnpm add -D vitest @vitest/coverage-v8

# 2. 创建配置
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: { provider: 'v8', thresholds: { lines: 80 } },
  },
});
EOF

# 3. 迁移测试文件
# *.test.ts → 保持不变（Vitest 兼容 Jest 语法）
# jest.setup.ts → vitest.setup.ts（调整 API）

# 4. 移除 Jest
pnpm remove jest @types/jest jest-runner-eslint
```

**Task P1-16: waitForTimeout 清理（2h）**

```typescript
// 修复前（20+ 处）
await page.waitForTimeout(3000); // 不稳定

// 修复后
await expect(page.locator('.element')).toBeVisible({ timeout: 10000 });
// 或
await page.waitForFunction(() => document.readyState === 'complete');
```

**验收**:
```bash
pnpm vitest run  # 全部通过
grep -rn "waitForTimeout" tests/ | wc -l  # 应为 0
```

---

### Sprint 5: E7 Feature Delivery（6h）

**模板库 + 新手引导**（详见 vibex-pm-features-20260410 架构）

---

## 3. 回滚计划

| Sprint | 回滚步骤 | 时间 |
|--------|---------|------|
| Sprint 0 | `git revert` 恢复硬编码 token | <5 min |
| Sprint 1 | `git revert` 恢复 streaming 实现 | <10 min |
| Sprint 2 | `git revert` 恢复类型修改 | <10 min |
| Sprint 3 | `git revert` 恢复 Playwright 配置 | <5 min |
| Sprint 4 | `git revert` 恢复 Jest 配置 | <10 min |

---

## 4. 验收总表

| Epic | 检查项 | 命令 |
|------|--------|------|
| E1 | 无硬编码 token | `grep -rn "xoxb" scripts/` |
| E2 | streaming 无 error | `curl /api/v1/canvas/stream` |
| E2 | wrangler deploy | `pnpm run deploy` |
| E3 | tsc --noEmit | `pnpm exec tsc --noEmit` → 0 errors |
| E3 | 无 `as any` | `grep -rn "as any" src/ \| wc -l` → 0 |
| E4 | Playwright 统一 | `grep "grepInvert" playwright.config` → 无 |
| E4 | 无跳过测试 | `grep "@ci-blocking" tests/ \| wc -l` → 正常 |
| E5 | Vitest 通过 | `pnpm vitest run` → 全部通过 |
| E5 | 无 waitForTimeout | `grep "waitForTimeout" tests/ \| wc -l` → 0 |

---

*文档版本: v1.0 | 最后更新: 2026-04-10*
