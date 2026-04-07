# Analysis: VibeX Canvas Card Checkbox Icon Fix

**Project**: vibex-canvas-checkbox-20260328
**Analyst**: ANALYST
**Date**: 2026-03-28
**Status**: ✅ 分析完成

---

## 1. 问题定义

### 当前状态（代码分析）

Canvas 相关组件中存在多处**自定义 emoji checkbox 图标**，问题模式如下：

| 位置 | 当前实现 | 问题 |
|------|----------|------|
| `ComponentSelectionStep.tsx` L92 | `{selected ? '✓' : '○'}` emoji | emoji 字符无法随主题色变化，视觉不一致 |
| `NodeSelector.tsx` L202 | `div.checkbox {isSelected && '✓'}` | 同上，自定义 div 模拟 checkbox |
| `BoundedContextTree.tsx` L161 | `confirmedBadge = '✓'` | 纯文本，不支持多主题 |

这些 emoji checkboxes 的共同特征：
1. **原生 checkbox 被隐藏**（`opacity: 0; pointer-events: none`）
2. **emoji 字符作为视觉替代**（✓/○/×）
3. **无法随主题色/品牌色变化**
4. **跨浏览器表现不一致**

### 目标状态

将 emoji checkbox 图标（✓/○）替换为**纯 CSS box-style checkbox**（☐/☑），即：
- 未选中：空心方框（口）
- 选中：实心方框内带对勾（☑）
- 统一使用 CSS + SVG/Unicode 方框字符实现

---

## 2. 业务场景分析

| 维度 | 说明 |
|------|------|
| **场景** | 组件选择、节点选择、上下文确认 |
| **用户** | 产品经理 / 设计师 |
| **核心价值** | 视觉一致性、主题适配、无障碍支持 |
| **当前痛点** | emoji 在不同平台/字体下显示差异大，无法跟随品牌色 |
| **期望体验** | 简洁的方框 checkbox，风格统一 |

---

## 3. 技术方案

### 方案 A：CSS 伪元素 + Unicode 方框（推荐）

**思路**：保留原生 `<input type="checkbox">`，用 CSS `::before` 伪元素替换 emoji 视觉。

```css
/* 隐藏原生 checkbox */
input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

/* 用伪元素渲染方框 */
.checkbox-box::before {
  content: '☐'; /* 未选中 */
  font-size: 16px;
  color: var(--color-text-muted);
}
input[type="checkbox"]:checked + .checkbox-box::before {
  content: '☑'; /* 选中 */
  color: var(--primary-color);
}
```

**优点**：兼容性好，无需 JS，CSS 伪元素跨浏览器支持
**缺点**：Unicode 方框字符在某些字体下渲染不一致

### 方案 B：纯 CSS 绘制 + SVG 对勾

**思路**：用 CSS `border` 绘制方框，`:checked` 时显示 SVG 对勾。

```css
.checkbox-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-radius: 3px;
  background: white;
}
input[type="checkbox"]:checked + .checkbox-box {
  border-color: var(--primary-color);
  background: var(--primary-color);
}
input[type="checkbox"]:checked + .checkbox-box::after {
  content: '✓';
  color: white;
  font-size: 11px;
}
```

**优点**：完全可控，支持品牌色、圆角、动画
**缺点**：需要额外的 CSS 结构（兄弟选择器）

### 方案对比

| 方案 | 工作量 | 兼容性 | 可维护性 | 推荐 |
|------|--------|--------|----------|------|
| A: Unicode 方框 | 2h | ✅ 极好 | 中（依赖字体） | - |
| B: CSS + SVG 对勾 | 3h | ✅ 好 | 高（纯 CSS） | ✅ |

---

## 4. 涉及文件

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `ComponentSelectionStep.tsx` + `.module.css` | 修改 | ✓/○ → box checkbox |
| `NodeSelector.tsx` + `.module.css` | 修改 | ✓ → box checkbox |
| `BoundedContextTree.tsx` | 修改 | confirmedBadge → checkbox 图标 |
| `ComponentTree.tsx` | 检查 | 确认 badge 是否需要修改 |

---

## 5. JTBD 分析

| JTBD | 用户行为 | 验收条件 |
|------|----------|----------|
| JTBD-1: 快速选择多个组件 | 点击 checkbox 选中/取消 | 选中状态立即可见 |
| JTBD-2: 确认上下文节点 | 点击确认 badge | 状态从 pending 变为 confirmed |
| JTBD-3: 理解选中状态 | 视觉上一眼识别已选/未选 | 选中=深色方框对勾，未选=空方框 |

---

## 6. 验收标准

| ID | 验收条件 | 测试方法 |
|----|----------|----------|
| AC-1 | ComponentSelectionStep 选中状态显示 ☑，未选中显示 ☐ | 截图验证 |
| AC-2 | NodeSelector checkbox 选中显示对勾，未选中显示空框 | 交互测试 |
| AC-3 | BoundedContextTree confirmedBadge 改为 checkbox 样式 | 截图验证 |
| AC-4 | 选中/取消选中动画流畅（无闪烁） | 交互测试 |
| AC-5 | 跟随主题色变化（深色模式支持） | 切换主题验证 |
| AC-6 | 无 emoji 字符残留（✓/○/×） | 全文搜索确认 |

---

## 7. 实现建议

### ComponentSelectionStep.tsx

```tsx
// 修改前
<span className={styles.cardIcon}>
  {selectedComponents.includes(comp.id) ? '✓' : '○'}
</span>

// 修改后 - 移除 emoji，直接用 CSS 伪元素
<span className={styles.checkboxIcon} aria-hidden="true" />
```

```css
/* ComponentSelectionStep.module.css */
/* 已有的 hidden input + 新增 box 图标 */
.componentCard input:checked + .cardContent .checkboxIcon {
  /* 选中样式通过 cardContent 变化实现 */
}
```

### NodeSelector.tsx

```tsx
// 修改前
<div className={styles.checkbox}>{isSelected && '✓'}</div>

// 修改后 - 用 CSS box 样式
<div className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`} aria-hidden="true" />
```

### BoundedContextTree.tsx

```tsx
// 修改前
<span className={styles.confirmedBadge} aria-label="已确认">✓</span>

// 修改后
<span className={styles.confirmedBadge} aria-label="已确认">
  <span className={styles.confirmedIcon} />
</span>
```
