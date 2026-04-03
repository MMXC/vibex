# PRD: 流程树编辑功能增强

**项目**: vibex-canvas-flowtree-edit-20260328  
**版本**: 1.0  
**日期**: 2026-03-28  
**Owner**: PM  

---

## 1. 背景与目标

**背景**: 现有 `BusinessFlowTree` 组件（`src/components/canvas/BusinessFlowTree.tsx`）支持流程 CRUD，但存在以下问题：
1. **缺少新增流程入口**: 工具栏虽有「+ 添加流程」按钮，但依赖 `contextNodes.length > 0` 条件，未考虑零上下文场景
2. **缺少新增步骤入口**: `FlowCard` 展开后步骤列表底部无「添加步骤」按钮，用户需通过编辑已有步骤间接新增
3. **节点样式不统一**: `FlowNodes.tsx`（React Flow 画布用，深色主题）与 `canvas.module.css`（树形列表用，浅色主题）视觉语言不一致

**目标**: 
- F1: 支持新增独立流程（不依赖上下文树）
- F2: 支持在流程卡片内直接新增 FlowStep
- F3: 统一流程节点的视觉样式标准

---

## 2. Epic & Story 拆分

### Epic: E1 — 流程树编辑增强

| Epic | 描述 | 优先级 | 故事数 |
|------|------|--------|--------|
| E1 | 流程树编辑增强 | P1 | 3 |

---

### Story 1: S1.1 — 新增独立流程入口

**描述**: 在流程树面板工具栏提供「+ 添加流程」按钮，允许用户在任意状态下新增一个空流程，不强制要求先有上下文节点。

**验收标准**:

| ID | 验收项 | 断言写法（Vitest/Jest） |
|----|--------|------------------------|
| S1.1-AC1 | 点击「+ 添加流程」按钮后，流程列表中新增一项 | `expect(screen.getAllByTestId('flow-card').length).toBeGreaterThan(0)` |
| S1.1-AC2 | 新增流程默认名称为「新建流程」或自动生成名称 | `expect(flowNodes[flowNodes.length-1].name).toMatch(/流程/)` |
| S1.1-AC3 | 新增流程 `status === 'pending'`，`confirmed === false` | `expect(lastFlow.status).toBe('pending'); expect(lastFlow.confirmed).toBe(false)` |
| S1.1-AC4 | 零上下文状态（`contextNodes.length === 0`）下仍可新增流程 | `expect(canvasStore.getState().contextNodes.length).toBe(0); fireEvent.click(btn); expect(flowNodes.length).toBe(1)` |
| S1.1-AC5 | 新增后流程卡片自动展开显示步骤列表 | `expect(flowCard).toHaveAttribute('aria-expanded', 'true')` |

**DoD**:
- [ ] store `addFlowNode` 可接受无 `contextId` 参数（或 `contextId = null`）
- [ ] `BusinessFlowTree` 工具栏按钮移除 `canManualAdd` 条件
- [ ] 测试覆盖零上下文场景
- [ ] 端到端测试覆盖新增流程完整流程

**技术方案**: 
- 修改 `canvasStore.addFlowNode` 支持 `contextId?: string`（可选）
- 修改 `BusinessFlowTree.handleManualAdd`，移除 `canManualAdd` 条件判断

**页面集成**: 【需页面集成】`src/components/canvas/BusinessFlowTree.tsx` — 工具栏「+ 添加流程」按钮

---

### Story 2: S1.2 — 流程内新增步骤

**描述**: 在 `FlowCard` 展开的步骤列表底部显示「+ 添加步骤」按钮，允许用户直接向当前流程添加新步骤。

**验收标准**:

| ID | 验收项 | 断言写法 |
|----|--------|----------|
| S1.2-AC1 | 展开流程卡片后，步骤列表底部显示「添加步骤」按钮 | `expect(screen.getByText('+ 添加步骤')).toBeInTheDocument()` |
| S1.2-AC2 | 点击「添加步骤」后，步骤列表增加一项，步骤 `name` 为空或默认占位文本 | `expect(screen.getAllByTestId('step-row').length).toBe(prevCount + 1)` |
| S1.2-AC3 | 新增步骤自动进入编辑模式（显示输入框） | `expect(screen.getByPlaceholderText('步骤名称')).toBeInTheDocument()` |
| S1.2-AC4 | 新增步骤默认 `confirmed === false`，`status === 'pending'` | `expect(lastStep.confirmed).toBe(false); expect(lastStep.status).toBe('pending')` |
| S1.2-AC5 | 新增步骤 `actor` 字段默认填充为空或当前用户 | `expect(lastStep.actor).toBeDefined()` |
| S1.2-AC6 | 步骤列表为空时，点击「添加步骤」直接新增第一项 | `expect(screen.getAllByTestId('step-row').length).toBe(1)` |

**DoD**:
- [ ] `FlowCard` 组件在 `expanded === true` 且 `readonly === false` 时渲染「添加步骤」按钮
- [ ] 点击按钮触发 `addStepToFlow(node.nodeId)` store action
- [ ] 新增步骤自动获得焦点（`autoFocus`）进入编辑状态
- [ ] 测试覆盖空步骤列表和已有步骤列表两种场景
- [ ] E2E 测试覆盖完整添加步骤流程

