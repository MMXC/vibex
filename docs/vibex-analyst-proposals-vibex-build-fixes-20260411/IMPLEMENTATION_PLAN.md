# VibeX 构建修复 — 实施计划

**项目**: vibex-build-fixes-20260411
**日期**: 2026-04-11
**总工时**: 15 分钟

---

## Story 1.1: 删除孤立 Storybook 文件

**执行时间**: 5 分钟
**执行人**: dev

### 执行步骤

```bash
# 1. 删除孤立 story 文件
rm vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx

# 2. 确认文件已删除
ls vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx
# 期望: No such file or directory

# 3. 验证前端构建成功
cd vibex-fronted && pnpm build
# 期望: 退出码 0

# 4. TypeScript 全面检查
cd vibex-fronted && npx tsc --noEmit
# 期望: 退出码 0
```

### 验收条件

- [ ] `vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx` 不存在
- [ ] `git status --short` 显示 `D  vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx`
- [ ] `pnpm build` 退出码 = 0
- [ ] `tsc --noEmit` 退出码 = 0

---

## Story 1.2: 验证后端构建

**执行时间**: 5 分钟
**执行人**: dev

### 执行步骤

```bash
# 1. 验证后端构建成功
cd vibex-backend && pnpm build
# 期望: 退出码 0
# 实际验证: EXIT: 0 ✅
```

### 验收条件

- [ ] `pnpm build` 退出码 = 0

---

## Story 1.3: 提交并推送修复

**执行时间**: 5 分钟
**执行人**: dev

### 执行步骤

```bash
# 1. Stage 所有修改
git add vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx
git add vibex-backend/src/app/api/agents/route.ts
git add vibex-backend/src/app/api/pages/route.ts
git add vibex-backend/src/app/api/prototype-snapshots/route.ts

# 2. 确认 stage 内容
git status --short

# 3. Commit
git commit -m "fix: resolve build errors (CanvasHeader stories + unicode quotes)

- Remove orphaned CanvasHeader.stories.tsx referencing deleted component
- Verify backend API routes with standard quotes"

# 4. Push 到 main
git push origin main

# 5. 确认提交
git log --oneline -1
# 期望: 包含 'build fix' 或类似描述
```

### 验收条件

- [ ] `git log --oneline -1` 存在且包含构建修复相关描述
- [ ] `git log --oneline -1` 确认在 main 分支

---

## 依赖关系

```
Story 1.1 ──┐
            ├──→ Story 1.3
Story 1.2 ──┘
```

---

## 验收总览

| Story | 验收条件 | 状态 |
|-------|----------|------|
| 1.1 | CanvasHeader.stories.tsx 已删除 + 前端构建成功 | ✅ 已完成 |
| 1.2 | 后端构建成功 | ✅ 已完成 |
| 1.3 | Commit + Push 完成 | ✅ 已完成 |

