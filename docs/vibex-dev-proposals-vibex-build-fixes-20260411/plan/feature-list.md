# Feature List — VibeX 构建修复（Dev 视角）

**项目**: vibex-dev-proposals-vibex-build-fixes-20260411
**基于**: Dev 提案 (proposal.md)
**日期**: 2026-04-11
**Plan 类型**: fix
**Plan 深度**: Lightweight

---

## Feature List

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|----------|----------|
| F1.1 | 删除孤立 Story 文件 | 删除 `CanvasHeader.stories.tsx`（组件已删除，revert 把坏文件复活了） | 问题1 | 5 min |
| F1.2 | 替换 Unicode 弯引号 | 3个 route.ts 弯引号 → ASCII（工作区已有修复，确认并 commit） | 问题2 | 5 min |
| F1.3 | 前端构建验证 | `pnpm build`（frontend）成功 | - | 5 min |
| F1.4 | 后端构建验证 | `pnpm build`（backend）成功 | - | 5 min |
| F1.5 | git commit + push | 全量修复 commit 并 push | - | 5 min |

**总工时**: 25 分钟

---

## Epic 划分

只有一个 Epic: **Epic 1: 构建修复**

- Story 1.1: 删除前端孤立 Storybook 文件
- Story 1.2: 确认并替换 Unicode 弯引号
- Story 1.3: 验证前端构建
- Story 1.4: 验证后端构建
- Story 1.5: 提交并推送所有修复

---

## 依赖关系

```
F1.1 → F1.5
F1.2 → F1.5
F1.3 → F1.5（验证通过后提交）
F1.4 → F1.5（验证通过后提交）
```

**无外部依赖。**
