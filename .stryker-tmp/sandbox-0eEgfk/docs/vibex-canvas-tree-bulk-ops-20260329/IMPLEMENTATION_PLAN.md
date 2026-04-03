# 实施计划：vibex-canvas-tree-bulk-ops-20260329

**项目**: 三栏组件树批量操作工具栏
**版本**: v1.0
**日期**: 2026-03-29
**前置文档**: `architecture.md`, `prd.md`, `analysis.md`

---

## 1. 实施概述

### 1.1 目标
在右侧组件树面板新增三个批量操作按钮（全选/取消全选/清空画布），复用现有 Zustand store 机制，零新增依赖。

### 1.2 改动文件清单

| # | 文件路径 | 改动类型 | 改动行数估算 |
|---|----------|----------|-------------|
| 1 | `src/lib/canvas/canvasStore.ts` | 新增 action | +12 行 |
| 2 | `src/components/canvas/ComponentTree.tsx` | 新增按钮 + handler | +25 行 |
| 3 | `src/components/canvas/canvas.module.css` | 新增 `.dangerButton` | +20 行 |
| 4 | `src/components/canvas/__tests__/ComponentTreeBulkOps.test.tsx` | 新增测试文件 | +120 行 |

**总估算工时**: 4h（canvasStore 0.5h + ComponentTree 1h + CSS 0.5h + 单元测试 1h + E2E 1h）

---

## 2. 阶段一：canvasStore 新增 clearComponentCanvas

### 2.1 任务
在 `canvasStore.ts` 的 Component Slice Actions 区域新增 `clearComponentCanvas` action。

### 2.2 操作步骤

**Step 1**: 确认 `getHistoryStore` 已导入
```bash
grep -n "getHistoryStore" src/lib/canvas/canvasStore.ts | head -3
# 预期: line 30 已导入
```

**Step 2**: 定位插入位置
```bash
grep -n "setComponentNodes:" src/lib/canvas/canvasStore.ts
# 预期: line 743
```
在 `setComponentNodes` 之后、第一个 Component action 之前插入。

**Step 3**: 插入新 action
```typescript
clearComponentCanvas: () => {
  const historyStore = getHistoryStore();
  const nodes = get().componentNodes;
  if (nodes.length === 0) return;
  historyStore.recordSnapshot('component', nodes);
  set({ componentNodes: [] });
},
```

**Step 4**: 验证 TypeScript 编译
```bash
cd vibex-fronted && npx tsc --noEmit src/lib/canvas/canvasStore.ts
# 预期: 无编译错误
```

### 2.3 验收标准
- [ ] `clearComponentCanvas` action 存在于 canvasStore
- [ ] 调用 `clearComponentCanvas()` 后 `componentNodes === []`
- [ ] 调用前记录 history snapshot
- [ ] 空节点时无操作（无 crash）

---

## 3. 阶段二：ComponentTree 新增按钮

### 3.1 任务
在 `ComponentTree.tsx` 的 `.contextTreeControls` 中新增全选/取消全选、清空画布按钮。

### 3.2 操作步骤

**Step 1**: 确认已有 import
```bash
grep -n "useCanvasStore\|getHistoryStore" src/components/canvas/ComponentTree.tsx | head -5
# 预期: useCanvasStore 已导入（line ~30）
```

**Step 2**: 确认 `hasNodes` 和 `selectedCount` 变量存在
```bash
grep -n "hasNodes\|selectedCount\|selectedNodeIds" src/components/canvas/ComponentTree.tsx | head -10
# 预期: hasNodes = componentNodes.length > 0
# 预期: selectedCount = selectedNodeIds.component.length
```

**Step 3**: 新增 `handleClearCanvas` handler（在 `useCallback` 区域或组件顶部）
```typescript
const handleClearCanvas = useCallback(() => {
  if (window.confirm('确定清空画布？所有组件将被删除。')) {
    useCanvasStore.getState().clearComponentCanvas();
  }
}, []);
```

**Step 4**: 在 `.contextTreeControls` 内、`{hasNodes && (` 块之后新增按钮

找到现有代码位置（`{hasNodes && (` 判断块之后）：
```tsx
{hasNodes && (
  <div className={styles.multiSelectControls}>
```

在 `!readonly && !showAddForm` 按钮之后、`.multiSelectControls` 之前插入：

```tsx
{/* === F001 + F002: 全选 / 取消全选 === */}
{hasNodes && (
  selectedCount === 0 ? (
    <button
      type="button"
      className={styles.secondaryButton}
      onClick={() => selectAllNodes('component')}
      aria-label="全选所有组件"
    >
      ⊞ 全选
    </button>
  ) : (
    <button
      type="button"
      className={styles.secondaryButton}
      onClick={() => clearNodeSelection('component')}
      aria-label="取消全选所有组件"
    >
      ⊠ 取消全选
    </button>
  )
)}

{/* === F003: 清空画布 === */}
{hasNodes && !readonly && (
  <button
    type="button"
    className={styles.dangerButton}
    onClick={handleClearCanvas}
    aria-label="清空画布"
    title="清空画布（可撤销）"
  >
    🗑 清空画布
  </button>
)}
```

**Step 5**: 验证 TypeScript 编译
```bash
cd vibex-fronted && npx tsc --noEmit src/components/canvas/ComponentTree.tsx
# 预期: 无编译错误
```

### 3.3 验收标准
- [ ] 有节点时显示"⊞ 全选"按钮
- [ ] 点击后 `selectedCount` = 所有节点数
- [ ] 有选中项时显示"⊠ 取消全选"按钮
- [ ] 点击后 `selectedCount` = 0
- [ ] 有节点且非 readonly 时显示"🗑 清空画布"按钮（红色）
- [ ] 点击后弹出 confirm 对话框
- [ ] 确认后画布显示"暂无组件"空状态

