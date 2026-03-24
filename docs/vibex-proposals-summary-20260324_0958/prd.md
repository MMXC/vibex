# PRD: VibeX 提案汇总执行计划 — 2026-03-24

## 执行摘要

**背景**: 6 个 Agent 完成了 2026-03-24 自检，汇总出 21 条提案（P0×3, P1×8, P2×7, P3×3），涉及工具链稳定性、前端质量、架构债务、AI 治理四个领域。

**目标**: 止血优先，3 周内完成所有 P0/P1 项，恢复 CI 可靠性与 Agent 心跳自动化。

**成功指标**:
- P0 项 0 个遗留（全部清零）
- CI 测试通过率 100%
- task_manager 命令无挂起
- E2E 测试纳入 CI pipeline

---

## Epic 1: 工具链止血（P0 优先）

### Story 1.1: task_manager.py 挂起修复 [P0]
**问题**: `task_manager.py list/claim` 执行后无输出，卡在 `CMDS DEFINITION`，阻塞所有 Agent 心跳自动化。
**根因**: 循环依赖或死锁、阻塞 I/O 无超时保护。
**验收标准**:
```
expect(task_manager('list')).not.toBe(null)
expect(task_manager('list')).toHaveProperty('projects')
expect(task_manager('claim')).resolves.not.toThrow()
```
**工时**: 2-4h | 负责: dev

### Story 1.2: page.test.tsx 4 个过时用例修复 [P0]
**问题**: `simplified-flow` 重构后布局从 5 栏 → 3 步流程，4 个测试用例过时。
**验收标准**:
```
expect(page).toMatchSnapshot()
expect(page.locator('step')).toHaveCount(3)
```
**工时**: 1h | 负责: dev

### Story 1.3: proposal-dedup 生产验证 [P0]
**问题**: dedup 机制从未在真实数据上运行，路径 Bug + 字段 Bug 刚修复。
**验收标准**:
```
expect(dedup.run('proposals/20260323')).toHaveProperty('duplicates')
expect(dedup.keywords).toMatch(/中文bigram/)
```
**工时**: 2d | 负责: dev + tester

### Story 1.4: heartbeat 幽灵任务误报修复 [P1]
**问题**: heartbeat 读取不存在项目目录时仍报告"待处理"，产生误报。
**验收标准**:
```
expect(heartbeat.scan('nonexistent')).toBeEmpty()
expect(heartbeat.scan('active')).toHaveLength > 0
```
**工时**: 0.5d | 负责: dev

### Story 1.5: HEARTBEAT.md 话题追踪脚本 [P1]
**问题**: TASK_THREADS 规范存在但工具链未实现。
**验收标准**:
```
expect(heartbeat.replyToThread('om_xxx')).toBeTruthy()
expect(heartbeat.extractThreadId(HEARTBEAT.md)).toMatch(/om_/)
```
**工时**: 1d | 负责: analyst/dev

---

## Epic 2: 前端质量提升（P1 优先）

### Story 2.1: ErrorBoundary 组件去重 [P1]
**问题**: `components/error-boundary/ErrorBoundary.tsx` 和 `components/ui/ErrorBoundary.tsx` 两份实现。
**验收标准**:
```
expect(ErrorBoundary).toBeLocatedIn('components/ui/')
expect(import('error-boundary')).toBeRemoved()
```
**工时**: 0.5d | 负责: dev

### Story 2.2: CardTreeNode 单元测试补全 [P1]
**问题**: CardTreeNode 缺少独立单元测试，仅 Epic3 集成测试覆盖。
**验收标准**:
```
expect(render(<CardTreeNode />)).toBeTruthy()
expect(render(<CardTreeNode><TreeNode/></CardTreeNode>)).toHaveLength(1)
```
**工时**: 4h | 负责: dev

### Story 2.3: E2E 测试纳入 CI [P1]
**问题**: 9 个 Playwright 测试游离于 CI 之外，无自动化回归防护。
**验收标准**:
```
expect(CI.run('playwright')).toHaveProperty('report')
expect(playwright.tests).toHaveLength(9)
```
**工时**: 2h | 负责: dev

### Story 2.4: API 错误处理测试补全 [P1]
**问题**: `src/services/api.test.ts` 仅验证方法存在，不测错误边界。
**验收标准**:
```
expect(api.get()).rejects.toThrow() // 401/403/404/500
expect(api.post()).rejects.toThrow() // network timeout
expect(api.cancel()).rejects.toThrow() // concurrent cancellation
```
**工时**: 2h | 负责: dev

### Story 2.5: Accessibility 测试基线 [P1]
**问题**: 无 WCAG 合规性自动化检测。
**验收标准**:
```
expect(accessibility.check('confirm')).toHaveNoViolations()
expect(accessibility.check('flow')).toHaveNoViolations()
```
**工时**: 2h | 负责: dev

---

## Epic 3: 架构债务清理

### Story 3.1: confirmationStore.ts 拆分重构 [P1]
**问题**: `confirmationStore.ts` 461 行，5 个子流程混在一个 Store。
**方案**: Zustand slice pattern 拆分为 `useRequirementStep/useContextStep/useModelStep/useFlowStep`
**验收标准**:
```
expect(useRequirementStep).toBeDefined()
expect(useContextStep).toBeDefined()
expect(confirmationStore).toHaveLength <= 100
```
**工时**: 1.5d | 负责: dev + architect

### Story 3.2: 错误处理模式统一 [P2]
**方案**: ErrorType 枚举 + useErrorHandler hook
**工时**: 2d | 负责: dev

### Story 3.3: 共享类型包建设 [P3]
**方案**: `packages/types/` 前后端类型同步
**工时**: 2d | 负责: architect

---

## Epic 4: AI Agent 治理

### Story 4.1: MEMORY.md 失败模式扩展 [P2]
**工时**: 0.5d | 负责: analyst

### Story 4.2: 分析报告质量检查机制 [P2]
**工时**: 0.5d | 负责: analyst

---

## 实施计划

### Sprint 1（本週）: 止血
| 任务 | 负责 | 工时 |
|------|------|------|
| P0-2 task_manager 挂起修复 | dev | 2-4h |
| P0-1 page.test.tsx 修复 | dev | 1h |
| P1-1 ErrorBoundary 去重 | dev | 0.5d |
| P1-2 heartbeat 幽灵任务修复 | dev | 0.5d |
| P1-3 CardTreeNode 单元测试 | dev | 4h |

### Sprint 2（下週）: 生产验证 + 架构铺垫
| 任务 | 负责 | 工时 |
|------|------|------|
| P0-3 dedup 生产验证 | dev+tester | 2d |
| P1-4 confirmationStore 拆分 | dev+architect | 1.5d |
| P1-8 HEARTBEAT 话题追踪 | analyst/dev | 1d |

### Sprint 3: 质量与架构
- P2-2 错误处理统一（2d）
- P1-5 E2E 纳入 CI（2h）
- P1-6 API 错误测试（2h）
- P1-7 Accessibility 基线（2h）
- P3-1 共享类型包（2d）

---

## 非功能需求

- **向后兼容**: 所有拆分后的 Store 保持原有 API 接口
- **CI 通过率**: ≥ 95%（基线当前约 80%）
- **性能**: task_manager 命令响应时间 ≤ 5s
- **可测试性**: 所有新功能含单元测试覆盖

---

## 待确认项

1. dedup reviewer1-fix 进展：Bug 修复由谁负责？是否已派发给 dev？
2. confirmationStore 拆分范围：是否包含 `useConfirmationStore` 历史快照逻辑？
3. E2E CI 集成：当前 CI runner 是否支持 Playwright？
