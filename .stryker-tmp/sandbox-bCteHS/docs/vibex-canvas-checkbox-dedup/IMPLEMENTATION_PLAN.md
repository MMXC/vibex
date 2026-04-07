# IMPLEMENTATION_PLAN: VibeX Canvas Checkbox 去重

> **项目**: vibex-canvas-checkbox-dedup  
> **创建日期**: 2026-03-30  
> **基于**: PRD v1 + Analysis v3  
> **代码文件**: `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`  
> **CSS文件**: `vibex-fronted/src/components/canvas/canvas.module.css`

---

## 1. 现状分析

### 1.1 当前 UI 结构

```
┌─────────────────────────────────────────┐
│ [□选择] [type badge] [✓已确认]          │  ← 两个 checkbox 混淆
├─────────────────────────────────────────┤
│ <h4> 标题                              │
│ <p> 描述                        [删除]  │
│ [确认] [编辑]                           │
└─────────────────────────────────────────┘
```

### 1.2 代码位置索引

| 元素 | 文件位置 | 行号 |
|------|----------|------|
| Selection checkbox (div + input) | BoundedContextTree.tsx | ~L233-244 |
| nodeCardHeader (type badge + CheckboxIcon) | BoundedContextTree.tsx | ~L247-252 |
| Confirm button | BoundedContextTree.tsx | ~L254-261 |
| nodeCardTitle + nodeCardDesc | BoundedContextTree.tsx | ~L253-256 |
| Multi-select controls | BoundedContextTree.tsx | ~L330-345 |
| "全选" button | BoundedContextTree.tsx | ~L399 |
| selectionCheckbox CSS | canvas.module.css | ~L990-997 |

---

## 2. Epic 拆分（规模治理）

> **Epic 规模治理**: 遵循 ≤5 功能点规则  
> **Epic 1: 5 stories**, **Epic 2: 2 stories**, **Epic 3: 2 stories**  
> **总工时**: 7.5h

### Epic 1: Checkbox 重构 (P0) — 5 Stories

| Story | 功能点 | 描述 | 优先级 | 工时 |
|--------|--------|------|--------|------|
| S1.1 | F1 | 移除 header selection checkbox (div + input) | P0 | 1h |
| S1.2 | F2 | 将 confirmation checkbox 移至描述前（h4前） | P0 | 1h |
| S1.3 | F2 | 点击 checkbox 直接切换 `node.confirmed` 状态 | P0 | 1h |
| S1.4 | F3 | 移除"确认"按钮（已由 checkbox 取代） | P0 | 0.5h |
| S1.5 | F4 | 全选按钮改为"确认所有"（文案+aria-label） | P0 | 0.5h |

**Epic 1 交付物**: 单一 checkbox 出现在标题/描述前，点击直接切换 confirmed 状态

### Epic 2: 批量删除优化 (P0) — 2 Stories

| Story | 功能点 | 描述 | 优先级 | 工时 |
|--------|--------|------|--------|------|
| S2.1 | F5 | 批量删除无需预勾选 selection checkbox | P0 | 1h |
| S2.2 | F5 | 验证批量删除直接执行流程 | P0 | 0.5h |

**Epic 2 交付物**: 删除按钮/菜单始终可用，无需先勾选节点

### Epic 3: 测试与验证 (P1) — 2 Stories

| Story | 功能点 | 描述 | 优先级 | 工时 |
|--------|--------|------|--------|------|
| S3.1 | 测试 | 单元测试更新（checkbox 数量验证） | P1 | 1h |
| S3.2 | 验证 | gstack 截图验证 UI 最终效果 | P1 | 1h |

**Epic 3 交付物**: 测试通过 + 可视化验证

---

## 3. 详细实现步骤

### Phase 1: Epic 1 — Checkbox 重构

#### S1.1: 移除 selection checkbox (1h)

**改动文件**: `BoundedContextTree.tsx`

**ContextCard 组件改动**:
```tsx
// 删除以下代码块 (~L233-244):
{onToggleSelect && (
  <div className={styles.selectionCheckbox} onClick={(e) => { e.stopPropagation(); onToggleSelect(node.nodeId); }}>
    <input
      type="checkbox"
      checked={selected ?? false}
      onChange={() => onToggleSelect(node.nodeId)}
      aria-label={`选择 ${node.name}`}
      onClick={(e) => e.stopPropagation()}
    />
  </div>
)}

// 替换为: 移除此块，selection 相关逻辑后续在 S2.1 处理
```

**ContextCard props 简化**:
- 移除 `selected` prop（仅保留 `onToggleSelect` 用于批量删除）
- 或保留 `onToggleSelect` 但不再渲染 checkbox UI

#### S1.2: 将 confirmation checkbox 移至描述前 (1h)

**改动位置**: `ContextCard` 组件 view mode 部分

**当前结构**:
```tsx
<div className={styles.nodeCardHeader}>
  <div className={styles.nodeTypeBadge}>{type}</div>
  {node.confirmed && <CheckboxIcon checked size="sm" aria-label="已确认" />}
</div>
<h4 className={styles.nodeCardTitle}>{node.name}</h4>
<p className={styles.nodeCardDesc}>{node.description}</p>
```

