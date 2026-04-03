# E5 Spec: useCanvasEvents

## 接口设计

```typescript
interface UseCanvasEventsReturn {
  // State
  isSearchOpen: boolean;
  isShortcutPanelOpen: boolean;

  // Open/close
  openSearch: () => void;
  closeSearch: () => void;
  toggleShortcutPanel: () => void;

  // Handlers
  handlers: {
    handleSearchSelect: (result: { id: string; treeType: TreeType }) => void;
    handleMinimapNodeClick: (nodeId: string) => void;
    handlePhaseClick: (phase: Phase) => void;
    handleDeleteSelected: () => void;
    handleKeyboardUndo: () => boolean;
    handleKeyboardRedo: () => boolean;
  };
}
```

## 实现要点

### useKeyboardShortcuts 集成
```typescript
const shortcuts = useMemo(() => [
  { key: 'ctrl+z', handler: handleKeyboardUndo, description: '撤销' },
  { key: 'ctrl+y', handler: handleKeyboardRedo, description: '重做' },
  { key: 'ctrl+f', handler: openSearch, description: '搜索' },
  { key: '?', handler: toggleShortcutPanel, description: '快捷键' },
  { key: 'delete', handler: handleDeleteSelected, description: '删除' },
], [/* deps */]);

useKeyboardShortcuts(shortcuts);
```

### handleSearchSelect 滚动定位
```typescript
const handleSearchSelect = (result: { id: string; treeType: TreeType }) => {
  setIsSearchOpen(false);
  // 滚动画布到对应节点位置
  const rect = nodeRectsMap[result.treeType]?.find(r => r.id === result.id);
  if (rect) {
    setPanOffset({ x: -rect.x + canvasWidth/2, y: -rect.y + canvasHeight/2 });
  }
};
```
