# Implementation Plan: canvas-node-deselect-fix

**Agent**: Architect
**日期**: 2026-04-01
**版本**: v1.0

---

## 概述

| 项目 | 值 |
|------|-----|
| 总工时 | 1h |
| Epic | E1: Click Outside 监听 |
| 功能点 | F1.1 + F1.2 + F1.3 + F1.4 |

---

## 阶段拆分

### Phase 1: F1.1 + F1.2 — 事件监听 + 节点检测（30min）

**目标**: 在 Canvas 页面注册 document click 监听器，实现非节点区域检测

**交付物**: `CanvasPage.tsx` 中新增 `useEffect` + `handleClickOutside`

**步骤**:
1. 在 Canvas 页面组件中引入 `useEffect`
2. 定义 `handleClickOutside` 函数：
   ```typescript
   const handleClickOutside = (e: MouseEvent) => {
     const target = e.target as HTMLElement;
     if (!target.closest('[data-node-id]')) {
       // will clear selections in Phase 2
     }
   };
   ```
3. 在 `useEffect` 中注册监听器并返回 cleanup
   ```typescript
   useEffect(() => {
     document.addEventListener('click', handleClickOutside);
     return () => document.removeEventListener('click', handleClickOutside);
   }, []);
   ```

**验收标准**:
- [ ] `document.addEventListener('click', ...)` 在组件挂载时调用
- [ ] `return () => document.removeEventListener(...)` cleanup 函数存在
- [ ] `target.closest('[data-node-id]')` 正确区分节点内/外点击

---

### Phase 2: F1.3 — 清空所有树选中节点（15min）

**目标**: 点击非节点区域时，调用 `clearNodeSelection` 清空 context / flow / component 三个树

**交付物**: 在 `handleClickOutside` 中补全清空逻辑

**步骤**:
1. 从 Zustand store 获取 `clearNodeSelection` 方法
2. 依次清空三个树：
   ```typescript
   const store = useCanvasStore.getState();
   store.clearNodeSelection('context');
   store.clearNodeSelection('flow');
   store.clearNodeSelection('component');
   ```

**验收标准**:
- [ ] 清空所有三个树，不遗漏
- [ ] 行为与 Esc 键清空一致
- [ ] 连续点击空白区域幂等（无报错）

---

### Phase 3: F1.4 — Playwright E2E 覆盖（15min）

**目标**: 编写 Playwright 测试，验证点击空白区域清空选中节点

**交付物**: `canvas-deselect.spec.ts` 测试文件

**步骤**:
1. 在 `e2e/` 目录下创建 `canvas-deselect.spec.ts`
2. 测试流程：
   ```typescript
   test('clicking blank area deselects all nodes', async ({ page }) => {
     await page.goto('/canvas');
     // Select a node
     await page.click('[data-node-id="node-1"]');
     // Click blank area (must be actual non-node element)
     await page.click('#canvas-blank-area');
     // Verify no selection
     const selectedCount = await page.evaluate(() => {
       const store = useCanvasStore.getState();
       return (
         store.selectedNodes.context.length +
         store.selectedNodes.flow.length +
         store.selectedNodes.component.length
       );
     });
     expect(selectedCount).toBe(0);
   });
   ```

**验收标准**:
- [ ] 测试通过
- [ ] 测试点击的是真实空白区域（非节点元素）
- [ ] 测试覆盖所有三个树的清空

---

## 时间线

```
0min ─────────────────────────────────────────── 60min
 |──────────────|─────────────|──────────────|
 Phase 1 (30m) Phase 2 (15m) Phase 3 (15m)
 F1.1 + F1.2   F1.3          F1.4
```

---

## DoD Checklist

- [ ] `document.addEventListener('click')` 注册
- [ ] `return () => removeEventListener` cleanup 存在
- [ ] `target.closest('[data-node-id]')` 正确检测
- [ ] 清空 context / flow / component 三个树
- [ ] Playwright E2E 测试通过

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: canvas-node-deselect-fix
- **执行日期**: 2026-04-01
