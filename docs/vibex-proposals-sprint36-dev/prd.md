# VibeX Sprint 36 Dev — PRD

**版本**: v1.0
**日期**: 2026-05-11
**Agent**: pm
**仓库**: /root/.openclaw/vibex
**Planning 路径**: docs/vibex-proposals-sprint36-dev/planning-output.md

---

## 1. 执行摘要

### 背景

VibeX 已完成 Sprint 1-35，核心 DDS 设计画布和 MCP Server 基础设施已稳定。当前 Sprint 36 Dev 需要在两条主线上继续推进：
1. **协作能力**：多人实时协作 MVP 的最后一公里——Firebase presence 基础设施完整，RemoteCursor 已实现但未在 DDSCanvasPage 中挂载，useRealtimeSync 已实现但未被调用
2. **体验完整性**：模板市场无发现层、Toolbar 功能缺口、E2E 测试覆盖盲区需要填补

### 目标

- DDSCanvasPage 挂载 RemoteCursor + 集成 useRealtimeSync，完成多人协作 MVP
- 上线模板市场可浏览/筛选页面，提供主动发现能力
- 建立 MCP Tool 文档 CI Gate，防止代码与文档失步
- DDSToolbar 补齐 Undo/Redo 按钮（快捷键已就绪，仅缺 UI）
- 补全 Design Review 降级路径和三 Tab E2E 测试覆盖

### 成功指标

| 指标 | 目标 |
|------|------|
| E1 E2E 测试（presence-mvp.spec.ts） | Firebase mock 模式下双用户 RemoteCursor 可见（延迟 < 3s）|
| E2 `/dashboard/templates` industry filter | saas/mobile/ecommerce 三 tab 可切换 |
| E2 Marketplace API | GET /api/templates/marketplace → 200，≥3 个模板 |
| E3 CI job | PR 阶段 tool 文件变更时自动拦截 INDEX.md 失步 |
| E4 DDSToolbar | `data-testid="undo-btn"` / `data-testid="redo-btn"` 可定位 |
| E5 E2E 降级路径 | MCP 503 → 页面显示降级文案（非白屏）|
| E5 E2E 三 Tab | compliance/accessibility/reuse 可切换且数据正确 |

---

## 2. Epic 拆分

### Epic 总览

| Epic ID | Epic 名称 | Story 数 | 总工时 |
|---------|-----------|----------|--------|
| E1 | 多人协作 MVP | S1.1, S1.2, S1.3 | 3.5 人天 |
| E2 | 模板市场 MVP | S2.1, S2.2 | 2 人天 |
| E3 | MCP DoD CI Gate | S3.1 | 0.5 人天 |
| E4 | 撤销重做 Toolbar 补全 | S4.1 | 0.5 人天 |
| E5 | Design Review E2E 补全 | S5.1, S5.2 | 1 人天 |
| **合计** | | **8 Stories** | **7.5 人天** |

---

### Epic E1: 多人协作 MVP

#### 2a. 本质需求穿透（剥洋葱）

**用户的底层动机**：当用户在同一个设计画布上与他人协作时，需要感知"我不是一个人在这里"——有人在看、有人在改、有人在等我。

**剥离现有形态**：不是"RemoteCursor 组件"，而是"实时的、可见的、他人的位置信号"。去掉 RemoteCursor，现有实现（PresenceAvatars）只能显示名字，不能告诉用户"那个人现在在看哪里/做什么"。

**本质问题**：协作中的人需要知道其他人的注意力焦点在哪里。RemoteCursor 是最直接的答案——它映射了现实世界中的"眼神追随"。

**去掉会怎样**：用户不知道协作者在看哪里，只能靠猜测或文字沟通。协作效率大幅降低。

#### 2b. 最小可行范围

- **本期必做**：RemoteCursor 挂载（E1-S1.1）+ useRealtimeSync 集成（E1-S1.2）
- **本期不做**：IntentionBubble 与 presence 联动（属于体验增强，本质问题由 RemoteCursor 已解决）
- **暂缓**：Yjs CRDT 替换 Firebase（10-15 人天，当前基础设施已够用）

