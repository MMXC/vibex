# Spec: Epic2 — Canvas UX 修复

## 概述
修复 Canvas 页面加载阶段白屏/闪烁问题。gstack 验证确认 `CanvasPage.tsx` 无 Suspense/Skeleton，`canvasStore.ts` 无 isLoading 状态。

## 影响文件
- `vibex-fronted/src/app/canvas/CanvasPage.tsx`
- `vibex-fronted/src/components/canvas/CanvasSkeleton.tsx`（新建）
- `vibex-fronted/src/stores/shortcutStore.ts`
- `vibex-fronted/src/components/canvas/features/ShortcutHelpPanel.tsx`（新建）

---

## Spec E2-F1: CanvasSkeleton 组件

### 行为
加载中显示骨架屏，包含 header、tree-panel、toolbar 三个占位区块。

### 实现位置
`vibex-fronted/src/components/canvas/CanvasSkeleton.tsx`

```tsx
export function CanvasSkeleton() {
  return (
    <div data-testid="canvas-skeleton" className="canvas-skeleton">
      <div data-testid="canvas-skeleton-header" className="skeleton-header" />
      <div data-testid="canvas-skeleton-tree-panel" className="skeleton-tree-panel">
        <div className="skeleton-panel-section" />
        <div className="skeleton-panel-section" />
        <div className="skeleton-panel-section" />
      </div>
      <div data-testid="canvas-skeleton-toolbar" className="skeleton-toolbar" />
    </div>
  );
}
```

### 样式
```css
.canvas-skeleton { width: 100%; height: 100vh; background: #fff; }
.canvas-skeleton-header { height: 56px; background: #f0f0f0; animation: pulse 1.5s infinite; }
.canvas-skeleton-tree-panel { height: calc(100vh - 56px); background: #fafafa; }
.skeleton-panel-section { height: 40px; margin: 8px; background: #e8e8e8; border-radius: 4px; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
```

### 验收
```typescript
// CanvasSkeleton.spec.tsx
it('renders skeleton with testids', () => {
  render(<CanvasSkeleton />);
  expect(screen.getByTestId('canvas-skeleton')).toBeVisible();
  expect(screen.getByTestId('canvas-skeleton-header')).toBeVisible();
  expect(screen.getByTestId('canvas-skeleton-tree-panel')).toBeVisible();
});
```

---

## Spec E2-F2: CanvasPage Suspense 集成

### 行为
`CanvasPage` 外层包裹 `<Suspense fallback={<CanvasSkeleton />}>`，数据加载完成前显示骨架屏。

### 实现位置
`vibex-fronted/src/app/canvas/CanvasPage.tsx`

```tsx
import { CanvasSkeleton } from '@/components/canvas/CanvasSkeleton';

export default function CanvasPage() {
  return (
    <Suspense fallback={<CanvasSkeleton />}>
      <Canvas />
    </Suspense>
  );
}
```

### 验收
```typescript
// canvas-loading.spec.ts (Playwright)
it('shows skeleton then disappears after load', async ({ page }) => {
  await page.goto('/canvas');
  await expect(page.locator('[data-testid="canvas-skeleton"]')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('[data-testid="canvas-skeleton"]')).not.toBeVisible({ timeout: 30000 });
});
```

---

## Spec E2-F3: 快捷键帮助面板

### 行为
按 `?` 键显示/隐藏快捷键帮助面板，列出所有可用快捷键。

### 实现位置
`vibex-fronted/src/components/canvas/features/ShortcutHelpPanel.tsx`

```tsx
export function ShortcutHelpPanel() {
  const [visible, setVisible] = useState(false);
  const shortcuts = [
    { key: '?', label: '显示帮助' },
    { key: 'Delete', label: '删除选中节点' },
    { key: 'Backspace', label: '删除选中节点' },
    { key: 'Ctrl+A', label: '全选' },
    { key: 'Ctrl+Z', label: '撤销' },
    { key: 'Ctrl+Shift+Z', label: '重做' },
  ];

  // 监听 ? 键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?') setVisible(v => !v);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!visible) return null;

  return (
    <div data-testid="shortcut-help-panel" className="shortcut-help-panel">
      {shortcuts.map(s => (
        <div key={s.key} data-testid="shortcut-item" className="shortcut-item">
          <kbd>{s.key}</kbd>
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  );
}
```

### 集成
在 `CanvasPage` 中引入 `<ShortcutHelpPanel />`，放在 `<Canvas />` 内部。

### 验收
```typescript
// shortcut-help.spec.ts
it('? key toggles help panel', async () => {
  render(<CanvasPage />);
  await userEvent.keyboard('?');
  expect(screen.getByTestId('shortcut-help-panel')).toBeVisible();
  await userEvent.keyboard('?');
  expect(screen.queryByTestId('shortcut-help-panel')).not.toBeInTheDocument();
});

it('lists at least 5 shortcuts', async () => {
  render(<CanvasPage />);
  await userEvent.keyboard('?');
  const items = screen.getAllByTestId('shortcut-item');
  expect(items.length).toBeGreaterThanOrEqual(5);
});
```

---

## 工时

- E2-F1: 1h
- E2-F2: 1h
- E2-F3: 2h
- 总计: 4h
