# PRD: VibeX Canvas Phase2 — 全屏展开 + 关系可视化

> **项目**: canvas-phase2
> **版本**: v1.0
> **日期**: 2026-03-29
> **状态**: Draft → Review
> **Owner**: PM
> **工作目录**: /root/.openclaw/vibex

---

## 1. Executive Summary

### 1.1 背景

Phase1 完成了 Canvas 三栏布局的样式统一（统一配色、字体、间距），但面板展开体验仍然薄弱（1.5fr 仅增加 50% 宽度），且缺少限界上下文之间的关系可视化能力。用户无法直观看到：
- 限界上下文卡片之间的依赖关系
- 流程节点的起止状态和分支/循环路径

### 1.2 推荐方案

**推荐方案 C — 渐进增强**（Phase2a + Phase2b）

| 迭代 | 核心交付 | 工时 | 优先级 |
|------|---------|------|--------|
| Phase2a | 全屏展开体验 + 虚线框交集高亮 | ~8h | P0 |
| Phase2b | 完整关系可视化（连线 + 标记 + 布局） | ~16h | P1 |
| **合计** | | **~24-30h** | |

**Phase2c 布局算法**（Dagre/elkjs）放入 Phase3，不在本 PRD 范围内。

### 1.3 成功指标

| 指标 | 目标 |
|------|------|
| 全屏展开响应时间 | < 100ms（CSS transition） |
| SVG 连线渲染（≤20条） | < 50ms |
| 连线密度控制 | >20条时聚类合并，用户无感知卡顿 |
| 现有功能回归 | Phase1 样式统一成果零回归 |

---

## 2. Epic Breakdown

---

### Epic 1: 全屏展开体验

**优先级**: P0
**迭代**: Phase2a
**预估工时**: ~6h
**依赖**: Phase1 样式统一成果（CanvasPage.tsx）

#### 目标

提供真正的准全屏画布体验：三栏均分视口、隐藏工具栏、快捷键支持。

#### Stories

**F1.1: 三栏 expand-both 模式**
- **As a** 用户
- **I want to** 点击"全屏展开"按钮，三个面板均分视口宽度（各 1fr）
- **So that** 我能看到完整的画布内容，不被面板宽度限制

**实现细节**：
- `grid-template-columns` 从动态 `var(--grid-*)` 改为 `1fr 1fr 1fr`（全屏模式）
- 新增 `expandMode: 'expand-both' | 'normal'` 到 CanvasPage state
- "全屏展开"按钮放在 Toolbar 或 CanvasPage 右上角
- 全屏模式下，Sidebar/ProjectBar 保持可见（不同于 maximize）

**验收测试**：
```typescript
// Vitest
test('expand-both 模式下三栏各占 1fr', async () => {
  render(<CanvasPage />);
  await userEvent.click(screen.getByRole('button', { name: /全屏展开/i }));
  const grid = document.querySelector('.canvas-grid');
  const style = window.getComputedStyle(grid);
  expect(style.gridTemplateColumns).toBe('1fr 1fr 1fr');
});

// Playwright
test('全屏展开按钮可点击', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('button:has-text("全屏展开")');
  await expect(page.locator('.canvas-grid')).toHaveCSS('grid-template-columns', '1fr 1fr 1fr');
});
```

---

**F1.2: maximize 模式**
- **As a** 用户
- **I want to** 进入真正的全屏模式，隐藏 Toolbar 和 ProjectBar，画布区域 padding 归零
- **So that** 我获得最大化的画布空间

**实现细节**：
- 新增 `maximize: boolean` state
- `maximize=true` 时：
  - `Toolbar` → `visibility: hidden`
  - `ProjectBar` → `visibility: hidden`
  - `CanvasPage` → `padding: 0`
  - 三栏 grid → `1fr 1fr 1fr`（隐含 expand-both）
- 通过 Toolbar 菜单项或快捷键触发
- 页面顶部留 4px 悬浮退出条（hover 显示退出按钮）

