# Implementation Plan — vibex-sprint5-delivery-integration

**项目**: vibex-sprint5-delivery-integration
**版本**: v1.0
**日期**: 2026-04-18
**角色**: Architect
**上游**: prd.md, architecture.md

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: 数据层集成 | T1-T3 | 3/3 ✅ | T1 |
| E2: 跨画布导航 | T4-T5 | 0/2 | T4 |
| E3: DDL 生成 | T6-T7 | ⬜ | BLOCKED |

**⚠️ E3 BLOCKED**: 依赖 Sprint4 `api` 章节实现（Sprint4 的 APIEndpointCard 类型和 APICanvasExporter）

---

## E1: 数据层集成

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| T1 | deliveryStore 重构 loadMockData | ⬜ | — | loadMockData 从 prototypeStore + DDSCanvasStore 拉取真实数据 |
| T2 | 数据转换函数 | ⬜ | — | toComponent / toBoundedContext / toBusinessFlow 正确转换 |
| T3 | 集成测试 | ⬜ | T1, T2 | deliveryStore 包含来自三个 store 的真实数据 |

### T1: deliveryStore 重构 loadMockData

**文件**: `src/stores/deliveryStore.ts`

**实现步骤**:
1. 导入 `usePrototypeStore` 和 `useDDSCanvasStore`
2. 重构 `loadMockData` 为 `loadFromStores`：
   - 从 `usePrototypeStore.getState().getExportData()` 获取 nodes
   - 从 `useDDSCanvasStore.getState().chapters` 获取各章节数据
3. 数据转换（调用 T2 的函数）
4. 设置 loading/error 状态
5. 原 mock 数据保留作为 fallback

**风险**: P1 — store 初始化时序问题，需确保数据就绪后才渲染

**验收**:
- AC1: `loadFromStores()` 执行后 `deliveryStore.contexts` 来自 `DDSCanvasStore.chapters.context`
- AC2: `deliveryStore.components` 来自 `prototypeStore.getExportData().nodes`
- AC3: `deliveryStore.flows` 来自 `DDSCanvasStore.chapters.flow`

---

### T2: 数据转换函数

**文件**: `src/lib/delivery/toComponent.ts`, `toBoundedContext.ts`, `toBusinessFlow.ts`, `toStateMachine.ts`（新建）

**实现步骤**:
1. 创建 `src/lib/delivery/` 目录
2. 实现 `toComponent()`：ProtoNode → DeliveryComponent
3. 实现 `toBoundedContext()`：BoundedContextCard → DeliveryContext
4. 实现 `toBusinessFlow()`：FlowStepCard → BusinessFlow
5. 实现 `toStateMachine()`：StateMachineCard[] → DeliveryStateMachine

**风险**: 无

**验收**:
- AC1: `toComponent({ id: 'n1', data: { component: { name: 'Button' } } })` → `{ id: 'n1', name: 'Button', type: 'component' }`
- AC2: `toBoundedContext(card)` 保留 id/name/description
- AC3: `toBusinessFlow(card)` 保留 id/name
- AC4: `toStateMachine([initialNode], edges)` 包含 initial 和 transitions

---

### T3: 集成测试

**文件**: `src/stores/deliveryStore.test.ts`（扩展）

**实现步骤**:
1. Mock `usePrototypeStore` 和 `useDDSCanvasStore`
2. 添加测试用例覆盖 T1 的数据拉取路径
3. 验证 fallback 逻辑（store 未初始化时使用 mock 数据）

**风险**: 无

**验收**:
- AC1: `loadFromStores` 使用真实 store 数据
- AC2: store 未初始化时 fallback 到 mock 数据

---

## E2: 跨画布导航

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| T4 | DeliveryNav 组件 | ⬜ | E1 | DeliveryCenter 顶部显示三画布导航 Tab |
| T5 | 面包屑导航 | ⬜ | T4 | 每个画布顶部显示面包屑链接 |

### T4: DeliveryNav 组件

**文件**: `src/components/delivery/DeliveryNav.tsx`（新建）

**实现步骤**:
1. 创建 DeliveryNav 组件
2. 三个 NavLink：原型画布 / 详设画布 / 交付中心
3. 当前画布高亮（active 样式）
4. 复用现有 NavLink 样式

**风险**: 无

**验收**:
- AC1: 三个画布链接正确（/prototype/editor, /dds/canvas, /canvas/delivery）
- AC2: 当前画布高亮可见

---

### T5: 面包屑导航

**文件**: `src/components/delivery/DeliveryNav.tsx`（扩展）

**实现步骤**:
1. 在每个画布顶部添加面包屑
2. 显示：交付中心 > [当前 Tab]
3. 链接回到 DeliveryCenter

**风险**: 无

**验收**:
- AC1: 面包屑显示当前 Tab 名称
- AC2: 点击 "交付中心" 链接回到 DeliveryCenter

---

## E3: DDL 生成（⚠️ BLOCKED）

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| T6 | DDLGenerator | ⬜ | Sprint4 api 章节 | `generateDDL(apiCards)` 返回 DDLTable[] |
| T7 | formatDDL / downloadDDL | ⬜ | T6 | 生成 MySQL SQL 文件，支持下载 |

### T6: DDLGenerator（⚠️ BLOCKED）

**文件**: `src/lib/delivery/DDLGenerator.ts`（新建）

**前置条件**: Sprint4 `APIEndpointCard` 类型 + `APICanvasExporter` 已实现

**实现步骤**:
1. 创建 `src/lib/delivery/DDLGenerator.ts`
2. `generateDDL(apiCards, options)` 函数
3. path → 表名映射逻辑
4. method → 注释标注
5. 基础类型推断（string → VARCHAR(255), number → INT）

**风险**: P1 — 推断准确率低，明确说明为草稿

**验收**:
- AC1: `/api/users` → `{ tableName: 'users', columns: [...] }`
- AC2: 空数组 → `[]`
- AC3: 导出 `downloadDDL()` 可触发文件下载

---

### T7: formatDDL / downloadDDL（⚠️ BLOCKED）

**文件**: `src/lib/delivery/formatDDL.ts`（新建）

**前置条件**: T6

**实现步骤**:
1. `formatDDL(tables, dbType)` 生成 MySQL/PostgreSQL 格式
2. `downloadDDL(tables, filename)` 触发浏览器下载
3. DeliveryCenter 添加 DDL Tab 视图

**风险**: 无

**验收**:
- AC1: `formatDDL([table])` 生成 `CREATE TABLE` SQL
- AC2: 点击下载生成 `.sql` 文件

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint5-delivery-integration
- **执行日期**: 2026-04-18
- **备注**: E3 (DDL 生成) BLOCKED — 等待 Sprint4 api 章节实现
