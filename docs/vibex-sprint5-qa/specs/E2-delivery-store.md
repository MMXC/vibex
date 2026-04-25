# Spec — E2: deliveryStore 聚合逻辑四态

**文件**: `specs/E2-delivery-store.md`
**Epic**: E2 deliveryStore 聚合逻辑验证
**基于**: PRD vibex-sprint5-qa § E2

---

## 组件描述

deliveryStore.ts 交付聚合 Store。只读视图，从 prototypeStore + DDSCanvasStore 拉取数据，转换为交付物格式。

---

## 四态定义

### 1. 理想态（Ideal）

**触发条件**: loadFromStores() 成功，store 包含 components / boundedContexts / flows / stateMachines

**State**:
```typescript
{
  components: Component[]      // 从 prototypeStore.nodes 转换
  boundedContexts: BoundedContext[]  // 从 DDSCanvasStore.chapters.context 转换
  flows: Flow[]               // 从 DDSCanvasStore.chapters.flow 转换
  stateMachines: StateMachine[] // 从 DDSCanvasStore.chapters.stateMachine 转换
  dataSource: 'stores'        // ← 关键：标识真实数据源
  lastUpdated: timestamp
}
```

---

### 2. 空状态（Empty）

**触发条件**: 源 store 为空，返回空数组

**State**:
```typescript
{
  components: []
  boundedContexts: []
  flows: []
  stateMachines: []
  dataSource: 'stores'
}
```

---

### 3. 加载态（Loading）

**触发条件**: loadFromStores() 执行中

**State**:
```typescript
{
  components: []
  boundedContexts: []
  flows: []
  stateMachines: []
  dataSource: 'loading'  // ← 加载中标识
}
```

---

### 4. 错误态（Error）

**触发条件**: loadFromStores() 失败

**State**:
```typescript
{
  components: []
  boundedContexts: []
  flows: []
  stateMachines: []
  dataSource: 'error'
  error: { message: string, code: string }
}
```

---

## 转换函数验证

| 函数 | 输入 | 输出 | 验证 |
|------|------|------|------|
| `toComponent(node)` | prototypeStore.nodes[] | Component[] | `expect(toComponent(node).id).toBeDefined()` |
| `toBoundedContext(chapter)` | chapters.context | BoundedContext[] | `expect(ctx.name).toBeDefined()` |
| `toFlow(chapter)` | chapters.flow | Flow[] | `expect(flow.edges.length).toBeGreaterThanOrEqual(0)` |
| `toStateMachine(chapter)` | chapters.stateMachine | StateMachine[] | `expect(sm.states.length).toBeGreaterThanOrEqual(0)` |
