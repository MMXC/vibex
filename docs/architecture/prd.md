# PRD: VibeX Canvas 架构演进路线图

> **项目**: vibex-canvas-evolution-roadmap  
> **版本**: 1.0.0  
> **日期**: 2026-03-29  
> **PM**: Product Manager Agent  
> **状态**: Draft → Ready for Review  
> **参考文档**: `docs/architecture/analysis.md`, `vibex-canvas-evolution.md` (Architect)

---

## 1. Executive Summary

### 1.1 Background

本周 Architect 产出 5 份独立 ADR（bc-layout、checkbox、expand-dir、flow-card、import-nav），分别解决 Canvas 样式/交互的散点问题。这 5 份 ADR 各自独立，缺乏统一的演进视图，导致 Dev 实施时需要拼凑多份文档，无法评估全局依赖和工时。

**根本原因**：
- Canvas 模块经历了渐进式开发，样式和交互规则未提前固化
- CSS 变量散落在各 `.module.css` 文件中
- 类型定义（`domainType`、`FlowStepType`）未统一建模
- 交互状态分散在多个局部状态，无统一 Store 抽象

### 1.2 Goals

| 目标 | 描述 | 优先级 |
|------|------|--------|
| **G1** | 建立统一 CSS 变量系统，消除样式散落 | P0 |
| **G2** | 修复导入导航 404 问题，提升可用性 | P0 |
| **G3** | 实现三栏双向展开交互，提升操作效率 | P1 |
| **G4** | 实现批量勾选、拖拽排序等交互增强 | P1 |
| **G5** | 构建 ReactFlow 统一渲染层，支持可视化平台 | P2 |
| **G6** | 建立导出与插件系统，支持多格式输出 | P3 |

### 1.3 Success Metrics

| 指标 | 当前基线 | 目标值 | 测量方式 |
|------|---------|--------|---------|
| **Canvas 测试覆盖率** | ~60% | > 80% | `pnpm coverage` |
| **Console Errors** | 多处 | = 0 | gstack canary 24h |
| **导入导航成功率** | ~70% | 100% | Playwright E2E |
| **深色模式适配率** | 部分 | 100% | Playwright 深色模式截图 |
| **localStorage 大小** | 未限制 | < 5MB | Vitest 存储大小测试 |
| **展开动画流畅度** | 无动画 | 0.3s ease | Playwright 动画检测 |

### 1.4 Key Dependencies

- **外部依赖**: `@dnd-kit/core` (Phase 2), `reactflow` (Phase 3)
- **内部依赖**: canvasStore (Phase 1), 样式系统 (Phase 2), 交互基础设施 (Phase 3)

---

## 2. Epic Breakdown

---

### Epic 1: Phase 1 — 样式统一 + 导航修复

**Epic ID**: EP-001  
**名称**: Style Unification & Navigation Fix  
**优先级**: P0  
**工时**: ~15-20h  
**目标**: 建立统一 CSS 变量系统，修复导入导航 404，统一 checkbox 样式，修复流程卡片虚线渲染  
**对应 JTBD**: JTBD 1 (快速验证 DDD 建模结果) + JTBD 3 (专业一致的视觉品质)

---

#### Story 1.1: 限界上下文领域分组虚线框

**Story ID**: US-1.1  
**As a** 开发者 / 技术负责人  
**I want** 限界上下文按领域类型（core/supporting/generic/external）自动分组渲染  
**So that** 画布展示逻辑清晰，无需手动调整分组

**Acceptance Criteria**:

```typescript
// AC-1.1.1: 4种领域类型均有不同颜色虚线框
expect(screen.queryByTestId('domain-group-core')).toBeInTheDocument();
expect(screen.queryByTestId('domain-group-supporting')).toBeInTheDocument();
expect(screen.queryByTestId('domain-group-generic')).toBeInTheDocument();
expect(screen.queryByTestId('domain-group-external')).toBeInTheDocument();
const coreBox = screen.getByTestId('domain-group-core');
const supportingBox = screen.getByTestId('domain-group-supporting');
expect(coreBox).not.toEqual(supportingBox); // 颜色/样式不同

// AC-1.1.2: 空分组不渲染 DOM
expect(screen.queryByTestId('domain-group-generic')).toBeNull(); // 无 generic 类型节点时

// AC-1.1.3: 深色模式自适应
const lightBox = getComputedStyle(screen.getByTestId('domain-group-core')).borderColor;
await page.emulateMedia({ colorScheme: 'dark' });
const darkBox = getComputedStyle(screen.getByTestId('domain-group-core')).borderColor;
expect(darkBox).not.toEqual(lightBox); // 深色模式下颜色变化
```

