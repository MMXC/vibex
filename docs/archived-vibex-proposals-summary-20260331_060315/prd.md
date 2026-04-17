# PRD: VibeX 提案汇总实施路线图 — 2026-03-31

> **任务**: vibex-proposals-summary-20260331_060315/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **项目路径**: /root/.openclaw/vibex
> **产出物**: /root/.openclaw/vibex/docs/vibex-proposals-summary-20260331_060315/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | 本轮提案汇总共收集 16 条改进提案，涵盖用户-facing 功能、工程效率、团队协作三个维度 |
| **目标** | 建立 VibeX "从能用到好用" 的体验成熟度，同时解决内部工程债 |
| **成功指标** | P001+P002 完成后三栏利用率 ≥60%；P004 上线后漏斗数据可查；P005 上线后导出功能使用率 ≥15% |

### 优先级矩阵

| 阶段 | 核心提案 | 产品得分 | 总工时 | Sprint |
|-------|---------|----------|--------|--------|
| **Sprint 1** | P001 画布引导 + P002 进度指示 + D-001 ESLint 解除 | 4.7+4.7+工程 | 12h | 本周 |
| **Sprint 2** | P002 持久化 + P004 漏斗监控 + P005 导出 | 4.3+3.7 | 18.5h | 1-2周 |
| **Sprint 3** | P003 流程标准化 + 工程债消化 | 2.3 | 12h | 月度 |

---

## 2. Phase 0: Sprint 1 紧急修复

### P0-Bug: ESLint pre-test 阻塞（D-001）

**描述**: 418 个 ESLint warnings 导致 `npm test` 被 pretest hook 阻塞，所有测试无法运行。

**验收标准**:
```javascript
// D-001
expect(exec('npm test -- --testPathPattern=CardTreeNode --passWithNoTests', { cwd: '/root/.openclaw/vibex/vibex-fronted' }).code).toBe(0);
expect(exec('npx eslint src --quiet', { cwd: '/root/.openclaw/vibex/vibex-fronted' }).code).toBe(0);
```

**DoD**: `npm test` 正常执行，ESLint warnings ≤ 50 或 pretest 已降级

---

## 3. Epic 拆分

### Epic 1: 画布编辑器引导体系（P0，用户-facing）

**目标**: 用户首次打开画布时有清晰引导，三栏利用率从 <20% 提升至 ≥60%

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 空状态引导文案 | 三栏 empty state 显示操作引导（"从首页创建需求"/"上传需求文档"） | `expect(emptyStateText).toMatch(/创建\|上传/);` | 【需页面集成】 |
| F1.2 | Toolbar 悬浮提示 | 每个 toolbar 按钮有 tooltip（Undo/Redo/三树同步等） | `expect(document.querySelectorAll('[data-tooltip]').length).toBeGreaterThan(3);` | 【需页面集成】 |
| F1.3 | 连线类型图例 | Canvas 角落显示 sequence/branch/loop 三种连线样式说明 | `expect(legendElement).toBeVisible(); expect(legendText).toMatch(/sequence\|branch\|loop/);` | 【需页面集成】 |
| F1.4 | 节点标记 tooltip | start（绿圈）/ end（红方）标记 hover 时显示说明 | `expect(startMarker).toHaveAttribute('title', /起点\|start/); expect(endMarker).toHaveAttribute('title', /终点\|end/);` | 【需页面集成】 |

**Epic 1 DoD**:
- [ ] F1.1 + F1.2 + F1.3 + F1.4 全部验收通过
- [ ] gstack screenshot 验证三栏 empty state 有引导文案
- [ ] 无新增 ESLint warnings

---

### Epic 2: 首页步骤流转稳定性（P0，用户-facing）

