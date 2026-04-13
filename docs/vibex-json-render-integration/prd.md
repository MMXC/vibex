# vibex-json-render-integration — PRD

**项目**: vibex-json-render-integration
**任务**: create-prd
**日期**: 2026-04-14
**作者**: PM Agent
**状态**: ✅ 完成
**基于**: analysis.md + planning.md

---

## 1. 执行摘要

### 背景

VibeX Canvas 的 `JsonRenderPreview` 用于将 Canvas 生成的组件树（ComponentNode[]）渲染为可预览的 UI。目前存在 4 类根因缺陷，导致嵌套组件无法渲染：

| # | 根因 | 位置 |
|---|------|------|
| R1 | catalog 容器组件缺少 `slots` 声明 | `catalog.ts` |
| R2 | `nodesToSpec()` 未使用 `parentId` 重建嵌套关系 | `JsonRenderPreview.tsx` |
| R3 | Registry `Page` 使用 `min-h-screen`，Modal 溢出 | `registry.tsx` |
| R4 | `emit` 事件和 `ActionProvider` 未实现 | `registry.tsx` + `JsonRenderPreview.tsx` |

### 目标

Phase 1（P0）：解决 schema 验证阻断和 parentId 嵌套失效，1d 交付。
Phase 2（P1）：完善交互能力和测试覆盖，1.75d 交付。

### 成功指标

- [ ] `catalog.ts` 中所有容器组件声明 `slots: ["default"]`
- [ ] 二层嵌套（parent → children）渲染正常，children 可见
- [ ] 多层嵌套（3+ 层）渲染正常
- [ ] Preview Modal 中 Page 组件不溢出，内容正确可见
- [ ] `pnpm build` 通过
- [ ] `nodesToSpec` 单元测试覆盖单节点/嵌套/parentId 一致性
- [ ] E2E 测试覆盖嵌套渲染场景

---

## 2. Epic 拆分

### Epic 1 — 阻断性修复（Phase 1，P0）

**目标**: 解决 schema 验证阻断和 parentId 嵌套失效

| Story ID | 功能点 | 描述 | 工时 | 验收标准 |
|----------|--------|------|------|----------|
| S1.1 | catalog slots 补全 | Page/Form/DataTable/DetailView/Modal 添加 `slots: ["default"]` | 0.25d | 见 3.1 |
| S1.2 | nodesToSpec parentId 转换 | 修复转换逻辑，使用 parentId 映射重建嵌套关系 | 0.5d | 见 3.2 |
| S1.3 | Registry Page 尺寸修复 | 移除 `min-h-screen`，适配 Preview Modal 容器 | 0.25d | 见 3.3 |

### Epic 2 — 功能增强（Phase 2，P1）

**目标**: 完善交互能力和测试覆盖

| Story ID | 功能点 | 描述 | 工时 | 验收标准 |
|----------|--------|------|------|----------|
| S2.1 | ActionProvider 实现 | emit 事件触发，handlers 响应，Button hover 视觉反馈 | 0.5d | 见 3.4 |
| S2.2 | Preview Modal 尺寸适配 | Modal 高度自适应，内容可滚动 | 0.25d | 见 3.5 |
| S2.3 | nodesToSpec 单元测试 | 4 类场景覆盖（单节点/二层嵌套/三层嵌套/parentId 一致性） | 0.5d | 见 3.6 |
| S2.4 | E2E 嵌套渲染覆盖 | E2E 覆盖嵌套组件渲染，点击预览后内容可见 | 0.5d | 见 3.7 |

---

## 3. 验收标准（expect() 断言）

### S1.1 — catalog slots 补全

| 页面集成 | 否（catalog 数据层） |
|----------|----------------------|

**Given** `catalog.ts` 中所有容器组件均已声明 `slots`
**When** `pnpm tsc --noEmit` 执行
**Then** `expect(exitCode).toBe(0)`（类型检查通过）

**Given** catalog 中 Page 组件声明了 `slots: ["default"]`
**When** json-render 尝试将含 children 的 Page spec 传入 Renderer
**Then** schema 验证通过，children 被正确传入组件

**Given** catalog 中 Form 组件声明了 `slots: ["default"]`
**When** Form 内部渲染子组件
**Then** schema 验证通过，子组件正确渲染

