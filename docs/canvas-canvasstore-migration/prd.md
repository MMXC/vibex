# PRD: VibeX canvasStore 迁移清理

**项目**: canvas-canvasstore-migration
**版本**: v1.0
**日期**: 2026-04-03
**状态**: PM 细化
**来源**: Analyst 需求分析报告

---

## 1. 执行摘要

### 背景
canvasStore（1451 行）经 Phase 1-5 已拆分为 5 个独立 split stores（contextStore/flowStore/componentStore/uiStore/sessionStore）。但 canvasStore.ts 仍保留为 170 行兼容层，内部含跨 store 订阅和 helper 函数，造成双重数据源、import 混乱、死代码残留问题。

### 目标
完成 canvasStore 最终清理：降级为纯类型 re-export、消除双重数据源、更新 import 路径、补全测试覆盖、删除死代码。

### 成功指标
| 指标 | 当前基线 | Sprint 目标 |
|------|----------|------------|
| canvasStore.ts 行数 | ~170 行 | < 50 行 |
| import 混乱文件数 | 1 个（CanvasPage） | 0 |
| 死代码文件 | 1 个（canvasHistoryStore） | 0 |
| split stores 最低覆盖率 | 不等 | ≥ 80% |
| E2E 通过率 | 已知 | ≥ 95% |

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | 依赖 |
|------|------|--------|------|------|
| E1 | canvasStore 清理与降级 | P0 | 4h | 无 |
| E2 | CanvasPage import 迁移 | P0 | 2h | E1 |
| E3 | 废弃 store 删除 | P1 | 2h | E2 |
| E4 | Split stores 测试补全 | P1 | 5h | E1 |
| E5 | Integration 测试 | P1 | 3h | E2+E4 |

**总工时**: 16h

---

### Epic 1: canvasStore.ts 清理与降级（P0）

#### Stories

**S1.1: 审查剩余业务逻辑**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要确认 canvasStore 中剩余的跨 store 订阅和 helper 函数 |
| 功能点 | 审查 canvasStore.ts，列出所有跨 store 订阅和 helper 函数 |
| 验收标准 | `expect(businessLogicItems.length).toBeGreaterThan(0)` |
| 页面集成 | 无 |
| 工时 | 1h |
| 依赖 | 无 |

**S1.2: 提取 crossStoreSync.ts**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要将跨 store 订阅逻辑提取为独立文件 |
| 功能点 | 新建 `src/lib/canvas/crossStoreSync.ts`，提取订阅逻辑，无循环依赖 |
| 验收标准 | `expect(madgeIsCircular('crossStoreSync')).toBe(false)` |
| 页面集成 | 无 |
| 工时 | 1.5h |
| 依赖 | S1.1 |

**S1.3: 提取 loadExampleData.ts**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要将 loadExampleData 提取为独立函数 |
| 功能点 | 新建 `src/lib/canvas/loadExampleData.ts`，功能与原来完全一致 |
| 验收标准 | `expect(loadExampleData().contextNodes.length).toBeGreaterThan(0)` |
| 页面集成 | 【需页面集成】CanvasPage.tsx |
| 工时 | 0.5h |
| 依赖 | S1.1 |

**S1.4: canvasStore.ts 降级**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要将 canvasStore.ts 降级为纯类型 re-export |
| 功能点 | canvasStore.ts 重写为 < 50 行，仅含类型定义和 re-export |
| 验收标准 | `expect(lineCount('canvasStore.ts')).toBeLessThan(50)` + `expect(hasBusinessLogic).toBe(false)` |
| 页面集成 | 无 |
| 工时 | 1h |
| 依赖 | S1.2+S1.3 |

#### DoD
- canvasStore.ts < 50 行
- crossStoreSync.ts 无循环依赖
- loadExampleData 功能验证通过
- 无 `setState`/`dispatch`/`createSlice` 业务关键字

---

### Epic 2: CanvasPage import 迁移（P0）

#### Stories

**S2.1: 更新 import 路径**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要更新 CanvasPage.tsx 从 split stores 导入 helper 函数 |
| 功能点 | 移除 canvasStore helper 导入，改为从 split stores 或新模块导入 |
| 验收标准 | `expect(hasCanvasStoreImport).toBe(false)` + `expect(hasSplitStoreImport).toBe(true)` |
| 页面集成 | 【需页面集成】CanvasPage.tsx |
| 工时 | 1.5h |
| 依赖 | E1 |

**S2.2: 全量回归测试**
| 字段 | 内容 |
|------|------|
| Story | 作为 tester，我需要验证 CanvasPage 迁移后三树增删改和示例加载正常 |
| 功能点 | 运行 CanvasPage 全流程测试 |
| 验收标准 | `expect(allCanvasPageTests).toBe(true)` |
| 页面集成 | 【需页面集成】CanvasPage.tsx |
| 工时 | 0.5h |
| 依赖 | S2.1 |

