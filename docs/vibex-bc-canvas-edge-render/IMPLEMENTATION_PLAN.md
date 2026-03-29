# IMPLEMENTATION_PLAN: VibeX BC 树连线渲染异常修复

> **项目**: vibex-bc-canvas-edge-render
> **创建日期**: 2026-03-30
> **基于**: PRD v1 + Architecture
> **代码文件**: `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`
> **样式文件**: `vibex-fronted/src/components/canvas/canvas.module.css`
> **算法文件**: `vibex-fronted/src/components/diagram/edges/edgePath.ts`

---

## 1. 现状分析

### 1.1 问题快照

```
当前布局 (flex-direction: column):
┌────────────┐
│  Context A │
└─────┬──────┘  ← bottom 锚点，所有线在此汇聚
      │
┌─────┴──────┐
│  Context B │
└─────┬──────┘
      │
┌─────┴──────┐
│  Context C │
─────────────  ← 三条线重叠成一条垂直线
```

### 1.2 文件位置索引

| 元素 | 文件 | 行号 |
|------|------|------|
| `.boundedContextTree` CSS | canvas.module.css | ~L809 |
| `inferBoundedEdges()` | BoundedContextTree.tsx | ~L170-210 |
| `bestAnchor()` | edgePath.ts | ~L40-80 |
| `computeEdgePath()` | edgePath.ts | ~L80-120 |
| `BoundedEdgeLayer` | BoundedEdgeLayer.tsx | ~L30-80 |

---

## 2. Epic 1: 锚点算法修复 — 4h

### Story 1.1: bestAnchor 单元测试 (1.5h)

**目标**: 为 `bestAnchor()` 编写完整测试用例。

```typescript
// src/components/diagram/edges/edgePath.test.ts (新建)

describe('bestAnchor', () => {
  const card = (x: number, y: number, w = 280, h = 120): NodeRect => ({
    x, y, width: w, height: h
  });

  // 9 种 dx/dy 组合
  test('水平右: dx > 0, dy ≈ 0 → right→left', () => {
    expect(bestAnchor(card(0, 0), card(400, 10))).toMatchObject({
      fromAnchor: 'right', toAnchor: 'left'
    });
  });

  test('水平左: dx < 0, dy ≈ 0 → left→right', () => {
    expect(bestAnchor(card(400, 0), card(0, 10))).toMatchObject({
      fromAnchor: 'left', toAnchor: 'right'
    });
  });

  test('垂直下: dx ≈ 0, dy > 0 → bottom→top', () => {
    expect(bestAnchor(card(0, 0), card(10, 300))).toMatchObject({
      fromAnchor: 'bottom', toAnchor: 'top'
    });
  });

  test('垂直上: dx ≈ 0, dy < 0 → top→bottom', () => {
    expect(bestAnchor(card(0, 300), card(10, 0))).toMatchObject({
      fromAnchor: 'top', toAnchor: 'bottom'
    });
  });

  test('右下: dx > 0, dy > 0 → right 相关锚点', () => {
    const result = bestAnchor(card(0, 0), card(400, 300));
    expect(['right', 'bottom-right', 'top-right']).toContain(result.fromAnchor);
  });
});
```

### Story 1.2: bestAnchor 算法加固 (1.5h)

**修改**: `edgePath.ts`

```typescript
// 改进 bestAnchor() 阈值
function bestAnchor(from: NodeRect, to: NodeRect): AnchorPair {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // 主要改进: 降低水平阈值，使 dx 较小时也能选择水平锚点
  // 旧: Math.abs(dx) >= Math.abs(dy)
  // 新: absDx >= absDy * 0.5
  if (absDx >= absDy * 0.5) {
    return dx > 0
      ? { fromAnchor: 'right', toAnchor: 'left' }
      : { fromAnchor: 'left', toAnchor: 'right' };
  }

  // 垂直场景
  return dy >= 0
    ? { fromAnchor: 'bottom', toAnchor: 'top' }
    : { fromAnchor: 'top', toAnchor: 'bottom' };
}
```

### Story 1.3: computeEdgePath 控制点优化 (1h)

