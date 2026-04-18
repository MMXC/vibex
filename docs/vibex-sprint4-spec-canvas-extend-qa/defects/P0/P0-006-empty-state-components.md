# P0-006: ChapterEmptyState 和 ChapterSkeleton 组件缺失

**严重性**: P0（阻塞）
**Epic**: E5
**Spec 引用**: specs/E1-api-chapter.md, specs/E2-business-rules.md

## 问题描述
Spec E1 和 E2 要求每个章节有空状态引导文案 + 加载态骨架屏，但：
- `ChapterEmptyState.tsx` — **文件不存在**
- `ChapterSkeleton.tsx` — **文件不存在**
- `CardErrorBoundary.tsx` — ✅ 存在

## 代码证据

```bash
$ ls /root/.openclaw/vibex/vibex-fronted/src/components/dds/canvas/ChapterEmptyState*
# NOT FOUND

$ ls /root/.openclaw/vibex/vibex-fronted/src/components/dds/canvas/ChapterSkeleton*
# NOT FOUND
```

## 修复建议

**ChapterEmptyState.tsx** 需包含 Spec 期望的引导文案：
- API 章节: "从左侧拖拽 HTTP 方法到画布"
- SM 章节: "从左侧拖拽 State 开始设计业务规则"

**ChapterSkeleton.tsx** 需使用 CSS 骨架屏动画，禁止使用 `role="progressbar"`。

## 影响范围
- `src/components/dds/canvas/`
- DDSPanel 各章节渲染逻辑
- `DDSFourStates.test.tsx`

## 修复记录

**修复日期**: —
**修复人**: —
**Commit**: —
**修复说明**: NOT FIXED. ChapterEmptyState.tsx 和 ChapterSkeleton.tsx 仍不存在。测试验证: chapter-existence.test.ts (3 tests ✅) 确认文件不存在。
