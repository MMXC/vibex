# PRD: VibeX 首页重构结项质量审查

> **项目**: vibex-homepage-final-review  
> **版本**: v1.0  
> **日期**: 2026-03-23  
> **Agent**: PM  
> **状态**: Active  
> **上游**: `homepage-redesign` (completed, 10 Epic / 42 Story / 138+ Task) + 8 个 fix 子项目

---

## 1. 问题陈述

`homepage-redesign` 已完成（54/54 任务，全部 reviewer 通过）。在开发过程中，产生了多个 fix 项目来修补审查中发现的问题。为确保所有修复已正确合并且系统整体运行稳定，需要进行正式的结项质量审查。

---

## 2. 成功指标

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| 测试通过率 | ? | 100% |
| E2E 场景覆盖率 | ? | 核心流程全覆盖 |
| Epic 功能验证通过率 | ? | 10/10 Epic 全部通过 |
| 遗留问题数 | ? | ≤ 3（且均为低优先级） |
| 结项报告产出 | ❌ | ✅ 完成 |

---

## 3. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | 所有代码已合并到主分支 | 运行 `npm run test` | expect exit code = 0 |
| AC2 | E2E 测试套件 | 运行 `playwright test` | expect 所有测试 passed |
| AC3 | 每个 Epic | 人工审查或自动化验证 | expect 功能与 PRD 描述一致 |
| AC4 | 所有 fix 项目产物 | 检查代码合并状态 | expect 所有 fix 已合并 |
| AC5 | 结项报告 | 审查完成 | expect 包含通过/不通过清单 |

---

## 4. Epic 拆分

### Epic 1: 测试套件执行与验证

**目标**: 运行全部测试，确保无失败项。

| Story | 功能点 | 验收标准 | 页面集成 |
|-------|--------|----------|----------|
| S1.1 | 单元测试执行 | `expect(child_process.execSync('npm run test -- --passWithNoTests')).toBeTruthy()` | ❌ |
| S1.2 | E2E 测试执行 | `expect(child_process.execSync('playwright test')).toHaveProperty('exitCode', 0)` | ❌ |
| S1.3 | 测试覆盖率报告 | `expect(coverageReport.lines.pct).toBeGreaterThan(70)` | ❌ |
| S1.4 | CI 流水线验证 | `expect(githubActions.run.status).toBe('success')` | ❌ |

**DoD**: [ ] npm test 通过 [ ] playwright 通过 [ ] 覆盖率 ≥ 70% [ ] CI green

---

### Epic 2: Epic 功能完整性验证

**目标**: 验证首页重构 10 个 Epic 的功能是否按 PRD 实现。

| Story | 功能点 | 验收标准 | 页面集成 |
|-------|--------|----------|----------|
| S2.1 | Epic-1 布局框架 | `expect(container.querySelector('.grid')).toBeTruthy() && expect(getComputedStyle(document.documentElement).getPropertyValue('--color-primary')).toBeTruthy()` | ✅ |
| S2.2 | Epic-2 Header导航 | `expect(screen.getByRole('navigation')).toBeInTheDocument() && expect(screen.getByRole('link', {name: /首页/i})).toHaveAttribute('href', '/')` | ✅ |
| S2.3 | Epic-3 左侧抽屉 | `expect(screen.getAllByTestId('step-item')).toHaveLength(4)` | ✅ |
| S2.4 | Epic-4 预览区 | `expect(screen.getByTestId('preview-area')).toBeInTheDocument()` | ✅ |
| S2.5 | Epic-5 右侧抽屉 | `expect(screen.getByTestId('thinking-list')).toBeInTheDocument()` | ✅ |
| S2.6 | Epic-6 底部面板 | `expect(screen.getByRole('textbox')).toBeInTheDocument() && expect(screen.getByRole('button', {name: /发送/i})).toBeInTheDocument()` | ✅ |
| S2.7 | Epic-7 快捷功能 | `expect(screen.getByRole('button', {name: /AI询问/i})).toBeInTheDocument()` | ✅ |
| S2.8 | Epic-8 AI展示区 | `expect(container.querySelectorAll('[class*=card]').length).toBeGreaterThanOrEqual(3)` | ✅ |
| S2.9 | Epic-9 悬浮模式 | `expect(screen.getByTestId('float-hint') \|\| floatingBar).toBeTruthy()` | ✅ |
| S2.10 | Epic-10 状态管理 | `expect(localStorage.setItem).toHaveBeenCalled()` | ✅ |

