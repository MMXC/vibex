# PRD: vibex-architect-proposals-20260324_185417

**项目**: vibex-architect-proposals-20260324_185417  
**PM**: PM Agent  
**时间**: 2026-03-24 20:06 (UTC+8)  
**状态**: 进行中  
**依赖上游**: analysis.md (Analyst)  
**目标**: 将 Architect 提案转化为可执行 PRD

---

## 1. 执行摘要

Architect 提出 3 项提案，与 Analyst 第一批次汇总一致。核心聚焦：工具链止血（Sprint 0）、前端质量提升（Sprint 1）、架构债务（Sprint 2）、AI Agent 治理（Sprint 1-2）。

### 成功指标
- [ ] Epic 1-4 全部解锁
- [ ] 高风险变更（Epic 3）有分批执行计划

---

## 2. 功能需求

### F1: Epic 1 — 工具链止血 (Sprint 0)

| ID | 功能点 | 描述 | 验收标准 |
|----|--------|------|----------|
| F1.1 | task_manager 挂起修复 | list/claim 命令 5s 内返回 | `expect(task_manager('list').exitTime).toBeLessThan(5000)` |
| F1.2 | Heartbeat 子任务并行稳定性 | 状态感知一致性提升 | `expect(parallelTasks.stateConsistency).toBe(true)` |

**DoD**: 所有工具链操作响应 < 5s，heartbeat 扫描成功率 100%

### F2: Epic 2 — 前端质量提升 (Sprint 1)

| ID | 功能点 | 描述 | 验收标准 |
|----|--------|------|----------|
| F2.1 | ErrorBoundary 去重 | 消除重复错误边界组件 | `expect(duplicateErrorBoundaries.count).toBe(0)` |
| F2.2 | CardTreeNode 测试覆盖率 | 组件测试覆盖率 ≥ 85% | `expect(cardTreeNodeCoverage).toBeGreaterThanOrEqual(85)` |

**DoD**: 前端组件测试覆盖率达标，ErrorBoundary 无重复

### F3: Epic 3 — 架构债务 (Sprint 2)

| ID | 功能点 | 描述 | 验收标准 |
|----|--------|------|----------|
| F3.1 | confirmationStore 拆分 | 461 行代码分批重构 | `expect(confirmationStore.lines).toBeLessThan(200)` |
| F3.2 | ADR 试点推进 | ADR-001 + ADR-002 文件创建 | `expect(adrFiles.length).toBe(2)` |

**DoD**: 高风险变更分批执行，每批有独立测试报告

### F4: Epic 4 — AI Agent 治理 (Sprint 1-2)

| ID | 功能点 | 描述 | 验收标准 |
|----|--------|------|----------|
| F4.1 | 提案格式标准化 | 所有 Agent 提案遵循统一格式 | `expect(proposalFormat.validated).toBe(true)` |
| F4.2 | 知识共享机制上线 | 提案统一路径存储，跨 Agent 可检索 | `expect(knowledgeBase.searchable).toBe(true)` |

**DoD**: 提案生命周期透明，无人工催促

---

## 3. Epic 拆分

| Epic | Story | 描述 | 优先级 |
|------|-------|------|--------|
| Epic 1 | S1.1 | task_manager 挂起修复 | P0 |
| Epic 1 | S1.2 | Heartbeat 并行稳定性 | P1 |
| Epic 2 | S2.1 | ErrorBoundary 去重 | P1 |
| Epic 2 | S2.2 | CardTreeNode 覆盖率 | P2 |
| Epic 3 | S3.1 | confirmationStore 拆分 | P1 |
| Epic 3 | S3.2 | ADR 试点 | P2 |
| Epic 4 | S4.1 | 提案格式标准化 | P1 |
| Epic 4 | S4.2 | 知识共享机制 | P2 |

---

## 4. 验收标准汇总

| ID | 验收条件 | 验证方法 | 优先级 |
|----|----------|----------|--------|
| V1 | task_manager list < 5s | 单元测试 | P0 |
| V2 | heartbeat 并行任务状态一致 | 集成测试 | P1 |
| V3 | ErrorBoundary 去重完成 | 代码审查 | P1 |
| V4 | CardTreeNode 覆盖率 ≥ 85% | 覆盖率报告 | P2 |
| V5 | confirmationStore 拆分 < 200 行 | 代码行数统计 | P1 |
| V6 | 2 个 ADR 文件创建 | 文件检查 | P2 |
| V7 | 提案格式标准化通过 | 格式验证脚本 | P1 |
| V8 | 知识库可检索 | 搜索测试 | P2 |

---

## 5. 风险

| 风险 | 等级 | 缓解 |
|------|------|------|
| Epic 3 架构债务变更风险高 | 🔴 高 | 分批执行，每批独立测试 |
| ADR 推进需团队共识 | 🟡 中 | PM 参与规范评审 |

---

## 6. 工时估算

| Epic | Dev | Tester | 总计 |
|------|-----|--------|------|
| Epic 1 | 2h | 0.5h | ~2.5h |
| Epic 2 | 4h | 2h | ~6h |
| Epic 3 | 8h | 4h | ~12h |
| Epic 4 | 2h | 0 | ~2h |
| **合计** | **~16h** | **~6.5h** | **~22.5h** |
