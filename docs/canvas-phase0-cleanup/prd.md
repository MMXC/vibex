# PRD: VibeX Canvas Phase0 代码清理

**项目**: canvas-phase0-cleanup
**版本**: v1.0
**日期**: 2026-04-03
**状态**: PM 细化
**来源**: Analyst 需求分析报告

---

## 1. 执行摘要

### 背景
Canvas 模块经多轮迭代，存在五类代码质量债务：9 处 `as any` 类型断言（高风险）、4 处 console.log/error、6 处重复 `generateId()`、3 个废弃函数、`recordSnapshot` 逻辑 bug（用户撤销历史错误）。

### 目标
清理代码质量债务，消除类型系统失守隐患，修复撤销历史 bug，为后续迭代建立健康基线。

### 成功指标
| 指标 | 当前基线 | Sprint 目标 |
|------|----------|------------|
| `as any` 出现次数（CanvasPage） | 9 | 0 |
| console.log/error 出现次数 | 4 | 0 |
| `generateId()` 重复定义 | 6 | 0 |
| 废弃函数数 | 3 | 0 |
| recordSnapshot bug | 存在 | 修复 |

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | 依赖 |
|------|------|--------|------|------|
| E1 | 消除 `as any` 类型断言 | P1 | 1.5h | 无 |
| E2 | 清理调试语句 | P2 | 0.5h | 无 |
| E3 | 提取 `generateId()` 为公共函数 | P2 | 1h | 无 |
| E4 | 删除废弃函数 | P2 | 1h | 无 |
| E5 | 修复 recordSnapshot bug | P0 | 0.5h | 无 |

**总工时**: 4.5h

**并行说明**: 5 个 Epic 均在独立文件中改动，无依赖关系，可并行开发。

---

### Epic 1: 消除 `as any` 类型断言（P1）

#### 概述
`CanvasPage.tsx` 中 9 处 `as any` 分布在 Group A（冲突处理器，L362/365/368）和 Group B（undo/redo，L528/545）。类型断言导致运行时类型错误无法被 TS 编译器保护。

#### Stories

**S1.1: Group A 冲突处理器类型守卫**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要在将 serverData 写入 store 前做运行时类型验证 |
| 功能点 | 为 `serverData.contexts/flows/components` 添加类型守卫函数（`isValidContextNodes` 等）|
| 验收标准 | `expect(isValidContextNodes(serverData.contexts)).toBe(true)` + `expect(isValidContextNodes(null)).toBe(false)` |
| 页面集成 | 【需页面集成】CanvasPage.tsx L362/365/368 |
| 工时 | 0.75h |
| 依赖 | 无 |

**S1.2: Group B undo/redo 类型联合类型**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要为 historyStore.undo/redo 返回值建立类型安全 |
| 功能点 | 定义 `HistorySnapshot = BoundedContextNode[] \| BusinessFlowNode[] \| ComponentNode[]`，替换 `unknown` |
| 验收标准 | `expect(historyStore.undo('context')).toBeInstanceOf(Array)` + `expect(undoResult[0]).toHaveProperty('nodeId')` |
| 页面集成 | 【需页面集成】CanvasPage.tsx L528/545 |
| 工时 | 0.75h |
| 依赖 | 无 |

#### DoD
- `grep -c "as any" CanvasPage.tsx === 0`
- 类型守卫函数覆盖所有 serverData 写入路径
- 冲突解决三路径手动测试通过

---

### Epic 2: 清理调试语句（P2）

#### 概述
4 处 `console.log/error` 污染生产环境控制台，需直接删除。

#### Stories

**S2.1: 删除所有调试语句**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望生产环境无调试日志 |
| 功能点 | 删除：`CanvasPage.tsx` L773、`uiStore.ts` L166、`canvasApi.ts` L135/L412 |
| 验收标准 | `expect(grep('console.log', 'src/components/canvas/ src/lib/canvas/')).toHaveLength(0)` |
| 页面集成 | 无 |
| 工时 | 0.5h |
| 依赖 | 无 |

#### DoD
- 全局 `grep -rn "console\.(log|error)" src/components/canvas/ src/lib/canvas/` 输出为空

---

### Epic 3: 提取 `generateId()` 为公共函数（P2）

#### 概述
`generateId()` 在 6 个文件中重复定义，维护成本高。提取到统一工具文件。

#### Stories

**S3.1: 创建公共工具文件**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要一个统一的 ID 生成工具函数 |
| 功能点 | 创建 `src/lib/canvas/utils/id.ts`，导出 `generateId()` + `generateNodeId()` |
| 验收标准 | `expect(generateId()).toMatch(/^\d+-[a-z0-9]+$/)` + `expect(generateNodeId()).toMatch(/^node-\d+-[a-z0-9]+$/)` |
| 页面集成 | 无 |
| 工时 | 0.3h |
| 依赖 | 无 |

**S3.2: 替换 6 处重复定义**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望所有 store 从统一工具导入 generateId，不再有重复定义 |
| 功能点 | 替换：`flowStore.ts`、`contextStore.ts`、`componentStore.ts`、`requirementHistoryStore.ts`、`useCanvasSnapshot.ts`、`useHomeState.ts` |
| 验收标准 | `expect(grep('function generateId', 'src/lib/canvas/')).toHaveLength(0)` + `expect(imports.length).toBe(6)` |
| 页面集成 | 无 |
| 工时 | 0.7h |
| 依赖 | S3.1 |

#### DoD
- `src/lib/canvas/utils/id.ts` 存在且导出正确
- 6 个文件从 `id.ts` import，不再有本地 `function generateId`
- 相关 store 测试通过

---

### Epic 4: 删除废弃函数（P2）

