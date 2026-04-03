# Epic3 检查清单: 交集高亮与起止标记

**项目**: vibex-next-roadmap-ph1
**任务**: dev-epic3-交集高亮与起止标记
**日期**: 2026-03-30
**Agent**: dev

---

## 功能点

| ID | 功能 | 验收标准 | 状态 |
|----|------|---------|------|
| F8 | 交集高亮 | BC 卡片交集时高亮 | ✅ 已实现 |
| F9 | 起止节点标记 | BC 卡片首尾标记 ◉ / ◎ | ✅ 已实现 |

---

## F8: 交集高亮 ✅

**实现方式**:
- `OverlapHighlightLayer` 已在 `CardTreeRenderer.tsx` 中渲染
- 使用 `boundedGroups` 从 canvasStore 计算交集区域
- SVG 层 `z-index: 20`, `pointer-events: none`

**文件**:
- `vibex-fronted/src/components/canvas/groups/OverlapHighlightLayer.tsx`
- `vibex-fronted/src/components/visualization/CardTreeRenderer/CardTreeRenderer.tsx:499-501`

**验证**:
```bash
# 检查 OverlapHighlightLayer 是否被渲染
grep -n "OverlapHighlightLayer" vibex-fronted/src/components/visualization/CardTreeRenderer/CardTreeRenderer.tsx

# 输出: groups={boundedGroups} zoom={viewport.zoom} pan={{ x: viewport.x, y: viewport.y }}
```

**注意**: 交集高亮需要 `boundedGroups` 数组有至少2个重叠的组才会显示。

---

## F9: 起止节点标记 ✅

**实现方式**:
- `buildFlowGraph` 在创建节点时添加 `isStart` 和 `isEnd` 标志
- `CardTreeNode` 根据标志显示 ◉ (起点) 或 ◎ (终点)

**文件**:
- `vibex-fronted/src/components/visualization/CardTreeRenderer/CardTreeRenderer.tsx`
  - 第 143-144 行: 添加 `isStart: index === 0` 和 `isEnd: index === data.nodes.length - 1`
- `vibex-fronted/src/components/visualization/CardTreeNode/CardTreeNode.tsx`
  - 第 139-140 行: 提取 `isStart` 和 `isEnd` 标志
  - 第 177-182 行: 渲染标记元素
- `vibex-fronted/src/components/visualization/CardTreeNode/CardTreeNode.module.css`
  - `.nodeMarker` 样式定义
- `vibex-fronted/src/types/visualization.ts`
  - `CardTreeNodeData` 接口添加 `isStart?: boolean` 和 `isEnd?: boolean`

**验证**:
```bash
# 检查标记渲染
grep -n "nodeMarker" vibex-fronted/src/components/visualization/CardTreeNode/CardTreeNode.tsx
# 输出: data-testid="node-marker-start" 和 data-testid="node-marker-end"

# 检查 CSS
grep -n "nodeMarker" vibex-fronted/src/components/visualization/CardTreeNode/CardTreeNode.module.css
# 输出: .nodeMarker 样式定义
```

---

## 回归测试 ✅

**红线约束**: 不得破坏 Epic1/2 功能

| 检查项 | 验证方式 | 状态 |
|--------|---------|------|
| expandMode 正常 | 检查 `CanvasExpandMode` 类型和 `setExpandMode` | ✅ |
| F11 快捷键 | 检查 `useEffect` 中的 `keydown` 监听 | ✅ |
| maximize 模式 | 检查 `toggleMaximize` 和 CSS 样式 | ✅ |

**TypeScript 编译**: ✅ 通过
```bash
cd vibex-fronted && npx tsc --noEmit
# 无错误输出
```

---

## 产出物

1. ✅ `buildFlowGraph` 添加 `isStart`/`isEnd` 标志
2. ✅ `CardTreeNode` 渲染 ◉ / ◎ 标记
3. ✅ CSS 样式 `.nodeMarker`
4. ✅ TypeScript 类型更新
5. ✅ 提交 `1c80c448`

---

## 备注

- F8 (交集高亮) 依赖 `boundedGroups` 数据，如需测试需要先填充测试数据
- F9 (起止标记) 自动根据节点顺序设置，无需额外配置
- 标记使用 `data-testid` 便于 E2E 测试定位
