# Spec: E5 - Phase 5 sessionStore + 清理

## 1. 概述

**工时**: 2 天（dev）+ 0.5 天（reviewer）| **优先级**: P1
**依赖**: E1-E4（最后执行）

## 2. 提取内容

```typescript
// sessionStore.ts (~150 行)
interface SessionState {
  sseStatus: 'connected' | 'disconnected' | 'connecting';
  aiThinking: boolean;
  flowGenerating: boolean;
  queue: string[];
  messages: Message[];
}

interface SessionActions {
  setSseStatus: (status: string) => void;
  setAiThinking: (thinking: boolean) => void;
  setFlowGenerating: (generating: boolean) => void;
  addToQueue: (item: string) => void;
  removeFromQueue: (item: string) => void;
  addMessage: (message: Message) => void;
}
```

## 3. 统一导出

```typescript
// stores/index.ts
export { useContextStore } from './contextStore';
export { useUiStore } from './uiStore';
export { useFlowStore } from './flowStore';
export { useComponentStore } from './componentStore';
export { useSessionStore } from './sessionStore';
```

## 4. canvasStore 清理

```typescript
// canvasStore.ts → 目标 ≤ 150 行
// 仅保留：
// 1. 根 store create
// 2. combine(...stores)
// 3. devtools + persist
// 4. 跨 slice actions（如 recomputeActiveTree）
// 删除：所有 re-export
```

## 5. localStorage 迁移

```typescript
// migration handler
const migrations = {
  1: (persistedState) => {
    // Phase 1 后添加：确保 contextNodes 在新 store
    return persistedState;
  },
  2: (persistedState) => {
    // Phase 2 后添加：确保 UI 状态在新 store
    return persistedState;
  },
  // ...
};
```

## 6. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E5-AC1 | 检查文件 | wc -l sessionStore.ts | ≤ 150 行 |
| E5-AC2 | SSE 状态 | 连接/断开 | 状态正确 |
| E5-AC3 | stores/index.ts | grep exports | 5 个 store 全导出 |
| E5-AC4 | 检查文件 | wc -l canvasStore.ts | ≤ 150 行 |
| E5-AC5 | localStorage | 清除缓存后刷新 | 数据完整恢复 |

## 6. DoD

- [ ] sessionStore.ts 存在且 ≤ 150 行
- [ ] SSE/AI thinking/queue/messages 状态正常
- [ ] stores/index.ts 导出全部 5 个 store
- [ ] canvasStore.ts ≤ 150 行
- [ ] localStorage 迁移无数据丢失
