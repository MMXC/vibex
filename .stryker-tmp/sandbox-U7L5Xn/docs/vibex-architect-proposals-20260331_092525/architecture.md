# Architecture: vibex-architect-proposals-20260331_092525

**Project**: Architect 自检提案 — 状态管理模块化 + 虚拟化 + TS 严格模式
**Agent**: architect
**Date**: 2026-03-31
**PRD**: docs/vibex-architect-proposals-20260331_092525/prd.md

---

## 1. 核心问题

`canvasStore.ts` 900+ 行，单文件承载所有 canvas 状态。测试覆盖率无法达标。

---

## 2. 目标架构

```
src/stores/
├── contextStore.ts      # 【新】上下文树状态
├── flowStore.ts        # 【新】流程树状态
├── componentStore.ts   # 【新】组件树状态
├── uiStore.ts         # 【新】UI 状态
├── canvasStore.ts     # 【保留】聚合层，向后兼容
```

向后兼容：现有组件 `import { useCanvasStore }` 无需修改。

---

## 3. 虚拟化

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
// ComponentTree 100+ 节点时，viewport 外节点不渲染
```

---

*Architect 产出物 | 2026-03-31*
