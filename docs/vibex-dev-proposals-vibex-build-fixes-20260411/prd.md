# VibeX 构建修复（Dev 视角）— PRD

**项目**: vibex-dev-proposals-vibex-build-fixes-20260411
**状态**: 已规划
**PM**: pm
**日期**: 2026-04-11
**产出**: `/root/.openclaw/vibex/docs/vibex-dev-proposals-vibex-build-fixes-20260411/prd.md`

---

## 1. 执行摘要

### 背景
VibeX monorepo 存在两个阻塞性构建错误：
1. **前端**: `CanvasHeader.stories.tsx` 引用了已删除的组件（`feat/e2-code-cleanup` 分支删除了组件，但 revert 把坏的 story 文件复活了）
2. **后端**: 3个 route.ts 含 Unicode 弯引号 `'''`，TypeScript 解析失败（工作区已有修复，待 commit）

### 目标
修复两个阻塞性构建错误，使前后端 `pnpm build` 均成功退出（退出码 0），修复已 commit 并 push。

### 成功指标
- 前端 `pnpm build`（frontend）退出码 = 0
- 后端 `pnpm build`（backend）退出码 = 0
- 修复已 commit 并 push 到 main 分支
- 无新增 TypeScript 错误

---

## 2. Epic 拆分

### Epic 1: 构建修复

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **1.1** | 删除孤立 Story 文件 `CanvasHeader.stories.tsx` | 5 min | - 执行 `rm vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx`<br>- `git status` 显示文件被删除<br>- `expect(fileExists).toBe(false)` |
| **1.2** | 确认并替换 Unicode 弯引号 | 5 min | - 3个 route.ts 中 `'''Unauthorized'''` → `'Unauthorized'`<br>- Python/grep 验证无 Unicode 弯引号残留<br>- `expect(弯引号.exitCode).toBe(1)` |
| **1.3** | 验证前端构建 | 5 min | - `cd vibex-fronted && pnpm build` 成功<br>- `expect(exec('cd vibex-fronted && pnpm build').exitCode).toBe(0)` |
| **1.4** | 验证后端构建 | 5 min | - `cd vibex-backend && pnpm build` 成功<br>- `expect(exec('cd vibex-backend && pnpm build').exitCode).toBe(0)` |
| **1.5** | 提交并推送所有修复 | 5 min | - `git add` + `git commit` + `git push`<br>- `expect(exec('git log --oneline -1').toString()).toContain('build fix')` |

**Epic 1 总工时**: 25 分钟

---

## 3. 验收标准

### Story 1.1 — 删除孤立 Story 文件

```
expect(fileExists('vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx')).toBe(false)
expect(exec('git status --short').toString()).toContain('D  vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx')
expect(exec('cd vibex-fronted && npx tsc --noEmit').exitCode).toBe(0)
```

### Story 1.2 — 替换 Unicode 弯引号

```
// 验证3个文件均无弯引号
expect(exec('grep "'''" vibex-backend/src/app/api/agents/route.ts').exitCode).toBe(1)
expect(exec('grep "'''" vibex-backend/src/app/api/pages/route.ts').exitCode).toBe(1)
expect(exec('grep "'''" vibex-backend/src/app/api/prototype-snapshots/route.ts').exitCode).toBe(1)
// 验证3个文件均使用标准单引号
expect(exec('grep "error: .Unauthorized." vibex-backend/src/app/api/agents/route.ts').exitCode).toBe(0)
```

### Story 1.3 — 前端构建验证

```
expect(exec('cd vibex-fronted && pnpm build').exitCode).toBe(0)
```

### Story 1.4 — 后端构建验证

```
expect(exec('cd vibex-backend && pnpm build').exitCode).toBe(0)
expect(exec('cd vibex-backend && pnpm build 2>&1 | grep "TS"').exitCode).toBe(1)
```

### Story 1.5 — 提交并推送

```
expect(exec('git log --oneline -1').toString()).toMatch(/build|fix|canvas/i)
expect(exec('git log --oneline -1').toString()).toContain('main')
expect(exec('git log --oneline -1 --stat').toString()).toContain('CanvasHeader.stories')
```

---

## 4. DoD (Definition of Done)

Epic 1 的完成条件：

- [ ] `CanvasHeader.stories.tsx` 文件已从工作区删除
- [ ] 3个 route.ts 均使用标准 ASCII 单引号，无弯引号残留
- [ ] 前端构建 `cd vibex-fronted && pnpm build` 成功（退出码 0）
- [ ] 后端构建 `cd vibex-backend && pnpm build` 成功（退出码 0）
- [ ] 两个修复已 commit 并 push 到 main 分支
- [ ] git diff 显示前后端各涉及文件有预期改动

---

## 5. 功能点汇总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 删除Story文件 | 删除引用已删除组件的 CanvasHeader.stories.tsx | `expect(fileExists(...)).toBe(false)` + `tsc --noEmit` 通过 | 无 |
| F1.2 | 替换弯引号 | 3个 route.ts 弯引号 → ASCII | `grep弯引号.exitCode=1` | 无 |
| F1.3 | 前端构建验证 | `pnpm build`（frontend）成功 | `expect(buildExitCode).toBe(0)` | 无 |
| F1.4 | 后端构建验证 | `pnpm build`（backend）成功 | `expect(buildExitCode).toBe(0)` | 无 |
| F1.5 | 提交并推送 | commit 并 push 两个构建修复 | `git log` 确认提交存在 | 无 |

---

## 6. 风险提示

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| 其他文件也引用 CanvasHeader | 低 | 中 | `grep -r "CanvasHeader"` 全局确认 |
| 后端构建存在其他未知错误 | 低 | 高 | `pnpm build` 全量验证 |
| 工作区修复未完整（其他文件也有弯引号） | 低 | 高 | 全库 `grep` 扫描 |

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
*基于 Dev 提案: `proposal.md`*  
*关联 Analyst 报告: `analysis.md`*
