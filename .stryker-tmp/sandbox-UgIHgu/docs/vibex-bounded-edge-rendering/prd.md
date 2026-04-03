# PRD: VibeX 限界上下文树连线渲染异常修复

> **项目**: vibex-bounded-edge-rendering  
> **根因任务**: [vibex-bc-canvas-edge-render](./vibex-bc-canvas-edge-render/analysis.md)  
> **同一根因**: 本问题与 `vibex-bc-canvas-edge-render` 为同一根因，修复方案完全相同。  
> **分析文档**: [analysis.md](./analysis.md)  
> **日期**: 2026-03-30

---

## 1. Problem Statement

限界上下文树（BoundedContextTree）中，3个上下文卡片之间的连线全部汇聚在一条垂直线上，无法体现节点间的实际关系。根本原因是 `boundedContextTree` 组件使用 `flex-direction: column` 垂直布局，导致所有卡片 x 坐标相同，`bestAnchor()` 算法始终选择 bottom→top 锚点，连线路径全部向相同 x 位置汇聚。

---

## 2. Root Cause

**同一根因**（与 `vibex-bc-canvas-edge-render` 完全一致）：

| 层次 | 问题 | 影响 |
|------|------|------|
| 布局层 | `flex-direction: column` 导致所有卡片 x 相同 | `bestAnchor` 始终选择 bottom→top |
| 算法层 | `bestAnchor` 只看 dx/dy 比例，不考虑实际布局 | 无法识别"垂直列中相邻 vs 非相邻" |

**关键代码**：
```css
/* canvas.module.css L809 */
.boundedContextTree {
  display: flex;
  flex-direction: column;  /* ← 根因 */
  gap: 0.75rem;
}
```

---

## 3. Solution

将 `boundedContextTree` CSS 布局改为水平/网格布局，使卡片在水平方向展开。修复后，不同的 x 坐标使 `bestAnchor()` 自然选择 right/left 锚点，连线水平展开，清晰可辨。

---

## 4. Epics & Acceptance Criteria

---

### Epic 1: BCT-布局改造 — 水平/网格布局迁移

**目标**: 修改 `boundedContextTree` CSS 布局，从垂直堆叠改为水平/网格排列。

**用户故事**:  
作为用户，我希望限界上下文树的卡片能够水平展开，这样节点间的连线不会堆叠成一条垂直线。

| ID | Given | When | Then |
|----|-------|------|------|
| AC-BCT-1 | 访问限界上下文树页面 | 页面加载完成 | 3个BC卡片在水平方向展开，非垂直堆叠 |
| AC-BCT-2 | 卡片水平排列后 | 查看任意两卡片间的连线 | 连线使用 right→left anchor（水平贝塞尔曲线），不堆叠 |
| AC-BCT-3 | 执行 `grep -rn "flex-direction.*column" BoundedContextTree` | 搜索完成后 | 无匹配结果 |

**Definition of Done**:
- [ ] `boundedContextTree` CSS 已从 `flex-direction: column` 改为水平布局（flex row 或 CSS Grid）
- [ ] `grep -rn "flex-direction.*column" BoundedContextTree` 无匹配结果
- [ ] `npm run build` 通过，无编译错误

---

### Epic 2: BCT-连线渲染验证 — 连线清晰可辨

**目标**: 确保布局改造后，连线渲染正常，连线不重叠成单条线。

**用户故事**:  
作为用户，我希望能够清楚地看到限界上下文之间的连线关系，而不是看到一条垂直的堆叠线。

| ID | Given | When | Then |
|----|-------|------|------|
| AC-BCT-4 | 3个BC卡片水平排列 | 页面渲染完成 | 卡片间连线（dependency/composition/association）清晰可辨，无重叠 |
| AC-BCT-5 | 任意两BC卡片间 | 连线渲染 | 连线为水平贝塞尔曲线，从右锚点指向左锚点 |
| AC-BCT-6 | 访问限界上下文树页面 | 截图验证 | gstack screenshot 显示连线不堆叠成单条垂直线 |

**Definition of Done**:
- [ ] gstack screenshot 验证：连线清晰，无"单条垂直线"现象
- [ ] 3个节点间的 C(3,2)=3 条连线均可见
- [ ] 连线不穿越卡片本体

---

### Epic 3: BCT-回归验证 — 卡片交互功能正常

**目标**: 确保布局改动不破坏现有卡片交互功能（点击、编辑、确认、拖拽）。

**用户故事**:  
作为用户，我希望布局改变后，卡片的原有交互功能完全正常，不受布局改造影响。

| ID | Given | When | Then |
|----|-------|------|------|
| AC-BCT-7 | 卡片水平排列后 | 点击任意BC卡片 | 卡片高亮/选中状态正常 |
| AC-BCT-8 | 卡片水平排列后 | 触发确认/编辑操作 | 交互逻辑正常工作 |
| AC-BCT-9 | 卡片水平排列后 | 触发拖拽排序 | 拖拽行为正常，不因布局改变而失效 |

**Definition of Done**:
- [ ] 卡片点击选中功能正常
- [ ] 卡片确认/编辑操作正常
- [ ] 卡片拖拽排序功能正常
- [ ] 节点 `nodeRects` DOM 查询（`data-node-id`）正确定位卡片

---

## 5. Out of Scope

- `vibex-bc-canvas-edge-render` 的修复实现（同一修复，本项目仅处理 boundedContextTree 场景）
- `bestAnchor()` 算法本身的改动（布局改造后无需修改算法）
- 移除 BoundedEdgeLayer 连线功能

---

## 6. Risk Assessment

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 水平布局下卡片过多时的换行表现 | 低 | 低 | CSS Grid `auto-fill` 自动处理 |
| 布局改动影响已有功能 | 中 | 高 | 全量回归测试（Epic 3） |

---

## 7. Dependencies

- `vibex-bc-canvas-edge-render` 修复方案（同一修复，可并行开发）
- 布局改动需在 gstack 环境下验证截图

---

## 8. Estimation

| Epic | 工时 |
|------|------|
| Epic 1: 布局改造 | 2h |
| Epic 2: 连线渲染验证 | 2h |
| Epic 3: 回归验证 | 1h |
| 验证与修复 | 1h |
| **合计** | **6h** |
