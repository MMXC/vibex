# P1-002: CrossChapterEdgesOverlay 硬编码 80px

**严重性**: P1（影响功能）
**Epic**: E4
**Spec 引用**: specs/E4-cross-chapter-dag.md

## 问题描述
`CrossChapterEdgesOverlay.tsx` 使用硬编码 `COLLAPSED_WIDTH_PX = 80`，当 DDSPanel 展开宽度变化时，跨章节边偏移量不准确。

## 代码证据

```typescript
// src/components/dds/canvas/CrossChapterEdgesOverlay.tsx
const COLLAPSED_WIDTH_PX = 80; // DDSPanel panelCollapsed width
const collapsedOffsets = (() => {
  context: COLLAPSED_WIDTH_PX,         // 80px 硬编码
  flow: COLLAPSED_WIDTH_PX * 2,       // 160px 硬编码
  // ...
})();
```

## 修复建议

使用动态获取或相对偏移：
```typescript
// 方案 A: 从 DOM 获取实际宽度
const panelWidth = scrollRef.current?.querySelector('.dds-panel')?.getBoundingClientRect().width ?? 80;

// 方案 B: 使用相对值（推荐）
const collapsedOffsets = {
  context: 0,
  flow: 1 / 3,  // 相对比例
  api: 2 / 3,
};
```

## 影响范围
- `src/components/dds/canvas/CrossChapterEdgesOverlay.tsx`
- 跨章节边渲染位置准确性