**目标**: 首页 5 步流程无断点，AI 生成过程可感知、可中断恢复

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | AI 生成进度指示 | Step1→2→3→4 每步显示打字机效果或进度条，禁止重复提交 | `expect(progressIndicator).toBeVisible(); expect(submitBtn).toBeDisabledDuringGeneration();` | 【需页面集成】 |
| F2.2 | Session 持久化 | sessionId 写入 sessionStorage，刷新页面后步骤状态恢复 | `expect(sessionStorage.getItem('vibex_session')).not.toBeNull(); expect(currentStep).toBeRestoredAfterRefresh();` | 【需页面集成】 |
| F2.3 | 跳步保护 | 未完成 Step 切换时弹窗确认（"当前分析未完成，确定跳过？"） | `expect(skipConfirmDialog).toBeShownWhenSkippingIncomplete(); expect(dialog).toHaveButtons(['确认跳过', '继续分析']);` | 【需页面集成】 |
| F2.4 | 中断恢复 | 相同需求输入可基于 sessionId 继续上次分析（断点续传） | `expect(resumeSessionBtn).toBeVisible(); expect(partialData).toBeRestoredOnResume();` | 【需页面集成】 |

**Epic 2 DoD**:
- [ ] F2.1 单独可交付（最关键，阻塞用户体验）
- [ ] F2.2 + F2.3 + F2.4 可后续迭代
- [ ] 无 Step 间数据丢失

---

### Epic 3: 用户漏斗监控体系（P1，增长基础设施）

**目标**: 建立数据驱动的产品决策基础，核心漏斗事件全埋点

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | 核心漏斗事件定义 | homepage_view / requirement_submitted / step{1-4}_completed / canvas_view / project_created | `expect(Object.keys(analyticsEvents).sort()).toEqual(['canvas_view','homepage_view','project_created','requirement_submitted','step1_completed','step2_completed','step3_completed','step4_completed']);` | 【需页面集成】 |
| F3.2 | 轻量埋点接入 | Plausible/Umami 接入（GDPR 合规，无需 cookie consent） | `expect(trackerScript).toBeLoaded(); expect(pageview).toBeTrackedOnNavigation();` | 【需页面集成】 |
| F3.3 | 漏斗 Dashboard | 每日/每周漏斗数据可视化（每步转化率） | `expect(dashboardUrl).toBeAccessible(); expect(funnelChart).toShowConversionRates();` | 【需页面集成】 |
| F3.4 | Session 行为序列 | 记录每个 session 的完整步骤序列 | `expect(sessionEvents).toBeStored(); expect(eventSequence).toInclude('homepage_view');` | 【需页面集成】 |

**Epic 3 DoD**:
- [ ] F3.1 + F3.2 必须同时上线
- [ ] F3.3 + F3.4 可后续迭代
- [ ] analytics 数据 7 天内可见

---

### Epic 4: 项目导出能力（P1，用户-facing）

**目标**: 用户可将 DDD 建模成果导出为 JSON/Markdown/Mermaid，解除平台锁定顾虑

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | JSON 导出 | 导出完整的 BoundedContext + BusinessFlow + ComponentTree | `expect(exportedJson).toHaveProperty('boundedContexts'); expect(exportedJson).toHaveProperty('businessFlows'); expect(exportedJson).toHaveProperty('components');` | 【需页面集成】 |
| F4.2 | Markdown 导出 | 导出领域模型为 Markdown 文档（含表格和代码块） | `expect(exportedMd).toMatch(/^# /); expect(exportedMd).toMatch(/\\|.*\\|/);` | 【需页面集成】 |
| F4.3 | Mermaid 导出 | 导出业务流程图为 Mermaid 文本 | `expect(exportedMermaid).toMatch(/^flowchart/); expect(mermaidLiveEditor.render(exportedMermaid)).toBeValid();` | 【需页面集成】 |
| F4.4 | 导出入口 UI | Canvas toolbar 或项目菜单中增加导出按钮 | `expect(exportButton).toBeVisible(); expect(exportMenu).toHaveItems(['JSON','Markdown','Mermaid']);` | 【需页面集成】 |

**Epic 4 DoD**:
- [ ] F4.1 + F4.4 最小可行版本（MVP）
- [ ] F4.2 + F4.3 增强功能
- [ ] Mermaid 导出可粘贴至 Mermaid Live Editor 正确渲染

---

### Epic 5: 工程效率 Sprint（P1，内部工具）

