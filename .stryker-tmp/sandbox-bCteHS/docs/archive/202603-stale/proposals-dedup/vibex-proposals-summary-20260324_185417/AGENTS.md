# AGENTS.md — VibeX 提案汇总执行开发约束

**项目**: vibex-proposals-summary-20260324_185417  
**日期**: 2026-03-24  
**角色**: architect  
**状态**: Proposed

---

## 开发约束

本文件定义各 Agent 在执行提案汇总任务时的开发规范与约束清单。

---

## 通用约束（所有 Agent）

### 提交规范
- **每条 PR 必须包含关联的提案 ID**（如 `P0-2`, `P1-3`）
- **Commit 格式**: `[<提案ID>] <简短描述>`
  - 示例: `[P0-2] fix task_manager list timeout with decorator`
- **Changelog 更新**: 每次 merge 到 main 必须更新 `CHANGELOG.md`

### 测试规范
- **所有变更必须有测试覆盖**，除非是纯文档/配置变更
- **E2E 测试失败 = PR block**，不允许绕过
- **覆盖率下降 = PR block**，必须补测或降低阈值（需 architect 审批）

### 代码审查规范
- **架构变更（P1-4 confirmationStore）**：必须 architect 参与 review
- **工具链变更（P0-2 task_manager）**：必须 reviewer + 至少一个 agent 验证
- **PR 描述必须包含**: 关联提案、测试结果、验证命令

---

## Dev Agent 约束

### P0-2 task_manager 修复
- 添加超时保护后，必须测试所有子命令：`list`, `claim`, `status`, `update`, `phase1`, `phase2`
- 超时阈值统一设为 **5 秒**，不可修改
- **禁止**删除现有的日志输出（调试信息）

### P0-3 dedup 生产验证
- 阈值调整必须通过配置文件（`config/dedup.yaml`），禁止硬编码
- 每次调整阈值后必须重新跑完整数据集
- **禁止**修改 dedup 算法核心逻辑，只能调整参数

### P1-4 confirmationStore 拆分
- **必须分 3 批提交**，禁止一次性全量迁移
- 原有 `useConfirmationStore` API 必须保持兼容（可添加废弃警告）
- 每批次迁移后必须运行完整 E2E 套件（≥ 30 分钟）
- 拆分后的 hooks 必须有 JSDoc 类型注释
- **禁止**在迁移期间修改原有 store 的状态逻辑

### P1-5 E2E 入 CI
- Flaky test 标记必须在代码中明确标注 `// @flaky`
- Retry 次数固定为 3 次，不可修改
- 测试报告必须上传到 GitHub Artifacts（命名规范: `e2e-report-{date}`）

---

## Tester Agent 约束

### P0-3 dedup 验证
- 抽样验证样本量 = **20 条**，必须人工确认
- 验证报告必须包含：精确率、召回率、误判案例分析

### P1-3 CardTreeNode 测试
- 覆盖率目标 ≥ **85%**
- 必须覆盖的测试场景：
  1. 正常渲染（单节点）
  2. 空 children 空状态
  3. 多层级嵌套展开
  4. 边界：超长文本截断

### P1-7 Accessibility 测试
- 必须使用 `jest-axe`
- 必须测试的页面：`/confirm`、`/flow`
- 违规阈值 = 0（不允许任何 WCAG 违规）

---

## Reviewer Agent 约束

### 架构变更审查（P1-4 confirmationStore）
- 必须验证 API 兼容性
- 必须检查是否有遗留状态未清理
- 必须运行 `npm test` + `npx playwright test` 双重验证

### 工具链审查（P0-2 task_manager）
- 必须验证超时保护生效
- 必须检查日志输出未被删除
- 必须用 `time` 命令验证响应时间 ≤ 5s

---

## Architect Agent 约束

### P3-1 共享类型包
- 类型包必须使用 **TypeScript project references**
- 所有类型必须导出 JSDoc 注释
- 版本管理遵循 **semver**

### ADR 决策约束
- 所有 ADR 必须在项目文档中记录
- ADR 状态变更必须通知 coord
- ADR-001/002/003（见 architecture.md）均为 Proposed 状态，等待 coord 审批

---

## Coord Agent 约束

### Sprint 节奏控制
- Sprint 0 完成后才能启动 Sprint 1
- Sprint 1 完成后才能启动 Sprint 2
- Sprint 2 P1-4 完成后才能启动 Sprint 3 P3-1

### 阻塞升级
- P1-4 任意批次失败超过 1 天 → 升级到 architect 决策
- task_manager 新增 Bug → 回滚并创建 fix 任务

---

## 文档约束

| 文档 | 负责人 | 更新时机 |
|------|--------|----------|
| CHANGELOG.md | dev | 每次 merge 到 main |
| architecture.md | architect | ADR 状态变更 |
| IMPLEMENTATION_PLAN.md | architect | Sprint 进度更新 |
| AGENTS.md | architect | 约束变更 |

---

## 验证命令速查

```bash
# task_manager 响应时间
time python3 task_manager.py list

# E2E 测试
npx playwright test --reporter=html

# 单元测试覆盖率
npm test -- --coverage

# Accessibility
npm test -- accessibility.test.ts

# confirmationStore 拆分验证
npm test -- confirmation.test.ts
npx playwright test e2e/confirm
```
