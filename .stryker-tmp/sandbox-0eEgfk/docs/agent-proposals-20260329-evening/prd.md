# PRD: Agent 流程与质量改进 — 晚间提案 — 2026-03-29

**文档版本**: v1.0  
**日期**: 2026-03-29 晚间  
**作者**: PM Agent  
**状态**: Ready for Architect Review  
**数据来源**: `analysis.md` | 13 条提案汇总（Analyst/Dev/PM/Tester/Reviewer）

---

## 一、项目概述

### 1.1 背景

2026-03-29 晚间场各 Agent 从专业视角提交了 13 条改进提案，源自 canvas-phase2 全流程复盘与 morning session 优先级排序。核心洞察：

1. **Dev 自主性范式转移** — canvas-phase2 从 PRD → Architecture → Implementation → Review → Land 全部由 Dev 自主驱动，Coord 仅在最后标记完成
2. **Epic 规模是质量杠杆** — Epic 越小 → Review 周期越短 → 返工成本越低
3. **提案从「汇总」升级为「追踪」** — morning session 18 条提案大部分仍待领取，提案流程只解决了「生成」问题，未解决「执行」问题

### 1.2 目标

建立三大机制，推动 Agent 团队从「Coord 指挥」到「Dev 自主」的范式转移：
- **执行追踪闭环**：提案从提交到落地的自动追踪
- **质量基线体系**：Sprint 速度基线 + Epic 规模标准 + Review Gate
- **Canvas 技术债务**：状态分层 + E2E 覆盖 + 性能基线

### 1.3 范围

| 包含 | 不包含 |
|------|--------|
| 提案执行追踪自动化（proposal_tracker.py） | Canvas 功能演进 |
| Sprint 速度基线建立 | 后端 API 重构 |
| Epic 规模标准化追踪 | 非 VibeX 项目 |
| Dev 自主认领规范 | |
| canvasStore 状态分层 | |
| Canvas E2E 测试覆盖 | |
| Review Gate 标准化 | |
| Phase 文件格式规范 | |

---

## 二、Epic 划分与 Story 拆分

---

### Epic 1: 提案执行追踪闭环（Proposal Execution Tracking）📋

**目标**: 建立提案从提交到落地的自动追踪机制，解决 morning session 提案积压问题。

| Story | 标题 | 负责 | 工时 | 优先级 |
|-------|------|------|------|--------|
| E1.1 | proposal_tracker.py 自动化脚本 | dev | 2h | **P0** |
| E1.2 | Sprint 速度基线建立 | analyst | 1d | **P1** |
| E1.3 | Epic 规模标准化落地追踪 | analyst | 0.5d | **P1** |
| E1.4 | Sprint 回顾机制建立 | pm | 1d | **P2** |

#### E1.1 proposal_tracker.py 自动化脚本

**问题**: morning session 的 P0 提案（A1/P0-4）要求建立 `proposals/EXECUTION_TRACKER.md`，但手动维护易失效（状态更新滞后、提案认领后无人跟进），历史教训（20260324 汇总 21 条提案大部分仍待领取）。

**验收标准**:
```typescript
// E1.1 验收标准
expect(proposal_tracker.run_time, "proposal_tracker.py 执行 < 10s").toBeLessThan(10);
expect(EXECUTION_TRACKER.json.exists, "proposals/EXECUTION_TRACKER.json 存在").toBe(true);
expect(EXECUTION_TRACKER.md.exists, "proposals/EXECUTION_TRACKER.md 存在").toBe(true);
expect(tracker.status_accuracy, "追踪状态与 task_manager 一致性 > 95%").toBeGreaterThan(0.95);
expect(tracker.claim_rate_improvement, "提案认领率周环比提升 > 10%").toBeGreaterThan(0.1);

// 实现步骤:
// S1. 扫描 proposals/ 下所有日期目录，解析 summary.md
// S2. 查询 task_manager 任务状态，构建状态映射
// S3. 生成 EXECUTION_TRACKER.json + EXECUTION_TRACKER.md
// S4. 接入 cronjob，每日自动运行（覆盖历史提案 + 新提案）
```

