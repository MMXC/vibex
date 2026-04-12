# Epic 3: CSS 架构重构 — 规格说明

**Epic ID**: epic-3-css-refactor  
**优先级**: P2  
**工时估算**: ~1 day  
**依赖**: 无外部依赖  
**代码基准**: `79ebe010`

---

## 目标

将 `canvas.module.css` 从 4,383 行单文件按组件拆分为 6 个子文件，提升可维护性，支持 tree-shaking，消除 CSS 膨胀风险。

---

## 现状分析

### 问题

- `canvas.module.css` 共 4,383 行，包含所有 Canvas 组件样式
- 无法 tree-shaking，未使用组件的 CSS 也会打包
- 单文件难以定位和维护
- CSS 类名冲突风险高

### 现有组件结构

```
src/components/canvas/
├── CanvasPage.tsx          ← 主页面
├── CanvasToolbar.tsx        ← 工具栏
├── ContextTree.tsx          ← Context 树
├── ModelTree.tsx            ← Model 树
├── FlowTree.tsx             ← Flow 树
├── ComponentsTree.tsx       ← Components 树
├── CanvasPanels.tsx         ← 侧边面板
├── AiThinkingPanel.tsx      ← AI 思考面板
├── CanvasExport.tsx         ← 导出功能
└── canvas.module.css        ← 4,383 行（需拆分）
```

---

## 拆分方案

### 原则

1. **按组件拆分**：每个组件对应一个 CSS 文件
2. **保留原始选择器名**：避免破坏性改名，`.canvas-container` → 仍在 `CanvasPage.module.css`
3. **迁移而非重写**：逐块迁移，不改变样式本身
4. **独立 commit**：每个 CSS 文件拆分单独 commit

### 文件结构

```
src/components/canvas/
├── CanvasPage.tsx
├── CanvasToolbar.tsx
├── ...
├── canvas.module.css         ← 保留入口文件（import 聚合）
├── canvas.base.module.css    ← 变量、全局布局（NEW）
├── canvas.toolbar.module.css ← 工具栏样式（NEW）
├── canvas.trees.module.css   ← 三树通用样式（NEW）
├── canvas.context.module.css ← ContextTree 专用（NEW）
├── canvas.model.module.css   ← ModelTree 专用（NEW）
├── canvas.flow.module.css    ← FlowTree 专用（NEW）
├── canvas.components.module.css ← ComponentsTree 专用（NEW）
├── canvas.panels.module.css  ← 侧边面板（NEW）
├── canvas.thinking.module.css ← AI Thinking 面板（NEW）
├── canvas.export.module.css  ← 导出功能（NEW）
└── canvas.misc.module.css    ← 其他杂项（NEW）
```

### canvas.module.css 改造

```css
/* canvas.module.css → 改为 import 聚合文件 */
@use './canvas.base.module.css';
@use './canvas.toolbar.module.css';
@use './canvas.trees.module.css';
/* ... 其他子文件 */
```

### 各文件内容范围

| 文件 | 行数估算 | 包含样式 |
|------|----------|----------|
| `canvas.base.module.css` | ~200 行 | CSS 变量、:root、body、全局布局 `.canvas-root` |
| `canvas.toolbar.module.css` | ~300 行 | `.toolbar`、`.toolbar-btn`、图标等 |
| `canvas.trees.module.css` | ~500 行 | 三树通用 `.tree-node`、`.tree-item`、展开/折叠 |
| `canvas.context.module.css` | ~500 行 | ContextTree 专用节点样式 |
| `canvas.model.module.css` | ~400 行 | ModelTree 专用节点样式 |
| `canvas.flow.module.css` | ~600 行 | FlowTree 专用节点样式 |
| `canvas.components.module.css` | ~500 行 | ComponentsTree 专用节点样式 |
| `canvas.panels.module.css` | ~400 行 | 侧边面板、抽屉、折叠 |
| `canvas.thinking.module.css` | ~200 行 | AI Thinking 动画、打字效果 |
| `canvas.export.module.css` | ~200 行 | 导出进度、导出弹窗 |
| `canvas.misc.module.css` | ~300 行 | Toast、错误状态、空状态 |
| **剩余 canvas.module.css** | < 500 行 | 聚合 @use、少量未分类样式 |

---

## 验收标准

### 文件结构

```ts
// 主文件行数减少
expect(file('canvas.module.css')).toHaveLinesLessThan(500)

// 子文件数量正确
expect(glob('canvas.*.module.css')).toHaveLength(12) // 含主文件 + 11 子文件

// 每个子文件独立存在
expect(file('canvas.base.module.css')).toBeDefined()
expect(file('canvas.toolbar.module.css')).toBeDefined()
expect(file('canvas.context.module.css')).toBeDefined()
expect(file('canvas.flow.module.css')).toBeDefined()
expect(file('canvas.components.module.css')).toBeDefined()
expect(file('canvas.export.module.css')).toBeDefined()
```

### 视觉一致性（gstack 截图对比）

```ts
// 拆分前截图基准（由 QA 在 Epic 开始前拍摄）
const baselineScreenshots = [
  'canvas-baseline-fullpage.png',
  'canvas-baseline-toolbar.png',
  'canvas-baseline-context-tree.png',
  'canvas-baseline-flow-tree.png',
  'canvas-baseline-export.png',
]

// 拆分后逐组件截图对比
for (const screenshot of baselineScreenshots) {
  const name = screenshot.replace('-baseline-', '-refactored-')
  expect(gstack.screenshot(name)).toMatchImage(baselineScreenshots[screenshot])
}
```

### 构建产物

```ts
// 未使用的 CSS 不打包（tree-shaking 验证）
expect(bundleSize('canvas.chunk.css')).toBeLessThan(originalCanvasCSSSize * 1.05)

// 主入口文件仅包含 @use 聚合，无实际样式
expect(file('canvas.module.css')).not.toMatch(/^\.(canvas|toolbar|tree)/m)
```

### 功能回归

```ts
// 所有交互功能样式正常
expect(screen.getByRole('button', { name: /展开/ })).toBeVisible()
expect(screen.getByRole('tree')).toBeRendered()
expect(screen.getByRole('button', { name: /导出/ })).toBeEnabled()
```

---

## 风险缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 样式迁移错误 | 高 | 逐文件迁移，每迁移一个文件 gstack 截图对比 |
| 选择器名冲突 | 中 | 使用 CSS Modules 天然隔离 |
| 打包后 CSS 增大 | 中 | 验证构建产物大小增幅 < 5% |
| 子文件间 @use 循环 | 低 | 拆分时避免互相引用 |

---

## DoD Checklist

- [ ] `canvas.module.css` 行数 < 500 行
- [ ] 11 个子文件全部独立存在
- [ ] gstack 逐组件截图对比无视觉差异
- [ ] 构建产物大小增幅 < 5%
- [ ] 所有交互功能样式正常（按钮、树、面板、导出）
- [ ] 每个 CSS 文件拆分单独 commit
- [ ] `tsc --noEmit` 零错误