---

## 4. 阶段三：CSS 样式

### 4.1 任务
在 `canvas.module.css` 中新增 `.dangerButton` 样式。

### 4.2 操作步骤

**Step 1**: 确认 `.deleteButton` 位置
```bash
grep -n "\.deleteButton {" src/components/canvas/canvas.module.css
# 预期: line ~813
```

**Step 2**: 在 `.deleteButton` 样式块之后插入 `.dangerButton`
```css
.dangerButton {
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--color-danger, #ef4444);
  border-radius: 6px;
  background: transparent;
  color: var(--color-danger, #ef4444);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.dangerButton:hover {
  background: var(--color-danger, #ef4444);
  color: #fff;
}

.dangerButton:focus-visible {
  outline: 2px solid var(--color-danger, #ef4444);
  outline-offset: 2px;
}
```

**Step 3**: 验证 CSS 变量
```bash
grep -n "color-danger" src/components/canvas/canvas.module.css
# 预期: 已有 #ef4444 定义
```

### 4.3 验收标准
- [ ] `.dangerButton` 样式存在
- [ ] 默认态：透明背景 + 红色边框 + 红色文字
- [ ] hover 态：红色背景 + 白色文字
- [ ] 与 `.deleteButton` 视觉风格一致但独立

---

## 5. 阶段四：单元测试

### 5.1 任务
创建 `ComponentTreeBulkOps.test.tsx`，覆盖所有功能点和边界条件。

### 5.2 测试文件位置
```
src/components/canvas/__tests__/ComponentTreeBulkOps.test.tsx
```

### 5.3 测试用例

```typescript
describe('批量操作工具栏', () => {
  // F001: 全选
  it('F001: 全选按钮在有节点时可见', () => { ... });
  it('F001: 点击全选后所有 checkbox 变为 checked', () => { ... });
  it('F001: multiSelectControls 切换为已选 N 模式', () => { ... });

  // F002: 取消全选
  it('F002: 有选中项时显示取消全选按钮', () => { ... });
  it('F002: 点击取消全选后所有 checkbox 取消勾选', () => { ... });
  it('F002: multiSelectControls 切换回全选模式', () => { ... });

  // F003: 清空画布
  it('F003: 清空画布按钮在有节点且非 readonly 时可见', () => { ... });
  it('F003: 点击清空画布触发 confirm 对话框', () => { ... });
  it('F003: confirm 取消后画布不变', () => { ... });
  it('F003: confirm 确认后画布清空', () => { ... });
  it('F003: 清空后可撤销恢复', () => { ... });

  // 边界条件
  it('边界: 节点为空时三个按钮均不显示', () => { ... });
  it('边界: readonly 模式下清空画布按钮不显示', () => { ... });
});
```

### 5.4 验收标准
- [ ] 所有测试用例通过
- [ ] 空节点场景覆盖
- [ ] readonly 模式覆盖
- [ ] 撤销功能覆盖

---

## 6. 阶段五：回归验证

### 6.1 E2E 测试流程（Playwright）

```typescript
// e2e/canvas-bulk-ops.spec.ts
test('批量操作完整流程', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('button:has-text("AI 生成组件")');
  await page.waitForTimeout(2000);
  
  // F001
  await page.click('button[aria-label="全选所有组件"]');
  await expect(page.locator('text=/\\d+ 已选/')).toBeVisible();
  
  // F002
  await page.click('button[aria-label="取消全选所有组件"]');
  await expect(page.locator('button[aria-label="全选所有组件"]')).toBeVisible();
  
  // F003
  page.on('dialog', dialog => dialog.accept());
  await page.click('button[aria-label="清空画布"]');
  await expect(page.locator('text=暂无组件')).toBeVisible();
  
  // Undo
  await page.keyboard.press('Control+z');
  await expect(page.locator('[data-testid^="component-node-"]').first()).toBeVisible();
});
```

### 6.2 回归检查清单

- [ ] AI 生成组件功能正常
- [ ] 重新生成组件树功能正常
- [ ] 手动新增组件功能正常
- [ ] 节点确认功能正常
- [ ] 多选 checkbox 单个勾选/取消正常
- [ ] 框选（drag selection）功能正常
- [ ] Ctrl+Z 撤销功能正常
- [ ] 历史面板正常显示快照

---

## 7. 排期总表

| 阶段 | 任务 | 工时 | 依赖 |
|------|------|------|------|
| Phase 1 | canvasStore 新增 `clearComponentCanvas` | 0.5h | 无 |
| Phase 2 | ComponentTree 新增按钮 | 1h | Phase 1 |
| Phase 3 | CSS 样式（`.dangerButton`） | 0.5h | 无 |
| Phase 4 | 单元测试 | 1h | Phase 1 + 2 |
| Phase 5 | E2E + 回归测试 | 1h | Phase 1 + 2 + 3 |
| **合计** | | **4h** | |

---

## 8. 部署说明

本功能为纯前端改动（React + Zustand），无需后端部署。

**部署步骤**:
1. CI/CD 自动构建（GitHub Actions / Vercel）
2. 预览环境验证
3. 生产环境发布

**回滚方案**:
- Git revert 提交 hash
- Vercel 部署历史回滚（< 1 分钟）

---

*实施计划完成时间：2026-03-29 12:55 GMT+8*
*architect subagent: heartbeat-spawn-architect-bulkops*