**DoD**: `proposal_tracker.py` 执行 < 10s；生成的追踪表与 task_manager 状态一致；cronjob 每日自动运行。

---

#### E1.2 Sprint 速度基线建立

**问题**: canvas-phase2（16 任务/1天）vs canvas-expandable（27 任务/3天，含大量返工），缺乏统一 Sprint 速度基线导致工时估算偏差。

**验收标准**:
```typescript
// E1.2 验收标准
expect(SPRINT_BASELINE.exists, "vibex/SPRINT_BASELINE.md 存在").toBe(true);
expect(SPRINT_BASELINE.categories.count, "覆盖 5 种类型（Bug Fix / UI优化 / Feature小 / Feature中 / Feature大）").toBe(5);
expect(historical_projects_calibrated, "历史项目校准数 ≥ 10").toBeGreaterThanOrEqual(10);
expect(estimation.error_rate, "新估算误差率 < 30%").toBeLessThan(0.3);

// 基线模板:
// | 类型 | 任务复杂度 | 速度基线 | 示例 |
// | Bug Fix | 单文件/单函数 | 1-2h | page.test.tsx 修复 |
// | UI 优化 | 3-5 文件 | 2-4h | ErrorBoundary 去重 |
// | Feature 小 | 5-10 文件 | 0.5-1d | expand-both 模式 |
// | Feature 中 | 10-20 文件 | 2-3d | confirmationStore 重构 |
// | Feature 大 | 20+ 文件 | 5-7d | canvas-feature-gap |
```

**DoD**: `SPRINT_BASELINE.md` 存在；覆盖 5 种类型；10+ 历史项目校准；新估算误差率 < 30%。

---

#### E1.3 Epic 规模标准化落地追踪

**问题**: `vibex-canvas-feature-gap`（18 功能点）是普通 Epic 的 4-5 倍，PM 拆分建议存在但无强制执行机制。

**验收标准**:
```typescript
// E1.3 验收标准
expect(epic.scale_check.count, "本轮新增 Epic 100% 经过规模检查").toBe(1.0);
expect(epic.oversized_rejected, "超大 Epic（16+ 功能点）打回率 > 0").toBeGreaterThan(0);
expect(epic.average_size, "平均 Epic 规模 ≤ 8 功能点").toBeLessThanOrEqual(8);
expect(architect.veto_count, "Architect Epic 规模否决权使用次数 ≥ 0").toBeGreaterThanOrEqual(0);

// 规模阈值:
// ✅ 标准 Epic: 3-8 功能点 → 直接进入 phase2
// ⚠️ 大 Epic: 9-15 功能点 → 必须拆分 sub-Epic
// 🔴 超大 Epic: 16+ 功能点 → 强制拆分 + Coord 审批

// 流程:
// S1. PM 在 prd.md 标注功能点总数
// S2. Architect 在 architecture.md 检查 Epic 数量
// S3. 不符合标准 → 打回 PM 重新拆分
```

**DoD**: 所有新增 Epic 经过规模检查；平均规模 ≤ 8 功能点；超大 Epic 有 Coord 审批记录。

---

#### E1.4 Sprint 回顾机制建立

**问题**: 每日项目完成但无周期性 Sprint 回顾积累经验教训，LEARNINGS.md 主要记录个人学习，无团队级回顾文档，相似问题反复出现。

**验收标准**:
```typescript
// E1.4 验收标准
expect(sprint_review.trigger, "每完成 5 个项目自动触发回顾").toBe(true);
expect(sprint_review.patterns.count, "每回顾识别 ≥ 2 个跨项目模式").toBeGreaterThanOrEqual(2);
expect(sprint_review.action_completion, "Action Items 完成率 > 60%").toBeGreaterThan(0.6);
expect(sprint_review.template.exists, "vibex/docs/SPRINT_RETRO_TEMPLATE.md 存在").toBe(true);

// Sprint 回顾模板包含:
// ## 速度指标（完成项目数 / 总任务数 / 平均项目耗时 / 质量分数）
// ## What Went Well（3 条）
// ## What Could Be Improved（3 条）
// ## Action Items（改进项 / 负责人 / 截止）
// ## 跨项目模式识别（模式 / 影响项目 / 建议解决方案）
```

