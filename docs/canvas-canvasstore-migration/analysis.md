# CanvasStore 迁移需求分析

**项目**: canvas-canvasstore-migration  
**角色**: Analyst  
**日期**: 2026-04-03  
**状态**: ✅ 分析完成

---

## 1. 业务场景分析

### 1.1 迁移背景

canvasStore.ts 原为 1451 行的巨型单体 Zustand store，涵盖 5 大职责域：

| 职责域 | 状态字段 | Actions |
|--------|---------|---------|
| 上下文树 | contextNodes, boundedGroups, boundedEdges | setContextNodes, confirmContextNode |
| 流程树 | flowNodes, steps, autoGenerateFlows | setFlowNodes, cascadeUpdate |
| 组件树 | componentNodes | setComponentNodes, generateComponents |
| UI 状态 | panels, expand, drag, drawers | setCenterExpand, togglePanel |
| 会话状态 | SSE, messages, queue, AI thinking | addMessage, setSSEStatus |

### 1.2 为何需要迁移

**问题一：状态更新链路不透明**  
单体 store 中 40+ 状态字段混在一起，修改任意字段都可能触发意外的 cross-store 副作用（如 UI 刷新、订阅触发）。开发者无法快速定位某个 action 影响的范围，修改风险极高。

**问题二：双重数据源维护负担**  
canvasStore 已完成 split 拆分（Phase 1-5 已实施），5 个 split stores 已在 `/src/lib/canvas/stores/` 下运行。但 canvasStore.ts 仍保留为 170 行兼容层，内部仍含业务逻辑和跨 store 订阅。两个数据源并存导致：

- **废弃 helper 函数**（`setContextNodes`、`setFlowNodes` 等）在 canvasStore 和 split stores 中各有一份
- **跨 store 订阅逻辑**写在 canvasStore 中，容易产生同步 bug
- **loadExampleData** 等初始化函数分散在两处

**问题三：import 路径混乱**  
CanvasPage.tsx 等组件同时从 split stores 导入 hook（`useContextStore`）又从 canvasStore 导入 helper 函数（`loadExampleData`、`setContextNodes`），造成同一文件的 import 引用两个数据源。

**问题四：废弃 store 残留**  
`/src/stores/canvasHistoryStore.ts`（20行）是旧版历史记录的桥接文件，仅做 `re-export`，已被 `/src/lib/canvas/historySlice.ts` 替代，无任何消费者，属死代码。

### 1.3 Zustand 版本说明

当前版本：**Zustand 4.5.7**

迁移**不涉及**版本升级，仅做架构重构（split → clean）。所有 split stores 均使用 Zustand 4.5.7 API（`create` + `persist` + `devtools` + `subscribe`），符合当前项目约束。

---

## 2. 文件迁移清单

### 2.1 Split Stores（已完成创建）

| 文件路径 | 行数 | 状态 | 说明 |
|---------|------|------|------|
| `src/lib/canvas/stores/contextStore.ts` | 234 | ✅ 已完成 | 上下文节点状态 |
| `src/lib/canvas/stores/flowStore.ts` | 267 | ✅ 已完成 | 流程节点 + cascadeUpdate |
| `src/lib/canvas/stores/componentStore.ts` | 119 | ✅ 已完成 | 组件节点状态 |
| `src/lib/canvas/stores/uiStore.ts` | 172 | ✅ 已完成 | UI 布局状态 |
| `src/lib/canvas/stores/sessionStore.ts` | 120 | ✅ 已完成 | SSE/消息队列 |
| `src/lib/canvas/stores/messageBridge.ts` | 16 | ✅ 已完成 | 消息桥接（解循环依赖） |
| `src/lib/canvas/stores/index.ts` | 15 | ✅ 已完成 | 统一 barrel 导出 |

### 2.2 清理对象（需处理的 14 个文件）

#### 2.2.1 核心 store 清理（1 文件）

| # | 文件路径 | 操作 | 说明 |
|---|---------|------|------|
| 1 | `src/lib/canvas/canvasStore.ts` | **重写** | 移除跨 store 订阅 + helper 函数，保留纯类型 re-export（< 50行） |

