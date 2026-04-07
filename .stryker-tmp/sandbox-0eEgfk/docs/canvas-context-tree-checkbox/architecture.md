# Architecture Document — canvas-context-tree-checkbox

**项目**: canvas-context-tree-checkbox  
**版本**: v1.0  
**日期**: 2026-04-01  
**作者**: Architect Agent

---

## 1. Tech Stack

| 层 | 技术 | 选择理由 |
|----|------|----------|
| 组件代码 | React + TypeScript（现有） | BoundedContextTree 已为 React 组件，无需引入新框架 |
| 样式 | CSS Modules / Tailwind（现有） | 复用项目既有样式体系 |
| 测试 | Playwright（现有） | 项目已有 Playwright E2E 测试基础设施 |
| 构建 | Vite（现有） | 现有项目依赖 |

> **版本要求**: 无新增依赖，性能影响可忽略（单 checkbox 渲染）。

---

## 2. Architecture Diagram

```mermaid
componentDiagram
    direction LR

    package "BoundedContextTree Card" {
      component Header {
        +nodeId: string
        +nodeName: string
        +selected: boolean
        +onToggleSelect?: (nodeId: string) => void
      }

      component Checkbox {
        +type: "checkbox"
        +checked: boolean
        +aria-label: string
        +onChange: () => void
        +onClick: stopPropagation
      }

      component CardBody {
        +onClick: Ctrl+Click multi-select handler (existing)
      }
    }

    package "State Management" {
      component SelectedNodeState {
        +selectedNodes: Set<string>
      }
    }

    Header --> Checkbox : renders
    Header --> CardBody : contains
    CardBody ..> SelectedNodeState : reads/writes via onToggleSelect
    Checkbox ..> SelectedNodeState : updates via onToggleSelect callback
```

**数据流**:

1. `selectedNodes: Set<string>` 存储当前选中节点 ID
2. 父组件（Tree/Canvas）将 `onToggleSelect` 和 `selected` 状态传入 `BoundedContextTree`
3. Checkbox `onChange` 调用 `onToggleSelect(nodeId)` → 更新 `selectedNodes`
4. CardBody 保留原有的 Ctrl+Click handler（不冲突，并行生效）

---

## 3. API Definitions

### CheckboxProps

```typescript
interface CheckboxProps {
  /** 节点唯一标识 */
  nodeId: string;
  /** 节点显示名称 */
  nodeName: string;
  /** 是否选中 */
  selected: boolean;
  /** 切换选中状态的回调 */
  onToggleSelect?: (nodeId: string) => void;
  /** 自定义样式类名 */
  className?: string;
}
```

**渲染条件**: 仅当 `onToggleSelect` 存在时渲染 checkbox（向后兼容不需要多选的页面）。

### onToggleSelect Callback

```typescript
type OnToggleSelect = (nodeId: string) => void;
```

- 由父组件（持有 `selectedNodes` 状态）提供
- 实现: `setSelectedNodes(prev => toggle(prev, nodeId))`
- 支持多选（Set add/delete 语义）

### BoundedContextTree Props（扩展）

```typescript
interface BoundedContextTreeProps {
  node: BoundedContextNode;
  // 新增:
  selected?: boolean;
  onToggleSelect?: OnToggleSelect;
}
```

---

## 4. Data Model

### SelectedNodeState

```typescript
/** 全局多选状态 — 由父组件持有 */
type SelectedNodeState = Set<string>;

/** 单个节点的选中状态（传递给 BoundedContextTree） */
interface NodeSelectState {
  nodeId: string;
  selected: boolean;
}
```

**更新语义**:

| 操作 | Set 行为 |
|------|----------|
| 点击已选中 | `delete(nodeId)` |
| 点击未选中 | `add(nodeId)` |
| Ctrl+Click body | `add(nodeId)`（已有 handler） |

---

## 5. Testing Strategy

### Framework: Playwright

Playwright 已集成于项目 E2E 测试套件，无需额外安装。

### Test Cases

#### F1.1 — Checkbox Visible

```typescript
test('checkbox visible in card header', async ({ page }) => {
  await page.goto('/canvas');
  const checkbox = page.locator('[data-testid="context-card"] input[type="checkbox"]').first();
  await expect(checkbox).toBeVisible();
});
```

#### F1.2 — Click Toggles Selected

```typescript
test('click checkbox toggles selected state', async ({ page }) => {
  await page.goto('/canvas');
  const checkbox = page.locator('[data-testid="context-card"] input[type="checkbox"]').first();
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  await checkbox.uncheck();
  await expect(checkbox).not.toBeChecked();
});
```

#### F1.3 — Ctrl+Click Backward Compatible

```typescript
test('ctrl+click body still triggers multi-select', async ({ page }) => {
  await page.goto('/canvas');
  const card = page.locator('[data-testid="context-card"]').first();
  await card.click({ modifiers: ['Control'] });
  const checkbox = card.locator('input[type="checkbox"]');
  await expect(checkbox).toBeChecked();
});
```

#### F1.4 — Selected Style Applied

```typescript
test('selected card shows selected style', async ({ page }) => {
  await page.goto('/canvas');
  const card = page.locator('[data-testid="context-card"]').first();
  await card.locator('input[type="checkbox"]').check();
  await expect(card).toHaveClass(/selected/);
});
```

### Coverage Requirements

- 4 个功能点 → 4 个 Playwright 测试用例
- 每个用例包含 `beforeEach` 页面导航 setup
- 使用 `data-testid` 隔离选择器，避免 UI 重构导致测试失效

---

## 6. ADR: Checkbox vs Radio

### Decision: Use Checkbox

**选项对比**:

| 维度 | Checkbox | Radio |
|------|----------|-------|
| 多选支持 | ✅ 原生 | ❌ 需额外逻辑 |
| Ctrl+Click 兼容 | ✅ 自然 | ⚠️ 需屏蔽 |
| BusinessFlowTree 对齐 | ✅ 已有 checkbox | ❌ 不一致 |
| 语义正确性 | ✅ "可选中" | ⚠️ "单选其一" |

**Decision**: Checkbox chosen for multi-select and backward compatibility with existing Ctrl+Click behavior.

**Consequences**:
- ✅ 多选功能零成本复用
- ✅ 与 BusinessFlowTree 视觉/行为一致
- ⚠️ 用户可能误以为所有卡片都可选（需 `aria-label` 澄清）

---

## 7. Performance

| 指标 | 影响 |
|------|------|
| DOM 节点增加 | 1 个 `<input type="checkbox">` / card |
| JS 执行 | `stopPropagation` + `onChange` handler（~0ms） |
| 重渲染 | 仅目标 card 重新渲染（React 天然隔离） |
| 包体积 | 0 新增（纯 JSX 变更） |

**结论**: 性能影响可忽略，无需额外优化。

---

## 8. File Changes Summary

| 操作 | 文件 |
|------|------|
| 修改 | `BoundedContextTreeCard.tsx` — 添加 checkbox JSX |
| 修改 | `BoundedContextTreeCard.module.css` — 样式 |
| 修改 | `e2e/canvas.spec.ts` — 新增 4 个测试用例 |
| 修改 | 类型定义文件（如有 `BoundedContextTreeProps`） |

## 执行决策

- **决策**: 已采纳
- **执行项目**: canvas-context-tree-checkbox
- **执行日期**: 2026-04-01
