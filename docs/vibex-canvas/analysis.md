# Vibex Canvas CSS 布局问题 — 需求分析报告

**项目**: vibex-canvas
**任务**: analyze-requirements
**日期**: 2026-04-11
**作者**: Analyst Agent
**状态**: ✅ 完成

---

## 1. 业务场景分析

### 1.1 问题背景

VibeX Canvas 页面（`/canvas`）出现 CSS 布局错乱。经 Research 定位，问题根因明确：

**CSS Module 子模块拆分引入了架构性错误**（commit `8f2208e8`）。

### 1.2 根因定位

`canvas.module.css` 聚合了 11 个子 CSS 模块：

```
canvas.module.css
├── canvas.base.module.css
├── canvas.toolbar.module.css
├── canvas.trees.module.css
├── canvas.context.module.css
├── canvas.flow.module.css
├── canvas.components.module.css
├── canvas.panels.module.css
├── canvas.thinking.module.css
├── canvas.export.module.css
└── canvas.misc.module.css
```

**错误**: 使用了 `@use` 指令而非 `@forward`：

```css
/* 当前（错误）*/
@use './canvas.panels.module.css';   /* treePanel 类在 panels 模块 */
@use './canvas.trees.module.css';    /* nodeCard 类在 trees 模块 */

/* 组件中 import styles from './canvas.module.css'
   → styles.treePanel === undefined ❌ */
```

**为什么错**: CSS `@use` 类似于 ESM `import` — 类名不以顶层形式暴露，无法通过父模块访问子模块的类。

**症状**: 部署页面 HTML 中可见：

```html
<div class="undefined undefined " style="--tree-color:var(--color-primary)">
```

13 个组件从 `canvas.module.css` 导入样式，引用子模块中的类（`treePanel`、`nodeCard`、`treePanelHeader` 等）—— 全部解析为 `undefined`。

### 1.3 受影响组件（13 个）

| 组件 | 引用的子模块类 | 状态 |
|------|--------------|------|
| `CanvasPage.tsx` | `treePanelsGrid`, `treePanelsGridWithLeftDrawer` | ⚠️ |
| `TreePanel.tsx` | `treePanel`, `treePanelHeader`, `treePanelChevron`, `treePanelBody` | ❌ 核心 |
| `BoundedContextTree.tsx` | `nodeCard`, `nodeConfirmed`, `nodeUnconfirmed` | ❌ |
| `BusinessFlowTree.tsx` | `nodeCard`, `flowNodeConfirmed` | ❌ |
| `ComponentTree.tsx` | `componentCard` | ❌ |
| `ComponentTreeCard.tsx` | `componentCard`, `componentConfirmed` | ❌ |
| `CanvasToolbar.tsx` | `toolbarButton` | ❌ |
| `ProjectBar.tsx` | `projectBar`, `projectBarButton` | ❌ |
| `TreeToolbar.tsx` | `treeToolbar` | ❌ |
| `PhaseProgressBar.tsx` | `phaseProgressBar`, `phaseItem` | ❌ |
| `BoundedContextGroup.tsx` | `contextGroup` | ❌ |
| `PrototypeQueuePanel.tsx` | `prototypeQueuePanel` | ❌ |
| `TreeStatus.tsx` | `treeStatus` | ❌ |
| `features/SortableTreeItem.tsx` | `sortableItem` | ❌ |

---

## 2. 技术方案选项

### 方案 A — 将 `@use` 改为 `@forward`（推荐）

**思路**: 使用 CSS `@forward` 指令，将子模块的类名前向导出到顶层。子模块保持不变，聚合文件改动极小。

```css
/* canvas.module.css */
@forward './canvas.base.module.css';
@forward './canvas.toolbar.module.css';
@forward './canvas.trees.module.css';
@forward './canvas.panels.module.css';
/* ... */
```

**优点**:
- 最小改动（仅改聚合文件）
- 保持组件现有 `import styles from './canvas.module.css'` 不变
- 子模块完整性不变

**缺点**:
- 需确认子模块间无命名冲突（`canvas.module.css` 中类名会合并）
- 若后续有冲突，需加前缀或用 `@forward './x' as x--` 隔离

**风险**: 中。需扫描 11 个子模块确认无同名类。

---

### 方案 B — 组件直连子模块（保守方案）

**思路**: 每个组件直接 `import styles from './canvas.{submodule}.module.css'`。

```tsx
// TreePanel.tsx 改前
import styles from './canvas.module.css';

// TreePanel.tsx 改后
import panelStyles from './canvas.panels.module.css';
import baseStyles from './canvas.base.module.css';
```

**优点**:
- 完全消除命名空间歧义
- 显式依赖，代码可读性高

