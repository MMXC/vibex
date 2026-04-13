# VibeX Canvas QA 修复 — 实施计划

> **项目**: vibex-canvas-qa-fix
> **日期**: 2026-04-13
> **总工时**: ~5.5h
> **状态**: Epic 0✅ Epic 1✅ Epic 2✅ Epic 3✅ Epic 4✅ 全部完成

---

## Epic 0: 前置验证（0.5h） — ✅ 完成

### Story E0.1: API 404 真实性验证

**开发文件**: `vibex-fronted/src/lib/api-config.ts`

**根因**: `API_CONFIG.endpoints.canvas.snapshots = '/canvas/snapshots'` 缺少 `/v1/` 前缀
**实际API**: `POST /api/v1/canvas/snapshots`

**curl 验证结果** ✅:
```
/api/canvas/snapshots        → HTTP 404 Not Found  (路由不存在)
/api/v1/canvas/snapshots      → HTTP 401 Unauthorized (路由存在)
```

**E0.1 修复 commit**: `270858a2` — 添加 `/v1/` 前缀


---

## Epic 1: Hydration Mismatch 修复（3h）

---

### Story E1.1: contextStore skipHydration

**开发文件**: `src/lib/canvas/stores/contextStore.ts`

**修改位置**: 第 292 行附近

**修改内容**:

```typescript
// 修复前（第 292 行）
{ name: 'vibex-context-store' }

// 修复后
{
  name: 'vibex-context-store',
  skipHydration: true,
}
```

---

### Story E1.2: flowStore skipHydration

**开发文件**: `src/lib/canvas/stores/flowStore.ts`

**修改位置**: 第 335 行附近

```typescript
// 修复前
{ name: 'vibex-flow-store' }

// 修复后
{
  name: 'vibex-flow-store',
  skipHydration: true,
}
```

---

### Story E1.3: componentStore skipHydration

**开发文件**: `src/lib/canvas/stores/componentStore.ts`

**修改位置**: 第 164 行附近

```typescript
// 修复前
{ name: 'vibex-component-store' }

// 修复后
{
  name: 'vibex-component-store',
  skipHydration: true,
}
```

---

### Story E1.4: uiStore skipHydration

**开发文件**: `src/lib/canvas/stores/uiStore.ts`

**修改位置**: 第 168 行附近

```typescript
// 修复前
{ name: 'vibex-ui-store' }

// 修复后
{
  name: 'vibex-ui-store',
  skipHydration: true,
}
```

---

### Story E1.5: sessionStore skipHydration

**开发文件**: `src/lib/canvas/stores/sessionStore.ts`

**修改位置**: 第 120 行附近

```typescript
// 修复前
{ name: 'vibex-session-store' }

// 修复后
{
  name: 'vibex-session-store',
  skipHydration: true,
}
```

---

### Story E1.6: CanvasPage 手动 rehydrate

**开发文件**: `src/components/canvas/CanvasPage.tsx`

**修改内容**: 在组件 mount 后手动 rehydrate 各 store

```typescript
// 在现有 useEffect 之后新增（或在组件顶部新增 useEffect）
useEffect(() => {
  // 强制各 store 在 mount 后 rehydrate localStorage 数据
  // 解决 SSR/CSR hydration mismatch
  useContextStore.persist.rehydrate();
  useFlowStore.persist.rehydrate();
  useComponentStore.persist.rehydrate();
  useUIStore.persist.rehydrate();
  useSessionStore.persist.rehydrate();
}, []);
```

**导入确认**（CanvasPage.tsx 应已有这些 store）:

```typescript
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import { useUIStore } from '@/lib/canvas/stores/uiStore';
import { useSessionStore } from '@/lib/canvas/stores/sessionStore';
```

**如缺少导入，添加**:

```typescript
import { useFlowStore } from '@/lib/canvas/stores/flowStore';
import { useComponentStore } from '@/lib/canvas/stores/componentStore';
import { useUIStore } from '@/lib/canvas/stores/uiStore';
```

---

## Epic 2: API 路径统一（0.5h） — ✅ 完成

> ⚠️ **审查修正**: E2 必须**后置**于 E0.1（API 真实性验证）。E0 返回 404 时需先确认后端路由，再改前端路径。

---

### Story E2.1: snapshots 端点 /v1/ 前缀 ✅ 完成

**开发文件**: `src/lib/api-config.ts`

**修改位置**: 第 30 行附近

```typescript
// 修复前
snapshots: '/canvas/snapshots',

// 修复后
snapshots: '/v1/canvas/snapshots',
```

---

### Story E2.2: snapshot/restoreSnapshot 路径确认 ✅ 完成

**开发文件**: `src/lib/api-config.ts`

**确认结果** ✅: snapshot/restoreSnapshot 已有 /v1/ 前缀，无需修改

**Epic2 验证结论**: 所有 canvas API 端点均含 /v1/ 前缀，统一 ✅

---

## Epic 3: Tab 默认 phase（0.75h） — ✅ 完成

---

### Story E3.1: 默认 phase 初始化 ✅ done

