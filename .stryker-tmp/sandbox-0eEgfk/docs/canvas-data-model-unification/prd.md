# PRD: Canvas Data Model Unification — 2026-03-31

> **任务**: canvas-data-model-unification/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **产出物**: /root/.openclaw/vibex/docs/canvas-data-model-unification/prd.md
> **分析文档**: /root/.openclaw/vibex/docs/canvas-data-model-unification/analysis.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | canvasStore(1288行)、messageDrawerStore、historySlice、confirmationStore 四个 store 独立存在，数据不统一。BoundedContext/BusinessFlow 在 confirmationStore 与 canvasStore 中重复定义且结构不兼容。无顶层 CanvasSession 模型。 |
| **目标** | Phase1：消除类型重复 + 新增 useCanvasSession hook + 实现自动联动 middleware；Phase2：合并 store + CanvasSession 统一持久化 |
| **成功指标** | confirmationStore 无重复类型；useCanvasSession 可组合；自动消息记录；自动历史快照 |

---

## 2. Epic 拆分

### Epic 1: 消除 confirmationStore 重复类型（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S1.1 | 新建共享类型文件 `canvas/types.ts`（BoundedContextNode/BusinessFlowNode/ComponentNode 唯一定义） | 1h | `expect(hasSharedTypes).toBe(true); expect(sharedTypesFile).toExist();` |
| S1.2 | confirmationStore 引用 `canvas/types.ts`，删除本地重复定义 | 1h | `expect(duplicateTypeDefCount).toBe(0);` |
| S1.3 | 更新 confirmationStore 所有引用方（涉及页面逐个迁移） | 1h | `expect(allPagesUsingSharedTypes).toBe(true);` |
| S1.4 | 验证 BoundedContextNode 和 BusinessFlowNode 两者结构兼容 | 0.5h | `expect(oldBoundedContext).toBeCompatibleWith(BoundedContextNode);` |

**DoD**: 代码中无重复的 BoundedContext/BusinessFlow 类型定义，所有引用方使用共享类型

---

### Epic 2: useCanvasSession 组合 hook（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S2.1 | 新建 `lib/canvas/useCanvasSession.ts` hook | 1h | `expect(useCanvasSession).toBeDefined();` |
| S2.2 | hook 返回 sessionId + 三棵树 + messages + projectId + drawerState | 0.5h | `expect(hookReturns.sessionId).toBeDefined(); expect(hookReturns.contextNodes).toBeDefined();` |
| S2.3 | hook 返回 AI 状态 + SSE 状态 | 0.5h | `expect(hookReturns.aiStatus).toBeDefined(); expect(hookReturns.sseStatus).toBeDefined();` |
| S2.4 | 单元测试覆盖 hook 返回值 | 0.5h | `expect(hookUnitTests).toHaveLength(10);` |

**DoD**: useCanvasSession hook 可组合所有 store，单元测试覆盖

---

### Epic 3: historyMiddleware 自动快照（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S3.1 | 设计 historyMiddleware：监听 canvasStore 节点变更，自动调用 recordSnapshot | 1.5h | `expect(historyMiddleware).toBeDefined();` |
| S3.2 | 防止 middleware 循环触发（isRecording flag） | 0.5h | `expect(isRecordingFlag).toPreventRecursion();` |
| S3.3 | 验证新增节点自动记录历史快照（无需手动调用） | 0.5h | `expect(addNodeTriggerSnapshot).toBe(true);` |
| S3.4 | 验证删除/确认节点同样触发快照 | 0.5h | `expect(deleteNodeTriggerSnapshot).toBe(true); expect(confirmNodeTriggerSnapshot).toBe(true);` |

**DoD**: 节点操作自动记录历史，无需手动调用 recordSnapshot()

---

### Epic 4: messageMiddleware 自动消息（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S4.1 | 设计 messageMiddleware：监听 canvasStore 节点变更，自动追加消息到 messageDrawerStore | 1.5h | `expect(messageMiddleware).toBeDefined();` |
| S4.2 | 节点操作 → messageDrawerStore.messages 自动追加（addNodeMessage/confirmNodeMessage/deleteNodeMessage） | 0.5h | `expect(addNodeAppendsMessage).toBe(true); expect(confirmNodeAppendsMessage).toBe(true);` |
| S4.3 | 验证刷新后消息持久化（messageDrawerStore persist） | 0.5h | `expect(messagesPersistAfterRefresh).toBe(true);` |

**DoD**: 节点操作自动记录消息，无需手动调用 addNodeMessage()

---

