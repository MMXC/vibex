# Feature List — VibeX 构建修复

**项目**: vibex-build-fixes
**基于**: Analyst 报告 (analysis.md)
**日期**: 2026-04-11
**Plan 类型**: fix
**Plan 深度**: Lightweight

---

## Feature List

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|----------|----------|
| F1.1 | 删除孤立 Story 文件 | 删除 `CanvasHeader.stories.tsx`（组件已删除但 story 被 revert 回 main） | 问题1 | 5 min |
| F1.2 | 替换 Unicode 弯引号 | 3个 route.ts 弯引号 → ASCII 直引号 | 问题2 | 5 min |
| F1.3 | 全量构建验证 | 前端 `next build` + 后端 `pnpm build` 验证 | - | 5 min |

**总工时**: 15 分钟

---

## Epic 划分

只有一个 Epic: **Epic 1: 构建修复**

- Story 1.1: 删除前端孤立 Storybook 文件
- Story 1.2: 验证后端构建并确认弯引号修复
- Story 1.3: 提交并推送所有修复

---

## 依赖关系

```
F1.1 → F1.3 (先删除文件，再提交)
F1.2 → F1.3 (先验证构建，再提交)
F1.3 独立执行
```

**无外部依赖。**
