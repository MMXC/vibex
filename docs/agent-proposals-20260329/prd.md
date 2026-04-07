# PRD: VibeX Agent 改进提案 — 2026-03-29

**文档版本**: v1.0  
**编写日期**: 2026-03-29  
**编写角色**: PM  
**数据来源**: analysis.md (Analyst, 2026-03-29 16:50 GMT+8)  
**状态**: Draft → Pending Review  

---

## 1. Executive Summary

### 1.1 背景

2026-03-29，6个 Agent（Analyst、Dev、Architect、PM、Tester、Reviewer）共提交了提案，涵盖工具链稳定性、前端质量、架构债务、AI治理4个维度。Analyst 汇总分析了这些提案，识别出 **15个技术债务项**（5项 P0-P1，10项 P2-P3），总工时约 **19.5d**。

### 1.2 目标

| # | 目标 | 对应Epic | 核心KPI |
|---|------|---------|---------|
| G1 | 工具链稳定 — 修复 task_manager 挂起、heartbeat 幽灵任务、dedup 验证、约束清单截断 | Epic 1 | 提案执行率 ≥ 80% |
| G2 | 前端质量提升 — 修复 page.test.tsx 预存失败、ErrorBoundary 去重、confirmationStore 拆分、CardTreeNode 单元测试 | Epic 2 | 单元测试通过率 100%，4预存失败清零 |
| G3 | 架构债务清理 — confirmationStore 重构、共享类型包建设、前端错误处理统一、React Query 覆盖率提升 | Epic 3 | 技术债务减少 50% |
| G4 | AI治理完善 — TASK_THREADS 实现、AI失败模式库扩展、提案执行追踪、分析报告质量检查 | Epic 4 | 提案执行追踪覆盖率 100% |

### 1.3 关键指标

| 指标 | 当前基线 | 目标 | 测量方式 |
|------|---------|------|---------|
| 提案执行率 | ~0%（21条大部分待领取） | ≥ 80%（Epic 1-4 Sprint 内） | coord 层提案追踪系统 |
| 技术债务减少 | 0（15项未处理） | 减少 50%（7-8项清零） | 技术债务清单完成度 |
| 单元测试通过率 | 96.8%（2853/2947） | 100% | `npm test` CI 报告 |
| page.test.tsx 失败数 | 4（持续9天） | 0 | `npm test` 套件报告 |
| heartbeat 准确性 | 幽灵任务误报 | 0 误报 | heartbeat 日志审计 |

---

## 2. Epic Breakdown

---

### Epic 1: 工具链稳定 Sprint (P0)

**优先级**: P0  
**Sprint**: Sprint 0（止血）  
**负责 Agent**: dev  
**总工时**: ~3.5d（4人日）  
**背景**: task_manager 挂起阻塞所有 Agent 心跳，heartbeat 幽灵任务损害报告准确性，dedup 机制缺产验证，约束清单解析存在截断 bug。

#### F1.1: task_manager 挂起修复

**问题描述**: `task_manager.py` 在 `claim` 时遇到 0 人认领或超时情况时，进程挂起而非立即返回错误，导致 Agent 心跳等待阻塞。

**验收标准**:
```
expect(task_manager.claim("nonexistent_task"), "认领不存在的任务时，立即返回错误而非挂起")
  .toEqual({ success: false, error: "TASK_NOT_FOUND" });
expect(task_manager.claim("timeout_task"), "超时场景下，max_wait=5s 超时后返回 TIMEOUT 错误")
  .toEqual({ success: false, error: "TIMEOUT", waited_ms: 5000 });
expect(process.hangCount, "修复后进程挂起次数").toBe(0);
```

**DoD**:
- [ ] `claim()` 在 0 认领时立即返回 `TASK_NOT_FOUND`
- [ ] `claim()` 支持 `max_wait` 超时参数，到期返回 `TIMEOUT`
- [ ] 新增 `test_task_manager_timeout.py` 单元测试覆盖超时场景
- [ ] 在 task_manager.py 添加超时检测逻辑（`signal.SIGALRM` 或 `threading.Timer`）

---

#### F1.2: heartbeat 幽灵任务修复

**问题描述**: heartbeat 脚本读取不存在的目录时，仍报告有"待处理任务"，产生幽灵任务误报，影响所有 Agent 心跳准确性。