**DoD**: 每 5 个项目自动触发 Sprint 回顾；每次回顾识别 ≥ 2 个跨项目模式；Action Items 完成率 > 60%。

---

### Epic 2: Dev 自主性提升（Dev Autonomy）🖥️

**目标**: 固化和推广 canvas-phase2 揭示的 Dev 自主驱动范式，让 Coord 从「派发任务」转向「建立机制」。

| Story | 标题 | 负责 | 工时 | 优先级 |
|-------|------|------|------|--------|
| E2.1 | Dev 自主认领规范固化 | coord + dev | 0.5d | **P1** |
| E2.2 | Code Review 报告可执行性提升 | reviewer | 0.5d | **P2** |

#### E2.1 Dev 自主认领规范固化

**问题**: Dev 单日完成 4 Epic（canvas-phase2）是 Dev 自主驱动的偶发现象，未固化为机制，Coord 仍需大量协调工作。

**验收标准**:
```typescript
// E2.1 验收标准
expect(Dev.idle_time_avg, "Dev 平均 idle 时间 < 15min").toBeLessThan(15);
expect(Dev.self_claim_rate, "Dev 自主认领率 > 50%").toBeGreaterThan(0.5);
expect(Coord.dispatch_workload, "Coord 派发工作量降低 30%").toBeLessThanOrEqual(0.7);
expect(AGENTS.md.updated, "AGENTS.md 更新 Dev 自主认领规范").toBe(true);

// 自主认领规范:
// 1. 触发条件: Dev idle > 30min + task_manager 有 pending 任务（dev 标签）
// 2. 回报机制: 认领后 update in-progress / 完成时 update done + #coord 回报
// 3. 阻塞上报: #coord 上报，说明阻塞原因和建议方案
// 4. 禁止事项: 不得跳过 phase1 / 不得认领非 dev 标签任务
```

**DoD**: `AGENTS.md` 更新 Dev 自主认领规范；Dev 自主认领率 > 50%；Coord 派发工作量降低 30%。

---

#### E2.2 Code Review 报告可执行性提升

**问题**: 现行 code review 报告包含问题列表，但无优先级排序和预计修复工时，Dev 处理反馈时无明确顺序。

**验收标准**:
```typescript
// E2.2 验收标准
expect(review.report.priority_sorting, "所有 Review 报告有 P0-P2 分级").toBe(true);
expect(review.report.fix_time_estimates, "所有 P0-P1 问题有预计修复时间").toBe(true);
expect(review.report.dev_feedback, "Dev 对 Review 报告满意度 > 80%").toBeGreaterThan(0.8);
expect(review_report_template.exists, "vibex/skills/gstack-review/REVIEW_REPORT_TEMPLATE.md 存在").toBe(true);

// Review 报告分级:
// ## P0 问题（阻断级）: 必须修复，否则无法合并
// ## P1 问题（建议级）: 下个 Sprint 修复
// ## P2 问题（可选级）: 建议修复，可接受合并
```

**DoD**: Review 报告模板存在；所有报告有 P0-P2 分级和预计工时；Dev 满意度 > 80%。

---

### Epic 3: Canvas 状态与质量（Canvas State & Quality）🎨

**目标**: 基于 canvas-phase2 成果，建立 Canvas 状态分层规范、E2E 测试覆盖和性能基线。