**验收测试**：
```typescript
test('maximize 模式隐藏工具栏和侧边栏', async () => {
  render(<CanvasPage />);
  await userEvent.click(screen.getByRole('button', { name: /最大化/i }));
  const toolbar = document.querySelector('.toolbar');
  const projectBar = document.querySelector('.project-bar');
  expect(window.getComputedStyle(toolbar).visibility).toBe('hidden');
  expect(window.getComputedStyle(projectBar).visibility).toBe('hidden');
  expect(window.getComputedStyle(document.querySelector('.canvas-page')).padding).toBe('0px');
});
```

---

**F1.3: F11 快捷键**
- **As a** 用户
- **I want to** 按 F11 在准全屏和正常模式之间切换，Escape 恢复正常
- **So that** 我无需鼠标即可快速切换全屏

**实现细节**：
- `useEffect` 监听 `keydown` 事件
- F11 → 切换 maximize 模式（preventDefault 阻止浏览器默认全屏）
- Escape → 仅在 maximize 模式下退出（恢复正常布局）
- 状态持久化：`localStorage.setItem('canvas-maximize', 'true')`

**验收测试**：
```typescript
test('F11 切换全屏，Escape 退出', async () => {
  render(<CanvasPage />);
  expect(screen.queryByRole('toolbar')).toBeVisible();
  
  await userEvent.keyboard('{F11}');
  expect(screen.queryByRole('toolbar')).not.toBeVisible();
  
  await userEvent.keyboard('{Escape}');
  expect(screen.queryByRole('toolbar')).toBeVisible();
});

test('Escape 在非全屏模式下不触发退出', async () => {
  render(<CanvasPage />);
  await userEvent.keyboard('{Escape}');
  // 正常模式不应退出
  expect(screen.queryByRole('toolbar')).toBeVisible();
});
```

---

**F1.4: 移除旧 1.5fr 逻辑**
- **As a** 开发者
- **I want to** 统一 canvas 布局模式，移除所有旧的 `1.5fr` expand 逻辑
- **So that** 避免两种 expand 机制共存导致的维护负担和 UI 不一致

**实现细节**：
- 删除 `CanvasPage.tsx` 中的 `leftExpand/centerExpand/rightExpand` 三态逻辑
- 删除 `grid.style.setProperty('--grid-left', ...)` 系列代码
- 删除 CSS 变量 `--grid-left`, `--grid-center`, `--grid-right`
- 仅保留 `expandMode: 'expand-both' | 'normal'` 和 `maximize: boolean`

**验收测试**：
```bash
# 静态检查
grep -rn "1.5fr" src/
# 预期：0 结果

grep -rn "leftExpand\|centerExpand\|rightExpand" src/canvas/
# 预期：0 结果（canvas 相关文件）
```

```typescript
test('旧 expand 状态移除后布局仍正常', async ({ page }) => {
  await page.goto('/canvas');
  // 正常模式
  const col1 = await page.locator('.panel-left').boundingBox();
  const col2 = await page.locator('.panel-center').boundingBox();
  const col3 = await page.locator('.panel-right').boundingBox();
  // 三栏宽度应相近（允许 10% 误差）
  expect(Math.abs(col1.width - col2.width) / col2.width).toBeLessThan(0.1);
});
```

---

### Epic 2: 关系可视化基础

**优先级**: P0
**迭代**: Phase2a
**预估工时**: ~2h
**依赖**: Phase1 BoundedGroupOverlay.tsx 成果

#### 目标

在 Phase1 限界上下文虚线框基础上，增加交集检测高亮和起止节点标记。

#### Stories

**F2.1: 虚线框交集高亮**
- **As a** 用户
- **I want to** 当两个领域虚线框在画布上有重叠区域时，看到半透明叠加高亮
- **So that** 我能快速识别领域之间的耦合区域

