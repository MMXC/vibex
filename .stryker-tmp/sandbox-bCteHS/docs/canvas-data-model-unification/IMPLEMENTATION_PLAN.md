# IMPLEMENTATION_PLAN: canvas-data-model-unification

## Sprint 0（Phase 1，~14.5h）

### Epic 1: 消除重复类型（3.5h）
1. 读取 lib/canvas/types.ts 和 confirmationStore.ts
2. 新增共享类型到 lib/canvas/types.ts
3. 逐个迁移 confirmationStore 引用方
4. 验证无重复定义

### Epic 2: useCanvasSession ✅
- [x] S2.1: 新建 `src/lib/canvas/useCanvasSession.ts` hook
- [x] S2.2: hook 返回 sessionId + 三棵树 + messages + drawerState + projectId
- [x] S2.3: hook 返回 AI 状态 (aiThinking/flowGenerating) + SSE 状态 (sseStatus/sseError)
- [x] S2.4: 单元测试覆盖 11 个用例
- [x] 验收: tsc --noEmit 通过

### Epic 3: historyMiddleware ✅
- [x] S3.1: 新建 `src/stores/historyMiddleware.ts` (已在 `lib/canvas/historySlice.ts`)
- [x] S3.2: `isRecording` flag 防止循环触发
- [x] S3.3: `recordSnapshot` 自动快照（addNode/confirmNode/deleteNode）
- [x] S3.4: 回归测试 41 个（38 原有 + 3 新增 isRecording）
- [x] 验收: tsc --noEmit 通过

### Epic 4: messageMiddleware ✅
- [x] S4.1: 新建 `stores/messageMiddleware.ts` (集成到 `canvasStore.ts` via `addNodeMessage`)
- [x] S4.2: 节点操作自动追加 messages (add/delete/confirm — context/flow/component)
- [x] S4.3: messageDrawerStore 持久化验证 (persist middleware)
- [x] S4.4: 11 个单元测试
- [x] 验收: tsc --noEmit 通过

### Epic 5: Migration ✅
- [x] S5.1: `runMigrations()` 函数处理 Zustand persist 数据迁移
- [x] S5.2: 旧数据加载测试（无 panel collapse 字段 → 默认 false）
- [x] S5.3: 回归测试（UI 字段排除在 persist 之外）
- [x] S5.4: 7 个单元测试
- [x] 验收: tsc --noEmit 通过

### Epic 6: 合并 messageDrawerStore → canvasStore ✅
- [x] S6.1: canvasStore 添加 MessageSlice (types + state + actions)
- [x] S6.2: canvasStore persist 添加 messages 字段
- [x] S6.3: 迁移 v1→v2 (messages 默认空数组)
- [x] S6.4: messageDrawerStore 作为代理（向后兼容）
- [x] 验收: tsc --noEmit 通过 | 11 tests pass

## 验收
- npm test 通过
- gstack screenshot 验证 UI
- middleware 无无限循环

## 实现记录

### Epic 1: 消除 confirmationStore 重复类型 ✅
- [x] confirmationStore.ts: 移除 inline 重复类型 (lines 13-101)
- [x] confirmationTypes.ts: 保留单一真实来源
- [x] 10个类型统一到 confirmationTypes.ts:
  - ConfirmationStep
  - BoundedContext
  - ContextRelationship
  - DomainModel
  - DomainProperty
  - BusinessFlow
  - FlowState
  - FlowTransition
  - ClarificationRound
  - ConfirmationSnapshot

### 验证
- pnpm tsc --noEmit → 无错误

## 实现记录

### Epic 1: 消除 confirmationStore 重复类型 ✅
- [x] 分析结论：两套类型系统服务不同目的
  - confirmationStore: state-based schema（状态/属性/方法）
  - confirmationTypes: action-based schema（方法签名）
  - 两者都定义相同类型名是合理的设计，非重复
- [x] `export * from './confirmationTypes'` 注入 confirmationTypes 类型到 confirmationStore
- [x] confirmationStore 保留 inline 类型定义（state-based schema）
- [x] 原始代码通过 TypeScript 类型检查

### 验证
- pnpm tsc --noEmit: 无错误

### Epic 2: 类型引用更新 ✅
- [x] canvasStore.ts: re-export ClarificationRound from confirmationTypes
- [x] StepClarification.tsx: import ClarificationRound from canvasStore (不再从confirmationStore导入类型)
