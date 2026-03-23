# Proposal Synthesis: vibex-proposals-synthesis-20260323

**任务**: `vibex-proposals-synthesis-20260323 / analyze-requirements`  
**分析师**: analyst  
**分析时间**: 2026-03-23 22:49 (Asia/Shanghai)  
**提案来源**: 6 agents (dev/analyst/architect/pm/tester/reviewer)

---

## 1. 执行摘要

**提案总数**: 6 agents 共产出约 20+ 个提案（去重后 15+ 个方向）

**高频共识提案**（被 ≥ 3 个 agent 提及）:

| 提案 | 提及次数 | Agent 来源 | 推荐优先级 |
|------|---------|-----------|-----------|
| page.test.tsx 4 个失败修复 | 3 | pm/tester/reviewer | P0 |
| ReactFlow 可视化统一架构 | 3 | analyst/architect/dev | P1 |
| task_manager.py SyntaxWarning | 2 | dev/tester | P0（已修复，待验证）|
| heartbeat 幽灵任务误报 | 2 | tester/reviewer | P1 |
| team-tasks JSON schema 统一 | 2 | dev + 原始提案 | P1 |

---

## 2. 去重合并后的完整提案清单

### P0 — 立即处理（已识别，Dev 视情况确认状态）

#### P0-A: page.test.tsx 4 个失败修复

**问题**: simplified-flow 从 5 步简化为 3 步后，`page.test.tsx` 中的断言未同步更新：
- `should Render three-column layout`
- `should render navigation`
- `should have five process steps`
- `should Render with basic elements`

**影响**: npm test 通过率从 99.8% 降至约 99.2%，测试套件完整性受损

**提案来源**: pm, tester, reviewer

**工作量**: S（2-4 小时）

**方案**: 更新 `page.test.tsx` 断言匹配 3-step 流程，或将测试标记为 `skip` 并创建专项修复任务

**验收标准**:
- `npm test` 通过率恢复至 99.8%+ (2104/2104)
- 0 skipped tests（除非有明确理由）

---

#### P0-B: task_manager.py SyntaxWarning 修复

**状态**: Dev 提案显示已修复 (D-001)，需 Tester/Reviewer 验证

**验收标准**:
- `python3 -W error task_manager.py list` 无 SyntaxWarning
- 6 个 heartbeat 脚本调用均无警告

---

### P1 — 下一迭代处理

#### P1-A: ReactFlow 可视化平台统一架构

**问题**: ReactFlow、Mermaid、JSON Tree 三个可视化能力分散，缺乏统一抽象层

**提案来源**: analyst (A-002), architect (提案1), dev (D-003)

**架构方案** (Architect 产出):
```
src/components/visualization/
├── platform/
│   ├── VibeXFlow.tsx       # 统一画布
│   ├── NodeRegistry.ts     # 节点注册表
│   └── EventBus.ts         # 事件总线
├── nodes/                   # 各类节点
└── hooks/                  # useFlowState, useNodeSelection
```

**工作量**: M-L（3-5 天）

**验收标准**:
- V1: `useVisualization` Hook 统一管理三种可视化类型
- V2: 新增节点类型注册时间 < 1 天（而非重写）
- V3: 50+ 组件测试通过

---

#### P1-B: heartbeat 脚本幽灵任务误报修复

**问题**: heartbeat 脚本读取不存在的 team-tasks 目录时仍报告"待处理"

**提案来源**: tester, reviewer

**根因**: 脚本未检查 `/root/.openclaw/team-tasks/projects/{project}/tasks/` 目录是否存在

**工作量**: S（1-2 小时）

**验收标准**:
- 无效目录不再触发任务扫描
- 6 个 agent heartbeat 日志无幽灵任务

---

#### P1-C: team-tasks JSON schema 统一

**问题**: 两种 JSON 格式混用（标准格式 vs 简化格式），导致 `task_manager.py` 部分命令失败

**提案来源**: dev (D-002)

**工作量**: M（1-2 天）

**方案**: 统一为 `{project, goal, mode, status, stages}` 格式，迁移现有简化数据

