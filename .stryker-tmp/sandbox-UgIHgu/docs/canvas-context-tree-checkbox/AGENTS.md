# AGENTS.md — canvas-context-tree-checkbox

**项目**: canvas-context-tree-checkbox  
**版本**: v1.0  
**日期**: 2026-04-01  
**作者**: Architect Agent

---

## 1. Project Context

恢复 BoundedContextTree 卡片 header 中的 checkbox，支持点击选中/取消选中，与现有 Ctrl+Click 多选行为完全兼容。

---

## 2. Rendering Rules

### Checkbox 渲染规则

```tsx
<input
  type="checkbox"
  className={styles.nodeCardCheckbox}
  checked={selected ?? false}
  onChange={() => onToggleSelect?.(node.nodeId)}
  aria-label={`选择上下文 ${node.name}`}
  onClick={(e) => e.stopPropagation()}
/>
```

**强制规则**:

| 规则 | 原因 |
|------|------|
| `type="checkbox"` | 原生多选语义 |
| `aria-label` 必填 | 屏幕阅读器可识别节点名 |
| `stopPropagation` 必加 | 防止点击 checkbox 时触发 CardBody 的 Ctrl+Click handler |
| `checked` 非 `defaultChecked` | React 受控组件，状态与 `selectedNodes` 同步 |
| 条件渲染 `onToggleSelect && (...)` | 兼容不需要多选的页面实例 |

### Checked vs Selected 语义

- `checked`: DOM 属性，对应 `<input type="checkbox">`
- `selected`: 业务状态，对应 `selectedNodes: Set<string>` 中的存在性
- `checked === selected`（单节点视角），两者始终对齐

### 条件渲染

```tsx
{onToggleSelect && (
  <input
    type="checkbox"
    ...
  />
)}
```

仅当父组件传递 `onToggleSelect` 时渲染 checkbox。避免在不需要多选的页面实例中渲染无效 UI。

---

## 3. Backward Compatibility

### Ctrl+Click 多选（现有逻辑）

- **触发**: Ctrl+Click `CardBody`（非 checkbox 区域）
- **Handler**: 已有 `onClick` handler，检测 `e.ctrlKey`
- **行为**: `add(nodeId)` 到 `selectedNodes`

### Checkbox Click（新增逻辑）

- **触发**: 点击 header 中的 checkbox
- **Handler**: `onChange` → `onToggleSelect(nodeId)`
- **行为**: `toggle(nodeId)` 在 `selectedNodes` 中 add/delete

### 兼容性保障

- `stopPropagation` 在 checkbox `onClick` 中阻止冒泡
- 两者操作同一 `selectedNodes` 状态源（无冲突）
- Ctrl+Click 仍可在任意卡片 body 区域触发（不依赖 checkbox 存在）

---

## 4. E2E Test Cases

### Test File: `e2e/canvas.spec.ts`

#### F1.1 — Checkbox 可见

```typescript
test('F1.1: checkbox visible in BoundedContextTree card header', async ({ page }) => {
  await page.goto('/canvas');
  // 等待卡片加载
  await page.waitForSelector('[data-testid="context-card"]');
  const checkboxes = page.locator('[data-testid="context-card"] input[type="checkbox"]');
  await expect(checkboxes.first()).toBeVisible();
  // 验证 aria-label
  await expect(checkboxes.first()).toHaveAttribute('aria-label', /选择上下文/);
});
```

#### F1.2 — Click Toggles Selected

```typescript
test('F1.2: click checkbox toggles selected state', async ({ page }) => {
  await page.goto('/canvas');
  await page.waitForSelector('[data-testid="context-card"]');
  const checkbox = page.locator('[data-testid="context-card"] input[type="checkbox"]').first();
  // 选中
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  // 取消选中
  await checkbox.uncheck();
  await expect(checkbox).not.toBeChecked();
});
```

#### F1.3 — Ctrl+Click Body Compatible

```typescript
test('F1.3: ctrl+click card body still triggers multi-select', async ({ page }) => {
  await page.goto('/canvas');
  await page.waitForSelector('[data-testid="context-card"]');
  const card = page.locator('[data-testid="context-card"]').first();
  // Ctrl+Click card body (avoiding checkbox area)
  await card.click({ modifiers: ['Control'] });
  const checkbox = card.locator('input[type="checkbox"]');
  await expect(checkbox).toBeChecked();
  // Click again to deselect
  await card.click({ modifiers: ['Control'] });
  await expect(checkbox).not.toBeChecked();
});
```

#### F1.4 — Selected Style Applied

```typescript
test('F1.4: selected card shows selected visual style', async ({ page }) => {
  await page.goto('/canvas');
  await page.waitForSelector('[data-testid="context-card"]');
  const card = page.locator('[data-testid="context-card"]').first();
  const checkbox = card.locator('input[type="checkbox"]');
  await checkbox.check();
  await expect(card).toHaveClass(/selected/);
  await checkbox.uncheck();
  await expect(card).not.toHaveClass(/selected/);
});
```

---

## 5. Test Selectors

| 选择器 | 用途 | 说明 |
|--------|------|------|
| `[data-testid="context-card"]` | 定位卡片 | 前端需添加 `data-testid` 属性 |
| `input[type="checkbox"]` | 定位 checkbox | 精确匹配 checkbox 元素 |
| `aria-label` | 验证无障碍 | 匹配 `/选择上下文/` 正则 |

**前端配合项**: 在 `BoundedContextTreeCard` 根元素添加 `data-testid="context-card"`。

---

## 6. Critical Notes

1. **stopPropagation 是必须的** — 否则 checkbox 点击会同时触发 CardBody 的 Ctrl+Click handler，导致意外行为
2. **不要用 defaultChecked** — 必须使用受控组件模式（`checked={selected}`）
3. **条件渲染保护** — `onToggleSelect` 不存在时不渲染 checkbox，保持向后兼容
4. **data-testid 需前端配合** — E2E 测试依赖前端添加 `data-testid="context-card"`

## 执行决策

- **决策**: 已采纳
- **执行项目**: canvas-context-tree-checkbox
- **执行日期**: 2026-04-01
