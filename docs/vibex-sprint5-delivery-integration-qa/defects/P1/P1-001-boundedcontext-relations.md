# P1-001: BoundedContext 多余 relations 字段

**严重性**: P1（影响功能）
**Epic**: E1
**Spec 引用**: specs/E1-data-integration.md

## 问题描述
- **Spec E1**: `BoundedContext` 接口应无 `relations` 字段
- **实际**: `deliveryStore.ts` 第 285 行赋值 `relations: []`
- **类型定义**: `BoundedContext` 接口无 `relations` 字段，但赋值处有 → TypeScript 可能报类型错误

## 代码证据

```typescript
// src/stores/deliveryStore.ts 第 281-287 行
const contexts: BoundedContext[] = contextCards.map((card) => ({
  id: card.id,
  name: card.title ?? '',
  description: card.description ?? '',
  nodeCount: 0,
  relationCount: 0,
  relations: [],  // ⚠️ 多余：DDS context cards 无此字段
}));

// 验证 types 中无 relations
$ grep -A 10 "interface BoundedContext" /root/.openclaw/vibex/vibex-fronted/src/stores/deliveryStore.ts
# relations 字段不存在于接口定义
```

## 修复建议

移除 `relations: []` 赋值，或根据实际 DDS context card 数据填充（如有对应字段）：
```typescript
const contexts: BoundedContext[] = contextCards.map((card) => ({
  id: card.id,
  name: card.title ?? '',
  description: card.description ?? '',
  nodeCount: 0,
  relationCount: 0,
  // 移除 relations: []（接口无此字段）
}));
```

## 影响范围
- `src/stores/deliveryStore.ts`（loadFromStores 函数）
- TypeScript 类型一致性
