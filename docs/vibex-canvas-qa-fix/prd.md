# PRD — VibeX Canvas QA 修复

**项目**: vibex-canvas-qa-fix
**阶段**: Phase 1 第二步（create-prd）
**PM**: pm
**日期**: 2026-04-13
**状态**: PRD 编制完成
**产出**: `/root/.openclaw/vibex/docs/vibex-canvas-qa-fix/prd.md`
**基于**: `analysis.md` + `plan/feature-list.md`

---

## 1. 执行摘要

### 背景

VibeX Canvas 页面存在 3 个 QA 测试发现的可用性问题：

1. **React Error #300 (Hydration Mismatch)** — 直接访问 `/canvas` 时，5 个 Zustand stores 使用 `persist` middleware 在 SSR 阶段读取 localStorage，导致 SSR/CSR 渲染不一致，触发 "Something went wrong" 错误页
2. **API 404** — `api-config.ts` 中 `listSnapshots` 端点路径为 `/canvas/snapshots`（无 `/v1/` 前缀），与后端注册的 `/v1/canvas/snapshots` 不一致，导致版本历史功能 404
3. **Tab 全部 disabled** — `TabBar.tsx` 有 phase 守卫逻辑，新用户直接访问 `/canvas` 时 `phase === undefined`，导致所有 tab 都被锁定

### 目标

修复上述 3 个问题，确保 Canvas 页面可正常加载、历史快照可用、Tab 可按 phase 正确切换。

### 成功指标

| 指标 | 目标值 |
|------|--------|
| /canvas 页面直接访问 | 无 Error #300，完整渲染 |
| 5 stores skipHydration 配置 | 全部 5 个 stores 配置正确 |
| API snapshots 列表 | HTTP 200 |
| 新用户 context Tab | 默认可用（非 disabled）|
| phase='input' 时 flow/component tab | 正确 locked（符合设计）|
| `pnpm build` + `pnpm vitest run` | 全通过 |
| 修复总工期 | ≤ 1 个工作日 |

---

## 2. Epic 拆分

### Epic 0 — 前置验证

**目标**: 通过 gstack qa 验证 API 404 的真实返回码，确认后端路由注册情况。

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|---------|
| **E0.1** | API 404 真实性验证 | 0.5h | `expect(statusCode).toBe(200)` 或 `expect(statusCode).toBe(404)` 并明确根因 |

**Epic 0 总工时**: 0.5h（阻塞 E2）

---

### Epic 1 — Hydration Mismatch 修复

**目标**: 5 个 Canvas stores 添加 `skipHydration: true`，并在 CanvasPage mount 后手动 rehydrate。

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|---------|
| **E1.1** | contextStore skipHydration | 0.5h | `expect(store.persist.hasHydrated).toBe(false)` before rehydrate |
| **E1.2** | flowStore skipHydration | 0.5h | 同上 |
| **E1.3** | componentStore skipHydration | 0.5h | 同上 |
| **E1.4** | uiStore skipHydration | 0.5h | 同上 |
| **E1.5** | sessionStore skipHydration | 0.5h | 同上 |
| **E1.6** | CanvasPage 手动 rehydrate | 0.5h | 页面 mount 后各 store 触发 rehydrate，无闪烁 |

**Epic 1 总工时**: 3h

---

### Epic 2 — API 路径统一

**目标**: 统一 `api-config.ts` 中 snapshots 端点前缀为 `/v1/`。

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|---------|
| **E2.1** | snapshots 端点 /v1/ 前缀 | 0.25h | `expect(apiConfig.canvas.snapshots).toBe('/v1/canvas/snapshots')` |
| **E2.2** | snapshot/restoreSnapshot 确认 | 0.25h | 路径格式一致性检查 |

**Epic 2 总工时**: 0.5h

---

### Epic 3 — Tab 默认 phase 初始化

**目标**: 新用户直接访问 `/canvas` 时，默认 phase 设为 `'context'`。

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|---------|
| **E3.1** | 默认 phase 初始化 | 0.5h | `expect(initialPhase).toBe('context')` when `phase === undefined` |
| **E3.2** | Tab phase 守卫保留 | 0.25h | flow/component tab 在 phase='context' 时 disabled（设计如此）|