**验收标准**:
```
expect(heartbeat.scan(), "扫描不存在的目录时，不产生幽灵任务")
  .toEqual({ phantom_tasks: 0, real_tasks: [], errors: [] });
expect(heartbeat.get_pending_count(), "无待处理任务时返回 0")
  .toBe(0);
expect(log.phantom_reports, "修复后幽灵报告数").toBe(0);
```

**DoD**:
- [ ] heartbeat 扫描前验证目录存在性（`os.path.isdir`）
- [ ] 目录不存在时记录 `error` 而非产生幽灵任务
- [ ] 新增 `test_heartbeat_phantom.py` 覆盖不存在目录场景
- [ ] 与 F1.1（task_manager）解耦，可独立提测

---

#### F1.3: dedup 生产验证

**问题描述**: 提案去重机制（`proposal-dedup` Epic1-2）在开发环境通过，但生产环境有效性未经实际验证。

**验收标准**:
```
expect(dedup.is_duplicate({ title: "task_manager挂起修复", agent: "dev" }), 
  "相同标题+agent的提案，第二次提交被识别为重复").toBe(true);
expect(dedup.get_dup_count(), "生产环境运行1周后，重复提案被拦截")
  .toBeGreaterThan(0);
expect(dedup.false_positive_rate, "误报率（合法提案被误判为重复）").toBeLessThan(0.01);
```

**DoD**:
- [ ] 在 `proposals/20260329/` 目录运行 dedup 脚本验证有效性
- [ ] 记录 dedup 拦截的重复提案数量和误报数量
- [ ] 补充 `test_dedup_edge_cases.py`（标题相似但非同提案的边界情况）
- [ ] 更新 `PROPOSALS.md` dedup 章节记录验证结果

---

#### F1.4: 约束清单解析截断修复

**问题描述**: 约束清单（constraints list）中的多行字符串被截断，导致报告可读性下降，部分约束信息丢失。

**验收标准**:
```
expect(parser.parse_constraints("line1\nline2\nline3"), "多行字符串完整解析，无截断")
  .toEqual(["line1", "line2", "line3"]);
expect(parser.parse_constraints("a".repeat(10000)), "超长字符串（10000字符）无截断")
  .toHaveLength(10000);
expect(report.render(), "生成的报告完整展示所有约束行").not.toContain("...");
```

**DoD**:
- [ ] 修复约束清单解析器，支持多行字符串完整解析
- [ ] 添加 `max_line_length` 配置项，允许配置单行最大长度（默认不截断）
- [ ] 新增 `test_constraints_parser.py` 覆盖单行/多行/超长场景
- [ ] regression test：现有约束清单解析结果不变

---

#### Epic 1 DoD

- [ ] F1.1、F1.2、F1.3、F1.4 全部验收标准通过
- [ ] `npm test` 新增相关测试全部通过
- [ ] coord 心跳报告准确性恢复到 100%（幽灵任务数 = 0）
- [ ] task_manager claim 操作在 0 认领时 100ms 内返回

---

### Epic 2: 前端质量 Sprint (P0-P1)

**优先级**: P0（2项）+ P1（2项）  
**Sprint**: Sprint 0-1（止血 + 稳定）  
**负责 Agent**: dev  
**总工时**: ~2.5d（4项）  
**背景**: page.test.tsx 4个预存失败持续9天损害CI可信度，ErrorBoundary 重复实现增加维护成本，confirmationStore 461行违反单一职责，CardTreeNode 缺单元测试。

#### F2.1: page.test.tsx 4预存失败修复

**问题描述**: `page.test.tsx` 从 2026-03-20 开始有 4 个测试持续失败，至今（9天）无人修复，严重损害 CI 可信度。

**验收标准**:
```
expect(page_test_results.passed, "修复后 page.test.tsx 所有测试通过")
  .toBe(page_test_results.total);
expect(page_test_results.failures, "修复后失败数为 0").toBe(0);
expect(ci.trust_score, "CI 可信度评分恢复到 100%").toBe(100);
```

**DoD**:
- [ ] 识别 4 个预存失败的根本原因（从 `npm test -- --testPathPattern=page` 输出分析）
- [ ] 修复所有 4 个失败测试
- [ ] 确认修复后连续 3 次 CI 运行均通过
- [ ] 更新 `TEST_FAILURES.md` 记录失败原因和修复方案