#### 2.2.2 消费者 import 更新（1 文件）

| # | 文件路径 | 操作 | 说明 |
|---|---------|------|------|
| 2 | `src/components/canvas/CanvasPage.tsx` | **修改 import** | 将 canvasStore 导入的 4 个 helper 函数迁移到 split stores |

#### 2.2.3 废弃 store 删除（1 文件）

| # | 文件路径 | 操作 | 说明 |
|---|---------|------|------|
| 3 | `src/stores/canvasHistoryStore.ts` | **删除** | 死代码，仅 re-export historySlice，无消费者 |

#### 2.2.4 Split Store 测试覆盖补全（6 文件）

| # | 文件路径 | 操作 | 说明 |
|---|---------|------|------|
| 4 | `src/lib/canvas/stores/contextStore.test.ts` | **补充** | 补充边界测试用例（coverage 目标 ≥ 80%） |
| 5 | `src/lib/canvas/stores/flowStore.test.ts` | **补充** | cascadeUpdate 深度测试 |
| 6 | `src/lib/canvas/stores/componentStore.test.ts` | **补充** | generateComponents 端到端测试 |
| 7 | `src/lib/canvas/stores/uiStore.test.ts` | **补充** | panel expand 状态机测试 |
| 8 | `src/lib/canvas/stores/sessionStore.test.ts` | **补充** | SSE 重连 + 消息队列测试 |
| 9 | `src/lib/canvas/canvasStore.test.ts` | **删除/替换** | 旧版 canvasStore 测试已过时，验证完成后删除 |

#### 2.2.5 跨 store 订阅重构（1 文件）

| # | 文件路径 | 操作 | 说明 |
|---|---------|------|------|
| 10 | `src/lib/canvas/crossStoreSync.ts` | **新建** | 将 canvasStore.ts 中的跨 store 订阅提取为独立模块 |

#### 2.2.6 loadExampleData 重构（1 文件）

| # | 文件路径 | 操作 | 说明 |
|---|---------|------|------|
| 11 | `src/lib/canvas/stores/loadExampleData.ts` | **新建** | 将 canvasStore.ts 中的 loadExampleData 提取为独立函数 |

#### 2.2.7 Deprecated exports 清理（1 文件）

| # | 文件路径 | 操作 | 说明 |
|---|---------|------|------|
| 12 | `src/lib/canvas/deprecated.ts` | **新建** | 收集所有 @deprecated helper，保留在兼容文件，标记废弃警告 |

#### 2.2.8 Integration Test（2 文件）

| # | 文件路径 | 操作 | 说明 |
|---|---------|------|------|
| 13 | `src/__tests__/canvas/migration.test.ts` | **新建** | 验证 split stores 数据一致性和 localStorage 持久化 |
| 14 | `src/__tests__/canvas/store-integration.test.ts` | **新建** | 跨 store 订阅功能回归测试 |

**文件统计**: 14 个文件操作（1 重写 + 1 修改 + 1 删除 + 6 测试 + 3 新建 + 2 新测试）

---

## 3. Epic 拆分

### Epic 1: canvasStore.ts 清理与兼容层降级
**工时**: 4h | **优先级**: P0

| 功能点 | Story | 工时 | 验收条件 |
|--------|-------|------|---------|
| E1-S1 | 审查 canvasStore 剩余业务逻辑 | 1h | 确认 cross-store 订阅 + helper 函数列表 |
| E1-S2 | 提取 crossStoreSync.ts | 1.5h | 订阅逻辑独立运行，无循环依赖 |
| E1-S3 | 提取 loadExampleData.ts | 0.5h | loadExampleData 功能与原来完全一致 |
| E1-S4 | canvasStore.ts 降级为纯类型 re-export（< 50行） | 1h | `wc -l canvasStore.ts < 50` |

### Epic 2: CanvasPage.tsx import 路径更新
**工时**: 2h | **优先级**: P0