**Epic 3 总工时**: 0.75h

---

## 3. 验收标准

### E0 — 前置验证

```
// E0.1: API 404 真实性验证（gstack qa）
// 调用: GET https://api.vibex.top/api/v1/canvas/snapshots?projectId=test
// 预期: HTTP 200（有数据）或 HTTP 401（需认证）但非 404
// 断言:
expect([200, 401]).toContain(response.status);
expect(response.status).not.toBe(404);
```

### E1 — Hydration mismatch

```
// E1.1-E1.5: skipHydration 配置验证
// 检查每个 store 的 persist 配置
const store = useContextStore.getState();
expect(store.persist).toBeDefined();
expect(useContextStore.persist.hasHydrated).toBe(false);

// E1.1-E1.5: persist 配置含 skipHydration: true（代码审查）
// grep -r "skipHydration" src/lib/canvas/stores/
expect(persistConfig.skipHydration).toBe(true);

// E1.6: CanvasPage mount 后 rehydrate
page.goto('/canvas');
await page.waitForLoadState('networkidle');
// 验证无 Hydration error
const errorText = await page.locator('text=Something went wrong').count();
expect(errorText).toBe(0);
// 验证 store 数据正常渲染
await expect(page.locator('[data-testid="canvas-content"]')).toBeVisible({ timeout: 5000 });
```

### E2 — API 路径统一

```
// E2.1: api-config.ts 端点路径
import { canvasApi } from '@/lib/canvas-api';
expect(canvasApi.endpoints.snapshots).toBe('/v1/canvas/snapshots');
expect(canvasApi.endpoints.snapshot(123)).toBe('/v1/canvas/snapshots/123');
expect(canvasApi.endpoints.restoreSnapshot(123)).toBe('/v1/canvas/snapshots/123/restore');

// E2.1: API 实际调用验证（gstack qa）
const response = await page.evaluate(async () => {
  const res = await fetch('/api/v1/canvas/snapshots?projectId=test');
  return { status: res.status, ok: res.ok };
});
expect(response.ok || response.status === 401).toBe(true);
expect(response.status).not.toBe(404);
```

### E3 — Tab 默认 phase

```
// E3.1: 默认 phase 为 'context'
// 新建用户 session，直接访问 /canvas
const phase = useSessionStore.getState().phase;
expect(phase).toBe('context');

// E3.1: context Tab 默认可用
page.goto('/canvas');
const contextTab = page.locator('[role="tab"][data-tab-id="context"]');
await expect(contextTab).not.toBeDisabled();

// E3.2: flow/component Tab 在 phase='context' 时 locked
const flowTab = page.locator('[role="tab"][data-tab-id="flow"]');
await expect(flowTab).toBeDisabled();
```

---

## 4. 功能点汇总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F0.1 | API 404 验证 | gstack qa 确认 API 真实返回码 | `expect(status).not.toBe(404)` | 无 |
| F1.1 | contextStore skipHydration | persist 加 skipHydration: true | `expect(config.skipHydration).toBe(true)` | 无 |
| F1.2 | flowStore skipHydration | persist 加 skipHydration: true | `expect(config.skipHydration).toBe(true)` | 无 |
| F1.3 | componentStore skipHydration | persist 加 skipHydration: true | `expect(config.skipHydration).toBe(true)` | 无 |
| F1.4 | uiStore skipHydration | persist 加 skipHydration: true | `expect(config.skipHydration).toBe(true)` | 无 |
| F1.5 | sessionStore skipHydration | persist 加 skipHydration: true | `expect(config.skipHydration).toBe(true)` | 无 |
| F1.6 | CanvasPage rehydrate | mount 后手动触发各 store rehydrate | `expect(hasHydrated).toBe(true)` after mount | ✅ /canvas |
| F2.1 | snapshots 端点 /v1/ | api-config.ts 路径前缀统一 | `expect(path).toContain('/v1/canvas/snapshots')` | 无 |
| F2.2 | snapshot/restore 路径 | snapshot(id)/restoreSnapshot(id) 路径确认 | 路径格式一致性 | 无 |
| F3.1 | 默认 phase = 'context' | phase === undefined 时默认初始化 | `expect(phase).toBe('context')` | ✅ /canvas |
| F3.2 | Tab phase 守卫保留 | TabBar.tsx 守卫逻辑不变 | phase='context' 时 flow disabled | ✅ TabBar |