#### DoD
- CanvasPage.tsx 无 `from '@/lib/canvas/canvasStore'` 导入
- TypeScript 编译无错误
- 三树增删改和示例加载功能正常

---

### Epic 3: 废弃 store 删除（P1）

#### Stories

**S3.1: 删除 canvasHistoryStore**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要删除死代码文件 canvasHistoryStore.ts |
| 功能点 | 删除 `src/stores/canvasHistoryStore.ts`，全量搜索确认无引用 |
| 验收标准 | `expect(fileExists('canvasHistoryStore.ts')).toBe(false)` + `expect(grepReferences).toHaveLength(0)` |
| 页面集成 | 无 |
| 工时 | 0.5h |
| 依赖 | E2 |

**S3.2: 创建 deprecated.ts**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要为所有废弃函数创建统一兼容文件 |
| 功能点 | 新建 `src/lib/canvas/deprecated.ts`，收集所有 @deprecated 函数，带 JSDoc 废弃标记 |
| 验收标准 | `expect(deprecatedItems.length).toBeGreaterThan(0)` + `expect(hasJSDocDeprecated).toBe(true)` |
| 页面集成 | 无 |
| 工时 | 0.5h |
| 依赖 | S1.4 |

**S3.3: DDD 文件确认**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要确认 DDD 相关文件不属于清理范围 |
| 功能点 | 审查 contextSlice.ts 和 modelSlice.ts，确认属于 DDD 系统，不删除 |
| 验收标准 | `expect(contextSliceIsDDD).toBe(true)` + `expect(modelSliceIsDDD).toBe(true)` |
| 页面集成 | 无 |
| 工时 | 1h |
| 依赖 | 无 |

#### DoD
- canvasHistoryStore.ts 已删除，无引用
- deprecated.ts 包含所有废弃函数
- contextSlice/modelSlice 确认保留

---

### Epic 4: Split stores 测试补全（P1）

#### Stories

**S4.1: contextStore 边界测试**
| 字段 | 内容 |
|------|------|
| Story | 作为 tester，我需要补充 contextStore 边界测试用例 |
| 功能点 | 测试 phase=undefined、异常节点等边界情况 |
| 验收标准 | `expect(coverage('contextStore')).toBeGreaterThanOrEqual(0.80)` |
| 页面集成 | 无 |
| 工时 | 1h |
| 依赖 | E1 |

**S4.2: flowStore cascadeUpdate 深度测试**
| 字段 | 内容 |
|------|------|
| Story | 作为 tester，我需要验证 flowStore cascadeUpdate 级联链路 |
| 功能点 | 测试 context→flow→component 级联链路，用例 ≥ 5 |
| 验收标准 | `expect(cascadeUpdateTests.length).toBeGreaterThanOrEqual(5)` |
| 页面集成 | 无 |
| 工时 | 1.5h |
| 依赖 | E1 |

**S4.3: uiStore panel expand 状态机**
| 字段 | 内容 |
|------|------|
| Story | 作为 tester，我需要测试 uiStore panel expand 全状态覆盖 |
| 功能点 | 测试 normal/expand-both/maximize 状态切换 |
| 验收标准 | `expect(panelExpandStatesCovered).toBe(3)` |
| 页面集成 | 无 |
| 工时 | 0.5h |
| 依赖 | E1 |

**S4.4: sessionStore SSE 重连测试**
| 字段 | 内容 |
|------|------|
| Story | 作为 tester，我需要测试 sessionStore SSE 重连后数据一致性 |
| 功能点 | 测试离线重连后消息队列完整性 |
| 验收标准 | `expect(messagesAfterReconnect.length).toBeGreaterThan(0)` |
| 页面集成 | 无 |
| 工时 | 1h |
| 依赖 | E1 |

**S4.5: 删除旧 canvasStore.test.ts**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我需要删除过时的 canvasStore 测试文件 |
| 功能点 | 删除 `canvasStore.test.ts`，验证 CI 覆盖率不下降 |
| 验收标准 | `expect(fileExists('canvasStore.test.ts')).toBe(false)` + `expect(totalCoverage).toBeGreaterThanOrEqual(0.70)` |
| 页面集成 | 无 |
| 工时 | 0.5h |
| 依赖 | S4.1 |

#### DoD
- contextStore 覆盖率 ≥ 80%
- cascadeUpdate 测试用例 ≥ 5
- 旧 canvasStore.test.ts 已删除
- 总覆盖率不下降

---

### Epic 5: Integration 测试（P1）

#### Stories

**S5.1: split stores 数据一致性测试**
| 字段 | 内容 |
|------|------|
| Story | 作为 tester，我需要验证多 store 同时更新后数据一致 |
| 功能点 | 新建 `src/__tests__/canvas/migration.test.ts` |
| 验收标准 | `expect(multiStoreConsistent).toBe(true)` |
| 页面集成 | 无 |
| 工时 | 1.5h |
| 依赖 | E2+E4 |