---

#### F2.2: ErrorBoundary 去重

**问题描述**: 项目中存在 2 份重复的 ErrorBoundary 实现（`components/ErrorBoundary.tsx` 和 `components/common/ErrorBoundary.tsx`），边界行为不一致，增加维护成本。

**验收标准**:
```
expect(error_boundary_impl_count, "ErrorBoundary 实现合并为 1 份").toBe(1);
expect(ErrorBoundary.renderBoundary(error), "两个组件渲染行为一致")
  .toEqual(expected_fallback_ui);
expect(import_paths, "所有引用 ErrorBoundary 的路径统一为 1 个").toHaveLength(1);
```

**DoD**:
- [ ] 审计 2 份 ErrorBoundary 的差异（props、fallback UI、error 收集逻辑）
- [ ] 合并为 1 份最佳实现（保留功能最完整的版本）
- [ ] 更新所有 import 路径
- [ ] 删除冗余文件
- [ ] 新增 `ErrorBoundary.test.tsx` 单元测试覆盖 error 捕获场景

---

#### F2.3: confirmationStore 拆分（重构）

**问题描述**: `confirmationStore.ts` 461行，违反 Zustand 单一职责原则，store 内混杂了确认逻辑、状态管理、副作用处理。

**验收标准**:
```
expect(store_lines, "拆分后单个 store 文件不超过 100 行").toBeLessThan(100);
expect(store.slice_count, "confirmationStore 拆分为 slices 模式")
  .toBeGreaterThanOrEqual(3);
expect(useConfirmationStore.getState().confirm, "confirm slice 独立可用")
  .toBeDefined();
expect(useConfirmationStore.getState().reject, "reject slice 独立可用")
  .toBeDefined();
expect(useConfirmationStore.getState().history, "history slice 独立可用")
  .toBeDefined();
```

**DoD**:
- [ ] 确认 `confirmationStore.ts` 当前所有状态和 actions
- [ ] 按功能拆分为 3-4 个 slices（`confirmSlice`、`rejectSlice`、`historySlice`）
- [ ] 使用 Zustand `combine` 或 `persist` middleware
- [ ] 所有既有功能（461行覆盖的场景）迁移到新 slices
- [ ] 新增 `confirmationStore.test.ts` 覆盖所有 slices
- [ ] regression test：所有使用 confirmationStore 的组件行为不变

---

#### F2.4: CardTreeNode 单元测试

**问题描述**: `CardTreeNode` 组件缺少组件级单元测试，作为核心交互组件，测试覆盖不足导致重构风险高。

**验收标准**:
```
expect(CardTreeNode_test.suite.total, "CardTreeNode 至少有 10 个测试用例").toBeGreaterThanOrEqual(10);
expect(CardTreeNode_test("collapsed").find(".expand-icon"), "折叠状态显示 expand 图标")
  .toBeDefined();
expect(CardTreeNode_test("expanded").find(".children"), "展开状态渲染子节点")
  .toBeDefined();
expect(CardTreeNode_test("selected").hasClass("selected"), "选中状态正确应用 selected class")
  .toBe(true);
```

**DoD**:
- [ ] 新建 `CardTreeNode.test.tsx`
- [ ] 覆盖 states：collapsed、expanded、selected、disabled、loading
- [ ] 覆盖 interactions：click expand/collapse、click select、hover
- [ ] 覆盖 edge cases：空子节点、超深嵌套（10层+）、大量子节点（100+）
- [ ] 使用 `@testing-library/react` 规范

---

#### Epic 2 DoD

- [ ] F2.1、F2.2、F2.3、F2.4 全部验收标准通过
- [ ] `npm test` 整体通过率恢复到 100%
- [ ] ESLint 0 errors，TypeScript 0 errors
- [ ] regression test：所有既有组件行为不变

---

### Epic 3: 架构债务 Sprint (P1-P2)

**优先级**: P1-P2  
**Sprint**: Sprint 1-2（稳定 + 演进）  
**负责 Agent**: architect + dev  
**总工时**: ~7.5d（4项）  
**背景**: confirmationStore 已拆分但需架构确认，共享类型包缺失导致前后端类型不同步，前端错误处理模式分散，React Query 覆盖率不足。

#### F3.1: confirmationStore 拆分 — Zustand Slices 重构（Architect 评审）

