# 分析文档: canvas-scroll-top-bug

**日期**: 2026-04-01
**分析员**: Coord（根因已由 GLM Bot Team 提供）

---

## 问题描述

从"需求输入"页面切换到"画布"模式时，顶部工具栏区域（需求/消息/历史/导出/搜索按钮等）完全不可见。

**影响范围**: 画布页面所有非 fixed 定位的 UI 元素

**影响程度**: 灾难性 — 用户进入画布后几乎无法操作任何核心 UI

---

## 根因分析（GLM Bot Team 提供）

### 根因
`canvasContainer.scrollTop = 946` — 画布容器内部被向下滚动了 946px。

从初始"需求输入"页面过渡到"画布"模式时，`canvasContainer` 的 `scrollTop` 没有被重置为 0，滚动位置被保留。

### 受影响元素偏移量
| 元素 | top 偏移 | 可见性 |
|------|----------|--------|
| 阶段进度条 | -946px | ❌ 不可见 |
| Tab 栏 | -855px | ❌ 不可见 |
| 项目工具栏 | -795px | ❌ 不可见 |
| 阶段标签栏 | -722px | ❌ 不可见 |
| 三树面板区域 | -684px | ❌ 不可见 |
| 展开控制按钮 | +64px | ✅ 可见（fixed）|
| 撤销/重做栏 | +16px | ✅ 可见（fixed）|

### 根因代码位置（推断）
进入 canvas 模式时的状态切换 / 路由跳转逻辑中，未重置 `canvasContainer` 的滚动位置。

---

## 修复方案

### 方案 A（推荐）
```tsx
// 在 canvas 初始化/状态切换时
const container = document.querySelector('[class*=canvasContainer]');
if (container) container.scrollTop = 0;
```

### 方案 B
```css
.canvasContainer {
  overflow: hidden;
}
```

---

## 验收标准

1. 从需求输入页切换到画布模式后，顶部工具栏立即可见
2. 无需手动滚动即可看到所有工具栏按钮（需求/消息/历史/导出/搜索）
3. Tab 栏（上下文/流程/组件）可见
4. 阶段进度条可见

---

## 技术风险

**风险**: 低 — 单行代码修复，根因明确
**工作量**: < 30 分钟

