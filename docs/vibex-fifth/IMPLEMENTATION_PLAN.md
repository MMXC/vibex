# VibeX Sprint 3 (vibex-fifth) — Implementation Plan

**Project**: vibex-fifth
**Date**: 2026-04-09
**Agent**: architect
**Status**: Draft

---

## Phase Overview

| Phase | Epic | Stories | Estimated Hours | Parallelizable |
|-------|------|---------|----------------|----------------|
| Phase A-1 | E1: Category B 验收 | E1.1, E1.2, E1.3 | 4h | Yes |
| Phase A-2 | E2: Category A 集成 | E2.1, E2.2 | 4h | No (after E1) |
| Phase A-3 | E3: Category C P0 Bug | E3.1, E3.2 | 6h | No (after E2) |
| Phase A-4 | E4: Category D 收尾 | E4.1, E4.2 | 2h | No (after E3) |
| **Total** | — | 9 Stories | **~16h** | — |

**Sprint Duration**: ~2 Sprint (5 days)

---

## Phase A-1: Epic E1 — 已导入功能验收

### Story E1.1: VersionHistoryPanel E2E 测试覆盖

**Status**: ✅ Done
**Status**: ✅ Done
**Status**: ✅ Done
**Dev**: dev
**Estimated**: 2h
**Dependency**: None
**Verification Command**: `pnpm test:e2e tests/e2e/version-history-panel.spec.ts`

**Implementation**:
1. curl 验证 `GET /api/v1/canvas/versions` 端点 → 确认返回 200
2. 创建 `e2e/version-history.spec.ts`
3. 实现 E2E 断言:
   - `expect(page.getByText(/历史版本/i)).toBeVisible()`
   - `expect(page.getByRole('button', { name: /版本历史/i })).toBeEnabled()`
   - `await fetch('/api/v1/canvas/versions').then(r => expect(r.status).toBe(200))`
4. 标记 `@ci-blocking`
5. `pnpm test:e2e` 验证通过

**Files**:
- Create: `vibex-fronted/e2e/version-history.spec.ts`
- Modify: None
- Verify: `vibex-fronted/src/components/canvas/features/VersionHistoryPanel.tsx`

**Test Scenarios**:
- Happy path: 打开面板 → 历史版本列表可见
- Happy path: API curl 返回 200
- Edge: 无版本历史时面板显示空状态
- Error: API 返回 401 时显示未授权提示

---

### Story E1.2: SearchDialog E2E 测试覆盖

**Dev**: dev
**Estimated**: 1h
**Dependency**: None (useCanvasEvents Ctrl+K 已存在)
**Verification Command**: `pnpm test:e2e --grep "search-dialog"`

**Implementation**:
1. 创建 `e2e/search-dialog.spec.ts`
2. 实现 E2E 断言:
   - `await page.keyboard.press('Control+k')`
   - `expect(page.getByRole('searchbox')).toBeVisible()`
   - `expect(page.getByRole('dialog')).toHaveAttribute('aria-hidden', 'false')`
3. 标记 `@ci-blocking`
4. `pnpm test:e2e` 验证通过

**Files**:
- Create: `vibex-fronted/e2e/search-dialog.spec.ts`
- Modify: None
- Verify: `vibex-fronted/src/components/canvas/features/SearchDialog.tsx`

**Test Scenarios**:
- Happy path: Ctrl+K 打开搜索对话框
- Happy path: 输入关键词显示搜索结果
- Edge: 空搜索显示最近项
- Error: 搜索无结果时显示空状态

---

### Story E1.3: SaveIndicator E2E 测试覆盖

**Dev**: dev
**Estimated**: 1h
**Dependency**: None (useAutoSave 已存在)
**Verification Command**: `pnpm test:e2e --grep "save-indicator"`

**Implementation**:
1. 创建 `e2e/save-indicator.spec.ts`
2. 触发 canvas mutation（拖拽/编辑节点）
3. 实现 E2E 断言:
   - `await triggerSave()` // 触发 mutation
   - `await expect(page.getByText(/已保存/i)).toBeVisible({ timeout: 10000 })`
4. 标记 `@ci-blocking`
5. `pnpm test:e2e` 验证通过

**Files**:
- Create: `vibex-fronted/e2e/save-indicator.spec.ts`
- Modify: None
- Verify: `vibex-fronted/src/components/canvas/features/SaveIndicator.tsx`

**Test Scenarios**:
- Happy path: mutation 后 10s 内显示"已保存"
- Edge: 快速连续 mutation 防抖
- Error: 保存失败时显示错误提示

---

## Phase A-2: Epic E2 — 孤立组件集成

### Story E2.1: TemplateSelector 集成 CanvasPage

