# AGENTS.md — tree-toolbar-consolidation 开发约束

**项目**: tree-toolbar-consolidation
**日期**: 2026-04-04
**仓库**: /root/.openclaw/vibex

---

## 1. 开发约束

### 1.1 核心约束

```typescript
// ✅ 正确：TreePanel 同时支持 headerActions 和 body actions
<TreePanel
  headerActions={<HeaderToolbarButtons />}
  actions={null}  // 移除原来的 body actions
>
  <TreeRenderer />
</TreePanel>

// ❌ 错误：headerActions 和 actions 同时存在
<TreePanel
  headerActions={<...>}
  actions={<...>}  // ← 禁止，择一使用
>
```

### 1.2 useTreeToolbarActions Hook 约束

```typescript
// ✅ 正确：纯函数，无副作用
export function useTreeToolbarActions(treeType: TreeType): TreeToolbarActions {
  const store = /* ... */;
  return {
    onSelectAll: useCallback(/* ... */, [treeType, store]),
    onDeselectAll: useCallback(/* ... */, [treeType, store]),
    onClear: useCallback(/* ... */, [treeType, store]),
    onContinue: undefined,  // 外部传入，不在 hook 内定义
  };
}

// ❌ 错误：在 hook 内调用 store.setPhase 或其他副作用
```

### 1.3 CSS 约束

```css
/* ✅ 正确：使用 canvas.module.css
/* ❌ 错误：内联 style={{}} */
```

---

## 2. Git 提交规范

```bash
feat(tree-toolbar): TreePanel 新增 headerActions slot
feat(tree-toolbar): useTreeToolbarActions hook 复用事件绑定
feat(tree-toolbar): CanvasPage 三树迁移到 Header actions
style(tree-toolbar): Header 工具栏按钮尺寸和布局
test(tree-toolbar): TreePanel headerActions 单元测试
test(tree-toolbar): useTreeToolbarActions hook 测试
test(tree-toolbar): 三树 Header 按钮 E2E 测试
```

---

## 3. 代码审查清单

### E1-S1 TreePanel headerActions
- [ ] `headerActions` prop 类型为 `React.ReactNode`
- [ ] 渲染位置在 `treePanelHeader` 内部右侧
- [ ] 折叠时 `headerActions` 不可见（`isCollapsed` 条件渲染）
- [ ] 折叠按钮（`treePanelToggle`）不受影响

### E1-S2 useTreeToolbarActions Hook
- [ ] hook 参数为 `treeType: 'context' | 'flow' | 'component'`
- [ ] hook 返回 4 个函数：onSelectAll, onDeselectAll, onClear, onContinue
- [ ] 函数使用 `useCallback` 避免每次 render 创建新引用
- [ ] component tree 的 hook 返回 `onContinue: undefined`

### E1-S3 CanvasPage 迁移
- [ ] 三树（context/flow/component）均使用 `headerActions`
- [ ] flow 和 component 树无继续按钮
- [ ] 原来的 `actions` prop（TreeRenderer 外部包裹）已移除
- [ ] maximize 模式（L820/L871/L908）也使用 `headerActions`

### E1-S4 CSS
- [ ] Header 按钮 min-height 32px（可访问性下限）
- [ ] Header 按钮 max-width 限制（避免撑破 header）
- [ ] 移动端 media query 覆盖

---

## 4. 测试规范

### 4.1 单元测试

```typescript
// __tests__/treePanel-headerActions.test.tsx
it('headerActions 渲染在 header 内', () => {
  render(<TreePanel headerActions={<button>Test</button>} ... />);
  const header = screen.getByTestId('tree-panel-header-context');
  expect(within(header).getByRole('button')).toBeVisible();
});

it('折叠时 headerActions 隐藏', async () => {
  render(<TreePanel headerActions={<button>Test</button>} ... />);
  await userEvent.click(screen.getByTestId('tree-panel-toggle'));
  expect(screen.queryByTestId('tree-panel-header-actions')).not.toBeInTheDocument();
});
```

### 4.2 E2E 测试

```typescript
// e2e/canvas/treeToolbar-header.spec.ts
it('context Header 显示全部 4 个按钮', async ({ page }) => {
  await page.goto('/canvas');
  const actions = page.locator(
    '[data-testid="tree-panel-header-context"] [data-testid="tree-panel-header-actions"]'
  );
  await expect(actions.getByRole('button', { name: /全选/ })).toBeVisible();
  await expect(actions.getByRole('button', { name: /继续/ })).toBeVisible();
});

it('component Header 只显示 3 个按钮（无继续）', async ({ page }) => {
  await page.goto('/canvas');
  const actions = page.locator(
    '[data-testid="tree-panel-header-component"] [data-testid="tree-panel-header-actions"]'
  );
  await expect(actions.getByRole('button', { name: /全选/ })).toBeVisible();
  await expect(actions.queryByRole('button', { name: /继续/ })).not.toBeVisible();
});
```

---

## 5. 回滚条件

| 触发条件 | 回滚操作 |
|---------|---------|
| Canvas 页面崩溃 | `git checkout HEAD --` 相关文件 |
| 工具栏按钮不可见 | 检查 `headerActions` prop 传递 |
| 按钮点击无效 | 检查 `useTreeToolbarActions` hook 返回 |

---

*本文档由 Architect Agent 生成于 2026-04-04 20:30 GMT+8*