**问题描述**: Dev 在 Epic 2 F2.3 完成了 confirmationStore 拆分，Architect 需评审架构合理性并提供规范化建议。

**验收标准**:
```
expect(architect_review.status, "Architect 评审通过").toBe("APPROVED");
expect(slices.middleware_usage, "每个 slice 使用一致的 middleware（如 persist）").toBe(true);
expect(slices.type_exports, "slice types 独立导出，供外部类型推导使用").toBe(true);
expect(architect_review.feedback.suggestions, "Architect 提供可操作的改进建议")
  .toHaveLength(0); // 无 major issues
```

**DoD**:
- [ ] Architect 评审 `confirmationStore/` 目录的 slices 实现
- [ ] 确认 middleware 使用一致性（`persist`、`devtools` 等）
- [ ] 确认 slice types 导出规范性
- [ ] 提供 Architect 签署的评审报告（`docs/reviews/confirmationStore-review.md`）

---

#### F3.2: 共享类型包建设

**问题描述**: 前后端类型定义不同步，`api.ts` 中的 TypeScript 类型与后端数据结构不一致，导致类型推断错误。

**验收标准**:
```
expect(shared_types_pkg.location, "共享类型包位于 packages/shared-types/").toBe(true);
expect(shared_types_pkg.exports, "至少导出 Task、Proposal、Epic、Story 类型")
  .toHaveLengthGreaterThanOrEqual(4);
expect(api.types_from_shared, "前端 api.ts 使用共享类型包").toBe(true);
expect(backend.types_from_shared, "后端使用共享类型包").toBe(true);
expect(type_conflicts, "前后端类型冲突数").toBe(0);
```

**DoD**:
- [ ] 创建 `packages/shared-types/` 目录结构
- [ ] 迁移当前 `frontend/src/types/` 中可共享的类型到 shared-types
- [ ] 建立 `@vibex/shared-types` npm 包（或 workspace 引用）
- [ ] 前后端分别引用 `@vibex/shared-types`
- [ ] 新增 `shared-types.test.ts` 类型正确性验证
- [ ] Architect 签署类型包设计文档

---

#### F3.3: 前端错误处理统一

**问题描述**: 前端错误处理模式分散，`ErrorType` 枚举缺失，不同组件的降级展示（fallback UI）行为不一致。

**验收标准**:
```
expect(ErrorType_enum.values, "ErrorType 枚举覆盖 NETWORK_ERROR、API_ERROR、VALIDATION_ERROR、TIMEOUT、UNKNOWN")
  .toHaveLength(5);
expect(ErrorBoundary.renderFallback(ErrorType.NETWORK_ERROR), "NETWORK_ERROR 显示网络错误专用 UI")
  .toContain("网络连接失败");
expect(ErrorBoundary.renderFallback(ErrorType.API_ERROR), "API_ERROR 显示 API 错误专用 UI")
  .toContain("服务器错误");
expect(useErrorHandler().getMessage(ErrorType.TIMEOUT), "TIMEOUT 类型返回用户友好的错误信息")
  .toBeDefined();
expect(error_handler_code_duplication, "错误处理代码重复率降低 60%").toBeLessThan(40);
```

**DoD**:
- [ ] 创建 `frontend/src/types/error.ts` 定义 `ErrorType` 枚举
- [ ] 定义 `ErrorType` → `user_message` 映射表
- [ ] 重构 `useErrorHandler` hook 使用统一 ErrorType
- [ ] ErrorBoundary 使用 ErrorType 渲染降级 UI
- [ ] 新增 `error-handling.test.ts` 覆盖所有 ErrorType
- [ ] 更新 `ARCHITECTURE.md` 错误处理章节

---

#### F3.4: React Query 覆盖率提升

**问题描述**: 14个自定义 hooks 直接调用 `api.ts`，绕过了 React Query 的缓存、去重、错误处理机制，数据层健壮性不足。

**验收标准**:
```
expect(react_query_hooks.migrated_count, "14个自定义hooks迁移到React Query")
  .toBeGreaterThanOrEqual(14);
expect(cache.hit_rate, "React Query 缓存命中率 > 30%（数据层效率提升）").toBeGreaterThan(0.3);
expect(react_query_hooks.stale_time_configured, "每个hook配置了合理的staleTime")
  .toBe(true);
expect(query_keys.pattern_consistency, "query keys命名遵循统一模式（agent/feature/action）")
  .toBe(true);
```

