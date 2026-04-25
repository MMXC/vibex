# Spec — E4: 跨章节边渲染四态

**文件**: `specs/E4-cross-chapter.md`
**Epic**: E4 跨章节边与布局验证
**基于**: PRD vibex-sprint2-qa § E4
**状态**: ✅ 已实现

---

## 组件描述

DDSCanvas 画布区域。负责渲染同章节边和跨章节边（sourceChapter !== targetChapter），跨章节边用不同样式区分。

---

## 四态定义

### 1. 理想态（Ideal）

**触发条件**: DDSCanvas 正常加载，chapters 数据完整，edges 渲染正常

**视觉表现**:
- 同章节边：实线箭头（`stroke: var(--color-accent-primary)`，线宽 `2px`）
- 跨章节边：虚线箭头（`stroke: var(--color-accent-secondary)`，`stroke-dasharray: 5,5`）
- 箭头方向正确（source → target）
- 选中边高亮（`stroke-width: 3px`，`opacity: 1`）
- 未选中边（`opacity: 0.6`）

**交互行为**:
- 点击边 → 选中态高亮，store 同步 `selectedEdgeId`
- 悬停边 → 粗细变化（`stroke-width: 2px → 3px`）
- 删除选中边 → 调用 ConfirmDialog

---

### 2. 空状态（Empty）

**触发条件**: chapters 或 edges 数据为空

**视觉表现**:
- 画布显示空白，背景 `var(--color-canvas-bg)`
- 中心显示空态插画 + 文字「添加卡片或连线开始绘制」
- 文字 `var(--color-text-tertiary)`，字号 `var(--font-size-sm)`
- padding: `var(--space-48)` 居中

**交互行为**:
- 点击画布 → 无选中边
- 无 hover 效果

**情绪引导**: 「添加卡片或连线开始绘制」— 明确引导下一步操作，避免用户面对空白画布困惑。

---

### 3. 加载态（Loading）

**触发条件**: DDSCanvas 初始化，chapters/edges 数据加载中

**视觉表现**:
- 画布区域显示骨架屏（`var(--skeleton-bg)`）
- 骨架屏包含 3 个卡片占位符（`var(--space-160) × var(--space-80)`）+ 2 条边占位符
- 骨架屏动画 `opacity: 0.6 → 1` 循环

**交互行为**:
- 禁止交互（`pointer-events: none`）
- 加载完成后骨架屏消失，内容淡入（`fade-in 200ms`）

---

### 4. 错误态（Error）

**触发条件**: edges 数据加载失败或章节数据损坏

**视觉表现**:
- 画布区域显示错误插画 + 文字「数据加载失败」
- 背景 `var(--color-surface-error)` 淡色
- 「重试」按钮（`var(--color-primary)`）
- 已正确加载的部分保留显示

**交互行为**:
- 点击「重试」→ 重新加载数据
- 错误数据不渲染（已损坏的 edge 不显示）

**情绪引导**: 「数据加载失败」+ 重试按钮 — 不吓唬用户，告诉他可以修复。

---

## 技术约束

- **跨章节边识别**: `edge.sourceChapter !== edge.targetChapter`
- **禁止硬编码颜色**: 使用 `var(--color-accent-primary)` / `var(--color-accent-secondary)`
- **禁止硬编码间距**: 使用 `var(--space-*)`
- **禁止硬编码尺寸**: 使用 `var(--line-width)` 等 Token