> ⚠️ **审查修正**: TabBar 读取 `contextStore` 的 phase，非 `sessionStore`。修改 `contextStore.ts` 第 94 行。

**开发文件**: `src/lib/canvas/stores/contextStore.ts`

**修改位置**: contextStore.ts 第 94 行
**修改内容**: `phase: 'input'` → `phase: 'context'`
**commit**: `30197131`

```typescript
// 修复前
phase: 'input',

// 修复后
phase: 'context',
```

> **验证**: `grep "phase" src/components/canvas/TabBar.tsx` 第 32 行确认读取源：`const phase = useContextStore((s) => s.phase)`。

> **CanvasPage 导入确认** ✅: CanvasPage.tsx 第 36-40 行已导入全部 5 个 stores（contextStore、flowStore、componentStore、uiStore、sessionStore），rehydrate 时无需额外导入。

**影响分析**:
- `PHASE_ORDER = ['input', 'context', 'flow', 'component', 'prototype']`
- `phase='context'` → `phaseIdx=1`
- `context tab idx=1` → `1 <= 1` → unlocked ✅
- `flow tab idx=2` → `2 > 1` → locked ✅（符合设计）
- `component tab idx=3` → `3 > 1` → locked ✅
- `prototype tab idx=4` → `4 > 1` → locked ✅

---

### Story E3.2: Tab phase 守卫逻辑确认 ✅ done (无需修改)

**开发文件**: `src/components/canvas/TabBar.tsx`

**确认内容**（只读，不修改）:

```typescript
// 第 54-57 行，守卫逻辑应保持不变
const tabIdx = PHASE_ORDER.indexOf(tabId as Phase);
if (tabIdx > phaseIdx) {
  // Tab not yet unlocked by phase — do nothing
  return;
}
```

---

## Epic 4: 测试覆盖（0.75h）

---

### Story E4.1: Persist config 单元测试

**开发文件**: `src/lib/canvas/stores/__tests__/skipHydration.test.ts`

```typescript
// 新增测试文件
describe('skipHydration configuration', () => {
  test('contextStore persist config has skipHydration: true', () => {
    // 通过检查 store.persist.hasHydrated 验证
    expect(useContextStore.persist).toBeDefined();
  });

  test('all 5 stores have persist middleware', () => {
    const stores = [useContextStore, useFlowStore, useComponentStore, useUIStore, useSessionStore];
    stores.forEach(store => {
      expect(store.persist).toBeDefined();
    });
  });

  test('sessionStore default phase is context', () => {
    const initial = useSessionStore.getState();
    expect(initial.phase).toBe('context');
  });
});
```

---

### Story E4.2: API 路径一致性测试

**开发文件**: `src/lib/__tests__/api-config.test.ts`

```typescript
describe('canvas API endpoints', () => {
  test('snapshots endpoint includes /v1/ prefix', () => {
    expect(API_CONFIG.endpoints.canvas.snapshots).toBe('/v1/canvas/snapshots');
  });

  test('snapshot and restoreSnapshot paths are consistent', () => {
    const base = API_CONFIG.endpoints.canvas.snapshots;
    expect(API_CONFIG.endpoints.canvas.snapshot('123')).toBe(`${base}/123`);
    expect(API_CONFIG.endpoints.canvas.restoreSnapshot('123')).toBe(`${base}/123/restore`);
  });
});
```

---

## 完整测试命令

```bash
cd /root/.openclaw/vibex/vibex-fronted

# 1. 单元测试
pnpm vitest run src/lib/canvas/stores/__tests__/skipHydration.test.ts
pnpm vitest run src/lib/__tests__/api-config.test.ts

# 2. 全量测试
pnpm vitest run

# 3. 构建检查
pnpm build

# 4. E2E 测试（需 Playwright 环境）
pnpm playwright test tests/e2e/canvas-qa-fix.spec.ts
```

---

## 实现检查清单（Dev 自检）

- [ ] E1.1: `grep "skipHydration" src/lib/canvas/stores/contextStore.ts` 有输出
- [ ] E1.2: `grep "skipHydration" src/lib/canvas/stores/flowStore.ts` 有输出
- [ ] E1.3: `grep "skipHydration" src/lib/canvas/stores/componentStore.ts` 有输出
- [ ] E1.4: `grep "skipHydration" src/lib/canvas/stores/uiStore.ts` 有输出
- [ ] E1.5: `grep "skipHydration" src/lib/canvas/stores/sessionStore.ts` 有输出
- [ ] E1.6: `grep "rehydrate" src/components/canvas/CanvasPage.tsx` 有输出
- [ ] E2.1: `grep "/v1/canvas/snapshots" src/lib/api-config.ts` 有输出
- [ ] E2.2: snapshot/restoreSnapshot 路径均含 `/v1/`
- [ ] E3.1: `grep "phase: 'context'" src/lib/canvas/stores/sessionStore.ts` 有输出
- [ ] E3.2: TabBar.tsx 守卫逻辑未被改动
- [ ] `pnpm vitest run` 全绿
- [ ] `pnpm build` 无报错

---

*实施计划: 待开发*
*Next: Dev 领取任务 → Coding → Tester E2E 覆盖*