**DoD**: [ ] 10/10 Epic 验证通过 [ ] 不通过的项记录在 issue 清单

---

### Epic 3: Fix 项目合并验证

**目标**: 确认所有 fix 子项目的修复已正确合并，无遗漏。

Fix 项目清单：

| # | 项目名 | 任务数 | 状态 |
|---|--------|--------|------|
| 1 | homepage-reviewer-failed-fix | 24/24 | ✅ |
| 2 | homepage-sprint1-reviewer-fix | 9/9 | ✅ |
| 3 | homepage-v4-fix | 24/24 | ✅ |
| 4 | homepage-v4-fix-epic1-aipanel-test | 9/9 | ✅ |
| 5 | homepage-v4-fix-epic3-layout-test | 9/9 | ✅ |
| 6 | homepage-theme-api-analysis | 19/19 | ✅ |
| 7 | homepage-theme-integration | 4/4 | ✅ |
| 8 | homepage-event-audit | ? | ✅ |

| Story | 功能点 | 验收标准 | 页面集成 |
|-------|--------|----------|----------|
| S3.1 | Git 分支状态 | `expect(execSync('git branch --merged main').toString()).toContain(fixBranch)` | ❌ |
| S3.2 | Fix 缺陷无复发 | 运行对应 E2E 测试 | expect passed |
| S3.3 | 代码冲突检查 | `expect(execSync('git log main..fix-branch --oneline').length).toBeGreaterThan(0)` | ❌ |

**DoD**: [ ] 8/8 fix 分支已合并 [ ] 无冲突遗留

---

### Epic 4: 性能与安全验证

**目标**: 确保首页在性能和安全性方面达到标准。

| Story | 功能点 | 验收标准 | 页面集成 |
|-------|--------|----------|----------|
| S4.1 | Lighthouse 性能分 | `expect(lighthouse.performance).toBeGreaterThanOrEqual(70)` | ❌ |
| S4.2 | 首屏加载时间 | `expect(pageLoadTime).toBeLessThan(3000)` | ❌ |
| S4.3 | 无 XSS 漏洞 | `expect(securityScan.xss).toHaveLength(0)` | ❌ |
| S4.4 | 敏感数据不暴露 | `expect(secretScan.findings).toHaveLength(0)` | ❌ |

**DoD**: [ ] 性能 ≥ 70 [ ] 加载 < 3s [ ] 无 XSS [ ] 无 secrets

---

### Epic 5: 结项报告产出

**目标**: 产出正式的结项质量报告，供 Coord 决策。

| Story | 功能点 | 验收标准 | 页面集成 |
|-------|--------|----------|----------|
| S5.1 | 质量审查报告 | `expect(fs.existsSync('docs/vibex-homepage-final-review/quality-report.md')).toBe(true)` | ❌ |
| S5.2 | Epic 通过/不通过清单 | `expect(report.epicResults.filter(e => e.status === 'fail').length).toBeLessThanOrEqual(0)` | ❌ |
| S5.3 | 遗留问题清单 | `expect(report.openIssues.length).toBeLessThanOrEqual(3)` | ❌ |
| S5.4 | 签章确认 | `expect(report.signOff).toBeTruthy()` | ❌ |

**DoD**: [ ] 报告已产出 [ ] Epic 全部通过 [ ] 遗留问题 ≤ 3

