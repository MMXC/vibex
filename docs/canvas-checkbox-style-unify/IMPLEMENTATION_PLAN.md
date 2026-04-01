# Implementation Plan: Canvas Checkbox Style Unify

**项目**: canvas-checkbox-style-unify
**版本**: v1.0
**日期**: 2026-04-02
**状态**: ✅ 设计完成

---

## Sprint 排期

| Sprint | 内容 | 工时 | Epic |
|--------|------|------|------|
| **Sprint 1** | E1 ContextTree checkbox 合并 + 确认反馈 | 1.5h | E1 |
| **Sprint 1** | E2 ComponentTree checkbox 位置修正 | 0.5h | E2 |
| **Sprint 2** | E3 黄色边框移除 | 0.25h | E3 |
| **Sprint 3** | E4 FlowTree 确认反馈（可选） | 0.5h | E4 |
| **总计** | | **2.75h（P0: 2h）** | |

---

## Sprint 1: E1 + E2（2h）

### 步骤 1.1: 修改 canvas.module.css（补充 activeBadge CSS）

**文件**: `src/components/canvas/canvas.module.css`

在 `.nodeTypeBadge` 样式块之后添加：

```css
/* E1: Confirmation feedback badge */
.activeBadge {
  display: inline-flex;
  align-items: center;
  margin-left: 0.25rem;
  vertical-align: middle;
}

.confirmedBadge {
  display: inline-flex;
  align-items: center;
  margin-left: 0.25rem;
  vertical-align: middle;
}
```

### 步骤 1.2: 修改 BoundedContextTree.tsx（E1）

**文件**: `src/components/canvas/BoundedContextTree.tsx`

**变更 1**: 删除 selectionCheckbox（大约 line 234-243）
```tsx
// 删除这段：
<input
  type="checkbox"
  className={styles.selectionCheckbox}
  checked={node.isActive !== false && node.status !== 'pending'}
  onChange={() => { confirmContextNode(node.nodeId); }}
  aria-label="选择上下文"
/>
```

**变更 2**: 修改 confirmCheckbox 为单一确认 checkbox（大约 line 246-253）
```tsx
// 替换为：
<input
  type="checkbox"
  className={styles.confirmCheckbox}
  checked={node.status === 'confirmed'}
  onChange={() => { confirmContextNode(node.nodeId); }}
  aria-label="确认节点"
/>

{/* 新增：确认状态绿色 ✓ 反馈 */}
{node.status === 'confirmed' && (
  <span className={styles.confirmedBadge} aria-label="已确认">
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8l3.5 3.5L13 5" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </span>
)}
```

### 步骤 1.3: 修改 ComponentTree.tsx（E2）

**文件**: `src/components/canvas/ComponentTree.tsx`

**变更**: 将 checkbox 前移到 type badge 前（大约 line 426-439）

Before:
```tsx
{onToggleSelect && (
  <div className={styles.selectionCheckbox} onClick={(e) => { e.stopPropagation(); onToggleSelect(node.nodeId); }}>
    <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(node.nodeId)} />
  </div>
)}
<div className={styles.nodeCardHeader}>
  <div className={styles.nodeTypeBadge} ... />
```

After:
```tsx
<div className={styles.nodeCardHeader}>
  {onToggleSelect && (
    <input
      type="checkbox"
      className={styles.confirmCheckbox}
      checked={isSelected}
      onChange={() => { onToggleSelect(node.nodeId); }}
      aria-label="选择节点"
    />
  )}
  <div className={styles.nodeTypeBadge} ... />
```

### 步骤 1.4: 验证编译

```bash
cd /root/.openclaw/vibex/vibex-fronted
npm run build 2>&1 | head -30
```

---

## Sprint 2: E3（0.25h）

### 步骤 2.1: 移除 nodeUnconfirmed 黄色边框

**文件**: `src/components/canvas/canvas.module.css`

**变更**: 修改 `.nodeUnconfirmed` 样式（大约 line 630）

Before:
```css
.nodeUnconfirmed {
  border-color: var(--color-warning);
  box-shadow: 0 0 8px rgba(255, 170, 0, 0.2);
}
```

After:
```css
.nodeUnconfirmed {
  /* 移除黄色边框和阴影，仅保留边框 */
  border: 2px solid var(--color-border);
}
```

---

## Sprint 3: E4（0.5h，可选）

### 步骤 3.1: BusinessFlowTree 添加确认反馈

**文件**: `src/components/canvas/BusinessFlowTree.tsx`

参考 ComponentTree 的 `activeBadge` 实现，在 FlowCard 中添加确认状态绿色 ✓ 反馈。

---

## 测试执行

### 步骤 T1: 运行现有测试

```bash
cd /root/.openclaw/vibex/vibex-fronted
npm test -- --testPathPattern="BoundedContextTree|ComponentTree" --coverage 2>&1 | tail -50
```

### 步骤 T2: 添加新测试用例

在 `BoundedContextTree.test.tsx` 添加 E1 测试用例（见 architecture.md 5.3 节）。

在 `ComponentTree.test.tsx` 添加 E2 测试用例。

### 步骤 T3: 视觉验证

使用 `/browse` 技能打开 Canvas 页面，验证：
- [x] ContextTree 节点只有 1 个 checkbox ✅ (commit 834e83b9)
- [x] ComponentTree checkbox 在 type badge 前 ✅ (commit 18fcdc7a)
- [x] 未确认节点无黄色边框 ✅ (commit 02b638a2)
- [x] 确认节点显示绿色 ✓ ✅ (commit 834e83b9)

---

## 回滚计划

| 变更 | 回滚操作 |
|------|----------|
| 删除 selectionCheckbox | 恢复 `<input type="checkbox" className={styles.selectionCheckbox} ... />` |
| 移除 nodeUnconfirmed 边框 | 恢复 `border-color: var(--color-warning)` 和 `box-shadow` |
| 移动 ComponentTree checkbox | 将 checkbox div 移回 type badge 后 |

---

## 验收清单

- [x] `npm run build` 编译通过 ✅
- [ ] `npm test` 所有测试通过
- [x] E1: ContextTree 只有 1 个 checkbox，位置在 type badge 前 ✅ (834e83b9)
- [x] E1: 确认节点显示绿色 ✓ ✅ (834e83b9)
- [x] E2: ComponentTree checkbox 在 type badge 前，inline ✅ (18fcdc7a)
- [x] E3: 未确认节点无黄色边框 ✅ (commit 02b638a2)
- [ ] E4: FlowTree 显示绿色 ✓（可选）
- [ ] 覆盖率 > 80%
