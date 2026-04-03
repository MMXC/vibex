# PRD: Agent 改进提案流程优化 — 2026-03-29

**文档版本**: v1.0  
**日期**: 2026-03-29  
**作者**: PM Agent  
**状态**: Ready for Architect Review  
**数据来源**: `analysis.md` | 18 条提案汇总（Analyst/PM/Dev/Architect/Tester/Reviewer）

---

## 一、项目概述

### 1.1 背景

2026-03-29 各 Agent 从专业视角提交了 18 条改进提案，覆盖工具链稳定性、前端质量、架构债务、提案流程治理、质量保障五大领域。历史教训（20260324 汇总 21 条提案大部分仍待领取）表明：提案执行缺乏追踪机制，技术债务持续累积。

### 1.2 目标

建立 **提案从提交到落地的完整闭环**，包括：
- P0 级工具链修复（task_manager / heartbeat / page.test / dedup）
- 前端架构债务清理（ErrorBoundary / confirmationStore）
- 提案流程标准化（模板 + 执行追踪 + PRD-测试闭环）
- 质量保障体系完善（E2E CI / API 错误测试 / Accessibility 基线）

### 1.3 范围

| 包含 | 不包含 |
|------|--------|
| 工具链 P0 修复（task_manager / heartbeat / page.test / dedup） | Canvas 演进等其他项目 |
| 前端架构优化（ErrorBoundary / confirmationStore） | 后端 API 重构 |
| 提案流程标准化（TEMPLATE / METHODOLOGY / EXECUTION_TRACKER） | 提案提交机制本身变更 |
| 质量测试体系（E2E CI / API 错误测试 / Accessibility） | 非 VibeX 项目 |

---

## 二、Epic 划分与 Story 拆分

---

### Epic 1: 工具链止血（Toolchain Stabilization）🐉

**目标**: 修复阻塞 Agent 自动化的 P0 级工具链问题，解锁所有 Agent 心跳。

| Story | 标题 | 负责 | 工时 | 优先级 |
|-------|------|------|------|--------|
| E1.1 | task_manager 挂起根因修复 | dev | 2-4h | **P0** |
| E1.2 | heartbeat 幽灵任务修复 | dev | 4h | **P0** |
| E1.3 | page.test.tsx 4 预存失败修复 | dev | 1h | **P0** |
| E1.4 | dedup 生产验证 | dev + tester | 2d | **P0** |

#### E1.1 task_manager 挂起根因修复

**问题**: task_manager.py 挂起问题从 2026-03-24 至今（5天）未修复，`claim/list` 命令无输出，卡在 "CMDS DEFINITION"，阻塞所有 Agent 心跳自动化。

**验收标准**:
```typescript
// E1.1 验收标准
expect(task_manager.health(), "health 命令响应 < 3s").toBeLessThan(3000);
expect(task_manager.claim("nonexistent-proj", "nonexistent-task"), "认领不存在任务立即返回 false").toBe(false);
expect(task_manager.list(), "list 命令正常返回数组").toBeInstanceOf(Array);
expect(concurrent_3x_write, "并发 3 实例写入 coord-state.json 无数据损坏").toBe(true);
expect(process.hang_count_after_fix, "修复后进程挂起次数 = 0").toBe(0);

// 实现要求:
// S1. 添加 filelock 库处理文件锁: pip install filelock
// S2. 所有 subprocess 添加 timeout=3: subprocess.run(..., timeout=3)
// S3. coord-state.json 原子写入: 临时文件 + os.rename()
// S4. 新增 health 检测命令: task_manager.py health
```

**DoD**: `task_manager.py health` 响应 < 3s；并发 3 实例测试无死锁；所有现有 `task_manager.py claim/list/update` 命令正常工作。

---

#### E1.2 heartbeat 幽灵任务修复

**问题**: heartbeat 脚本读取不存在目录时仍报告 pending，产生幽灵任务误报，影响所有 Agent 心跳准确性。

**验收标准**:
```typescript
// E1.2 验收标准
expect(heartbeat.scan("nonexistent-dir"), "扫描不存在目录返回 0 pending").toBe(0);
expect(heartbeat.scan("empty-project-dir"), "扫描空任务目录返回 0 pending").toBe(0);
expect(heartbeat.phantom_task_count_after_fix, "修复后幽灵任务数 = 0").toBe(0);
expect(heartbeat.real_task_count, "真实任务仍被正确报告").toBeGreaterThan(0);
expect(heartbeat.scan_duration, "扫描全部项目耗时 < 5s").toBeLessThan(5000);

// 实现要求:
// S1. 所有 ls 操作前添加 [ -d "$dir" ] 检查
// S2. 使用 find ... -type f -name "*.json" 2>/dev/null 代替 ls
// S3. 添加目录存在性守卫: [ -d "$project_dir" ] || continue
```

