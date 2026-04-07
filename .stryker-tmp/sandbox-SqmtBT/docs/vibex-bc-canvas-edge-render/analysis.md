# Analysis: VibeX BC 树连线渲染异常 — 连线集中于垂直线

> **任务**: vibex-bc-canvas-edge-render/analyze-requirements
> **分析日期**: 2026-03-30
> **分析师**: Analyst Agent
> **项目**: vibex-bc-canvas-edge-render
> **工作目录**: /root/.openclaw/vibex

---

## 1. 执行摘要

限界上下文树（BC Tree）中，所有卡片之间的连线全部集中在一个垂直方向上，无法体现节点间的实际关系。

**根因**：`boundedContextTree` 使用 `flex-direction: column` 垂直布局，所有卡片 x 坐标相同。当 `bestAnchor()` 判断 dx < dy 时，选择 bottom→top 路径，导致所有跨卡片连线都走垂直方向，视觉上全部堆叠。

---

## 2. 实地审计

### 2.1 布局结构

**BoundedContextTree.tsx** - CSS 布局：
```css
/* canvas.module.css L809 */
.boundedContextTree {
  display: flex;
  flex-direction: column;  /* ← 垂直堆叠 */
  gap: 0.75rem;
}
```

### 2.2 连线锚点算法

**edgePath.ts - bestAnchor()**：
```ts
function bestAnchor(from: NodeRect, to: NodeRect) {
  const dx = to.x - from.x;  // = 0（垂直布局，x 相同）
  const dy = to.y - from.y;  // > 0（不同 y）
  if (Math.abs(dx) >= Math.abs(dy)) { /* 左右锚点 */ }
  return dy >= 0
    ? { fromAnchor: 'bottom', toAnchor: 'top' }  // ← 始终走这个分支
    : { fromAnchor: 'top', toAnchor: 'bottom' };
}
```

### 2.3 连线生成逻辑

**BoundedContextTree.tsx - inferBoundedEdges()**：
- 为所有节点对生成连线（完全图）
- 3 个节点 → C(3,2) = 3 条连线
- 连线类型：dependency / composition / association

**BoundedEdgeLayer.tsx**：
- 每条连线渲染为贝塞尔曲线
- 用 `nodeRects[id]` 查找起终点位置
- 如果 `nodeRects` 为空（data-node-id 查询失败），所有 `nodeMap[edge.from.groupId]` 返回 undefined → 连线不渲染（但如果部分 rects 存在则部分渲染）

### 2.4 根因分析

**两层问题**：

| 层次 | 问题 | 影响 |
|------|------|------|
| 布局层 | `flex-direction: column` 导致所有卡片 x 相同 | `bestAnchor` 始终选择 bottom→top |
| 算法层 | `bestAnchor` 只看 dx/dy 比例，不考虑实际布局 | 无法识别"垂直列中相邻 vs 非相邻" |

**为什么"集中在一条垂直线上"**：
- 假设 3 个节点垂直堆叠在 x=0 处
- 节点1↔节点2：bottom→top，垂直向右弯曲
- 节点1↔节点3：bottom→top，垂直向右弯曲（更宽的弧）
- 节点2↔节点3：bottom→top，垂直向右弯曲
- 三条线都从各卡片的左侧边缘（bottom 锚点）引出，在相似的 x 位置汇聚 → "一条垂直线"效果

---

## 3. 方案对比

### 方案 A：改为水平/网格布局（推荐）

**做法**：修改 `boundedContextTree` CSS，使用 CSS Grid 替代 flex column，让卡片水平排列或形成网格。

```css
.boundedContextTree {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
  /* 或 */
  display: flex;
  flex-direction: row;  /* 水平排列 */
}
```

**优势**：布局改变后，dx 自然增大，`bestAnchor` 选择 right→left，视觉上自然展开
**劣势**：需要重新测试所有卡片交互（点击、编辑、拖拽）

### 方案 B：修改 bestAnchor 算法，增加抖动/偏移

**做法**：在 `computeEdgePath` 中，对垂直场景增加水平控制点偏移，避免多条线完全重叠。

```ts
// 在垂直场景下，增加随机/确定性偏移
const cpOffset = Math.min(dy * 0.5, 80) + (Math.abs(dy) > 100 ? 30 : 0);
```

**优势**：不改布局，最小改动
**劣势**：治标不治本，连线仍然相互交叉

### 方案 C：直接移除 BoundedEdgeLayer

**做法**：删除 `BoundedContextTree.tsx` 中的 `<BoundedEdgeLayer>` 组件，暂时隐藏连线功能。

**优势**：消除视觉噪音，快速修复
**劣势**：丢失上下文关系信息，破坏 Epic F3.2 功能完整性

---

## 4. 推荐方案

**推荐方案 A（改为水平/网格布局）**

理由：
1. 从根本上解决问题 — 不同 x 坐标 → `bestAnchor` 选择 right/left → 连线自然展开
2. 同时改善用户体验 — 水平布局更适合上下文卡片的并排对比
3. 改动范围可控（CSS），不影响数据层和交互逻辑

---

## 5. 验收标准

- [ ] 3 个 BC 卡片在水平方向展开（非垂直堆叠）
- [ ] 卡片之间的连线用 right→left anchor（水平曲线，非垂直堆叠）
- [ ] gstack screenshot：连线清晰可辨，不重叠成单条线
- [ ] `grep -rn "flex-direction.*column" BoundedContextTree` → 无结果
- [ ] 卡片交互（点击编辑、确认、拖拽）功能正常

---

## 6. 风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 水平布局下卡片过多时的换行表现 | 低 | 低 | CSS grid auto-fill 自动处理 |
| 布局改动影响已有功能 | 中 | 高 | 全量回归测试（gstack） |

---

## 7. 工时估算

| 改动 | 工时 |
|------|------|
| 修改 CSS 布局（flex→grid/row） | 2h |
| 调整 nodeRects DOM 查询（data-node-id 位置） | 1h |
| gstack 验证（截图 + 交互） | 2h |
| 全量回归 | 1h |
| **合计** | **6h** |
