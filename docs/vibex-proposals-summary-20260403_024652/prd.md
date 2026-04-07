# PRD: VibeX Sprint 4 提案合并实施计划

**项目**: vibex-proposals-summary-20260403_024652
**版本**: v1.0
**日期**: 2026-04-03
**状态**: PM 细化
**数据来源**: dev / pm / architect / tester / reviewer / analyst 6 方提案汇总

---

## 1. 执行摘要

### 背景
Sprint 3 收尾阶段，6 个 Agent 从各自专业视角识别 VibeX 改进方向，共收集 29 条提案（去重后 26 条）。本 PRD 将其合并为统一实施计划。

### 目标
在 Sprint 4 期间，优先处理 P0 技术债和质量门禁，建立开发流程规范，同时推进用户体验增强。

### 成功指标
| 指标 | 当前基线 | Sprint 4 目标 |
|------|----------|---------------|
| CI 通过率 | <100%（TS 错误阻断） | 100% |
| 审查驳回率 | >30%（CHANGELOG 相关） | <10% |
| E2E 测试通过率 | 70-80% | >95% |
| Sprint 4 交付率 | — | >80% |
| canvasStore Facade 行数 | 1513 行 | <300 行 |

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 来源 | 优先级 | 工时 | 依赖 |
|------|------|------|--------|------|------|
| E1 | 技术债清理 | dev+architect | P0 | 6h | 无 |
| E2 | 质量门禁建立 | reviewer+tester | P0 | 6h | E1 部分 |
| E3 | 用户体验增强 | analyst+pm | P1 | 8h | 无 |
| E4 | 测试工程化 | tester+dev | P1 | 10h | E1 |
| E5 | 协作基础设施 | analyst+pm | P2 | 12h | 无 |

**总工时**: 42h（~3 Sprint）

---

### Epic 1: 技术债清理（P0）

#### 概述
清理 Sprint 3 遗留的技术债，包括 TS 编译错误、canvasStore Facade 残留、E4 同步协议缺失。

#### Stories

**S1.1: TS 编译错误修复**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望 CI 构建无 TS 错误 |
| 功能点 | 修复 StepClarification.tsx 重复类型定义 |
| 验收标准 | `expect(child_process.spawnSync('npx', ['tsc', '--noEmit'], {cwd:'vibex-fronted'}).status).toBe(0)` |
| 页面集成 | 无 |
| 工时 | 0.5h |
| 依赖 | 无 |

**S1.2: E4 Sync Protocol（冲突检测）**
| 字段 | 内容 |
|------|------|
| Story | 作为用户，我希望多用户并发编辑时有冲突检测和解决机制 |
| 功能点 | 后端乐观锁 + ConflictDialog 组件 |
| 验收标准 | `expect(await POST(snapshotWithOldVersion)).toMatchObject({status:409})` + `expect(screen.getByText('冲突解决')).toBeVisible()` |
| 页面集成 | 【需页面集成】CanvasPage ConflictDialog |
| 工时 | 5h |
| 依赖 | S1.1 |

**S1.3: canvasStore Facade 清理**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望 canvasStore.ts < 300 行，消除双重数据源风险 |
| 功能点 | 迁移剩余逻辑到 split stores，canvasStore 降级为 re-export 层 |
| 验收标准 | `expect(lineCount('canvasStore.ts')).toBeLessThan(300)` + `expect(allStoreImports.every(i => i.startsWith('./stores/'))).toBe(true)` |
| 页面集成 | 无 |
| 工时 | 4h |
| 依赖 | 无 |

**S1.4: ESLint disable 豁免记录**
| 字段 | 内容 |
|------|------|
| Story | 作为 Reviewer，我希望所有 eslint-disable 有统一记录和复查机制 |
| 功能点 | 创建 ESLINT_DISABLES.md，逐条记录豁免理由 |
| 验收标准 | `expect(grep('eslint-disable').length).toBeLessThanOrEqual(20)` + `expect(fs.existsSync('ESLINT_DISABLES.md')).toBe(true)` |
| 页面集成 | 无 |
| 工时 | 1h |
| 依赖 | 无 |

#### DoD
- `npx tsc --noEmit` 零错误
- canvasStore.ts < 300 行
- ConflictDialog 覆盖 3 种冲突场景
- ESLINT_DISABLES.md 覆盖所有现有豁免

---

### Epic 2: 质量门禁建立（P0）

#### 概述
建立开发流程规范，包括 CHANGELOG 规范、Dev 自查脚本、Reviewer 驳回模板。

#### Stories

