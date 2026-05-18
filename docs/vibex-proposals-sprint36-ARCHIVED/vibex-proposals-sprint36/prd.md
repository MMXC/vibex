# VibeX Sprint 36 PRD — 功能提案规划

**版本**: v1.0
**日期**: 2026-05-11
**Agent**: pm
**仓库**: /root/.openclaw/vibex

---

## 1. 执行摘要

### 背景

VibeX 已完成 Sprint 1-35，核心 DDS 设计画布和 MCP Server 基础设施已稳定。当前阶段需要在两条主线上继续推进：
1. **协作能力**：多人实时协作 MVP 是产品差异化的关键，当前 Firebase presence 基础设施已就绪但 RemoteCursor 未挂载
2. **体验完整性**：模板市场发现层缺失、Toolbar 功能缺口、E2E 测试覆盖盲区需要填补

### 目标

- 完成多人协作 MVP 的 RemoteCursor 挂载与 useRealtimeSync 集成
- 上线模板市场 MVP，提供可浏览/筛选的模板发现页面
- 完成 MCP Tool 文档 CI Gate，防止文档与代码失步
- 补全 DDSToolbar Undo/Redo 按钮（快键键已就绪，仅缺 UI）
- 补全 Design Review E2E 降级路径测试

### 成功指标

| 指标 | 目标 |
|------|------|
| Sprint 36 结束后 P001 E2E 测试通过率 | 100% |
| `/dashboard/templates` 页面 industry filter 可用 | 3 个 tab 可切换 |
| CI 包含 tool-index 同步验证 job | PR 阶段拦截文档失步 |
| DDSToolbar Undo/Redo 按钮上线 | `data-testid` 可定位 |
| Design Review 降级路径 E2E 覆盖 | 503 → 显示降级文案 |

---

## 2. Epic 拆分

### Epic 总览

| Epic ID | Epic 名称 | 包含 Story | 总工时 |
|---------|-----------|------------|--------|
| E1 | 多人协作 MVP | S1.1, S1.2, S1.3 | 3-5 人天 |
| E2 | 模板市场 MVP | S2.1, S2.2 | 2-3 人天 |
| E3 | MCP DoD CI Gate | S3.1 | 0.5 人天 |
| E4 | 撤销重做 Toolbar 补全 | S4.1 | 0.5 人天 |
| E5 | Design Review E2E 补全 | S5.1, S5.2 | 1 人天 |
| **合计** | | **8 Stories** | **7-10 人天** |

### Epic/Story 详细表格

#### Epic E1: 多人协作 MVP

| Story ID | 功能点 | 描述 | 工时 | 验收标准数 |
|----------|--------|------|------|------------|
| S1.1 | RemoteCursor 挂载 | 在 DDSCanvasPage Canvas overlay 层渲染 RemoteCursor，订阅 Firebase RTDB 其他用户 cursor 位置 | 1.5 人天 | 3 |
| S1.2 | useRealtimeSync 集成 | 在 DDSCanvasPage 中引入 useRealtimeSync hook，订阅远程节点变更并同步到 canvas | 1 人天 | 2 |
| S1.3 | Presence E2E 测试 | 编写 presence-mvp.spec.ts，验证多用户场景下 RemoteCursor 正确显示 | 1.5 人天 | 2 |

#### Epic E2: 模板市场 MVP

| Story ID | 功能点 | 描述 | 工时 | 验收标准数 |
|----------|--------|------|------|------------|
| S2.1 | Marketplace API + 静态数据 | 新建 `/api/templates/marketplace` 接口，返回静态 JSON 模板列表（≥3 个模板，含 industry/tags/icon） | 1 人天 | 2 |
| S2.2 | Dashboard 模板页 Industry Filter | `/dashboard/templates` 增加 industry filter tab（saas/mobile/ecommerce），前端按 industry 过滤展示 | 1.5 人天 | 3 |

#### Epic E3: MCP DoD CI Gate