---

### S1.2 — nodesToSpec parentId 转换

| 页面集成 | 是（JsonRenderPreview） |
|----------|------------------------|

**Test 1 — 单节点渲染**
**Given** ComponentNode 数组仅含一个节点（无 parentId，无 children）
**When** `nodesToSpec(nodes)` 执行
**Then** `expect(result.elements[result.root]).toMatchObject({ type: expect.any(String), props: expect.any(Object) })`

**Test 2 — 二层嵌套渲染**
**Given** ComponentNode 数组含 parent 和 child：`[{ nodeId: "p1", type: "Page", parentId: null }, { nodeId: "c1", type: "Button", parentId: "p1" }]`
**When** `nodesToSpec(nodes)` 执行
**Then** `expect(result.elements["p1"].children).toContain("c1")`

**Test 3 — 三层嵌套渲染**
**Given** ComponentNode 数组含 grandparent → parent → child 三层嵌套
**When** `nodesToSpec(nodes)` 执行
**Then** `expect(result.elements[parentId].children).toContain(childId)`，每层均正确映射

**Test 4 — parentId / children 一致性**
**Given** ComponentNode 数组含 parent（children: ["c1"]）和 child（parentId: "p1"）
**When** `nodesToSpec(nodes)` 执行
**Then** `expect(result.elements["p1"].children).toEqual(expect.arrayContaining(["c1"]))`

**Test 5 — Playwright 端到端**
**Given** Canvas 中已添加 Page 内含 Button 的组件树
**When** 用户点击 Preview 按钮打开 JsonRenderPreview Modal
**Then** `expect(screen.queryByRole("button", { name: /button/i })).toBeInTheDocument()`

---

### S1.3 — Registry Page 尺寸修复

| 页面集成 | 是（JsonRenderPreview / registry.tsx） |
|----------|----------------------------------------|

**Given** 用户打开 Preview Modal，Page 组件已渲染
**When** Modal 容器高度固定（如 80vh）
**Then**
- `expect(modalContainer.queryByRole("button")).toBeInTheDocument()`（内容可见）
- `expect(modalContainer.queryByText(expect.any(String))).toBeInTheDocument()`（Page title 可见）

**Given** Page 组件移除 `min-h-screen`
**When** Page 内部有短内容时
**Then** `expect(PageContainer.classList).not.toContain("min-h-screen")`

---

### S2.1 — ActionProvider 实现

| 页面集成 | 是（JsonRenderPreview / registry.tsx） |
|----------|----------------------------------------|

**Given** Button 组件调用 `emit("press")`
**When** `emit` 被触发
**Then** `expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: "press" }))`

**Given** ActionProvider handlers 包含 press action
**When** Button 被点击
**Then** `expect(screen.queryByRole("button")).toBeVisible()`

**Given** Button 在 Preview 中渲染
**When** 用户 hover 到 Button
**Then** `expect(button).toHaveClass(expect.stringContaining("hover"))` 或等效视觉反馈

---

### S2.2 — Preview Modal 尺寸适配

| 页面集成 | 是（CanvasPreviewModal） |
|----------|-------------------------|

**Given** Preview Modal 打开，Page 内容超出一屏
**When** 用户滚动 Modal 容器
**Then** `expect(modalContent.queryByRole("article")).toBeInTheDocument()`（内容可滚动访问）

**Given** Preview Modal 有大量内容
**When** Modal 渲染完成
**Then** `expect(modalContainer.scrollHeight).toBeGreaterThan(modalContainer.clientHeight)`（溢出时有滚动条）

---

### S2.3 — nodesToSpec 单元测试

| 页面集成 | 否（单元测试层） |
|----------|------------------|

**Test File**: `src/__tests__/JsonRenderPreview.test.tsx` 或同目录 `nodesToSpec.test.ts`

| 场景 | 断言 |
|------|------|
| 单节点 | `elements[root].type === node.type` |
| 二层嵌套 | `parent.children contains child.id` |
| 三层嵌套 | `each level children relationship correct` |
| parentId / children 一致 | `parent.children === nodes.filter(c => c.parentId === parent.id).map(c => c.nodeId)` |

---

### S2.4 — E2E 嵌套渲染覆盖