| 功能点 | Story | 工时 | 验收条件 |
|--------|-------|------|---------|
| E2-S1 | 移除 canvasStore helper 导入，改用 split stores | 1.5h | `loadExampleData`、`setContextNodes` 等从 split stores 调用 |
| E2-S2 | 回归测试：三树增删改 + 示例加载 | 0.5h | 所有操作正常，无 console.error |

### Epic 3: 废弃 store 删除与死代码清理
**工时**: 2h | **优先级**: P1

| 功能点 | Story | 工时 | 验收条件 |
|--------|-------|------|---------|
| E3-S1 | 删除 `canvasHistoryStore.ts` | 0.5h | 文件删除，grep 无引用 |
| E3-S2 | 创建 deprecated.ts 收集废弃 exports | 0.5h | 保留所有 @deprecated 函数，带 JSDoc 废弃标记 |
| E3-S3 | 审查其余 /src/stores/ 下 canvas 相关死代码 | 1h | contextSlice.ts 和 modelSlice.ts 属于 DDD 系统，确认保留 |

### Epic 4: Split Stores 测试覆盖补全
**工时**: 5h | **优先级**: P1

| 功能点 | Story | 工时 | 验收条件 |
|--------|-------|------|---------|
| E4-S1 | contextStore 边界测试（phase=undefined/异常节点） | 1h | coverage ≥ 80% |
| E4-S2 | flowStore cascadeUpdate 深度测试 | 1.5h | 验证 context→flow→component 级联链路 |
| E4-S3 | uiStore panel expand 状态机 | 0.5h | 全状态覆盖 |
| E4-S4 | sessionStore SSE 重连 + 消息队列 | 1h | 离线重连后数据一致 |
| E4-S5 | 删除过时 canvasStore.test.ts | 0.5h | 无引用 |

### Epic 5: Integration 测试与回归验证
**工时**: 3h | **优先级**: P1

| 功能点 | Story | 工时 | 验收条件 |
|--------|-------|------|---------|
| E5-S1 | 编写 split stores 数据一致性测试 | 1.5h | 多 store 同时更新后数据一致 |
| E5-S2 | localStorage 持久化回归测试 | 0.5h | 刷新页面后三树数据完整恢复 |
| E5-S3 | crossStoreSync 回归测试 | 0.5h | activeTree 切换时 centerExpand 同步 |
| E5-S4 | E2E 完整回归（17 个 canvas E2E 测试） | 0.5h | pass rate ≥ 95% |

---

## 4. 工时估算

| Epic | Story 数 | 工时 |
|------|---------|------|
| Epic 1: canvasStore 清理 | 4 | 4h |
| Epic 2: CanvasPage 迁移 | 2 | 2h |
| Epic 3: 废弃 store 删除 | 3 | 2h |
| Epic 4: 测试覆盖 | 5 | 5h |
| Epic 5: Integration 测试 | 4 | 3h |
| **总计** | **18** | **16h** |

> 估算依据：Phase 1-5 split stores 已完成主体逻辑（Phase 1-5 合计 19.25 天已在 vibex-canvasstore-refactor 中实施），本任务为收尾清理工，故总工时压缩至 16h。

---

## 5. 验收标准

### Epic 1: canvasStore 清理
- [ ] `canvasStore.ts` 行数 < 50（纯类型 re-export）
- [ ] `crossStoreSync.ts` 独立文件存在，无循环依赖（`madge --circular src/lib/canvas/` 通过）
- [ ] `loadExampleData.ts` 功能验证：加载示例数据后三树均有节点，phase 推进到 'context'
- [ ] canvasStore.ts 中无 `setState`、`dispatch`、`createSlice` 等业务逻辑关键字

### Epic 2: CanvasPage import 迁移
- [ ] CanvasPage.tsx 中无 `from '@/lib/canvas/canvasStore'` 导入
- [ ] `loadExampleData` 从新模块调用，三树渲染正常
- [ ] `setContextNodes`/`setFlowNodes`/`setComponentNodes` 从对应 split store 调用
- [ ] TypeScript 编译无错误