#### 2c. 用户情绪地图

**页面**: DDSCanvasPage（Canvas 协作场景）

| 状态 | 用户情绪 | 引导文案 |
|------|----------|----------|
| 理想态 | 安心：看到协作者的光标在画布上移动，知道对方在看/做什么 | —（自然可见，无需引导）|
| 空状态（单人）| 平静：一个人工作，工具都可用 | "邀请协作者" 按钮在 PresenceAvatars 区域 |
| 加载态 | 无感：Canvas 加载完成前光标不可见（Firebase 未连接）| —（加载态时间极短，不需文案）|
| 错误态 | 焦虑：Firebase 连接失败 | "实时协作暂时不可用，当前模式可正常编辑"（降级文案，非阻断）|

#### Epic/Story 表格

| Story ID | 功能点 | 描述 | 工时 |
|----------|--------|------|------|
| S1.1 | RemoteCursor 挂载 | 在 DDSCanvasPage Canvas overlay 层渲染 RemoteCursor，订阅 Firebase RTDB 其他用户 cursor 位置 | 1.5 人天 |
| S1.2 | useRealtimeSync 集成 | 在 DDSCanvasPage 引入 useRealtimeSync hook，订阅远程节点变更并同步到 canvas | 1 人天 |
| S1.3 | Presence E2E 测试 | 编写 presence-mvp.spec.ts，验证多用户场景下 RemoteCursor 正确显示 | 1 人天 |

---

### Epic E2: 模板市场 MVP

#### 2a. 本质需求穿透（剥洋葱）

**用户的底层动机**：用户来 VibeX 不是为了"看我的模板"，而是为了"找到适合我的模板"。现有的 Onboarding 流程是被动的——只有新用户能看到推荐，而存量用户（回访设计师）找不到发现入口。

**剥离现有形态**：不是"模板市场"这个功能名称，而是"让有明确需求的用户能找到匹配模板的主动路径"。

**本质问题**：用户无法主动发现适合自己行业的模板，只能依赖 Onboarding 的一次性推荐。

**去掉会怎样**：存量用户回访时找不到新模板入口，模板使用率停留在首日推荐，无法持续驱动模板价值。

#### 2b. 最小可行范围

- **本期必做**：Marketplace API + 静态数据（S2.1）+ Dashboard industry filter tab（S2.2）
- **本期不做**：模板搜索（debounce + 模糊匹配增加复杂度，filter 已满足核心发现需求）
- **暂缓**：GitHub Gist 动态拉取（API 限流风险，MVP 静态 JSON 安全可控）

#### 2c. 用户情绪地图

**页面**: `/dashboard/templates`（模板市场）

| 状态 | 用户情绪 | 引导文案 |
|------|----------|----------|
| 理想态 | 满足：快速找到 SaaS/Mobile/E-commerce 分类的模板，看到使用量和图标预览 | — |
| 空状态（某 industry 无模板）| 平静：知道自己选了什么分类，清楚"这个分类暂时没模板" | "该分类暂无可用模板，看看其他分类？" |
| 加载态 | 耐心：等待模板列表加载（骨架屏）| — |
| 错误态 | 困惑：数据加载失败 | "加载失败，请检查网络后重试" + 重试按钮 |

---

### Epic E3: MCP DoD CI Gate

#### 2a. 本质需求穿透（剥洋葱）

**用户的底层动机**：维护者需要 MCP tool 文档与代码同步——新加 tool 时文档必须同步更新，否则使用者（开发者）拿到的是过时信息。

**剥离现有形态**：不是"CI job"，而是"代码变更时强制检查文档同步"的机制。

**本质问题**：MCP tool 代码变更后文档手动更新容易遗漏，导致 docs/mcp-tools/INDEX.md 与 tools/list.ts 不一致。

**去掉会怎样**：INDEX.md 逐渐失步，开发者参考文档时发现 tool 不存在，信任崩塌。

#### 2b. 最小可行范围

- **本期必做**：CI job 检测 INDEX.md 失步（exit 1 拦截）
- **本期不做**：自动生成 commit PR（机制已有，手动 commit 够用）