**实现细节**：
- 扩展 `BoundedGroupOverlay.tsx`，在现有虚线框渲染后添加交集检测层
- 交集检测算法：矩形交集检测（投影法或 Cohen-Sutherland）
- 高亮样式：`fill: var(--overlap-color, #6366f1)`, `fill-opacity: 0.15`
- 性能：使用 `React.memo` + `useMemo` 缓存交集计算结果
- 仅在有重叠时渲染，减少 DOM 节点

**验收测试**：
```typescript
// Vitest
test('两个虚线框有交集时渲染高亮区域', async () => {
  const boundedGroups = [
    { id: 'g1', domainType: 'domain', x: 0, y: 0, width: 200, height: 100 },
    { id: 'g2', domainType: 'domain', x: 150, y: 50, width: 200, height: 100 },
  ];
  const { container } = render(<BoundedGroupOverlay groups={boundedGroups} />);
  const highlights = container.querySelectorAll('.overlap-highlight');
  expect(highlights.length).toBeGreaterThan(0);
});

test('两个虚线框无交集时不渲染高亮', async () => {
  const boundedGroups = [
    { id: 'g1', domainType: 'domain', x: 0, y: 0, width: 100, height: 100 },
    { id: 'g2', domainType: 'domain', x: 200, y: 200, width: 100, height: 100 },
  ];
  const { container } = render(<BoundedGroupOverlay groups={boundedGroups} />);
  expect(container.querySelectorAll('.overlap-highlight').length).toBe(0);
});

// Playwright
test('画布上领域重叠区域可见高亮', async ({ page }) => {
  await page.goto('/canvas');
  // 打开画布，定位两个领域使它们重叠
  await page.waitForSelector('.bounded-group');
  const overlapEl = page.locator('.overlap-highlight');
  if (await page.locator('.bounded-group').count() >= 2) {
    await expect(overlapEl).toBeVisible();
  }
});
```

---

**F2.2: start/end 节点标记**
- **As a** 用户
- **I want to** 流程节点中的起点显示绿色圆点，终点显示红色方块
- **So that** 我能一眼区分流程的入口和出口节点

**实现细节**：
- 扩展 `FlowNode` 数据模型，新增 `nodeType: 'start' | 'end' | 'process'`
- `start` 节点：左上角绿色圆点 `border-radius: 50%`, `background: #22c55e`
- `end` 节点：左上角红色方块 `border-radius: 2px`, `background: #ef4444`
- 标记作为 `FlowNodeCard` 内部 SVG/div，绝对定位

**验收测试**：
```typescript
test('start 节点有绿色圆点标记', async () => {
  const nodes = [{ id: 'n1', type: 'start', label: '开始' }];
  render(<FlowNodeCard node={nodes[0]} />);
  const marker = document.querySelector('.node-type-marker');
  expect(marker).toHaveClass('marker-start');
  expect(window.getComputedStyle(marker).backgroundColor).toBe('rgb(34, 197, 94)');
});

test('end 节点有红色方块标记', async () => {
  const nodes = [{ id: 'n1', type: 'end', label: '结束' }];
  render(<FlowNodeCard node={nodes[0]} />);
  const marker = document.querySelector('.node-type-marker');
  expect(marker).toHaveClass('marker-end');
  expect(window.getComputedStyle(marker).backgroundColor).toBe('rgb(239, 68, 68)');
});

test('process 节点无 start/end 标记', async () => {
  const nodes = [{ id: 'n1', type: 'process', label: '处理中' }];
  render(<FlowNodeCard node={nodes[0]} />);
  expect(document.querySelector('.node-type-marker')).toBeNull();
});
```

---

### Epic 3: 完整关系可视化

**优先级**: P1
**迭代**: Phase2b
**预估工时**: ~16h
**依赖**: Epic 1 + Epic 2 完成

#### 目标

在全屏展开基础上，增加完整的连线可视化：限界上下文卡片连线、流程节点连线（分支/循环）、连线密度控制。

#### Stories

**F3.1: 连线数据模型扩展**
- **As a** 开发者
- **I want to** 数据模型支持 edge/connection 结构
- **So that** 前端可以渲染节点之间的连线关系

