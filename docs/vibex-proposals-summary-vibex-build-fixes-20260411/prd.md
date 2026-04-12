# VibeX 提案汇总（Summary 视角）— PRD

**项目**: vibex-proposals-summary-vibex-build-fixes-20260411
**状态**: 已规划
**PM**: pm
**日期**: 2026-04-11
**产出**: `/root/.openclaw/vibex/docs/vibex-proposals-summary-vibex-build-fixes-20260411/prd.md`

---

## 1. 执行摘要

### 背景
所有角色提案汇总分析显示：**两个 P0 阻塞问题，方向完全一致**，分歧仅在是否包含 CI/CD 增强。Summary 视角按两阶段执行：紧急修复（共识）+ 长期防护（可选增强）。

### 目标
1. 立即解除构建阻塞（<15min，所有角色共识）
2. 建立 CI/CD 增强体系（Architect + Reviewer 提案，约 7.5h）

### 成功指标
- 前端 `next build` + 后端 `pnpm build` 退出码 = 0
- CI TypeScript Gate 在前后端均运行
- ESLint `no-irregular-whitespace` 已启用
- PR 合入标准文档已建立

---

## 2. Epic 拆分

### Epic 1: 紧急修复（所有角色共识）

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **1.1** | 删除孤立 `CanvasHeader.stories.tsx` | 5 min | `expect(fileExists).toBe(false)` + `next build` 成功 |
| **1.2** | 替换 Unicode 弯引号 | 5 min | `expect(弯引号.exitCode).toBe(1)` + `pnpm build` 成功 |
| **1.3** | 全量构建验证 | 5 min | 前后端 build 退出码 = 0 |

**Epic 1 总工时**: 15 分钟

---

### Epic 2: CI/CD 增强（Architect + Reviewer 共识）

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **2.1** | CI TypeScript Gate（前端+后端） | 2h | `expect(workflow).toContain('tsc --noEmit')` |
| **2.2** | ESLint 规则加固 | 1h | `expect(eslintConfig).toContain('no-irregular-whitespace')` |
| **2.3** | pre-commit hook | 1h | `expect(huskyHook).toContain('tsc --noEmit')` |
| **2.4** | Story 孤立检查脚本 | 2h | `expect(script).toBeDefined()` + CI 集成 |
| **2.5** | PR 合入标准文档 | 1h | `expect(exists('docs/PR_MERGE_CRITERIA.md')).toBe(true)` |

**Epic 2 总工时**: 7h

---

**总工时汇总**: 15min + 7h ≈ **~8h**

---

## 3. 验收标准

### Story 1.1

```
expect(fileExists('vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx')).toBe(false)
expect(exec('cd vibex-fronted && next build').exitCode).toBe(0)
```

### Story 2.1

```
expect(frontendCI).toContain('tsc --noEmit')
expect(backendCI).toContain('tsc --noEmit')
expect(exec('git diff .github/workflows/').exitCode).toBe(0) // CI 文件已提交
```

---

## 4. DoD (Definition of Done)

Epic 1 完成条件：
- [ ] `CanvasHeader.stories.tsx` 已删除
- [ ] 弯引号已替换，构建成功
- [ ] 修复已 commit 并 push

Epic 2 完成条件：
- [ ] CI TypeScript Gate 在前后端均运行
- [ ] ESLint 规则已配置
- [ ] pre-commit hook 生效
- [ ] Story 孤立检查脚本在 CI 中运行
- [ ] PR 合入标准文档完整

项目整体 DoD：
- [ ] 所有 Epic 门禁通过
- [ ] CI green
- [ ] changelog 已更新

---

## 5. 功能点汇总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 删除Story | CanvasHeader.stories.tsx | `fileExists).toBe(false)` | 无 |
| F1.2 | 弯引号替换 | 3个route.ts | `grep.exitCode=1` | 无 |
| F1.3 | 构建验证 | next+pnpm build | `exitCode=0` | 无 |
| P2.1 | CI TS Gate | 前端+后端类型检查 | workflow含tsc | 无 |
| P2.2 | ESLint规则 | no-irregular-whitespace | `rule='error'` | 无 |
| P2.3 | pre-commit | tsc+弯引号扫描 | hook存在 | 无 |
| P2.4 | Story检查 | CI验证story引用 | 脚本exitCode正确 | 无 |
| P2.5 | PR标准 | 构建/质量/安全清单 | 文档存在 | 无 |

---

## 6. 风险提示

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| 分歧导致决策延迟 | 低 | 中 | 直接采纳共识方案 |
| CI Gate 误报 | 中 | 中 | 先 PR 验证 |

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
*基于: 全部角色提案汇总 (analysis.md)*