#### 2c. 用户情绪地图

**场景**: GitHub PR 提交 tool 文件变更

| 状态 | 维护者情绪 | 引导文案 |
|------|------------|----------|
| 成功态 | 安心：CI 通过，INDEX.md 已同步 | — |
| 失败态（INDEX.md 失步）| 轻微受挫：知道哪里出了问题 | CI 日志："docs/mcp-tools/INDEX.md is out of sync. Run `node scripts/generate-tool-index.ts` and commit." |

#### Epic/Story 表格

| Story ID | 功能点 | 描述 | 工时 |
|----------|--------|------|------|
| S3.1 | Tool Index CI 验证 | `.github/workflows/test.yml` 新增 job，运行 generate-tool-index.ts 并检测 INDEX.md 失步 | 0.5 人天 |

---

### Epic E4: 撤销重做 Toolbar 补全

#### 2a. 本质需求穿透（剥洋葱）

**用户的底层动机**：用户操作画布时犯错，需要**无需思考**的撤销途径。快捷键（Ctrl+Z）是肌肉记忆，但Toolbar 按钮是新用户或 macOS 用户的**显性可见路径**。

**剥离现有形态**：不是"添加 Undo 按钮"，而是"让第一次用 VibeX 的用户知道操作可撤销"。快捷键对老手够用，但第一次来的设计师不会猜 Ctrl+Z。

**本质问题**：Toolbar 上没有 Undo/Redo 入口，新用户无法通过视觉发现这个能力。

**去掉会怎样**：新用户犯错后不知道可以撤销，可能选择刷新页面丢失所有进度，体验严重受损。

#### 2b. 最小可行范围

- **本期必做**：DDSToolbar Undo/Redo 按钮（S4.1）
- **本期不做**：快捷键自定义面板中显示 Undo/Redo 可视化（ShortcutPanel.tsx 已有快捷键说明）

#### 2c. 用户情绪地图

**页面**: DDSToolbar（Canvas 编辑场景）

| 状态 | 用户情绪 | 引导文案 |
|------|----------|----------|
| 理想态 | 安心：看到 Undo/Redo 按钮，知道操作可撤销 | — |
| 空状态（history 为空）| 平静：知道当前没有可撤销的操作 | 按钮 disabled，无需文案 |
| 加载态 | 无感：按钮状态读取是同步的，无加载态 | — |
| 错误态 | — | Toolbar 按钮无独立错误态（按钮 disabled 即为"不可用"状态）|

#### Epic/Story 表格

| Story ID | 功能点 | 描述 | 工时 |
|----------|--------|------|------|
| S4.1 | DDSToolbar Undo/Redo 按钮 | 在 DDSToolbar.tsx 添加 Undo/Redo 按钮，连接 canvasHistoryStore，支持 disabled/enabled | 0.5 人天 |

---

### Epic E5: Design Review E2E 补全

#### 2a. 本质需求穿透（剥洋葱）

**用户的底层动机**：用户触发 Design Review 后，**无论结果如何**都需要一个明确的反馈。MCP 服务不可用时，不能给用户一个空白错误页面——这会让用户以为产品坏了，而不是服务暂时不可用。

**剥离现有形态**：不是"加一个错误处理"，而是"让降级路径成为一等公民"。503 不是 bug，是预期的运维状态，必须有对应的 UI。

**本质问题**：MCP 503 时没有降级文案，用户看到空白或 500 错误，不知道是临时不可用还是永久故障。

**去掉会怎样**：用户以为产品坏了，发工单/抱怨"Design Review 不可用"。实际上只是 MCP 服务暂时下线。

#### 2b. 最小可行范围

- **本期必做**：降级路径 E2E 测试（S5.1）+ 三 Tab E2E 验证（S5.2）
- **本期不做**：ReviewReportPanel 骨架屏（Tab 切换是前端状态，非异步加载，无需骨架屏）

#### 2c. 用户情绪地图

**页面**: ReviewReportPanel（Design Review 结果展示）