**验收标准**:
- `task_manager.py list` 对所有项目输出正确
- `task_manager.py status` 无 KeyError

---

#### P1-D: 提案生命周期追踪系统

**问题**: 提案 → 决策 → 开发 链路断裂，无法衡量落地率

**提案来源**: architect (提案2)

**工作量**: S（1 天）

**方案**: 扩展提案元数据字段，添加 status/priority/linkedProject

**验收标准**:
- 新提案格式包含完整元数据
- 提案落地率可量化统计

---

#### P1-E: visualization 项目落地收口

**问题**: Epic3-6 代码存在但未 commit 到 `vibex-reactflow-visualization` 项目

**提案来源**: dev (D-003)

**工作量**: S（2 小时）

**验收标准**:
- 所有 epic 代码已 push
- 统一审查收口

---

### P2 — 后续迭代处理

#### P2-A: Jest OOM 优化

**问题**: JsonTreeRenderer 测试在 CI 环境因 worker 内存不足崩溃

**提案来源**: dev, tester

**工作量**: S（1 天）

**方案**: Jest `--maxWorkers=1` + `NODE_OPTIONS="--max-old-space-size=4096"`

---

#### P2-B: ADR 体系建设

**问题**: 架构决策散落在 PR 描述中，缺乏结构化记录

**提案来源**: architect (提案3)

**工作量**: XS（0.5 天）

**方案**: 创建 `docs/adr/` 目录和模板，记录关键决策

---

#### P2-C: 阶段任务报告约束清单解析修复

**问题**: AGENTS.md 约束清单显示为单字截断

**提案来源**: reviewer

**工作量**: S（调试）

---

## 3. 提案优先级矩阵

| 优先级 | 提案 | 负责人 | 工作量 | 依赖 |
|--------|------|--------|--------|------|
| P0 | page.test.tsx 修复 | dev | S | 无 |
| P0 | task_manager.py 验证 | tester | S | dev 已修复 |
| P1 | ReactFlow 可视化统一 | dev/architect | M-L | PM PRD |
| P1 | heartbeat 幽灵任务修复 | dev | S | 无 |
| P1 | team-tasks JSON schema 统一 | dev | M | 无 |
| P1 | 提案生命周期追踪 | analyst/architect | S | PM 模板设计 |
| P1 | visualization 落地收口 | dev | S | 无 |
| P2 | Jest OOM 优化 | dev | S | 无 |
| P2 | ADR 体系建设 | architect | XS | 无 |
| P2 | 约束清单解析修复 | dev | S | 调试 |

---

## 4. 推荐下一轮项目

**建议创建单一项目**: `vibex-q1-cleanup-sprint`

| Epic | 内容 | 工作量 |
|------|------|--------|
| Epic1 | page.test.tsx 修复 + task_manager.py 验证 | S |
| Epic2 | heartbeat 幽灵任务修复 | S |
| Epic3 | team-tasks JSON schema 统一 | M |
| Epic4 | visualization 项目落地收口 | S |
| Epic5 | Jest OOM + 约束清单解析 | S |

**不纳入本项目**（建议单独立项）:
- ReactFlow 可视化统一 (P1, M-L) → `vibex-visualization-platform`
- 提案生命周期追踪 (P1, S) → `vibex-proposal-lifecycle`

---

## 5. 风险与约束

| 风险 | 影响 | 缓解 |
|------|------|------|
| page.test.tsx 修复可能引入新问题 | 中 | 全量回归测试 |
| JSON schema 迁移影响现有项目 | 中 | 备份 + 逐步迁移 |
| visualization 项目范围蔓延 | 高 | 拆分两阶段交付 |

---

## 6. 验收标准

| # | 标准 |
|---|------|
| V1 | 下一轮项目 `vibex-q1-cleanup-sprint` 已创建 |
| V2 | P0 任务（page.test.tsx + task_manager 验证）已完成 |
| V3 | P1 任务至少 3/5 已派发 |
| V4 | 提案落地率统计口径已定义 |
