# E1 Spec: canvasStore 清理与降级

## 目标文件结构

```
src/lib/canvas/
├── canvasStore.ts          # 重写为 < 50 行，纯类型 re-export
├── crossStoreSync.ts       # 新建，跨 store 订阅
├── loadExampleData.ts      # 新建，示例数据加载
├── deprecated.ts           # 新建，废弃兼容层
└── stores/
    ├── contextStore.ts     # 已存在
    ├── flowStore.ts        # 已存在
    └── ...
```

## canvasStore.ts 目标内容（< 50 行）

```typescript
// src/lib/canvas/canvasStore.ts
// 此文件已废弃，请从 stores/ 目录导入对应 store
// @deprecated 使用 contextStore/flowStore/componentStore/uiStore/sessionStore
export { useContextStore } from './stores';
export { useFlowStore } from './stores';
export { useComponentStore } from './stores';
export { useUIStore } from './stores';
export { useSessionStore } from './stores';
// 类型
export type { CanvasStore } from './stores/types';
```

## crossStoreSync.ts 设计

```typescript
// src/lib/canvas/crossStoreSync.ts
// 跨 store 订阅逻辑，无循环依赖
import { useContextStore } from './stores';
import { useFlowStore } from './stores';
import { useUIStore } from './stores';

export function initCrossStoreSync() {
  // 监听 context 树变化 → 更新 flow panel 状态
  // 监听 activeTree 切换 → 同步 centerExpand
  // 监听 phase 变化 → 同步 panel collapse 状态
  const unsubContext = useContextStore.subscribe(
    (state) => state.contextNodes,
    () => { /* cascade logic */ }
  );

  return () => {
    unsubContext();
    // ... cleanup
  };
}
```

## loadExampleData.ts 设计

```typescript
// src/lib/canvas/loadExampleData.ts
import { useContextStore } from './stores/contextStore';
import { useFlowStore } from './stores/flowStore';
import { useComponentStore } from './stores/componentStore';
import { useUIStore } from './stores/uiStore';

export function loadExampleData() {
  const contextStore = useContextStore.getState();
  const flowStore = useFlowStore.getState();
  const componentStore = useComponentStore.getState();
  const uiStore = useUIStore.getState();

  // 设置示例数据
  contextStore.setContextNodes(exampleContexts);
  flowStore.setFlowNodes(exampleFlows);
  componentStore.setComponentNodes(exampleComponents);
  uiStore.setPhase('context');
}
```
