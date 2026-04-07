# Architecture: vibex-architect-proposals-20260331_060315

**Project**: Architect 自检提案 — 状态管理模块化 + 虚拟化 + TS 严格模式
**Agent**: architect
**Date**: 2026-03-31
**PRD**: docs/vibex-architect-proposals-20260331_060315/prd.md

---

## 1. 核心问题

`canvasStore.ts` 900+ 行，单文件承载 context + flow + component + UI 状态。测试覆盖率无法达标，修改风险极高。

---

## 2. 目标架构

### 2.1 Store 拆分方案

```
src/stores/
├── contextStore.ts     # 【新】上下文树状态（contextSlice）
├── flowStore.ts        # 【新】流程树状态（flowSlice）
├── componentStore.ts   # 【新】组件树状态（componentSlice）
├── uiStore.ts          # 【新】UI 状态（selectedPanel, isExpand 等）
├── historyStore.ts     # 【新】历史记录（undo/redo）
└── canvasStore.ts      # 【保留】聚合层，向后兼容
    └── 引用 contextStore + flowStore + componentStore + uiStore
```

**向后兼容**：现有组件 `import { useCanvasStore } from '@/stores'` 无需修改，canvasStore 作为聚合层代理到各子 store。

### 2.2 虚拟化方案

```typescript
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

---

## 3. TypeScript 严格模式

### 3.1 tsconfig 策略

不一次性开启 `--strict`，采用渐进式：

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": false,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

每季度增加一项 strict 选项，逐步提升类型安全。

### 3.2 禁止新增 @ts-ignore

CI 检查：
```bash
git diff --name-only origin/main...HEAD | xargs grep -l '@ts-ignore' && exit 1
```

---

## 4. 实施顺序

| 阶段 | Story | 工时 | 说明 |
|------|-------|------|------|
| 1 | 拆分方案设计 | 2h | 输出拆分计划文档 |
| 2 | contextStore.ts 拆分 | 3h | 现有测试迁移 |
| 3 | flowStore + componentStore 拆分 | 3h | 集成测试 |
| 4 | uiStore.ts 提取 | 2h | UI 状态独立 |
| 5 | canvasStore 聚合层 | 2h | 向后兼容 |
| 6 | 虚拟化集成 | 4.5h | 性能验证 |
| 7 | TS strict 渐进升级 | 8h | 每季度一项 |

---

*Architect 产出物 | 2026-03-31*
