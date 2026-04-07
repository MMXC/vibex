# VibeX canvasStore 迁移清理 — 开发约束

**项目**: canvas-canvasstore-migration
**版本**: v1.0
**日期**: 2026-04-04

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: 待 coord 创建项目并绑定
- **执行日期**: 2026-04-04

---

## 1. 角色约束

### 1.1 Dev Agent

**E1 约束**:
- [ ] crossStoreSync 不得创建循环订阅
- [ ] loadExampleData 使用 `.getState()` 而非 hook
- [ ] canvasStore.ts 仅含 re-export，无任何业务逻辑
- [ ] 所有新文件导出 TypeScript 类型

**E2 约束**:
- [ ] CanvasPage.tsx 不得 import canvasStore.ts 的 helper 函数
- [ ] loadExampleData 从新模块调用

**E3 约束**:
- [ ] 删除 canvasHistoryStore.ts 前必须 grep 全量搜索
- [ ] deprecated.ts 所有函数带 JSDoc @deprecated 标记
- [ ] DDD 文件（contextSlice/modelSlice）不得删除

### 1.2 Tester Agent

**E4 约束**:
- [ ] contextStore 覆盖率 ≥ 80%
- [ ] flowStore cascadeUpdate 测试 ≥ 5 个用例
- [ ] 删除旧 canvasStore.test.ts 前必须确保新测试覆盖率不下降

**E5 约束**:
- [ ] migration.test.ts 覆盖 split stores 数据一致性
- [ ] store-integration.test.ts 覆盖 crossStoreSync 订阅
- [ ] E2E 通过率 ≥ 95% 是合并门槛

### 1.3 Reviewer Agent

**审查约束**:
- [ ] canvasStore.ts < 50 行是合并门槛
- [ ] crossStoreSync 无循环依赖（madge 检查）
- [ ] canvasHistoryStore grep 无结果是删除前提

---

## 2. 代码规范

### 2.1 crossStoreSync 模板

```typescript
// src/lib/canvas/crossStoreSync.ts
import { useContextStore } from './stores/contextStore';
import { useFlowStore } from './stores/flowStore';
import { useUIStore } from './stores/uiStore';

type Unsubscribe = () => void;

export function initCrossStoreSync(): Unsubscribe {
  const unsubs: Unsubscribe[] = [];

  // 监听 context 变化 → 触发 cascade
  unsubs.push(
    useContextStore.subscribe(
      (state) => state.contextNodes,
      () => { /* cascade logic */ }
    )
  );

  // 监听 activeTree → 同步 centerExpand
  unsubs.push(
    useUIStore.subscribe(
      (state) => state.activeTree,
      (activeTree) => {
        useUIStore.setState({ centerExpand: activeTree });
      }
    )
  );

  return () => unsubs.forEach(fn => fn());
}
```

### 2.2 canvasStore re-export 模板

```typescript
// src/lib/canvas/canvasStore.ts
/**
 * @deprecated 请从 src/lib/canvas/stores/ 导入对应 store
 * 此文件将在未来版本中移除
 */
export { useContextStore } from './stores';
export { useFlowStore } from './stores';
export { useComponentStore } from './stores';
export { useUIStore } from './stores';
export { useSessionStore } from './stores';
export type { CanvasStore } from './stores/types';
```

### 2.3 deprecated.ts 模板

```typescript
// src/lib/canvas/deprecated.ts
/**
 * @deprecated 请从 src/lib/canvas/stores/ 导入对应 store
 * 此文件将在未来版本中移除
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setContextNodes(nodes: any[]): void {
  console.warn('[deprecated] setContextNodes 请使用 useContextStore.getState().setContextNodes');
  useContextStore.getState().setContextNodes(nodes);
}
```

---

## 3. 禁止事项

- ❌ crossStoreSync 不得有循环订阅
- ❌ canvasStore.ts 不得含业务逻辑
- ❌ canvasHistoryStore 删除前不得跳过 grep 扫描
- ❌ DDD 文件（contextSlice/modelSlice）不得删除

---

## 4. 验收门槛

| 指标 | 目标 | 验证方式 |
|------|------|---------|
| canvasStore.ts 行数 | < 50 | `wc -l` |
| crossStoreSync 循环依赖 | 0 | `madge --circular` |
| CanvasPage canvasStore import | 0 | `grep` |
| canvasHistoryStore.ts | 已删除 | 文件检查 |
| contextStore 覆盖率 | ≥ 80% | Jest 覆盖率 |
| E2E 通过率 | ≥ 95% | Playwright |
| 无 console.log | 是 | `grep` |

---

*开发约束版本: v1.0 | 架构师: Architect Agent | 日期: 2026-04-04*