---

#### Story 1.2: CSS Checkbox 统一样式

**Story ID**: US-1.2  
**As a** 所有用户  
**I want** 三栏树组件（ComponentSelectionStep / NodeSelector / BoundedContextTree）使用统一 checkbox 样式  
**So that** 视觉体验一致，无 emoji 跨平台渲染差异

**Acceptance Criteria**:

```typescript
// AC-1.2.1: 3个组件均使用统一的 .checkbox 样式类
const componentSelectionCheckbox = screen.getByTestId('component-checkbox-1');
const nodeSelectorCheckbox = screen.getByTestId('node-checkbox-1');
const bcTreeCheckbox = screen.getByTestId('bc-checkbox-1');
expect(componentSelectionCheckbox.className).toContain('checkbox');
expect(nodeSelectorCheckbox.className).toContain('checkbox');
expect(bcTreeCheckbox.className).toContain('checkbox');
expect(componentSelectionCheckbox.className).toEqual(nodeSelectorCheckbox.className);

// AC-1.2.2: 无 emoji 渲染（✓○× 使用 SVG 或 Unicode）
const checkbox = screen.getByTestId('component-checkbox-1');
expect(checkbox.textContent).not.toMatch(/[✓○×]/);

// AC-1.2.3: aria 属性完整，支持屏幕阅读器
expect(checkbox).toHaveAttribute('role', 'checkbox');
expect(checkbox).toHaveAttribute('aria-checked');
```

---

#### Story 1.3: 流程卡片虚线边框 + 步骤类型图标

**Story ID**: US-1.3  
**As a** 业务分析师 / 产品经理  
**I want** BusinessFlowTree 的流程卡片使用虚线边框，分支/循环步骤有对应图标标识  
**So that** 流程图视觉效果专业，步骤类型一目了然

**Acceptance Criteria**:

```typescript
// AC-1.3.1: .flowCard 边框为虚线
const flowCard = screen.getByTestId('flow-card-step-1');
const borderStyle = getComputedStyle(flowCard).borderStyle;
expect(borderStyle).toBe('dashed');

// AC-1.3.2: 分支步骤显示 🔀 图标
const branchCard = screen.getByTestId('flow-card-branch-1');
expect(branchCard.querySelector('[data-step-type="branch"]')).toBeInTheDocument();

// AC-1.3.3: 循环步骤显示 🔁 图标
const loopCard = screen.getByTestId('flow-card-loop-1');
expect(loopCard.querySelector('[data-step-type="loop"]')).toBeInTheDocument();

// AC-1.3.4: FlowStepType 类型定义完整
expect(FlowStepType).toEqual(expect.objectContaining({
  NORMAL: 'normal',
  BRANCH: 'branch',
  LOOP: 'loop'
}));
```

---

#### Story 1.4: 导入导航修复

**Story ID**: US-1.4  
**As a** 开发者  
**I want** 导入示例后点击任意节点可 100% 跳转，不存在的节点显示友好提示  
**So that** 零等待体验，无需手动调试

**Acceptance Criteria**:

```typescript
// AC-1.4.1: 导入示例后点击任意节点 100% 可跳转
await page.click('[data-testid="import-example-btn"]');
await page.waitForTimeout(1000); // 等待导入完成
const nodes = await page.$$('[data-testid^="canvas-node-"]');
for (const node of nodes) {
  await node.click();
  await expect(page).not.toHaveSelector('[data-testid="error-404"]');
}

// AC-1.4.2: 不存在的节点 → 友好提示（非白屏/404）
await page.evaluate(() => {
  window.__testNavigateToNode('non-existent-node-id');
});
await expect(page).toHaveSelector('[data-testid="node-not-found-message"]');
const errorMsg = screen.getByTestId('node-not-found-message');
expect(errorMsg).toHaveTextContent(/节点不存在|Node not found/i);

// AC-1.4.3: /preview 路由正常渲染
await page.goto('/preview?node=example-component-1');
await expect(page).toHaveSelector('[data-testid="preview-panel"]');
```