**Dev**: dev
**Estimated**: 2h
**Dependency**: E1 (store 接口已验证)
**Verification Command**: `pnpm test:e2e --grep "template-selector"`

**Implementation**:
1. 阅读 `features/TemplateSelector.tsx` 源码，确认 props 接口
2. 在 CanvasPage 中导入 TemplateSelector
3. 确定渲染位置（建议：作为 LeftDrawer 或 TabBar 中的按钮触发）
4. 连接 store:
   - `setContextNodes` → contextStore
   - `setFlowNodes` → flowStore
   - `setComponentNodes` → componentStore
5. 创建 `e2e/template-selector.spec.ts`
6. 标记 `@ci-blocking`
7. `pnpm build` + `pnpm test:e2e` 验证

**Files**:
- Modify: `vibex-fronted/src/components/canvas/CanvasPage.tsx`
- Create: `vibex-fronted/e2e/template-selector.spec.ts`
- Verify: `vibex-fronted/src/components/canvas/features/TemplateSelector.tsx`

**Test Scenarios**:
- Happy path: 点击"选择模板"按钮 → 模板列表打开
- Happy path: 选择模板 → 三树数据填充，无 Error
- Edge: 模板列表加载中显示 skeleton
- Error: 模板加载失败显示错误状态

---

### Story E2.2: PhaseIndicator 集成 CanvasPage

**Dev**: dev
**Estimated**: 2h
**Dependency**: E1 (contextStore.phase 已存在)
**Verification Command**: `pnpm test:e2e --grep "phase-indicator"`

**Implementation**:
1. 阅读 `features/PhaseIndicator.tsx` 源码，确认 props 接口
2. 在 CanvasPage 中导入 PhaseIndicator
3. 确定渲染位置（建议：作为 ProjectBar 左侧的 Phase 切换）
4. 连接 props:
   - `phase` ← `useContextStore((s) => s.phase)`
   - `onPhaseChange` → `useContextStore((s) => s.setPhase)`
5. 创建 `e2e/phase-indicator.spec.ts`
6. 标记 `@ci-blocking`
7. `pnpm build` + `pnpm test:e2e` 验证

**Files**:
- Modify: `vibex-fronted/src/components/canvas/CanvasPage.tsx`
- Create: `vibex-fronted/e2e/phase-indicator.spec.ts`
- Verify: `vibex-fronted/src/components/canvas/features/PhaseIndicator.tsx`

**Test Scenarios**:
- Happy path: PhaseIndicator 显示当前 Phase（Context/Flow/Component）
- Happy path: 点击切换 Phase → 三树联动切换
- Edge: nodeCount 显示正确
- Error: Phase 异常时显示默认状态

---

## Phase A-3: Epic E3 — PRD P0 Bug 修复

### Story E3.1: Domain Model Mermaid 渲染修复

**Dev**: dev
**Estimated**: 3h
**Dependency**: E2 (组件树稳定后验证)
**Verification Command**: gstack browse screenshot

**Implementation**:
1. gstack browse 打开 `/canvas/domain-model`，截图定位根因
2. 隔离前端/后端责任:
   - 前端: mermaid.js CDN 加载、DOM 初始化
   - 后端: `/api/v1/domain-models` 解析结果
3. 前端修复方案（如果根因在前端）:
   - 检查 `@types/mermaid` 版本
   - 确保容器 DOM 已就绪后再 init mermaid
   - 考虑 dynamic import 延迟加载
4. 后端修复方案（如果根因在后端）:
   - 检查 `/api/v1/domain-models` 响应格式
   - 确保返回 mermaid-compatible DSL
5. gstack browse 截图验证: `expect(page.locator('svg.mermaid')).toBeVisible()`
6. 保存截图到 `docs/vibex-fifth/validation/`

**Files**:
- Modify: Domain Model 相关组件（待 gstack 定位后确认）
- Create: `vibex-fronted/e2e/domain-model-mermaid.spec.ts`
- Create: `docs/vibex-fifth/validation/mermaid-before.png` / `mermaid-after.png`
- Verify: `svg.mermaid` 非空 SVG

**Test Scenarios**:
- Happy path: 打开领域模型页面 → Mermaid SVG 渲染（非空）
- Happy path: 刷新页面后 Mermaid 仍然渲染
- Edge: 多个 Domain Model 同时显示
- Error: Mermaid 加载失败显示降级文本

---

### Story E3.2: Domain Model 解析卡死修复

**Dev**: dev
**Estimated**: 3h
**Dependency**: E3.1 (Mermaid 渲染稳定后)
**Verification Command**: Manual timing + E2E