**S2.1: CHANGELOG 规范统一**
| 字段 | 内容 |
|------|------|
| Story | 作为 Reviewer，我希望 CHANGELOG 更新规则在 AGENTS.md 中明确声明 |
| 功能点 | AGENTS.md 明确路径规范，Frontend 仅维护根目录 CHANGELOG.md |
| 验收标准 | `expect(AGENTS.md).toContain('CHANGELOG.md 已更新')` + `expect(fs.existsSync('vibex-fronted/CHANGELOG.md')).toBe(true)` |
| 页面集成 | 无 |
| 工时 | 1h |
| 依赖 | 无 |

**S2.2: Pre-submit 自查脚本**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望提交前运行自查脚本，拦截 CHANGELOG/TS/ESLint 问题 |
| 功能点 | scripts/pre-submit-check.sh（CHANGELOG + tsc + eslint）|
| 验收标准 | `expect(child_process.spawnSync('bash', ['scripts/pre-submit-check.sh'], {cwd:'vibex-fronted'}).status).toBe(0)` |
| 页面集成 | 无 |
| 工时 | 3h |
| 依赖 | S2.1 |

**S2.3: Reviewer 驳回命令模板**
| 字段 | 内容 |
|------|------|
| Story | 作为 Reviewer，我希望驳回时附带具体修复命令，减少 Dev 沟通轮次 |
| 功能点 | AGENTS.md 定义驳回模板：`❌ 驳回 + 📍 文件 + 🔧 修复命令` |
| 验收标准 | `expect(AGENTS.md).toContain('🔧 修复命令')` + `expect(recentRejects.every(r => r.includes('修复命令'))).toBe(true)` |
| 页面集成 | 无 |
| 工时 | 0.5h |
| 依赖 | 无 |

**S2.4: reports/INDEX.md 创建**
| 字段 | 内容 |
|------|------|
| Story | 作为 Coord，我希望审查报告有索引，快速定位历史结论 |
| 功能点 | reports/INDEX.md 包含历史报告目录 |
| 验收标准 | `expect(fs.existsSync('reports/INDEX.md')).toBe(true)` + `expect(INDEX.md).toContain('2026-04')` |
| 页面集成 | 无 |
| 工时 | 1h |
| 依赖 | 无 |

**S2.5: Git Hooks 强制（Optional）**
| 字段 | 内容 |
|------|------|
| Story | 作为团队，我希望 commit-msg hook 强制格式规范，pre-commit hook 强制质量检查 |
| 功能点 | husky + commitlint + pre-commit lint |
| 验收标准 | `expect(invalidCommitMsg).toThrow('commitlint')` + `expect(lintFailBlocksCommit).toBe(true)` |
| 页面集成 | 无 |
| 工时 | 2h |
| 依赖 | S2.1 + S2.2 |
| 备注 | P2，可延至 Sprint 5 |

#### DoD
- AGENTS.md 包含完整 CHANGELOG 规范
- pre-submit-check.sh 可执行且 CI 集成
- 最近 3 次驳回包含修复命令
- reports/INDEX.md 存在且含历史报告

---

### Epic 3: 用户体验增强（P1）

#### 概述
提升新用户体验和画布感知，包括 Phase 状态栏、新手引导、Feedback 收集。

#### Stories

**S3.1: Phase 状态指示器**
| 字段 | 内容 |
|------|------|
| Story | 作为用户，我希望画布顶部始终显示当前 Phase 状态 |
| 功能点 | PhaseIndicator 组件（●○○ 三段式），固定在 Toolbar 区域 |
| 验收标准 | `expect(screen.getByText('上下文')).toBeVisible()` + `expect(indicator).toContainText('限界上下文')` |
| 页面集成 | 【需页面集成】CanvasToolbar 区域 |
| 工时 | 2h |
| 依赖 | 无 |

**S3.2: 新手引导卡片**
| 字段 | 内容 |
|------|------|
| Story | 作为新用户，我希望首次进入 Canvas 时看到操作引导 |
| 功能点 | GuideCard 组件（欢迎语 + 3 步指引 + 示例项目按钮）|
| 验收标准 | `expect(guideCard).toBeVisible()` → `user.click(closeBtn)` → `expect(guideCard).not.toBeVisible()` |
| 页面集成 | 【需页面集成】CanvasPage 首次渲染 |
| 工时 | 2h |
| 依赖 | 无 |

**S3.3: 端内 Feedback 收集**
| 字段 | 内容 |
|------|------|
| Story | 作为用户，我希望随时点击 Feedback 按钮提交问题 |
| 功能点 | 浮动 FAB 按钮 + 分类表单（Bug/功能建议/体验问题）|
| 验收标准 | `expect(fabButton).toBeVisible()` + `expect(submitFeedback).toBeTruthy()` + `expect(slackNotify).toBeCalled()` |
| 页面集成 | 【需页面集成】CanvasPage 全局覆盖 |
| 工时 | 3h |
| 依赖 | 无 |