**实现细节**：
- 扩展 `boundedGroups` 数据结构：
  ```typescript
  interface BoundedEdge {
    id: string;
    from: { groupId: string; nodeId?: string };
    to: { groupId: string; nodeId?: string };
    type: 'dependency' | 'composition' | 'association';
    label?: string;
  }
  ```
- 扩展 `flowNodes` 数据结构：
  ```typescript
  interface FlowEdge {
    id: string;
    from: string; // nodeId
    to: string; // nodeId
    type: 'sequence' | 'branch' | 'loop';
    label?: string;
  }
  ```
- 数据来源：Phase2b 阶段使用 mock 数据；后续从 API/AI 推导
- 向后兼容：`edges: []` 作为可选字段，无 edges 时不渲染连线层

**验收测试**：
```typescript
test('BoundedEdge 数据结构符合接口定义', () => {
  const edge: BoundedEdge = {
    id: 'e1',
    from: { groupId: 'g1' },
    to: { groupId: 'g2' },
    type: 'dependency',
  };
  expect(edge.from.groupId).toBeDefined();
  expect(edge.to.groupId).toBeDefined();
});

test('FlowEdge 支持 branch 和 loop 类型', () => {
  const seqEdge: FlowEdge = { id: 'e1', from: 'n1', to: 'n2', type: 'sequence' };
  const loopEdge: FlowEdge = { id: 'e2', from: 'n2', to: 'n1', type: 'loop' };
  expect(seqEdge.type).toBe('sequence');
  expect(loopEdge.type).toBe('loop');
});
```

---

**F3.2: 限界上下文卡片连线**
- **As a** 用户
- **I want to** 看到限界上下文卡片之间的依赖连线（SVG path 带箭头）
- **So that** 我能直观理解领域间的调用关系

**实现细节**：
- 新增 `BoundedEdgeLayer.tsx` SVG 层，置于 canvas 层之上、交互层之下
- `pointer-events: none` 确保不阻挡节点交互
- 路径计算：从源节点中心到目标节点中心，使用 `path d="M x1 y1 C cp1x cp1y, cp2x cp2y, x2 y2"`
- 箭头标记：`<marker>` SVG defs，`refX/refY` 校准箭头指向
- 连线颜色：`dependency` → `#6366f1`（indigo）, `composition` → `#8b5cf6`（violet）, `association` → `#94a3b8`（slate）

**验收测试**：
```typescript
test('有 edge 数据时渲染 SVG path', async () => {
  const edges = [{ id: 'e1', from: { groupId: 'g1' }, to: { groupId: 'g2' }, type: 'dependency' }];
  render(<BoundedEdgeLayer edges={edges} nodes={boundedGroups} />);
  const paths = document.querySelectorAll('.bounded-edge path');
  expect(paths.length).toBeGreaterThan(0);
});

test('无 edge 数据时不渲染连线', async () => {
  render(<BoundedEdgeLayer edges={[]} nodes={boundedGroups} />);
  expect(document.querySelectorAll('.bounded-edge').length).toBe(0);
});

test('SVG 连线层不阻挡节点交互', async () => {
  render(<BoundedEdgeLayer edges={edges} nodes={boundedGroups} />);
  const svgLayer = document.querySelector('.bounded-edge-layer');
  expect(window.getComputedStyle(svgLayer).pointerEvents).toBe('none');
});

// Playwright
test('两个卡片之间可见带箭头连线', async ({ page }) => {
  await page.goto('/canvas');
  await page.waitForSelector('.bounded-card');
  const edges = await page.locator('.bounded-edge path[marker-end]').count();
  if (edges > 0) {
    await expect(page.locator('.bounded-edge')).toHaveCount(edges);
  }
});
```

---

**F3.3: 流程节点连线**
- **As a** 用户
- **I want to** 看到流程节点之间的顺序连线、分支（→）和循环（↩）样式
- **So that** 我能理解流程的执行路径