**Implementation**:
1. 添加解析 timeout 保护（30s）
2. 实现超时 UI: `expect(screen.getByText(/解析超时/i)).toBeVisible()`
3. 实现解析失败 UI: `expect(screen.getByText(/解析失败/i)).toBeVisible()`
4. 创建 `e2e/domain-model-parsing.spec.ts`
5. Manual timing 验证: 解析 < 30s

**Files**:
- Modify: Domain Model 解析相关组件（待 E3.1 根因定位后确认）
- Create: `vibex-fronted/e2e/domain-model-parsing.spec.ts`

**Test Scenarios**:
- Happy path: 解析完成时间 < 30s
- Edge: 解析中显示 loading 状态
- Error: 解析超时时显示"解析超时"提示
- Error: 解析异常时显示"解析失败"提示

---

## Phase A-4: Epic E4 — 稳定性收尾

### Story E4.1: JsonRenderPreview 集成验证

**Dev**: dev
**Estimated**: 1h
**Dependency**: E3.1 (渲染层稳定后)
**Verification Command**: `pnpm test:e2e --grep "json-render-preview"`

**Implementation**:
1. 确认 `@json-render/react` 包已安装
2. 确认 `CanvasPreviewModal` 中 JsonRenderPreview 已引用
3. 打开 CanvasPreviewModal 验证渲染
4. 创建 `e2e/json-render-preview.spec.ts`
5. 断言: `expect(page.locator('[data-testid="json-render-preview"]')).toBeVisible()`
6. 标记 `@ci-blocking`
7. `pnpm test:e2e` 验证

**Files**:
- Modify: None (应已存在)
- Create: `vibex-fronted/e2e/json-render-preview.spec.ts`
- Verify: `vibex-fronted/src/components/canvas/json-render/CanvasPreviewModal.tsx`

**Test Scenarios**:
- Happy path: CanvasPreviewModal 打开后 JsonRenderPreview 可见
- Edge: JSON 数据为空时显示空状态
- Error: JSON 格式错误时显示错误状态

---

### Story E4.2: PrototypeQueuePanel API 连通性验证

**Dev**: dev
**Estimated**: 1h
**Dependency**: E1.1 (VersionHistoryPanel API 验证后)
**Verification Command**: curl + `pnpm test:e2e --grep "prototype-queue"`

**Implementation**:
1. curl 验证 `GET /api/v1/canvas/queue` → 返回 200
2. 确认 PrototypeQueuePanel 轮询逻辑正确（5000ms interval）
3. 创建 `e2e/prototype-queue.spec.ts`
4. 断言:
   - `await fetch('/api/v1/canvas/queue').then(r => expect(r.status).toBe(200))`
   - `await expect(page.getByText(/队列状态/i)).toBeVisible()`
5. 标记 `@ci-blocking`
6. `pnpm test:e2e` 验证

**Files**:
- Modify: None (应已存在)
- Create: `vibex-fronted/e2e/prototype-queue.spec.ts`
- Verify: `vibex-fronted/src/components/canvas/PrototypeQueuePanel.tsx`

**Test Scenarios**:
- Happy path: API curl 返回 200
- Happy path: 队列面板显示队列状态
- Edge: 队列为空时显示空状态
- Error: 队列 API 返回错误时显示错误状态

---

## Quality Gates

All phases must pass these gates before moving to next:

| Gate | Command | Pass Criteria |
|------|---------|---------------|
| TypeScript | `pnpm build` | 0 blocking errors |
| ESLint | `pnpm lint` | errors < 100 (baseline) |
| E2E | `pnpm test:e2e --grep "@ci-blocking"` | 0 failures |
| Visual | gstack browse screenshot | SVG / components visible |

---

## File Summary

| Action | Path |
|--------|------|
| Create | `vibex-fronted/e2e/version-history.spec.ts` |
| Create | `vibex-fronted/e2e/search-dialog.spec.ts` |
| Create | `vibex-fronted/e2e/save-indicator.spec.ts` |
| Create | `vibex-fronted/e2e/template-selector.spec.ts` |
| Create | `vibex-fronted/e2e/phase-indicator.spec.ts` |
| Create | `vibex-fronted/e2e/domain-model-mermaid.spec.ts` |
| Create | `vibex-fronted/e2e/domain-model-parsing.spec.ts` |
| Create | `vibex-fronted/e2e/json-render-preview.spec.ts` |
| Create | `vibex-fronted/e2e/prototype-queue.spec.ts` |
| Modify | `vibex-fronted/src/components/canvas/CanvasPage.tsx` (E2.1, E2.2 integration) |
| Modify | Domain Model components (E3.1, E3.2 — 待 gstack 定位后确认) |
| Create | `docs/vibex-fifth/validation/mermaid-before.png` |
| Create | `docs/vibex-fifth/validation/mermaid-after.png` |