| 状态 | 用户情绪 | 引导文案 |
|------|----------|----------|
| 理想态 | 满足：看到三个 tab 的评分和详情，知道如何改进 | — |
| 空状态（无评分数据）| 困惑：不知道"没有评分"是什么意思 | "暂无评分，请先生成设计评审" |
| 加载态 | 耐心：等待 MCP 返回结果 | 骨架屏占位，禁止转圈（会抖动）|
| 错误态（503）| 平静：知道是服务暂时不可用，可以稍后再试 | "AI 评审暂时不可用，请稍后重试" |
| 错误态（其他）| 焦虑：不知道发生了什么 | "评审失败，请重试或联系支持" |

#### Epic/Story 表格

| Story ID | 功能点 | 描述 | 工时 |
|----------|--------|------|------|
| S5.1 | 降级路径 E2E 测试 | 新增 design-review-degradation.spec.ts，mock MCP 503，验证降级文案 | 0.5 人天 |
| S5.2 | 评审结果三 Tab 验证 | 验证 compliance/accessibility/reuse 三 tab 数据正确渲染、可切换 | 0.5 人天 |

---

## 3. 验收标准（expect() 条目）

### Epic E1: 多人协作 MVP

#### S1.1 RemoteCursor 挂载

| 功能点 | 验收标准（expect()） | 页面集成 |
|--------|----------------------|----------|
| F1.1.1 | `expect(screen.queryByTestId('remote-cursor')).toBeInTheDocument()` — DDSCanvasPage render tree 包含 RemoteCursor DOM | 【需页面集成】DDSCanvasPage.tsx |
| F1.1.2 | `expect(remoteCursors).toBeDefined()` — useRealtimeSync 返回 remoteCursors 数组 | 【需页面集成】useRealtimeSync hook |
| F1.1.3 | Firebase RTDB mock 模式下 RemoteCursor 收到远端 cursor 事件后正确更新 position（`expect(remoteCursor.position).toEqual({x: 400, y: 300})`），延迟 < 3s | 【需页面集成】RemoteCursor.tsx |

#### S1.2 useRealtimeSync 集成

| 功能点 | 验收标准（expect()） | 页面集成 |
|--------|----------------------|----------|
| F1.2.1 | `expect(DDSCanvasPage.tsx).toMatch(/useRealtimeSync/)` — 组件文件中存在 import 语句 | 【需页面集成】DDSCanvasPage.tsx |
| F1.2.2 | Remote node 变更后本地 canvas 节点数据同步（`expect(localNodeData).toEqual(remoteNodeData)`） | 【需页面集成】useRealtimeSync hook |

#### S1.3 Presence E2E 测试

| 功能点 | 验收标准（expect()） | 页面集成 |
|--------|----------------------|----------|
| F1.3.1 | `await expect(page.locator('[data-testid="remote-cursor"]').first()).toBeVisible({ timeout: 5000 })` — 双浏览器上下文同时打开同一 canvas 时，RemoteCursor 可见 | 【需页面集成】presence-mvp.spec.ts |
| F1.3.2 | `expect(page2.locator('[data-testid="presence-avatars"]')).toContainText(userName)` — PresenceAvatars 显示另一用户名 | 【需页面集成】presence-mvp.spec.ts |

---

### Epic E2: 模板市场 MVP

#### S2.1 Marketplace API + 静态数据

| 功能点 | 验收标准（expect()） | 页面集成 |
|--------|----------------------|----------|
| F2.1.1 | `expect(response.status).toBe(200)` — GET `/api/templates/marketplace` 返回 HTTP 200 | 无 |
| F2.1.2 | `expect(jsonBody.templates.length).toBeGreaterThanOrEqual(3)` — 返回 ≥3 个模板，每个含 `industry`/`description`/`tags`/`icon` 字段，`icon` 为非空 emoji | 无 |

#### S2.2 Dashboard Industry Filter

