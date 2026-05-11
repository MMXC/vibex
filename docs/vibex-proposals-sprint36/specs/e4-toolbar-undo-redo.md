# Spec E4: 撤销重做 Toolbar 补全

## 概述

在 DDSToolbar 中添加 Undo/Redo 按钮，连接 canvasHistoryStore 状态。快捷键（Ctrl+Z/Ctrl+Shift+Z）已就绪，只需补 UI。

## 现状分析

- `useKeyboardShortcuts` 已连接 `canvasHistoryStore`（第 405-416 行）
- `ShortcutPanel.tsx` 引用了 Undo/Redo 快捷键说明
- **DDSToolbar.tsx 中无 Undo/Redo 按钮**

## S4.1 DDSToolbar Undo/Redo 按钮

### 文件位置
`vibex-fronted/src/components/toolbar/DDSToolbar.tsx`

### 实现要求

1. 导入必要的依赖：
   ```typescript
   import { useCanvasHistoryStore } from '@/stores/canvasHistoryStore';
   ```

2. 读取 history store 状态：
   ```typescript
   const canUndo = useCanvasHistoryStore(state => state.canUndo);
   const canRedo = useCanvasHistoryStore(state => state.canRedo);
   const undo = useCanvasHistoryStore(state => state.undo);
   const redo = useCanvasHistoryStore(state => state.redo);
   ```

3. 添加按钮 JSX（在工具按钮区域或分隔线后）：
   ```tsx
   <div className="toolbar-group">
     <button
       data-testid="undo-btn"
       onClick={undo}
       disabled={!canUndo}
       title="撤销 (Ctrl+Z)"
       className="toolbar-btn"
     >
       <UndoIcon />
     </button>
     <button
       data-testid="redo-btn"
       onClick={redo}
       disabled={!canRedo}
       title="重做 (Ctrl+Shift+Z)"
       className="toolbar-btn"
     >
       <RedoIcon />
     </button>
   </div>
   ```

4. 图标要求：使用现有 Icon 库（如 lucide-react 的 Undo2/Redo2 图标）

### 样式要求

- 按钮与其他 toolbar 按钮视觉一致（尺寸、间距、hover 状态）
- `disabled` 状态下按钮变灰（opacity: 0.4 或灰度滤镜）
- 按钮有 `title` 属性提供 tooltip

### 已有快捷键不被影响

确认 `useKeyboardShortcuts` 中的 `preventDefault()` 仍然生效：
- `Ctrl+Z` → `undo()`
- `Ctrl+Shift+Z` 或 `Ctrl+Y` → `redo()`

---

## DoD 检查清单

- [ ] `DDSToolbar.tsx` 存在 `data-testid="undo-btn"` 的 button 元素
- [ ] `DDSToolbar.tsx` 存在 `data-testid="redo-btn"` 的 button 元素
- [ ] Undo 按钮调用 `useCanvasHistoryStore.getState().undo()`
- [ ] Redo 按钮调用 `useCanvasHistoryStore.getState().redo()`
- [ ] 按钮 disabled 状态与 canUndo/canRedo 一致
- [ ] `Ctrl+Z` / `Ctrl+Shift+Z` 快捷键在 Toolbar 上线后仍正常（不冲突）
- [ ] TypeScript 类型检查通过
- [ ] ESLint 检查通过
