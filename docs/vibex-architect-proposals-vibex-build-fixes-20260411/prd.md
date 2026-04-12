# VibeX 构建修复（Architect 视角）— PRD

**项目**: vibex-architect-proposals-vibex-build-fixes-20260411
**状态**: 已规划
**PM**: pm
**日期**: 2026-04-11
**产出**: `/root/.openclaw/vibex/docs/vibex-architect-proposals-vibex-build-fixes-20260411/prd.md`

---

## 1. 执行摘要

### 背景
VibeX 存在两个阻塞性构建错误，同时缺少 CI/CD 分层防护机制。Architect 视角提供从修复到防护的完整闭环：L1 预防 → L2 检测 → L3 监控 → L4 恢复。

### 目标
1. 立即解除构建阻塞（<15min）
2. 建立 CI/CD L1-L4 分层质量防护体系，防止类似问题再次发生

### 成功指标
- 前端 `next build` + 后端 `pnpm build` 退出码 = 0
- ESLint `no-irregular-whitespace` 规则已启用
- CI TypeScript Gate 在前端 + 后端均运行
- Storybook 构建纳入 CI
- 构建时间基线已记录
- 快速 revert 策略已文档化

---

## 2. Epic 拆分

### Epic 1: 构建修复（立即执行）

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **1.1** | 删除孤立 `CanvasHeader.stories.tsx` | 5 min | `expect(fileExists).toBe(false)` |
| **1.2** | 替换 Unicode 弯引号 | 5 min | `expect(弯引号.exitCode).toBe(1)` |
| **1.3** | 全量构建验证 | 5 min | `expect(buildExitCode).toBe(0)`（前后端） |

**Epic 1 总工时**: 15 分钟

---

### Epic L1: L1 预防层

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **L1.1** | ESLint `no-irregular-whitespace` 规则 | 1h | `expect(eslintConfig).toContain('no-irregular-whitespace')` |
| **L1.2** | pre-commit `tsc --noEmit` | 1h | `expect(huskyHook).toContain('tsc --noEmit')` |
| **L1.3** | Story-Component 同步 SOP | 1h | `expect(prTemplate).toContain('Story/Component Sync')` |

**Epic L1 总工时**: 3h

---

### Epic L2: L2 检测层

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **L2.1** | CI TypeScript Gate（前端） | 1h | `expect(workflow).toContain('tsc --noEmit')` + frontend job |
| **L2.2** | CI TypeScript Gate（后端） | 1h | `expect(workflow).toContain('tsc --noEmit')` + backend job |

**Epic L2 总工时**: 2h

---

### Epic L3: L3 监控层

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **L3.1** | Storybook 构建纳入 CI | 1h | `expect(workflow).toContain('build-storybook')` |
| **L3.2** | 构建时间基线监控 | 1h | `expect(baseline).toBeDefined()` |

**Epic L3 总工时**: 2h

---

### Epic L4: L4 恢复层

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| **L4.1** | 快速 revert 策略文档化 | 1h | `expect(exists('docs/revert-sop.md')).toBe(true)` |

**Epic L4 总工时**: 1h

---

**总工时汇总**: 15min + 3h + 2h + 2h + 1h ≈ **~9h**

---

## 3. 验收标准

### Story L1.1 — ESLint 规则

```
expect(eslintRc.rules['no-irregular-whitespace']).toBe('error')
expect(exec('grep "no-irregular-whitespace" .eslintrc*').exitCode).toBe(0)
```

### Story L2.1 — CI TypeScript Gate

```
expect(workflowContent).toContain('tsc --noEmit')
expect(workflowContent).toContain('vibex-fronted')
expect(workflowContent).toContain('fail-fast')
```

### Story L3.1 — Storybook CI

```
expect(workflowContent).toContain('build-storybook')
expect(workflowContent).toContain('working-directory: vibex-fronted')
```

---

## 4. DoD (Definition of Done)

Epic 1 完成条件：
- [ ] `CanvasHeader.stories.tsx` 已删除
- [ ] 弯引号已替换，构建成功

Epic L1 完成条件：
- [ ] ESLint 规则已配置并验证
- [ ] pre-commit hook 生效
- [ ] PR 模板包含同步检查项

Epic L2 完成条件：
- [ ] 前端 CI 包含 TypeScript Gate
- [ ] 后端 CI 包含 TypeScript Gate

Epic L3 完成条件：
- [ ] Storybook 构建在 CI 中运行
- [ ] 构建时间基线已建立

Epic L4 完成条件：
- [ ] 快速 revert SOP 文档存在且可执行

项目整体 DoD：
- [ ] 所有 Epic 门禁通过
- [ ] CI green
- [ ] changelog 已更新

---

## 5. 功能点汇总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 删除Story | CanvasHeader.stories.tsx 删除 | `fileExists(...)).toBe(false)` | 无 |
| F1.2 | 弯引号替换 | 3个route.ts | `grep弯引号.exitCode=1` | 无 |
| F1.3 | 构建验证 | next+pnpm build | `buildExitCode=0` | 无 |
| L1.1 | ESLint规则 | no-irregular-whitespace | `rule='error'` | 无 |
| L1.2 | pre-commit | tsc --noEmit | hook存在且有效 | 无 |
| L1.3 | SOP | Story/Component同步检查 | PR模板含检查项 | 无 |
| L2.1 | CI-前端TS | tsc Gate | workflow含tsc+frontend | 无 |
| L2.2 | CI-后端TS | tsc Gate | workflow含tsc+backend | 无 |
| L3.1 | Storybook CI | build-storybook | workflow含build-storybook | 无 |
| L3.2 | 基线监控 | 构建时间基线 | baseline已记录 | 无 |
| L4.1 | Revert SOP | 快速恢复策略 | 文档存在 | 无 |

---

## 6. 风险提示

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| CI Gate 误报阻断正常构建 | 中 | 中 | 先在 PR 验证，再合 main |
| pre-commit hook 拖慢提交 | 低 | 低 | 设置超时限制 |

---

## 7. PRD 格式校验

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言
- [x] DoD 章节存在且具体
- [x] 功能点汇总表格式正确
- [x] 已执行 Planning（Feature List 已产出）
- [x] CI/CD L1-L4 分层结构完整

---

*Planning 输出: `plan/feature-list.md`*  
*基于 Architect 提案: `proposal.md`*