---

#### Story 1.5: 统一 CSS 变量系统

**Story ID**: US-1.5  
**As a** 开发者  
**I want** 所有 Canvas 组件使用统一的 CSS 变量系统  
**So that** 后续组件开发有章可循，深色模式一次适配全局生效

**Acceptance Criteria**:

```typescript
// AC-1.5.1: CSS 变量定义在统一的 :root 或 [data-theme] 下
const rootStyles = await page.evaluate(() => {
  const root = document.documentElement;
  return getComputedStyle(root).getPropertyValue('--vibex-canvas-primary');
});
expect(rootStyles.trim()).not.toBe('');

// AC-1.5.2: 所有组件使用 CSS 变量而非硬编码颜色
const components = ['BoundedContextTree', 'ComponentTree', 'BusinessFlowTree'];
for (const comp of components) {
  const styles = await page.evaluate((c) => {
    const el = document.querySelector(`[data-component="${c}"]`);
    return el ? getComputedStyle(el).color : null;
  }, comp);
  expect(styles).toMatch(/var\(--|--vibex-/); // 包含 CSS 变量引用
}

// AC-1.5.3: Canvas 测试覆盖率 > 80%
const coverage = await page.evaluate(() => window.__COVERAGE__);
expect(coverage.canvas).toBeGreaterThan(80);
```

---

#### Definition of Done (Epic 1)

| # | DoD Item | Verification |
|---|----------|--------------|
| D1 | 4种领域类型虚线框正确渲染，颜色各异 | Playwright 截图对比 |
| D2 | 空分组不渲染 DOM | Vitest `queryByTestId` → null |
| D3 | 深色模式自适应 | Playwright 深色模式截图 |
| D4 | 3个组件 checkbox 样式完全一致 | Vitest className 对比 |
| D5 | .flowCard 边框为虚线 | Vitest + Jest DOM |
| D6 | 分支/循环步骤有对应图标 | Testing Library 断言 |
| D7 | 导入示例后点击任意节点 100% 可跳转 | Playwright E2E |
| D8 | 不存在节点显示友好提示 | Playwright E2E |
| D9 | Canvas 测试覆盖率 > 80% | `pnpm coverage` |
| D10 | Console errors = 0 | gstack canary 24h |

---

### Epic 2: Phase 2 — 交互增强 + 可用性基础

**Epic ID**: EP-002  
**名称**: Interaction Enhancement & Usability Foundation  
**优先级**: P1  
**工时**: ~20-28h  
**目标**: 实现三栏双向展开、画布数据持久化、批量勾选清空、组件树拖拽排序  
**对应 JTBD**: JTBD 2 (流畅的多任务画布操作体验)

---

#### Story 2.1: 三栏画布双向展开

**Story ID**: US-2.1  
**As a** 业务分析师 / 产品经理  
**I want** 中间面板可向左右双向展开，expand-both 时 canvas 占 3fr  
**So that** 专注编辑某一栏时不被其他栏干扰

**Acceptance Criteria**:

```typescript
// AC-2.1.1: 中间面板可向左右双向展开
const expandBtn = screen.getByTestId('expand-center-btn');
await expandBtn.click();
const layout = screen.getByTestId('canvas-layout');
expect(layout).toHaveAttribute('data-expand-direction', 'right');

// 点击左侧展开按钮
const expandLeftBtn = screen.getByTestId('expand-left-btn');
await expandLeftBtn.click();
expect(layout).toHaveAttribute('data-expand-direction', 'left');

// AC-2.1.2: expand-both 时 canvas 占 3fr，两侧面板隐藏
await screen.getByTestId('expand-both-btn').click();
expect(layout).toHaveAttribute('data-expand-direction', 'both');
const leftPanel = screen.queryByTestId('left-panel');
const rightPanel = screen.queryByTestId('right-panel');
expect(leftPanel).not.toBeVisible();
expect(rightPanel).not.toBeVisible();
const canvasArea = screen.getByTestId('canvas-area');
const canvasGridColumn = getComputedStyle(canvasArea).gridColumn;
expect(canvasGridColumn).toBe('1 / -1'); // 占满整行

// AC-2.1.3: 展开动画平滑 (0.3s ease)
const animationDuration = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="canvas-panel"]');
  const style = getComputedStyle(el);
  return parseFloat(style.transitionDuration);
});
expect(animationDuration).toBeGreaterThanOrEqual(0.25);
expect(animationDuration).toBeLessThanOrEqual(0.35);

// AC-2.1.4: 移动端 (< 768px) 禁用 expand-both
await page.setViewportSize({ width: 375, height: 812 });
const expandBothBtn = screen.queryByTestId('expand-both-btn');
expect(expandBothBtn).toBeDisabled();
```

