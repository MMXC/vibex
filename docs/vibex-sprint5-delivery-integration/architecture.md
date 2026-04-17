# Architecture — vibex-sprint5-delivery-integration

**项目**: vibex-sprint5-delivery-integration
**版本**: v1.0
**日期**: 2026-04-18
**角色**: Architect
**上游**: prd.md, specs/E1-E3, analysis.md

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint5-delivery-integration
- **执行日期**: 2026-04-18

---

## 0. Sprint5 上下文：三个画布的集成

```
Sprint1: ProtoEditor (原型画布)
  → prototypeStore: nodes/edges/pages/mockData
  → 输出: 原型数据

Sprint2+Sprint4: DDSCanvas (详设画布)
  → DDSCanvasStore: chapters[requirement/context/flow/api/businessRules]
  → 输出: OpenAPI (Sprint4), StateMachine JSON (Sprint4)

Sprint5: DeliveryCenter (交付中心) ← 本期
  → 集成 Sprint1 + Sprint2/4 的数据
  → 生成 DDL（数据库 schema）
  → 跨画布导航
```

---

## 1. Tech Stack

| 层 | 技术 | 版本 | 选型理由 |
|----|------|------|---------|
| 前端框架 | Next.js | 16 | 项目基准 |
| 语言 | TypeScript | 5.x | 类型安全 |
| 状态管理 | Zustand | latest | deliveryStore/prototypeStore/DDSCanvasStore 均已使用 |
| 测试 | Vitest + Testing Library | — | 项目基准 |
| DDL 生成 | 自定义 + Sprint4 OpenAPI | — | 基于 API Endpoint 生成 SQL DDL |
| 跨画布通信 | Zustand selector | — | 轻量，不引入 EventEmitter |

**无新增核心依赖** — 所有功能基于现有 store + Sprint4 OpenAPIGenerator。

---

## 2. Architecture Diagram

```mermaid
flowchart TB
    subgraph Canvas1["Sprint1: ProtoEditor"]
        PS[prototypeStore<br/>nodes/edges/pages/mockData]
    end

    subgraph Canvas2["Sprint2+Sprint4: DDSCanvas"]
        DCS[DDSCanvasStore<br/>chapters[req/ctx/flow/api/br]]
    end

    subgraph Canvas3["Sprint5: DeliveryCenter"]
        DC[DeliveryCenterPage<br/>统一交付视图]
    end

    subgraph DataLayer["数据转换层 (新建)"]
        TC[toComponent<br/>proto → delivery]
        TBC[toBoundedContext<br/>DDS context → delivery]
        TBF[toBusinessFlow<br/>DDS flow → delivery]
        TSM[toStateMachine<br/>DDS businessRules → delivery]
    end

    subgraph ExportLayer["导出层"]
        DDG[DDLGenerator<br/>API Endpoint → SQL DDL]
        OAE[OpenAPIGenerator<br/>API → OpenAPI JSON]
        SMOE[SMExporter<br/>StateMachine → JSON]
    end

    PS -->|getExportData| TC
    DCS -->|chapters.context| TBC
    DCS -->|chapters.flow| TBF
    DCS -->|chapters.businessRules| TSM
    DCS -->|chapters.api| DDG
    TC --> DC
    TBC --> DC
    TBF --> DC
    TSM --> DC
    DDG --> OAE
    TSM --> SMOE
```

**布局约束**: DeliveryCenter 使用与 ProtoEditor/DDSCanvas 相似的 3 栏布局（左侧 Tab 导航 / 中部内容区 / 右侧详情区）

---

## 3. 数据模型

### 3.1 现有 DeliveryCenter 数据模型（当前 mock）

```typescript
// deliveryStore.ts — 当前使用 mock 数据
interface DeliveryContext { id, name, description }
interface BusinessFlow { id, name, steps }
interface DeliveryComponent { id, name, type, props }
interface PRDDocument { id, title, sections }
```

### 3.2 Sprint5 数据流