**实现细节**：
- 顺序连线（`sequence`）：实线 + 直线箭头
- 分支连线（`branch`）：虚线 + 分叉箭头
- 循环连线（`loop`）：曲线 + 回环箭头（↩），使用贝塞尔曲线绕回
- `FlowEdgeLayer.tsx`：独立于 `BoundedEdgeLayer`，支持 z-index 分层
- 分支标签：使用 `<text>` 在连线中点标注条件（如 "if approved"）

**验收测试**：
```typescript
test('sequence 类型连线为实线', async () => {
  const edges = [{ id: 'e1', from: 'n1', to: 'n2', type: 'sequence' }];
  render(<FlowEdgeLayer edges={edges} nodes={flowNodes} />);
  const path = document.querySelector('.flow-edge.sequence path');
  expect(path).toHaveStyle({ strokeDasharray: '0,0' }); // 实线
});

test('branch 类型连线为虚线', async () => {
  const edges = [{ id: 'e1', from: 'n1', to: 'n2', type: 'branch' }];
  render(<FlowEdgeLayer edges={edges} nodes={flowNodes} />);
  const path = document.querySelector('.flow-edge.branch path');
  const dashArray = window.getComputedStyle(path).strokeDasharray;
  expect(dashArray).not.toBe('0,0');
});

test('loop 类型连线渲染回环样式', async () => {
  const edges = [{ id: 'e1', from: 'n2', to: 'n1', type: 'loop' }];
  render(<FlowEdgeLayer edges={edges} nodes={flowNodes} />);
  const path = document.querySelector('.flow-edge.loop path');
  expect(path).toBeDefined();
});
```

---

**F3.4: 连线密度控制**
- **As a** 用户
- **I want to** 当连线数量超过 20 条时，系统自动聚类合并显示
- **So that** 画布不会因连线过多而变得混乱

**实现细节**：
- 密度阈值：`MAX_EDGES_VISIBLE = 20`
- 聚类策略：按源节点 groupId 分组，组内边合并为一条粗线 + 计数标签
- UI 提示：`+N more` 标签显示聚类包含的边数
- 用户可点击聚类连线展开查看详情（Phase3 可做，Phase2b 仅合并显示）
- 使用 `useMemo` 缓存聚类结果，避免频繁重算

**验收测试**：
```typescript
test('<=20 条连线正常渲染', async () => {
  const edges = Array.from({ length: 15 }, (_, i) => ({
    id: `e${i}`, from: `n${i}`, to: `n${i + 1}`, type: 'sequence'
  }));
  render(<FlowEdgeLayer edges={edges} nodes={flowNodes} />);
  expect(document.querySelectorAll('.flow-edge').length).toBe(15);
  expect(document.querySelectorAll('.cluster-edge').length).toBe(0);
});

test('>20 条连线聚类合并', async () => {
  const edges = Array.from({ length: 25 }, (_, i) => ({
    id: `e${i}`, from: `n${i}`, to: `n${i + 1}`, type: 'sequence'
  }));
  render(<FlowEdgeLayer edges={edges} nodes={flowNodes} />);
  // 应聚类合并，显示 <20 条
  expect(document.querySelectorAll('.flow-edge, .cluster-edge').length).toBeLessThan(25);
  // 应有聚类标记
  const clusterCount = document.querySelectorAll('.cluster-edge').length;
  expect(clusterCount).toBeGreaterThan(0);
});

test('聚类连线显示 +N 标签', async () => {
  const edges = Array.from({ length: 30 }, (_, i) => ({
    id: `e${i}`, from: `n${i}`, to: `n${i + 1}`, type: 'sequence'
  }));
  render(<FlowEdgeLayer edges={edges} nodes={flowNodes} />);
  const clusterLabel = document.querySelector('.cluster-label');
  expect(clusterLabel).toBeDefined();
  expect(clusterLabel.textContent).toMatch(/\+\d+/);
});
```

---

