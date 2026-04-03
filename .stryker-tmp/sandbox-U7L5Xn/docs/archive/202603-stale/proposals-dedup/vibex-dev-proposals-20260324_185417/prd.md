# PRD: Dev 提案执行 — 20260324_185417

## 执行摘要

**6 项改进**: 工具链自动化(P1-1,P1-2) + 架构债务(P1-3) + 测试质量(P1-4) + AI治理(P2-2)

---

## Epic 1: 工具链自动化

### Story 1.1: TypeScript Prop 一致性自动检查 [P1-1]
**问题**: .tsx 文件同名 prop 不同类型无检测，prop 冲突导致运行时 bug。
**验收标准**:
```
expect(tsPropAudit()).toHaveProperty('conflicts')
expect(tsPropAudit().conflicts).toEqual([])
```
**工时**: 2h | 负责: dev

### Story 1.2: HEARTBEAT 话题追踪自动化 [P1-2]
**问题**: TASK_THREADS 规范已定但工具链未实现集成。
**验收标准**:
```
expect(heartbeat.claim('task-id')).toHaveProperty('threadId')
expect(heartbeat.replyToThread('om_xxx')).toBeTruthy()
```
**工时**: 4h | 负责: analyst/dev

---

## Epic 2: 架构债务清理

### Story 2.1: confirmationStore.ts 拆分重构 [P1-3] 【需页面集成】
**问题**: 461行 Store，5个子流程混在一起，高破坏性风险。
**方案**: Zustand slice pattern，拆分为 useRequirementStep/useContextStep/useModelStep/useFlowStep
**验收标准**:
```
expect(useRequirementStep).toBeDefined()
expect(useConfirmationStore.getState()).toMatchSnapshot()
expect(confirmationStore).toHaveLength <= 100
```
**工时**: 1.5d | 负责: dev+architect | 风险: 🔴 高，分3批PR
**约束**: 每批PR迁移一个slice，回归测试覆盖

---

## Epic 3: 测试质量

### Story 3.1: E2E 测试纳入 CI [P1-4]
**验收标准**:
```
expect(CI.run('playwright')).toHaveProperty('report')
expect(playwright.tests).toHaveLength(9)
```
**工时**: 2h | 负责: dev

---

## Epic 4: AI 治理

### Story 4.1: proposal_quality_check.py 增强 [P2-2]
**验收标准**:
```
expect(proposalQC('proposal.md')).toHaveProperty('score')
expect(proposalQC().dependencies).toBeDefined()
```
**工时**: 2h | 负责: dev

### Story 4.2: JSON Schema 统一验证 [P2-1]
**验收标准**:
```
expect(validate('task.json')).toBeTruthy()
expect(validate('invalid.json')).toHaveProperty('errors')
```
**工时**: 4h | 负责: dev

---

## 实施计划

| 顺序 | 任务 | 工时 | 依赖 |
|------|------|------|------|
| 1 | P1-4 E2E入CI | 2h | 无 |
| 2 | P1-2 HEARTBEAT自动化 | 4h | 无 |
| 3 | P1-1 Prop一致性检查 | 2h | 无 |
| 4 | P2-1 JSON Schema验证 | 4h | 无 |
| 5 | P1-3 confirmationStore拆分(第1批) | 1.5d | 无 |
| 6 | P2-2 proposal_quality增强 | 2h | 无 |
