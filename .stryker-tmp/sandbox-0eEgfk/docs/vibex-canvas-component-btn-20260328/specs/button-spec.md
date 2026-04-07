# Spec: 「继续·组件树」按钮实现规格

**Story**: S1.1 按钮添加与可见性  
**文件**: `src/app/canvas/page.tsx`

---

## 1. 按钮位置

- 位置：流程树画布底部工具栏
- 布局：在其他操作按钮（如「保存」「预览」）旁边

## 2. 按钮样式

```tsx
<Button
  variant="primary"
  onClick={handleContinueToComponentTree}
  disabled={!flowData || isLoading}
>
  {isLoading ? '加载中...' : '继续·组件树'}
</Button>
```

## 3. Props

| 属性 | 类型 | 说明 |
|------|------|------|
| variant | 'primary' \| 'secondary' | 按钮样式 |
| disabled | boolean | 是否禁用 |
| onClick | () => void | 点击回调 |
| children | ReactNode | 按钮文案 |

## 4. 验收断言

```ts
// F1.1.1 按钮存在性
expect(page.locator('button:has-text("继续·组件树")')).toBeVisible();

// F1.1.3 按钮文案
const btn = page.locator('button:has-text("继续·组件树")');
await expect(btn).toHaveText('继续·组件树');
```