---

## 5. 功能点总览

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 测试执行 | 运行 npm test + playwright | expect(exitCode).toBe(0) | ❌ |
| F1.2 | 覆盖率验证 | 生成并检查覆盖率报告 | expect(lines).toBeGreaterThan(70) | ❌ |
| F2.1 | Epic-1 验证 | 布局框架 + CSS 变量 | expect(grid).toBeTruthy() | ✅ |
| F2.2 | Epic-2 验证 | Header 导航功能 | expect(nav).toBeInTheDocument() | ✅ |
| F2.3 | Epic-3 验证 | 左侧抽屉步骤列表 | expect(stepItems).toHaveLength(4) | ✅ |
| F2.4 | Epic-4 验证 | 预览区渲染 | expect(previewArea).toBeInTheDocument() | ✅ |
| F2.5 | Epic-5 验证 | 右侧抽屉思考列表 | expect(thinkingList).toBeInTheDocument() | ✅ |
| F2.6 | Epic-6 验证 | 底部面板录入 | expect(textbox).toBeInTheDocument() | ✅ |
| F2.7 | Epic-7 验证 | 快捷功能 | expect(aiButton).toBeInTheDocument() | ✅ |
| F2.8 | Epic-8 验证 | AI 展示区卡片 | expect(cards.length).toBeGreaterThanOrEqual(3) | ✅ |
| F2.9 | Epic-9 验证 | 悬浮模式 | expect(floatHint).toBeTruthy() | ✅ |
| F2.10 | Epic-10 验证 | 状态持久化 | expect(localStorage.setItem).toHaveBeenCalled() | ✅ |
| F3.1 | Fix 分支合并 | 检查所有 fix 分支已合并 | expect(merged).toBe(true) | ❌ |
| F3.2 | Fix 缺陷无复发 | 运行 fix 对应测试 | expect(passed).toBe(true) | ❌ |
| F4.1 | 性能分验证 | Lighthouse performance ≥ 70 | expect(score).toBeGreaterThanOrEqual(70) | ❌ |
| F4.2 | 安全扫描 | 无 XSS / secrets | expect(findings.length).toBe(0) | ❌ |
| F5.1 | 结项报告 | 产出 quality-report.md | expect(exists).toBe(true) | ❌ |

---

## 6. 优先级矩阵

| 优先级 | Epic | Story数 | Task数 | 预计工时 |
|--------|------|---------|--------|----------|
| P0 | Epic 1 (测试执行) | 4 | 8 | 2h |
| P0 | Epic 2 (Epic 验证) | 10 | 20 | 3h |
| P1 | Epic 3 (Fix 合并) | 3 | 6 | 1h |
| P1 | Epic 4 (性能安全) | 4 | 8 | 2h |
| P1 | Epic 5 (结项报告) | 4 | 8 | 1h |
| **合计** | **5** | **25** | **50** | **9h** |

---

## 7. 实施计划

| 阶段 | Epic | 预计工时 | 交付 |
|------|------|----------|------|
| Phase 1 | Epic 1 (测试执行) | 2h | 测试通过清单 |
| Phase 2 | Epic 2 (Epic 验证) | 3h | Epic 功能验证报告 |
| Phase 3 | Epic 3 (Fix 合并) + Epic 4 (性能安全) | 3h | 合并状态 + 安全报告 |
| Phase 4 | Epic 5 (结项报告) | 1h | quality-report.md |

---

## 8. 非功能需求

- **稳定性**: 所有测试必须通过，不允许 flaky test
- **可重复性**: 测试结果在 CI 和本地一致
- **可追溯性**: 每个验证项必须对应 PRD 中的 Story/验收标准

---

## 9. 出界项

- 新功能开发
- 重构已有代码（除非发现阻断性问题）
- 新的 fix 项目创建（由 Coord 决策）

---

*PRD 产出物 - PM Agent | vibex-homepage-final-review*