| Story | 标题 | 负责 | 工时 | 优先级 |
|-------|------|------|------|--------|
| E3.1 | canvasStore 状态管理标准化 | dev | 1d | **P1** |
| E3.2 | Canvas E2E 测试覆盖率提升 | tester | 1d | **P0** |
| E3.3 | SVG Overlay 性能基线 | tester | 1d | **P2** |
| E3.4 | dedup 生产验证（延续） | dev + tester | 2d | **P1** |

#### E3.1 canvasStore 状态管理标准化

**问题**: canvas-phase2 在 canvasStore 中添加了 `expandMode` + `maximize` 状态，但 Canvas 相关状态分散（canvasStore / flowStore / componentTreeStore），5 层 SVG overlay 需要跨 store 协调，依赖 props drilling 或 context。

**验收标准**:
```typescript
// E3.1 验收标准
expect(canvasStore.modules.count, "Canvas 状态模块数 3-4 个").toBeLessThanOrEqual(4);
expect(canvasStore.locations_consistent, "状态定义与使用位置一致性检查通过").toBe(true);
expect(overlay.coordination, "5 层 overlay 跨 store 协调无 prop drilling").toBe(true);
expect(migration.backward_compat, "所有既有 useCanvasStore() 调用无需修改").toBe(true);

// 状态分层方案:
// src/stores/
// ├── canvasLayoutStore.ts    // 布局状态（expandMode, maximize, grid columns）
// ├── canvasDataStore.ts     // 数据状态（boundedContexts, flows, components）
// ├── canvasSelectionStore.ts // 选择状态（selected BC/flow/component）
// └── canvasOverlayStore.ts  // 渲染状态（overlay visibility, z-index）
```

**DoD**: Canvas 状态模块数 ≤ 4；5 层 overlay 跨 store 无 prop drilling；所有既有调用向后兼容。

---

#### E3.2 Canvas E2E 测试覆盖率提升

**问题**: canvas-phase2 完成了全屏展开和关系可视化，但 Playwright E2E 测试仅覆盖基础功能，SVG overlay 层完全未测试，开发者无法通过 E2E 验证 Phase2 功能正确性。

**验收标准**:
```typescript
// E3.2 验收标准
expect(canvas_e2e.coverage, "Canvas E2E 测试覆盖率 ≥ 80%").toBeGreaterThanOrEqual(0.8);
expect(canvas_e2e.phase2_covered, "canvas-phase2 核心功能 100% E2E 覆盖").toBe(1.0);
expect(canvas_e2e.overlay_tested, "SVG overlay pointer-events 测试存在").toBe(true);
expect(canvas_e2e.fullscreen_expand_covered, "全屏展开模式 E2E 测试存在").toBe(true);
expect(canvas_e2e.relationship_viz_covered, "关系可视化（BC 连线）E2E 测试存在").toBe(true);

// 测试用例清单:
// 1. 全屏展开 expand-both 模式三栏等宽
// 2. SVG overlay 层 pointer-events: none 不阻挡节点交互
// 3. 关系可视化 BC 连线正确渲染
// 4. 全屏 maximize 模式工具栏隐藏
// 5. ESC 快捷键退出全屏
```

**DoD**: Canvas E2E 测试覆盖率 ≥ 80%；canvas-phase2 核心功能 100% 覆盖；SVG overlay pointer-events 测试存在。

---

#### E3.3 SVG Overlay 性能基线

**问题**: canvas-phase2 的 5 层 SVG overlay（z-index 10-60）在节点数增加时可能引发性能问题，但无性能基线监控，20+ BC 节点时全部重绘，50 BC = 1225 条连线。

**验收标准**:
```typescript
// E3.3 验收标准
expect(performance.test.count, "Canvas 性能测试用例 ≥ 5").toBeGreaterThanOrEqual(5);
expect(performance.bc20_render, "20 BC 节点渲染 < 100ms").toBeLessThan(100);
expect(performance.bc50_fps, "50 BC 节点 FPS ≥ 30").toBeGreaterThanOrEqual(30);
expect(performance.bc100_no_crash, "100 BC 节点无崩溃").toBe(true);

// 性能测试用例:
// 1. 20 BC 节点渲染时间 < 100ms
// 2. 50 BC 节点 FPS ≥ 30（无帧丢失）
// 3. 100 BC 节点无崩溃
// 4. 全屏展开模式性能基线
// 5. 关系可视化连线性能基线
```