**DoD**: 扫描不存在/空目录返回 0 pending；真实项目任务数准确；脚本执行耗时 < 5s。

---

#### E1.3 page.test.tsx 4 预存失败修复

**问题**: 从 2026-03-20 至今（9天）4 个测试持续失败，CI 可信度持续受损。

**根因**: `simplified-flow` 重构后布局从 5 栏 → 3 步流程，测试用例过时。

**验收标准**:
```typescript
// E1.3 验收标准
expect(page_test.failures, "page.test.tsx 失败数为 0").toBe(0);
expect(page_test.pass_rate, "page.test.tsx 通过率 = 100%").toBe(1.0);
expect(CI.trust_score, "CI 可信度评分 = 100%").toBe(100);

// 需要修复的 4 个测试:
// 1. three-column layout → 更新为 3 栏验证（当前断言 5 栏）
// 2. navigation → 更新导航结构验证（确认新导航结构）
// 3. five process steps → 更新为 3 步验证（当前断言 5 步）
// 4. basic elements → 更新布局选择器（确认新布局 DOM 结构）
```

**DoD**: `npm test -- --testPathPattern=page` 全绿（100% 通过）；无任何 `FAIL` 输出。

---

#### E1.4 dedup 生产验证

**问题**: dedup 机制在开发环境修复后，生产环境有效性未验证，误报/漏报率未知。

**验收标准**:
```typescript
// E1.4 验收标准
expect(dedup.test_on_proposals_20260324, "在 20260324 提案上验证").toBe(true);
expect(dedup.test_on_proposals_20260325, "在 20260325 提案上验证").toBe(true);
expect(dedup.test_on_proposals_20260329, "在 20260329 提案上验证").toBe(true);
expect(dedup.false_positive_rate, "误报率 < 1%").toBeLessThan(0.01);
expect(dedup.false_negative_rate, "漏报率 < 5%").toBeLessThan(0.05);
expect(dedup.sensitive_info_leak, "敏感信息不泄露").toBe(false);

// 验证步骤:
// 1. 导入 proposals/20260324/ 全部提案，运行 dedup，记录结果
// 2. 导入 proposals/20260325/ 全部提案，运行 dedup，记录结果
// 3. 导入 proposals/20260329/ 全部提案，运行 dedup，记录结果
// 4. 人工审核 dedup 输出，确认无误报（相同提案被标记为重复）和漏报（不同提案被错误合并）
```

**DoD**: dedup 在 3 个历史提案集上验证通过；误报率 < 1%；漏报率 < 5%；无敏感信息泄露。

---

### Epic 2: 前端架构优化（Frontend Architecture）🏛️

**目标**: 清理前端架构债务，统一错误处理，建立可维护的前端基础。

| Story | 标题 | 负责 | 工时 | 优先级 |
|-------|------|------|------|--------|
| E2.1 | ErrorBoundary 组件去重 | dev | 4h | **P1** |
| E2.2 | confirmationStore Zustand Slice 重构 | dev + architect | 1.5d | **P1** |
| E2.3 | 共享类型包建设 | architect | 2d | **P2** |
| E2.4 | 前端错误处理统一 | dev | 2d | **P2** |
| E2.5 | React Query 覆盖率提升 | architect + dev | 2d+ | **P3** |

#### E2.1 ErrorBoundary 组件去重

**问题**: 2 份 ErrorBoundary 实现（`components/error-boundary/` 和 `components/ui/`），维护成本高，边界行为不一致。

**验收标准**:
```typescript
// E2.1 验收标准
expect(ErrorBoundary_impl_count, "ErrorBoundary 实现数量 = 1").toBe(1);
expect(ErrorBoundary_import_paths.unique_count, "所有 import 路径统一为 1 种").toBe(1);
expect(ErrorBoundary.behavior_consistency, "fallback UI 行为一致").toBe(true);
expect(ErrorBoundary.test.tsx.exists, "新增 ErrorBoundary.test.tsx").toBe(true);
expect(ErrorBoundary.test.pass_rate, "ErrorBoundary 测试通过率 = 100%").toBe(1.0);

// 实现步骤:
// 1. 审计两处实现的差异（props 接口、fallback UI、error log 行为）
// 2. 保留功能最完整版本（合并最优特性）
// 3. 统一所有 import: 全部指向保留版本
// 4. 删除冗余实现
// 5. 补充 ErrorBoundary.test.tsx
```

**DoD**: 仅有 1 份 ErrorBoundary 实现；所有既有 `import ErrorBoundary` 调用无需修改（向后兼容）；测试全绿。

---

