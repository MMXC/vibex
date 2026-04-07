# PRD: VibeX Canvas Checkbox 图标修复

**项目**: vibex-canvas-checkbox-20260328
**版本**: 1.0
**日期**: 2026-03-28
**状态**: Draft
**负责人**: PM

---

## 1. 执行摘要

### 背景

Canvas 相关组件（ComponentSelectionStep、NodeSelector、BoundedContextTree）中存在多处自定义 emoji checkbox 图标（✓/○），采用 `opacity:0` 隐藏原生 `<input type="checkbox">` + emoji 字符作为视觉替代的实现模式。

该模式存在以下问题：
- emoji 字符无法跟随品牌主题色变化
- 深色模式下视觉表现不一致
- 跨浏览器/平台渲染差异大
- 不符合无障碍访问规范

### 目标

将 Canvas 组件中的 emoji checkbox 图标（✓/○）统一替换为**纯 CSS box-style checkbox**（☐/☑），实现：
- 视觉风格与品牌主题色一致
- 支持深色模式自动适配
- 无 emoji 字符残留

### 关键指标

| 指标 | 当前 | 目标 |
|------|------|------|
| emoji 残留数 | 3 处 | 0 处 |
| checkbox 主题色支持 | ❌ | ✅ |
| 深色模式一致性 | ❌ | ✅ |

---

## 2. Epic 1: CSS Checkbox 样式替换

**优先级**: P0
**预计工时**: 3h
**状态**: 待开发

### F1.1: CSS Checkbox 样式定义

**描述**: 定义统一的 `.checkbox` CSS 样式，使用 border + CSS 伪元素绘制 box-style checkbox。

**技术方案**: 方案 B（纯 CSS + SVG 对勾）
- 方框：2px solid border，圆角 3px
- 选中态：背景填充主题色 + 白色对勾
- 未选中态：空心方框，边框为 muted 色

**CSS 规范**:

```css
/* 隐藏原生 checkbox（保留可访问性） */
input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

/* Box checkbox 容器 */
.checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border, #d1d5db);
  border-radius: 3px;
  background: var(--color-bg, #ffffff);
  transition: all 0.15s ease;
  flex-shrink: 0;
}

/* 选中态 */
.checkbox.checked {
  border-color: var(--primary-color, #3b82f6);
  background: var(--primary-color, #3b82f6);
}

/* 对勾伪元素 */
.checkbox.checked::after {
  content: '';
  width: 8px;
  height: 5px;
  border-left: 2px solid white;
  border-bottom: 2px solid white;
  transform: rotate(-45deg) translateY(-1px);
  display: block;
}
```

**涉及文件**:
- `src/components/Canvas/styles/checkbox.module.css`（新建）

---

### F1.2: ComponentSelectionStep.tsx emoji 替换

**描述**: 将 ComponentSelectionStep 卡片中的 emoji checkbox（✓/○）替换为 CSS box checkbox。

**改动点**:

| 位置 | 修改前 | 修改后 |
|------|--------|--------|
| `src/components/Canvas/ComponentSelectionStep.tsx` L92 | `{selected ? '✓' : '○'}` | `<span className={styles.checkbox} aria-hidden="true" />` |

**实现细节**:
- 移除 emoji 字符 `✓` / `○`
- 用 `<span className={styles.checkbox} />` 替代
- 选中态通过 `className={cn(styles.checkbox, isSelected && styles.checked)}` 控制
- 保留 `aria-label` 或 `aria-checked` 供屏幕阅读器使用

**涉及文件**:
- `src/components/Canvas/ComponentSelectionStep.tsx`（修改）
- `src/components/Canvas/ComponentSelectionStep.module.css`（修改）

---

### F1.3: NodeSelector.tsx checkbox 替换

**描述**: 将 NodeSelector 中的自定义 div.checkbox 替换为标准 CSS checkbox 样式。

**改动点**:

| 位置 | 修改前 | 修改后 |
|------|--------|--------|
| `src/components/Canvas/NodeSelector.tsx` L202 | `div.checkbox {isSelected && '✓'}` | `<span className={cn(styles.checkbox, isSelected && styles.checked)} />` |

**实现细节**:
- 移除 `'✓'` 文本内容
- 使用相同的 `.checkbox` / `.checked` CSS 类
- 确保选中/未选中状态切换时有 transition 动画

**涉及文件**:
- `src/components/Canvas/NodeSelector.tsx`（修改）
- `src/components/Canvas/NodeSelector.module.css`（修改）

