# AGENTS.md: vibex-frontend-analysis-20260327

**Architect**: Architect Agent | **Date**: 2026-03-27

---

## Dev 约束

### 强制规范

1. **不触发 AI 生成逻辑**: 所有改动仅在 UI 层和 store 层
2. **data-testid 全覆盖**: 新增交互元素必须添加 `data-testid`
3. **IndexPage vs CanvasPage**: 以实际文件存在为准，如不存在以 PRD 路径为准

### 禁止事项

- ❌ 不改 `src/lib/ai/`
- ❌ 不改 `src/types/` domain types
- ❌ 不引入新依赖

---

## 关键文件

| 文件 | Epic |
|------|------|
| `public/data/sample-canvas.json` | E1 |
| `src/lib/canvas/canvasStore.ts` | E1 |
| `src/pages/CanvasPage.tsx` | E1 |
| `src/components/ProjectBar.tsx` | E1/E3 |
| `src/pages/IndexPage.tsx` | E2 |
| `src/components/canvas/TreeStatus.tsx` | E3 |
