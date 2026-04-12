# VibeX 构建修复（Reviewer 视角）— PRD

**项目**: vibex-reviewer-proposals-vibex-build-fixes-20260411
**状态**: 已规划
**PM**: pm
**日期**: 2026-04-11
**产出**: `/root/.openclaw/vibex/docs/vibex-reviewer-proposals-vibex-build-fixes-20260411/prd.md`

---

## 1. 执行摘要

### 背景
VibeX 项目存在两个阻塞性构建错误（前端 + 后端），同时缺少质量门禁机制导致同类问题有复发风险。Reviewer 视角聚焦于：修复构建错误 + 建立 PR 合入标准 + 引入预防性 CI 门禁。

### 目标
1. 立即解除构建阻塞（<15min）
2. 文档化 PR 合入检查清单
3. 建立自动化 CI 质量门禁，防止类似问题再次发生

### 成功指标
- 前端 `next build` 退出码 = 0
- 后端 `pnpm build` 退出码 = 0
- PR 合入标准文档已建立
- Story 孤立组件检查在 CI 中运行
- ESLint `no-irregular-whitespace` 规则已启用
- 所有门禁通过后 PR 才能合入

---

## 2. Epic 拆分

### Epic 1: 构建修复（立即执行）

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **1.1** | 删除孤立 `CanvasHeader.stories.tsx` | 5 min | - 执行 `rm vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx`<br>- `git status` 显示文件被删除<br>- `expect(fileExists).toBe(false)` |
| **1.2** | 替换 Unicode 弯引号（3个 route.ts） | 5 min | - `sed` 替换弯引号为 ASCII 直引号<br>- Python 验证脚本无报错<br>- `expect(exec('grep "'''".exitCode)).toBe(1)` |
| **1.3** | 全量构建验证 | 5 min | - `cd vibex-fronted && next build` 成功<br>- `cd vibex-backend && pnpm build` 成功<br>- `expect(buildExitCode).toBe(0)` |

**Epic 1 总工时**: 15 分钟

---

### Epic 2: PR 合入标准

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **2.1** | 建立 PR 合入标准文档 | 1h | - `docs/vibex-reviewer-proposals-vibex-build-fixes-20260411/PR_MERGE_CRITERIA.md` 存在<br>- 包含构建/代码质量/安全三部分清单<br>- `expect(hasBuildCriteria).toBe(true)`<br>- `expect(hasQualityCriteria).toBe(true)`<br>- `expect(hasSecurityCriteria).toBe(true)` |

**Epic 2 总工时**: 1h

---

### Epic 3: 预防规则（CI/ESLint）

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **3.1** | Story 孤立组件检查脚本 | 2h | - CI 中新增步骤验证 story 文件引用的组件存在<br>- 检查脚本输出错误信息并 `exit 1`<br>- `expect(checkScript('orphan-stories.ts').exitCode).toBe(1)`（有错误时）<br>- `expect(exists('.github/workflows/check-stories.ts')).toBe(true)` |
| **3.2** | ESLint 弯引号规则 | 1h | - ESLint 配置 `no-irregular-whitespace: error`<br>- pre-commit hook 扫描弯引号<br>- `expect(eslintConfig).toContain('no-irregular-whitespace')` |
| **3.3** | Storybook 构建纳入 CI | 1h | - `.github/workflows/ci.yml` 包含 `npm run build-storybook`<br>- `expect(ciWorkflow).toContain('build-storybook')` |

**Epic 3 总工时**: 4h

---

### Epic 4: 质量门禁体系

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **4.1** | 自动化 CI 门禁配置 | 2h | - 前端 CI：`tsc --noEmit` + `eslint` + `build-storybook` + 弯引号扫描<br>- 后端 CI：`tsc --noEmit` + `eslint` + 弯引号扫描<br>- `expect(frontendCI).toContain('tsc')`<br>- `expect(backendCI).toContain('tsc')` |

**Epic 4 总工时**: 2h

---

