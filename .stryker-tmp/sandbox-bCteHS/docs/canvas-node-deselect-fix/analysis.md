# Analysis: Canvas Node Deselect Bug

**Agent**: analyst
**日期**: 2026-04-01
**项目**: canvas-node-deselect-fix

---

## 1. 问题定义

**Bug**: 点击节点外区域无法取消选中节点。

**影响**: 用户选中节点后，必须手动点击其他节点或按 Esc 才能取消选中，体验不流畅。

---

## 2. 现状分析

### 2.1 当前实现

**CanvasPage.tsx** (line 77):
```typescript
const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
```

**Store 方法**:
- `clearNodeSelection(tree)` - 清除指定树的选中状态
- `clearNodeSelection('context')` - 清除上下文选中

### 2.2 现有取消选中方式

| 方式 | 状态 | 说明 |
|------|------|------|
| Esc 键 | ✅ 有 | ShortcutHintPanel |
| 点击其他节点 | ✅ 有 | 切换选中 |
| 点击空白区域 | ❌ 无 | **缺失** |

---

## 3. 修复方案

### 方案 A：Click Outside 监听（推荐）

**原理**: 在 CanvasPage 添加 document click 监听，点击空白区域时清空选中。

**代码**:

```typescript
// CanvasPage.tsx
useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    // 如果点击的不是节点，清空选中
    const target = e.target as HTMLElement;
    if (!target.closest('[data-node-id]')) {
      useCanvasStore.getState().clearNodeSelection('context');
      useCanvasStore.getState().clearNodeSelection('flow');
      useCanvasStore.getState().clearNodeSelection('component');
    }
  };
  
  document.addEventListener('click', handleClickOutside);
  return () => document.removeEventListener('click', handleClickOutside);
}, []);
```

**优点**:
- 覆盖所有树的节点
- 符合用户预期

**工时**: 1h

---

### 方案 B：仅清除当前树选中

**原理**: 只清空当前激活树的选中，不清空其他树。

```typescript
useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-node-id]')) {
      // 只清空当前树
      useCanvasStore.getState().clearNodeSelection(activeTree);
    }
  };
  // ...
}, [activeTree]);
```

**工时**: 1h

---

## 4. 推荐方案

**方案 A**（清空所有树选中）。

**理由**:
1. 用户点击空白区域通常是"放弃当前操作"
2. 代码简单，效果明确
3. 与 Esc 行为一致

---

## 5. 验收标准

| 场景 | 预期 |
|------|------|
| 点击节点外空白区域 | 清空所有选中节点 |
| 按 Esc | 清空所有选中节点 |
| 点击其他节点 | 切换选中 |

---

## 6. 下一步

1. **派发开发**: `dev-canvas-deselect` → 实现方案 A
2. **测试**: E2E 验证点击空白区域清空选中

**工时**: 1h