**S5.2: localStorage 持久化回归**
| 字段 | 内容 |
|------|------|
| Story | 作为 tester，我需要验证刷新页面后三树数据完整恢复 |
| 功能点 | 测试 persistence mock，刷新后数据完整 |
| 验收标准 | `expect(restoredData.contextNodes.length).toBeGreaterThan(0)` |
| 页面集成 | 无 |
| 工时 | 0.5h |
| 依赖 | S5.1 |

**S5.3: crossStoreSync 回归测试**
| 字段 | 内容 |
|------|------|
| Story | 作为 tester，我需要验证跨 store 订阅功能 |
| 功能点 | 新建 `src/__tests__/canvas/store-integration.test.ts` |
| 验收标准 | `expect(activeTreeSyncsCenterExpand).toBe(true)` |
| 页面集成 | 无 |
| 工时 | 0.5h |
| 依赖 | S1.2 |

**S5.4: E2E 全量回归**
| 字段 | 内容 |
|------|------|
| Story | 作为 tester，我需要验证 17 个 canvas E2E 测试通过率 |
| 功能点 | 运行完整 E2E 套件 |
| 验收标准 | `expect(e2ePassRate).toBeGreaterThanOrEqual(0.95)` |
| 页面集成 | 【需页面集成】CanvasPage.tsx |
| 工时 | 0.5h |
| 依赖 | S5.1+S5.2+S5.3 |

#### DoD
- migration.test.ts 和 store-integration.test.ts 存在且通过
- localStorage 持久化测试通过
- E2E 通过率 ≥ 95%

---

## 3. 验收标准汇总

| Epic | Story | 功能点 | expect() 断言 |
|------|-------|--------|--------------|
| E1 | S1.1 | 审查业务逻辑 | `businessLogicItems.length > 0` |
| E1 | S1.2 | crossStoreSync | `madgeIsCircular === false` |
| E1 | S1.3 | loadExampleData | `contextNodes.length > 0` |
| E1 | S1.4 | canvasStore 降级 | `lines < 50 && noBusinessLogic` |
| E2 | S2.1 | import 更新 | `noCanvasStoreImport && hasSplitStoreImport` |
| E2 | S2.2 | 回归测试 | `allTestsPassed` |
| E3 | S3.1 | 删除历史 store | `fileNotExists && grepCount === 0` |
| E3 | S3.2 | deprecated.ts | `deprecatedItems > 0` |
| E3 | S3.3 | DDD 文件确认 | `isDDD.contextSlice && isDDD.modelSlice` |
| E4 | S4.1 | contextStore 覆盖 | `coverage ≥ 80%` |
| E4 | S4.2 | cascadeUpdate 测试 | `testCases ≥ 5` |
| E4 | S4.3 | panel 状态覆盖 | `statesCovered === 3` |
| E4 | S4.4 | SSE 重连 | `messages.length > 0 after reconnect` |
| E4 | S4.5 | 删除旧测试 | `fileNotExists && coverage ≥ 70%` |
| E5 | S5.1 | 数据一致性 | `multiStoreConsistent === true` |
| E5 | S5.2 | 持久化 | `restoredData.length > 0` |
| E5 | S5.3 | 跨 store 订阅 | `syncWorks === true` |
| E5 | S5.4 | E2E 回归 | `passRate ≥ 95%` |

**合计**: 5 Epic，18 Story，38 条 expect() 断言

---

## 4. Sprint 排期

| Sprint | Epic | 工时 | 目标 |
|--------|------|------|------|
| Day 1 AM | E1 canvasStore 清理 | 4h | crossStoreSync + loadExampleData 就绪 |
| Day 1 PM | E2 CanvasPage 迁移 | 2h | import 全部更新 |
| Day 2 AM | E3 废弃 store 删除 | 2h | 死代码清理完毕 |
| Day 2 PM | E4 测试补全 | 5h | split stores 覆盖率 ≥ 80% |
| Day 3 | E5 Integration 测试 | 3h | migration.test.ts + E2E ≥ 95% |

---

## 5. 非功能需求

| 类别 | 要求 |
|------|------|
| 向后兼容 | canvasStore.ts 降级后仍可通过 import 访问 split stores |
| 架构约束 | 单向依赖：`componentStore → flowStore → contextStore`，禁止循环 |
| 类型安全 | 所有迁移文件符合 TypeScript 规范，无 `any` |
| 代码清洁 | 无 `console.log`，无废弃函数残留 |

---

## 6. 实施约束

- E1 必须先完成，E2/E3/E4 依赖其产出
- 删除 canvasHistoryStore 前必须全量 `grep` 确认无消费者
- E4 测试补全必须先于 E5-E2E 执行，确保覆盖率不因删除旧测试而下降
- 所有 Epic 独立 commit，便于回滚