**修改**: `edgePath.ts` — `computeEdgePath()`

```typescript
function computeEdgePath(
  fromRect: NodeRect,
  toRect: NodeRect,
  anchor: AnchorPair
): string {
  const from = getAnchorPoint(fromRect, anchor.fromAnchor);
  const to = getAnchorPoint(toRect, anchor.toAnchor);

  // 动态计算控制点偏移
  const isHorizontal = ['right', 'left'].includes(anchor.fromAnchor);
  const distance = isHorizontal
    ? Math.abs(to.x - from.x)
    : Math.abs(to.y - from.y);
  const offset = Math.min(
    isHorizontal ? 60 : 80,
    distance * 0.4  // 最多 40% 的距离作为控制点偏移
  );

  const cp1 = offsetAnchorPoint(from, anchor.fromAnchor, offset);
  const cp2 = offsetAnchorPoint(to, anchor.toAnchor, offset);

  return `M ${from.x} ${from.y} C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${to.x} ${to.y}`;
}
```

**DoD**:
- [ ] `edgePath.test.ts` 覆盖率 ≥ 90%
- [ ] 所有 9 种 dx/dy 组合测试通过

---

## 3. Epic 2: CSS 布局改造 — 4h

### Story 2.1: Flex 布局改为水平 (2h)

**修改**: `canvas.module.css` L809

```css
/* 旧 */
.boundedContextTree {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* 新 */
.boundedContextTree {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: flex-start;
}
```

### Story 2.2: nodeRects DOM 位置验证 (1h)

**验证**: `BoundedContextTree.tsx` 中 `useEffect` 读取 `getBoundingClientRect()` 时机。

```typescript
useEffect(() => {
  // 延迟读取，确保 DOM 已渲染
  const timer = setTimeout(() => {
    const rects: Record<string, DOMRect> = {};
    nodeRefs.current.forEach((el, nodeId) => {
      if (el) rects[nodeId] = el.getBoundingClientRect();
    });
    setNodeRects(rects);
  }, 100);
  return () => clearTimeout(timer);
}, [boundedContexts.length]); // 依赖数量变化
```

### Story 2.3: 卡片交互回归测试 (1h)

使用 gstack 验证：
1. 点击卡片 → 打开编辑抽屉
2. 确认/取消编辑 → 数据更新
3. 拖拽卡片 → 连线重新渲染
4. 删除卡片 → 连线消失

**DoD**:
- [ ] `flex-direction: column` 已移除
- [ ] 卡片水平排列，间距 1.5rem
- [ ] `data-node-id` DOM 查询正常
- [ ] gstack screenshot: 连线水平展开，无垂直堆叠

---

## 4. Epic 3: 连线渲染优化（P1 可选）— 3h

### Story 3.1: 控制点动态偏移

```typescript
// 基于边的角度计算控制点偏移
function computeControlPointOffset(from: Point, to: Point): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return Math.min(80, distance * 0.3);
}
```

### Story 3.2: hover 高亮与 tooltip

```typescript
// BoundedEdgeLayer.tsx 新增
<path
  onMouseEnter={(e) => setHoveredEdge(edge.id)}
  onMouseLeave={() => setHoveredEdge(null)}
  aria-label={`${edge.type}: ${edge.from} → ${edge.to}`}
/>
```

---

## 5. 总工时

| Epic | 任务 | 工时 |
|------|------|------|
| Epic 1 | 锚点算法修复 | 4h |
| Epic 2 | CSS 布局改造 | 4h |
| Epic 3 | 连线渲染优化 | 3h (P1) |
| **合计** | | **8-11h** |

---

## 6. 文件清单

**修改文件**:
- `vibex-fronted/src/components/canvas/canvas.module.css`
- `vibex-fronted/src/components/diagram/edges/edgePath.ts`

**新增文件**:
- `vibex-fronted/src/components/diagram/edges/edgePath.test.ts`

**验证文件**（回归）:
- `vibex-fronted/src/components/canvas/BoundedContextTree.tsx`
- `vibex-fronted/src/components/diagram/edges/BoundedEdgeLayer.tsx`
