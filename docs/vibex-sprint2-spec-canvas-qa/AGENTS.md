# AGENTS.md — vibex-sprint2-spec-canvas-qa

**项目**: vibex-sprint2-spec-canvas-qa
**版本**: v1.0
**日期**: 2026-04-18
**角色**: Architect

---

## 开发约束

### 绝对禁止

1. **禁止在 ChapterPanel.tsx 中使用 `confirm()`** → 替换为 `ConfirmationModal` 组件
2. **禁止在 CrossChapterEdgesOverlay.tsx 中硬编码 px 值** → 使用 `getBoundingClientRect()` 或相对偏移
3. **禁止修改已通过 Reviewer 评审的代码逻辑** → 只修复 P1 缺陷，不重构
4. **禁止引入新依赖** → 修复仅使用已有依赖

### 约束理由

| 约束 | 原因 |
|------|------|
| #1 confirm() | 原生 confirm() 阻塞 UI，体验差，与设计系统不一致 |
| #2 px 硬编码 | DDSPanel 宽度变化时跨章节边偏移不准确 |
| #3 不重构 | E1-E5 已通过 Reviewer 评审，聚焦 P1 修复 |

---

## 文件路径

```
src/components/dds/canvas/ChapterPanel.tsx          ← E1-U2 修复目标
src/components/dds/canvas/CrossChapterEdgesOverlay.tsx ← E4-U2 修复目标
src/stores/dds/__tests__/DDSCanvasStore.test.ts    ← E6-U1 审查
```

---

## 驳回条件

- ChapterPanel.tsx 仍有 `confirm()` 调用 → 驳回重做
- CrossChapterEdgesOverlay.tsx 仍有 `COLLAPSED_WIDTH_PX = 80` 硬编码 → 驳回重做
- 引入新依赖 → 驳回重做
