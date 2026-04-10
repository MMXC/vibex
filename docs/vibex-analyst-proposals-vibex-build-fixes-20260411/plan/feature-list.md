# Feature List — VibeX 构建修复

**项目**: vibex-build-fixes-20260411  
**基于**: Analyst 报告 (proposal.md)  
**日期**: 2026-04-11  
**Plan 类型**: fix  
**Plan 深度**: Lightweight

---

## Feature List

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|----------|----------|
| F1.1 | 删除孤立 Storybook 文件 | 删除 `CanvasHeader.stories.tsx`，其引用的组件已在 `feat/e2-code-cleanup` 分支被删除且未合并 | 问题1: CanvasHeader.stories.tsx | 5 min |
| F1.2 | 验证后端构建 | 确认工作区弯引号修复（`'''` → 标准引号），运行 `pnpm build` 验证 | 问题2: Unicode 弯引号 | 5 min |
| F1.3 | 提交并推送修复 | 将两个构建修复 commit 并 push，完成交付 | - | 5 min |

**总工时**: 15 分钟

---

## Epic 划分

只有一个 Epic: **Epic 1: 构建修复**

- Story 1.1: 删除前端孤立 Storybook 文件
- Story 1.2: 验证后端构建并确认修复
- Story 1.3: 提交并推送所有修复

---

## 依赖关系

```
F1.1 → F1.3 (先删除文件，再提交)
F1.2 → F1.3 (先验证构建，再提交)
F1.3 独立执行
```

**无外部依赖。**

---

## 验收条件

- [ ] `vibex-fronted`: `next build` 成功（退出码 0）
- [ ] `vibex-backend`: `pnpm build` 成功（退出码 0）
- [ ] 修复已 commit 并 push