| Story ID | 功能点 | 描述 | 工时 | 验收标准数 |
|----------|--------|------|------|------------|
| S3.1 | Tool Index CI 验证 | `.github/workflows/test.yml` 新增 job，运行 `generate-tool-index.ts` 并用 `git diff` 检测文档失步 | 0.5 人天 | 2 |

#### Epic E4: 撤销重做 Toolbar 补全

| Story ID | 功能点 | 描述 | 工时 | 验收标准数 |
|----------|--------|------|------|------------|
| S4.1 | DDSToolbar Undo/Redo 按钮 | 在 DDSToolbar.tsx 添加 Undo/Redo 按钮，读取 canvasHistoryStore 状态，支持 disabled/enabled 切换 | 0.5 人天 | 3 |

#### Epic E5: Design Review E2E 补全

| Story ID | 功能点 | 描述 | 工时 | 验收标准数 |
|----------|--------|------|------|------------|
| S5.1 | 降级路径 E2E 测试 | 新增 design-review-degradation.spec.ts，mock MCP 503 响应，验证降级文案显示 | 0.5 人天 | 2 |
| S5.2 | 评审结果三 Tab E2E 验证 | 验证 compliance/accessibility/reuse 三个 tab 数据正确渲染、可切换 | 0.5 人天 | 2 |

---

## 3. 验收标准（expect() 条目）

### Epic E1: 多人协作 MVP

#### S1.1 RemoteCursor 挂载

| 功能点 | 验收标准（expect()） | 页面集成 |
|--------|----------------------|----------|
| F1.1 | `expect(screen.queryByTestId('remote-cursor')).toBeInTheDocument()` — DDSCanvasPage 渲染树中存在 RemoteCursor DOM 节点 | 【需页面集成】DDSCanvasPage.tsx |
| F1.2 | `expect(usePresence.getState().connectedUsers.length).toBeGreaterThanOrEqual(0)` — connectedUsers 状态非负数 | 【需页面集成】usePresence hook |
| F1.3 | Firebase RTDB mock 模式下，RemoteCursor 收到远端 cursor 事件后正确更新 position（delay < 3s）| 【需页面集成】RemoteCursor.tsx |

#### S1.2 useRealtimeSync 集成

| 功能点 | 验收标准（expect()） | 页面集成 |
|--------|----------------------|----------|
| F1.4 | `expect(DDSCanvasPage.tsx).toImport('useRealtimeSync')` — 组件文件中导入 useRealtimeSync | 【需页面集成】DDSCanvasPage.tsx |
| F1.5 | Remote node 变更后，本地 canvas 节点数据与远端保持同步（`expect(nodeData).toEqual(remoteNodeData)`） | 【需页面集成】useRealtimeSync hook |

#### S1.3 Presence E2E 测试

| 功能点 | 验收标准（expect()） | 页面集成 |
|--------|----------------------|----------|
| F1.6 | `await expect(page.locator('[data-testid="remote-cursor"]').first()).toBeVisible({ timeout: 5000 })` — 双浏览器上下文同时打开同一 canvas 时，RemoteCursor 可见 | 【需页面集成】presence-mvp.spec.ts |
| F1.7 | `expect(page2.locator('[data-testid="presence-avatars"]')).toContainText(userName)` — PresenceAvatars 显示另一用户名称 | 【需页面集成】presence-mvp.spec.ts |

---

### Epic E2: 模板市场 MVP

#### S2.1 Marketplace API + 静态数据

| 功能点 | 验收标准（expect()） | 页面集成 |
|--------|----------------------|----------|
| F2.1 | `expect(response.status).toBe(200)` — GET `/api/templates/marketplace` 返回 HTTP 200 | 无 |
| F2.2 | `expect(jsonBody.templates.length).toBeGreaterThanOrEqual(3)` — 返回至少 3 个模板对象，每个含 industry/description/tags/icon 字段 | 无 |