### Epic 3: 废弃 store 删除
- [ ] `/src/stores/canvasHistoryStore.ts` 已删除
- [ ] `grep -r "canvasHistoryStore" src/` 无结果
- [ ] `deprecated.ts` 包含所有 @deprecated 函数，带 JSDoc 警告
- [ ] `/src/stores/contextSlice.ts` 和 `modelSlice.ts` 确认属于 DDD 系统，不删除

### Epic 4: 测试覆盖
- [ ] contextStore coverage ≥ 80%（`npm test -- --coverage --testPathPattern=contextStore`）
- [ ] flowStore cascadeUpdate 测试用例 ≥ 5
- [ ] sessionStore SSE 重连测试存在
- [ ] 旧 canvasStore.test.ts 删除或标记为 skip

### Epic 5: Integration 测试
- [ ] `migration.test.ts` 存在，验证 split stores 数据一致性
- [ ] `store-integration.test.ts` 存在，验证跨 store 订阅
- [ ] localStorage 刷新后三树数据完整（persistence 测试）
- [ ] E2E 测试通过率 ≥ 95%（`npm run e2e`）

---

## 6. 风险识别

### 高风险 ⚠️

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| **crossStoreSync 订阅逻辑丢失** | 中 | 高 | Epic 1-S2 提取后立即运行 E2E 三树切换测试 |
| **loadExampleData 数据源切换后节点不渲染** | 中 | 高 | Epic 2-S2 覆盖所有树加载路径 |
| **旧 canvasStore.test.ts 删除后 CI 覆盖率下降** | 中 | 中 | Epic 4-S5 前先补充 split store 测试覆盖率 |

### 中风险 ⚡

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| **canvasHistoryStore 删除后有隐藏消费者** | 低 | 中 | grep 全量搜索 + 人工审查 stores/index.ts |
| **split stores 测试覆盖率不达标（< 80%）** | 中 | 中 | Epic 4 优先补充低 coverage 的 store |

### 低风险 ℹ️

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| contextSlice/modelSlice 被误判为死代码删除 | 低 | 低 | 已确认属于 DDD 系统（bounded context、domain model 页面） |
| Zustand 4.5.7 API 兼容性 | 低 | 低 | split stores 已使用相同 API 稳定运行 |

---

## 7. 技术备注

### 7.1 关键约束

- **向后兼容**: `canvasStore.ts` 降级后仍可通过 `import { useCanvasStore }` 访问 `useContextStore`
- **单向依赖**: `componentStore → flowStore → contextStore`，禁止循环依赖
- **无 any 类型**: 所有迁移文件须符合项目 TypeScript 规范
- **无 console.log**: 测试文件和业务代码禁止 console.log

### 7.2 关键文件路径汇总

```
待清理（迁移终点）:
  src/lib/canvas/canvasStore.ts          ← 重写为 < 50 行
  src/components/canvas/CanvasPage.tsx   ← 移除 canvasStore 导入

待新增:
  src/lib/canvas/crossStoreSync.ts       ← 跨 store 订阅
  src/lib/canvas/loadExampleData.ts      ← 初始化函数
  src/lib/canvas/deprecated.ts           ← 废弃兼容层
  src/__tests__/canvas/migration.test.ts
  src/__tests__/canvas/store-integration.test.ts

待删除:
  src/stores/canvasHistoryStore.ts       ← 死代码

已就绪（无需改动）:
  src/lib/canvas/stores/contextStore.ts
  src/lib/canvas/stores/flowStore.ts
  src/lib/canvas/stores/componentStore.ts
  src/lib/canvas/stores/uiStore.ts
  src/lib/canvas/stores/sessionStore.ts
  src/lib/canvas/stores/messageBridge.ts
  src/lib/canvas/stores/index.ts
  src/lib/canvas/historySlice.ts
```

### 7.3 DDD Store 说明（不属于本任务范围）

以下文件属于 DDD（Domain-Driven Design）子系统的独立 store，与 canvas store 拆分**无关**，必须保留：

- `/src/stores/contextSlice.ts` — DDD bounded contexts 状态
- `/src/stores/modelSlice.ts` — DDD domain models 状态
- `/src/stores/ddd/` — DDD 中间件和初始化

---

*本分析由 Analyst agent 自动生成。*