```
prototypeStore.getExportData()  → toComponent()  → deliveryStore.components
DDSCanvasStore.chapters.context → toBoundedContext() → deliveryStore.contexts
DDSCanvasStore.chapters.flow   → toBusinessFlow()  → deliveryStore.flows
DDSCanvasStore.chapters.api    → DDLGenerator       → deliveryStore.ddl
DDSCanvasStore.chapters.businessRules → toStateMachine() → deliveryStore.stateMachines
```

### 3.3 DDLGenerator 核心接口

```typescript
// src/lib/delivery/DDLGenerator.ts (新建)

import { exportToOpenAPI } from '@/lib/contract/APICanvasExporter';

export interface DDLOptions {
  databaseType: 'mysql' | 'postgresql' | 'sqlite';  // 默认 mysql
  tablePrefix?: string;  // 默认 'vibex_'
}

export interface DDLTable {
  tableName: string;
  columns: DDLColumn[];
  primaryKey?: string;
}

export interface DDLColumn {
  name: string;
  type: string;  // mysql 类型
  nullable: boolean;
  default?: string;
  comment?: string;
}

/**
 * 从 API Endpoint 生成 DDL
 * 输入: APIEndpointCard[] (来自 DDSCanvasStore.chapters.api)
 * 输出: DDLTable[]
 *
 * 规则:
 * - path: /api/users → 表名 users
 * - path: /api/users/{id}/posts → posts (嵌套资源展平)
 * - GET → 查询操作，不生成写字段
 * - POST → 可能生成 create 字段
 * - method → 注释标注，不直接映射到列类型
 */
export function generateDDL(
  apiCards: APIEndpointCard[],
  options?: DDLOptions
): DDLTable[];
```

### 3.4 数据转换函数

```typescript
// src/lib/delivery/toComponent.ts
import type { ProtoNode } from '@/stores/prototypeStore';
import type { DeliveryComponent } from '@/stores/deliveryStore';

export function toComponent(protoNode: ProtoNode): DeliveryComponent {
  return {
    id: protoNode.id,
    name: protoNode.data.component?.name ?? protoNode.type,
    type: 'component',
    props: protoNode.data.component?.props ?? {},
  };
}

// src/lib/delivery/toBoundedContext.ts
export function toBoundedContext(card: BoundedContextCard): DeliveryContext {
  return {
    id: card.id,
    name: card.name,
    description: card.description ?? '',
  };
}

// src/lib/delivery/toBusinessFlow.ts
export function toBusinessFlow(card: FlowStepCard): BusinessFlow {
  return {
    id: card.id,
    name: card.name,
    steps: (card as any).steps ?? [],
  };
}

// src/lib/delivery/toStateMachine.ts
export function toStateMachine(
  cards: StateMachineCard[],
  edges: DDSEdge[]
): DeliveryStateMachine {
  const initial = cards.find(c => c.stateType === 'initial')?.stateId;
  return {
    initial,
    states: Object.fromEntries(cards.map(c => [c.stateId, c])),
    transitions: edges.map(e => ({ from: e.source, to: e.target, label: e.label })),
  };
}
```

---

## 4. Module Breakdown

### 4.1 新增文件

| 文件 | 职责 | 依赖 |
|------|------|------|
| `lib/delivery/toComponent.ts` | ProtoNode → DeliveryComponent | prototypeStore |
| `lib/delivery/toBoundedContext.ts` | BoundedContextCard → DeliveryContext | DDSCanvasStore |
| `lib/delivery/toBusinessFlow.ts` | FlowStepCard → BusinessFlow | DDSCanvasStore |
| `lib/delivery/toStateMachine.ts` | StateMachineCard[] → DeliveryStateMachine | DDSCanvasStore |
| `lib/delivery/DDLGenerator.ts` | APIEndpointCard[] → DDLTable[] | APICanvasExporter (Sprint4) |
| `lib/delivery/formatDDL.ts` | DDLTable[] → 格式化 SQL 字符串 | DDLGenerator |
| `stores/deliveryStore.ts` | 重构 loadMockData 使用真实数据 | 所有转换函数 |
| `components/delivery/DeliveryNav.tsx` | 三画布导航组件（新建/复用） | — |
| `app/canvas/delivery/page.tsx` | 扩展支持新的 Tab（DDL/StateMachine） | deliveryStore |

### 4.2 修改文件

