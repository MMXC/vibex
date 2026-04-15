# VibeX Canvas Bug 修复 — 开发约束

**Project**: vibex-fix-canvas-bugs
**Date**: 2026-04-15
**Architect**: architect

---

## 1. 通用约束

### 1.1 代码规范

- **TypeScript**：严格类型，所有新增 state 必须有类型注解
- **无 `any` 类型泄漏**：新增的 callback 和 state 必须正确类型化
- **无 `// @ts-ignore`**：除非有明确理由并标注
- **无 `canvasLogger.default.debug`**：已有规范，禁止绕过日志系统

### 1.2 文件路径（repo-relative）

| 文件 | 路径 |
|------|------|
| DDS API hook | `vibex-fronted/src/hooks/dds/useDDSAPI.ts` |
| Canvas panels hook | `vibex-fronted/src/hooks/canvas/useCanvasPanels.ts` |
| Canvas page | `vibex-fronted/src/components/canvas/CanvasPage.tsx` |
| DDS page | `vibex-fronted/src/app/design/dds-canvas/page.tsx` |
| DDS page component | `vibex-fronted/src/components/dds/DDSCanvasPage.tsx` |
| API redirect | `vibex-fronted/public/_redirects` |
| Backend chapters route | `vibex-backend/src/routes/v1/dds/chapters.ts` |
| Backend gateway | `vibex-backend/src/routes/v1/gateway.ts` |
| Backend index | `vibex-backend/src/index.ts` |

### 1.3 测试规范

- **所有修改必须有 E2E 测试覆盖**（Playwright）
- **E2E spec 路径**：`vibex-fronted/e2e/dds-canvas-load.spec.ts`、`vibex-fronted/e2e/canvas-tab-state.spec.ts`
- **测试隔离**：每个 bug 独立 spec 文件
- **不依赖测试数据的持久性**：使用一次性 projectId

---

## 2. Bug 1 专项约束

### 2.1 不触碰的文件

- ❌ `vibex-backend/src/routes/v1/dds/chapters.ts` — 已有实现正确，无需修改
- ❌ `vibex-backend/src/routes/v1/gateway.ts` — 路由挂载正确，无需修改
- ❌ `vibex-backend/src/index.ts` — Hono app 挂载正确，无需修改

### 2.2 优先使用配置方案

- ✅ 优先确认并修复 Cloudflare Pages 路由配置（Dashboard）
- ⚠️ 仅在配置无法解决时使用 B1-U2 降级方案（Next.js API Route 代理）

### 2.3 降级方案约束（B1-U2）

如果实施降级方案：
- 新建的 `route.ts` 必须 Server-side fetch 到 `https://api.vibex.top`
- **禁止**在前端直接暴露 `api.vibex.top` URL（通过 Next.js API Route 隔离）
- 新建 route 必须添加 `GET` 方法处理，响应类型与原 API 一致

### 2.4 验证要求

- 修改后必须用 `curl` 或 Playwright 直接测 `/api/v1/dds/chapters`
- 页面加载时控制台无 Error 级别日志
- 确认 `DDSCanvasPage.tsx` 的 error 状态正确处理 404/500

---

## 3. Bug 2 专项约束

### 3.1 状态管理约束

- **`phase`**：由 `useCanvasStore` 管理，Zustand 全局状态
- **`activeTab`**：由 `useCanvasPanels` 管理，本地 state
- **`queuePanelExpanded`**：由 `useCanvasPanels` 管理，本地 state
- **规则**：Tab/phase 切换必须同时重置 `queuePanelExpanded = false`

### 3.2 约束详情

| 约束 | 说明 |
|------|------|
| Bug2 Root Cause #1 | `queuePanelExpanded` 必须初始化为 `false`（`useState(false)`） |
| Bug2 Root Cause #2 | 移动端 TabBar 三个 Tab onClick 必须调用 `setQueuePanelExpanded(false)` |
| Bug2 Root Cause #3 | Prototype tab 按钮 onClick 必须调用 `setQueuePanelExpanded(false)` |
| Bug2 Root Cause #4 | 桌面 PhaseIndicator 切换 phase 时，离开 prototype 也必须 `setQueuePanelExpanded(false)` |

### 3.3 桌面 vs 移动端

- **桌面模式**（`useTabMode=false`）：PhaseIndicator 的 `onPhaseChange` 调用 `setPhase`，需包装后同步 `setQueuePanelExpanded(false)`
- **移动端模式**（`useTabMode=true`）：TabBar onClick 已正确调用 `setPhase()` + `setActiveTree()`，需新增 `setQueuePanelExpanded(false)`
- Prototype tab 按钮（桌面+移动端）同样需要 `setQueuePanelExpanded(false)`

### 3.4 不触碰的文件

- ❌ `vibex-fronted/src/components/canvas/PrototypeQueuePanel.tsx` — 仅修父组件状态
- ❌ Zustand stores（`contextStore`, `flowStore`, `componentStore`）— 无需修改

---

## 4. 代码审查要点

### 4.1 必查项

- [ ] Bug2 Root Cause #1: `queuePanelExpanded` 初始化为 `false`
- [ ] Bug2 Root Cause #2: 移动端 TabBar 三个 Tab onClick 都含 `setQueuePanelExpanded(false)`
- [ ] Bug2 Root Cause #3: Prototype tab 按钮 onClick 含 `setQueuePanelExpanded(false)`
- [ ] Bug2 Root Cause #4: 桌面 PhaseIndicator 的 phase 切换（含离开 prototype）含 `setQueuePanelExpanded(false)`
- [ ] 新增 state 有 TypeScript 类型注解
- [ ] E2E 测试通过（无 `test.skip`）
- [ ] 控制台无 Error 级别日志

### 4.2 红线（拒绝合并）

- ❌ 直接修改 `phase` 而不更新 `activeTab`
- ❌ 只在 `useEffect` 中同步状态（应通过 onClick 即时同步）
- ❌ 修改 backend DDS 路由代码（Bug1 根因不在 backend）
- ❌ 添加全局依赖（`package.json` 变更需 architect 确认）

---

## 5. 提交约定

```
fix(canvas): resolve DDS API 404 and Tab state residual

- B1: verify Cloudflare Pages routing for /api/v1/dds/*
- B2: reset queuePanelExpanded on Tab switch
- add e2e/canvas-tab-state.spec.ts
- add e2e/dds-canvas-load.spec.ts
```

---

## 6. DoD (Definition of Done)

- [ ] Bug1: `GET /api/v1/dds/chapters?projectId=xxx` 返回 200
- [ ] Bug1: dds-canvas 页面加载无"加载失败"提示
- [ ] Bug1: 控制台无 Error 级别日志
- [ ] Bug2: Tab 切换后 `queuePanelExpanded === false`
- [ ] Bug2: Tab 切换后 phase 正确重置
- [ ] E2E 测试全部 PASS（无 `test.skip`）
- [ ] 代码符合 AGENTS.md 约束（类型注解、无 any、无 ts-ignore）
