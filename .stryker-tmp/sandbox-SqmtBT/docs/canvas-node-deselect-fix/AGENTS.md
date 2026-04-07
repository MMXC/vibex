# AGENTS.md: canvas-node-deselect-fix

**Agent**: Architect
**日期**: 2026-04-01
**版本**: v1.0

---

## 角色约束

本文档定义 Dev Agent 在实现 `canvas-node-deselect-fix` 项目时的强制约束。所有 Dev 必须严格遵守，违反任意一条将导致 PR 驳回。

---

## 实现约束（强制）

### C1: removeEventListener 必须出现在 cleanup 中

```typescript
// ✅ 正确
useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => { /* ... */ };
  document.addEventListener('click', handleClickOutside);
  return () => document.removeEventListener('click', handleClickOutside);
}, []);

// ❌ 错误：缺少 cleanup，会导致内存泄漏
useEffect(() => {
  document.addEventListener('click', handleClickOutside);
}, []);
```

### C2: 节点元素必须包含 `data-node-id` 属性

所有可点击的节点 DOM 元素必须设置 `data-node-id` 属性，用于检测点击是否发生在节点内。

```typescript
// ✅ 正确：节点元素带 data-node-id
<div data-node-id="node-123" className="canvas-node">...</div>

// ❌ 错误：缺少 data-node-id，检测逻辑失效
<div className="canvas-node">...</div>
```

### C3: 必须清空所有 3 个树，不仅仅是其中一个

实现必须同时清空 context / flow / component 三个树的选中状态，不得遗漏。

```typescript
// ✅ 正确：清空所有 3 个树
store.clearNodeSelection('context');
store.clearNodeSelection('flow');
store.clearNodeSelection('component');

// ❌ 错误：只清空一个树
store.clearNodeSelection('context');
```

### C4: E2E 测试必须点击真实空白区域

Playwright 测试必须点击实际的非节点元素（空白画布区域），而非通过 JS 模拟状态变更。

```typescript
// ✅ 正确：点击真实空白区域元素
await page.click('[data-canvas-blank]'); // 或其他空白区域选择器

// ❌ 错误：通过 evaluate 直接修改 store 状态
await page.evaluate(() => {
  useCanvasStore.getState().clearNodeSelection('context');
});
```

---

## 验收标准

| 约束 | 检查点 | 优先级 |
|------|--------|--------|
| C1 | `useEffect` 返回 `removeEventListener` cleanup | P0 |
| C2 | 所有节点元素有 `data-node-id` 属性 | P0 |
| C3 | 清空调用覆盖 context / flow / component 三个树 | P0 |
| C4 | E2E 测试通过真实 UI 交互触发清空 | P0 |

---

## 技术边界

- **禁止**: 引入新状态管理库（仅使用现有 Zustand store）
- **禁止**: 创建额外 DOM 元素（如 overlay div）
- **禁止**: 修改现有 `clearNodeSelection` API 签名

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: canvas-node-deselect-fix
- **执行日期**: 2026-04-01
