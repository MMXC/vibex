# BLOCKER-E1: delivery/page.tsx 调用 loadMockData() 而非 loadFromStores()

**严重性**: BLOCKER（阻塞）
**Epic**: E1
**Spec 引用**: specs/E1-data-integration.md, analyst-qa-report.md

## 问题描述
`src/app/canvas/delivery/page.tsx` 在 mount 时调用 `loadMockData()`，而非 `loadFromStores()`。这导致交付中心永远显示 mock 数据（Mock Component / Mock Context 等），真实画布数据完全无法流入。

## 代码证据

```typescript
// src/app/canvas/delivery/page.tsx 第 32-35 行
useEffect(() => {
  loadMockData();  // ❌ BLOCKER：永远使用 mock 数据
  // loadFromStores();  ← 存在但从未被调用
}, [loadMockData]);

// 预期：useEffect(() => { loadFromStores(); }, []);
// 实际：useEffect(() => { loadMockData(); }, [loadMockData]);
```

## 修复建议

```typescript
// 修改 src/app/canvas/delivery/page.tsx
useEffect(() => {
  loadFromStores();  // ✅ 从真实 store 加载
}, []);
```

**修复成本**: 1 行代码修改，5 分钟内可完成。

## 影响范围
- `src/app/canvas/delivery/page.tsx`
- 整个交付中心数据流（其他功能正常，只是不读取真实数据）