## 3. 验收标准汇总

### Phase2a

| ID | 验收条件 | 测试框架 |
|----|---------|---------|
| AC1.1 | 三栏 expand-both 模式下，`gridTemplateColumns` 为 `1fr 1fr 1fr` | Vitest + Playwright |
| AC1.2 | maximize 模式隐藏 Toolbar 和 ProjectBar，padding 为 0 | Vitest |
| AC1.3 | F11 切换全屏，Escape 恢复正常（仅在全屏模式下） | Vitest + Playwright |
| AC1.4 | `grep -rn "1.5fr" src/` 结果为 0 | Bash |
| AC2.1 | 两个领域虚线框有交集时，交集区域半透明高亮可见 | Vitest + Playwright |
| AC2.2 | start 节点显示绿色圆点，end 节点显示红色方块 | Vitest |

### Phase2b

| ID | 验收条件 | 测试框架 |
|----|---------|---------|
| AC3.1 | BoundedEdge 和 FlowEdge 数据结构符合接口定义 | Vitest |
| AC3.2 | 有 edge 数据时渲染 SVG path（带箭头）；无数据时不渲染 | Vitest |
| AC3.3 | SVG 连线层 `pointer-events: none`，不阻挡节点交互 | Vitest |
| AC3.4 | sequence 连线为实线，branch 为虚线，loop 为回环曲线 | Vitest |
| AC3.5 | 25 条连线时聚类合并至 <20 条，显示 +N 标签 | Vitest |

---

## 4. Definition of Done

### Epic 1 DoD: 全屏展开体验

- [ ] `expandMode: 'expand-both'` 三栏均分视口，视觉验证通过
- [ ] `maximize: true` 隐藏 Toolbar/ProjectBar，padding→0
- [ ] F11 快捷键功能正常，Escape 仅在 maximize 模式下退出
- [ ] 所有旧 `1.5fr` / `leftExpand/centerExpand/rightExpand` 代码已删除
- [ ] 所有验收测试通过（Vitest + Playwright）
- [ ] 回归测试：Phase1 样式统一成果未受影响

### Epic 2 DoD: 关系可视化基础

- [ ] `BoundedGroupOverlay` 渲染交集高亮区域（两个领域有交集时）
- [ ] 交集高亮为半透明叠加，不影响底层节点可见性
- [ ] FlowNode 支持 `nodeType: 'start' | 'end' | 'process'`
- [ ] start 节点绿色圆点，end 节点红色方块，render 测试通过
- [ ] 所有验收测试通过（Vitest + Playwright）

### Epic 3 DoD: 完整关系可视化

- [ ] `BoundedEdge` / `FlowEdge` 接口定义完整，向后兼容
- [ ] `BoundedEdgeLayer.tsx` 和 `FlowEdgeLayer.tsx` 独立 SVG 层
- [ ] 连线带箭头标记（`<marker>`），颜色按 type 区分
- [ ] 三种连线样式正确渲染（sequence/branch/loop）
- [ ] 连线密度控制：25 条边聚类至 <20 条，显示 +N 标签
- [ ] `pointer-events: none` 确保连线层不遮挡交互
- [ ] 所有验收测试通过（Vitest + Playwright）

---

## 5. 实施计划

### Phase2a: 全屏展开 + 交集高亮（~8h）

```
Week 1
├── Day 1 (6h)
│   ├── F1.1: expand-both 模式（2h）
│   │   └── grid-template-columns 固定 1fr 1fr 1fr
│   ├── F1.2: maximize 模式（2h）
│   │   └── 隐藏 Toolbar/ProjectBar，padding→0
│   └── F1.3: F11/Escape 快捷键（1h）
│       └── + 状态持久化 localStorage
│
└── Day 2 (2h)
    ├── F1.4: 移除旧 1.5fr 逻辑（1h）
    │   └── grep 验证 + 回归测试
    ├── F2.1: 虚线框交集高亮（1h）
    │   └── 矩形交集算法 + SVG clipPath
    └── Phase2a 验收测试 + Code Review
```

