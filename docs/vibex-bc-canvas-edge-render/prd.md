# PRD: VibeX BC 树连线渲染异常修复

> **项目**: vibex-bc-canvas-edge-render  
> **版本**: v1.0  
> **日期**: 2026-03-30  
> **状态**: Draft  
> **PM**: PM Agent  
> **工作目录**: /root/.openclaw/vibex

---

## 1. Executive Summary

### 1.1 Problem Statement

限界上下文树（Bounded Context Tree）中，所有卡片之间的连线全部汇聚在一条垂直线上，无法体现节点间的实际关系。用户无法通过连线视觉上区分不同节点之间的 dependency / composition / association 关系。

### 1.2 Root Cause

**双重根因**：

1. **CSS 布局层**：`boundedContextTree` 使用 `flex-direction: column` 垂直堆叠，所有卡片的 x 坐标相同。
2. **锚点算法层**：`bestAnchor()` 判断 `dx = 0`（因为所有卡片 x 相同），`dy > 0`（不同 y），由于 `Math.abs(dx) < Math.abs(dy)`，算法始终进入 `dy >= 0` 分支，选择 `{ fromAnchor: 'bottom', toAnchor: 'top' }`。

结果：所有跨卡片连线都从各卡片的左侧边缘（bottom 锚点）引出，在相似的 x 位置汇聚，视觉上形成一条垂直线。

### 1.3 Solution Overview

| 层级 | 改动 | 方案 |
|------|------|------|
| 布局层 | CSS `flex-direction: column` → `row` / CSS Grid | 根本解决 |
| 算法层 | `bestAnchor()` 已有逻辑，但需配合布局获得正确 dx/dy | 依赖布局修复 |
| 渲染层 | `BoundedEdgeLayer` 贝塞尔曲线渲染 | 优化（Epic3） |

**推荐方案**：Epic1（锚点算法加固）+ Epic2（CSS 布局改为水平/网格）同时实施，Epic3 作为可选优化。

---

## 2. User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US1 | user | 在 BC Tree 中清晰看到不同节点之间的连线关系 | 能区分 dependency / composition / association 连线 |
| US2 | user | 连线在水平方向展开而非垂直堆叠 | 能直观理解节点之间的层级和依赖关系 |
| US3 | user | 点击卡片编辑时连线仍然正确渲染 | 编辑操作不影响连线显示 |
| US4 | developer | 连线渲染逻辑与布局无关 | 避免未来布局改动再次破坏连线 |

---

## 3. Epics & Stories

---

### Epic 1: 锚点选择算法修复（P0）

**描述**：加固 `bestAnchor()` 算法，增加水平偏移场景的处理，确保在各种 dx/dy 组合下都能选择最优锚点方向。

#### Story 1.1: bestAnchor 算法加固

**工作目录**：`src/components/diagram/edges/edgePath.ts`

**验收标准**：

```
expect(bestAnchor({x:0,y:0,w:200,h:80}, {x:300,y:0,w:200,h:80}).fromAnchor).toBe('right'); // 水平相邻，right→left
expect(bestAnchor({x:0,y:0,w:200,h:80}, {x:300,y:200,w:200,h:80}).fromAnchor).toBe('right'); // 右下方，right→bottom-left
expect(bestAnchor({x:0,y:200,w:200,h:80}, {x:300,y:0,w:200,h:80}).fromAnchor).toBe('bottom-right'); // 右上方，bottom-right→top-left
expect(bestAnchor({x:0,y:0,w:200,h:80}, {x:0,y:200,w:200,h:80}).fromAnchor).toBe('bottom'); // 垂直对齐，fallback bottom→top（布局修复后这个 case 减少）
```

#### Story 1.2: bestAnchor 覆盖测试

**工作目录**：`src/components/diagram/edges/edgePath.test.ts`（新建）

**验收标准**：

```
expect(单元测试覆盖率 bestAnchor) ≥ 90%
expect(测试用例覆盖 dx=0, dx>0, dx<0, dy=0, dy>0, dy<0 的组合) === true
expect(边界测试: from和to完全重叠时返回兜底值) === true
```

#### Story 1.3: computeEdgePath 水平场景控制点优化

**工作目录**：`src/components/diagram/edges/edgePath.ts`

**验收标准**：

```
expect(水平连线控制点偏移 ≥ 40px) === true
expect(垂直连线控制点偏移 ≥ 60px) === true
expect(控制点偏移根据 dx/dy 动态计算，非固定值) === true
```

**DoD（Epic 1）**：
- [ ] `bestAnchor()` 覆盖测试通过，覆盖率 ≥ 90%
- [ ] 水平场景（dx > 0）下 fromAnchor 选择 right/right-bottom/right-top
- [ ] `computeEdgePath()` 水平控制点偏移 ≥ 40px
- [ ] `grep -rn "flex-direction.*column" boundedContextTree` → 需配合 Epic2

---

### Epic 2: CSS 布局改为水平/网格（P0）

**描述**：将 `boundedContextTree` 的 CSS 布局从 `flex-direction: column` 改为水平布局（flex row 或 CSS Grid），从根本上解决 dx = 0 的问题，使 `bestAnchor()` 能正确选择水平锚点。

#### Story 2.1: CSS 布局改为水平 flex

**工作目录**：`src/components/diagram/canvas/BoundedContextTree.tsx` + `canvas.module.css`

**验收标准**：

```
expect(卡片在水平方向排列) === true
expect(屏幕宽度不足时自动换行) === true
expect(卡片间距 gap: 1.5rem) === true
expect(无 flex-direction: column 残留) === true
```

#### Story 2.2: nodeRects DOM 查询位置调整

