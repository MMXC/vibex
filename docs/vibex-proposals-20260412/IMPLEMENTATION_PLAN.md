# Implementation Plan: VibeX 2026-04-12 Sprint

**Project**: vibex-proposals-20260412
**Date**: 2026-04-07
**Revised**: 2026-04-10 (补充 Sprint 1/2 详细实施单元)
**Status**: Complete — Sprint 1/2 实施单元已补充

---

## Overview

| 属性 | 值 |
|------|-----|
| E0.1 TypeScript | ✅ DONE（206 错误归零） |
| E0.2 Auth Mock | ✅ DONE — Auth Mock Factory 已创建 |
| Sprint 1 工时 | 6.3h（E1/E2/E3/E4.1） |
| Sprint 2 工时 | 11.5h（E4.2-4.5/E5/E6/E7） |

---

## Sprint 0 重大修正

### 原始 vs 实际

| 原始规划 | 实际发现 |
|----------|----------|
| TypeScript 修复 2h | 206 个 TS 错误，149 个文件，估算 2-3 周 |
| Auth Mock 3h | 范围清晰，保持不变 |

### 修正策略：TS Epic 拆分

| Epic | 聚焦 | 预估范围 | 优先级 |
|------|------|----------|--------|
| TS-E1 | Zod v4 API 迁移 | ~20 文件 | P0（影响 Auth Mock 依赖） |
| TS-E2 | Cloudflare 类型不兼容 | ~15 文件 | P1 |
| TS-E3 | `as any` / 类型守卫缺失 | ~30 文件 | P1 |
| TS-E4 | 模块导入错误（missing modules） | ~50 文件 | P2 |

**并行策略**: TS-E1 + Auth Mock 先并行（互相依赖最小），完成后解锁 TS-E3。

---

## Sprint 0 详细计划

### TS-E1: Zod v4 API 迁移 (P0, ~1 周)

```bash
# 扫描 Zod 相关错误
pnpm tsc --noEmit 2>&1 | grep -i "zod" | head -30

# Zod v4 常见破坏性变更:
# - z.object() → z.strictObject()
# - z.infer<> → z.output<>
# - z.union([]) → z.discriminatedUnion()
```

**验收**: `pnpm tsc --noEmit` Zod 相关错误归零

---

### TS-E2: Cloudflare 类型不兼容 (P1, ~0.5 周)

```bash
pnpm tsc --noEmit 2>&1 | grep -i "cloudflare\|wrangler" | head -20
```

**验收**: Cloudflare 类型错误归零

---

### TS-E3: `as any` / 类型守卫缺失 (P1, ~1 周)

```bash
# 找到所有 as any
grep -rn "as any" vibex-fronted/src/ vibex-backend/src/ --include="*.ts"

# 替换策略:
# 1. 显式类型接口
# 2. unknown + 类型守卫 (type predicate)
# 3. @ts-expect-error (需 Architect 评审)
```

**验收**: `as any` 实例减少到 10 个以内

---

### TS-E4: 模块导入错误 (P2, ~0.5 周)

```bash
# 按错误数排序，最少的先修
pnpm tsc --noEmit 2>&1 | grep "cannot find module" | \
  sed 's/ //g' | sort | uniq -c | sort -n
```

**验收**: `pnpm tsc --noEmit` 剩余错误数量最小化

---

### Auth Mock Factory (保持不变, P0, 3h)

```bash
cp -r src/__tests__ src/__tests__.bak
# 创建 auth.mock.ts
# 替换散落 mock
pnpm test
```

**验收**: `pnpm test` → 79 passed, 0 failed

**状态**: ✅ 已完成 (2026-04-10)
**Commit**: b4cb4956

**产出**: `tests/unit/__mocks__/auth/index.ts`
- `createAuthStoreMock(options)` — Zustand authStore mock factory
- `createAuthApiMock(options)` — auth API mock (login/register/logout/getCurrentUser)
- `authStoreMock.presets` — 预构建 authenticated/unauthenticated/loading states
- `setSessionAuthToken()` / `clearSessionAuth()` — sessionStorage helpers

**替换目标**（逐步迁移）:
- `Navbar.test.tsx` — authStore selector pattern
- `Header.test.tsx` — authStore mockReturnValue pattern
- `useHomeGeneration.test.ts` — authStore getState pattern
- `auth/page.test.tsx` — authApi mock
- `dashboard/page.test.tsx` — authApi mock
- `accessibility.test.tsx` — authApi mock

