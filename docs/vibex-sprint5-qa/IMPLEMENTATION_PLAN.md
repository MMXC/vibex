# Implementation Plan — vibex-sprint5-qa / design-architecture

**项目**: vibex-sprint5-qa
**角色**: Architect（实施计划）
**日期**: 2026-04-25
**上游**: architecture.md
**状态**: ✅ 设计完成

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: 数据流修复 | E1-U1 ~ E1-U2 | 0/2 | E1-U1 |
| E2: deliveryStore 聚合 | E2-U1 ~ E2-U2 | 0/2 | E2-U1 |
| E3: DDLGenerator | E3-U1 ~ E3-U2 | 0/2 | E3-U1 |

---

## E1: 数据流修复（P0）

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E1-U1 | loadMockData() 清理验证 | ⬜ | — | grep 结果为空；loadFromStores 被调用 |
| E1-U2 | delivery/page.tsx 5 Tab 真实数据 Playwright 验证 | ⬜ | E1-U1 | 5 Tab 全部不含 mock 字样 |

### E1-U1 详细说明

**目标**: 验证 `delivery/page.tsx` 不包含 `loadMockData` 调用。

**测试文件**: `tests/unit/grep/e1-data-flow-cleanup.test.ts`

**Test scenarios**:
- `grep "loadMockData" src/pages/delivery/page.tsx` → 结果为空
- `grep "loadFromStores" src/pages/delivery/page.tsx` → 结果非空

**Verification**: `pnpm vitest run tests/unit/grep/e1-data-flow-cleanup.test.ts` → 0 failures

---

### E1-U2 详细说明

**目标**: Playwright 验证 delivery/page.tsx 5 个 Tab 全部显示真实数据。

**测试文件**: `tests/e2e/sprint5-qa/E1-delivery-page.spec.ts`

**Test scenarios**:
- F1.2: dataSource === 'stores'（从 store 状态读取）
- F1.3: Context Tab 内容不含 "mock"
- F1.3: Flow Tab 内容不含 "mock"
- F1.3: Component Tab 内容不含 "mock"
- F1.3: PRD Tab 内容不含 "mock"
- F1.3: DDL Tab 内容不含 "mock"
- 所有 Tab 非空（nodes.length > 0 或等效数据存在）

**Verification**: `pnpm playwright test tests/e2e/sprint5-qa/E1-delivery-page.spec.ts` → 0 failures

---

## E2: deliveryStore 聚合逻辑（P0）

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E2-U1 | deliveryStore 聚合函数验证 | ⬜ | — | toComponent/toBoundedContext/toFlow/toSM 输出正确 |
| E2-U2 | loadFromStores 数据拉取验证 | ⬜ | E2-U1 | components.length > 0 |

### E2-U1 详细说明

**目标**: 验证 deliveryStore 聚合函数（toComponent/toBoundedContext/toFlow/toSM）。

**测试文件**: `tests/unit/stores/deliveryStore.test.ts`

**Test scenarios**:
- toComponent: ProtoNode → ComponentData，字段一一对应
- toBoundedContext: Chapter → BoundedContextData，id/name 正确
- toFlow: Edge → FlowData，source/target/type 正确
- toStateMachine: SMChapter → SMData，正确映射
- 空输入：空数组/空节点 → 空输出（不抛错）

**Verification**: `pnpm vitest run tests/unit/stores/deliveryStore.test.ts` → 0 failures

---

### E2-U2 详细说明

**目标**: 验证 `loadFromStores()` 正确从 prototypeStore + DDSCanvasStore 拉取数据。

**Test file**: `tests/unit/stores/deliveryStore.test.ts`（同 E2-U1）

**前置条件**: prototypeStore 必须有真实数据。

**Test scenarios**:
- 向 prototypeStore 注入 mock 数据（nodes/edges）
- 向 DDSCanvasStore 注入 mock 数据（chapters）
- 调用 `loadFromStores()`
- 验证 `deliveryStore.components.length > 0`
- 验证 `deliveryStore.boundedContexts.length > 0`

**Verification**: `pnpm vitest run tests/unit/stores/deliveryStore.test.ts` → 0 failures

---

## E3: DDLGenerator（P1）

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E3-U1 | DDLGenerator API 兼容性验证 | ⬜ | — | APIEndpointCard[] → DDLTable[] 转换正确 |
| E3-U2 | formatDDL 输出格式验证 | ⬜ | E3-U1 | 输出有效 CREATE TABLE SQL |

### E3-U1 详细说明

**目标**: 验证 DDLGenerator 与 Sprint4 APIEndpointCard 接口兼容。

**测试文件**: `tests/unit/services/DDLGenerator.test.ts`

**Test scenarios**:
- 空数组 → 空数组
- 单个 APIEndpointCard → DDLTable（tableName 非空，columns 非空）
- 多个 APIEndpointCard → 多个 DDLTable
- 嵌套 schema → 展平为列
- 无 requestBody → 空 columns

**Verification**: `pnpm vitest run tests/unit/services/DDLGenerator.test.ts` → 0 failures

---

### E3-U2 详细说明

**目标**: 验证 formatDDL 输出有效 SQL。

**测试文件**: `tests/e2e/sprint5-qa/E3-ddl-output.spec.ts`

**Test scenarios**:
- Ideal state: DDL Tab 显示 CREATE TABLE SQL
- SQL 包含正确的 table name
- SQL 包含正确的 column definitions
- 无语法错误

**Verification**: `pnpm playwright test tests/e2e/sprint5-qa/E3-ddl-output.spec.ts` → 0 failures

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint5-qa
- **执行日期**: 2026-04-25
- **备注**: E1 是 P0 阻断，E1-U1 grep 验证最先执行。E3 使用内联 mock 类型，不依赖 Sprint4 真实代码库。Unit 执行顺序：E1-U1 → E1-U2 → E2-U1 → E2-U2 → E3-U1 → E3-U2。

---

*计划时间: 2026-04-25 13:07 GMT+8*
