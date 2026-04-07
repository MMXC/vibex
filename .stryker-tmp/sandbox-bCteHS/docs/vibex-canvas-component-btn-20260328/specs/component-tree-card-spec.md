# Spec: 组件树卡片渲染规格

**Story**: S1.4 组件树卡片渲染  
**文件**: `src/components/canvas/component-tree/`

---

## 1. 卡片结构

```tsx
<div data-testid="component-tree-card" className="component-tree-card">
  <div className="card-header">
    <span>组件树</span>
    <button onClick={toggleExpand}>{isExpanded ? '收起' : '展开'}</button>
  </div>
  {isExpanded && (
    <div className="card-content">
      {components.map(comp => (
        <ComponentNode key={comp.id} {...comp} />
      ))}
    </div>
  )}
</div>
```

## 2. 验收断言

```ts
// F1.4.1 卡片渲染
await page.waitForSelector('[data-testid="component-tree-card"]');
const card = page.locator('[data-testid="component-tree-card"]');
await expect(card).toBeVisible();

// F1.4.2 卡片内容
const card = page.locator('[data-testid="component-tree-card"]');
await expect(card.locator('.card-content')).not.toBeEmpty();

// F1.4.3 交互性
const toggleBtn = page.locator('[data-testid="component-tree-card"] button');
await expect(toggleBtn).toContainText('展开');
await toggleBtn.click();
await expect(toggleBtn).toContainText('收起');
```