**DoD**: 性能测试用例 ≥ 5；20 BC 渲染 < 100ms；50 BC FPS ≥ 30；100 BC 无崩溃。

---

#### E3.4 dedup 生产验证（延续）

**问题**: morning session 的 T4 dedup 生产验证（E1.4）仍未完成，dedup 对真实大规模提案数据的有效性未知。

**验收标准**:
```typescript
// E3.4 验收标准
expect(dedup.false_positive_20260324, "20260324 误报率 < 1%").toBeLessThan(0.01);
expect(dedup.false_negative_20260329, "20260329 漏报率 < 5%").toBeLessThan(0.05);
expect(dedup.perf_50_proposals, "50 条提案处理 < 5s").toBeLessThan(5);
expect(dedup.sensitive_info_leak, "敏感信息不泄露").toBe(false);

// 验证步骤:
// S1. 在 20260324（21 条提案）上运行 dedup → 记录误报率
// S2. 在 20260329（18 条提案）上运行 dedup → 记录漏报率
// S3. 模拟 50 条提案压测 dedup 性能 → 记录响应时间
```

**DoD**: 20260324 误报率 < 1%；20260329 漏报率 < 5%；50 条提案处理 < 5s；无敏感信息泄露。

---

### Epic 4: Phase 文件与 Review Gate（Process Standardization）📐

**目标**: 标准化 Phase 文件格式，建立四阶段 Review Gate 机制，提升代码质量前置保障。

| Story | 标题 | 负责 | 工时 | 优先级 |
|-------|------|------|------|--------|
| E4.1 | Phase 文件格式规范升级落地 | dev | 0.5d | **P2** |
| E4.2 | Epic Review Gate 标准化 | reviewer | 0.5d | **P1** |

#### E4.1 Phase 文件格式规范升级落地

**问题**: `__FINAL__` Phase 文件标记规范存在但无强制验证机制，命名规范缺失，内容结构不统一，自动化工具难以解析。

**验收标准**:
```typescript
// E4.1 验收标准
expect(phase_file.naming_consistency, "所有 Phase 文件符合 kebab-case（task-phase.md）").toBe(1.0);
expect(phase_file.metadata_completeness, "所有 Phase 文件有完整元数据（状态/开始时间/完成时间）").toBe(1.0);
expect(phase_file.final_tag_rate, "__FINAL__ 标记率 > 95%").toBeGreaterThan(0.95);
expect(phase_file.content_structure, "所有 Phase 文件包含: 执行摘要 + 产出清单 + 发现与问题 + 下一步行动").toBe(true);

// 标准化格式:
// # {Task 名称} — Phase {N}
// **状态**: in-progress | done
// **开始时间**: {timestamp}
// **完成时间**: {timestamp}
//
// ## 执行摘要（3 句话内）
// ## 产出清单
// ## 发现与问题
// ## 下一步行动
// <!-- __FINAL__ -->
```

**DoD**: 所有 Phase 文件符合 kebab-case 命名；完整元数据；`__FINAL__` 标记率 > 95%。

---

#### E4.2 Epic Review Gate 标准化

**问题**: 现行流程 Architect → PM → Dev 流转顺畅，但 Reviewer 介入点不明确，canvas-phase2 的 architecture.md 未经过独立的 Architect Review Gate，架构问题在实现后期才暴露。

