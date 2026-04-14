# Spec: E1 - Auth 页面 CSS Module 迁移规格

## 迁移检查

```typescript
const forbiddenInlineStyles = [
  "backgroundColor: '#f8f9fa'",
  "backgroundColor: 'white'",
  "color: '#0070f3'",
  "color: '#64748b'",
  "border: '1px solid #e2e8f0'",
  "boxShadow: '0 4px 24px rgba(0,0,0,0.08)'",
];

test('Auth 页面无内联浅色样式', () => {
  const content = fs.readFileSync('auth/page.tsx', 'utf8');
  forbiddenInlineStyles.forEach(style => {
    expect(content).not.toContain(style);
  });
});
```

## CSS Module 规范

- `auth.module.css`: 复用 Dashboard 背景系统（网格 + 发光球）
- 玻璃态: `backdrop-filter: blur(20px)`, `border: 1px solid var(--color-border)`
- 按钮: `--gradient-primary` + `--shadow-glow-cyan`
- 无内联 `style={{`，全部迁移到 CSS Module
