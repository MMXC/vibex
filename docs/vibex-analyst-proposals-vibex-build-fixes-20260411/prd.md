# VibeX 构建修复 — PRD

**项目**: vibex-build-fixes-20260411  
**状态**: 已规划  
**PM**: pm  
**日期**: 2026-04-11  
**产出**: `/root/.openclaw/vibex/docs/vibex-analyst-proposals-vibex-build-fixes-20260411/prd.md`

---

## 1. 执行摘要

### 背景
VibeX monorepo 当前存在两个阻塞性构建错误，导致前后端 CI/CD 均无法正常完成：
1. **前端**: `CanvasHeader.stories.tsx` 引用了已被删除的 `CanvasHeader` 组件
2. **后端**: 3个 API route 文件使用了 Unicode 弯引号 `'''`（非标准字符）

### 目标
修复两个阻塞性构建错误，使 `next build`（前端）和 `pnpm build`（后端）均成功退出（退出码 0）。

### 成功指标
- 前端构建 `next build` 退出码 = 0
- 后端构建 `pnpm build` 退出码 = 0
- 两个修复均已 commit 并 push 到 main 分支
- 无新增 TypeScript 错误

---

## 2. Epic 拆分

### Epic 1: 构建修复

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **1.1** | 删除孤立 Storybook 文件 `CanvasHeader.stories.tsx` | 5 min | - 执行 `rm vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx`<br>- 文件不存在于工作区<br>- `git status` 显示文件被删除 |
| **1.2** | 验证后端构建（弯引号修复） | 5 min | - 执行 `cd vibex-backend && pnpm build`<br>- 构建成功，退出码 0<br>- 无 TypeScript 编译错误 |
| **1.3** | 提交并推送所有修复 | 5 min | - `git add` 两个修复<br>- `git commit` 提交<br>- `git push` 推送到 main |

**Epic 1 总工时**: 15 分钟

---

## 3. 验收标准

### Story 1.1 — 删除孤立 Storybook 文件

```
expect(fileExists('vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx')).toBe(false)
expect(exec('git status --short').toString()).toContain('D  vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx')
expect(exec('cd vibex-fronted && npx tsc --noEmit').exitCode).toBe(0)
```

### Story 1.2 — 验证后端构建

```
expect(exec('cd vibex-backend && pnpm build').exitCode).toBe(0)
```

### Story 1.3 — 提交并推送

```
expect(exec('git log --oneline -1').toString()).toContain('build fix')
expect(exec('git log --oneline -1').toString()).toContain('main')
```

---

## 4. DoD (Definition of Done)

Epic 1 的完成条件：

- [ ] `CanvasHeader.stories.tsx` 文件已从工作区删除
- [ ] 前端构建 `cd vibex-fronted && next build` 成功（退出码 0）
- [ ] 后端构建 `cd vibex-backend && pnpm build` 成功（退出码 0）
- [ ] 两个修复已 commit 并 push 到 main 分支
- [ ] 无新增 TypeScript 错误（`tsc --noEmit` 两端均通过）

---

## 5. 功能点汇总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 删除孤立 Storybook 文件 | 删除引用已删除组件的 CanvasHeader.stories.tsx | `expect(fileExists(...)).toBe(false)` + `next build` 成功 | 无 |
| F1.2 | 验证后端构建 | 确认弯引号修复有效，后端构建成功 | `expect(exec('pnpm build').exitCode).toBe(0)` | 无 |
| F1.3 | 提交并推送修复 | commit 并 push 两个构建修复 | `git log` 确认提交存在 | 无 |

---

## 6. 风险提示

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| `feat/e2-code-cleanup` 分支有其他重要代码被跳过 | 低 | 中 | 当前仅处理 main 上的构建错误，分支合并时再处理 |
| revert commit 引入其他回归 | 中 | 中 | 构建验证 + TypeScript 检查覆盖主要回归 |
| 后端构建存在其他未知错误 | 低 | 高 | `pnpm build` 全量验证 |

---

## 7. PRD 格式校验

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言
- [x] DoD 章节存在且具体
- [x] 功能点汇总表格式正确
- [x] 已执行 Planning（Feature List 已产出）

---

*Planning 输出: `plan/feature-list.md`*  
*基于 Analyst 报告: `proposal.md`*