**目标**: 解决内部工程债，解锁团队协作效率

#### 功能点

| ID | 功能点 | 描述 | 验收标准 |
|----|--------|------|----------|
| F5.1 | Canvas 状态管理规范 | `selectedNodeIds` vs `node.confirmed` 两套状态合一，checkbox 操作成功率 ≥95% | `expect(checkboxSuccessRate).toBeGreaterThanOrEqual(0.95);` |
| F5.2 | 自检报告路径规范化 | 统一路径：`/workspace-{agent}/proposals/YYYYMMDD/{agent}.md` | `expect(allProposalPaths).toMatch(/^\\/workspace-\\w+\\/proposals\\/\\d{8}\\//);` |
| F5.3 | Exec Health Check | 心跳脚本增加 exec 工具可用性检测，断裂时告警 | `expect(exec('echo test').output).toBe('test');` |
| F5.4 | 提案生命周期追踪 | 提案从提交到执行全流程追踪，执行率 ≥60% | `expect(proposalTrackingTable).toExist(); expect(executionRate).toBeGreaterThanOrEqual(0.6);` |

**Epic 5 DoD**:
- [ ] F5.1 checkbox 成功率 ≥95%（QA 验证）
- [ ] F5.2 路径规范化 100% 达标
- [ ] F5.3 集成到 HEARTBEAT.md

---

### Epic 6: 测试质量保障（P1，CI/CD）

**目标**: 建立稳定的 E2E 测试基础设施，保障发布质量

#### 功能点

| ID | 功能点 | 描述 | 验收标准 |
|----|--------|------|----------|
| F6.1 | E2E Playwright 规范 | 统一测试目录（`tests/e2e/`），5+ E2E 用例覆盖核心流程 | `expect(testDirectory).toBe('tests/e2e/'); expect(e2eTestCount).toBeGreaterThanOrEqual(5);` |
| F6.2 | CI 测试质量 Gate | 测试失败 Slack 通知 < 5min，覆盖率 < 80% 阻止合并 | `expect(coverageThreshold).toBe(80); expect(slackNotificationDelay).toBeLessThan(300000);` |
| F6.3 | CardTreeNode React 19 兼容 | 15 个失败测试全部修复 | `expect(cardTreeNodeTests).toHaveLength(15); expect(cardTreeNodeTests.every(t => t.status === 'pass')).toBe(true);` |

**Epic 6 DoD**:
- [ ] F6.1 + F6.2 可独立交付
- [ ] F6.3 与 Sprint 1 并行
- [ ] CI pipeline 绿色稳定

---

## 4. UI/UX 流程图

### 用户旅程（核心路径）

```
[首页访问] → [输入需求] → [Step1 AI澄清] → [Step2 业务流程] → [Step3 组件图] → [Step4 领域模型] → [创建项目] → [Canvas编辑]
                                    ↓                      ↓                      ↓                      ↓
                              [进度指示]              [进度指示]              [进度指示]              [进度指示]      [引导体系]
                              [中断恢复]              [中断恢复]              [中断恢复]              [中断恢复]      [空状态引导]
                                                                                                      [导出能力]
```

### Canvas 画布交互流程

```
[打开 Canvas]
  → [有数据] → [显示三栏内容 + 连线图例 + 节点标记 tooltip]
  → [无数据] → [空状态引导文案 + toolbar tooltip]
  → [点击导出] → [导出菜单: JSON / Markdown / Mermaid]
```

---

## 5. 验收标准总表