| 功能点 | 验收标准（expect()） | 页面集成 |
|--------|----------------------|----------|
| F2.2.1 | `expect(screen.getByRole('tab', { name: /saas/i })).toBeInTheDocument()` — industry filter tab 存在（saas/mobile/ecommerce 三个）| 【需页面集成】/dashboard/templates/page.tsx |
| F2.2.2 | 点击 saas tab 后，`expect(screen.getAllByTestId('template-card').length).toBeGreaterThan(0)` — 有模板卡片渲染 | 【需页面集成】/dashboard/templates/page.tsx |
| F2.2.3 | `expect(screen.queryByText(/该分类暂无可用模板/i)).not.toBeInTheDocument()` — saas tab 下有数据时不显示空状态文案 | 【需页面集成】/dashboard/templates/page.tsx |

---

### Epic E3: MCP DoD CI Gate

#### S3.1 Tool Index CI 验证

| 功能点 | 验收标准（expect()） | 页面集成 |
|--------|----------------------|----------|
| F3.1.1 | `.github/workflows/test.yml` 包含 `name: Tool Index Sync` job（grep 验证文件内容） | 无 |
| F3.1.2 | `git diff docs/mcp-tools/INDEX.md` 非空时 CI job exit code = 1（脚本退出码验证） | 无 |

---

### Epic E4: 撤销重做 Toolbar 补全

#### S4.1 DDSToolbar Undo/Redo 按钮

| 功能点 | 验收标准（expect()） | 页面集成 |
|--------|----------------------|----------|
| F4.1.1 | `expect(screen.getByTestId('undo-btn')).toBeInTheDocument()` — Toolbar 存在 `data-testid="undo-btn"` 的 DOM 节点 | 【需页面集成】DDSToolbar.tsx |
| F4.1.2 | `expect(screen.getByTestId('redo-btn')).toBeInTheDocument()` — Toolbar 存在 `data-testid="redo-btn"` 的 DOM 节点 | 【需页面集成】DDSToolbar.tsx |
| F4.1.3 | `expect(screen.getByTestId('undo-btn')).toHaveAttribute('disabled')` — 当 `canvasHistoryStore.getState().canUndo === false` 时，undo 按钮 `disabled={true}` | 【需页面集成】DDSToolbar.tsx |

---

### Epic E5: Design Review E2E 补全

#### S5.1 降级路径 E2E 测试

| 功能点 | 验收标准（expect()） | 页面集成 |
|--------|----------------------|----------|
| F5.1.1 | `expect(screen.getByText(/AI 评审暂时不可用/i)).toBeInTheDocument()` — MCP 503 时降级文案显示 | 【需页面集成】design-review-degradation.spec.ts |
| F5.1.2 | `expect(response.status).toBe(503)` — mock MCP server 返回 503 状态码 | 无 |

#### S5.2 评审结果三 Tab E2E 验证

| 功能点 | 验收标准（expect()） | 页面集成 |
|--------|----------------------|----------|
| F5.2.1 | `expect(screen.getByRole('tab', { name: /compliance/i })).toBeInTheDocument()` — compliance tab 存在且可点击 | 【需页面集成】ReviewReportPanel |
| F5.2.2 | 切换到 reuse tab 后，`expect(screen.getByTestId('reuse-score')).toBeInTheDocument()` — reuse 评分卡片渲染 | 【需页面集成】ReviewReportPanel |

---

## 4. DoD (Definition of Done)

### 通用 DoD（所有 Story 必须满足）

- [ ] 代码已合并到 `main` 分支
- [ ] 所有新增/修改文件通过 ESLint（无 error）
- [ ] 单元测试新增用例通过（覆盖率不降低）
- [ ] `git diff` 不含 `console.log` / `TODO` / `FIXME` 残留
- [ ] TypeScript 类型检查通过（`tsc --noEmit`）
- [ ] 所有涉及页面的 Story specs/ 中包含四态定义（理想态/空状态/加载态/错误态）

### Epic E1 专用 DoD

- [ ] `DDSToolbar.tsx` 中 `<RemoteCursor />` 组件存在于 render 输出
- [ ] `RemoteCursor` 有条件守卫 `isFirebaseConfigured()`，未配置时不渲染
- [ ] `useRealtimeSync` hook 在 DDSCanvasPage 中被调用
- [ ] `presence-mvp.spec.ts` Firebase mock 模式下 E2E 测试 100% 通过
- [ ] RemoteCursor 位置更新延迟 < 3s（Firebase mock 模式验证）
- [ ] specs/e1-realtime-collab.md 包含四态定义（RemoteCursor + PresenceAvatars）

