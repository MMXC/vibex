# S9 Epic 6 Spec: Canvas 全局搜索

## 概述
Canvas 内搜索功能缺失。Dashboard 有项目搜索，但 Canvas 内搜索和跨 Canvas 搜索均不存在。

---

## F6.1 Canvas 内搜索

### 描述
Canvas 画布内添加搜索框，实时过滤节点，高亮匹配文本。

### 技术方案
- 搜索框：`src/components/canvas/CanvasSearch.tsx`
- 状态：`useState` 存储 query，`useMemo` 过滤节点
- 高亮：节点 label 中 query 文本用 `<mark>` 包裹

### UI 规范
- 搜索框位置：Canvas 工具栏右侧
- 宽度：240px
- placeholder: "搜索节点..."
- 结果展示：Popover浮层，最多显示 10 条

### DoD
- [ ] 搜索框可见（`data-testid="canvas-search-input"`）
- [ ] 输入后即时过滤，`.search-result-item` 可见
- [ ] 搜索结果有 `.search-highlight` 高亮
- [ ] 无匹配时显示"未找到"
- [ ] 搜索响应 < 200ms
- [ ] `npx vitest run search.test.ts` 通过

---

## F6.2 键盘快捷键

### 描述
`/` 聚焦搜索框，Escape 关闭。

### 实现
```ts
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === '/' && !isInputFocused()) {
      e.preventDefault()
      searchInputRef.current?.focus()
    }
    if (e.key === 'Escape') {
      searchInputRef.current?.blur()
      setQuery('')
    }
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [])
```

### DoD
- [ ] `/` 键聚焦搜索框（`input`).toBeFocused()`）
- [ ] Escape 关闭搜索（blur + 清空 query）
- [ ] `.search-results-popover` 在 Escape 后隐藏