**技术方案**:
- 在 `FlowCard.stepsList` 底部添加「添加步骤」按钮
- 新增 `addStepToFlow(flowNodeId: string)` store action，参数包括默认 name/actor
- 新增步骤自动触发编辑状态

**页面集成**: 【需页面集成】`src/components/canvas/BusinessFlowTree.tsx` — `FlowCard` 组件内 `stepsList` 底部

---

### Story 3: S1.3 — 流程节点样式标准化

**描述**: 审查并统一 `BusinessFlowTree` 中流程卡片和步骤行的视觉样式，确保与产品设计语言一致。

**当前样式问题**:
- `canvas.module.css` 中 `flowCard` / `stepRow` 使用浅色边框（pending=黄色、confirmed=绿色、error=红色）
- `FlowNodes.tsx`（React Flow 画布）使用深色背景节点
- 两套样式服务不同视图，**无需合并**，但需各自符合设计规范

**验收标准**:

| ID | 验收项 | 断言写法 |
|----|--------|----------|
| S1.3-AC1 | `stepRow` pending 状态：边框为 `#f59e0b`（amber），背景透明或 `#fffbeb` | `expect(getComputedStyle(el).borderColor).toBe('rgb(245, 158, 11)')` |
| S1.3-AC2 | `stepRow` confirmed 状态：边框为 `#10b981`（emerald），背景透明或 `#ecfdf5` | `expect(getComputedStyle(el).borderColor).toBe('rgb(16, 185, 129)')` |
| S1.3-AC3 | `stepRow` error 状态：边框为 `#ef4444`（red），背景透明或 `#fef2f2` | `expect(getComputedStyle(el).borderColor).toBe('rgb(239, 68, 68)')` |
| S1.3-AC4 | `flowCard` 状态样式与 `stepRow` 保持视觉一致性（颜色映射一致） | `expect(flowCardBorder).toBe(stepRowBorder)` |
| S1.3-AC5 | `nodeConfirmed` / `nodeError` / `nodePending` CSS 类在 `canvas.module.css` 中定义 | `expect(styles.nodeConfirmed).toBeDefined()` |
| S1.3-AC6 | 工具提示（`title`）使用中文 | `expect(btn).toHaveAttribute('title', '添加步骤')` |

**DoD**:
- [ ] 审查 `canvas.module.css` 中所有节点状态颜色是否符合设计规范
- [ ] `stepRow` 和 `flowCard` 状态边框颜色一致
- [ ] `FlowNodes.tsx` 深色主题保持独立，不受影响
- [ ] 截图对比审查（gstack browse before/after）

**技术方案**:
- 审查 `canvas.module.css` 第 422-430 行（nodeConfirmed/Error）和第 1127-1148 行（stepRow状态）
- 不修改 React Flow 的 `FlowNodes.tsx` 深色主题（服务不同视图）
- 如需调整，在 `canvas.module.css` 中修正颜色值

**页面集成**: 【需页面集成】`src/components/canvas/canvas.module.css` — 节点样式定义

---

## 3. 优先级矩阵

| Story | 功能 | 优先级 | 工作量 | ROI |
|-------|------|--------|--------|-----|
| S1.1 | 新增独立流程入口 | P1 | 1h | 高 |
| S1.2 | 流程内新增步骤 | P1 | 1.5h | 高 |
| S1.3 | 节点样式标准化 | P2 | 1h | 中 |

**实施顺序**: S1.1 → S1.2 → S1.3

---

## 4. DoD (Definition of Done)

全部 Story 完成的 DoD：

- [ ] 所有功能点通过上述 AC 测试
- [ ] 单元测试覆盖率 ≥ 80%（`addFlowNode`, `addStepToFlow` 相关）
- [ ] E2E 测试覆盖完整用户流程
- [ ] gstack browse 截图验证 UI 效果
- [ ] Code Review 通过
- [ ] 无 console.error

---

## 5. 技术依赖

| 依赖 | 说明 |
|------|------|
| `src/lib/canvas/canvasStore.ts` | store 层，需新增 `addStepToFlow` action |
| `src/components/canvas/BusinessFlowTree.tsx` | UI 层，需修改 `handleManualAdd` 和 `FlowCard` |
| `src/components/canvas/canvas.module.css` | 样式层，需审查节点颜色 |

---

## 6. 非功能要求

| 类别 | 要求 |
|------|------|
| 性能 | 新增节点操作 < 50ms 响应 |
| 可访问性 | 所有按钮有 `aria-label` 或 `title` |
| 国际化 | 中文标题占位符，「添加流程」/「添加步骤」 |

---

## 7. 验收总览

| Feature ID | 功能点 | 描述 | 验收标准数 | 页面集成 |
|------------|--------|------|-----------|----------|
| F1.1 | 新增独立流程入口 | 支持在任意状态添加流程 | 5 | ✅ |
| F1.2 | 流程内新增步骤 | 流程卡片内直接添加步骤 | 6 | ✅ |
| F1.3 | 节点样式标准化 | 统一流程节点视觉样式 | 6 | ✅ |

---

*本文档由 PM Agent 生成，基于 `analyze-requirements` 产出物*