---

#### Story 2.2: 画布数据持久化

**Story ID**: US-2.2  
**As a** 用户  
**I want** 刷新页面后三棵树数据完整，localStorage 存储 < 5MB  
**So that** 无需重复配置，画布状态持久化

**Acceptance Criteria**:

```typescript
// AC-2.2.1: 刷新页面后三棵树数据完整
const initialNodes = await page.$$('[data-testid^="canvas-node-"]');
const initialCount = initialNodes.length;
await page.reload();
await page.waitForSelector('[data-testid="canvas-layout"]');
const nodesAfterReload = await page.$$('[data-testid^="canvas-node-"]');
expect(nodesAfterReload.length).toEqual(initialCount);

// AC-2.2.2: localStorage 存储 < 5MB
const storageSize = await page.evaluate(() => {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    total += key.length + value.length;
  }
  return total;
});
expect(storageSize).toBeLessThan(5 * 1024 * 1024);

// AC-2.2.3: 状态不一致时自动修复（向后兼容）
await page.evaluate(() => {
  localStorage.setItem('vibex-canvas-state', JSON.stringify({
    nodes: [{ id: '1', type: 'context' }],
    panels: { left: true, right: true } // 旧版格式
  }));
});
await page.reload();
await page.waitForSelector('[data-testid="canvas-layout"]');
const layout = screen.getByTestId('canvas-layout');
expect(layout).toHaveAttribute('data-expand-direction'); // 新版格式字段存在
```

---

#### Story 2.3: 组件树批量勾选/清空

**Story ID**: US-2.3  
**As a** 业务分析师  
**I want** 批量勾选/清空画布节点，清空前有二次确认弹窗  
**So that** 减少重复操作，提升效率

**Acceptance Criteria**:

```typescript
// AC-2.3.1: 批量勾选正常
const checkboxes = await page.$$('[data-testid^="component-checkbox-"]');
const selectAllBtn = screen.getByTestId('select-all-btn');
await selectAllBtn.click();
for (const cb of checkboxes) {
  expect(cb).toHaveAttribute('aria-checked', 'true');
}

// AC-2.3.2: 批量清空前有二次确认弹窗
const clearAllBtn = screen.getByTestId('clear-all-btn');
let dialogShown = false;
page.on('dialog', async (dialog) => {
  dialogShown = true;
  expect(dialog.message()).toMatch(/确认|confirm/i);
  await dialog.accept();
});
await clearAllBtn.click();
expect(dialogShown).toBe(true);

// AC-2.3.3: 清空后所有 checkbox 为 unchecked
await page.waitForTimeout(100);
const checkboxesAfterClear = await page.$$('[data-testid^="component-checkbox-"]');
for (const cb of checkboxesAfterClear) {
  expect(cb).toHaveAttribute('aria-checked', 'false');
}
```

---

#### Story 2.4: 组件树拖拽排序

**Story ID**: US-2.4  
**As a** 开发者  
**I want** 组件树节点可拖拽排序，排序后 order 字段正确更新  
**So that** 直观调整节点顺序，无需手动编辑 JSON

**Acceptance Criteria**:

```typescript
// AC-2.4.1: 节点可拖拽
const node1 = screen.getByTestId('component-node-1');
const node2 = screen.getByTestId('component-node-2');
const node1OrderBefore = await node1.getAttribute('data-order');
const node2OrderBefore = await node2.getAttribute('data-order');
const node1Box = await node1.boundingBox();
const node2Box = await node2.boundingBox();
await page.mouse.move(node1Box.x + 10, node1Box.y + 10);
await page.mouse.down();
await page.mouse.move(node2Box.x + 10, node2Box.y + 10, { steps: 10 });
await page.mouse.up();
const node1OrderAfter = await screen.getByTestId('component-node-1').getAttribute('data-order');
expect(node1OrderAfter).not.toEqual(node1OrderBefore);

// AC-2.4.2: 排序后 order 字段正确更新
const store = await page.evaluate(() => window.__CANVAS_STORE__);
expect(store.componentTree.nodes[0].order).toBeDefined();
expect(typeof store.componentTree.nodes[0].order).toBe('number');

// AC-2.4.3: @dnd-kit 与现有 drag 实现无冲突
const draggable = screen.getByTestId('component-node-1');
expect(draggable).toHaveClass(/draggable|dnd-draggable/);
```

---

#### Definition of Done (Epic 2)

| # | DoD Item | Verification |
|---|----------|--------------|
| D1 | 中间面板可向左右双向展开 | Playwright 交互测试 |
| D2 | expand-both 时 canvas 占 3fr，两侧面板隐藏 | Vitest + CSS snapshot |
| D3 | 展开动画平滑 (0.3s ease) | Playwright 动画检测 |
| D4 | 移动端禁用 expand-both | Playwright viewport 测试 |
| D5 | 刷新页面后三棵树数据完整 | E2E 刷新测试 |
| D6 | localStorage 存储 < 5MB | Vitest 存储大小测试 |
| D7 | 批量勾选/清空正常 | Testing Library |
| D8 | 清空前有二次确认弹窗 | Playwright dialog 监听 |
| D9 | 组件树节点可拖拽排序 | Vitest + E2E 拖拽测试 |
| D10 | 排序后 order 字段正确更新 | Vitest 断言 |

---

### Epic 3: Phase 3 — 可视化平台

**Epic ID**: EP-003  
**名称**: Visualization Platform  
**优先级**: P2/P3  
**工时**: ~60-80h  
**目标**: 构建 ReactFlow 统一渲染层，支持 MiniMap、导出与插件系统  
**对应 JTBD**: JTBD 1 + JTBD 2 + JTBD 3 (综合)

---

#### Story 3.1: ReactFlow 统一节点注册

**Story ID**: US-3.1  
**As a** 开发者  
**I want** 三种树（限界上下文树、组件树、业务流树）统一使用 VibeXFlow 渲染  
**So that** 享受 ReactFlow 的节点布局、缩放、拖拽等内置能力

**Acceptance Criteria**:

```typescript
// AC-3.1.1: 三种树统一使用 VibeXFlow 渲染
const bcTree = screen.getByTestId('bounded-context-tree');
const componentTree = screen.getByTestId('component-tree');
const flowTree = screen.getByTestId('business-flow-tree');
expect(bcTree.querySelector('.react-flow')).toBeInTheDocument();
expect(componentTree.querySelector('.react-flow')).toBeInTheDocument();
expect(flowTree.querySelector('.react-flow')).toBeInTheDocument();

// AC-3.1.2: 新增节点类型无需修改 VibeXFlow 核心
const customNodeRegistry = await page.evaluate(() => window.__NODE_REGISTRY__);
expect(customNodeRegistry).toBeDefined();
expect(typeof customNodeRegistry.register).toBe('function');
await page.evaluate(() => {
  window.__NODE_REGISTRY__.register('CustomNode', CustomNodeComponent);
});

// AC-3.1.3: MiniMap 缩略图可用
const minimap = screen.getByTestId('flow-minimap');
expect(minimap).toBeInTheDocument();
await page.click('[data-testid="minimap-toggle"]');
expect(minimap).toBeVisible();
```

---

#### Story 3.2: 导出与持久化

**Story ID**: US-3.2  
**As a** 技术负责人  
**I want** 支持 JSON / OpenAPI / Markdown 多格式导出  
**So that** 建模结果可直接用于文档、API 设计和知识库

**Acceptance Criteria**:

```typescript
// AC-3.2.1: 导出 JSON 包含三棵树完整数据
const jsonExport = await page.evaluate(() => window.__EXPORT__('json'));
expect(jsonExport).toHaveProperty('boundedContexts');
expect(jsonExport).toHaveProperty('components');
expect(jsonExport).toHaveProperty('businessFlows');
expect(jsonExport.boundedContexts.length).toBeGreaterThan(0);

// AC-3.2.2: 导出 OpenAPI 可直接用于 API 文档
const openapiExport = await page.evaluate(() => window.__EXPORT__('openapi'));
expect(openapiExport).toHaveProperty('openapi');
expect(openapiExport).toHaveProperty('paths');
expect(openapiExport.paths).toHaveProperty('/components');
await expect(openapiExport.paths['/components'].get.responses['200']).toBeDefined();

// AC-3.2.3: 导出 Markdown 格式符合 VibeX 文档规范
const mdExport = await page.evaluate(() => window.__EXPORT__('markdown'));
expect(mdExport).toMatch(/^# /);
expect(mdExport).toMatch(/## Bounded Contexts/);
expect(mdExport).toMatch(/## Components/);
expect(mdExport).toMatch(/## Business Flows/);
```

---

#### Story 3.3: 插件系统

**Story ID**: US-3.3  
**As a** 开发者  
**I want** 插件系统支持第三方扩展，可注册自定义节点类型和导出格式  
**So that** VibeX Canvas 成为开放的 DDD 可视化平台

**Acceptance Criteria**:

```typescript
// AC-3.3.1: 插件可注册自定义节点类型
await page.evaluate(() => {
  window.__PLUGIN_SYSTEM__.register({
    name: 'ddd-icons',
    nodes: [{ type: 'EntityIcon', component: EntityIconComponent }],
    styles: '.entity-icon { color: gold; }'
  });
});
expect(screen.queryByTestId('entity-icon-node')).toBeInTheDocument();

// AC-3.3.2: 插件可注册自定义导出格式
const customExport = await page.evaluate(() => window.__EXPORT__('plantuml'));
expect(customExport).toBeDefined();
expect(customExport).toMatch(/@startuml/);

// AC-3.3.3: 插件冲突检测
const pluginConflict = await page.evaluate(() => {
  try {
    window.__PLUGIN_SYSTEM__.register({ name: 'duplicate-plugin' });
    window.__PLUGIN_SYSTEM__.register({ name: 'duplicate-plugin' });
    return false;
  } catch (e) {
    return true;
  }
});
expect(pluginConflict).toBe(true);
```

---

#### Definition of Done (Epic 3)

| # | DoD Item | Verification |
|---|----------|--------------|
| D1 | 三种树统一使用 VibeXFlow 渲染 | Playwright 视觉对比 |
| D2 | 新增节点类型无需修改 VibeXFlow 核心 | Vitest 节点注册表测试 |
| D3 | MiniMap 缩略图可用 | Playwright 交互测试 |
| D4 | 导出 JSON 包含三棵树完整数据 | Vitest 导出断言 |
| D5 | 导出 OpenAPI 可直接用于 API 文档 | Vitest Schema 验证 |
| D6 | 导出 Markdown 格式符合 VibeX 文档规范 | Vitest 格式断言 |
| D7 | 插件系统注册/卸载正常 | Vitest + E2E |
| D8 | 插件冲突检测有效 | Vitest 断言 |

---

## 3. UI/UX Flow

### 3.1 Canvas 整体布局

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: VibeX Canvas Logo | Project Name | Theme Toggle | Help │
├───────────────┬─────────────────────────────┬───────────────────┤
│               │                             │                   │
│  Left Panel   │      Canvas Area            │   Right Panel     │
│  (280px)      │      (flex: 1)              │   (280px)         │
│               │                             │                   │
│  Component    │  ┌─────────────────────┐   │  Bounded Context  │
│  Tree         │  │  Business Flow Tree │   │  Tree             │
│               │  │  (draggable nodes)  │   │                   │
│  - Drag sort  │  │                     │   │  - Domain groups  │
│  - Batch chk  │  │  [Branch Icon]      │   │  - Collapse/expand│
│  - Search     │  │  [Loop Icon]        │   │  - Color-coded    │
│               │  └─────────────────────┘   │                   │
│               │                             │                   │
├───────────────┴─────────────────────────────┴───────────────────┤
│  Footer: Zoom Controls | MiniMap Toggle | Export | Import       │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 三栏展开交互流程

