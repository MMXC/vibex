---
title: Sprint5 交付中心——多Store聚合与跨画布导航集成
date: 2026-04-18
category: docs/solutions/developer-experience
module: vibex
problem_type: developer_experience
component: frontend_stimulus
severity: medium
applies_when:
  - Sprint completion with multi-epic integration across data layer, navigation, and export
  - Frontend TypeScript/React codebase with store-based architecture
  - DDL generation workflow spanning prototype → delivery canvas
tags:
  - sprint-delivery
  - cross-canvas-navigation
  - ddl-generation
  - store-integration
  - frontend
  - type-script
related_components:
  - prototypeStore
  - DDSCanvasStore
  - deliveryStore
  - DDLGenerator
  - DeliveryNav
  - CanvasBreadcrumb
---

# Sprint5 交付中心——多Store聚合与跨画布导航集成

## Context

跨 Sprint 集成存在明显断层：各 Sprint 独立交付数据，但缺乏统一视图将 prototype、DDS、交付物串联起来。具体痛点：

- prototypeStore 和 DDSCanvasStore 的数据各自为政，无法形成端到端链路
- 没有统一的"交付中心"，用户需要在多个画布之间手动跳转、拼凑信息
- DDL 生成等下游能力缺失，导致设计成果无法直接转化为可执行交付物

这个 Sprint 作为 QA Sprint，目的不是交付新功能，而是**缝合已有能力**，构建统一的交付入口。

---

## Guidance

### 1. 多 Store 聚合模式（Multi-Store Aggregation）

```
prototypeStore + DDSCanvasStore → deliveryStore.loadFromStores()
```

核心思路：**不破坏现有 Store 的职责**，新增一个聚合层统一消费。deliveryStore 扮演"只读视图"角色，聚合多个源 Store 的数据，转换为统一格式供下游使用。

关键函数：
- `loadFromStores()` — 从多个源 Store 拉取数据，合并为 deliveryModel
- `toComponent()` / `toSchema()` / `toDDL()` — 不同出口格式的序列化函数

### 2. 跨画布导航模式（Cross-Canvas Navigation）

```
DeliveryNav (3-tab) + CanvasBreadcrumb (轨迹导航)
```

Navigation 组件负责横向切换（prototype / DDS / delivery），Breadcrumb 负责纵向定位（当前位置 + 路径追溯）。两者配合实现无缝跨画布体验，用户不会"迷路"。

### 3. 数据→交付物管道模式（Data-to-Deliverable Pipeline）

```
APIEndpointCard[] → DDLGenerator.generateDDL() → DDLTable[] → formatDDL() → SQL String
```

典型的 Transformer 流水线：每一步负责一次格式转换，单一职责，可测试，可组合。`DDLGenerator` 负责语义转换（OpenAPI schema → DDL schema），`formatDDL` 负责美化输出。

---

## Why This Matters

**统一数据层**是降低系统熵增的关键。Sprint 越多，独立 Store 越多，数据孤岛越严重。deliveryStore 作为聚合视图，将散落的数据拧成一股绳，使得：

- 跨画布状态一致（不会有"这个数据我刚从 prototype 改完，delivery 还没更新"的问题）
- 新能力（DDL 生成、文档导出）可以叠加在聚合层上，不需要逐个改造源 Store
- 测试容易入手：deliveryStore 12 个测试用例覆盖了所有聚合逻辑

**交付中心**将"创作"和"交付"分离。用户在前端画布专注设计，后端通过 deliveryStore 统一对外输出，不污染创作流程。

---

## When to Apply

**适用：**
- 两个以上 Store 需要共同驱动某个 UI 或导出功能
- 某类交付物（如 DDL、文档、配置文件）需要从多个数据源聚合生成
- 跨 Canvas/跨模块的导航体验需要统一路径管理
- 新 Sprint 的功能是对已有功能的"组合增强"而非"全新创作"

**不适用：**
- 单一 Store 能完整覆盖场景（强行聚合增加复杂度）
- 需要双向同步的场景（聚合层是单向只读，修改需要回到源 Store）
- 实时性要求极高的场景（聚合层有额外的 merge 开销）

---

## Examples

### 聚合层模式

```typescript
// deliveryStore.ts
async loadFromStores() {
  const [prototypes, ddsEndpoints] = await Promise.all([
    prototypeStore.getAll(),
    ddsCanvasStore.getEndpoints(),
  ]);
  this.model = { prototypes, ddsEndpoints, meta: this.buildMeta() };
}
```

### DDL 生成管道

```typescript
// DDLGenerator.ts
generateDDL(endpoints: APIEndpointCard[]): DDLTable[] {
  return endpoints.map(ep => ({
    tableName: ep.resource,
    columns: ep.schema.properties,
    constraints: ep.schema.required,
  }));
}

// formatDDL.ts
formatDDL(tables: DDLTable[]): string {
  return tables.map(t => `CREATE TABLE ${t.tableName} (...)`).join('\n\n');
}
```

### 跨画布导航

```tsx
// DeliveryNav.tsx — 3-tab 切换
const tabs = ['prototype', 'dds', 'delivery'];
```

---

## Prevention

- **多文件联动修改是静默失败高危区**（参考 `vibex-canvas-context-nav.md`）：跨 Store 聚合时，任何一个源 Store 的数据结构变更都可能静默破坏聚合逻辑。必须有单元测试覆盖每个聚合路径。
- **依赖链显式化**：E3 (DDL 生成) 依赖 Sprint4 的 `APIEndpointCard` 类型定义。跨 Sprint 依赖必须在文档中标注，否则类型漂移是静默杀手。
- **聚合 Store 保持只读**：deliveryStore 作为只读视图，任何写操作必须回到源 Store，避免双向同步的维护噩梦。

---

## Related

- `vibex-canvas-context-nav.md` — 跨画布导航的前置经验（DeliveryNav 扩展了 TabBar + PhaseIndicator 模式）
- `vibex-sprint2-spec-canvas/` — DDSCanvasStore 是 deliveryStore 的数据源
- `vibex-sprint4-qa/` — APIEndpointCard 类型验证，DDLGenerator 依赖此类型
- `vibex-sprint6-ai-coding-integration/` — 潜在正向依赖：AI Coding Agent 可消费 Delivery Center 的 DDL 输出
