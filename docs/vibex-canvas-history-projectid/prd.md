# vibex-canvas-history-projectid — PRD

**项目**: vibex-canvas-history-projectid
**任务**: create-prd
**日期**: 2026-04-14
**作者**: PM Agent
**状态**: ✅ 完成
**基于**: analysis.md + planning.md

---

## 1. 执行摘要

### 背景

Canvas 页面（`/canvas`）的"保存历史版本"和"获取历史版本"功能因 `projectId` 传递问题导致 API 400 错误。

两个受影响入口：
1. ProjectBar 中的"历史"按钮 → 打开 `VersionHistoryPanel`
2. VersionHistoryPanel 中的"保存当前版本"按钮 → 调用 `useVersionHistory.createSnapshot()`

### 根因

- **场景A**: 直接打开 `/canvas`，未创建项目 → `sessionStore.projectId === null`
- **场景B**: CanvasPage 挂载后立即点击"历史"按钮 → `skipHydration: true` + `useEffect` 延迟 rehydrate，闭包中 `projectId` 仍为 null
- **场景C**: API 层 `listSnapshots(undefined)` → 不带 query param → 后端 400

### 目标

Phase 1（止血）：projectId 缺失时展示明确引导而非 API 400，0.5d 内交付。
Phase 2（根治）：通过 URL 注入 projectId，根本性解决时序问题，2d 交付。

### 成功指标

- [ ] `pnpm build` 通过
- [ ] projectId=null 时，API 不发送无效请求（Hook 层拦截）
- [ ] projectId=null 时，UI 展示"请先创建项目"引导
- [ ] projectId=null 时，保存操作展示明确错误提示
- [ ] projectId 从 null → 有效值后，历史面板自动刷新
- [ ] VersionHistoryPanel E2E 测试通过
- [ ] 新增无项目场景 E2E 通过

---

## 2. Epic 拆分

### Epic 1 — 止血修复（Phase 1）

**目标**: Hook 层拦截空值，展示引导 UI，不发 API 400

| Story ID | 功能点 | 描述 | 工时 | 验收标准 |
|----------|--------|------|------|----------|
| S1.1 | Hook 层空值拦截-loadSnapshots | `projectId=null` 时 `loadSnapshots()` 拦截，展示引导 UI，API 不发送 | 0.5d | 见 3.1 |
| S1.2 | Hook 层空值拦截-createSnapshot | `projectId=null` 时 `createSnapshot()` reject + 明确错误提示，API 不发送 | 0.25d | 见 3.2 |
| S1.3 | projectId 变化自动重载 | `projectId` 从 null → 有效值时，useEffect 自动触发 loadSnapshots() | 0.25d | 见 3.3 |
| S1.4 | E2E 补充：无项目场景 | E2E 覆盖场景A（无项目点击保存）和场景B（快速点击历史按钮） | 0.5d | 见 3.4 |

### Epic 2 — 深度修复（Phase 2）

**目标**: URL 注入 projectId，从根本上解决时序和缺失问题

| Story ID | 功能点 | 描述 | 工时 | 验收标准 |
|----------|--------|------|------|----------|
| S2.1 | URL 参数读取与初始化 | CanvasPage 从 `?projectId=xxx` 读取并初始化 sessionStore | 1d | 见 3.5 |
| S2.2 | projectId 合法性校验 | URL projectId 不对应真实项目时 toast 提示 + 降级无项目模式 | 0.5d | 见 3.6 |
| S2.3 | Hook 双源订阅适配 | useVersionHistory 订阅 store projectId 变化，支持从 URL 注入的 projectId 生效 | 0.5d | 见 3.7 |

---

## 3. 验收标准（expect() 断言）

### S1.1 — Hook 层空值拦截-loadSnapshots

| 页面集成 | 是（VersionHistoryPanel） |
|----------|---------------------------|

**Given** 用户已打开 `/canvas` 但 `projectId === null`
**When** 用户点击 ProjectBar 中的"历史"按钮，打开 VersionHistoryPanel
**Then**
- `expect(screen.queryByText(/请先创建项目/i)).toBeInTheDocument()`
- `expect(canvasApi.listSnapshots).not.toHaveBeenCalled()`

