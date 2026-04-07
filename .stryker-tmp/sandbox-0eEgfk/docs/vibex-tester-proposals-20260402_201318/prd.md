# VibeX 测试流程改进 PRD

**文档版本**: v1.0  
**编写日期**: 2026-04-02  
**编写角色**: PM  
**提案来源**: tester-proposals.md (2026-04-02 21:13)  
**总工时估算**: 5-7 人天

---

## 1. 执行摘要

### 背景

2026-04-02 测试日发现核心问题：**dev 实现与测试文件更新严重不同步**。当日 17 个 Epic 测试中 4 个被驳回（驳回率 24%），其中 3 个因测试文件缺失，1 个因无 dev commit。根本原因是测试准备未被纳入 DoD，dev 完成代码实现后未同步更新测试文件，导致 tester 做无用功，迭代效率大幅降低。

此外，coord 派发任务时存在派发已驳回/已完成旧状态任务的情况，重复消耗 tester 精力；Canvas 核心交互（三树切换、节点选择、确认反馈）完全无 E2E 测试覆盖。

### 目标

建立测试同步机制（DoD 强制约束），修复遗留驳回项，完善 Store 测试覆盖率，建立 Canvas E2E 基础覆盖，降低驳回率至 <5%，建立 tester 早期介入通道。

### 成功指标

| 指标 | 当前值 | 目标值 |
|-----|-------|-------|
| Epic 驳回率 | 24% (4/17) | <5% |
| Store 测试覆盖率 | 0%（新 store 无测试） | contextStore ≥80%, uiStore ≥80%, flowStore ≥80%, componentStore ≥80%, sessionStore ≥70% |
| E2E Canvas 核心交互覆盖 | 0% | ≥80% |
| tester 早期介入率 | 0% | P2+ 功能 100% 介入 |
| 状态同步异常（旧任务重派） | 反复出现 | 0 次 |
| 测试准备纳入 DoD | 否 | 是（AGENTS.md 更新） |

---

## 2. Epic / Story 分解

### Epic 1 — 强制测试同步机制（DoD 约束）

> **目标**: 将测试文件更新纳入 dev DoD，消除"代码对、测试旧"的根因  
> **工时**: 0.5 人天  
> **负责人**: dev（dev lead review AGENTS.md 变更）

| ID | Story | 工时 | 验收标准 |
|----|-------|------|---------|
| S1.1 | 更新 AGENTS.md — 测试准备为 DoD 必选项 | 0.25d | AGENTS.md 中"Definition of Done"章节明确：每条 Epic 完成后，测试文件必须同步更新，`npx jest <file> --no-coverage` 必须通过 |
| S1.2 | tester review 前快速验证 | 0.25d | tester 收到任务后，先执行 `npx jest <file> --no-coverage`，发现问题直接打回（不浪费 tester 完整测试时间） |

**验收标准**:
- [ ] AGENTS.md DoD 章节包含测试准备要求
- [ ] 新增 Epic 的测试文件与实现文件同时提交
- [ ] tester 发现测试文件未更新时可直接驳回

**依赖**: dev lead 审核 AGENTS.md 变更

---

### Epic 2 — 遗留驳回项修复

> **目标**: 修复 2026-04-02 遗留的 2 个驳回项  
> **工时**: 1 人天  
> **负责人**: dev

| ID | Story | 工时 | 验收标准 |
|----|-------|------|---------|
| S2.1 | vibex-canvasstore-refactor E5 sessionStore 补充测试 | 0.5d | `npx jest sessionStore --coverage` 通过，覆盖率 ≥70%，sessionStore 115 行代码全部覆盖 |
| S2.2 | checkbox-persist-bug E1 dev 提交代码 | 0.5d | Git 提交记录存在，PR 创建，`npx jest checkbox-persist --no-coverage` 全通过 |

**验收标准**:
- [ ] sessionStore 测试文件存在：`__tests__/sessionStore.test.ts`
- [ ] `npx jest sessionStore --coverage` 通过，覆盖率 ≥70%
- [ ] checkbox-persist-bug 有 dev commit/PR
- [ ] tester 重测通过

---

### Epic 3 — Store 拆分测试覆盖率强制要求

> **目标**: 明确每个新 store 的最低测试覆盖率要求，防止"拆完无测试"再次发生  
> **工时**: 2 人天  
> **负责人**: dev + tester

| ID | Story | 工时 | 验收标准 |
|----|-------|------|---------|
| S3.1 | 为每个新 store 创建测试文件（同步） | 0.5d | 新建 store 时，`__tests__/xxxStore.test.ts` 必须同时创建 |
| S3.2 | contextStore 覆盖率达标 | 0.5d | `npx jest contextStore --coverage`，行覆盖率 ≥80% |
| S3.3 | uiStore 覆盖率达标 | 0.5d | `npx jest uiStore --coverage`，行覆盖率 ≥80% |
| S3.4 | flowStore 覆盖率达标 | 0.25d | `npx jest flowStore --coverage`，行覆盖率 ≥80% |
| S3.5 | componentStore 覆盖率达标 | 0.25d | `npx jest componentStore --coverage`，行覆盖率 ≥80% |
| S3.6 | sessionStore 覆盖率达标 | 0.5d | `npx jest sessionStore --coverage`，行覆盖率 ≥70% |

**验收标准**:
- [ ] 所有 5 个 store 有测试文件
- [ ] 各 store 覆盖率达标（见上表）
- [ ] tester 验证覆盖率报告截图