**验收标准**:
```typescript
// E4.2 验收标准
expect(review_gate.gates.count, "4 个 Review Gate 全部定义").toBe(4);
expect(review_gate.checklist.count, "每个 Gate 有 ≥ 5 项检查").toBeGreaterThanOrEqual(20);
expect(review_gate.rejection_rate, "Review Gate 拦截率 > 0（真实拦截）").toBeGreaterThan(0);
expect(architect_gate.exists, "Epic 规模检查（3-8 功能点标准）纳入 Gate 3").toBe(true);

// 四阶段 Review Gate:
// Gate 1: Analysis Review（Analyst → PM）
//   - [ ] 问题陈述清晰（能否用一句话描述）
//   - [ ] 影响范围量化
//   - [ ] 数据支撑充分

// Gate 2: PRD Review（PM → Architect）
//   - [ ] Story 数量在标准范围内（3-8 个）
//   - [ ] 验收标准全部为 expect() 格式
//   - [ ] 依赖关系图完整

// Gate 3: Architecture Review（Architect → Coord）
//   - [ ] 技术选型有 trade-off 分析
//   - [ ] 风险评估包含缓解措施
//   - [ ] Epic 拆分符合规模标准（3-8 功能点）
//   - [ ] 超大 Epic（16+）有 Coord 审批记录

// Gate 4: Code Review（Dev → Reviewer → Coord）
//   - [ ] 无 P0/P1 违规项
//   - [ ] 测试覆盖率 ≥ 80%
//   - [ ] 无安全漏洞
```

**DoD**: 4 个 Review Gate 全部定义；每个 Gate ≥ 5 项检查；Epic 规模检查纳入 Gate 3；真实拦截率 > 0。

---

## 三、优先级矩阵

### 3.1 P0 — 立即处理（本周完成）

| ID | Epic.Story | 标题 | 负责 | 工时 | 理由 |
|----|-----------|------|------|------|------|
| **E3.2** | P0-1 | Canvas E2E 测试覆盖率提升 | tester | 1d | canvas-phase2 功能缺乏 E2E 验证保障 |
| **E1.1** | P0-2 | proposal_tracker.py 自动化脚本 | dev | 2h | 解锁所有提案执行追踪，最高 ROI 改进 |

**执行顺序**: E1.1 和 E3.2 可并行

---

### 3.2 P1 — 本周完成

| ID | Epic.Story | 标题 | 负责 | 工时 |
|----|-----------|------|------|------|
| **E1.2** | P1-1 | Sprint 速度基线建立 | analyst | 1d |
| **E1.3** | P1-2 | Epic 规模标准化落地追踪 | analyst | 0.5d |
| **E3.1** | P1-3 | canvasStore 状态管理标准化 | dev | 1d |
| **E3.4** | P1-4 | dedup 生产验证（延续） | dev+tester | 2d |
| **E2.1** | P1-5 | Dev 自主认领规范固化 | coord+dev | 0.5d |
| **E4.2** | P1-6 | Epic Review Gate 标准化 | reviewer | 0.5d |

---

### 3.3 P2 — 下周规划

| ID | Epic.Story | 标题 | 负责 | 工时 |
|----|-----------|------|------|------|
| **E2.2** | P2-1 | Code Review 报告可执行性提升 | reviewer | 0.5d |
| **E3.3** | P2-2 | SVG Overlay 性能基线 | tester | 1d |
| **E4.1** | P2-3 | Phase 文件格式规范升级落地 | dev | 0.5d |
| **E1.4** | P2-4 | Sprint 回顾机制建立 | pm | 1d |

---

## 四、依赖关系图