**Given** 用户已打开 `/canvas` 且 `projectId === null`
**When** 用户直接在 URL 访问 `/canvas?projectId=null` 或无 projectId
**Then** 面板加载状态结束后展示引导 UI，无 API 调用

**Given** 用户已创建项目，`projectId` 已就绪
**When** 用户打开 VersionHistoryPanel
**Then** `expect(canvasApi.listSnapshots).toHaveBeenCalledWith(expect.any(String))`

---

### S1.2 — Hook 层空值拦截-createSnapshot

| 页面集成 | 是（VersionHistoryPanel） |
|----------|---------------------------|

**Given** 用户已打开 `/canvas` 但 `projectId === null`
**When** 用户点击 VersionHistoryPanel 中的"保存当前版本"按钮
**Then**
- `expect(canvasApi.createSnapshot).not.toHaveBeenCalled()`
- `expect(screen.queryByText(/请先创建项目/i)).toBeInTheDocument()`

**Given** 用户已创建项目，`projectId` 已就绪
**When** 用户点击"保存当前版本"按钮
**Then** `expect(canvasApi.createSnapshot).toHaveBeenCalledWith(expect.objectContaining({ projectId: expect.any(String) }))`

---

### S1.3 — projectId 变化自动重载

| 页面集成 | 是（VersionHistoryPanel） |
|----------|---------------------------|

**Given** 用户打开 VersionHistoryPanel 时 `projectId === null`（展示引导 UI）
**When** 用户随后创建项目，`projectId` 从 null 变为有效值
**Then**
- `expect(screen.queryByText(/请先创建项目/i)).not.toBeInTheDocument()`
- `expect(canvasApi.listSnapshots).toHaveBeenCalled()`

**Given** 用户打开 VersionHistoryPanel 时 `projectId === validId`，快照列表已加载
**When** 用户切换到另一个项目，`projectId` 变为新值
**Then** `expect(canvasApi.listSnapshots).toHaveBeenCalledWith(newProjectId)`

---

### S1.4 — E2E 补充：无项目场景

| 页面集成 | 否（E2E 测试层） |
|----------|------------------|

**E2E Test 1（场景A）**
- Navigate to `/canvas` (no project)
- Click "历史" button in ProjectBar
- Expect: VersionHistoryPanel shows "请先创建项目" guide
- Expect: No API 400 error in network log

**E2E Test 2（场景B）**
- Navigate to `/canvas` (no project)
- Rapidly click "历史" button within 100ms of page load
- Expect: No crash, guide UI shown after rehydration settles

**E2E Test 3（正常流程）**
- Create a project → Navigate to its canvas
- Click "历史" button
- Expect: Snapshot list loads successfully (HTTP 200)

---

### S2.1 — URL 参数读取与初始化

| 页面集成 | 是（CanvasPage） |
|----------|------------------|

**Given** 用户访问 `/canvas?projectId=abc123`
**When** CanvasPage 挂载完成
**Then** `expect(sessionStore.getState().projectId).toBe('abc123')`

**Given** 用户访问 `/canvas`（无 URL projectId）
**When** CanvasPage 挂载完成
**Then** `expect(sessionStore.getState().projectId).toBeNull()`

**Given** 用户访问 `/canvas?projectId=abc123`，sessionStore.projectId 已存在且不同
**When** CanvasPage mount useEffect 执行
**Then** sessionStore.projectId 更新为 URL 值

---

### S2.2 — projectId 合法性校验

| 页面集成 | 是（CanvasPage / VersionHistoryPanel） |
|----------|----------------------------------------|

**Given** 用户访问 `/canvas?projectId=invalid-id`（不存在的项目）
**When** CanvasPage 挂载并尝试初始化
**Then**
- `expect(screen.queryByText(/项目不存在/i)).toBeInTheDocument()`
- `expect(sessionStore.getState().projectId).toBeNull()`

**Given** 用户访问 `/canvas?projectId=valid-id`
**When** CanvasPage 挂载
**Then** `expect(sessionStore.getState().projectId).toBe('valid-id')`，无错误提示

---

### S2.3 — Hook 双源订阅适配

| 页面集成 | 是（useVersionHistory hook） |
|----------|------------------------------|

