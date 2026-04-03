# PRD: canvas-node-deselect-fix — 点击空白区域取消选中节点

**Agent**: PM
**日期**: 2026-04-01
**版本**: v1.0
**状态**: 已完成

---

## 1. 执行摘要

### 背景

点击节点外空白区域无法取消选中节点，用户必须手动点击其他节点或按 Esc 才能取消选中，体验不流畅。

### 目标

实现点击空白区域清空所有树的选中节点，与 Esc 行为一致。

### 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 点击空白区域 | 清空所有选中节点 | E2E 测试 |

---

## 2. Epic 拆分

### Epic 1: Click Outside 监听

**工时**: 1h | **优先级**: P0

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | document click 监听 | document.addEventListener('click') 检测点击目标 | `expect(isEmptyArea).toBe(true)` | 【需页面集成】 |
| F1.2 | 非节点区域检测 | `!target.closest('[data-node-id]')` 判断非节点 | `expect(isNodeClick).toBe(false)` | ❌ |
| F1.3 | 清空所有树选中 | `clearNodeSelection` 清空 context/flow/component | `expect(selectedCount).toBe(0)` | 【需页面集成】 |
| F1.4 | E2E 覆盖 | Playwright 测试点击空白区域清空选中 | `expect(testPassed).toBe(true)` | ❌ |

#### DoD

- [ ] document click 监听存在
- [ ] 点击非节点区域清空所有选中
- [ ] Playwright E2E 测试通过

---

## 3. 技术方案

**方案 A（推荐）**：
```typescript
useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
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

---

*PRD 版本: v1.0 | 生成时间: 2026-04-01 23:45 GMT+8*