### Epic 5: Migration 与回归测试（P1）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S5.1 | 实现 Zustand persist migration 函数（处理旧版本数据） | 1h | `expect(migrationFunction).toExist();` |
| S5.2 | 旧格式 localStorage → 加载 → 数据完整 | 0.5h | `expect(oldDataAfterMigration).toBeComplete();` |
| S5.3 | useCanvasSession hook 回归测试 | 0.5h | `expect(hookRegressionTests).toPass();` |
| S5.4 | middleware 行为回归测试（无无限循环） | 0.5h | `expect(noInfiniteLoop).toBe(true);` |
| S5.5 | gstack screenshot 验证 UI 无回归 | 0.5h | `expect(screenshot).toMatchBaseline();` |

**DoD**: migration 通过，所有回归测试通过

---

## 3. Phase 2（未来工作，非本 PRD 范围）

| Epic | 内容 | 工时 |
|------|------|------|
| Epic 6 | 合并 messageDrawerStore → canvasStore（作为 slice） | 4h |
| Epic 7 | 合并 historySlice → canvasStore（作为 slice） | 4h |
| Epic 8 | 设计 CanvasSession 统一持久化格式 | 3h |
| Epic 9 | 实现 CanvasSession persist migration | 3h |
| Epic 10 | 消除 confirmationStore 完整引用 canvasStore | 4h |
| Epic 11 | E2E 测试 + 回归测试 | 6h |

**Phase 2 总工时**: 30-40h

---

## 4. 验收标准总表（expect() 断言）

| ID | 条件 | 断言 |
|----|------|------|
| AC-1 | confirmationStore 无重复类型定义 | `expect(searchDuplicateTypeDef('BoundedContext')).toHaveLength(0);` |
| AC-2 | useCanvasSession 返回完整会话信息 | `expect(Object.keys(useCanvasSession())).toContain('sessionId', 'contextNodes', 'messages', 'projectId');` |
| AC-3 | 新增节点自动记录历史快照 | `expect(historySlice.past.length).toIncrease();` |
| AC-4 | 节点操作自动追加消息记录 | `expect(messageDrawerStore.messages.length).toIncrease();` |
| AC-5 | 刷新后 session 数据完整恢复 | `expect(useCanvasSession()).toMatchSnapshot();` |
| AC-6 | migration 后数据不丢失 | `expect(migratedData).toEqual(originalData);` |
| AC-7 | middleware 无无限循环 | `expect(recordSnapshotCallCount).toBeLessThan(5);` |

---

## 5. 非功能需求

| 类型 | 要求 |
|------|------|
| **性能** | middleware 调用 < 10ms，无主线程阻塞 |
| **兼容性** | localStorage 旧数据 migration 后不丢失 |
| **可维护性** | 每个 store 独立职责，middleware 单一职责 |
| **向后兼容** | Phase 1 不破坏现有 persist 数据 |

---

## 6. 与相关项目的关系

| 项目 | 关系 | 处理 |
|------|------|------|
| canvas-drawer-msg | 消息功能依赖 messageDrawerStore | Phase1 保留 store 不合并 |
| canvas-drawer-persistent | drawer 状态已在 canvasStore | 可直接复用 |
| canvas-data-model-unification | 本项目 | — |

---

## 7. 实施计划

| Epic | Story | 工时 | Sprint |
|------|-------|------|--------|
| Epic 1 | S1.1-S1.4 消除重复类型 | 3.5h | Sprint 0 |
| Epic 2 | S2.1-S2.4 useCanvasSession hook | 2.5h | Sprint 0 |
| Epic 3 | S3.1-S3.4 historyMiddleware | 3h | Sprint 0 |
| Epic 4 | S4.1-S4.3 messageMiddleware | 2.5h | Sprint 0 |
| Epic 5 | S5.1-S5.5 Migration + 回归 | 3h | Sprint 0 |

**Phase 1 总工时**: ~14.5h

---

## 8. DoD（完成定义）

### 功能点 DoD
1. 代码实现完成
2. 每个 Story 验收标准通过
3. `npm run build` 通过，TypeScript 0 errors
4. ESLint 0 warnings
5. middleware 无无限循环

### Epic DoD
- **Epic 1**: 无重复类型定义，所有引用方使用共享类型
- **Epic 2**: useCanvasSession hook 返回完整会话信息，单元测试通过
- **Epic 3**: 节点操作自动记录历史快照，无需手动调用
- **Epic 4**: 节点操作自动追加消息记录，无需手动调用
- **Epic 5**: migration 通过，所有回归测试通过，gstack 截图验证 UI 无回归