---

### Epic 4 — Canvas 核心交互 E2E 测试

> **目标**: 为 Canvas 三棵树核心交互建立 Playwright E2E 测试基础  
> **工时**: 2 人天  
> **负责人**: dev + tester

| ID | Story | 工时 | 验收标准 |
|----|-------|------|---------|
| S4.1 | 三树切换 E2E 测试 | 0.75d | Playwright 测试覆盖：ContextTree → FlowTree → ComponentTree 切换，断言每棵树的 checkbox 数量正确 |
| S4.2 | 节点选择 E2E 测试 | 0.5d | Playwright 测试覆盖：点击节点 → checkbox 选中 → 右侧面板更新，断言选中状态 |
| S4.3 | 确认反馈 E2E 测试 | 0.5d | Playwright 测试覆盖：选中节点 → 点击确认 → 确认反馈显示 |
| S4.4 | E2E 测试稳定率验证 | 0.25d | 同一测试连续运行 3 次均通过（flaky rate <5%）|

**验收标准**:
- [ ] `npx playwright test` 覆盖三树切换、节点选择、确认反馈
- [ ] 3 个 E2E 测试文件均存在
- [ ] 连续 3 次运行均通过

---

### Epic 5 — tester 早期介入机制

> **目标**: tester 在 design review 阶段参与，避免代码完成后发现测试缺失  
> **工时**: 0.5 人天  
> **负责人**: tester + analyst + pm

| ID | Story | 工时 | 验收标准 |
|----|-------|------|---------|
| S5.1 | P2+ 功能 tester 早期介入 | 0.25d | P2 及以上功能，plan-eng-review 阶段 tester 参与 review 测试用例设计 |
| S5.2 | tester 介入触发机制 | 0.25d | coord 在派发 P2+ 功能任务时，CC tester agent 参与设计 review |

**验收标准**:
- [ ] P2+ 功能的设计阶段有 tester 参与记录
- [ ] tester 可在 design review 阶段提出测试覆盖建议

---

### Epic 6 — 状态同步机制

> **目标**: 修复 coord 派发已驳回/已完成旧状态任务的问题  
> **工时**: 0.5 人天  
> **负责人**: coord

| ID | Story | 工时 | 验收标准 |
|----|-------|------|---------|
| S6.1 | coord 派发前状态校验 | 0.25d | coord 派发任务前，读取 team-tasks JSON 检查任务状态，拒绝派发非 ready 状态的任务 |
| S6.2 | 修复通知标注 | 0.25d | dev 修复后，在 Slack 明确标注"✅ 已修复，请重新测试"，避免重复派发旧任务 |

**验收标准**:
- [ ] coord 不再派发非 ready 状态的任务
- [ ] dev 修复 Slack 消息包含明确重测标注

---

## 3. 非功能需求

| 类型 | 要求 |
|-----|-----|
| 测试稳定性 | E2E 测试 flaky rate <5% |
| 测试速度 | 单元测试套件 <60s，完整测试套件 <120s |
| 覆盖率 | 所有关键 store 行覆盖率 ≥70%，核心 store ≥80% |
| 文档更新 | AGENTS.md DoD 章节更新后，通知所有 agent |

---

## 4. Out of Scope

- 重写已有完整测试的 store（仅补充缺失测试）
- 新增单元测试框架（Jest + Playwright 已满足当前需求）
- 全量 E2E 覆盖（先建立核心交互，覆盖率目标 ≥80%）
- 视觉回归测试（未来独立项目）

---

## 5. 依赖

| 依赖方 | 依赖项 |
|-------|-------|
| Epic 1 | dev lead 审核 AGENTS.md |
| Epic 2 | dev 完成驳回项修复 |
| Epic 3 | 所有 5 个 store 代码已完成 |
| Epic 4 | Playwright 已安装配置（已有）|
| Epic 5 | coord 支持 CC 机制 |
| Epic 6 | coord 状态校验逻辑实现 |

---

## 6. 风险

| 风险 | 影响 | 缓解 |
|-----|-----|-----|
| dev 不接受 DoD 约束 | 高 | pm 明确说明这是降低驳回率的关键 |
| E2E 测试 flaky | 中 | 要求连续 3 次通过再合入 |
| tester 早期介入增加沟通成本 | 低 | 仅 P2+ 功能参与，控制范围 |

---

## 7. 工时汇总

| Epic | 工时 |
|-----|-----|
| Epic 1 — 测试同步机制 | 0.5d |
| Epic 2 — 遗留驳回项修复 | 1d |
| Epic 3 — Store 覆盖率 | 2d |
| Epic 4 — E2E 测试 | 2d |
| Epic 5 — tester 早期介入 | 0.5d |
| Epic 6 — 状态同步机制 | 0.5d |
| **总计** | **6.5 人天** |

---

## 8. Definition of Done

| Epic | DoD |
|-----|-----|
| Epic 1 | AGENTS.md 更新完成，tester 确认 DoD 约束生效 |
| Epic 2 | sessionStore 测试通过，checkbox-persist-bug 重测通过 |
| Epic 3 | 5 个 store 测试文件存在且覆盖率达标 |
| Epic 4 | 3 个 E2E 测试文件存在且稳定（3次连续通过）|
| Epic 5 | P2+ 功能 tester 介入流程文档化 |
| Epic 6 | coord 状态校验功能上线，旧任务不再重派 |
| **整体** | 驳回率降至 <5%，无遗留驳回项 |