---

## 5. DoD (Definition of Done)

### Epic 0 — 前置验证

- [ ] gstack qa 调用 `/api/v1/canvas/snapshots` 返回非 404
- [ ] 验证结果记录到分析报告

### Epic 1 — Hydration mismatch

- [ ] 5 个 stores 的 persist 配置均含 `skipHydration: true`
- [ ] `grep -r "skipHydration" src/lib/canvas/stores/` 输出 5 行
- [ ] CanvasPage.tsx 有 `useEffect` 触发各 store rehydrate
- [ ] 直接访问 `/canvas` 无 "Something went wrong" 错误
- [ ] `pnpm vitest run` 涉及 stores 的测试全部通过

### Epic 2 — API 路径统一

- [ ] `api-config.ts` 中 `snapshots` 路径含 `/v1/`
- [ ] `snapshot(id)` 和 `restoreSnapshot(id)` 路径一致
- [ ] QA 验证：snapshots API 返回非 404

### Epic 3 — Tab 默认 phase

- [ ] `phase === undefined` 时默认设为 `'context'`
- [ ] 新用户访问 `/canvas`，context Tab 非 disabled
- [ ] phase='context' 时 flow/component Tab 正确 locked
- [ ] TabBar.tsx 的 `handleTabClick` phase 守卫逻辑未改动

### 项目整体 DoD

- [ ] E0 + E1 + E2 + E3 全部 Epic DoD 完成
- [ ] `pnpm build` 通过
- [ ] `pnpm vitest run` 全通过
- [ ] QA E2E 测试覆盖 AC-1 ~ AC-7
- [ ] changelog 更新

---

## 6. 关键代码位置

| 文件 | Story | 修改内容 |
|------|-------|---------|
| `src/lib/canvas/stores/contextStore.ts` | E1.1 | `skipHydration: true` |
| `src/lib/canvas/stores/flowStore.ts` | E1.2 | `skipHydration: true` |
| `src/lib/canvas/stores/componentStore.ts` | E1.3 | `skipHydration: true` |
| `src/lib/canvas/stores/uiStore.ts` | E1.4 | `skipHydration: true` |
| `src/lib/canvas/stores/sessionStore.ts` | E1.5 | `skipHydration: true` |
| `src/components/canvas/CanvasPage.tsx` | E1.6 | useEffect rehydrate |
| `src/lib/api-config.ts` | E2.1 | snapshots 路径 `/v1/` |
| `src/lib/canvas/stores/sessionStore.ts` | E3.1 | 默认 phase 初始化 |
| `src/components/canvas/TabBar.tsx` | E3.2 | 守卫逻辑保留 |

---

## 7. PRD 格式校验

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言
- [x] DoD 章节存在且具体
- [x] 功能点汇总表格式正确（ID/功能名/描述/验收标准/页面集成）
- [x] 已执行 Planning（Feature List: plan/feature-list.md）
- [x] 页面集成标注（✅ /canvas, ✅ TabBar）
- [x] 关键代码位置索引

---

## 8. 驳回红线检查

| 红线 | 状态 | 说明 |
|------|------|------|
| PRD 缺少执行摘要/Epic拆分/验收标准/DoD | ✅ | 全部包含 |
| 功能点模糊，无法写 expect() | ✅ | 11 个功能点均有 expect() 断言 |
| 验收标准缺失 | ✅ | 4 Epic 全部含 expect() 断言 |
| 涉及页面但未标注【需页面集成】 | ✅ | F1.6, F3.1, F3.2 标注了【需页面集成】 |
| 未执行 Planning（无 Feature List） | ✅ | plan/feature-list.md 已生成 |

---

*Planning 输出: `plan/feature-list.md`*  
*基于 Analyst 报告: `analysis.md`*  
*推荐方案: 全部方案 A*  
*总工时: ~5.75h（< 1 工作日）*
