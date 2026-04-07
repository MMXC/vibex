# PRD: Analyst 提案执行 — 20260324_185417

## 执行摘要

**5 项改进**: 提案流水线标准化(P1) + task_manager容错(P1) + 任务优先级标注(P2) + 提案去重加速(P0) + 跨Agent知识共享(P2)

---

## Epic 1: 工具链稳定性

### Story 1.1: task_manager.py 容错增强 [B-P1]
**问题**: list/claim 命令挂起无降级，阻塞所有 Agent 心跳自动化。
**验收标准**:
```
expect(task_manager('list --fallback-json')).toHaveProperty('projects')
expect(task_manager('health').status).toBe('ok')
expect(task_manager('list').exitTime).toBeLessThan(5000)
```
**工时**: 1d | 负责: dev

### Story 1.2: 提案去重机制加速推进 [D-P0]
**问题**: 重复提案导致 fix 类任务过载。
**方案**: 紧急修复 dedup Bug → staging 验证 → 集成到 coord 流程
**验收标准**:
```
expect(dedup.scan('proposals/20260324/')).toHaveProperty('duplicates')
expect(coord.createTask().dedupChecked).toBe(true)
```
**工时**: 5h | 负责: dev+tester

---

## Epic 2: 提案管理效率

### Story 2.1: 提案格式标准化 [A-P1]
**验收标准**:
```
expect(analyst.generateProposal()).toMatchTemplate()
expect(proposal.sections).toContain('proposal_list')
expect(proposal.summary).toBeDefined()
```
**工时**: 0.5d | 负责: analyst

### Story 2.2: 任务优先级自动标注 [C-P2]
**验收标准**:
```
expect(task('analyze-requirements').priority).toBeDefined()
expect(task('analyze-requirements').priorityReason).toBeDefined()
```
**工时**: 0.5d | 负责: coord

---

## Epic 3: 跨 Agent 协作

### Story 3.1: 跨 Agent 知识共享机制 [E-P2]
**验收标准**:
```
expect(proposal.id).toMatch(/^[a-z]+-[A-Z]\d{3}$/)
expect(analyst.summarize().overlaps).toHaveLength(0)
```
**工时**: 1d | 负责: analyst+architect

---

## 实施计划

| Sprint | 任务 | 工时 |
|--------|------|------|
| Sprint 1 | D-P0 提案去重加速 | 5h |
| Sprint 1 | B-P1 task_manager容错 | 1d |
| Sprint 2 | A-P1 提案格式标准化 | 0.5d |
| Sprint 2 | C-P2 任务优先级标注 | 0.5d |
| Sprint 3 | E-P2 跨Agent知识共享 | 1d |