| 文件 | 修改内容 |
|------|---------|
| `stores/deliveryStore.ts` | loadMockData 重构、DeliveryTab 扩展 |
| `app/canvas/delivery/page.tsx` | DDL Tab 视图、StateMachine Tab 视图 |

### 4.3 数据流

```
deliveryStore.loadMockData()
  → usePrototypeStore.getState().getExportData()
    → prototypeData.nodes.forEach(toComponent)
      → deliveryStore.components

  → useDDSCanvasStore.getState()
    → chapters.context.cards.forEach(toBoundedContext)
      → deliveryStore.contexts
    → chapters.flow.cards.forEach(toBusinessFlow)
      → deliveryStore.flows
    → chapters.api.cards (DDLGenerator → DDLTable[])
      → deliveryStore.ddl
    → chapters.businessRules (toStateMachine)
      → deliveryStore.stateMachines
```

---

## 5. API Definitions

### 5.1 deliveryStore 扩展

```typescript
// src/stores/deliveryStore.ts — 扩展接口

export interface DeliveryStoreState {
  // 扩展现有字段
  contexts: DeliveryContext[];
  flows: BusinessFlow[];
  components: DeliveryComponent[];

  // 新增字段（E1）
  stateMachines: DeliveryStateMachine[];

  // 新增字段（E3）
  ddl: DDLTable[];

  // 扩展 loadMockData（真实数据）
  loadMockData: () => Promise<void>;

  // 新增（E2）
  crossCanvasNavigate: (canvas: 'prototype' | 'dds' | 'delivery') => void;
}

export interface DeliveryStateMachine {
  initial?: string;
  states: Record<string, StateMachineCard>;
  transitions: Array<{ from: string; to: string; label?: string }>;
}
```

### 5.2 DDLGenerator API

```typescript
// src/lib/delivery/DDLGenerator.ts
export function generateDDL(
  apiCards: APIEndpointCard[],
  options?: Partial<DDLOptions>
): DDLTable[] {
  // 1. 从 path 提取表名
  // 2. 按 HTTP 方法分组
  // 3. 推断列类型（基础推断，不做复杂推断）
  // 4. 返回 DDLTable[]
}

export function formatDDL(tables: DDLTable[], dbType: DatabaseType = 'mysql'): string {
  // 生成 CREATE TABLE SQL
}

export function downloadDDL(tables: DDLTable[], filename: string): void {
  const sql = formatDDL(tables);
  const blob = new Blob([sql], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  // 触发下载
}
```

---

## 6. Key Design Decisions

### 6.1 Mock → 真实数据迁移（方案A）

| 方案 | 描述 | 决策 |
|------|------|------|
| **A** | 重构 `loadMockData`，从 prototypeStore + DDSCanvasStore 拉取真实数据 | ✅ 已采纳 |
| B | 保留 mock，新增 `loadRealData` 切换 | 冗余，不采纳 |
| C | 迁移 deliveryStore 到独立的数据聚合服务 | 过度设计 |

**理由**: deliveryStore 的职责就是聚合展示层数据，从 mock 切换到真实数据是最小改动路径。

### 6.2 DDL 推断策略（方案A：基础推断）

| 方案 | 描述 | 决策 |
|------|------|------|
| **A** | 基础推断（path → 表名，method → 注释），不做复杂类型推断 | ✅ MVP 采纳 |
| B | 从 requestSchema JSON Schema 推断列类型 | P2 迭代 |
| C | 用户手动配置列映射 | P2 迭代 |

**理由**: MVP 聚焦在"集成"而非"智能推断"。用户导出后自行调整 DDL 是合理预期。

### 6.3 跨画布导航策略（方案A：Tab 导航）

| 方案 | 描述 | 决策 |
|------|------|------|
| **A** | DeliveryCenter 左侧 Tab 切换：Contexts / Flows / Components / PRD / DDL | ✅ 已采纳 |
| B | 全局侧边栏导航三画布 | 需改 layout，影响大 |
| C | 每个画布顶部面包屑链接其他画布 | 分散，不统一 |

---

## 7. Risk Assessment

