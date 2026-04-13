# 可行性分析: VibeX Canvas QA 修复

**项目**: vibex-canvas-qa-fix / analyze-requirements
**Analyst**: Analyst
**日期**: 2026-04-13
**状态**: ✅ 分析完成

---

## 一、Research — 历史相关经验

### 1.1 docs/learnings/ 相关条目

| 历史项目 | 相关性 | 教训 |
|---------|--------|------|
| `react-hydration-fix` | 直接：SSR/CSR 水合不匹配问题 | Hydration 问题根因是 Zustand `persist` middleware 在 SSR 渲染时读取 localStorage，与 CSR 渲染结果不一致 |
| `canvas-testing-strategy` | 间接：Canvas hooks 单元测试策略 | Hook 测试的 mock store 过于简化，无法反映 Zustand persist 行为 |
| `canvas-api-completion` | 间接：Canvas API 路由历史 | API 端点命名不一致是历史遗留问题，需仔细核对实际注册路由 |

### 1.2 Git History — Canvas 相关轨迹

```
d7ce4752 feat(canvas): E1 - TabBar prototype tab + E2 - PhaseIndicator prototype 选项
b15f4858 docs: update frontend changelog for vibex-canvas-context-nav Epic1+2
4dac0fb8 docs: add learnings for vibex-canvas-context-nav
3e2d155d docs: mark Epic3 testing complete in IMPLEMENTATION_PLAN
0866f091 docs: add learnings for vibex-auth-401-handling
```

**关键发现**:
- `TabBar.tsx` 已有 phase-based 锁 tab 逻辑（`isLocked = tabIdx > phaseIdx`），历史迭代中已完善
- 5 个 Canvas stores 全部使用 `persist` middleware，这是 hydration mismatch 的核心根因

### 1.3 根因分析

#### 问题 1：Hydration Mismatch
**根因确认**: 5 个 Canvas stores（`contextStore`, `flowStore`, `componentStore`, `uiStore`, `sessionStore`）全部使用 Zustand `persist` middleware，在 Next.js SSR 阶段会尝试读取 localStorage：
- SSR 渲染：使用 default state（空数组/空值）
- CSR 渲染：Zustand `persist` 读取 localStorage，恢复已持久化状态
- 结果不一致 → React Error #300

**已有修复模式**: Zustand `skipHydration: true` + `useEffect` 手动 rehydrate。

#### 问题 2：API 404
**根因确认**: `api-config.ts` 中 `listSnapshots` 端点路径不一致：
- `listSnapshots` → `/canvas/snapshots`（无 `/v1/` 前缀）
- `snapshot(id)` → `/v1/canvas/snapshots/{id}`（有 `/v1/` 前缀）
- `restoreSnapshot(id)` → `/v1/canvas/snapshots/{id}/restore`（有 `/v1/` 前缀）
- QA 报告的 `/api/canvas/snapshots` = `baseURL + /canvas/snapshots`，**路径本身正确**，但后端路由可能只注册了 `/v1/canvas/snapshots`

#### 问题 3：Tab 全部 disabled
**根因确认**: `TabBar.tsx` 的 `handleTabClick` 有 phase 守卫逻辑：
```typescript
const tabIdx = PHASE_ORDER.indexOf(tab.id as Phase);
if (tabIdx > phaseIdx) { return; } // Tab locked by phase
```
若用户处于 `phase = 'input'`，则所有 tab（context/flow/component）均被锁定。缺少**当前项目的默认 phase 初始化**逻辑，导致新用户直接访问 /canvas 时所有 tab 不可用。

---

## 二、需求理解

**业务目标**: 修复 Canvas 页面 3 个关键可用性问题，确保页面可正常加载、历史快照可用、Tab 可切换。

**目标用户**: 访问 VibeX Canvas 页面的所有用户（尤其是新用户和直接访问 /canvas 的用户）。

---

## 三、JTBD（Jobs To Be Done）

| ID | JTBD | 用户故事 |
|----|------|---------|
| JTBD-1 | **页面可正常加载** | "我直接访问 /canvas 页面时，不应该看到 'Something went wrong' 错误页，而是能正常使用画布功能" |
| JTBD-2 | **查看历史快照** | "我点击'历史'按钮时，应该能看到之前保存的快照列表，而不是 404 错误" |
| JTBD-3 | **Tab 可切换** | "我切换到上下文/流程/组件 Tab 时，应该能切换，而不是所有 Tab 都是灰色不可点击" |

---

## 四、技术方案分析（每个问题至少 2 个方案）

### 问题 1: React Error #300 — Hydration Mismatch

#### 方案 A：Zustand skipHydration 模式（推荐）

**核心思路**: 所有 Canvas stores 的 `persist` 配置添加 `skipHydration: true`，在组件 mount 后手动 rehydrate。