**工作目录**：`src/components/diagram/canvas/BoundedContextTree.tsx`

**问题说明**：卡片从垂直堆叠改为水平排列后，DOM 中的相对位置发生变化，需要验证 `nodeRects` 的 `data-node-id` 查询是否仍然正确工作。

**验收标准**：

```
expect(所有卡片的 data-node-id 属性正确设置) === true
expect(卡片横向排列后，getBoundingClientRect() 返回正确的 x 坐标) === true
expect(gstack screenshot: 卡片横向排列，间距一致) === true
```

#### Story 2.3: 卡片交互功能回归测试

**工作目录**：全量交互测试

**验收标准**：

```
expect(gstack: 点击卡片打开编辑抽屉) === true
expect(gstack: 确认/取消编辑后卡片数据更新) === true
expect(gstack: 拖拽卡片位置后连线重新渲染) === true
expect(gstack: 删除卡片后相关连线消失) === true
```

**DoD（Epic 2）**：
- [ ] `flex-direction: column` 移除，改为 `flex-direction: row` 或 `display: grid`
- [ ] 3 个 BC 卡片在水平方向展开（非垂直堆叠）
- [ ] `data-node-id` DOM 查询正常，`nodeRects` 数据完整
- [ ] 卡片交互（点击、编辑、确认、拖拽）功能正常
- [ ] gstack screenshot 验证：连线清晰可辨，不重叠成单条线

---

### Epic 3: 连线渲染优化（P1）

**描述**：在布局修复后，对 `BoundedEdgeLayer` 的贝塞尔曲线渲染进行优化，减少连线交叉，提升视觉清晰度。

#### Story 3.1: 连线交叉规避

**工作目录**：`src/components/diagram/edges/BoundedEdgeLayer.tsx`

**验收标准**：

```
expect(相同起终点的多条连线不完全重叠) === true
expect(贝塞尔曲线控制点动态偏移，避免交叉) === true
expect(dependency / composition / association 三种连线样式可区分) === true
```

#### Story 3.2: 连线动画与交互

**验收标准**：

```
expect(卡片 hover 时相关连线高亮) === true
expect(连线 hover 显示关系类型 tooltip) === true
```

**DoD（Epic 3）**：
- [ ] 连线不重叠，视觉可区分
- [ ] hover 交互正常工作
- [ ] 三种连线类型（dependency/composition/association）样式可区分

---

## 4. Non-Functional Requirements

| 类型 | 要求 |
|------|------|
| **性能** | 连线渲染帧率 ≥ 60fps（≤ 20 个节点） |
| **兼容性** | Chrome/Edge/Firefox/Safari 最新两个版本 |
| **可访问性** | 连线类型支持 screen reader 文本说明（aria-label） |
| **可维护性** | `edgePath.ts` 测试覆盖率 ≥ 90% |

---

## 5. Out of Scope

- 移除 `BoundedEdgeLayer`（直接删除连线功能）
- 修改节点间的实际关系数据（只修复渲染，不改数据模型）
- 移动端适配（本次仅修复桌面端布局）

---

## 6. Dependencies

| 依赖 | 说明 |
|------|------|
| `BoundedContextTree.tsx` | 主要修改文件 |
| `edgePath.ts` | bestAnchor / computeEdgePath |
| `BoundedEdgeLayer.tsx` | 连线渲染组件 |
| `canvas.module.css` | 样式文件 |

---

## 7. Implementation Plan

### Phase 1: Epic 1 — 锚点算法修复（预计 4h）

```
T1.1: 阅读 edgePath.ts，理解 bestAnchor() 和 computeEdgePath() 逻辑
T1.2: 为 bestAnchor() 编写单元测试，覆盖 9 种 dx/dy 组合
T1.3: 根据测试结果修复 bestAnchor()，确保水平场景选择 right 锚点
T1.4: 优化 computeEdgePath() 控制点偏移逻辑
T1.5: 测试通过，覆盖率 ≥ 90%
```

### Phase 2: Epic 2 — CSS 布局改造（预计 4h）

```
T2.1: 将 canvas.module.css 中 .boundedContextTree 的 flex-direction: column 改为 row
T2.2: 调整 gap、卡片宽度等参数
T2.3: 验证 nodeRects DOM 查询，修复 data-node-id 位置问题
T2.4: gstack screenshot 验证水平布局
T2.5: 全量交互回归测试（点击、编辑、拖拽）
```

### Phase 3: Epic 3 — 连线渲染优化（预计 3h，可选）

```
T3.1: 分析当前连线渲染效果，识别交叉问题
T3.2: 实现控制点动态偏移，减少交叉
T3.3: 添加 hover 高亮和 tooltip
T3.4: gstack 验证视觉效果
```

### 总工时：7-10h（Epic 1 + Epic 2 必须，Epic 3 可选）

---

## 8. Test Plan

| 测试类型 | 工具 | 验收条件 |
|---------|------|----------|
| 单元测试 | Vitest | `bestAnchor` 覆盖率 ≥ 90% |
| 截图验证 | gstack | 连线水平展开，无垂直堆叠 |
| 交互测试 | gstack | 点击/编辑/拖拽正常 |
| 回归测试 | gstack | 整体页面功能正常 |

---

## 9. 文件清单

```
修改文件：
- src/components/diagram/canvas/BoundedContextTree.tsx
- src/components/diagram/canvas/canvas.module.css
- src/components/diagram/edges/edgePath.ts

新增文件：
- src/components/diagram/edges/edgePath.test.ts

待验证：
- src/components/diagram/edges/BoundedEdgeLayer.tsx（交互回归）
```