---

### F1.4: BoundedContextTree.tsx confirmedBadge 替换

**描述**: 将 BoundedContextTree 中的 confirmedBadge emoji（✓）替换为 CSS checkbox 图标。

**改动点**:

| 位置 | 修改前 | 修改后 |
|------|--------|--------|
| `src/components/Canvas/BoundedContextTree.tsx` L161 | `confirmedBadge = '✓'` | `<span className={styles.confirmedIcon} />` + CSS |

**实现细节**:
- confirmedBadge 语义为"已确认"状态指示器
- 使用 `.confirmedIcon` 样式类，与 checkbox 样式保持一致
- 选中（confirmed）态显示对勾，未选中（pending）态显示空框
- 对应 CSS 样式写入 `BoundedContextTree.module.css`

**涉及文件**:
- `src/components/Canvas/BoundedContextTree.tsx`（修改）
- `src/components/Canvas/BoundedContextTree.module.css`（修改）

---

## 3. 验收标准（expect 断言格式）

### 视觉验收

```
expect(screen.queryByText('✓')).toBeNull()       // 无 emoji ✓ 残留
expect(screen.queryByText('○')).toBeNull()      // 无 emoji ○ 残留
expect(screen.queryByText('×')).toBeNull()      // 无 emoji × 残留
expect(document.body.textContent).not.toMatch(/[✓○×]/)  // 全局确认无 emoji
```

### 功能验收

```
// ComponentSelectionStep
const card = screen.getByTestId('component-card-xxx')
expect(card.querySelector('[class*="checkbox"]')).not.toBeNull()
expect(card.querySelector('[class*="checked"]')).not.toBeNull()  // 选中态

// NodeSelector
const nodeCheckbox = screen.getByRole('checkbox', { name: /node label/i })
expect(nodeCheckbox).toBeChecked()

// BoundedContextTree
const confirmedIcon = screen.getByLabelText('已确认')
expect(confirmedIcon.querySelector('[class*="confirmedIcon"]')).not.toBeNull()
```

### 主题色验收

```
// 切换到深色模式后，checkbox 边框色和背景色应自动适配
const checkbox = document.querySelector('[class*="checkbox"]')
expect(getComputedStyle(checkbox).borderColor).not.toBe('transparent')
expect(getComputedStyle(checkbox).backgroundColor).not.toBe('transparent')
```

### 动画验收

```
const checkbox = document.querySelector('[class*="checkbox"]')
expect(getComputedStyle(checkbox).transition).toMatch(/0\.\d+s/)
```

---

## 4. 页面集成标注

### 依赖关系

```
用户操作流
  ↓
CanvasStep (父组件)
  ├── ComponentSelectionStep.tsx  ← F1.2 改动点
  ├── NodeSelector.tsx            ← F1.3 改动点
  └── BoundedContextTree.tsx      ← F1.4 改动点
```

### 样式加载顺序

1. `checkbox.module.css`（新建，统一 checkbox 样式）
2. 各组件 `.module.css`（扩展或覆盖 checkbox 相关样式）

### 兼容性

| 环境 | 要求 |
|------|------|
| Chrome 90+ | ✅ |
| Firefox 90+ | ✅ |
| Safari 14+ | ✅ |
| 深色模式 | ✅ 自动适配 |
| 屏幕阅读器 | ✅ aria-label 保留 |

---

## 5. Out of Scope

- 不修改 Canvas 组件以外的 checkbox 样式
- 不修改 checkbox 的交互逻辑（仅修改视觉表现）
- 不引入第三方 checkbox 库

---

## 6. 风险与依赖

| 风险 | 影响 | 缓解 |
|------|------|------|
| CSS 类名冲突 | 中 | 使用 `.module.css` 局部作用域 |
| 深色模式变量缺失 | 低 | 检查现有 CSS 变量，无则新增 |
| 性能影响（transition） | 极低 | 仅 0.15s 过渡动画 |

---

## 7. 实施计划

| 阶段 | 任务 | 工时 |
|------|------|------|
| 1 | 创建 `checkbox.module.css` 统一样式 | 0.5h |
| 2 | 修改 ComponentSelectionStep.tsx | 0.5h |
| 3 | 修改 NodeSelector.tsx | 0.5h |
| 4 | 修改 BoundedContextTree.tsx | 0.5h |
| 5 | 验收测试 + 截图对比 | 1h |
| **合计** | | **3h** |