**DoD**:
- [ ] 审计 14 个自定义 hooks，确认数据依赖关系
- [ ] 按优先级迁移：`useTasks` → `useQuery(tasks)`、`useProposals` → `useQuery(proposals)` 等
- [ ] 配置 `staleTime`、`retry`、`refetchOnWindowFocus` 等选项
- [ ] 统一 `queryKey` 命名规范
- [ ] 新增 `react-query-hooks.test.ts` 覆盖缓存行为
- [ ] regression test：所有既有 hooks 行为向后兼容

---

#### Epic 3 DoD

- [ ] F3.1、F3.2、F3.3、F3.4 全部验收标准通过
- [ ] Architect 签署所有架构文档（Store 评审、类型包设计、错误处理规范、React Query 规范）
- [ ] TypeScript 0 errors，类型覆盖率提升 20%
- [ ] React Query 相关 bug 数 = 0

---

### Epic 4: AI 治理 Sprint (P2-P3)

**优先级**: P2-P3  
**Sprint**: Sprint 2-3（演进 + 长期优化）  
**负责 Agent**: analyst  
**总工时**: ~3d（4项）  
**背景**: TASK_THREADS 工具链未实现导致话题追踪靠手动，MEMORY AI失败模式库待扩充，提案执行追踪机制缺失，分析报告质量参差不齐。

#### F4.1: TASK_THREADS 工具实现

**问题描述**: TASK_THREADS 话题追踪规范存在于文档中，但工具链未实现，Analyst 只能手动追踪话题，效率低且易遗漏。

**验收标准**:
```
expect(TASK_THREADS.script.location, "TASK_THREADS追踪脚本位于 scripts/task_threads_tracker.py")
  .toBeDefined();
expect(task_threads_tracker.run("--scan"), "扫描当前proposals目录，输出话题分布")
  .toContain("topic_distribution");
expect(task_threads_tracker.run("--link F1.1 F2.1"), "关联两个Story，输出关联关系")
  .toContain("linked");
expect(analyst.heartbeat.topic_coverage, "心跳报告中话题覆盖率 ≥ 90%")
  .toBeGreaterThanOrEqual(0.9);
```

**DoD**:
- [ ] 实现 `scripts/task_threads_tracker.py` 脚本
- [ ] 支持 `--scan`（扫描话题分布）、`--link`（关联话题）、`--track`（追踪执行状态）
- [ ] 集成到 Analyst 的心跳流程（`analyst-agent/heartbeat.py`）
- [ ] 新增 `test_task_threads_tracker.py` 覆盖核心功能
- [ ] 文档化 `TASK_THREADS.md` 使用规范

---

#### F4.2: MEMORY AI 失败模式扩展

**问题描述**: MEMORY.md 中的 AI Agent 失败模式库仅包含基础模式，无法覆盖实际遇到的各种失败场景，知识和经验未充分沉淀。

**验收标准**:
```
expect(MEMORY.ai_failure_patterns.count, "MEMORY AI失败模式库扩充至 ≥ 20 个模式")
  .toBeGreaterThanOrEqual(20);
expect(MEMORY.ai_failure_patterns.categories, "模式按 category 分类（communication、tooling、state、reasoning）")
  .toHaveLengthGreaterThanOrEqual(4);
expect(pattern.recovery_action, "每个模式包含 recovery_action 字段").toBe(true);
expect(pattern.examples, "每个模式包含 ≥ 2 个真实案例").toBe(true);
```

**DoD**:
- [ ] 审计 `MEMORY.md` 当前失败模式数量和覆盖度
- [ ] 从 `LEARNINGS.md` 提取真实失败案例，转化为模式
- [ ] 按 communication（通信失败）、tooling（工具链故障）、state（状态不一致）、reasoning（推理偏差）分类
- [ ] 每个模式标准化格式：`pattern_name`、`description`、`root_cause`、`recovery_action`、`examples`、`similar_patterns`
- [ ] 新增 `test_memory_patterns.py` 验证格式完整性

---

#### F4.3: 提案执行追踪机制

**问题描述**: 2026-03-24 汇总的 21条提案大部分仍为"待领取"状态，无人跟进执行状态，提案流于形式。

