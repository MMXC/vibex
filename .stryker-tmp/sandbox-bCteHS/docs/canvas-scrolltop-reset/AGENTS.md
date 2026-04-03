# AGENTS.md — canvas-scrolltop-reset

**Agent**: architect
**日期**: 2026-04-01
**版本**: v1.0

---

## 角色与职责

| 角色 | 职责 |
|------|------|
| **dev** | 实现 TreePanel scrollTop 重置逻辑 |
| **tester** | 编写并执行 Playwright E2E 测试 |
| **reviewer** | 代码审查，验证约束合规性 |

---

## 开发约束（dev 强制遵守）

### ✅ 强制要求

1. **必须使用 `panelBodyRef`**
   - 使用 `useRef<HTMLDivElement>()` 创建 ref
   - 绑定到 panel body 的 `<div>` 元素
   - 禁止使用 `document.querySelector` 或 `document.getElementById`

2. **useEffect 依赖数组必须包含 `collapsed`**
   ```typescript
   // ✅ 正确
   useEffect(() => {
     if (!collapsed && panelBodyRef.current) {
       setTimeout(() => {
         if (panelBodyRef.current) {
           panelBodyRef.current.scrollTop = 0;
         }
       }, 0);
     }
   }, [collapsed]);

   // ❌ 错误 — 缺少 collapsed
   useEffect(() => {
     if (!collapsed && panelBodyRef.current) {
       panelBodyRef.current.scrollTop = 0;
     }
   }, []);
   ```

3. **必须使用 `setTimeout(0)` 包裹 scrollTop 赋值**
   - 目的：兼容 CSS transition 动画，避免视觉闪烁
   - 格式：`setTimeout(() => { panelBodyRef.current.scrollTop = 0; }, 0)`

4. **Effect 内部必须有 `panelBodyRef.current` 存在性检查**
   - 防止 ref 未挂载时访问 DOM 报错

### ❌ 禁止事项

| 禁止项 | 原因 |
|--------|------|
| 直接 `panelBody.scrollTop = 0` 无 setTimeout | 动画期间重置可能导致视觉闪烁 |
| 缺少 `collapsed` 依赖 | 状态变化时无法触发重置 |
| 使用 `document.querySelector` | 违反 React 规范，引用不稳定 |
| 修改多个组件 | 方案设计为仅改 TreePanel 一个文件 |

---

## 测试约束（tester 强制遵守）

### Playwright E2E 测试要求

1. **三个面板全部覆盖**
   - `context-panel-scroll-reset` → BoundedContextTree
   - `flow-panel-scroll-reset` → BusinessFlowTree
   - `component-panel-scroll-reset` → ComponentTree

2. **回归测试 — 10 次折叠展开**
   ```typescript
   test('regression: 10x collapse-expand', async ({ page }) => {
     await page.goto('/canvas');
     const panelBody = page.locator('[data-testid="tree-panel-body"]');
     
     for (let i = 0; i < 10; i++) {
       await page.click('[data-testid="collapse-btn"]');
       await page.waitForTimeout(50);
       await page.click('[data-testid="collapse-btn"]');
       await page.waitForTimeout(50);
       const scrollTop = await panelBody.evaluate(el => el.scrollTop);
       expect(scrollTop).toBe(0);
     }
   });
   ```

3. **动画兼容性验证**
   ```typescript
   test('no flicker during expand animation', async ({ page }) => {
     // 展开 → 滚动 → 折叠 → 展开
     // 等待动画完成（300ms）
     await page.waitForTimeout(300);
     const scrollTop = await panelBody.evaluate(el => el.scrollTop);
     expect(scrollTop).toBe(0);
   });
   ```

---

## 代码审查清单（reviewer）

- [ ] `panelBodyRef` 是否正确绑定到 panel body DOM 节点
- [ ] useEffect 依赖数组是否包含 `collapsed`
- [ ] scrollTop 赋值是否被 `setTimeout(0)` 包裹
- [ ] Effect 内部是否有 ref 存在性检查
- [ ] 是否存在 `document.querySelector` 或 `getElementById`（如有则驳回）
- [ ] 挂载时 Effect 是否使用空依赖数组 `[]`
- [ ] 连续 10 次折叠展开回归测试是否通过

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: canvas-scrolltop-reset
- **执行日期**: 2026-04-01