```typescript
// uiStore.ts 改造
export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({ /* ... */ }),
      {
        name: 'vibex-canvas-ui',
        skipHydration: true, // ← 新增
      }
    )
  )
);

// CanvasPage.tsx 中手动 rehydrate
useEffect(() => {
  useUIStore.persist.rehydrate();
}, []);
```

**Pros**: 彻底解决 hydration mismatch，符合 Zustand 官方 Next.js SSR 方案
**Cons**: 需要在所有 5 个 store 中改persist配置，工作量中等
**工期**: 0.5 day
**复杂度**: P1

#### 方案 B：客户端动态导入

**核心思路**: 将依赖 localStorage 的组件用 `dynamic(() => import(...), { ssr: false })` 导入。

```typescript
// canvas/page.tsx
import dynamic from 'next/dynamic';
const CanvasPage = dynamic(() => import('@/components/canvas/CanvasPage'), { ssr: false });
```

**Pros**: 改动最小
**Cons**: 整个 Canvas 页变成纯 CSR，SEO 影响；治标不治本（localStorage 同步问题仍存在）
**工期**: 0.25 day
**复杂度**: P1

---

### 问题 2: 版本历史 API 404

#### 方案 A：统一 API 路径前缀（推荐）

**核心思路**: 将 `api-config.ts` 中 `listSnapshots` 端点改为 `/v1/canvas/snapshots`，与后端注册路由保持一致。

```typescript
// api-config.ts 改造
canvas: {
  // ...
  snapshots: '/v1/canvas/snapshots',     // ← 改为 /v1/
  snapshot: (id: string) => `/v1/canvas/snapshots/${id}`,
  restoreSnapshot: (id: string) => `/v1/canvas/snapshots/${id}/restore',
  latest: '/v1/canvas/snapshots/latest',
},
```

**Pros**: 彻底修复路径不一致，后端路由与前端路径统一
**Cons**: 需要确认后端确实注册了 `/v1/canvas/snapshots` 路由
**工期**: 0.25 day
**复杂度**: P1

#### 方案 B：前端添加 API 前缀兼容层

**核心思路**: 在 `canvasApi.ts` 中添加自动前缀逻辑，将 `/canvas/` 路径统一加上 `/v1/` 前缀。

```typescript
// canvasApi.ts
const getSnapshotUrl = (path: string) => {
  if (path.startsWith('/canvas/')) {
    return `/v1${path}`;
  }
  return path;
};
```

**Pros**: 兼容性好，不需要改 api-config.ts
**Cons**: hack 方式，不解决根因（路径不一致）
**工期**: 0.25 day
**复杂度**: P1

---

### 问题 3: Tab 全部 disabled

#### 方案 A：默认 phase 初始化（推荐）

**核心思路**: 在 `sessionStore` 或 `contextStore` 的初始化逻辑中，当 `phase === undefined` 时，默认设置为 `'context'`（允许访问 context tab）。

```typescript
// sessionStore.ts 或 contextStore.ts 的初始化逻辑中
const phase: Phase = 'context', // 默认 phase，确保至少 context tab 可用

// 或者在 CanvasPage.tsx 中
useEffect(() => {
  if (!phase || phase === 'input') {
    setPhase('context');
  }
}, [phase, setPhase]);
```

**Pros**: 新用户直接访问 /canvas 时，context tab 默认可用，体验流畅
**Cons**: 需要确认设置为 'context' phase 不会影响现有业务流程

**工期**: 0.25 day
**复杂度**: P1

#### 方案 B：Tab 锁阶段增加解锁提示

**核心思路**: 当 tab 被 phase 锁定时，显示明确提示（"请先完成输入阶段"），而非静默禁用。

```typescript
// TabBar.tsx
title={isLocked ? `需先完成「${PHASE_ORDER[phaseIdx - 1]}」阶段` : `切换到 ${tab.label} 树`}
```

**Pros**: 用户体验更好，知道为什么被锁
**Cons**: 不解决"直接访问 /canvas 时无任何可用 tab"的问题

**工期**: 0.25 day
**Complexity**: P1

---

### 综合方案对比

| 问题 | 推荐方案 | 备选方案 | 工期合计 |
|------|---------|---------|---------|
| Hydration mismatch | A: skipHydration | B: dynamic import | 0.5 day |
| API 404 | A: 统一 /v1/ 前缀 | B: 兼容层 | 0.25 day |
| Tab disabled | A: 默认 phase 初始化 | B: 解锁提示 | 0.25 day |
| **总工期** | | | **1 day** |

---

## 五、风险评估（Risk Matrix）

| 风险 | 可能性 | 影响 | 缓解方案 |
|------|--------|------|----------|
| R1: skipHydration 导致首次渲染闪烁（FOUC） | 低 | 低 | persist rehydrate 在 useEffect 中执行，用户感知不到 |
| R2: 后端 `/v1/canvas/snapshots` 路由不存在（API 404 的真正原因） | 中 | 高 | **先通过 gstack qa 验证**实际返回码，确认后再改前端路径 |
| R3: 默认 phase 设置为 'context' 影响已有项目状态 | 低 | 中 | 只在 `phase === undefined` 时设置，不改变已有 phase 的项目 |
| R4: dynamic import (ssr: false) 影响 SEO | 低 | 低 | Canvas 页面本就是工具型页面，SEO 需求低；方案 A 避免了这个问题 |
| R5: 5 个 stores 全部改 skipHydration 漏改某个 | 低 | 中 | 逐个 store 验证：检查 persist 配置是否包含 `skipHydration: true` |

---

## 六、依赖分析（Dependency Analysis）

```
前端:
  ├─ 5 个 Canvas stores (contextStore/flowStore/componentStore/uiStore/sessionStore)  ← 全部需改 skipHydration
  ├─ canvas/page.tsx  ← 如选方案 B dynamic import
  ├─ api-config.ts    ← API 路径统一
  └─ CanvasPage.tsx  ← 默认 phase 初始化