**目标结构**:
```tsx
<div className={styles.nodeCardHeader}>
  <div className={styles.nodeTypeBadge}>{type}</div>
</div>
{/* F2: Confirmation checkbox moved before description */}
<div className={styles.confirmCheckboxWrapper}>
  <input
    type="checkbox"
    checked={node.confirmed}
    onChange={() => onConfirm(node.nodeId)}
    aria-label={`确认 ${node.name}`}
    className={styles.confirmCheckbox}
  />
</div>
<h4 className={styles.nodeCardTitle}>{node.name}</h4>
<p className={styles.nodeCardDesc}>{node.description}</p>
```

**新增 CSS** (canvas.module.css):
```css
.confirmCheckboxWrapper {
  margin-bottom: 4px;
}
.confirmCheckbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #22c55e; /* green-500 */
}
```

#### S1.3: 点击 checkbox 切换 confirmed 状态 (1h)

**改动**: `onChange={() => onConfirm(node.nodeId)}` 直接调用现有 `onConfirm` 函数

**验证**: 点击后 `node.confirmed` 状态切换，`CheckboxIcon` 消失（不再在 header 显示）

#### S1.4: 移除"确认"按钮 (0.5h)

**删除代码** (~L254-261):
```tsx
{!node.confirmed && (
  <button
    type="button"
    className={styles.confirmButton}
    onClick={() => onConfirm(node.nodeId)}
    aria-label={`确认 ${node.name}`}
  >
    确认
  </button>
)}
```

**原因**: F3 确认功能已由描述前 checkbox 取代

#### S1.5: 全选按钮改为"确认所有" (0.5h)

**改动位置**: BoundedContextTree ~L399

**当前**:
```tsx
<button ... aria-label="全选">
  全选
</button>
```

**目标**:
```tsx
<button
  type="button"
  className={styles.secondaryButton}
  onClick={handleConfirmAll}
  aria-label="确认所有节点"
>
  确认所有
</button>
```

---

### Phase 2: Epic 2 — 批量删除优化

#### S2.1: 批量删除无需预勾选 (1h)

**分析**: 当前删除按钮在 ContextCard 内，selection checkbox 在 header。

**决策**: 
- 保留 `onToggleSelect` 和 `selectedNodeIds` 状态（用于框选后的高亮）
- 但删除操作不再依赖 checkbox 勾选状态
- 删除按钮始终可用（除非 readonly）

**改动**: 删除按钮的 disabled 条件，仅检查 `readonly` 而非 `selected`

#### S2.2: 验证批量删除流程 (0.5h)

**测试场景**:
1. 点击"删除"按钮 → 直接删除单个节点
2. 框选多个节点 → 点击"删除 (N)" → 直接批量删除

---

### Phase 3: Epic 3 — 测试与验证

#### S3.1: 单元测试更新 (1h)

**测试用例更新**:
```typescript
// 期望: 每个卡片只有一个 checkbox
expect(screen.getAllByRole('checkbox').length).toBe(contextNodes.length);

// 期望: 全选按钮文案为"确认所有"
expect(screen.getByText('确认所有')).toBeInTheDocument();

// 期望: 无"确认"按钮
expect(screen.queryByRole('button', { name: '确认' })).not.toBeInTheDocument();
```

#### S3.2: gstack 截图验证 (1h)

**验证清单**:
- [ ] 每个卡片只有一个 checkbox
- [ ] checkbox 出现在描述文本之前
- [ ] 点击 checkbox 切换 confirmed 状态
- [ ] 无"确认"按钮
- [ ] 全选按钮文案为"确认所有"
- [ ] 删除操作可直接执行（无需预勾选）

---

## 4. 代码改动清单

| 文件 | 改动类型 | 描述 |
|------|----------|------|
| BoundedContextTree.tsx | 删除 | Selection checkbox div (~L233-244) |
| BoundedContextTree.tsx | 修改 | Confirmation checkbox 移至描述前 |
| BoundedContextTree.tsx | 删除 | "确认"按钮 |
| BoundedContextTree.tsx | 修改 | 全选按钮文案 |
| canvas.module.css | 新增 | .confirmCheckboxWrapper, .confirmCheckbox |
| canvas.module.css | 检查 | 确认 selectionCheckbox 是否可移除（无其他引用） |

---

## 5. 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| 删除按钮仍依赖 selection checkbox | 功能损坏 | S2.1 确保删除按钮始终可用 |
| Checkbox 位置改动影响布局 | UI 破坏 | gstack 截图验证 |
| onToggleSelect 仍被使用但无 checkbox | 逻辑不一致 | S2.1 明确 onToggleSelect 仅用于框选高亮 |

---

## 6. 验收标准

### 6.1 代码检查
```bash
# 无 selection checkbox 残留
grep -rn 'aria-label="选择' BoundedContextTree.tsx
# 期望: 无输出

# 无确认按钮
grep -rn '>确认<' BoundedContextTree.tsx
# 期望: 无输出
```

### 6.2 UI 验证
```
checklist:
□ 每个卡片只有一个 checkbox（描述前）
□ 点击 checkbox 直接切换 confirmed 状态
□ 无"确认"按钮
□ 全选按钮文案为"确认所有"
□ 删除操作可直接执行（无需预勾选）
□ gstack 截图验证通过
```

---

## 7. 时间线

| 阶段 | Epic | 工时 | 累计 |
|------|------|------|------|
| Phase 1 | Epic 1: Checkbox 重构 | 4h | 4h |
| Phase 2 | Epic 2: 批量删除优化 | 1.5h | 5.5h |
| Phase 3 | Epic 3: 测试与验证 | 2h | 7.5h |

**预计总工时**: 7.5h