---

## Sprint 1: 测试基础设施 + CI 守卫 (6.3h)

### E1: Token 日志 safeError (1.5h)

**文件**:
- 创建: `vibex-backend/src/lib/logger/safeError.ts`
- 修改: `vibex-backend/src/app/api/chat/route.ts`
- 修改: `vibex-backend/src/app/api/pages/route.ts`

**方法**:
1. 创建 `safeError.ts`（正则脱敏，详见 architecture.md §11.4）
2. 扫描所有 API 路由: `grep -rn 'console\.' vibex-backend/src/app/api/`
3. 替换 `console.log({ token: x })` → `console.log(safeError({ token: x }))`

**Patterns to follow**: pino logger 现有模式

**Test scenarios**:
- Happy path: safeError({ token: 'abc123' }) → '{token: 'ab***23'}'
- Edge case: 嵌套对象 { nested: { token: 'xyz' } } → 递归脱敏
- Edge case: null/undefined 值不 crash
- Verification: `grep -rn 'console\.' vibex-backend/src/app/api/` → 0 未包装

**状态**: ✅ 已完成 (2026-04-10)
**说明**: safeError 已实现在 `src/lib/log-sanitizer.ts`，包含 sanitize()、safeError()、devLog() 函数。所有 API 路由均已使用 safeError 处理敏感数据。无裸 console.log 调用。

---

### E2: 提案状态追踪 (0.5h)

**文件**:
- 修改: `docs/PROPOSALS_INDEX.md`
- 创建: `docs/PROPOSALS_STATUS_SOP.md`

**方法**:
1. 扫描所有提案文档，添加 `status` 字段
2. 编写 SOP（状态转换规则）

**Patterns to follow**: 现有 INDEX.md 结构

**Test scenarios**:
- Verification: 所有提案有 `status` 字段
- Verification: SOP 文档存在

**状态**: ✅ 已完成 (2026-04-10)
**Commit**: 86d05694

**产出**:
- `docs/proposals/PROPOSALS_STATUS_SOP.md` — 状态定义、转换规则、维护规范
- `docs/proposals/INDEX.md` 已有 status 字段（之前已完善）

---

### E3: CI/CD 守卫增强 (1h + 0.5h WEBSOCKET)

**文件**:
- 修改: `vibex-fronted/scripts/pre-submit-check.sh`
- 创建: `vibex-backend/src/config/websocket.ts`

**方法**:
1. CI: 添加 `grepInvert` 守卫（playwright/vitest 配置变更时触发全量）
2. WEBSOCKET: 提取 `WEBSOCKET_CONFIG` 单一配置源

**Patterns to follow**: 现有 GitHub Actions workflow

**Test scenarios**:
- Happy path: playwright.config.ts 变更 → CI 触发全量测试
- Verification: `WEBSOCKET_CONFIG` 为唯一配置源

**状态**: ✅ 已完成 (2026-04-10)
**Commit**: d50d97a5

**产出**:
- `vibex-fronted/scripts/pre-submit-check.sh` Section 7: grepInvert guard 检测 test config 变更
- `vibex-backend/src/config/websocket.ts`: WEBSOCKET_CONFIG 单一配置源

---

### E4.1: Canvas ErrorBoundary (1h)

**文件**:
- 创建: `vibex-fronted/src/components/canvas/panels/PanelError.tsx`
- 修改: `vibex-fronted/src/components/canvas/panels/ContextTreePanel.tsx`
- 修改: `vibex-fronted/src/components/canvas/panels/FlowTreePanel.tsx`
- 修改: `vibex-fronted/src/components/canvas/panels/ComponentTreePanel.tsx`

**方法**:
1. 创建通用 `PanelError` fallback 组件（含重试按钮）
2. 每个 TreePanel 用 `<ErrorBoundary fallback={PanelError}>` 包裹

**Patterns to follow**: React ErrorBoundary 规范

**Test scenarios**:
- Error path: 某 panel throw → 该 panel 显示 fallback，其他两栏正常
- Integration: Playwright E2E — 每个 panel 独立恢复

---

## Sprint 2: 架构增强 + 测试重构 (11.5h)

### E4.2: @vibex/types 落地 (2h)

**文件**:
- 创建: `packages/types/src/api/canvas.ts`
- 创建: `packages/types/src/api/flows.ts`
- 创建: `packages/types/src/api/components.ts`
- 修改: `vibex-backend/src/app/api/v1/canvas/health/route.ts`
- 修改: `vibex-fronted/src/lib/canvas/api/canvasApi.ts`