### Epic E2 专用 DoD

- [ ] `/api/templates/marketplace` 返回 HTTP 200，body 为 JSON
- [ ] 静态 JSON 数据包含 ≥ 3 个模板，字段完整（industry/description/tags/icon）
- [ ] `icon` 字段为非空 emoji 字符
- [ ] `/dashboard/templates` 存在 saas/mobile/ecommerce 三个 industry filter tab
- [ ] Industry filter 切换后模板列表正确更新
- [ ] 无数据时显示空状态引导文案（非空白）
- [ ] 加载态使用骨架屏（禁止转圈）
- [ ] specs/e2-template-market.md 包含四态定义（TemplateCard + IndustryFilter）

### Epic E3 专用 DoD

- [ ] `.github/workflows/test.yml` 包含 `Tool Index Sync` job
- [ ] job 使用 paths filter 配置（仅在 tool 文件变更时触发）
- [ ] `node scripts/generate-tool-index.ts && git diff --exit-code docs/mcp-tools/INDEX.md` 逻辑存在
- [ ] INDEX.md 失步时 CI exit code = 1

### Epic E4 专用 DoD

- [ ] `DDSToolbar.tsx` 存在 `data-testid="undo-btn"` 的 `<button>` 元素
- [ ] `DDSToolbar.tsx` 存在 `data-testid="redo-btn"` 的 `<button>` 元素
- [ ] Undo 按钮调用 `useCanvasHistoryStore.getState().undo()`
- [ ] Redo 按钮调用 `useCanvasHistoryStore.getState().redo()`
- [ ] 按钮 disabled 状态与 canUndo/canRedo 状态一致
- [ ] `Ctrl+Z` / `Ctrl+Shift+Z` 快捷键在 Toolbar 上线后仍正常工作
- [ ] specs/e4-toolbar-undo-redo.md 包含四态定义（UndoButton + RedoButton）

### Epic E5 专用 DoD

- [ ] `design-review-degradation.spec.ts` 存在且 E2E 测试通过
- [ ] MCP 503 时页面显示"AI 评审暂时不可用"文案（非白屏/非 500 错误）
- [ ] compliance / accessibility / reuse 三个 tab 均可切换且数据正确渲染
- [ ] Tab 切换不触发页面刷新（前端状态切换）
- [ ] specs/e5-design-review-e2e.md 包含四态定义（ReviewReportPanel）

---

## 5. 功能点汇总表