#### E2.2 confirmationStore Zustand Slice 重构

**问题**: `confirmationStore.ts` 461 行，违反单一职责，5 个子流程混在一个 Store，测试覆盖困难。

**验收标准**:
```typescript
// E2.2 验收标准
expect(confirmationStore.main_file_lines, "主文件总行数 ≤ 200").toBeLessThanOrEqual(200);
expect(confirmationStore.slices.count, "Slice 数量 ≥ 3").toBeGreaterThanOrEqual(3);
expect(backward_compat_existing_calls, "所有既有 useConfirmationStore() 调用无需修改").toBe(true);
expect(slices.uiSlice.test.pass, "uiSlice 单元测试全绿").toBe(true);
expect(slices.dataSlice.test.pass, "dataSlice 单元测试全绿").toBe(true);
expect(slices.logicSlice.test.pass, "logicSlice 单元测试全绿").toBe(true);
expect(confirmationStore.test.tsx.pass_rate, "confirmationStore 测试通过率 = 100%").toBe(1.0);

// Slice 划分方案:
// src/stores/confirmationStore.ts  # 主入口（~30 行）
// src/stores/slices/uiSlice.ts      # showConfirm, modalType, loading (~40 行)
// src/stores/slices/dataSlice.ts    # items, pendingQueue (~50 行)
// src/stores/slices/logicSlice.ts   # confirm, reject, batchConfirm (~30 行)
// src/stores/confirmationStore.test.ts  # 集成测试
```

**DoD**: 主文件 < 200 行；≥ 3 个 Slice；所有既有调用向后兼容；Architect 评审通过。

---

#### E2.3 共享类型包建设

**问题**: 前后端类型定义不同步，`api.ts` 中的 TypeScript 类型与后端数据结构不一致。

**验收标准**:
```typescript
// E2.3 验收标准
expect(shared_types.exports.Task, "导出 Task 类型").toBeDefined();
expect(shared_types.exports.Proposal, "导出 Proposal 类型").toBeDefined();
expect(shared_types.exports.Epic, "导出 Epic 类型").toBeDefined();
expect(shared_types.exports.Story, "导出 Story 类型").toBeDefined();
expect(frontend.api.uses_shared_types, "前端 api.ts 使用共享类型").toBe(true);
expect(type_conflicts.count, "前后端类型冲突数 = 0").toBe(0);
expect(shared_types.test.pass_rate, "类型包测试通过率 = 100%").toBe(1.0);

// 目录结构:
// packages/shared-types/src/index.ts  # 统一导出
// packages/shared-types/package.json   # npm 包配置
// packages/shared-types/tsconfig.json # TypeScript 配置
```

**DoD**: 创建 `packages/shared-types/`；前后端类型冲突数 = 0；前端 `api.ts` 使用共享类型。

---

#### E2.4 前端错误处理统一

**问题**: 错误处理模式分散，`ErrorType` 枚举缺失，降级展示行为不一致。

**验收标准**:
```typescript
// E2.4 验收标准
expect(ErrorType.NETWORK_ERROR, "ErrorType.NETWORK_ERROR 存在").toBeDefined();
expect(ErrorType.API_ERROR, "ErrorType.API_ERROR 存在").toBeDefined();
expect(ErrorType.VALIDATION_ERROR, "ErrorType.VALIDATION_ERROR 存在").toBeDefined();
expect(ErrorType.TIMEOUT, "ErrorType.TIMEOUT 存在").toBeDefined();
expect(ErrorType.UNKNOWN, "ErrorType.UNKNOWN 存在").toBeDefined();
expect(Object.keys(ErrorType).length, "ErrorType 枚举值 = 5").toBe(5);
expect(ErrorBoundary.renderFallback(NETWORK_ERROR), "降级 UI 显示用户友好的错误信息").toBeDefined();
expect(error_handler.duplication_rate, "错误处理代码重复率 < 40%").toBeLessThan(40);
```

**DoD**: `ErrorType` 枚举覆盖 5 种错误；所有降级 UI 行为一致；代码重复率 < 40%。

---

#### E2.5 React Query 覆盖率提升

**问题**: 14 个自定义 hooks 直接调用 `api.ts`，绕过 React Query 的缓存、去重、错误处理机制。

**验收标准**:
```typescript
// E2.5 验收标准
expect(react_query.migrated_hooks.count, "迁移自定义 hooks ≥ 14").toBeGreaterThanOrEqual(14);
expect(cache.hit_rate, "缓存命中率 > 30%").toBeGreaterThan(0.3);
expect(query_keys.pattern_consistency, "query keys 命名统一（格式: ['entity', 'id']）").toBe(true);
expect(react_query.test.pass_rate, "React Query 相关测试通过率 = 100%").toBe(1.0);

// 迁移优先级:
// P0: useTasks → useQuery(['tasks'])
// P1: useProject → useQuery(['project', id])
// P2: 其余 12 个 hooks
```