#### S2.2 Dashboard 模板页 Industry Filter

| 功能点 | 验收标准（expect()） | 页面集成 |
|--------|----------------------|----------|
| F2.3 | `expect(screen.getByRole('tab', { name: /saas/i })).toBeInTheDocument()` — industry filter tab 存在（saas/mobile/ecommerce 三个）| 【需页面集成】/dashboard/templates/page.tsx |
| F2.4 | 点击 saas tab 后，`expect(screen.getAllByTestId('template-card').length).toBeGreaterThan(0)` — 有模板卡片渲染 | 【需页面集成】/dashboard/templates/page.tsx |
| F2.5 | `expect(screen.queryByText(/no templates found/i)).not.toBeInTheDocument()` — saas tab 下模板列表非空时不出错 | 【需页面集成】/dashboard/templates/page.tsx |

---

### Epic E3: MCP DoD CI Gate

#### S3.1 Tool Index CI 验证

| 功能点 | 验收标准（expect()） | 页面集成 |
|--------|----------------------|----------|
| F3.1 | `.github/workflows/test.yml` 包含 `generate-tool-index` job name（grep 验证文件内容） | 无 |
| F3.2 | `git diff docs/mcp-tools/INDEX.md` 非空时 CI job exit code = 1（脚本退出码验证） | 无 |

---

### Epic E4: 撤销重做 Toolbar 补全

#### S4.1 DDSToolbar Undo/Redo 按钮

| 功能点 | 验收标准（expect()） | 页面集成 |
|--------|----------------------|----------|
| F4.1 | `expect(screen.getByTestId('undo-btn')).toBeInTheDocument()` — Toolbar 存在 `data-testid="undo-btn"` 的 DOM 节点 | 【需页面集成】DDSToolbar.tsx |
| F4.2 | `expect(screen.getByTestId('redo-btn')).toBeInTheDocument()` — Toolbar 存在 `data-testid="redo-btn"` 的 DOM 节点 | 【需页面集成】DDSToolbar.tsx |
| F4.3 | `expect(screen.getByTestId('undo-btn')).toHaveAttribute('disabled')` — 当 `canvasHistoryStore.getState().canUndo === false` 时，undo 按钮 `disabled={true}` | 【需页面集成】DDSToolbar.tsx |

---

### Epic E5: Design Review E2E 补全

#### S5.1 降级路径 E2E 测试

| 功能点 | 验收标准（expect()） | 页面集成 |
|--------|----------------------|----------|
| F5.1 | `expect(screen.getByText(/AI 评审暂时不可用/i)).toBeInTheDocument()` — MCP 503 时降级文案显示 | 【需页面集成】design-review-degradation.spec.ts |
| F5.2 | `expect(response.status).toBe(503)` — mock MCP server 返回 503 状态码 | 无 |

#### S5.2 评审结果三 Tab E2E 验证

| 功能点 | 验收标准（expect()） | 页面集成 |
|--------|----------------------|----------|
| F5.3 | `expect(screen.getByRole('tab', { name: /compliance/i })).toBeInTheDocument()` — compliance tab 存在且可点击 | 【需页面集成】ReviewReportPanel |
| F5.4 | 切换到 reuse tab 后，`expect(screen.getByTestId('reuse-score')).toBeInTheDocument()` — reuse 评分卡片渲染 | 【需页面集成】ReviewReportPanel |

---

## 4. DoD (Definition of Done)

### 通用 DoD（所有 Story 必须满足）

- [ ] 代码已合并到 `main` 分支
- [ ] 所有新增/修改的文件通过 ESLint 检查（无 error）
- [ ] 单元测试新增用例通过（覆盖率不降低）
- [ ] `git diff` 不包含 `console.log` / `TODO` / `FIXME` 残留
- [ ] 相关页面/组件的 TypeScript 类型检查通过（`tsc --noEmit`）

### Epic E1 专用 DoD