| ID | 功能点 | 描述 | 验收标准数 | 页面集成 | Epic |
|----|--------|------|------------|----------|------|
| F1.1.1 | RemoteCursor 挂载 | Canvas overlay 层渲染 RemoteCursor | 1 | 【需页面集成】DDSCanvasPage.tsx | E1 |
| F1.1.2 | remoteCursors 状态 | useRealtimeSync 返回远端光标数据 | 1 | 【需页面集成】useRealtimeSync | E1 |
| F1.1.3 | Cursor 位置同步 | 远端 cursor 事件更新 position | 1 | 【需页面集成】RemoteCursor.tsx | E1 |
| F1.2.1 | useRealtimeSync 导入 | DDSCanvasPage 导入 useRealtimeSync | 1 | 【需页面集成】DDSCanvasPage.tsx | E1 |
| F1.2.2 | 远程节点同步 | 本地 canvas 节点与远端数据同步 | 1 | 【需页面集成】useRealtimeSync | E1 |
| F1.3.1 | 多用户 RemoteCursor E2E | 双浏览器上下文场景验证 | 1 | 【需页面集成】presence-mvp.spec.ts | E1 |
| F1.3.2 | PresenceAvatars 显示 E2E | PresenceAvatars 显示其他用户名 | 1 | 【需页面集成】presence-mvp.spec.ts | E1 |
| F2.1.1 | Marketplace API | GET /api/templates/marketplace | 1 | 无 | E2 |
| F2.1.2 | 模板数据完整性 | ≥3 个模板，字段完整，icon 为 emoji | 1 | 无 | E2 |
| F2.2.1 | Industry Filter Tab | saas/mobile/ecommerce 三个 tab | 1 | 【需页面集成】/dashboard/templates/page.tsx | E2 |
| F2.2.2 | 模板卡片渲染 | 切换 tab 后有模板卡片显示 | 1 | 【需页面集成】/dashboard/templates/page.tsx | E2 |
| F2.2.3 | 非空容错 | 有数据时无空状态文案 | 1 | 【需页面集成】/dashboard/templates/page.tsx | E2 |
| F3.1.1 | CI Job 存在 | test.yml 包含 Tool Index Sync job | 1 | 无 | E3 |
| F3.1.2 | CI 检测能力 | INDEX.md 失步时 CI fail | 1 | 无 | E3 |
| F4.1.1 | Undo 按钮 | Toolbar 有 undo-btn | 1 | 【需页面集成】DDSToolbar.tsx | E4 |
| F4.1.2 | Redo 按钮 | Toolbar 有 redo-btn | 1 | 【需页面集成】DDSToolbar.tsx | E4 |
| F4.1.3 | Disabled 状态 | canUndo=false 时 disabled | 1 | 【需页面集成】DDSToolbar.tsx | E4 |
| F5.1.1 | 降级文案 | MCP 503 时显示降级文案 | 1 | 【需页面集成】design-review-degradation.spec.ts | E5 |
| F5.1.2 | 503 响应 Mock | mock MCP 返回 503 | 1 | 无 | E5 |
| F5.2.1 | Compliance Tab | compliance tab 存在可切换 | 1 | 【需页面集成】ReviewReportPanel | E5 |
| F5.2.2 | Reuse Tab 渲染 | reuse tab 切换后显示评分 | 1 | 【需页面集成】ReviewReportPanel | E5 |
| **合计** | | **21 功能点** | **21** | **14 需页面集成** | |

---

## 6. 依赖关系

```
E1 (多人协作 MVP)
├── Firebase RTDB 已配置（已验证）
├── RemoteCursor.tsx 组件存在（git: 5430f7394）
├── useRealtimeSync hook 存在（git: 7a54204f2）
└── PresenceAvatars 已挂载（DDSCanvasPage.tsx:673）

E2 (模板市场 MVP)
├── S35-P004 调研结论（静态 JSON 安全可行）
├── /dashboard/templates 页面存在
└── templateApi.getTemplates() 存在

E3 (MCP DoD CI Gate)
├── generate-tool-index.ts 已存在
├── docs/mcp-tools/INDEX.md 已存在
└── .github/workflows/test.yml 存在（需修改）

E4 (撤销重做 Toolbar)
├── useKeyboardShortcuts 已连接 canvasHistoryStore（git: 557fac1d5）
├── DDSToolbar.tsx 存在
└── Sprint 25 E5 RBAC disabled + tooltip pattern 已建立

E5 (Design Review E2E)
├── design-review-mcp.spec.ts 已存在
├── design-review.spec.ts 已存在
├── ReviewReportPanel 存在于 DDSCanvasPage
└── Sprint 19 critical fix 降级模式可复用
```

---

## 7. 执行摘要校验

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时）
- [x] 每个 Story 有可写的 expect() 断言
- [x] DoD 章节存在且具体（通用 DoD + 5 Epic 专用 DoD）
- [x] Planning 输出存在（docs/vibex-proposals-sprint36-dev/planning-output.md）
- [x] Epic 有本质需求穿透（神技1：剥洋葱）
- [x] Epic 有最小可行范围区分（神技2：极简主义）
- [x] 关键页面有用户情绪地图（神技3：老妈测试）
- [x] Specs 目录包含四态定义（specs/）
- [x] 页面集成标注存在（14 处【需页面集成】）

---

*本文档由 pm agent 基于 analyst 可行性分析报告和 Planning 输出编写*
*Planning 时间: 2026-05-11 21:00 GMT+8*
*PRD 版本: v1.0*