### Phase2b: 完整关系可视化（~16h）

```
Week 2-3
├── Day 3-4 (8h)
│   ├── F3.1: 数据模型扩展（2h）
│   │   └── BoundedEdge + FlowEdge 接口定义
│   ├── F3.2: 限界上下文卡片连线（4h）
│   │   └── BoundedEdgeLayer + SVG path + 箭头
│   └── F2.2: start/end 节点标记（2h）
│       └── 绿色圆点 + 红色方块
│
├── Day 5-6 (8h)
│   ├── F3.3: 流程节点连线（3h）
│   │   └── sequence/branch/loop 样式
│   ├── F3.4: 连线密度控制（3h）
│   │   └── 聚类算法 + +N 标签
│   └── Phase2b 验收测试 + Code Review
│
└── Week 4 (缓冲)
    ├── Bug Fix + Edge Cases
    ├── 集成测试
    └── Phase2b Release
```

### Phase2c: 布局算法 → Phase3

Dagre/elkjs 布局算法不在本 PRD 范围内，放到 Phase3 ReactFlow 迁移计划中统一考虑。

---

## 6. 风险登记册

| # | 风险描述 | 概率 | 影响 | 缓解措施 | 状态 |
|---|---------|------|------|---------|------|
| R1 | 全屏展开与现有 expand 逻辑冲突 | 高 | 中 | Phase2a 先移除旧 1.5fr 逻辑，再实现新模式 | Open |
| R2 | SVG 连线层遮挡节点交互 | 高 | 高 | 连线层设置 `pointer-events: none`，置于 canvas 层底部 | Open |
| R3 | 数据模型变更影响 Phase1 成果 | 中 | 高 | edges 作为可选字段，无数据时完全降级；向后兼容 | Open |
| R4 | 布局算法复杂度超预期 | 中 | 中 | Phase2b 先用固定位置，Dagre/elkjs 放 Phase3 | Open |
| R5 | 与 Phase3 ReactFlow 迁移重叠 | 高 | 低 | SVG 连线层独立于 ReactFlow；Phase3 可复用概念 | Open |
| R6 | 交集检测性能问题（大量领域时） | 中 | 中 | `useMemo` 缓存交集结果；仅渲染有交集的组合 | Open |

---

## 7. 开放问题

| # | 问题 | 负责人 | 截止日期 | 答案 |
|---|-----|--------|---------|------|
| O1 | 限界上下文之间的关系数据来源？API / 用户手动绘制 / AI 推导？ | PM | Phase2b 开始前 | 待定（Phase2b 使用 mock 数据） |
| O2 | 流程分支/循环的连线样式是否有设计规范？ | Design | Phase2b 开始前 | 待定 |
| O3 | Phase3 ReactFlow 迁移计划是否已确定？Phase2 SVG 连线层是否需要兼容 ReactFlow？ | Tech Lead | Phase2b 开始前 | 待定 |

---

## 8. 附录

### A. 竞品参考

- **Miro**: 无限画布 + 连线拖拽
- **Draw.io**: 连线样式丰富（orthogonal/curved/straight）
- **Figma**: Auto-layout + 组件连线

### B. 技术债务清理

- 移除 `CanvasPage.tsx` 中的旧 expand 逻辑（Epic 1 F1.4）
- 统一 `BoundedGroupOverlay.tsx` 命名（`OverlappedRegionOverlay`？）
- 清理 canvasStore 中未使用的状态字段

### C. 非功能需求

| 类别 | 要求 |
|------|------|
| 性能 | 全屏展开 < 100ms；SVG 连线渲染（≤20条）< 50ms |
| 兼容性 | 支持 Chrome/Edge/Firefox/Safari 最新两个版本 |
| 响应式 | 全屏模式在 1280px+ 视口下效果最佳 |
| 可访问性 | 快捷键操作有 ARIA 标签；高对比度模式兼容 |
