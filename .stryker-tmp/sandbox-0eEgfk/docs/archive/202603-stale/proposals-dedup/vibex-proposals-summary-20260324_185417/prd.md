# PRD: VibeX 提案汇总执行计划 — 2026-03-24（晚）

## 执行摘要

**背景**: 6 个 Agent 自检汇总 21 条提案（P0×3, P1×8, P2×7, P3×3），聚焦工具链止血、前端质量、架构债务、AI 治理四大领域。

**目标**: 止血优先，3 周内完成所有 P0/P1 项，恢复 CI 可靠性与 Agent 自动化。

**成功指标**: P0 遗留 0 个 | CI 通过率 100% | task_manager 无挂起 | E2E 入 CI

---

## Epic 1: 工具链止血（P0 优先）

### Story 1.1: task_manager.py 挂起修复 [P0-2]
**问题**: `list/claim` 命令执行后无输出，卡在 `CMDS DEFINITION`。
**验收标准**:
```
expect(exec('python3 task_manager.py list').stdout).toMatch(/project/)
expect(exec('python3 task_manager.py claim').returncode).toBe(0)
expect(exec('python3 task_manager.py list').exitTime < 5000)
```
**工时**: 2-4h | 负责: dev

### Story 1.2: page.test.tsx 过时用例修复 [P0-1]
**问题**: simplified-flow 重构后 4 个测试过时（three-column layout, navigation, five steps, basic elements）。
**验收标准**:
```
expect(page.locator('[data-testid="step"]')).toHaveCount(3)
expect(page).toMatchSnapshot()
```
**工时**: 1h | 负责: dev

### Story 1.3: proposal-dedup 生产验证 [P0-3]
**问题**: dedup 机制未在真实数据上运行，Chinese bigram 边界未验证。
**验收标准**:
```
expect(dedup.run('proposals/20260323')).toHaveProperty('duplicates')
expect(dedup.precision).toBeGreaterThanOrEqual(0.80)
expect(dedup.recall).toBeGreaterThanOrEqual(0.70)
```
**工时**: 2d | 负责: dev + tester

### Story 1.4: heartbeat 幽灵任务修复 [P1-2]
**问题**: 读取不存在项目目录时仍报告"待处理"，产生误报。
**验收标准**:
```
expect(heartbeat.scan('nonexistent')).toBeEmpty()
expect(heartbeat.scan('active-project')).toHaveLength > 0
```
**工时**: 0.5d | 负责: dev

### Story 1.5: HEARTBEAT 话题追踪脚本 [P1-8]
**问题**: TASK_THREADS 规范存在但工具链未实现。
**验收标准**:
```
expect(heartbeat.replyToThread('om_xxx', msg)).toBeTruthy()
expect(heartbeat.extractThreadId(file)).toMatch(/om_/)
```
**工时**: 1d | 负责: analyst/dev

---

## Epic 2: 前端质量提升

### Story 2.1: ErrorBoundary 去重 [P1-1]
**验收标准**:
```
expect(ErrorBoundary.location).toBe('components/ui/')
expect(import('error-boundary/ErrorBoundary')).toBeRemoved()
```
**工时**: 0.5d | 负责: dev

### Story 2.2: CardTreeNode 单元测试 [P1-3]
**验收标准**:
```
expect(render(<CardTreeNode><TreeNode/></CardTreeNode>)).toHaveLength(1)
expect(CardTreeNode.coverage).toBeGreaterThanOrEqual(85)
```
**工时**: 4h | 负责: dev

### Story 2.3: E2E 纳入 CI [P1-5]
**验收标准**:
```
expect(CI.run('playwright')).toHaveProperty('report')
expect(playwright.tests).toHaveLength(9)
```
**工时**: 2h | 负责: dev

### Story 2.4: API 错误测试补全 [P1-6]
**验收标准**:
```
expect(api.get()).rejects.toMatchObject({status: 401})
expect(api.post()).rejects.toThrow() // timeout
```
**工时**: 2h | 负责: dev

### Story 2.5: Accessibility 基线 [P1-7]
**验收标准**:
```
expect(accessibility.check('confirm')).toHaveNoViolations()
expect(accessibility.check('flow')).toHaveNoViolations()
```
**工时**: 2h | 负责: dev

---

## Epic 3: 架构债务清理

### Story 3.1: confirmationStore 拆分 [P1-4] 【需页面集成】
**验收标准**:
```
expect(useRequirementStep).toBeDefined()
expect(confirmationStore).toHaveLength <= 100
expect(Object.keys(useConfirmationStore.getState())).toMatchSnapshot()
```
**工时**: 1.5d | 负责: dev+architect | 风险: 🔴 高破坏性，分3批PR

### Story 3.2: 错误处理模式统一 [P2-2]
**验收标准**:
```
expect(ErrorType).toEqual(['NETWORK_ERROR', 'TIMEOUT', 'PARSE_ERROR', 'UNKNOWN'])
expect(useErrorHandler).toBeDefined()
```
**工时**: 2d | 负责: dev

### Story 3.3: 共享类型包 [P3-1]
**工时**: 2d | 负责: architect

---

## Epic 4: AI Agent 治理

### Story 4.1: MEMORY.md 失败模式扩展 [P2-3]
**工时**: 0.5d | 负责: analyst

### Story 4.2: 分析报告质量检查 [P2-4]
**工时**: 0.5d | 负责: analyst

---

## Sprint 计划

| Sprint | 任务 | 工时 |
|--------|------|------|
| Sprint 1 | P0-2 task_manager, P0-1 page.test, P1-1 ErrorBoundary, P1-2 heartbeat, P1-3 CardTree测试 | ~2d |
| Sprint 2 | P0-3 dedup生产验证, P1-4 confirmationStore(第1批), P1-8 HEARTBEAT | ~3d |
| Sprint 3 | P1-5 E2E入CI, P1-6 API测试, P1-7 a11y, P2-2 错误处理 | ~2d |

---

## 非功能需求
- 向后兼容: confirmationStore 拆分保持原有 API
- CI 通过率 ≥ 95%
- task_manager 响应 ≤ 5s
