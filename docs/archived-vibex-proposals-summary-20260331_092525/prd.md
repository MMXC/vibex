# PRD: VibeX 提案汇总批次2 — 2026-03-31

> **任务**: vibex-proposals-summary-20260331_092525/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **项目路径**: /root/.openclaw/vibex
> **产出物**: /root/.openclaw/vibex/docs/vibex-proposals-summary-20260331_092525/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | 本批次共 22 条提案（6 个 Agent），去重后 17 条，涵盖基础设施、Canvas UX、工程效能、测试质量四个象限 |
| **目标** | 解除基础设施阻塞 + 提升 Canvas 用户体验 + 建立工程效能基线 |
| **成功指标** | Exec 正常；checkbox 成功率 ≥95%；提案执行率 ≥60% |

### 优先级矩阵

| 类别 | 核心提案 | 产品得分 | 工时 | Sprint |
|------|---------|----------|------|--------|
| **基础设施** | D-P0-1 Exec Freeze 修复 + D-P0-2 Vitest 加速 + D-003 Coverage | 工程 | 4h | Sprint 0 |
| **Canvas UX** | A-P0-1 状态管理模块化 + P002 虚拟化 | 4.7 | 16h | Sprint 1 |
| **测试质量** | ESLint/CardTreeNode 修复 + E2E 规范 | 工程 | 10h | Sprint 1 |
| **工程效能** | 提案追踪 + HEARTBEAT Health | 工程 | 7h | Sprint 2 |

---

## 2. Epic 拆分

### Epic 1: Canvas 状态管理规范（P0，用户-facing）

**目标**: checkbox 操作成功率从 ~70% 提升至 ≥95%，状态管理清晰可预测

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S1.1 | 节点状态统一（未确认/已确认两种） | 1h | `expect(nodeStates).toHaveLength(2);` |
| S1.2 | checkbox 点击即时视觉反馈 | 1h | `expect(feedback).toBeImmediate();` |
| S1.3 | 操作成功率验证 | 1h | `expect(checkboxSuccessRate).toBeGreaterThanOrEqual(0.95);` |

**DoD**: checkbox 操作成功率 ≥ 95%，无状态冲突，EPIC 合并执行

---

### Epic 2: Canvas 虚拟化列表（P1）

**目标**: 100+ 节点渲染流畅，滚动 50+ fps

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S2.1 | @tanstack/react-virtual 引入 | 0.5h | `expect(isInstalled('@tanstack/react-virtual')).toBe(true);` |
| S2.2 | ComponentTree 虚拟化 | 2h | `expect(renderTime(100)).toBeLessThan(100);` |
| S2.3 | BusinessFlowTree 虚拟化 | 2h | `expect(renderTime(100)).toBeLessThan(100); expect(fps).toBeGreaterThan(50);` |

**DoD**: 100 节点渲染 < 100ms，滚动 50+ fps

---

### Epic 3: 基础设施修复 Sprint（P0，工程）

**目标**: 解除全团队阻塞，恢复日常工作效率

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S3.1 | D-P0-1 Exec Freeze 修复 | 2h | `expect(exec('echo test').output).toBe('test');` |
| S3.2 | D-P0-2 Vitest 加速 | 1h | `expect(vitestRunTime).toBeLessThan(10);` |
| S3.3 | ESLint pre-test 降级（--max-warnings 999） | 1h | `expect(npmTestExitCode).toBe(0);` |
| S3.4 | CardTreeNode React19 mock 修复 | 2h | `expect(cardTreeTests).toHaveLength(15); expect(allPass).toBe(true);` |
| S3.5 | Coverage threshold 细化到 canvas 目录 | 1h | `expect(threshold.canvasDir).toBe(70);` |

**DoD**: `npm test` 正常运行，CardTreeNode 15/15 通过，exec 正常

---

### Epic 4: 测试质量保障（P1）

**目标**: 建立 E2E 测试规范和 CI 质量 Gate

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S4.1 | E2E Playwright 测试规范（5+ 用例） | 6h | `expect(e2eTests).toHaveLength(5); expect(e2eBlocking).toBe(true);` |
| S4.2 | CI 测试质量 Gate（Slack <5min 告警） | 3h | `expect(slackDelay).toBeLessThan(300000); expect(coverageThreshold).toBe(80);` |

**DoD**: 5+ E2E 用例，CI blocking merge，测试失败 <5min 告警

---

### Epic 5: 工程效能 Sprint（P1，工程）

**目标**: 提案全流程可追踪，心跳脚本稳定可靠

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S5.1 | HEARTBEAT exec Health Check | 1h | `expect(execBrokenAlert).toBe(true);` |
| S5.2 | 提案生命周期追踪 dashboard | 4h | `expect(dashboard).toShowAllStates(); expect(executionRate).toBeGreaterThanOrEqual(0.6);` |
| S5.3 | task_manager 统一路径 | 2h | `expect(taskManagerLocations).toHaveLength(1);` |

**DoD**: 提案执行率 ≥60%，heartbeat 稳定

---

## 3. UI/UX 流程

### Canvas 用户交互流程（Epic 1+2）

```
[打开 Canvas]
  → [无数据] → [空状态引导文案]
  → [有数据] → [点击节点 checkbox]
  → [未确认→已确认] → [绿色高亮 + 即时反馈]
  → [100+ 节点] → [虚拟化滚动，流畅不卡顿]
```

---

## 4. 验收标准总表

| ID | 条件 | 断言 |
|----|------|------|
| AC-1 | checkbox 成功率 ≥95% | `expect(successRate).toBeGreaterThanOrEqual(0.95);` |
| AC-2 | 100 节点渲染 < 100ms | `expect(renderTime(100)).toBeLessThan(100);` |
| AC-3 | exec echo test 正常 | `expect(exec('echo test').output).toBe('test');` |
| AC-4 | npm test 正常执行 | `expect(exec('npm test').code).toBe(0);` |
| AC-5 | CardTreeNode 15 测试全通过 | `expect(failedTests).toHaveLength(0);` |
| AC-6 | E2E 5+ 用例 | `expect(e2eTests.length).toBeGreaterThanOrEqual(5);` |
| AC-7 | CI 告警 < 5min | `expect(slackDelay).toBeLessThan(300000);` |
| AC-8 | 提案执行率 ≥60% | `expect(executionRate).toBeGreaterThanOrEqual(0.6);` |

---

## 5. 非功能需求

| 类型 | 要求 |
|------|------|
| **性能** | Canvas 100 节点渲染 < 100ms；E2E 测试 < 3min |
| **可访问性** | checkbox 键盘可聚焦；虚拟化列表支持 ARIA |
| **向后兼容** | 状态管理重构不影响现有组件接口 |

---

## 6. 实施计划

| Epic | 工时 | Sprint | 负责人 |
|------|------|--------|--------|
| Epic 1: 状态管理 | 3h | Sprint 0 | dev |
| Epic 3: 基础设施修复 | 7h | Sprint 0 | dev |
| Epic 2: 虚拟化列表 | 4.5h | Sprint 1 | dev |
| Epic 4: 测试质量 | 9h | Sprint 1 | tester+dev |
| Epic 5: 工程效能 | 7h | Sprint 2 | dev |

**总工时**: ~30.5h