| 风险 | 等级 | 描述 | 缓解 |
|------|------|------|---------|
| Sprint4 api 章节未实现 | P0 | DDLGenerator 依赖 APIEndpointCard[]，Sprint4 未实现则无法生成 DDL | E3 在 Sprint4 实现完成后执行，或提供 mock 数据降级 |
| prototypeStore 初始化时序 | P1 | DeliveryCenter 先于 prototypeStore 初始化时拉不到数据 | useEffect + 条件判断，数据未就绪时显示 Loading |
| DDSCanvasStore 跨域访问 | P1 | 三个 store 在不同模块，访问模式需统一 | deliveryStore 内部使用 selector，不直接修改其他 store |
| DDL 推断准确率低 | P1 | 基础推断可能生成不准确的 DDL | 导出为 .sql 文件而非直接执行，明确说明为草稿 |
| Sprint4 未完成导致 blocked | P1 | E3 依赖 Sprint4 的 API 章节 | E1/E2 可独立执行，E3 标记 blocked 直到 Sprint4 完成 |

**最高优先级**: Sprint4 依赖 — E3 需要等待 Sprint4 实现。

---

## 8. Testing Strategy

### 8.1 测试框架

- **框架**: Vitest + Testing Library
- **测试位置**: `src/lib/delivery/__tests__/`, `src/stores/deliveryStore.test.ts`

### 8.2 核心测试用例

#### 数据转换函数
```typescript
// toComponent.test.ts
test('toComponent: ProtoNode 转换为 DeliveryComponent', () => {
  const protoNode = { id: 'n1', type: 'protoNode', data: { component: { name: 'Button' } }, position: { x: 0, y: 0 } };
  const result = toComponent(protoNode as ProtoNode);
  expect(result.id).toBe('n1');
  expect(result.name).toBe('Button');
  expect(result.type).toBe('component');
});

// toBoundedContext.test.ts
test('toBoundedContext: BoundedContextCard 转换', () => {
  const card = { id: 'c1', type: 'bounded-context', name: '订单上下文', description: '订单相关' } as BoundedContextCard;
  const result = toBoundedContext(card);
  expect(result.id).toBe('c1');
  expect(result.name).toBe('订单上下文');
});
```

#### DDLGenerator
```typescript
// DDLGenerator.test.ts
test('generateDDL: /api/users → users 表', () => {
  const cards = [{ id: 'a1', path: '/api/users', method: 'get', summary: '获取用户' }] as APIEndpointCard[];
  const tables = generateDDL(cards);
  expect(tables).toHaveLength(1);
  expect(tables[0].tableName).toBe('users');
  expect(tables[0].columns).toBeDefined();
});

test('generateDDL: 空数组', () => {
  expect(generateDDL([])).toEqual([]);
});

test('formatDDL: 生成 MySQL CREATE TABLE', () => {
  const tables: DDLTable[] = [{ tableName: 'users', columns: [{ name: 'id', type: 'INT', nullable: false }] }];
  const sql = formatDDL(tables, 'mysql');
  expect(sql).toContain('CREATE TABLE');
  expect(sql).toContain('`users`');
});
```

### 8.3 测试命令

```bash
pnpm vitest run src/lib/delivery/__tests__/
pnpm vitest run src/stores/deliveryStore.test.ts
```

---

## 9. Epic 依赖关系

```
E1: 数据层集成
  T1: deliveryStore 重构 loadMockData → 依赖 prototypeStore (Sprint1)
  T2: toComponent/toBoundedContext/toBusinessFlow → 无外部依赖
  T3: 集成测试（三个 store 数据聚合）→ 依赖 T1+T2

E2: 跨画布导航
  T4: DeliveryNav 组件 → 依赖 E1
  T5: 面包屑导航 → 依赖 T4

E3: DDL 生成
  T6: DDLGenerator → 依赖 Sprint4 (api 章节)
  T7: formatDDL / downloadDDL → 依赖 T6
  ⚠️ T6/T7 BLOCKED: 等待 Sprint4 api 章节实现
```

---

## 10. Out of Scope

- DDL 智能推断（复杂 Schema 类型映射）
- 跨画布状态同步（双向修改）
- DDL 直接执行（只生成 .sql 文件）
- StateMachine 可视化编辑器
- PRD 自动生成
