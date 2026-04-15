# VibeX Canvas Bug 修复 — 实施计划

**Project**: vibex-fix-canvas-bugs
**Date**: 2026-04-15
**Architect**: architect
**Total Estimated Hours**: 3h (B1: 2h, B2: 1h)

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| B1: DDS API 404 修复 | B1-U1 ✅ | B1-U2 ✅ | B1-U1 ✅ | B1-U1 ✅ |
| B2: Canvas Tab State 残留 | B2-U1 | ⬜ | B2-U1 |

---

## B1: DDS API 404 修复

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| B1-U1 | Cloudflare Pages 路由验证（文件已存在，降级方案已实现） | ✅ | — | `_redirects` 文件存在（正确），Cloudflare Pages Next.js SSR 模式下重写不稳定，B1-U2 已实现 |
| B1-U2 | API Route 代理实现（降级方案） | ✅ | — | `src/app/api/v1/dds/[...path]/route.ts` GET/POST/PUT/DELETE + `route.test.ts` 8 passing + `e2e/dds-canvas-load.spec.ts` |

### B1-U1 详细说明

**目标**：验证 Cloudflare Pages 路由配置是否正确

**实现步骤**：
1. 读取 `vibex-fronted/public/_redirects` 确认 `/api/*` 代理配置存在
2. 使用 curl/网络请求直接测试 `https://api.vibex.top/api/v1/dds/chapters?projectId=test`
   - 200 → 路由正确，问题在 Pages → Workers 代理层
   - 404 → Workers 路由缺失或域名绑定问题
3. 如 404，coord 联系 DevOps 在 Cloudflare Pages Dashboard 确认路由规则

**验证方式**：
```bash
curl -s "https://api.vibex.top/api/v1/dds/chapters?projectId=test" | jq .
# 期望: { "success": true, "data": [...] } 或 { "success": false, ... } (非 404)
```

**文件变更**：无代码变更（仅配置确认）

**风险**：中 — 需要 Cloudflare 账号访问权限

---

### B1-U2 详细说明（降级方案）

**目标**：若 B1-U1 验证路由问题无法通过配置解决，则在 Next.js 层实现 API 代理

**触发条件**：B1-U1 发现 Cloudflare Pages 无法正确 proxy `/api/*` 到 `api.vibex.top`

**实现步骤**：
1. 创建 `vibex-fronted/src/app/api/v1/dds/[...path]/route.ts`
2. 在 route handler 中 Server-side fetch 到 `https://api.vibex.top/api/v1/dds/[splat]`
3. 支持 GET/POST/PUT/DELETE 方法透传
4. 测试：`pnpm test` (route.test.ts 8 passing) + E2E (`e2e/dds-canvas-load.spec.ts`)

**文件变更**：
- Create: `vibex-fronted/src/app/api/v1/dds/[...path]/route.ts`
- Create: `vibex-fronted/src/app/api/v1/dds/[...path]/route.test.ts` (8 passing)
- Create: `vibex-fronted/e2e/dds-canvas-load.spec.ts` (TC-B1-E2E-01~03)
- useDDSAPI.ts: `createDDSAPI(baseUrl='')` → 相对路径 `/api/v1/dds` (无需修改，已正确)

**测试用例**：
- Unit: `route.test.ts` — 8 passing (URL构造/GET/POST/DELETE/502错误处理)
- E2E: `dds-canvas-load.spec.ts` — TC-B1-E2E-01~03 (DDS Canvas加载/API代理端点)

**风险**：低 — 不影响现有 API 调用逻辑，降级方案隔离

---

## B2: Canvas Tab State 残留修复

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| B2-U1 | Tab 切换状态重置 | ✅ | — | useCanvasPanels.ts: queuePanelExpanded默认false + resetPanelState() + CanvasPage.tsx: useEffect([activeTab]) |

### B2-U1 详细说明

**目标**：修复 Tab 切换时 phase 和 accordion 状态残留

**文件变更**：
- Modify: `vibex-fronted/src/hooks/canvas/useCanvasPanels.ts`
- Modify: `vibex-fronted/src/components/canvas/CanvasPage.tsx`

**实现步骤**：

