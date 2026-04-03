# Analysis: VibeX Canvas Checkbox 去重 — 统一确认状态

> **任务**: vibex-canvas-checkbox-dedup/analyze-requirements
> **分析日期**: 2026-03-30
> **分析师**: Analyst Agent
> **项目**: vibex-canvas-checkbox-dedup
> **工作目录**: /root/.openclaw/vibex
> **修订**: v3 — 需求澄清完成

---

## 1. 执行摘要

**需求澄清完成**：
- Selection checkbox 用于批量删除，但删除操作不需要勾选确认
- 用户选择：移除 selection checkbox，删除直接执行
- 保留确认 checkbox（描述前），点击直接切换 `confirmed` 状态

**核心改动**：移除 header 区域的 selection checkbox，仅保留描述前的确认 checkbox。

---

## 2. 当前状态

### 2.1 当前 UI 结构（BoundedContextTree）

每个卡片渲染两个 checkbox 相关元素：
1. **Selection checkbox**（header 区域）：`aria-label="选择 XXX"`
2. **Confirmation icon**（header 区域）：`aria-label="已确认"`（checked 时显示）

**代码结构（BoundedContextTree.tsx L233-260）**：
```tsx
{/* Selection checkbox — 用于批量删除 */}
{onToggleSelect && (
  <div onClick={(e) => { e.stopPropagation(); onToggleSelect(node.nodeId); }}>
    <input type="checkbox" checked={selected ?? false} aria-label={`选择 ${node.name}`} />
  </div>
)}

<div className={styles.nodeCardHeader}>
  <div className={styles.nodeTypeBadge}>{type}</div>
  {node.confirmed && <CheckboxIcon checked size="sm" aria-label="已确认" />}
</div>

<h4 className={styles.nodeCardTitle}>{node.name}</h4>
<p className={styles.nodeCardDesc}>{node.description}</p>
```

### 2.2 问题定义

| 问题 | 描述 |
|------|------|
| 两个 checkbox 难以区分 | "选择 XXX" vs "已确认"，用户困惑 |
| Selection checkbox 多余 | 删除操作不需要勾选确认，直接执行即可 |
| 位置不合理 | Selection checkbox 在 header，与描述距离远 |

---

## 3. 推荐方案

### 方案 A：移除 selection checkbox，描述前仅保留确认 checkbox（推荐）

**改动**：
1. 移除 header 区域的 selection checkbox（`onToggleSelect` 相关代码）
2. 在描述文本前放置确认 checkbox（`<input type="checkbox" checked={node.confirmed} />`）
3. 点击该 checkbox 直接切换 `node.confirmed` 状态（调用 `onConfirm`）
4. 移除"确认"按钮（已被 checkbox 取代）
5. 全选按钮改为"确认所有"（调用 `handleConfirmAll`）
6. 批量删除：保留删除按钮/菜单，但无需先勾选

**UI 结构**：
```
[type badge] [✓确认 checkbox]
[h4 标题]
[p 描述]
         [删除按钮]
```

**优势**：
- 单一 checkbox，语义清晰
- 点击直接确认，交互直接
- 删除无需勾选，直接执行

---

## 4. 验收标准

- [ ] 每个卡片只有一个 checkbox（描述前）
- [ ] 点击 checkbox 直接切换 `confirmed` 状态
- [ ] "确认"按钮移除
- [ ] Selection checkbox（header 区域）移除
- [ ] 全选按钮文案改为"确认所有"
- [ ] 批量删除仍可用（无需勾选，直接删除）
- [ ] `grep -rn "selectionCheckbox\|onToggleSelect.*checkbox" BoundedContextTree.tsx` → 0
- [ ] gstack 截图验证：checkbox 出现在描述文本之前

---

## 5. 工时估算

| 改动 | 工时 |
|------|------|
| 重构 checkbox 位置到描述前 | 1h |
| 点击 checkbox 切换 confirmed 状态 | 1h |
| 移除"确认"按钮 | 0.5h |
| 移除 selection checkbox（header） | 1h |
| 修改全选按钮文案 | 0.5h |
| gstack 验证 | 1h |
| **合计** | **5h** |

---

## 6. 下游需确认

- PM：确认删除操作的具体交互方式（右键菜单？工具栏按钮？）