```
用户点击"展开中间"按钮
         │
         ▼
    ┌──────────────────────────────────────────┐
    │  expandDirection 状态更新为 'both'        │
    │  同时设置 leftExpanded=false             │
    │  同时设置 rightExpanded=false            │
    │  同时设置 centerExpanded=true            │
    └──────────────────────────────────────────┘
         │
         ▼
    CSS Grid Layout 切换:
    - leftPanel: width = 0, overflow: hidden
    - rightPanel: width = 0, overflow: hidden
    - canvasArea: grid-column: 1 / -1 (占满)
    
    动画: transition: all 0.3s ease
         │
         ▼
    状态持久化至 canvasStore → localStorage
```

### 3.3 导入导航流程

```
用户点击"导入示例"
         │
         ▼
    加载示例数据 (mock data)
         │
         ▼
    遍历所有节点，验证可导航性
         │
    ┌────┴────┐
    │ 节点存在? │
    └────┬────┘
    Yes / \No
        /   \
   注册路由   显示友好提示
   /preview?  "节点不存在"
   node=ID    (非白屏/404)
```

### 3.4 批量操作流程

```
用户点击"全选"按钮
         │
         ▼
    遍历所有 checkbox，设置 aria-checked=true
    UI 更新: 所有复选框显示勾选状态
    
用户点击"清空"按钮
         │
         ▼
    显示确认弹窗: "确认清空所有勾选?"
         │
    ┌────┴────┐
    │ 用户确认? │
    └────┬────┘
    Yes / \No
        /   \
   遍历清空    取消
   UI 更新
```

---

## 4. Implementation Plan

### 4.1 Phase 1: 样式统一 + 导航修复 (P0)

**工时**: ~15-20h (1 dev)  
**周期**: Week 1 (2026-03-30 ~ 2026-04-05)

| Task ID | 任务 | 工时 | Owner | 依赖 | 验收 |
|---------|------|------|-------|------|------|
| T-1.1 | 限界上下文分组虚线框 | ~5h | Dev | - | AC-1.1.1 ~ 1.1.3 |
| T-1.2 | CSS Checkbox 统一样式 | ~3h | Dev | - | AC-1.2.1 ~ 1.2.3 |
| T-1.3 | 流程卡片虚线边框 | ~2h | Dev | T-1.2 | AC-1.3.1 ~ 1.3.4 |
| T-1.4 | 导入导航修复 | ~3h | Dev | - | AC-1.4.1 ~ 1.4.3 |
| T-1.5 | 统一 CSS 变量系统 | ~2h | Dev | T-1.1, T-1.2 | AC-1.5.1 ~ 1.5.3 |
| T-1.6 | 测试覆盖 + CI | ~5h | Dev/Test | T-1.1 ~ T-1.5 | DoD D1 ~ D10 |

**里程碑**: Phase 1 完成，样式系统统一，导航 404 全修复，测试覆盖率 > 80%

---

### 4.2 Phase 2: 交互增强 + 可用性基础 (P1)

**工时**: ~20-28h (1-2 dev)  
**周期**: Week 2 (2026-04-06 ~ 2026-04-12)

| Task ID | 任务 | 工时 | Owner | 依赖 | 验收 |
|---------|------|------|-------|------|------|
| T-2.1 | 三栏画布双向展开 | ~8h | Dev | T-1.5 | AC-2.1.1 ~ 2.1.4 |
| T-2.2 | 数据持久化完善 | ~5h | Dev | T-2.1 | AC-2.2.1 ~ 2.2.3 |
| T-2.3 | 组件树批量操作 | ~6h | Dev | T-1.2 | AC-2.3.1 ~ 2.3.3 |
| T-2.4 | 画布拖拽排序 | ~9h | Dev | T-2.1 | AC-2.4.1 ~ 2.4.3 |
| T-2.5 | Playwright E2E 测试 | ~3h | Test | T-2.1 ~ T-2.4 | DoD D1 ~ D10 |

**里程碑**: Phase 2 完成，三栏交互流畅，数据持久化可靠，拖拽体验顺滑

---

### 4.3 Phase 3: 可视化平台 (P2/P3)

**工时**: ~60-80h (2 dev)  
**周期**: Week 3-5 (2026-04-13 ~ 2026-04-30)