**缺点**:
- 改动范围大（13 个组件 + 子模块各自需确认路径）
- 拆分架构本意是减少单文件大小，组件直连破坏聚合价值
- 回退成本高

**风险**: 高。改动量 + 回归风险。

---

### 方案 C — 合并回单一 CSS 文件（回退）

**思路**: 将所有子模块内容合并回 `canvas.module.css`，回退拆分。

```css
/* canvas.module.css */
/* 包含原来 canvas.module.css + 所有 11 个子模块的内容 */
```

**优点**: 彻底解决 `@use` 问题，恢复到拆分前状态。

**缺点**:
- 失去拆分意义（单文件超过 500 行的治理价值）
- 未来再次拆分时仍会遇到同样问题
- 历史工作浪费

**风险**: 中。但非正确方向。

---

## 3. 可行性评估

| 维度 | 评分 | 说明 |
|------|------|------|
| 技术难度 | ⭐ 低 | CSS `@forward` 是标准 PostCSS 功能 |
| 工期 | 0.5d | 仅改 `canvas.module.css`，加一轮 QA |
| 风险 | 中 | 需验证无类名冲突 |
| 收益 | 高 | 修复所有受影响组件的样式问题 |

**结论**: 方案 A 优先。技术可行、风险可控、收益明确。

---

## 4. 初步风险识别

### 风险 1 — 子模块类名冲突（高）
若 `canvas.trees.module.css` 和 `canvas.panels.module.css` 定义了同名的类（如 `.active`），`@forward` 会导致后者覆盖前者。

**缓解**: 先扫描所有子模块的顶层类名，列出冲突清单。若有冲突，用 `@forward './x' as x--` 加前缀隔离。

### 风险 2 — 构建/部署失败（中）
改动 CSS 聚合方式后，需确认 Next.js 构建成功。历史上有 CSS 拆分后出现构建错误的先例（commit `7bb5ae5b`）。

**缓解**: 构建验证通过后再合入主分支。

### 风险 3 — 样式回归（低）
修复 `undefined` 后，之前因 `undefined` 类名被浏览器忽略的样式规则会突然生效，可能改变节点卡片、面板头部的样式表现。

**缓解**: Playwright 截图对比测试，验证修复前后的视觉差异在预期范围内。

### 风险 4 — 内联 `undefined` 类名的 DOM 污染（低）
当前 HTML 中 `class="undefined undefined"` 会导致 CSS 匹配到 `.undefined` 规则（若有）或浪费选择器匹配。修复后这类脏 class 消失。

**缓解**: 无，这是修复收益。

---

## 5. 验收标准

### 5.1 CSS 架构验证
- [ ] `canvas.module.css` 使用 `@forward` 而非 `@use` 聚合子模块
- [ ] 11 个子模块均通过 `@forward` 正确暴露
- [ ] 无类名冲突报告（扫描工具通过）

### 5.2 功能验证
- [ ] Canvas 页面在桌面端正常加载（`https://vibex-app.pages.dev/canvas`）
- [ ] 三树面板均可见，类名解析正常（`class="treePanel ..."` 而非 `class="undefined"`)
- [ ] TabBar、Toolbar、TreePanel 组件渲染正常
- [ ] 移动端 Tab 模式正常切换

### 5.3 视觉回归
- [ ] Playwright 截图对比：修复前后无意外的视觉差异
- [ ] 节点卡片（context/flow/component）样式正常
- [ ] 面板折叠/展开动画正常
- [ ] 深色主题下文本可读性正常

### 5.4 构建验证
- [ ] `pnpm build` 通过
- [ ] 部署至 staging 成功

---

## 6. 历史经验教训

### 来自 `docs/learnings/`

**canvas-api-completion (2026-04-05)**
- Route 顺序敏感性问题：子类路径必须在父类路径之前
- 教训：边界路径需测试覆盖

**react-hydration-fix**
- 内联样式与 CSS 变量系统混合使用是常见 bug 来源

### 来自 Git History

**commit `7bb5ae5b`** — CSS Module violation in `preview.module.css`
- 教训：`*` 选择器不能放在 CSS Module 文件中，必须移到 `globals.css`
- 防范：CSS 子模块拆分后需重新审查是否违反 CSS Modules 约束

**commit `8f2208e8`** — canvas.module.css split into 10 sub-modules
- 本次问题的引入 commit
- 教训：CSS `@use` ≠ `@forward`，拆分架构需同步更新组件的 import 路径或使用 `@forward`

---

## 7. 执行决策

```markdown
## 执行决策
- **决策**: 已采纳
- **执行项目**: vibex-canvas/css-fix-forward
- **执行日期**: 2026-04-11
```

---

*Analyst Agent — 2026-04-11*
