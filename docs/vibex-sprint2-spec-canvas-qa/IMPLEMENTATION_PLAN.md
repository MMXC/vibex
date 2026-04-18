# Implementation Plan — vibex-sprint2-spec-canvas-qa

**项目**: vibex-sprint2-spec-canvas-qa
**版本**: v1.0
**日期**: 2026-04-18
**角色**: Architect

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: 三章节管理 | U1~U2 | 0/2 | U1 |
| E2: 横向滚奏 | U3 | 0/1 | U3 |
| E3: AI草稿 | U4 | 0/1 | U4 |
| E4: 跨章节 | U5~U6 | 0/2 | U5 |
| E5: 状态处理 | U7 | 0/1 | U7 |
| E6: 测试确认 | U8~U9 | 0/2 | U8 |
| E7: 最终报告 | U10 | 0/1 | U10 |

---

## E1: 三章节管理

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E1-U1 | E1 代码审查 | ⬜ | — | DDSScrollContainer + ChapterPanel 三章节 + CRUD 审查完成 |
| E1-U2 | confirm() 替换 | ⬜ | U1 | ChapterPanel.tsx 无 confirm() dialog，grep "confirm(" → 0 |

### E1-U2 详细说明

**文件**: `src/components/dds/canvas/ChapterPanel.tsx` 第 388 行

**修复**: 将 `confirm('确定删除此卡片？')` 替换为 `ConfirmationModal` 组件

---

## E2: 横向滚奏

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E2-U1 | E2 代码审查 | ⬜ | — | scroll-snap + URL 同步 + 章节切换审查完成 |

---

## E3: AI草稿

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E3-U1 | E3 代码审查 | ⬜ | — | AIDraftDrawer 状态机 + 防闭包审查完成 |

---

## E4: 跨章节

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E4-U1 | E4 代码审查 | :white_check_mark: | — | SVG Overlay + 坐标系审查完成 |
| E4-U2 | collapsedOffsets 修复 | ⬜ | U1 | 无 px 硬编码，使用相对偏移量 |

### E4-U2 详细说明

**文件**: `src/components/dds/canvas/CrossChapterEdgesOverlay.tsx`

**修复**: 将 `COLLAPSED_WIDTH_PX = 80` 改为动态获取或相对偏移

---

## E5: 状态处理

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E5-U1 | E5 代码审查 | :white_check_mark: | — | 骨架屏 + 空状态 + 错误态审查完成 |

---

## E6: 测试确认

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E6-U1 | DDSCanvasStore 测试数量 | ⬜ | — | 24 tests，确认 analyst 声称的 143 为全局总计 |
| E6-U2 | deselectCard 状态 | ⬜ | U1 | deselectCard 测试状态确认 |

---

## E7: 最终报告

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E7-U1 | qa-final-report.md | ⬜ | E6-U2 | 含所有 Epic PASS/FAIL、DoD、已知问题状态 |

---

## gstack 截图计划

| ID | 目标 | 验证点 | 环境依赖 |
|----|------|--------|---------|
| G1 | DDSScrollContainer | 3 个章节横向排列 | Staging |
| G2 | AIDraftDrawer | IDLE→LOADING→REVIEW 状态转换 | Staging |
| G3 | CrossChapterEdges | 跨章节 SVG 边渲染 | Staging |
| G4 | 空状态 | 引导插图 | Staging |
| G5 | 骨架屏 | 3 个 shimmer panel | Staging |
