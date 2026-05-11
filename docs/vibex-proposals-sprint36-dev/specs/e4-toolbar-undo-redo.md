# Spec E4: 撤销重做 Toolbar 补全

## S4.1 DDSToolbar Undo/Redo 按钮

### 实现位置
`vibex-fronted/src/components/toolbar/DDSToolbar.tsx`（修改）

### 四态定义（UndoButton + RedoButton）

#### UndoButton

| 状态 | 触发条件 | UI 表现 | 引导文案 |
|------|----------|--------|----------|
| 理想态 | `canUndo === true` | 按钮可点击，hover 状态正常 | title: "撤销 (Ctrl+Z)" |
| 空状态（无 history）| `canUndo === false`（history 为空）| 按钮 disabled，opacity: 0.4 | — |
| 加载态 | — | 按钮状态读取是同步的，无加载态 | — |
| 错误态 | — | Toolbar 按钮无独立错误态，disabled 即为"不可用" | — |

#### RedoButton

| 状态 | 触发条件 | UI 表现 | 引导文案 |
|------|----------|--------|----------|
| 理想态 | `canRedo === true` | 按钮可点击，hover 状态正常 | title: "重做 (Ctrl+Y)" |
| 空状态（无 future）| `canRedo === false`（history stack 空）| 按钮 disabled，opacity: 0.4 | — |

### 实现要求

```typescript
import { useCanvasHistoryStore } from '@/stores/canvasHistoryStore';
import { Undo2, Redo2 } from 'lucide-react';

const canUndo = useCanvasHistoryStore(state => state.canUndo);
const canRedo = useCanvasHistoryStore(state => state.canRedo);

<button
  data-testid="undo-btn"
  disabled={!canUndo}
  onClick={() => useCanvasHistoryStore.getState().undo()}
  title="撤销 (Ctrl+Z)"
  aria-label="撤销 (Ctrl+Z)"
>
  <Undo2 size={18} />
</button>

<button
  data-testid="redo-btn"
  disabled={!canRedo}
  onClick={() => useCanvasHistoryStore.getState().redo()}
  title="重做 (Ctrl+Y)"
  aria-label="重做 (Ctrl+Y)"
>
  <Redo2 size={18} />
</button>
```

### 样式要求

- 按钮尺寸、间距、hover 状态与其他 toolbar 按钮一致
- `disabled` 状态下 opacity: 0.4（灰度滤镜）
- 按钮有 `title` 属性提供 tooltip
- `aria-label` 用于屏幕阅读器

### 已有快捷键不受影响

`useKeyboardShortcuts` 中的 `Ctrl+Z` / `Ctrl+Shift+Z` 通过 `preventDefault()` + `undo()` / `redo()` 调用，与 Toolbar 按钮独立工作：
- 快捷键通过 useEffect 监听（document 级别）
- Toolbar 通过 onClick 事件处理
- 两者不冲突

---

## DoD 检查清单

- [ ] `DDSToolbar.tsx` 存在 `data-testid="undo-btn"` 的 `<button>` 元素
- [ ] `DDSToolbar.tsx` 存在 `data-testid="redo-btn"` 的 `<button>` 元素
- [ ] Undo 按钮调用 `useCanvasHistoryStore.getState().undo()`
- [ ] Redo 按钮调用 `useCanvasHistoryStore.getState().redo()`
- [ ] 按钮 disabled 状态与 canUndo/canRedo 一致
- [ ] `Ctrl+Z` / `Ctrl+Shift+Z` 快捷键在 Toolbar 上线后仍正常工作
- [ ] TypeScript 类型检查通过
- [ ] ESLint 检查通过
- [ ] 四态定义完整（UndoButton + RedoButton）