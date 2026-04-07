# PRD: vibex-pm-proposals-20260324_185417

**项目**: vibex-pm-proposals-20260324_185417  
**PM**: PM Agent  
**时间**: 2026-03-24 19:40 (UTC+8)  
**状态**: 进行中  
**依赖上游**: analysis.md (PM), pm-proposals.md (PM)  
**目标**: 将 3 项 PM 提案转化为可执行的 PRD，包含 Epic 拆分和验收标准

---

## 1. 执行摘要

### 问题
- **P0**: task_manager 挂起导致所有 Agent 协调流程中断
- **P1**: confirmationStore 重构缺乏用户流程回归验证
- **P2**: 提案生命周期不透明，协作成本高

### 解决方案
- P0: 降级为 JSON 直读 + 超时保护
- P1: 分批 PR + 灰度发布 + 回归测试
- P2: 路径规范 + Coord 任务追踪

### 成功指标
- [ ] task_manager list 响应 < 5s
- [ ] 回归测试覆盖率 ≥ 95%
- [ ] 所有提案统一路径存储

---

## 2. 功能需求

### F1: task_manager 协调效率提升

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | JSON 直读模式 | 当 Python subprocess 超时 5s 时，降级为直接读取共享 JSON 文件 | `expect(task_manager('list').exitTime).toBeLessThan(5000)` | 无 |
| F1.2 | 超时保护 | 所有 task_manager 调用增加 5s 超时兜底 | `expect(task_manager('claim').exitTime).toBeLessThan(5000)` | 无 |
| F1.3 | 无状态重构规划 | 输出无状态重构技术方案（里程碑规划） | `expect(refactorPlan.milestones).toBeDefined()` | 无 |

**DoD**: task_manager 在无网络依赖情况下能正常完成 list/claim/update 操作

### F2: confirmationStore 拆分用户影响评估

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | 回归测试套件 | 建立完整 E2E 回归测试，覆盖 5 个子流程（RequirementStep/ContextStep/ModelStep/FlowStep/共享状态） | `expect(regressionTests.coverage).toBeGreaterThanOrEqual(95)` | 无 |
| F2.2 | 分批 PR 策略 | 拆分 3 批 PR，每批独立验证一个 slice 的端到端流程 | `expect(PRs.length).toBe(3)` | 无 |
| F2.3 | 灰度发布 | 先覆盖 10% 用户流量，验证无错误后全量 | `expect(criticalErrors.count).toBe(0)` | 无 |

**DoD**: 5 个子流程全部有独立测试用例，任意一个失败则阻断合并

### F3: 提案生命周期规范化

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | 统一路径规范 | 所有提案存放在 `vibex/docs/proposals/{date}/{agent}-proposals.md` | `expect(fs.existsSync('proposals/...')).toBe(true)` | 无 |
| F3.2 | 命名规范 | 提案文件名格式: `{agent}-proposals-{date}.md` | `expect(namePattern.test(filename)).toBe(true)` | 无 |
| F3.3 | Coord 任务追踪 | Coord 自动追踪提案完成状态，替代人工催促 | `expect(coord.pendingTasks).toHaveLength(0)` | 无 |

**DoD**: 3 个提案文件全部在统一路径，Coord 可自动检测完成状态

---

## 3. Epic 拆分

### Epic 1: task_manager 协调效率提升

| Story | 描述 | 验收 |
|-------|------|------|
| S1.1 | JSON 直读降级模式 | F1.1 测试通过 |
| S1.2 | 超时保护机制 | F1.2 测试通过 |
| S1.3 | 无状态重构规划 | F1.3 方案评审通过 |

### Epic 2: confirmationStore 拆分用户影响评估

| Story | 描述 | 验收 |
|-------|------|------|
| S2.1 | 回归测试套件建设 | F2.1 覆盖率 ≥ 95% |
| S2.2 | 分批 PR 执行 | F2.2 3 批 PR 全部通过 |
| S2.3 | 灰度发布验证 | F2.3 0 错误后全量 |

### Epic 3: 提案生命周期规范化

| Story | 描述 | 验收 |
|-------|------|------|
| S3.1 | 路径规范落地 | F3.1 所有提案在统一路径 |
| S3.2 | 命名规范检查 | F3.2 命名格式检查通过 |
| S3.3 | Coord 任务追踪集成 | F3.3 人工催促归零 |

---

## 4. 优先级矩阵

| 优先级 | Epic | 理由 |
|--------|------|------|
| P0 | Epic 1 | task_manager 挂起阻断所有 Agent 协调 |
| P1 | Epic 2 | 高破坏性重构需要充分测试覆盖 |
| P2 | Epic 3 | 流程优化，非阻塞性 |

---

## 5. UI/UX 流程

无 UI 变更，纯后端优化。

---

## 6. 非功能需求

| 类型 | 要求 |
|------|------|
| 性能 | task_manager 所有操作 < 5s |
| 可靠性 | 降级模式不影响数据一致性 |
| 可测试性 | 所有功能点可写 expect() 断言 |

---

## 7. 验收标准汇总

| ID | 验收条件 | 验证方法 | 优先级 |
|----|----------|----------|--------|
| V1 | `task_manager('list').exitTime < 5000ms` | 单元测试 | P0 |
| V2 | `regressionTests.coverage >= 95%` | 覆盖率报告 | P1 |
| V3 | 5 个子流程各有独立测试用例 | 代码审查 | P1 |
| V4 | 3 批 PR 全部通过 E2E 测试 | CI 报告 | P1 |
| V5 | 灰度期间 criticalErrors = 0 | 监控面板 | P1 |
| V6 | 所有提案在统一路径 | 文件检查 | P2 |
| V7 | Coord 任务追踪无人工催促 | Coord 日志 | P2 |

---

## 8. 工时估算

| Epic | PM | Dev | Tester | 总计 |
|------|-----|-----|--------|------|
| Epic 1 | 0.5h | 2-4h | 0.5h | ~3-5h |
| Epic 2 | 0.5d | 1.5d | 1d | ~3d |
| Epic 3 | 0.5d | 0.5d | 0 | ~1d |
| **合计** | **~1.5d** | **~4.5d** | **~1.5d** | **~7.5d** |

---

## 9. 风险

| 风险 | 等级 | 缓解 |
|------|------|------|
| P0: 降级方案治标不治本 | 中 | 短期恢复后规划无状态重构 |
| P1: 回归测试遗漏场景 | 高 | PM 参与评审每批 PR，覆盖度 <95% 不合并 |
| P2: 规范推行需要全员共识 | 低 | Coord 主导推行 |