- [ ] `DDSCanvasPage.tsx` 中 `<RemoteCursor />` 组件已挂载（存在于 render 输出中）
- [ ] `useRealtimeSync` hook 在 DDSCanvasPage 中被调用（useEffect 或 JSX 中有引用）
- [ ] `presence-mvp.spec.ts` 在 Firebase mock 模式下 E2E 测试 100% 通过
- [ ] RemoteCursor 在 `isFirebaseConfigured() === false` 时不渲染（条件守卫）
- [ ] 多用户场景下 RemoteCursor 位置更新延迟 < 3s

### Epic E2 专用 DoD

- [ ] `/api/templates/marketplace` 接口返回 HTTP 200 且 body 为 JSON
- [ ] 静态 JSON 数据包含 ≥ 3 个模板，字段完整（industry/description/tags/icon）
- [ ] `/dashboard/templates` 页面存在 industry filter UI（≥ 3 个 tab）
- [ ] Industry filter 切换后，模板列表正确更新（无空列表错误，除非数据为空）
- [ ] `templates-market.spec.ts` E2E 测试通过

### Epic E3 专用 DoD

- [ ] `.github/workflows/test.yml` 包含 `generate-tool-index` job，job 中有 `node scripts/generate-tool-index.ts`
- [ ] CI job 包含 `git diff --exit-code docs/mcp-tools/INDEX.md` 步骤
- [ ] 当 tool 源文件变更但 INDEX.md 未同步时，CI job exit code = 1
- [ ] PR 提交 `packages/mcp-server/src/tools/*.ts` 变更时自动触发该 CI job

### Epic E4 专用 DoD

- [ ] `DDSToolbar.tsx` 存在 `data-testid="undo-btn"` 的 `<button>` 元素
- [ ] `DDSToolbar.tsx` 存在 `data-testid="redo-btn"` 的 `<button>` 元素
- [ ] Undo 按钮调用 `useCanvasHistoryStore.getState().undo()`
- [ ] Redo 按钮调用 `useCanvasHistoryStore.getState().redo()`
- [ ] 按钮 disabled 状态与 `canUndo`/`canRedo` 状态一致
- [ ] `Ctrl+Z` / `Ctrl+Shift+Z` 快捷键仍正常工作（Toolbar 按钮不影响已有快捷键）

### Epic E5 专用 DoD

- [ ] `design-review-degradation.spec.ts` 文件存在且 E2E 测试通过
- [ ] MCP server 返回 503 时，页面显示降级文案（非 500 错误白屏）
- [ ] compliance / accessibility / reuse 三个 tab 均可切换且数据正确渲染
- [ ] Tab 切换不触发页面刷新（前端路由/状态管理切换）
- [ ] `data-testid="reuse-score"` 等验收断言节点存在于 ReviewReportPanel 中

---