| 页面集成 | 是（Playwright E2E） |
|----------|----------------------|

**E2E Test 1 — 嵌套渲染可见性**
- Navigate to canvas
- Add Page component with Button child
- Click "Preview" button
- Expect: Modal opens, Page title visible, Button visible

**E2E Test 2 — 多层嵌套渲染**
- Navigate to canvas
- Add Page → Form → Button 三层结构
- Open Preview Modal
- Expect: All three levels visible

**E2E Test 3 — 多 Button 渲染**
- Navigate to canvas
- Add Page with 2+ Button children
- Open Preview Modal
- Expect: All buttons visible, count matches

---

## 4. 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | catalog slots 补全 | 为所有容器组件添加 slots 声明 | tsc --noEmit 通过 | 否 |
| F1.2 | nodesToSpec parentId 转换 | parentId 映射重建嵌套关系 | 嵌套渲染可见 + 单元测试通过 | 【需页面集成】 |
| F1.3 | Registry Page 尺寸修复 | 移除 min-h-screen | Modal 中内容不溢出 | 【需页面集成】 |
| F2.1 | ActionProvider 实现 | emit 事件触发，handlers 响应 | emit 被调用 + hover 反馈 | 【需页面集成】 |
| F2.2 | Preview Modal 尺寸适配 | 高度自适应，溢出可滚动 | 滚动正常，内容可访问 | 【需页面集成】 |
| F2.3 | nodesToSpec 单元测试 | 4 类场景覆盖 | 全部测试通过 | 否 |
| F2.4 | E2E 嵌套渲染覆盖 | E2E 覆盖嵌套场景 | 全部 E2E 通过 | 【需页面集成】 |

---

## 5. DoD (Definition of Done)

### Epic 1 Stories

**S1.1 完成标准**：
- [ ] `catalog.ts` 中 Page、Form、DataTable、DetailView、Modal 均声明 `slots: ["default"]`
- [ ] `pnpm tsc --noEmit` 通过
- [ ] json-render schema 验证通过（children 不再静默失败）

**S1.2 完成标准**：
- [ ] `nodesToSpec()` 使用 parentId 映射重建 children 关系
- [ ] 二层嵌套渲染测试通过
- [ ] 三层嵌套渲染测试通过
- [ ] parentId / children 一致性断言通过
- [ ] Playwright E2E 验证嵌套渲染可见

**S1.3 完成标准**：
- [ ] `registry.tsx` 中 Page 组件移除 `min-h-screen`
- [ ] Page 改为 `min-h-full` 或移除固定高度约束
- [ ] Preview Modal 中 Page 标题和内容可见

### Epic 2 Stories

**S2.1 完成标准**：
- [ ] `emit` 事件有 handler 响应（至少 console.log）
- [ ] ActionProvider handlers 包含可触发 action
- [ ] Button hover 有 CSS 视觉反馈（不崩溃）

**S2.2 完成标准**：
- [ ] CanvasPreviewModal 高度自适应或 max-height 限制
- [ ] 内容溢出时有滚动条，内容可访问
- [ ] `pnpm build` 通过

**S2.3 完成标准**：
- [ ] `nodesToSpec()` 单元测试文件存在
- [ ] 4 类测试场景全部通过（单节点/二层嵌套/三层嵌套/parentId 一致性）
- [ ] `pnpm test` 通过

**S2.4 完成标准**：
- [ ] E2E 测试文件追加或创建（`json-render-preview-nested.spec.ts`）
- [ ] 3 个 E2E 场景全部通过
- [ ] E2E 在 CI 中运行

---

## 6. 驳回校验

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言
- [x] DoD 章节存在且具体
- [x] 功能点模糊，无法写 expect() → 已细化到渲染可见性 + API 调用断言
- [x] 涉及页面但未标注【需页面集成】→ 已标注（JsonRenderPreview、CanvasPreviewModal、registry）
- [x] 已执行 Planning（Feature List + Epic/Story）

---

## 7. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-json-render-integration
- **执行日期**: 2026-04-14
- **Phase 1**: P0 阻断性修复（1d）：S1.1–S1.3
- **Phase 2**: P1 功能增强（1.75d）：S2.1–S2.4

---

*PM Agent — 2026-04-14*
