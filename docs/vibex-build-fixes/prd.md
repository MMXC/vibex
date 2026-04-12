# VibeX 构建修复 — PRD

**项目**: vibex-build-fixes
**状态**: 已规划
**PM**: pm
**日期**: 2026-04-11
**产出**: `/root/.openclaw/vibex/docs/vibex-build-fixes/prd.md`

---

## 1. 执行摘要

### 背景
VibeX monorepo 存在两个阻塞性构建错误：
1. **前端**: `CanvasHeader.stories.tsx` 引用已删除的组件（`feat/e2-code-cleanup` 分支删除但 main revert 复活了坏的 story）
2. **后端**: 3个 route.ts 含 Unicode 弯引号，TypeScript 解析失败

### 目标
修复两个阻塞性构建错误，使前后端 `build` 均成功退出（退出码 0）。

### 成功指标
- 前端 `next build` 退出码 = 0
- 后端 `pnpm build` 退出码 = 0
- 修复已 commit 并 push 到 main 分支
- 无新增 TypeScript 错误

---

## 2. Epic 拆分

### Epic 1: 构建修复

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **1.1** | 删除孤立 Story 文件 `CanvasHeader.stories.tsx` | 5 min | - 执行 `rm vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx`<br>- 文件不存在于工作区<br>- `git status` 显示文件被删除 |
| **1.2** | 验证后端构建（弯引号修复） | 5 min | - 执行 `cd vibex-backend && pnpm build`<br>- 构建成功，退出码 0<br>- 无 TypeScript 编译错误 |
| **1.3** | 提交并推送所有修复 | 5 min | - `git add` 两个修复<br>- `git commit` 提交<br>- `git push` 推送到 main 分支 |

**Epic 1 总工时**: 15 分钟

---

## 3. 验收标准

### Story 1.1 — 删除孤立 Story 文件

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

- [ ] `CanvasHeader.stories.tsx` 文件已从工作区删除
- [ ] 前端构建 `cd vibex-fronted && next build` 成功（退出码 0）
- [ ] 后端构建 `cd vibex-backend && pnpm build` 成功（退出码 0）
- [ ] 两个修复已 commit 并 push 到 main 分支
- [ ] 无新增 TypeScript 错误（`tsc --noEmit` 两端均通过）

---

## 5. 功能点汇总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 删除Story文件 | 删除引用已删除组件的 CanvasHeader.stories.tsx | `expect(fileExists(...)).toBe(false)` + `next build` 成功 | 无 |
| F1.2 | 验证后端构建 | 确认弯引号修复有效，后端构建成功 | `expect(exec('pnpm build').exitCode).toBe(0)` | 无 |
| F1.3 | 提交并推送 | commit 并 push 两个构建修复 | `git log` 确认提交存在 | 无 |

---

## 6. 风险提示

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| 其他文件也引用 CanvasHeader | 低 | 中 | 全局 `grep -r "CanvasHeader"` 确认 |
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
*基于 Analyst 报告: `analysis.md`*