## 5. 功能点汇总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 | Epic |
|----|--------|------|----------|----------|------|
| F1.1 | RemoteCursor 挂载 | Canvas overlay 层渲染 RemoteCursor，订阅 Firebase RTDB | DDSCanvasPage 渲染树含 RemoteCursor | 【需页面集成】DDSCanvasPage.tsx | E1 |
| F1.2 | Presence 状态连接 | connectedUsers 状态初始化非负 | connectedUsers.length >= 0 | 【需页面集成】usePresence hook | E1 |
| F1.3 | Cursor 位置同步 | 远端 cursor 事件更新 position | 延迟 < 3s | 【需页面集成】RemoteCursor.tsx | E1 |
| F1.4 | useRealtimeSync 导入 | DDSCanvasPage 导入 useRealtimeSync | 组件文件含 import 语句 | 【需页面集成】DDSCanvasPage.tsx | E1 |
| F1.5 | 远程节点同步 | 本地 canvas 节点与远端数据同步 | nodeData === remoteNodeData | 【需页面集成】useRealtimeSync hook | E1 |
| F1.6 | 多用户 RemoteCursor | 双浏览器上下文场景验证 | RemoteCursor 可见（5s timeout）| 【需页面集成】presence-mvp.spec.ts | E1 |
| F1.7 | PresenceAvatars 显示 | PresenceAvatars 显示其他用户名 | 包含 userName 文本 | 【需页面集成】presence-mvp.spec.ts | E1 |
| F2.1 | Marketplace API | GET `/api/templates/marketplace` | status === 200 | 无 | E2 |
| F2.2 | 模板数据完整性 | 返回 ≥3 个模板，字段完整 | templates.length >= 3，含必填字段 | 无 | E2 |
| F2.3 | Industry Filter Tab | saas/mobile/ecommerce 三个 tab | Tab 存在且可点击 | 【需页面集成】/dashboard/templates/page.tsx | E2 |
| F2.4 | 模板卡片渲染 | 切换 tab 后有模板卡片显示 | template-card.length > 0 | 【需页面集成】/dashboard/templates/page.tsx | E2 |
| F2.5 | 非空容错 | saas tab 下列表无错 | 无 "no templates found" 文案 | 【需页面集成】/dashboard/templates/page.tsx | E2 |
| F3.1 | CI Job 存在 | test.yml 包含 generate-tool-index job | grep 验证 job name | 无 | E3 |
| F3.2 | CI 检测能力 | INDEX.md 失步时 CI fail | git diff 非空 → exit 1 | 无 | E3 |
| F4.1 | Undo 按钮 | Toolbar 有 undo-btn | data-testid="undo-btn" 存在 | 【需页面集成】DDSToolbar.tsx | E4 |
| F4.2 | Redo 按钮 | Toolbar 有 redo-btn | data-testid="redo-btn" 存在 | 【需页面集成】DDSToolbar.tsx | E4 |
| F4.3 | Disabled 状态 | canUndo=false 时 disabled | disabled 属性生效 | 【需页面集成】DDSToolbar.tsx | E4 |
| F5.1 | 降级文案 | MCP 503 时显示降级文案 | 含 "AI 评审暂时不可用" | 【需页面集成】design-review-degradation.spec.ts | E5 |
| F5.2 | 503 响应 Mock | mock MCP 返回 503 | response.status === 503 | 无 | E5 |
| F5.3 | Compliance Tab | compliance tab 存在可切换 | tab 存在且可点击 | 【需页面集成】ReviewReportPanel | E5 |
| F5.4 | Reuse Tab 渲染 | reuse tab 切换后显示评分 | reuse-score 元素存在 | 【需页面集成】ReviewReportPanel | E5 |

---

## 6. 依赖关系

```
E1 (多人协作 MVP)
├── P001: Firebase RTDB 配置就绪（已验证）
├── P002: RemoteCursor.tsx 组件存在（已验证）
└── P003: useRealtimeSync hook 存在（已验证）

E2 (模板市场 MVP)
├── P001: S35-P004 调研结论已产出（静态 JSON 安全）
├── P002: /dashboard/templates 页面存在（已验证）
└── P003: templateApi.getTemplates() 存在（已验证）

E3 (MCP DoD CI Gate)
├── P001: generate-tool-index.ts 脚本存在（已验证）
├── P002: docs/mcp-tools/INDEX.md 存在（已验证）
└── P003: .github/workflows/test.yml 存在（需修改）

E4 (撤销重做 Toolbar)
├── P001: useKeyboardShortcuts 已连接 canvasHistoryStore（已验证）
├── P002: DDSToolbar.tsx 存在（已验证）
└── P003: 无新增依赖

E5 (Design Review E2E)
├── P001: design-review-mcp.spec.ts 存在（已验证）
├── P002: ReviewReportPanel 存在于 DDSCanvasPage（已验证）
└── P003: design-review.spec.ts 存在（已验证）
```

---

*本文档由 pm agent 基于 analyst 可行性分析报告编写*
*生成时间: 2026-05-11 20:05 GMT+8*
