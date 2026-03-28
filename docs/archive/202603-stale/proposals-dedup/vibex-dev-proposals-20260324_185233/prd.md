# PRD: Dev 提案执行 — 20260324_185233

## 执行摘要

**3 项改进**: CardTreeNode单元测试 + proposal-dedup生产验证 + 前端错误处理统一

---

## Epic 1: 测试质量

### Story 1.1: CardTreeNode 组件单元测试补全 [D-001]
**问题**: CardTreeNode 无独立单元测试，仅 Epic3 集成测试覆盖。
**验收标准**:
```
expect(render(<CardTreeNode><TreeNode/></CardTreeNode>)).toHaveLength(1)
expect(render(<CardTreeNode />)).toBeTruthy() // 空children
expect(CardTreeNode.coverage.branches).toBeGreaterThanOrEqual(85)
```
**工时**: 4h | 负责: dev

---

## Epic 2: 工具链验证

### Story 2.1: proposal-dedup 机制生产验证 [D-002]
**问题**: dedup 机制从未在真实数据运行，Chinese bigram 边界未验证。
**阶段一**: staging环境 + 真实数据（proposals/20260323_*）
**阶段二**: Chinese bigram提取验证（20条人工标注样本对比）
**阶段三**: 修复 + 回归
**验收标准**:
```
expect(dedup.precision).toBeGreaterThanOrEqual(0.80)
expect(dedup.recall).toBeGreaterThanOrEqual(0.70)
expect(dedup.run('proposals/')).toHaveProperty('duplicates')
```
**工时**: 2d | 负责: dev+tester
**依赖**: proposal-dedup-reviewer1-fix 完成

---

## Epic 3: 架构模式

### Story 3.1: 前端错误处理模式统一 [D-003]
**问题**: 各组件错误处理分散，无统一 ErrorType 枚举和 useErrorHandler hook。
**方案**: ErrorType枚举 → useErrorHandler hook → 迁移CardTree/useJsonTreeVisualization
**验收标准**:
```
expect(ErrorType).toEqual(['NETWORK_ERROR', 'TIMEOUT', 'PARSE_ERROR', 'UNKNOWN'])
expect(useErrorHandler).toBeDefined()
expect(errorCode.reduce).toBeLessThan(30) // 代码行数减少≥30%
```
**工时**: 2d | 负责: dev
**约束**: 保持原有处理逻辑作为 fallback

---

## 实施计划

| 顺序 | 任务 | 工时 | 依赖 |
|------|------|------|------|
| 1 | D-001 CardTreeNode单元测试 | 4h | 无 |
| 2 | D-002 dedup生产验证 | 2d | reviewer1-fix完成 |
| 3 | D-003 错误处理统一 | 2d | D-002完成后启动 |

**D-001 和 D-002 可并行执行**