**验收标准**:
```
expect(proposal_tracker.location, "提案追踪系统位于 proposals/EXECUTING_TRACKER.md")
  .toBeDefined();
expect(proposal_tracker.total, "21条提案全部登记在追踪表中").toHaveLength(21);
expect(proposal_tracker.claimed_rate, "提案认领率 ≥ 60%（本周内）")
  .toBeGreaterThanOrEqual(0.6);
expect(proposal_tracker.execution_rate, "提案执行率 ≥ 40%（本周内）")
  .toBeGreaterThanOrEqual(0.4);
expect(proposal_tracker.weekly_update, "每周心跳报告中包含执行追踪摘要")
  .toBe(true);
```

**DoD**:
- [ ] 创建 `proposals/EXECUTING_TRACKER.md` 追踪表（21条提案全部登记）
- [ ] 追踪字段：`proposal_id`、`title`、`agent`、`priority`、`status`（pending/claimed/in-progress/done/blocked）、`assignee`、`deadline`、`progress_notes`
- [ ] 建立每周心跳更新机制（coord heartbeat 触发）
- [ ] coord 层自动生成执行摘要（认领率、执行率、阻塞项）
- [ ] 阻塞项自动上报 Slack #coord 频道

---

#### F4.4: 分析报告质量检查

**问题描述**: 不同 Analyst 生成的报告质量不一致，部分报告缺少风险评估和数据支撑，影响决策质量。

**验收标准**:
```
expect(report.checklist.coverage, "分析报告质量检查清单覆盖 ≥ 10 个维度")
  .toBeGreaterThanOrEqual(10);
expect(report.checklist.dimensions, "清单包含：问题陈述、影响范围、工时估算、风险评估、依赖关系、数据支撑、优先级建议、实施计划、验收标准、DoD")
  .toHaveLength(10);
expect(analyst.report_passing_rate, "Analyst报告首次通过率 ≥ 80%（使用检查清单自检后）")
  .toBeGreaterThanOrEqual(0.8);
expect(report.linter.status, "报告格式linter运行无error").toBe("PASSED");
```

**DoD**:
- [ ] 创建 `analyst/report_quality_checklist.md`（10维度检查清单）
- [ ] 开发 `scripts/report_linter.py`（格式规范检查）
- [ ] 在 Analyst 的工作流中集成检查清单自检步骤
- [ ] 回顾历史报告（3.24、3.25、3.29）应用检查清单，记录质量评分
- [ ] 将检查清单集成到 `/plan-eng-review` 或 `/plan-ceo-review` 流程

---

#### Epic 4 DoD

- [ ] F4.1、F4.2、F4.3、F4.4 全部验收标准通过
- [ ] TASK_THREADS 脚本集成到 Analyst 心跳流程并运行稳定
- [ ] MEMORY AI 失败模式库通过 Reviewer 评审
- [ ] 提案执行追踪表持续更新，每周心跳报告包含追踪摘要

---

## 3. 验收标准汇总（expect() 格式）

| Story ID | 验收标准 | 类型 |
|---------|---------|------|
| F1.1 | `task_manager.claim("nonexistent_task").toEqual({ success: false, error: "TASK_NOT_FOUND" })` | 断言 |
| F1.1 | 超时场景返回 `TIMEOUT` 错误 | 断言 |
| F1.2 | `heartbeat.scan()` 对不存在目录不产生幽灵任务 | 断言 |
| F1.3 | dedup 识别重复提案，误报率 < 1% | 断言 |
| F1.4 | 多行字符串（10000字符）完整解析无截断 | 断言 |
| F2.1 | `page.test.tsx` 所有测试通过，失败数 = 0 | 断言 |
| F2.2 | ErrorBoundary 实现合并为 1 份，import 路径统一 | 断言 |
| F2.3 | 单个 store 文件 ≤ 100 行，slice 数量 ≥ 3 | 断言 |
| F2.4 | CardTreeNode 测试用例 ≥ 10 个 | 断言 |
| F3.1 | Architect 评审 `status === "APPROVED"` | 断言 |
| F3.2 | `@vibex/shared-types` 导出 ≥ 4 个类型，前后端类型冲突 = 0 | 断言 |
| F3.3 | ErrorType 枚举覆盖 5 种错误类型，降级 UI 一致 | 断言 |
| F3.4 | 14 个自定义 hooks 迁移到 React Query，缓存命中率 > 30% | 断言 |
| F4.1 | TASK_THREADS 脚本运行成功，心跳话题覆盖率 ≥ 90% | 断言 |
| F4.2 | MEMORY AI 失败模式库 ≥ 20 个模式，≥ 4 个分类 | 断言 |
| F4.3 | 21 条提案追踪表登记完成，认领率 ≥ 60% | 断言 |
| F4.4 | 质量检查清单覆盖 10 维度，报告首次通过率 ≥ 80% | 断言 |