| ID | 验收条件 | 测试断言 |
|----|---------|----------|
| AC-001 | 三栏 empty state 有引导文案 | `expect(getAllByText(/创建\|上传/).length).toBeGreaterThan(0);` |
| AC-002 | toolbar 按钮有 tooltip | `expect(document.querySelectorAll('[data-tooltip]').length).toBeGreaterThan(3);` |
| AC-003 | Canvas 角落显示连线图例 | `expect(legendElement).toBeVisible();` |
| AC-004 | start/end 标记有 tooltip | `expect(markers.every(m => m.title.length > 0)).toBe(true);` |
| AC-005 | AI 生成中显示进度指示 | `expect(progressIndicator).toBeVisible();` |
| AC-006 | Session 刷新后恢复 | `expect(currentStepAfterRefresh).toBe(currentStepBefore);` |
| AC-007 | 跳过未完成步骤有确认 | `expect(skipDialog).toBeShown();` |
| AC-008 | 漏斗事件全埋点 | `expect(Object.keys(events).sort()).toEqual(FUNNEL_EVENTS);` |
| AC-009 | Dashboard 可查看数据 | `expect(dashboard).toBeAccessible();` |
| AC-010 | JSON 导出包含三树数据 | `expect(json).toHaveProperty('boundedContexts');` |
| AC-011 | Mermaid 导出可渲染 | `expect(mermaidLiveEditor.validate(mermaid)).toBe(true);` |
| AC-012 | checkbox 操作成功率 ≥95% | `expect(successRate).toBeGreaterThanOrEqual(0.95);` |
| AC-013 | E2E 测试目录统一 | `expect(e2eDir).toBe('tests/e2e/');` |
| AC-014 | CI 覆盖率阈值 80% | `expect(coverageThreshold).toBe(80);` |
| AC-015 | CardTreeNode 15 测试全通过 | `expect(failedTests).toHaveLength(0);` |

---

## 6. 非功能需求

| 类型 | 要求 |
|------|------|
| **性能** | Canvas 100 节点渲染 < 100ms；导出 JSON < 500ms |
| **可访问性** | 所有 tooltip 支持 keyboard focus；符合 WCAG 2.1 AA |
| **隐私合规** | analytics 工具必须 GDPR/CCPA 合规（Plausible/Umami） |
| **向后兼容** | 导出 JSON 格式版本化（v1.0），避免破坏现有集成 |
| **监控** | 上线后漏斗数据 7 天内可见，异常立即告警 |

---

## 7. 实施计划

### Sprint 1（本周）

| Epic | 功能 | 工时 | 负责人 |
|------|------|------|--------|
| P0 | ESLint pretest 降级（D-001） | 1h | dev |
| Epic 1 | F1.1 空状态引导 + F1.2 Toolbar tooltip | 1.5h | dev |
| Epic 2 | F2.1 AI 进度指示 | 1h | dev |
| Epic 6 | F6.3 CardTreeNode React 19 兼容 | 2h | dev |

### Sprint 2（1-2 周）

| Epic | 功能 | 工时 | 负责人 |
|------|------|------|--------|
| Epic 1 | F1.3 连线图例 + F1.4 节点标记 | 1h | dev |
| Epic 2 | F2.2 Session 持久化 | 2h | dev |
| Epic 2 | F2.3 跳步保护 + F2.4 中断恢复 | 4h | dev |
| Epic 3 | F3.1 事件定义 + F3.2 埋点接入 | 3h | dev |
| Epic 3 | F3.3 Dashboard + F3.4 Session 分析 | 4h | dev |
| Epic 4 | F4.1 JSON 导出 + F4.4 导出入口 | 1.5h | dev |
| Epic 4 | F4.2 Markdown + F4.3 Mermaid | 3h | dev |

### Sprint 3（月度）

| Epic | 功能 | 工时 | 负责人 |
|------|------|------|--------|
| Epic 5 | F5.1 状态管理规范 + F5.2 路径规范 | 5h | dev |
| Epic 5 | F5.3 Health Check + F5.4 生命周期追踪 | 4h | dev |
| Epic 6 | F6.1 E2E 规范 + F6.2 CI Gate | 3h | tester |

**总工时**: ~33h（不含 Sprint 3 细化）

---

## 8. DoD（完成定义）

### 每个功能点的 DoD

1. 功能代码实现完成
2. 单元测试覆盖（覆盖率高 > 80%）
3. `npm run build` 通过，TypeScript 0 errors
4. ESLint 0 warnings
5. gstack screenshot 验证 UI 符合预期
6. PR 创建并通过 review

### Epic 完成标准

- 所有功能点验收通过
- QA 报告签署
- 已更新 CHANGELOG.md
