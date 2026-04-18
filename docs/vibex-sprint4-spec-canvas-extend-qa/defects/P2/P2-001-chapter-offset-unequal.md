# P2-001: CHAPTER_OFFSETS 分布不均匀

**严重性**: P2（体验/建议）
**Epic**: E3
**Spec 引用**: specs/E3-cross-chapter.md

## 问题描述
`CrossChapterEdgesOverlay.tsx` 中 `CHAPTER_OFFSETS` 不是均匀等差分布，导致跨章节边的起点/终点位置不协调，影响视觉一致性。

## 代码证据

```typescript
// src/components/dds/canvas/CrossChapterEdgesOverlay.tsx
const CHAPTER_OFFSETS: Record<ChapterType, number> = {
  requirement: 0,      // 0
  context:    1 / 3,   // 0.333...
  flow:       2 / 3,   // 0.666...
  api:        3 / 4,  // 0.75  ← 不均匀插入
  'business-rules': 1, // 1
};
// 间距: 0.333, 0.333, 0.083, 0.25 → 不均匀
```

## 修复建议

```typescript
// 方案 A: 5 等分均匀分布
const CHAPTER_OFFSETS: Record<ChapterType, number> = {
  requirement:    0,
  context:       0.25,
  flow:          0.5,
  api:           0.75,
  'business-rules': 1,
};

// 方案 B: 确认 Spec 是否要求不均匀分布（如有特殊理由），如有则在文档中说明原因
```

## 影响范围
- `src/components/dds/canvas/CrossChapterEdgesOverlay.tsx`
- 跨章节边渲染的视觉对齐（低优先级）