---

## 4. 实施计划

### Sprint 映射

| Sprint | 时间 | Epic | 核心交付 |
|--------|------|------|---------|
| Sprint 0 | 本周止血 | Epic 1（F1.1-F1.4）+ Epic 2（F2.1-F2.2） | 工具链稳定、CI可信度恢复 |
| Sprint 1 | 本周稳定 | Epic 2（F2.3-F2.4）+ Epic 3（F3.1-F3.2） | Store拆分、共享类型包 |
| Sprint 2 | 下周演进 | Epic 3（F3.3-F3.4）+ Epic 4（F4.1-F4.2） | 错误处理统一、React Query、AI治理工具 |
| Sprint 3 | 下月优化 | Epic 4（F4.3-F4.4）+ 长期债务 | 提案追踪、分析报告标准化 |

### 甘特图

```
Week 1        Week 2        Week 3        Week 4
+---------+  +---------+  +---------+  +---------+
| Sprint0 |  | Sprint1 |  | Sprint2 |  | Sprint3 |
+---------+  +---------+  +---------+  +---------+
Epic1: 4个   Epic2: 2个   Epic3: 2个   Epic4: 2个
Epic2: 2个   Epic3: 2个   Epic4: 2个   Sprint4:
                     优化
```

### 资源分配

| Agent | Sprint 0 | Sprint 1 | Sprint 2 | Sprint 3 |
|-------|----------|----------|----------|----------|
| dev | F1.1, F1.2, F2.1, F2.2 | F2.3, F2.4 | F3.3, F3.4 | 自由 |

| analyst | - | - | F4.1, F4.2 | F4.3, F4.4 |
| architect | - | F3.1, F3.2 | F3.3, F3.4 | F4.3 |
| tester | F1.3, F1.4 | F2.3, F2.4 | F3.3, F3.4 | F4.3 |

---

## 5. 依赖关系图

```
Epic 1: 工具链稳定
├── F1.1 task_manager挂起修复
│   └── F4.1 TASK_THREADS工具实现（依赖心跳脚本基础）
├── F1.2 heartbeat幽灵任务修复
│   └── F4.1 TASK_THREADS工具实现（共享心跳脚本族）
├── F1.3 dedup生产验证
└── F1.4 约束清单解析截断修复

Epic 2: 前端质量
├── F2.1 page.test.tsx修复
│   └── F2.1 → 独立，无下游依赖
├── F2.2 ErrorBoundary去重
│   └── F3.3 前端错误处理统一（前置：ErrorBoundary去重后统一错误处理）
├── F2.3 confirmationStore拆分
│   ├── 上游：Epic 1（工具链稳定后 dev 可专注重构）
│   └── 下游：F3.1 Architect评审（Epic 3）
└── F4.4 CardTreeNode单元测试
    └── F2.4 → 独立

Epic 3: 架构债务
├── F3.1 confirmationStore Architect评审
│   └── 上游：F2.3 confirmationStore拆分
├── F3.2 共享类型包建设
│   └── 下游：F3.3, F3.4（共享类型为前端重构基础）
├── F3.3 前端错误处理统一
│   └── 上游：F2.2 ErrorBoundary去重 + F3.2 共享类型包
└── F3.4 React Query覆盖率提升
    └── 上游：F3.2 共享类型包（类型安全保证）

Epic 4: AI治理
├── F4.1 TASK_THREADS工具实现
│   └── 上游：F1.1 task_manager挂起修复 + F1.2 heartbeat修复
├── F4.2 MEMORY AI失败模式扩展
│   └── 上游：LEARNINGS.md 持续积累
├── F4.3 提案执行追踪机制
│   └── 下游：Coord 层提案追踪系统
└── F4.4 分析报告质量检查
    └── 上游：F4.3 提案追踪（报告质量影响决策质量）
```

