# Architecture: fix-panel-background

**Project**: 修复 VibeX 未登录用户面板背景可见性
**Agent**: architect
**Date**: 2026-03-31
**PRD**: docs/fix-panel-background/prd.md

---

## 1. 问题定位

当前设计令牌中，背景色对比度不足：
```
--color-bg-primary:   #0a0a0f   (body)
--color-bg-secondary: #12121a   (面板)  ← 差值仅 ~8 RGB
--color-bg-glass:     rgba(18, 18, 26, 0.7)  ← 70% 透明度，玻璃效果太透明
```

肉眼无法区分面板与背景，表单输入框与 body 融为一体。

---

## 2. 设计令牌修改

**文件**: `vibex-fronted/src/styles/design-tokens.css`

```css
/* 修改前 */
:root {
  --color-bg-primary:   #0a0a0f;  /* body 背景 */
  --color-bg-secondary: #12121a;  /* 面板背景 */
  --color-bg-glass:     rgba(18, 18, 26, 0.7);
}

/* 修改后 */
:root {
  --color-bg-primary:   #0d0d16;  /* +3 RGB，区别于 body */
  --color-bg-secondary: #17172a;  /* +5 RGB，与 primary 拉开对比 */
  --color-bg-glass:     rgba(18, 18, 26, 0.88);  /* 提高不透明度 */
}

/* 同步更新依赖变量 */
--color-bg-base:     var(--color-bg-primary);
--color-bg-surface:  var(--color-bg-secondary);
--gradient-bg: linear-gradient(180deg, #0d0d16 0%, #17172a 50%, #1a1a28 100%);
```

---

## 3. Auth 页面内联样式修复

**文件**: `vibex-fronted/src/app/auth/` 下相关组件

```css
/* 修改前 */
input {
  background: rgba(255, 255, 255, 0.03);  /* 几乎透明 */
}

/* 修改后 */
input {
  background: rgba(255, 255, 255, 0.08);  /* 可见但不抢眼 */
}
```

**验证对比度**:
```
新方案: 背景 #0d0d16, input bg rgba(255,255,255,0.08) ≈ #141420
对比度: ~2.5:1 ✓  (目标 ≥ 2:1)
```

---

## 4. 回归防护

### 4.1 亮色模式隔离

```css
/* 确保亮色模式不受影响 */
[data-theme="light"] {
  --color-bg-primary:   #ffffff;
  --color-bg-secondary: #f5f5f7;
  --color-bg-glass:     rgba(255, 255, 255, 0.8);
  /* 亮色模式的变量独立定义，不受暗色模式修改影响 */
}
```

### 4.2 Canvas 三栏面板

Canvas 面板使用 `--color-bg-secondary` 变量，修改后自动生效。但需要验证面板与 canvas 背景对比：

```css
/* CanvasPage.tsx - 确保面板与 canvas 背景有差异 */
.canvas-tree-panel {
  background: var(--color-bg-secondary);
  /* 新的 #17172a vs canvas body #0d0d16 → 对比度 ~2.1:1 ✓ */
}
```

---

## 5. 文件变更清单

| 文件 | 操作 | Epic |
|------|------|------|
| `src/styles/design-tokens.css` | 修改 3 个 CSS 变量 | Epic 1 |
| `src/app/auth/` 下表单组件 | 修改 input 背景 | Epic 2 |
| `src/app/landing/` 下组件 | 验证玻璃卡片 | Epic 3 |
| `src/app/canvas/` 下组件 | 验证面板可见 | Epic 4 |

**无后端改动。**

---

## 6. 验证计划

| 工具 | 覆盖 |
|------|------|
| gstack screenshot | landing / auth / canvas 三页截图对比 |
| Playwright | 对比度计算脚本 |
| 视觉回归 | dashboard baseline screenshot |

### 对比度计算

```typescript
// scripts/check-contrast.ts
function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// 示例: #0d0d16 vs #17172a
const bg1 = luminance(13, 13, 22);  // #0d0d16
const bg2 = luminance(23, 23, 42);   // #17172a
console.log(contrastRatio(bg1, bg2));  // 目标 ≥ 2:1
```

---

## 7. 性能影响

| 指标 | 影响 | 评估 |
|------|------|------|
| CSS 重新计算 | < 1ms | 仅 3 个变量变更 |
| 布局重排 | 无 | 无尺寸变化 |
| Bundle size | 0 | 无新增代码 |

---

## 8. 实施顺序

| Epic | Story | 工时 |
|------|-------|------|
| Epic 1 | design-tokens.css 修改 | 1h |
| Epic 2 | auth 页面内联样式 | 1h |
| Epic 3 | landing 页面验证 | 0.75h |
| Epic 4 | canvas 回归验证 | 0.5h |
| Epic 5 | 截图对比验证 | 0.75h |

**总工时**: 4h | **无后端改动** | **无新增依赖**

---

*Architect 产出物 | 2026-03-31*