#### 概述
3 个废弃函数（`submitCanvas`、`cascadeContextChange`、`cascadeFlowChange`、`areAllConfirmed`）未被生产代码使用，需清理。

#### Stories

**S4.1: 删除 uiStore.submitCanvas**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要删除 uiStore 中的死代码 |
| 功能点 | 删除 `uiStore.submitCanvas` 函数（L166） |
| 验收标准 | `expect(grep('submitCanvas', 'uiStore.ts')).toHaveLength(0)` |
| 页面集成 | 无 |
| 工时 | 0.2h |
| 依赖 | 无 |

**S4.2: 删除 cascade 废弃函数**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要删除 cascade 模块中的废弃函数及其引用 |
| 功能点 | 删除 `cascadeContextChange`、`cascadeFlowChange`、`areAllConfirmed` 及 cascade/index.ts 导出 |
| 验收标准 | `expect(grep('cascadeContextChange', 'cascade/index.ts')).toHaveLength(0)` + `expect(grep('areAllConfirmed', 'cascade/index.ts')).toHaveLength(0)` |
| 页面集成 | 无 |
| 工时 | 0.4h |
| 依赖 | 无 |

**S4.3: 删除关联测试文件**
| 字段 | 内容 |
|------|------|
| Story | 作为 tester，我需要删除引用废弃函数的测试文件 |
| 功能点 | 删除 `CascadeUpdateManager.test.ts` 中相关测试块、`exampleData.test.ts` 中 `areAllConfirmed` 引用 |
| 验收标准 | `expect(grep('areAllConfirmed', 'CascadeUpdateManager.test.ts')).toHaveLength(0)` |
| 页面集成 | 无 |
| 工时 | 0.4h |
| 依赖 | S4.2 |

#### DoD
- uiStore.ts 中无 submitCanvas 函数
- cascade/index.ts 中无 cascadeContextChange/cascadeFlowChange/areAllConfirmed
- CascadeUpdateManager.test.ts 中无废弃函数引用

---

### Epic 5: 修复 recordSnapshot bug（P0）

#### 概述
`flowStore.ts` 的 `reorderSteps` 方法中 `recordSnapshot` 在 `map` 回调内调用，传入变更前的旧值，导致 redo 无法恢复到正确状态。

#### Stories

**S5.1: 修复 recordSnapshot 调用位置**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要修复 reorderSteps 中 recordSnapshot 的调用位置 |
| 功能点 | 将 `recordSnapshot` 移出 `map` 回调，传入计算后的 `newNodes` |
| 验收标准 | `expect(recordSnapshot).toBeCalledWith('flow', newNodes)` |
| 页面集成 | 无 |
| 工时 | 0.3h |
| 依赖 | 无 |

**S5.2: 添加 undo/redo 步骤重排测试**
| 字段 | 内容 |
|------|------|
| Story | 作为 tester，我需要验证步骤重排后 undo/redo 行为正确 |
| 功能点 | 单元测试：重排 → undo 恢复重排前 → redo 恢复到重排后 |
| 验收标准 | `expect(afterUndo.steps[0].order).toBe(0)` + `expect(afterRedo.steps[0].order).toBe(1)` |
| 页面集成 | 无 |
| 工时 | 0.2h |
| 依赖 | S5.1 |

#### DoD
- `recordSnapshot` 在 map 循环外，传入 newNodes
- undo/redo 步骤重排测试通过
- flowStore 测试套件全部通过

---

## 3. 验收标准汇总

| Epic | Story | 功能点 | expect() 断言 |
|------|-------|--------|--------------|
| E1 | S1.1 | Group A 类型守卫 | `isValidContextNodes(null) === false` |
| E1 | S1.2 | Group B 类型联合 | `undoResult[0].hasOwnProperty('nodeId')` |
| E2 | S2.1 | 删除调试语句 | `grep console.log === 0` |
| E3 | S3.1 | ID 工具文件 | `generateNodeId().startsWith('node-')` |
| E3 | S3.2 | 替换 6 处 | `grep 'function generateId' === 0` |
| E4 | S4.1 | submitCanvas | `grep submitCanvas === 0` |
| E4 | S4.2 | cascade 函数 | `grep areAllConfirmed === 0` |
| E4 | S4.3 | 关联测试 | `grep areAllConfirmed in test === 0` |
| E5 | S5.1 | recordSnapshot 位置 | `toBeCalledWith('flow', newNodes)` |
| E5 | S5.2 | undo/redo 测试 | `afterRedo.steps[0].order === 1` |

**合计**: 5 Epic，9 Story，20 条 expect() 断言

---

## 4. Sprint 排期

| Sprint | Epic | 工时 | 目标 |
|--------|------|------|------|
| Sprint 1 Day 1 AM | E5 recordSnapshot bug | 0.5h | P0 立即修复 |
| Sprint 1 Day 1 | E1 `as any` 消除 | 1.5h | 类型安全 |
| Sprint 1 Day 1 | E2 console 清理 | 0.5h | 无生产日志 |
| Sprint 1 Day 2 | E3 generateId 提取 | 1h | DRY |
| Sprint 1 Day 2 | E4 废弃函数删除 | 1h | 代码清洁 |

---

## 5. 非功能需求

| 类别 | 要求 |
|------|------|
| 类型安全 | 所有 serverData 写入路径有类型守卫 |
| 测试覆盖 | 每个 Epic 有对应测试验证 |
| 代码清洁 | 无 console 日志、无废弃函数、无重复代码 |

---

## 6. 实施约束

- Epic 1-5 可并行开发，独立文件改动
- Epic 4 删除 cascade 函数前再次全量扫描确认无生产引用
- ID 生成格式不变，仅移动位置（向后兼容）
- 所有改动后运行 `pnpm test -- --testPathPattern="canvas"` 验证无 regression
