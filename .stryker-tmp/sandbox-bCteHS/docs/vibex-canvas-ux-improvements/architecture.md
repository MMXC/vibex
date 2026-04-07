# Architecture: vibex-canvas-ux-improvements

**Project**: Canvas UX 升级
**Agent**: architect
**Date**: 2026-03-31
**Analysis**: /root/.openclaw/vibex/docs/vibex-canvas-ux-improvements/analysis.md

---

## 1. 执行摘要

3 个 Epic：
1. **状态管理规范化** — 选区过滤与确认状态分离
2. **列表虚拟化** — 100+ 节点时不卡顿
3. **用户引导体系** — 空状态和功能说明

---

## 2. Epic 1: 状态管理规范化

### 2.1 根因

`handleContinueToComponents` 发送全部 contexts，忽略选区。

### 2.2 修复

```typescript
// CanvasPage.tsx - handleContinueToComponents
const selectedContextIds = new Set(selectedNodeIds.context || []);
const confirmedIds = new Set(
  contextNodes.filter(n => n.confirmed).map(n => n.nodeId)
);

// 如果有选区，只发选区且已确认的
// 如果无选区，发所有已确认的
const toSend = selectedContextIds.size > 0
  ? contextNodes.filter(n => selectedContextIds.has(n.nodeId) && n.confirmed)
  : contextNodes.filter(n => n.confirmed);
```

---

## 3. Epic 2: 列表虚拟化

```tsx
// ComponentTree.tsx 使用 @tanstack/react-virtual
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedTree({ nodes }: { nodes: TreeNode[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
  });

  return (
    <div ref={parentRef} style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(vItem => (
          <TreeNodeItem key={vItem.key} node={nodes[vItem.index]} />
        ))}
      </div>
    </div>
  );
}
```

**性能目标**: 100 节点 PAN 操作 ≥ 30 FPS。

---

## 4. Epic 3: 用户引导体系

| 功能 | 实现 | 文件 |
|------|------|------|
| 空状态引导文案 | ComponentTree emptySubtext | ComponentTree.tsx |
| 连线图例 | FlowLegend SVG 组件 | components/canvas/FlowLegend.tsx |
| 节点标记 tooltip | SVG marker + `<title>` | BusinessFlowTree.tsx |
| 快捷键帮助 | `?` 键触发 HelpPanel | CanvasPage.tsx |

---

## 5. 文件变更清单

| 文件 | 操作 | Epic |
|------|------|------|
| `CanvasPage.tsx` | 修改 handleContinueToComponents | Epic 1 |
| `ComponentTree.tsx` | 修改 emptySubtext | Epic 3 |
| `ComponentTree.tsx` | 增加虚拟化 | Epic 2 |
| `BusinessFlowTree.tsx` | SVG marker + title | Epic 3 |
| `components/canvas/FlowLegend.tsx` | 新增 | Epic 3 |
| `components/canvas/HelpPanel.tsx` | 新增 | Epic 3 |
| `jest.config.ts` | 添加 @tanstack/react-virtual | Epic 2 |

---

## 6. 性能影响

| 指标 | 影响 | 评估 |
|------|------|------|
| Bundle size | +8 KB | @tanstack/react-virtual |
| 100 节点渲染 | +0ms | viewport 裁剪减少 DOM |
| API 行为 | +0ms | 逻辑变更，无性能影响 |

---

## 7. 实施顺序

| Epic | 工时 | 说明 |
|------|------|------|
| Epic 1 | 2h | 紧急，fix bug |
| Epic 3 | 2.5h | UI 改动，独立 |
| Epic 2 | 5h | 虚拟化集成 |

**总工时**: ~9.5h

---

*Architect 产出物 | 2026-03-31*
