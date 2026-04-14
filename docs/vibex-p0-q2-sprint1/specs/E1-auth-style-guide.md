# Spec: E1 - Auth 页面 CSS Module 迁移详细规格

## E1.1 迁移检查清单

```typescript
// 验证迁移完成
const checklist = [
  'auth/page.tsx 中无 style={{ 直接赋值',
  'auth/page.tsx 中无 backgroundColor: "#f8f9fa"',
  'auth/page.tsx 中无 backgroundColor: "white"',
  'auth/page.tsx 中无 color: "#0070f3"',
  'auth.module.css 存在',
  'auth.module.css 包含 --color-bg-primary',
  'auth.module.css 包含 backdrop-filter: blur',
  'auth.module.css 包含 --gradient-primary (按钮)',
];
```

## E1.2 背景系统规范

```css
/* 复用 Dashboard 背景系统 */
.background {
  position: fixed;
  z-index: -1;
  width: 100%;
  height: 100%;
  background: var(--color-bg-primary);
}

/* 网格叠加层 */
.gridOverlay {
  background-image:
    linear-gradient(rgba(0, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* 发光球 */
.glowOrb {
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(0, 255, 255, 0.08) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
```

## E1.3 玻璃态卡片规范

```css
.card {
  background: var(--color-bg-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}
```

## E1.4 按钮规范

```css
.button {
  background: var(--gradient-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-4);
  box-shadow: var(--shadow-glow-cyan);
  transition: all var(--duration-normal) var(--ease-out-expo);
}

.button:hover {
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.5), 0 0 60px rgba(0, 255, 255, 0.2);
  transform: translateY(-1px);
}
```

## E1.5 内联样式黑名单

迁移后不得出现以下内联样式值：
- `backgroundColor: '#f8f9fa'`
- `backgroundColor: 'white'`
- `color: '#0070f3'`
- `color: '#64748b'`
- `border: '1px solid #e2e8f0'`
- `boxShadow: '0 4px 24px rgba(0,0,0,0.08)'`