**DoD**: 14+ 个 hooks 迁移到 React Query；缓存命中率 > 30%；query keys 命名统一。

---

### Epic 3: 提案流程标准化（Proposal Process）📋

**目标**: 建立提案提交→汇总→追踪→闭环的完整生命周期管理。

| Story | 标题 | 负责 | 工时 | 优先级 |
|-------|------|------|------|--------|
| E3.1 | 提案执行追踪表建设 | PM | 4h | **P0** |
| E3.2 | 提案格式标准化（TEMPLATE + METHODOLOGY） | analyst | 1d | **P1** |
| E3.3 | 提案格式目录标准化 | analyst | 4h | **P2** |
| E3.4 | PRD 与测试闭环验证 | pm | 4h | **P3** |
| E3.5 | Analyst 报告质量分级检查 | analyst | 4h | **P2** |

#### E3.1 提案执行追踪表建设

**问题**: 历史提案（20260324, 25, 26）均无执行追踪，Coord 缺乏提案落地抓手，20260324 汇总 21 条提案大部分仍待领取。

**验收标准**:
```typescript
// E3.1 验收标准
expect(EXECUTION_TRACKER.exists, "proposals/EXECUTION_TRACKER.md 存在").toBe(true);
expect(EXECUTION_TRACKER.coverage_20260324, "覆盖 20260324 全部 21 条提案").toBe(21);
expect(EXECUTION_TRACKER.coverage_20260329, "覆盖 20260329 全部 18 条提案").toBe(18);
expect(EXECUTION_TRACKER.total_tracked, "追踪总数 ≥ 39 条").toBeGreaterThanOrEqual(39);
expect(EXECUTION_TRACKER.has_priority_col, "所有提案有优先级标注").toBe(true);
expect(EXECUTION_TRACKER.has_status_col, "所有提案有状态标注").toBe(true);
expect(Coord.heartbeat.includes_tracker_summary, "Coord 心跳报告包含追踪摘要").toBe(true);

// 追踪表格式:
// | ID | 标题 | 来源 | 负责 | 优先级 | 状态 | 截止日期 | 备注 |
```

**DoD**: 追踪表覆盖 20260324 + 20260329 全部 39 条提案；Coord 心跳每周推送执行摘要。

---

#### E3.2 提案格式标准化

**问题**: `proposals/` 目录格式混乱（日期目录 / 独立文件混合），跨提案对比困难。

**验收标准**:
```typescript
// E3.2 验收标准
expect(TEMPLATE.exists, "proposals/TEMPLATE.md 存在").toBe(true);
expect(TEMPLATE.has_required_sections, "TEMPLATE.md 包含所有必填章节（提案标题/优先级/工时/问题陈述/方案/验收标准）").toBe(true);
expect(METHODOLOGY.exists, "proposals/METHODOLOGY.md 存在").toBe(true);
expect(METHODOLOGY.has_10_dimensions, "METHODOLOGY.md 包含 10 维度检查清单").toBe(true);
expect(proposals.adherence_rate_20260329, "20260329 提案格式合规率 = 100%").toBe(1.0);
```

**DoD**: `proposals/TEMPLATE.md` 和 `proposals/METHODOLOGY.md` 存在；20260329 及后续提案 100% 合规。

---

#### E3.3 提案格式目录标准化

**问题**: proposals/ 目录下有 13+ 个子目录，格式不统一（日期目录 / 日期_时间目录 / 根目录混放）。

**验收标准**:
```typescript
// E3.3 验收标准
expect(proposals.dir_pattern, "所有提案目录符合 YYYYMMDD/ 格式").toBe(true);
expect(proposals.required_files.all, "每个提案目录包含: analyst.md + architect.md + dev.md + pm.md + tester.md + reviewer.md + summary.md").toBe(true);
expect(proposals.metadata_json.all, "每个提案目录包含 metadata.json").toBe(true);
expect(proposals.orphaned_files.count, "提案目录外无散落提案文件").toBe(0);
expect(proposals.format_consistency, "目录结构标准化后无格式违规").toBe(true);

// 标准化目录结构:
// proposals/
// ├── metadata.json              # 统一索引（所有提案元数据）
// ├── EXECUTION_TRACKER.md      # 提案执行追踪
// ├── TEMPLATE.md               # 提案模板
// ├── METHODOLOGY.md            # 提案方法论
// └── {YYYYMMDD}/
//     ├── analyst.md            # 固定命名
//     ├── architect.md
//     ├── dev.md
//     ├── pm.md
//     ├── tester.md
//     ├── reviewer.md
//     ├── summary.md
//     └── metadata.json
```