| Task ID | 任务 | 工时 | Owner | 依赖 | 验收 |
|---------|------|------|-------|------|------|
| T-3.1 | ReactFlow 统一层 | ~30h | Dev | T-2.1 | AC-3.1.1 ~ 3.1.3 |
| T-3.2 | 导出功能 (JSON/OpenAPI/MD) | ~20h | Dev | T-2.2 | AC-3.2.1 ~ 3.2.3 |
| T-3.3 | 插件系统 | ~30h | Dev | T-3.1 | AC-3.3.1 ~ 3.3.3 |
| T-3.4 | 集成测试 + 性能优化 | ~8h | Test/Dev | T-3.1 ~ T-3.3 | DoD D1 ~ D8 |

**里程碑**: Phase 3 完成，VibeX Canvas 成为开放的 DDD 可视化平台

---

### 4.4 工时汇总

| Phase | 工时 | 人员 | 风险 |
|-------|------|------|------|
| Phase 1 | ~20h | 1 dev | 🟢 低 |
| Phase 2 | ~28h | 1-2 dev | 🟡 中 |
| Phase 3 | ~80h | 2 dev | 🟡 中 |
| **总计** | **~128h** | | |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| 指标 | 要求 | 验证方式 |
|------|------|---------|
| 初次加载时间 | < 3s (3G 网络) | Lighthouse |
| 展开动画帧率 | ≥ 30fps | Playwright 帧率检测 |
| 100 节点渲染 | < 500ms | Vitest 性能测试 |
| localStorage 写入 | < 100ms | Vitest 计时 |

### 5.2 Accessibility

| 指标 | 要求 | 验证方式 |
|------|------|---------|
| WCAG 2.1 AA 合规 | 所有交互元素可键盘操作 | axe-core |
| aria 属性 | 100% 覆盖 | Vitest + axe-core |
| 屏幕阅读器 | 支持 NVDA/VoiceOver | 人工测试 |
| 颜色对比度 | ≥ 4.5:1 (文字) | axe-core |

### 5.3 Browser Support

| 浏览器 | 版本 | 支持级别 |
|--------|------|---------|
| Chrome | ≥ 90 | P0 (Full) |
| Firefox | ≥ 88 | P1 (Full) |
| Safari | ≥ 14 | P1 (Full) |
| Edge | ≥ 90 | P1 (Full) |
| Mobile Safari | ≥ 14 | P2 (Best-effort) |
| Chrome Android | ≥ 90 | P2 (Best-effort) |

### 5.4 Theme Support

| 主题 | 要求 |
|------|------|
| Light Mode | 100% 适配 |
| Dark Mode | 100% 适配 |
| System Preference | 自动跟随 |
| 主题切换动画 | 平滑过渡 (0.2s) |

### 5.5 Security

| 需求 | 要求 |
|------|------|
| XSS 防护 | 所有用户输入转义 |
| CSRF 防护 | Token 验证 |
| CSP | 严格 Content-Security-Policy |
| 敏感数据 | 不存储在 localStorage |

### 5.6 Observability

| 指标 | 要求 |
|------|------|
| Console Errors | = 0 (生产环境) |
| Error Boundary | 所有 Canvas 组件包裹 |
| 错误上报 | Sentry 集成 |
| 性能监控 | Web Vitals (LCP/CLS/FID) |

---

## 6. Risk Register

### 6.1 Risk Matrix

| Risk ID | 风险描述 | 概率 | 影响 | 等级 | 缓解策略 | Owner |
|---------|---------|------|------|------|----------|-------|
| R-1 | 现有数据无 domainType/type 字段 | 高 | 中 | 🟡 中 | Store 初始化时自动推导（已有方案） | Dev |
| R-2 | CSS 变量深色模式缺失 | 中 | 中 | 🟡 中 | Phase 1 建立统一约束 | Dev |
| R-3 | expandDirection 与 centerExpanded 状态不一致 | 中 | 高 | 🔴 高 | 始终通过同一个 action 更新两个字段 | Dev |
| R-4 | Phase 3 ReactFlow 学习曲线 | 中 | 中 | 🟡 中 | 提前安排 POC，Architect 提供 ReactFlow 统一层设计 | Dev |
| R-5 | @dnd-kit 与现有拖拽冲突 | 低 | 中 | 🟢 低 | 检查现有 drag 实现，统一使用 @