**S3.4: 示例项目快速入口**
| 字段 | 内容 |
|------|------|
| Story | 作为新用户，我希望一键加载示例项目快速上手 |
| 功能点 | GuideCard 内置「查看示例」按钮，加载 preset JSON |
| 验收标准 | `expect(screen.getByText('查看示例')).toBeVisible()` + `expect(afterClick.nodes.length).toBeGreaterThanOrEqual(3)` |
| 页面集成 | 【需页面集成】GuideCard 组件 |
| 工时 | 1h |
| 依赖 | S3.2 |

#### DoD
- Phase 指示器在画布任何位置始终可见
- 引导卡片首次显示，关闭后 localStorage 记录不再出现
- Feedback 提交后 PM 频道收到 Slack 通知

---

### Epic 4: 测试工程化（P1）

#### 概述
提升测试质量，包括 Flaky 治理、API Contract 测试、突变测试初探。

#### Stories

**S4.1: E2E Flaky 治理**
| 字段 | 内容 |
|------|------|
| Story | 作为 Tester，我希望 Playwright retry 配置消除 flaky 噪声 |
| 功能点 | playwright.config.ts retries=2 + workers=1 + stability-report 脚本 |
| 验收标准 | `expect(e2ePassRate).toBeGreaterThanOrEqual(0.95)` + `expect(stabilityReport).toBeDefined()` |
| 页面集成 | 无 |
| 工时 | 3h |
| 依赖 | 无 |

**S4.2: API Contract 测试**
| 字段 | 内容 |
|------|------|
| Story | 作为开发者，我希望前后端 API 契约有自动化测试，防止格式漂移 |
| 功能点 | 核心 API JSON Schema + mock 数据一致性校验 |
| 验收标准 | `expect(schemaValidation(schemaInvalid).status).toBe(400)` + `expect(contractTests.every(t => t.pass)).toBe(true)` |
| 页面集成 | 无 |
| 工时 | 4h |
| 依赖 | S1.2 |

**S4.3: Playwright E2E 覆盖 auto-save**
| 字段 | 内容 |
|------|------|
| Story | 作为 Tester，我希望 auto-save 流程有 E2E 覆盖（debounce/beacon/conflict）|
| 功能点 | auto-save.spec.ts 覆盖完整保存流程 |
| 验收标准 | `expect(autoSaveSpec).toContain('debounce')` + `expect(autoSaveSpec).toContain('beacon')` + `expect(continuous3Runs).toBe(true)` |
| 页面集成 | 【需页面集成】CanvasPage auto-save 流程 |
| 工时 | 3h |
| 依赖 | S1.2 |

#### DoD
- E2E 通过率连续 3 次 ≥ 95%
- Contract 测试覆盖核心 API（domain-model、flow、component）
- auto-save E2E 覆盖 beacon 和 debounce 场景

---

### Epic 5: 协作基础设施（P2）

#### 概述
为团队协作和商业化做准备，包括只读分享链接、版本快照、质量仪表盘。

#### Stories

**S5.1: 只读分享链接**
| 字段 | 内容 |
|------|------|
| Story | 作为设计师，我希望生成只读链接分享给团队成员 |
| 功能点 | 分享按钮 → UUID token → /share/{uuid} 页面 |
| 验收标准 | `expect(response.status).toBe(200)` + `expect(sharePage.content).toContain('BoundedContext')` |
| 页面集成 | 【需页面集成】ProjectBar 导出区域 |
| 工时 | 2h |
| 依赖 | 无 |

**S5.2: CI 质量仪表盘**
| 字段 | 内容 |
|------|------|
| Story | 作为团队，我希望看到 E2E 通过率趋势图 |
| 功能点 | /quality 页面（折线图，覆盖最近 10 次构建）|
| 验收标准 | `expect(qualityPage).toBeAccessible()` + `expect(trendChart.dataPoints.length).toBeGreaterThanOrEqual(5)` |
| 页面集成 | 【需页面集成】新路由 /quality |
| 工时 | 3h |
| 依赖 | S4.1 |

**S5.3: 质量异常报警**
| 字段 | 内容 |
|------|------|
| Story | 作为团队，我希望 E2E 通过率 < 90% 时收到 Slack 报警 |
| 功能点 | CI 数据写入后检查通过率 → < 90% → Webhook 通知 |
| 验收标准 | `expect(passRate85.sendsAlert).toBe(true)` + `expect(alertChannel).toBe('#coord')` |
| 页面集成 | 无 |
| 工时 | 1h |
| 依赖 | S5.2 |