**DoD**: 所有提案目录符合标准化结构；无散落文件。

---

#### E3.4 PRD 与测试闭环验证

**问题**: PRD 写了验收标准（expect() 格式），但测试未闭环验证实现与标准的一致性。

**验收标准**:
```typescript
// E3.4 验收标准
expect(PRD_TEST_MAPPING.exists, "proposals/PRD_TEST_MAPPING.md 存在").toBe(true);
expect(PRD_TEST_MAPPING.coverage, "PRD 验收标准 100% 有对应测试用例").toBe(1.0);
expect(PRD_TEST_MAPPING.all_mapped, "所有 Story 的验收标准均有映射").toBe(true);
expect(PRD_TEST_MAPPING.status_col.all, "所有映射有状态标注").toBe(true);

// 映射表格式:
// | Epic.Story | PRD 验收标准 | 对应测试用例 | 测试状态 |
```

**DoD**: PRD_TEST_MAPPING.md 存在；所有 Story 验收标准 100% 有测试映射。

---

#### E3.5 Analyst 报告质量分级检查

**问题**: 不同分析报告质量参差不齐，部分报告缺风险评估、数据支撑、依赖关系。

**验收标准**:
```typescript
// E3.5 验收标准
expect(report_quality_checklist.exists, "analyst/report_quality_checklist.md 存在").toBe(true);
expect(report_quality_checklist.dimensions, "检查清单覆盖 10 个维度").toBe(10);
expect(Analyst.report_passing_rate, "Analyst 报告首次通过率 ≥ 80%").toBeGreaterThanOrEqual(0.8);
expect(historical_retroactive.coverage, "历史报告（20260324-20260326）应用检查清单").toBe(3);
```

**DoD**: 10 维度检查清单存在；历史报告全部应用检查清单；首次通过率 ≥ 80%。

---

### Epic 4: 质量保障体系（Quality Assurance）✅

**目标**: 建立完整的自动化测试体系，覆盖 E2E、API 错误边界、Accessibility。

| Story | 标题 | 负责 | 工时 | 优先级 |
|-------|------|------|------|--------|
| E4.1 | E2E 测试纳入 CI | dev | 2h | **P1** |
| E4.2 | API 错误处理测试补全 | dev + tester | 2h | **P1** |
| E4.3 | Accessibility 测试基线 | dev | 2h | **P2** |

#### E4.1 E2E 测试纳入 CI

**问题**: 9 个 Playwright 测试游离于 CI 之外，无自动化回归防护。

**验收标准**:
```typescript
// E4.1 验收标准
expect(e2e.ci_integrated, "Playwright E2E 集成到 GitHub Actions").toBe(true);
expect(e2e.test_count, "E2E 测试数量 ≥ 9").toBeGreaterThanOrEqual(9);
expect(e2e.pass_rate, "E2E 测试通过率 = 100%").toBe(1.0);
expect(e2e.ci_duration, "E2E CI 总时长 < 10min").toBeLessThan(600);
expect(e2e.ci.no_flaky_failures, "E2E CI 无 flaky failure（连续 3 次运行）").toBe(true);

// CI 配置示例:
// .github/workflows/e2e.yml
// - name: Playwright E2E Tests
//   run: npx playwright test --reporter=github
```

**DoD**: Playwright E2E 集成到 GitHub Actions；通过率 100%；CI 时长 < 10min。

---

#### E4.2 API 错误处理测试补全

**问题**: `src/services/api.test.ts` 仅验证方法存在，不测错误边界。

**验收标准**:
```typescript
// E4.2 验收标准
expect(api.error.test.count, "API 错误测试用例 ≥ 6").toBeGreaterThanOrEqual(6);
expect(api.error.test.401_exists, "401 Unauthorized 测试存在").toBe(true);
expect(api.error.test.403_exists, "403 Forbidden 测试存在").toBe(true);
expect(api.error.test.404_exists, "404 Not Found 测试存在").toBe(true);
expect(api.error.test.500_exists, "500 Internal Server Error 测试存在").toBe(true);
expect(api.error.test.timeout_exists, "Network Timeout 测试存在").toBe(true);
expect(api.error.test.cancel_exists, "Concurrent Request Cancellation 测试存在").toBe(true);
expect(api.test.pass_rate, "API 测试通过率 = 100%").toBe(1.0);
```

**DoD**: 覆盖 401/403/404/500/Timeout/Cancel 6 种错误场景；测试全绿。

---

#### E4.3 Accessibility 测试基线

**问题**: 无 WCAG 合规性自动化检测。