```
📋 Epic 1: 提案执行追踪
├── E1.1 proposal_tracker.py（P0-2）─────────┐
│   └── E1.2 Sprint 速度基线（P1-1）──────────┤──→ tracker 数据支撑基线
│   └── E1.3 Epic 规模标准化（P1-2）───────────┤──→ tracker 统计 Epic 规模
│   └── E1.4 Sprint 回顾机制（P2-4）──────────────┘──→ tracker 数据驱动回顾

🖥️ Epic 2: Dev 自主性
├── E2.1 Dev 自主认领规范（P1-5）─────────────────┐
│   └── E2.2 Code Review 报告可执行性（P2-1）──────────┘──→ Dev 信任 Review 质量

🎨 Epic 3: Canvas 质量
├── E3.2 Canvas E2E 测试（P0-1）─────────────────┐
│   └── E3.3 SVG Overlay 性能基线（P2-2）──────────────┘──→ 共享 Playwright 配置

├── E3.1 canvasStore 状态分层（P1-3）─────────────┐
│   └── E3.3 SVG Overlay 性能基线（P2-2）──────────────┘──→ overlay 性能依赖状态分层

├── E3.4 dedup 生产验证（P1-4）
└──（独立，与其他 Epic 无依赖）

📐 Epic 4: 流程标准化
├── E4.2 Review Gate 标准化（P1-6）─────────────────┐
│   └── E1.3 Epic 规模标准化（P1-2）─────────────────┤──→ Gate 3 包含规模检查
│   └── E1.4 Sprint 回顾机制（P2-4）─────────────────┘──→ 回顾 Gate 拦截率

└── E4.1 Phase 文件格式规范（P2-3）
└──（独立，无上游依赖）
```

---

## 五、关键洞察（驱动决策）

### 洞察 1: Dev 自主性范式转移

canvas-phase2 从 PRD → Architecture → Implementation → Review → Land **全部由 Dev 自主驱动**，Coord 仅在最后标记完成。这是 Agent 团队从「Coord 指挥」到「Dev 自主」的范式转移信号。E2.1 固化和 E4.2 Review Gate 标准化是这一范式转移的制度保障。

### 洞察 2: Epic 规模是质量关键杠杆

canvas-feature-gap（18 功能点）vs canvas-phase2（16 任务，分 2 Epic）— 后者完成速度是前者的 **3 倍**。机制：Epic 越小 → Review 周期越短 → 返工成本越低 → Dev 专注度越高。E1.3 和 E4.2 是这一杠杆的制度化。

### 洞察 3: 提案流程从「汇总」升级为「追踪」

morning session 完成了 18 条提案的汇总，但历史提案（20260324/25/26）大部分仍待领取。根因：提案流程只解决了「生成」问题，未解决「执行」问题。E1.1 proposal_tracker.py 是最高 ROI 的改进，5 行脚本 + cronjob = 提案从提交到落地的完整闭环。

---

## 六、风险矩阵

| 风险 ID | 风险描述 | 影响 | 概率 | 缓解措施 |
|---------|---------|------|------|---------|
| **R1** | proposal_tracker.py 依赖 task_manager 稳定性 | E1.1 无法自动运行 | **中** | 先修复 E1.1 task_manager（P0-2）再接入 tracker |
| **R2** | Dev 自主认领规范不被执行 | E2.1 形同虚设 | **中** | E4.2 Review Gate 强制检查 + Coord 心跳监控认领率 |
| **R3** | Epic 规模标准执行阻力 | 超大 Epic 继续累积 | **中** | Coord 审批把关 + E1.3 追踪报告 |

---

## 七、跨 Agent 协作要求

| 协作对 | 协作内容 | 触发时机 |
|--------|---------|---------|
| coord → dev | 派发 E1.1 / E3.1 / E3.4 / E4.1 | PRD 评审通过后 |
| coord → tester | 派发 E3.2 / E3.3 / E3.4 | PRD 评审通过后 |
| coord → analyst | 派发 E1.2 / E1.3 | PRD 评审通过后 |
| coord → reviewer | 派发 E2.2 / E4.2 | PRD 评审通过后 |
| coord → pm | 派发 E1.4 | PRD 评审通过后 |
| analyst → dev | Sprint 速度基线共享给 canvasStore 重构 | E1.2 完成后 |

---

## 八、实施计划

### Sprint 0: 提案追踪（Day 1, 2026-03-30）

| Story | 负责 | 产出 | 验证方式 |
|-------|------|------|---------|
| **E1.1** proposal_tracker.py | dev | `proposal_tracker.py` + cronjob | 执行 < 10s，追踪状态准确 |
| **E3.2** Canvas E2E 测试 | tester | 5+ 个 E2E 测试用例 | 覆盖率 ≥ 80% |

