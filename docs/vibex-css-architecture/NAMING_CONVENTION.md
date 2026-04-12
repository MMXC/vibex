# Canvas CSS 类名命名规范

**版本**: 2026-04-12
**状态**: 生效
**适用范围**: `src/components/canvas/` 下所有 CSS Modules

---

## 1. 命名风格分层

### canvas 子模块层（`canvas.*.module.css`）

| 用途 | 风格 | 示例 |
|------|------|------|
| 静态类名（直接引用） | camelCase | `.queueItemQueued`, `.nodeTypeMarker`, `.canvasContainer` |
| 静态类名（BEM 变体） | kebab-case + 双破折号 | `.nodeTypeMarker--start`, `.iconBtn--edit`, `.flowCard--active` |
| 静态类名（BEM 元素） | kebab-case | `.flowCardHeader`, `.nodeCardActions`, `.treePanelBody` |
| 动态类名（bracket notation） | **camelCase 首字母大写** | 见 §2 |
| CSS 变量选择器（BEM modifier） | kebab-case | `.phase_completed`, `.phase_active` |

### 独立组件层（各自 `*.module.css`）

| 用途 | 风格 | 示例 |
|------|------|------|
| 全部类名 | kebab-case（BEM） | `.export-status`, `.export-status-success` |

---

## 2. 动态类名处理规范

### 规则：首字母大写 camelCase

```tsx
// ✅ 正确
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const variant = 'queued'; // 原始值（小写）
const key = `queueItem${capitalize(variant)}`; // → 'queueItemQueued'
<div className={styles[key]}>

// ❌ 错误（snake_case，已造成 bug）
const key = `queueItem_${statusVariant}`; // → 'queueItem_queued'
// CSS 中定义的是 .queueItemQueued，不是 .queueItem_queued
```

### 首字母大写辅助函数

```typescript
// 放在组件文件顶部或 shared utils 中
const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

// 边界情况已覆盖
capitalize('')   // → ''（空字符串）
capitalize('a')  // → 'A'（单字符）
```

### BEM 变体动态类名

BEM modifier 使用 `--` 分隔，不需要首字母大写转换：

```tsx
// ✅ BEM 变体：直接拼接
const variant = 'edit'; // 已经是小写
const key = `iconBtn--${variant}`; // → 'iconBtn--edit'
<div className={styles[key]}>
```

---

## 3. CSS Modules 类型

- **全局声明**（`src/types/css-modules.d.ts`）：所有 `*.module.css` 导出 `{ [key: string]: string }`
- **canvas 枚举**（`canvas.*.module.css.d.ts`）：枚举全部类名，提供精确类型检查
- 修改 CSS 时同步更新对应 `.d.ts` 文件

---

## 4. @forward 聚合规范

```css
/* ✅ 正确：@forward 导出类名 */
@forward './canvas.export.module.css';
@forward './canvas.flow.module.css';

/* ❌ 错误：@use 不导出类名到聚合层 */
@use './canvas.export.module.css'; /* ← 这是 70ed0a1a 之前的问题 */
```

---

## 5. 违规模板（Reviewer 拦截）

```tsx
// ❌ 违规模板 1：snake_case 动态访问
styles[`queueItem_${statusVariant}`]

// ❌ 违规模板 2：模板字符串中直接拼接下划线
styles[`${prefix}_${suffix}`]

// ❌ 违规模板 3：全小写访问 camelCase 定义
styles['queueitemqueued']
```

---

## 6. 已有规范对照

| 文件 | 风格 | 状态 |
|------|------|------|
| `canvas.export.module.css` | camelCase（.queueItemQueued 等） | ✅ 符合 |
| `canvas.flow.module.css` | camelCase + BEM 变体 | ✅ 符合 |
| `canvas.base.module.css` | BEM modifier（.phase_completed 等） | ✅ 符合 |
| `canvas.context.module.css` | kebab-case（BEM） | ✅ 符合 |
| `ExportMenu.module.css` | kebab-case（BEM） | ✅ 符合 |