**验收标准**:
```typescript
// E4.3 验收标准
expect(a11y.test.confirm_page.exists, "ConfirmationModal 页面有 accessibility 测试").toBe(true);
expect(a11y.test.flow_page.exists, "Flow 相关页面有 accessibility 测试").toBe(true);
expect(a11y.test.dashboard_page.exists, "Dashboard 页面有 accessibility 测试").toBe(true);
expect(a11y.test.core_pages.count, "核心页面 accessibility 测试数 ≥ 3").toBeGreaterThanOrEqual(3);
expect(a11y.violations, "Accessibility 违规数 = 0").toBe(0);

// 使用 jest-axe:
// import { axe, toHaveNoViolations } from 'jest-axe';
// it('should have no accessibility violations', async () => {
//   const { container } = render(<ConfirmationModal />);
//   const results = await axe(container);
//   expect(results).toHaveNoViolations();
// });
```

**DoD**: 核心页面全部有 accessibility 测试；违规数 = 0。

---

### Epic 5: 审查与工具优化（Review & Tooling）👁️

**目标**: 提升审查报告质量和工具健壮性。

| Story | 标题 | 负责 | 工时 | 优先级 |
|-------|------|------|------|--------|
| E5.1 | 约束清单解析截断修复 | dev | 4h | **P2** |
| E5.2 | 审查报告格式标准化 | reviewer | 4h | **P2** |

#### E5.1 约束清单解析截断修复

**问题**: 约束清单中的多行字符串被截断，导致报告可读性下降。

**验收标准**:
```typescript
// E5.1 验收标准
expect(parser.multiline_complete, "多行字符串完整解析").toBe(true);
expect(parser.parse("line1\nline2\nline3"), "解析结果行数 = 3").toBe(3);
expect(parser.parse("a".repeat(10000)).length, "超长字符串无截断，行数 = 1").toBe(1);
expect(report.render().includes_ellipsis, "报告不包含 '...' 截断标记").toBe(false);
expect(report.render().includes_truncated, "报告不包含 'truncated' 截断标记").toBe(false);
```

**DoD**: 多行字符串完整解析；超长字符串无截断；报告中无截断标记。

---

#### E5.2 审查报告格式标准化

**问题**: 各 Agent 的提案格式不统一，Reviewer 难以快速比对。

**验收标准**:
```typescript
// E5.2 验收标准
expect(review_report_template.exists, "reviewer/REVIEW_REPORT_TEMPLATE.md 存在").toBe(true);
expect(review_report_template.has_sections, "模板包含: 审查结论/审查维度/问题列表/最终意见").toBe(true);
expect(reviewer.reports.adherence, "所有审查报告使用模板比例 ≥ 90%").toBeGreaterThanOrEqual(0.9);
```

**DoD**: 审查报告模板存在；90%+ 审查报告使用模板。

---

## 三、优先级矩阵（P0/P1/P2/P3）

### 3.1 P0 — 立即止血（本周完成）

| ID | Epic.Story | 标题 | 负责 | 工时 | 理由 |
|----|-----------|------|------|------|------|
| **E1.1** | P0-1 | task_manager 挂起根因修复 | dev | 2-4h | 阻塞所有 Agent 心跳自动化，5天未处理 |
| **E1.2** | P0-2 | heartbeat 幽灵任务修复 | dev | 4h | 影响所有 Agent 心跳准确性 |
| **E1.3** | P0-3 | page.test.tsx 4 预存失败修复 | dev | 1h | CI 可信度持续受损，9天未处理 |
| **E1.4** | P0-4 | dedup 生产验证 | dev+tester | 2d | 提案去重准确性保障 |
| **E3.1** | P0-5 | 提案执行追踪表建设 | PM | 4h | 解锁所有提案执行追踪 |

**执行顺序**: E1.1 → E1.2 → E1.3 → E1.4（可并行 E3.1）

---

### 3.2 P1 — 本周完成

| ID | Epic.Story | 标题 | 负责 | 工时 |
|----|-----------|------|------|------|
| **E2.1** | P1-1 | ErrorBoundary 组件去重 | dev | 4h |
| **E2.2** | P1-2 | confirmationStore Zustand Slice 重构 | dev+architect | 1.5d |
| **E3.2** | P1-3 | 提案格式标准化（TEMPLATE + METHODOLOGY） | analyst | 1d |
| **E4.1** | P1-4 | E2E 测试纳入 CI | dev | 2h |
| **E4.2** | P1-5 | API 错误处理测试补全 | dev+tester | 2h |

---

### 3.3 P2 — 下周规划