### Sprint 1: 质量基线（Day 2-3, 2026-03-31~04-01）

| Story | 负责 | 产出 | 验证方式 |
|-------|------|------|---------|
| **E1.2** Sprint 速度基线 | analyst | `SPRINT_BASELINE.md` | 覆盖 5 种类型，10+ 项目校准 |
| **E1.3** Epic 规模标准化 | analyst | Epic 规模检查清单 | 平均规模 ≤ 8 功能点 |
| **E3.1** canvasStore 状态分层 | dev | 3-4 个 store 模块 | 5 层 overlay 无 prop drilling |
| **E3.4** dedup 生产验证 | dev+tester | dedup 验证报告 | 误报 < 1%，漏报 < 5% |
| **E2.1** Dev 自主认领规范 | coord+dev | `AGENTS.md` 更新 | 认领率 > 50% |
| **E4.2** Review Gate 标准化 | reviewer | 4 阶段 Gate 定义 | ≥ 20 项检查 |

### Sprint 2: 流程深化（Day 4-5, 2026-04-02~03）

| Story | 负责 | 产出 | 验证方式 |
|-------|------|------|---------|
| **E2.2** Code Review 报告可执行性 | reviewer | Review 报告模板 | 所有报告有 P0-P2 分级 |
| **E3.3** SVG Overlay 性能基线 | tester | 5+ 性能测试用例 | 20 BC 渲染 < 100ms |
| **E4.1** Phase 文件格式规范 | dev | Phase 文件格式标准 | `__FINAL__` 标记率 > 95% |
| **E1.4** Sprint 回顾机制 | pm | `SPRINT_RETRO_TEMPLATE.md` | 每 5 项目触发回顾 |

---

## 九、Open Questions 状态

| # | 问题 | 决策 | 负责人 |
|---|------|------|--------|
| OQ1 | proposal_tracker.py 扫描频率？ | 建议每天 cronjob 运行一次 | Coord |
| OQ2 | dedup 压测（50 条）是否需要真实数据？ | 建议使用匿名化提案数据，不导入真实内容 | reviewer |
| OQ3 | canvasStore 状态分层是否迁移到 Jotai/Recoil？ | 建议保持 Zustand，仅应用 slice pattern | architect |
| OQ4 | E3.3 SVG 性能测试使用 Playwright 还是 Lighthouse？ | 建议 Playwright + performance API | tester |

---

## 十、驳回红线

以下情况需驳回并返回上游：

- [ ] Story 功能点模糊，无法写 `expect()` 断言 → 驳回重回分析
- [ ] 验收标准缺失 → 驳回补充
- [ ] 优先级（P0/P1/P2）与 analysis.md 不一致 → 驳回对齐
- [ ] Epic 间依赖关系不闭环 → 驳回重绘
- [ ] 实施计划未从 P0-1 / P0-2 开始 → 驳回重排
- [ ] 跨 Agent 协作要求缺失 → 驳回补充

---

## 十一、检查清单

- [x] Epic 划分完整（4 个 Epic，覆盖所有 13 条提案）
- [x] Story 拆分粒度到位（每条 Story 可写 expect() 断言）
- [x] 验收标准断言化（所有 Story 有 expect() 格式验收标准）
- [x] 优先级矩阵清晰（P0/P1/P2 分级）
- [x] 依赖关系图绘制（Epic 间 + Story 间依赖）
- [x] 风险矩阵识别（R1 task_manager 稳定性 / R2 Dev 规范执行 / R3 Epic 规模阻力）
- [x] 关键洞察提炼（3 条范式转移洞察）
- [x] 实施计划明确（Sprint 0 从 E1.1 和 E3.2 开始）
- [x] Open Questions 状态更新
- [x] 驳回红线定义
- [x] 跨 Agent 协作要求定义

---

*PRD 完成 | PM Agent | 2026-03-29 21:15 GMT+8*
