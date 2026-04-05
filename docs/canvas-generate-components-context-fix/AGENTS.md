# 开发约束: Canvas Generate Components Context Fix

> **项目**: canvas-generate-components-context-fix  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 强制规范

### 1.1 不得破坏现有行为

- **确认功能**: `toggleContextNode` 仍可通过确认按钮调用
- **其他 checkbox**: 仅修改第 234 行的 checkbox onChange
- **onToggleSelect prop**: 必须保留 optional chaining `?.()`

### 1.2 禁止事项

- **禁止** 移除 `onToggleSelect?.()` 的 `?.`
- **禁止** 在 checkbox onChange 中同时调用两个函数
- **禁止** 修改其他 checkbox 的 onChange

---

## 2. 代码风格

```tsx
// ✅ 正确
onChange={() => { onToggleSelect?.(node.nodeId); }}

// ❌ 错误
onChange={() => { toggleContextNode(node.nodeId); }}
onChange={() => { onToggleSelect(node.nodeId); }}  // 缺少 ?. 可能抛错
```

---

## 3. 审查清单

- [ ] `vitest run` 全部通过
- [ ] `pnpm lint` 无错误
- [ ] 第 234 行改为 `onToggleSelect?.()`
- [ ] 确认按钮的 `toggleContextNode` 未被修改
- [ ] `onToggleSelect` 使用 `?.()` optional chaining

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