| ID | Epic.Story | 标题 | 负责 | 工时 |
|----|-----------|------|------|------|
| **E2.3** | P2-1 | 共享类型包建设 | architect | 2d |
| **E2.4** | P2-2 | 前端错误处理统一 | dev | 2d |
| **E3.3** | P2-3 | 提案格式目录标准化 | analyst | 4h |
| **E3.5** | P2-4 | Analyst 报告质量分级检查 | analyst | 4h |
| **E4.3** | P2-5 | Accessibility 测试基线 | dev | 2h |
| **E5.1** | P2-6 | 约束清单解析截断修复 | dev | 4h |
| **E5.2** | P2-7 | 审查报告格式标准化 | reviewer | 4h |

---

### 3.4 P3 — 长期规划

| ID | Epic.Story | 标题 | 负责 | 工时 |
|----|-----------|------|------|------|
| **E2.5** | P3-1 | React Query 覆盖率提升 | architect+dev | 2d+ |
| **E3.4** | P3-2 | PRD 与测试闭环验证 | pm | 4h |

---

## 四、依赖关系图

```
🐉 Epic 1: 工具链止血
├── E1.1 task_manager修复（P0-1）──────┐
│   └── E1.2 heartbeat修复（P0-2）────────┤──→ 解锁所有 Agent 心跳自动化
│   └── E1.3 page.test修复（P0-3）─────────┤
│   └── E1.4 dedup验证（P0-4）─────────────────┤

📋 Epic 3: 提案流程
├── E3.1 EXECUTION_TRACKER（P0-5）──────┐
│   └── E3.2 TEMPLATE+METHODOLOGY（P1-3）──┤──→ 提案标准化
│   └── E3.3 目录标准化（P2-3）──────────────────┤

🏛️ Epic 2: 前端架构
├── E2.1 ErrorBoundary去重（P1-1）─────────────┐
│   └── E2.2 confirmationStore重构（P1-2）──────────┤──→ 架构债务清理
│   └── E2.4 错误处理统一（P2-2）─────────────────────┤
│   └── E2.5 React Query迁移（P3-1）─────────────────────┘

✅ Epic 4: 质量保障
├── E4.1 E2E纳入CI（P1-4）─────────────────────┐
│   └── E4.2 API错误测试（P1-5）─────────────────┤──→ 质量体系完善
│   └── E4.3 Accessibility基线（P2-5）──────────────┘

👁️ Epic 5: 审查工具
├── E5.1 解析截断修复（P2-6）
└── E5.2 审查报告标准化（P2-7）
```

---

## 五、风险矩阵

| 风险 ID | 风险描述 | 影响 | 概率 | 缓解措施 |
|---------|---------|------|------|---------|
| **R1** | Dev 吞吐瓶颈：8 项 P0-P1 全部由 dev 负责 | P0 提案持续积压 | **高** | 1) E1.1/E1.2 优先处理；2) tester 承担 E1.4；3) architect 协助 E2.2 评审 |
| **R2** | 提案流于形式：汇总后无人跟进执行 | 技术债务累积 | **中** | 1) E3.1 立即启动；2) Coord 心跳每周推送摘要；3) 未认领 P0 自动上报 Slack |
| **R3** | 架构债务累积：confirmationStore 长期搁置 | 重构成本指数增长 | **中** | E2.2 本周优先处理；E2.3 下周启动 |

---

## 六、跨 Agent 协作要求

| 协作对 | 协作内容 | 触发时机 |
|--------|---------|---------|
| coord → dev | 派发 E1.1/E1.2/E1.3/E1.4/E2.1/E2.2/E4.1/E4.2/E4.3/E5.1 | PRD 评审通过后 |
| coord → analyst | 派发 E3.2/E3.3/E3.5 | PRD 评审通过后 |
| coord → tester | 派发 E1.4（dedup验证）/E4.2（API错误测试） | PRD 评审通过后 |
| coord → reviewer | 派发 E5.2 | PRD 评审通过后 |
| coord → architect | 派发 E2.2 评审/E2.3/E2.5 | PRD 评审通过后 |
| dev → architect | E2.2 confirmationStore 重构方案评审 | 重构前 |
| dev → tester | E4.1 E2E CI 集成方案确认 | CI 配置前 |

---

## 七、实施计划（推荐从 P0-2 task_manager 修复开始）

### Sprint 0: 止血（Day 1-2, 2026-03-30~31）

| 顺序 | Story | 负责 | 产出 | 验证方式 |
|------|-------|------|------|---------|
| 1 | **E1.1** task_manager 修复 | dev | `task_manager.py health` 正常 | `task_manager.py health` < 3s |
| 2 | **E1.2** heartbeat 修复 | dev | 幽灵任务数 = 0 | 扫描不存在目录返回 0 |
| 3 | **E1.3** page.test 修复 | dev | 4 个测试全绿 | `npm test -- --testPathPattern=page` |
| 4 | **E3.1** 提案追踪表 | PM | `proposals/EXECUTION_TRACKER.md` | 文件存在，39 条提案全部登记 |
| 5 | **E1.4** dedup 验证 | dev+tester | dedup 验证报告 | 误报 < 1%，漏报 < 5% |