**关键路径**: F1.1 → F4.1（task_manager修复是AI治理工具的基础）

---

## 6. 风险

### R1: Dev 吞吐瓶颈（高风险）

| 维度 | 描述 |
|------|------|
| **风险** | 大部分 P0-P1 技术债务（Epic 1 全部 + Epic 2 大部分）由 dev 负责，但 dev 同时处理 Canvas 演进、样式统一等项目，吞吐量受限 |
| **影响** | Sprint 0 无法按时完成，止血目标落空 |
| **概率** | 高（历史案例：page.test.tsx 4预存失败9天无人处理） |
| **缓解措施** | 1) Coord 明确 F1.1-F1.2 为 P0，dev 优先处理；2) Epic 2 F2.3-F2.4 与 Architect 协作；3) tester 承担部分 F1.3-F1.4 验证工作；4) 提案执行追踪表驱动认领 |
| **责任人** | coord |

### R2: 提案执行率低（中风险）

| 维度 | 描述 |
|------|------|
| **风险** | 2026-03-24 汇总的 21条提案大多数仍为"待领取"状态，提案流于形式 |
| **影响** | 技术债务持续累积，Sprint 规划无法落地 |
| **概率** | 中（本次 F4.3 提案执行追踪机制将改善） |
| **缓解措施** | 1) F4.3 提案执行追踪机制立即启动；2) coord 每周心跳推送执行状态；3) 未认领提案自动上报 Slack；4) 执行率纳入 Agent 绩效考核 |
| **责任人** | analyst + coord |

### R3: 测试结构不均衡（低风险）

| 维度 | 描述 |
|------|------|
| **风险** | 2853 单元测试覆盖率高，但 E2E/Accessibility/API错误处理测试薄弱 |
| **影响** | 重构风险高，边界情况未覆盖 |
| **缓解措施** | 1) Epic 2 F2.4 新增 CardTreeNode 单元测试；2) Epic 4 规划 E2E 纳入 CI（F4.3 追踪）；3) Epic 3 F3.3 补充 API 错误处理测试 |
| **责任人** | tester + dev |

### R4: Epic 3 共享类型包建设延迟（中风险）

| 维度 | 描述 |
|------|------|
| **风险** | F3.2 共享类型包是 F3.3（错误处理统一）和 F3.4（React Query迁移）的前置依赖，建设延迟将阻塞下游两个 Epic |
| **影响** | Sprint 2 Epic 3 目标无法达成 |
| **概率** | 中 |
| **缓解措施** | F3.2 优先启动，与 F2.3 并行（dev 重构 store 时同步识别共享类型）；Architect 提前评审类型包设计方案 |
| **责任人** | architect + dev |

---

## 7. Open Questions

| # | 问题 | 优先级 | 状态 | 负责人 |
|---|------|--------|------|--------|
| OQ1 | confirmationStore 拆分时，是否需要迁移到其他状态管理方案（如 Jotai）？ | P1 | Open | architect |
| OQ2 | 共享类型包使用 npm workspace 还是直接的文件引用？ | P1 | Open | architect |
| OQ3 | TASK_THREADS 脚本是否需要支持多 Agent 并行话题追踪？ | P2 | Open | analyst |
| OQ4 | E2E 测试框架从 Playwright 迁移到其他方案是否有必要？ | P2 | Open | tester |

---

## 8. 附录

### A. 术语表

| 术语 | 定义 |
|------|------|
| DoD | Definition of Done，完成定义 |
| Sprint | 2周迭代周期 |
| Epic | 业务级大功能块，包含多个 Story |
| Story | 具体可开发的功能项，包含验收标准 |
| Phantom Task | 幽灵任务，不存在但被误报的任务 |
| Dedup | 去重机制，提案去重 |
| ErrorBoundary | React 错误边界组件 |

### B. 相关文档

| 文档 | 路径 |
|------|------|
| Analyst 分析报告 | `docs/agent-proposals-20260329/analysis.md` |
| LEARNINGS.md | `LEARNINGS.md` |
| MEMORY.md | `MEMORY.md` |
| CHANGELOG.md | `CHANGELOG.md` |
| 提案汇总（2026-03-24） | `proposals/20260324/SUMMARY.md` |
| 提案汇总（2026-03-29） | `proposals/20260329/` |

---

*PRD 完成 | PM Agent | 2026-03-29*