后端:
  └─ 确认 /v1/canvas/snapshots 路由是否注册（阻塞项）

gstack:
  └─ qa 验证 API 404 真实返回码（执行前必须验证）
```

---

## 七、验收标准（Acceptance Criteria）

| ID | 场景 | 验收条件 | 测试方法 |
|----|------|---------|---------|
| AC-1 | Hydration 修复 | 直接访问 /canvas 页面，不出现 "Something went wrong" 错误 | Playwright: `page.goto('/canvas')`，assert 无 error boundary |
| AC-2 | skipHydration 配置 | 5 个 Canvas stores 全部有 `skipHydration: true` | 代码审查: `grep -r "skipHydration" src/lib/canvas/stores/` |
| AC-3 | API 404 修复 | 点击'历史'按钮，snapshots 列表 API 返回 200（非 404） | gstack qa: `curl -s -o /dev/null -w "%{http_code}" https://api.vibex.top/api/v1/canvas/snapshots?projectId=test` |
| AC-4 | API 路径一致性 | `listSnapshots`, `snapshot(id)`, `restoreSnapshot(id)` 全部使用 `/v1/canvas/snapshots` 前缀 | 代码审查: `api-config.ts` endpoints 检查 |
| AC-5 | Tab 可用性 | 新用户直接访问 /canvas，context Tab 默认可用（非 disabled） | Playwright: `page.goto('/canvas')`，assert `tab[aria-label="上下文"]` 非 disabled |
| AC-6 | Tab phase 守卫 | flow/component tab 在 phase 不足时仍然 disabled（非 BUG，是设计） | Playwright: 在 input phase，assert flow tab disabled |
| AC-7 | 回归 | 修改后 `pnpm build` + `pnpm vitest run` 全部通过 | CI: build + test 全量验证 |

---

## 八、驳回红线检查

| 红线 | 状态 | 说明 |
|------|------|------|
| 需求模糊无法实现 | ✅ 通过 | 3 个问题均已定位根因，有明确修复路径 |
| 缺少验收标准 | ✅ 通过 | 7 条 AC 覆盖所有问题修复验证 |
| 未执行 Research | ✅ 通过 | 已搜索 learnings + git history + 代码根因分析 |
| API 404 根因待验证 | ⚠️ 待 gstack qa | 需要实际调用 API 验证后端路由是否注册 |

---

## 九、执行决策

- **决策**: 已采纳
- **执行项目**: vibex-canvas-qa-fix
- **执行日期**: 2026-04-13（今日）
- **推荐方案**: 全部选方案 A（推荐方案）
- **Epic 划分**:
  - E1: Hydration mismatch 修复（5 stores skipHydration）
  - E2: API 路径统一（api-config.ts 改 /v1/ 前缀）
  - E3: Tab 默认 phase 初始化（CanvasPage.tsx）
  - **前置**: gstack qa 验证 API 404 真实返回码

---

## 十、附：关键代码位置索引

| 文件 | 行 | 用途 |
|------|----|------|
| `src/lib/canvas/stores/contextStore.ts` | 91 | `persist()` — 需要加 `skipHydration` |
| `src/lib/canvas/stores/flowStore.ts` | 69 | `persist()` — 需要加 `skipHydration` |
| `src/lib/canvas/stores/componentStore.ts` | 57 | `persist()` — 需要加 `skipHydration` |
| `src/lib/canvas/stores/uiStore.ts` | 68 | `persist()` — 需要加 `skipHydration` |
| `src/lib/canvas/stores/sessionStore.ts` | 68 | `persist()` — 需要加 `skipHydration` |
| `src/lib/api-config.ts` | 31 | `snapshots: '/canvas/snapshots'` — 缺少 `/v1/` 前缀 |
| `src/components/canvas/TabBar.tsx` | 44-47 | phase 守卫逻辑 — isLocked 计算 |
| `src/components/canvas/CanvasPage.tsx` | - | 默认 phase 初始化插入点 |
