# P1-002: collapsedOffsets 硬编码 80px，展开态计算不准确

**严重性**: P1 (计算)
**Epic**: E4
**Spec 引用**: vibex-sprint2-spec-canvas/reviewer-epic4-章节间-dag-关系-review.md

## 问题描述

Reviewer E4 发现 `collapsedOffsets` 硬编码 80px，不考虑面板展开状态，导致展开态下跨章节边位置计算不准确。

## 代码证据

```bash
grep -n "collapsedOffsets" src/components/dds/canvas/CrossChapterEdgesOverlay.tsx
# 预期：无 "80" literal 硬编码
# 实际（待验证）：有硬编码
```

## 修复建议

将 80px 硬编码改为动态计算：`panelWidth * collapsedRatio`。

## 影响范围

- `CrossChapterEdgesOverlay.tsx`