**Given** URL projectId 已注入 sessionStore（Phase 2）
**When** useVersionHistory hook 订阅 projectId
**Then** `expect(projectId).toBe(sessionStore.getState().projectId)`（URL 值）

**Given** URL projectId 注入后，用户在 UI 创建新项目
**When** setProjectId(newId) 被调用
**Then** useVersionHistory 订阅到的 projectId 更新为 newId

---

## 4. 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | Hook 空值防护-loadSnapshots | projectId=null 时拦截，UI 引导 | expect(screen.queryByText(/请先创建项目/i)).toBeInTheDocument() | 【需页面集成】 |
| F1.2 | Hook 空值防护-createSnapshot | projectId=null 时 reject，不发 API | canvasApi.createSnapshot.notCalled + 错误提示 | 【需页面集成】 |
| F1.3 | projectId 变化自动重载 | useEffect 订阅 projectId 变化自动刷新 | 列表自动刷新 | 【需页面集成】 |
| F1.4 | E2E 补充无项目场景 | 新增 E2E 测试覆盖场景A/B | E2E 通过 | 否 |
| F2.1 | URL 参数注入 projectId | CanvasPage 读取 URL 初始化 sessionStore | sessionStore.projectId 与 URL 一致 | 【需页面集成】 |
| F2.2 | projectId 合法性校验 | URL projectId 无对应项目时降级 | toast 提示 + projectId=null | 【需页面集成】 |
| F2.3 | Hook 双源订阅 | useVersionHistory 支持 URL 注入场景 | projectId 正确响应 | 【需页面集成】 |

---

## 5. DoD (Definition of Done)

每个 Story 的完成标准：

### Epic 1 Stories

**S1.1 完成标准**：
- [ ] `src/hooks/canvas/useVersionHistory.ts` 中 `loadSnapshots` 在 `projectId=null` 时拦截
- [ ] VersionHistoryPanel 展示"请先创建项目"引导 UI（而非空列表 + API 错误）
- [ ] `canvasApi.listSnapshots` 在 `projectId=null` 时未被调用
- [ ] `pnpm build` 通过
- [ ] 相关单元测试通过

**S1.2 完成标准**：
- [ ] `createSnapshot` 在 `projectId=null` 时返回 rejected Promise
- [ ] UI 展示明确错误提示，不发送 API 请求
- [ ] `canvasApi.createSnapshot` 在 `projectId=null` 时未被调用

**S1.3 完成标准**：
- [ ] `useEffect` 监听 `projectId` 从 null → 有效值变化
- [ ] 变化时自动触发 `loadSnapshots()`
- [ ] 单元测试覆盖此场景

**S1.4 完成标准**：
- [ ] E2E 测试文件存在（`version-history-no-project.spec.ts` 或追加到现有 spec）
- [ ] 三个 E2E 场景全部通过
- [ ] E2E 测试在 CI 中运行

### Epic 2 Stories

**S2.1 完成标准**：
- [ ] CanvasPage 从 `searchParams.get('projectId')` 读取 projectId
- [ ] 在 mount 时调用 `setProjectId(urlProjectId)`
- [ ] `pnpm build` 通过
- [ ] 相关单元测试通过

**S2.2 完成标准**：
- [ ] 不存在的 projectId 触发 toast 提示
- [ ] sessionStore.projectId 保持 null
- [ ] 不阻塞页面加载

**S2.3 完成标准**：
- [ ] useVersionHistory hook 正确订阅 store projectId（URL 注入后）
- [ ] 兼容 store 主动 setProjectId 的覆盖行为
- [ ] 单元测试覆盖双源切换场景

---

## 6. 驳回校验

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言
- [x] DoD 章节存在且具体
- [x] 功能点模糊，无法写 expect() → 已细化到 UI 行为 + API 调用断言
- [x] 涉及页面但未标注【需页面集成】→ 已标注（VersionHistoryPanel、CanvasPage）
- [x] 已执行 Planning（Feature List + Epic/Story）

---

## 7. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-canvas-history-projectid
- **执行日期**: 2026-04-14
- **Phase 1**: 方案 A + 方案 C（止血，1.5d）
- **Phase 2**: 方案 B（URL 注入，2d）

---

*PM Agent — 2026-04-14*