**S5.4: 设计版本快照**
| 字段 | 内容 |
|------|------|
| Story | 作为设计师，我希望保存设计快照以便回溯历史 |
| 功能点 | Snapshot 列表，支持命名（如"v1.0 初始设计"），最多 50 个 |
| 验收标准 | `expect(snapshotCreate.status).toBe(200)` + `expect(snapshotList.length).toBeGreaterThan(0)` |
| 页面集成 | 【需页面集成】ProjectSettings 或 ProjectBar |
| 工时 | 4h |
| 依赖 | S1.2 |

**S5.5: 版本快照对比**
| 字段 | 内容 |
|------|------|
| Story | 作为设计师，我希望对比两个快照的差异 |
| 功能点 | 选择两个快照 → side-by-side diff（节点增删改高亮）|
| 验收标准 | `expect(diffView.addedNodes.every(n => n.color).toBe('green')).toBe(true)` |
| 页面集成 | 【需页面集成】Snapshot 对比页面 |
| 工时 | 2h |
| 依赖 | S5.4 |

#### DoD
- 分享链接在未登录状态下可完整查看项目
- 质量仪表盘覆盖最近 10 次 CI 数据
- 快照支持命名、预览、对比

---

## 3. 验收标准汇总

| Epic | Story | 功能点 | expect() 断言 |
|------|-------|--------|--------------|
| E1 | S1.1 | TS 错误修复 | `tsc --noEmit status = 0` |
| E1 | S1.2 | E4 Sync | `POST 409` + `ConflictDialog visible` |
| E1 | S1.3 | Facade 清理 | `canvasStore < 300 行` |
| E1 | S1.4 | ESLint 豁免 | `ESLINT_DISABLES.md exists` |
| E2 | S2.1 | CHANGELOG 规范 | `AGENTS.md contains 规范` |
| E2 | S2.2 | 自查脚本 | `pre-submit-check.sh exit 0` |
| E2 | S2.3 | 驳回模板 | `recentRejects have 命令` |
| E2 | S2.4 | INDEX.md | `INDEX.md exists` |
| E3 | S3.1 | Phase 指示器 | `getByText('上下文').toBeVisible()` |
| E3 | S3.2 | 引导卡片 | `guideCard visible → close → gone` |
| E3 | S3.3 | Feedback | `fabButton visible + slackNotify called` |
| E3 | S3.4 | 示例项目 | `≥3 BoundedContext nodes loaded` |
| E4 | S4.1 | Flaky 治理 | `e2ePassRate ≥ 95%` |
| E4 | S4.2 | Contract 测试 | `schemaValidation(400) + all pass` |
| E4 | S4.3 | auto-save E2E | `debounce + beacon + 3 runs pass` |
| E5 | S5.1 | 分享链接 | `sharePage content accessible` |
| E5 | S5.2 | 质量仪表盘 | `chart.dataPoints ≥ 5` |
| E5 | S5.3 | 报警 | `passRate85 → alert sent` |
| E5 | S5.4 | 快照 | `snapshotCreate status 200` |
| E5 | S5.5 | diff | `added green / deleted red` |

**合计**: 5 Epic，19 Story，52 条 expect() 断言

---

## 4. Sprint 排期

| Sprint | Epic | 工时 | 目标 |
|--------|------|------|------|
| **Sprint 4.1** | E1 S1.1（TS修复） | 0.5h | 解 CI 阻断 |
| **Sprint 4.1** | E2 S2.1~S2.3（质量门禁） | 4.5h | 建立规范 |
| **Sprint 4.2** | E1 S1.2（E4 Sync） | 5h | 冲突保护 |
| **Sprint 4.2** | E1 S1.3（Facade） | 4h | 架构清理 |
| **Sprint 4.3** | E3 S3.1~S3.4（UX） | 8h | 用户感知 |
| **Sprint 4.3** | E4 S4.1（Flaky） | 3h | 测试稳定 |
| **Sprint 4.4** | E4 S4.2~S4.3（E2E） | 7h | 测试覆盖 |
| **Sprint 4.4** | E5 S5.1~S5.3（协作） | 6h | 基础设施 |
| **Sprint 5** | E5 S5.4~S5.5 | 6h | 版本管理 |
| **Sprint 5** | E2 S2.5（Git Hooks） | 2h | 强制执行 |

---

## 5. 非功能需求

| 类别 | 要求 |
|------|------|
| 性能 | Quality 页面加载 < 2s |
| 兼容性 | E2E 测试覆盖 Chrome + Firefox |
| 安全性 | Feedback 数据不含 PII |
| 可维护性 | ESLINT_DISABLES.md 每 Sprint 复查 |
| 可靠性 | E2E 通过率 ≥ 95%（连续 3 次） |

---

## 6. 实施约束

- **E4 Sync** 需后端配合，使用乐观锁方案
- **Git Hooks** 可能影响 Dev 效率，建议设为 Optional
- **协作功能**（S5.4/S5.5）依赖后端权限模型
- 所有新功能同步更新 CHANGELOG.md