**方法**:
1. 从现有 backend types 提取 Zod schemas
2. 发布到 `packages/types`
3. backend/frontend 替换 import

**Patterns to follow**: 现有 `packages/types/src/core/auth.ts`

**Test scenarios**:
- Happy path: backend API 返回类型 = @vibex/types 定义
- Edge: 类型升级不 break build（先改无引用处）

---

### E4.3: v0→v1 迁移 (2h)

**文件**:
- 创建: `vibex-backend/src/middleware/deprecation.ts`
- 修改: `vibex-backend/src/app/api/v0/*/route.ts`

**方法**:
```typescript
// middleware/deprecation.ts
c.res.headers.set('Deprecation', 'true');
c.res.headers.set('Sunset', 'Sat, 31 Dec 2026 23:59:59 GMT');
```

**Patterns to follow**: Hono middleware 规范

**Test scenarios**:
- Verification: v0 路由响应头包含 `Deprecation: true`
- Verification: v1 路由无此 header

---

### E4.4: frontend types 对齐 (3h)

**文件**:
- 修改: `vibex-fronted/src/lib/canvas/types.ts`
- 删除: 重复类型定义（散落在 components 中的）

**方法**:
```typescript
// types.ts: 不再定义 CanvasHealthResponse，直接 re-export
import { CanvasHealthResponse } from '@vibex/types';
export type { CanvasHealthResponse };
```

**Patterns to follow**: 现有 `@vibex/types` 引用模式

**Test scenarios**:
- Verification: `grep -rn 'interface.*CanvasHealth' vibex-fronted/src/` → 0 结果
- Verification: `pnpm tsc --noEmit` → 0 error

---

### E4.5: groupByFlowId 记忆化优化 (1.5h)

**文件**:
- 修改: `vibex-fronted/src/components/canvas/ComponentTree.tsx`

**方法**:
```typescript
// Before: O(n×3) find
const flowNode = flowNodes.find(f => f.nodeId === ctx.nodeId);

// After: O(1) Map lookup
const flowNodeIndex = useMemo(() =>
  Object.groupBy(flowNodes, f => f.nodeId),
[flowNodes]);
const flowNode = flowNodeIndex[ctx.nodeId]?.[0];
```

**Patterns to follow**: `useMemo` 性能优化规范

**Test scenarios**:
- Performance: 1000 节点渲染 < 16ms（< 1 frame）
- Verification: Vitest perf test

---

### E5: waitForTimeout 重构 (4h + 2h E2E + 1h UT)

**文件**:
- 修改: `vibex-fronted/tests/e2e/*.spec.ts`
- 创建: `vibex-fronted/tests/unit/components/canvas/JsonTreeModal.test.tsx`

**替换规则**:
```typescript
// ❌ 替换前
await page.waitForTimeout(1000);

// ✅ 替换后（不稳定等待 → 确定性等待）
await expect(page.getByTestId('element')).toBeVisible({ timeout: 5000 });
// 或
await page.waitForResponse(res => res.url().includes('/api/'));
```

**Patterns to follow**: Playwright 最佳实践

**Test scenarios**:
- Happy path: 重构后 E2E 测试全部通过
- Edge: 87 处 → ≤ 10 处
- Verification: `grep -rn 'waitForTimeout' tests/e2e/` → ≤ 10

---

### E6: console.* pre-commit hook (1h)

**文件**:
- 创建: `.husky/pre-commit`
- 修改: `package.json` (lint-staged 配置)
- 修改: `eslint.config.js` (@typescript-eslint/no-console)

**方法**:
```bash
# .husky/pre-commit
npx lint-staged
```

**Patterns to follow**: 现有 Husky + lint-staged 配置

**Test scenarios**:
- Happy path: `git commit -m 'test'` → console.log 被 ESLint 拦截
- Verification: husky hook 生效

---

### E7: 文档与工具 (1.5h)

**文件**:
- 创建: `docs/canvas-roadmap.md`
- 创建: `.github/workflows/changelog.yml`

**Test scenarios**:
- Verification: canvas-roadmap.md 存在且包含演进路线
- Verification: commit 时 CHANGELOG 自动更新

---

## Rollback

| 问题 | 回滚方案 |
|------|----------|
| Epic 引入新错误 | `git checkout -- <epic-modified-files>` |
| 影响 Auth Mock | 优先回滚 TS-E1 |