**总工时汇总**: 15min + 1h + 4h + 2h ≈ **~8h**

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
// Python 验证脚本
expect(exec('python3 validate-quotes.py', {cwd: 'vibex-backend'}).exitCode).toBe(0)
expect(exec('grep "'''".exitCode)).toBe(1)
```

### Story 1.3 — 全量构建验证

```
expect(exec('cd vibex-fronted && next build').exitCode).toBe(0)
expect(exec('cd vibex-backend && pnpm build').exitCode).toBe(0)
```

### Story 3.1 — Story 孤立组件检查

```
// 有孤立引用时
expect(exec('npx ts-node .github/workflows/check-stories.ts').exitCode).toBe(1)
expect(stderr).toContain('non-existent component')

// 无孤立引用时
expect(exec('npx ts-node .github/workflows/check-stories.ts').exitCode).toBe(0)
```

### Story 3.2 — ESLint 弯引号规则

```
expect(eslintRc.rules['no-irregular-whitespace']).toBe('error')
expect(exec('git diff HEAD -- .eslintrc*').toString()).toContain('no-irregular-whitespace')
```

### Story 4.1 — CI 门禁

```
// GitHub Actions workflow 包含所有步骤
expect(workflowContent).toContain('tsc --noEmit')
expect(workflowContent).toContain('eslint')
expect(workflowContent).toContain('build-storybook')
expect(workflowContent).toContain('check-stories')
```

---

## 4. DoD (Definition of Done)

Epic 1 完成条件：
- [ ] `CanvasHeader.stories.tsx` 已删除
- [ ] 3个 route.ts 无 Unicode 弯引号残留
- [ ] 前端 + 后端构建均成功（退出码 0）
- [ ] 修复已 commit 并 push

Epic 2 完成条件：
- [ ] PR 合入标准文档完整（构建/质量/安全三部分）
- [ ] 文档路径：`docs/PR_MERGE_CRITERIA.md`

Epic 3 完成条件：
- [ ] Story 孤立检查脚本在 CI 中运行
- [ ] ESLint 规则已配置，pre-commit hook 已设置
- [ ] Storybook 构建在 CI 中运行

Epic 4 完成条件：
- [ ] 前端 CI 包含：TypeScript + ESLint + Storybook + 弯引号扫描
- [ ] 后端 CI 包含：TypeScript + ESLint + 弯引号扫描

项目整体 DoD：
- [ ] 所有 Epic 门禁通过
- [ ] CI green（无任何失败步骤）
- [ ] changelog 已更新

---

## 5. 功能点汇总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 删除Story文件 | 删除不存在的CanvasHeader引用 | `fileExists(...)).toBe(false)` | 无 |
| F1.2 | 替换弯引号 | 3个route.ts弯引号→ASCII | `grep弯引号.exitCode=1` | 无 |
| F1.3 | 全量验证 | next build + pnpm build | `buildExitCode).toBe(0)` | 无 |
| F2.1 | PR合入标准 | 构建/质量/安全三部分清单 | 文档存在且完整 | 无 |
| F3.1 | Story检查脚本 | CI验证story引用组件存在 | `exitCode=1` 当有错误 | 无 |
| F3.2 | ESLint规则 | no-irregular-whitespace | `rule.toBe('error')` | 无 |
| F3.3 | Storybook CI | build-storybook加入CI | `workflow.contains(...)` | 无 |
| F4.1 | 自动化门禁 | 前端+后端CI门禁配置 | CI全绿 | 无 |

---

## 6. 风险提示

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| CI Gate 配置阻断正常构建 | 低 | 中 | 先在 PR 中验证，再合 main |
| Story 检查脚本误报（路径解析问题） | 中 | 低 | 人工 Review 兜底 |
| 弯引号在其他未扫描文件中存在 | 低 | 高 | 扩大扫描范围至全库 |

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
*基于 Reviewer 提案: `proposal.md`*  
*关联 Analyst 报告: `analysis.md`*