### Sprint 1: 质量 + 架构（Day 3-5, 2026-04-01~03）

| Story | 负责 | 产出 | 验证方式 |
|-------|------|------|---------|
| **E2.1** ErrorBoundary 去重 | dev | 单一 ErrorBoundary 实现 | 实现数 = 1 |
| **E2.2** confirmationStore 重构 | dev+architect | ≤ 200 行主文件 + ≥ 3 Slices | Architect 评审通过 |
| **E3.2** 提案格式标准化 | analyst | TEMPLATE.md + METHODOLOGY.md | 模板存在且合规 |
| **E4.1** E2E 纳入 CI | dev | `.github/workflows/e2e.yml` | Playwright CI 通过 |
| **E4.2** API 错误测试补全 | dev+tester | 6 个错误边界测试 | 测试全绿 |

### Sprint 2: 架构深化（Day 6-7, 2026-04-04~05）

| Story | 负责 | 产出 | 验证方式 |
|-------|------|------|---------|
| **E2.3** 共享类型包 | architect | `packages/shared-types/` | 前后端类型冲突 = 0 |
| **E2.4** 错误处理统一 | dev | `src/types/error.ts` | ErrorType 枚举 = 5 种 |
| **E3.3** 目录标准化 | analyst | 所有提案目录符合标准化结构 | 无散落文件 |
| **E3.5** 报告质量检查 | analyst | 10 维度检查清单 | 清单存在 |
| **E4.3** Accessibility 基线 | dev | 3 核心页面 jest-axe 测试 | 违规数 = 0 |
| **E5.1** 解析截断修复 | dev | 约束清单完整解析 | 无截断标记 |
| **E5.2** 审查报告标准化 | reviewer | `REVIEW_REPORT_TEMPLATE.md` | 模板存在 |

### Sprint 3+: 长期债务（待规划）

| Story | 负责 | 产出 |
|-------|------|------|
| **E2.5** React Query 覆盖率提升 | architect+dev | 14+ hooks 迁移 |
| **E3.4** PRD 与测试闭环验证 | pm | PRD_TEST_MAPPING.md |

---

## 八、Open Questions 状态

| # | 问题 | 决策 | 负责人 |
|---|------|------|--------|
| OQ1 | Dev 同时处理 Canvas 演进和 8 项 P0-P1，如何排序？ | **建议**: Canvas 演进暂停，E1.1→E1.2→E1.3→E3.1 优先 | Coord |
| OQ2 | dedup 生产验证是否涉及敏感信息？ | **建议**: 使用匿名化数据，不导入真实提案内容 | reviewer |
| OQ3 | confirmationStore 拆分是否迁移到 Jotai/Recoil？ | **建议**: 保持 Zustand，仅应用 slice pattern | architect |
| OQ4 | E2E 框架是否从 Playwright 迁移到 Vitest E2E？ | **建议**: 保持 Playwright，不迁移 | tester |
| OQ5 | 提案执行追踪表更新频率？ | **建议**: 每天 Coord 心跳推送一次 | PM |

---

## 九、驳回红线

以下情况需驳回并返回上游：

- [ ] Story 功能点模糊，无法写 `expect()` 断言 → 驳回重回分析
- [ ] 验收标准缺失 → 驳回补充
- [ ] 涉及页面集成但未标注【需页面集成】→ 驳回补充
- [ ] Epic/Story 依赖关系不闭环 → 驳回重绘
- [ ] P0/P1/P2 优先级与 analysis.md 不一致 → 驳回对齐
- [ ] 实施计划未从 P0-2 task_manager 修复开始 → 驳回重排

---

## 十、检查清单

- [x] Epic 划分完整（5 个 Epic，覆盖所有 18 条提案）
- [x] Story 拆分粒度到位（每条 Story 可写 expect() 断言）
- [x] 验收标准断言化（所有 Story 有 expect() 格式验收标准）
- [x] 优先级矩阵清晰（P0/P1/P2/P3 分级）
- [x] 依赖关系图绘制（Epic 间 + Story 间依赖）
- [x] 风险矩阵识别（R1 Dev 吞吐 / R2 提案流于形式 / R3 架构债务）
- [x] 实施计划明确（Sprint 0 从 E1.1 task_manager 修复开始）
- [x] Open Questions 状态更新
- [x] 驳回红线定义
- [x] 跨 Agent 协作要求定义

---

*PRD 完成 | PM Agent | 2026-03-29 17:35 GMT+8*
