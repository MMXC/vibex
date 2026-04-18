# P0-001: 交付中心数据流断裂 — loadFromStores 未被调用

**严重性**: P0 (阻塞)
**Epic**: E1
**Spec 引用**: E1-data-integration.md §数据层集成

## 问题描述

`delivery/page.tsx` mount 时调用 `loadMockData()` 而非 `loadFromStores()`，导致 ContextTab/FlowTab/ComponentTab 消费硬编码 mock 数据，与真实 store 数据完全隔离。

## 代码证据

```tsx
// delivery/page.tsx 第 27 行（待验证）
useEffect(() => {
  loadMockData();  // ❌ 应该调用 loadFromStores()
}, [])
```

```tsx
// 正确实现应为：
useEffect(() => {
  loadFromStores();  // ✅ 从 prototypeStore + DDSCanvasStore 拉取
}, [loadFromStores])
```

## 验证

```bash
grep -n "loadMockData\|loadFromStores" delivery/page.tsx
# 预期：loadFromStores 存在且被调用，loadMockData 0 处

grep -n "Mock Component\|Mock Context\|Mock Flow" src/components/delivery/
# 预期：0 处（真实数据无 mock 前缀）
```

## 修复建议

`delivery/page.tsx`:
```tsx
const loadFromStores = useDeliveryStore((s) => s.loadFromStores);
useEffect(() => { loadFromStores(); }, [loadFromStores]);
```

## 影响范围

- `delivery/page.tsx`
- `ContextTab.tsx` / `FlowTab.tsx` / `ComponentTab.tsx`
