# 开发约束 (AGENTS.md): Agent 每日自检任务框架

> **项目**: agent-self-evolution-20260330
> **阶段**: Phase1 — 自检框架标准化
> **版本**: 1.0.0
> **日期**: 2026-03-30
> **Architect**: Architect Agent
> **工作目录**: /root/.openclaw/vibex

---

## 1. 技术栈约束

| 维度 | 约束 |
|------|------|
| **自检框架** | HEARTBEAT.md（现有） | 心跳驱动已完善 |
| **任务管理** | task_manager.py（现有） | 已有基础设施 |
| **文档格式** | Markdown + YAML frontmatter | 轻量、可追溯 |
| **脚本语言** | TypeScript (ts-node) | 现有项目已用 |
| **测试框架** | Vitest | 现有项目已用 |

---

## 2. 文件操作约束

### 2.1 允许修改

| 文件 | 操作 | 说明 |
|------|------|------|
| `docs/templates/agent-selfcheck-template.md` | 新建 | 统一自检模板 |
| `src/scripts/validate-selfcheck.ts` | 新建 | 自检验证脚本 |
| `src/scripts/__tests__/validate-selfcheck.test.ts` | 新建 | 验证测试 |
| `src/scripts/collect-proposals.ts` | 新建 | 提案收集脚本 |
| `src/scripts/__tests__/collect-proposals.test.ts` | 新建 | 收集测试 |
| `src/scripts/update-learnings.ts` | 新建 | 经验沉淀脚本 |
| `src/types/self-check.ts` | 新建 | 类型定义 |
| `docs/LEARNINGS.md` | 修改 | 追加经验记录 |

### 2.2 禁止操作

| 操作 | 原因 |
|------|------|
| ❌ 修改 HEARTBEAT.md 核心流程 | 已有基础设施 |
| ❌ 修改 task_manager.py 核心逻辑 | 保持稳定 |
| ❌ 删除现有自检文档 | 可追溯性要求 |
| ❌ 引入新依赖 | 保持轻量 |

---

## 3. 自检模板规范

### 3.1 必需字段

```yaml
---
agent: [agent-name]  # 必须
date: [YYYY-MM-DD]   # 必须
score: [1-10]        # 必须
---
```

### 3.2 格式要求

```markdown
## 今日完成
| 任务 ID | 描述 | 状态 | 备注 |

## 质量指标
| 指标 | 值 | 目标 |

## 改进提案
- [PROPOSAL] 具体提案内容

## 经验沉淀
| ID | 情境 | 经验 | 改进 |
```

### 3.3 标签规则

| 标签 | 用途 | 示例 |
|------|------|------|
| `[PROPOSAL]` | 改进提案 | `- [PROPOSAL] 优化流程` |
| `[ACTIONABLE]` | 可执行建议 | `- [ACTIONABLE] 立即修复` |
| `[TECH_DEBT]` | 技术债务 | `- [TECH_DEBT] 遗留代码` |

---

## 4. 各 Agent 自检要求

### 4.1 Analyst

| 检查项 | 验收标准 |
|--------|----------|
| 分析产出自检 | tasks >= 1 |
| 根因分析质量 | accuracy >= 7 |
| 提案提交 | proposals >= 1 |
| 经验沉淀 | lessons >= 1 |

### 4.2 PM

| 检查项 | 验收标准 |
|--------|----------|
| PRD 产出自检 | tasks >= 1 |
| Epic 拆分质量 | completeness >= 0.8 |
| 验收标准格式 | expect() 断言格式 |
| 提案提交 | proposals >= 1 |

### 4.3 Architect

| 检查项 | 验收标准 |
|--------|----------|
| 架构设计数量 | designs >= 1 |
| 技术债务标注 | techDebt == true |
| 接口完整性 | coverage >= 0.9 |
| 提案提交 | proposals >= 1 |

### 4.4 Dev

| 检查项 | 验收标准 |
|--------|----------|
| 代码提交数量 | commits >= 1 |
| 测试覆盖率 | coverage >= 80% |
| Bug 引入数 | bugs == 0 |
| 提案提交 | proposals >= 1 |

### 4.5 Tester

| 检查项 | 验收标准 |
|--------|----------|
| 测试用例执行 | tests >= 1 |
| Bug 发现数 | bugs >= 0 |
| 测试文档更新 | docs == true |
| 提案提交 | proposals >= 1 |

### 4.6 Reviewer

| 检查项 | 验收标准 |
|--------|----------|
| 审查数量 | reviews >= 1 |
| 问题定位准确 | accuracy >= 0.9 |
| 代码质量评分 | quality >= 7 |
| 提案提交 | proposals >= 1 |

### 4.7 Coord

| 检查项 | 验收标准 |
|--------|----------|
| 项目协调数 | projects >= 1 |
| 决策正确率 | accuracy >= 0.8 |
| 任务派发数 | dispatched >= 1 |
| 提案提交 | proposals >= 1 |

---

## 5. 测试要求

### 5.1 覆盖率门禁

```bash
pnpm test --coverage --reporter=text

# 覆盖率要求:
# - validate-selfcheck.ts: ≥ 90%
# - collect-proposals.ts: ≥ 85%
# - update-learnings.ts: ≥ 80%
```

### 5.2 集成测试

```bash
# 1. 验证自检文档
npx ts-node src/scripts/validate-selfcheck.ts docs/templates/agent-selfcheck-template.md

# 2. 收集提案
npx ts-node src/scripts/collect-proposals.ts docs 2026-03-30

# 3. 验证输出
cat proposals/2026-03-30/proposals.json
```

---

## 6. 提交流程

```
1. 每日心跳触发自检
2. Agent 填写自检文档
3. 运行: npx ts-node validate-selfcheck.ts <doc>
4. 如有提案，运行: collect-proposals.ts
5. 如有经验，运行: update-learnings.ts
6. 提交: git commit -m "selfcheck([agent]): <date>"
```

---

## 7. 回滚计划

| 场景 | 应对 |
|------|------|
| 提案收集失败 | 手动检查 proposals/ 目录 |
| 经验沉淀失败 | 手动编辑 LEARNINGS.md |
| 验证误报 | 使用 `--skip-validation` 跳过 |

---

## 8. 相关文档

| 文档 | 路径 |
|------|------|
| 架构文档 | `docs/agent-self-evolution-20260330/architecture.md` |
| PRD | `docs/agent-self-evolution-20260330/prd.md` |
| 实现计划 | `docs/agent-self-evolution-20260330/IMPLEMENTATION_PLAN.md` |

---

*本文档由 Architect Agent 生成，用于约束各 agent 的自检行为。*