#### Step 1: 修改 useCanvasPanels.ts — Bug2 Root Cause #1
```typescript
// 修改: queuePanelExpanded 默认值 false（原为 true）
const [queuePanelExpanded, setQueuePanelExpanded] = useState(false);

// 新增: resetPanelState 函数（供 CanvasPage 调用）
const resetPanelState = useCallback(() => {
  setQueuePanelExpanded(false);
}, []);

// 修改: setActiveTab 改名为 setActiveTabWithReset
const setActiveTabWithReset = useCallback((tab: TreeType) => {
  setActiveTab(tab);
  setQueuePanelExpanded(false); // Bug2 Root Cause #2
}, []);

return {
  // ... existing
  queuePanelExpanded,
  setQueuePanelExpanded,
  resetPanelState,
  setActiveTab: setActiveTabWithReset,  // 替换
};
```

#### Step 2: 修改 CanvasPage.tsx — Bug2 Root Cause #2

**移动端 TabBar onClick**（CanvasPage.tsx 666-668行）：
- 已正确调用 `setPhase()` + `setActiveTree()`，但缺少 `setQueuePanelExpanded(false)`
```typescript
<button
  onClick={() => {
    if (t === 'context') { setPhase('context'); setActiveTree('context'); }
    else if (t === 'flow') { setPhase('flow'); setActiveTree('flow'); }
    else { setPhase('component'); setActiveTree('component'); }
    setQueuePanelExpanded(false);  // 新增
  }}
>
```

**Prototype tab 按钮 onClick**（CanvasPage.tsx 681行）：
- 同样缺少 `setQueuePanelExpanded(false)`
```typescript
onClick={() => { setPhase('prototype'); setActiveTree('component'); setQueuePanelExpanded(false); }}
```

#### Step 3: 修改 CanvasPage.tsx — Bug2 Root Cause #3（桌面模式）

**桌面 PhaseIndicator onPhaseChange**（CanvasPage.tsx 527行）：
- PhaseIndicator 调用 `setPhase` 切换 phase，需同步 reset `queuePanelExpanded`
```typescript
// 在 CanvasPage 中包装 setPhase
const handlePhaseChange = useCallback((phase: Phase) => {
  setPhase(phase);
  if (phase !== 'prototype') {
    setQueuePanelExpanded(false); // 离开 prototype 时关闭
  }
}, [setPhase, setQueuePanelExpanded]);

// PhaseIndicator 使用包装后的 handler
<PhaseIndicator phase={phase} onPhaseChange={handlePhaseChange} />
```

**测试用例**（正确 selector）：
```typescript
// e2e/canvas-tab-state.spec.ts
test('Bug2: Switching from Prototype tab closes accordion', async ({ page }) => {
  await page.goto('/canvas?projectId=test');
  await page.waitForSelector('[role="tablist"]');
  // 切换到 Prototype tab
  await page.click('button[role="tab"]:has-text("原型")');
  // 切换到其他 tab
  await page.click('button[role="tab"]:has-text("上下文")');
  // PrototypeQueuePanel toggle button: aria-controls="queue-panel-content"
  const toggleBtn = page.locator('button[aria-controls="queue-panel-content"]');
  await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
});

test('Bug2: queuePanelExpanded defaults to false', async ({ page }) => {
  await page.goto('/canvas?projectId=test');
  await page.waitForSelector('[role="tablist"]');
  // 初始状态下 accordion 应为收起
  const toggleBtn = page.locator('button[aria-controls="queue-panel-content"]');
  await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
});
```

**验收标准**：
- AC1: 切换到 Prototype tab，再切换到其他 tab，accordion 关闭（`aria-expanded="false"`）
- AC2: `queuePanelExpanded` 初始值为 `false`
- AC3: 桌面 PhaseIndicator 切换 phase 离开 prototype 时 accordion 关闭
- AC4: 控制台无 Error 级别日志

**风险**：无 — 仅修改本地 state 和 event handler

---

## E2E 测试覆盖

| Spec 文件 | 测试内容 | 对应 Bug |
|-----------|---------|----------|
| `vibex-fronted/e2e/dds-canvas-load.spec.ts` | Bug1: 页面加载、API 200、无 console error | B1 |
| `vibex-fronted/e2e/canvas-tab-state.spec.ts` | Bug2: Tab 切换、accordion 状态 | B2 |

---

## 执行顺序

1. **B1-U1** → 验证路由配置（30min）
2. **B1-U2** → 如需降级方案，创建 Next.js API 代理（1.5h）
3. **B2-U1** → Tab state 修复（1h）
4. **E2E 测试** → 全部通过（并行）
