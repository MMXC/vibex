# VibeX Sprint 24 — Agent Assignment & Collaboration Protocol

**Architect**: architect 🤖
**Date**: 2026-05-03
**Project**: vibex-proposals-sprint24
**Phase**: architect-review
**Status**: Agent Assignment Complete

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint24
- **执行日期**: 2026-05-03

---

## 1. Agent 角色定义

### 1.1 Architect（本文档）
- **职责**：技术架构设计、API 定义、测试策略制定
- **产出物**：`architecture.md` / `IMPLEMENTATION_PLAN.md` / `AGENTS.md`
- **退出条件**：三个文档完成，提交 Coord 评审

### 1.2 Analyst
- **职责**：问题真实性验证、需求偏差分析、风险矩阵
- **产出物**：`analysis.md` + gstack 验证报告
- **状态**：✅ 已完成

### 1.3 PM
- **职责**：PRD 撰写、验收标准定义
- **产出物**：`prd.md` + `specs/` 目录
- **状态**：✅ 已完成

### 1.4 Dev（代码实现）
- **职责**：实现修复、E2E 测试补充、build gate 验证
- **并行策略**：建议 2-3 人并行（见 §3 执行顺序）
- **上游依赖**：architecture.md、IMPLEMENTATION_PLAN.md、prd.md、specs/

### 1.5 Coord
- **职责**：跨 Agent 协调、资源调度、决策确认
- **关键行动**：
  - 确认 P002 后端 TS 范围是否 Sprint 24 修复
  - 确认 P003 Onboarding 组件合并策略（OnboardingModal vs GuideOverlay）
  - Repo admin 执行 P001 webhook secret 配置验证

---

## 2. 任务分配矩阵

### Week 1（并行执行）

| Task ID | 描述 | 执行者 | 优先级 | 状态 |
|---------|------|--------|--------|------|
| T2.2 | 后端 TS 审计 | Dev | P1 | ⏳ 待验证 |
| T2.3 | mcp-server TS 审计 | Dev | P1 | ⏳ 待验证 |
| T2.4 | 量化 TS 错误清单 | Dev | P1 | ⏳ 待执行 |
| T2.5 | P002 范围决策 | Coord | P0 | ⏳ 待决策 |
| T3.1-T3.5 | P003 Onboarding data-testid 修复 | Dev | P0 | ⏳ 待执行 |
| T3.6-T3.7 | P003 页面集成 | Dev | P1 | ⏳ 待执行 |
| T4.1 | P004 auth.test.ts 创建 | Dev | P0 | ⏳ 待实现 |
| T4.2 | P004 project.test.ts 创建 | Dev | P0 | ⏳ 待实现 |
| T4.4-T4.5 | P004 CI coverage 配置 | Dev | P0 | ⏳ 待实现 |

### Week 2（并行执行）

| Task ID | 描述 | 执行者 | 优先级 | 状态 |
|---------|------|--------|--------|------|
| T1.2-T1.3 | P001 webhook dry-run | Dev | P1 | ⏳ 待实现 |
| T1.4 | P001 端到端验证 | Dev/Admin | P1 | ⏳ 待执行 |
| T3.8-T3.10 | P003 引导内容填充 + build gate | Dev | P1 | ⏳ 待执行 |
| T4.3 | P004 canvas.test.ts 创建 | Dev | P2 | ⏳ 待实现 |
| T4.6-T4.8 | P004 覆盖率达标 + build gate | Dev | P0 | ⏳ 待执行 |
| T5.1-T5.5 | P005 CanvasDiffPage + diff 算法 | Dev | P0 | ⏳ 待实现 |
| T5.6-T5.8 | P005 data-testid + build gate | Dev | P1 | ⏳ 待执行 |

---

## 3. 协作流程

### 3.1 正常路径

```
Architect (architect-review)
  → Dev (implement, 并行 2-3 人)
    → Reviewer (review)
      → Coord (approval)
        → merge
```

### 3.2 阻塞路径（P002 范围决策）

```
Dev 审计 TS 错误
  → 量化错误数量
  → Coord 决策：
    → 错误 < 10 个：纳入 Sprint 24 修复 → Dev 修复 → P002 DoD 完成
    → 错误 > 10 个：延后 Sprint 25 → P002 降为"验证性"提案
```

### 3.3 状态更新规范

> ⚠️ 所有状态更新必须通过 CLI，禁止手动编辑 JSON

```bash
# 任务完成
python3 ~/.openclaw/skills/team-tasks/scripts/task_manager.py update vibex-proposals-sprint24 architect-review done

# 驳回（产出不达标）
python3 ~/.openclaw/skills/team-tasks/scripts/task_manager.py update vibex-proposals-sprint24 architect-review rejected --failure-reason "<原因>"

# 阻塞（等待上游）
python3 ~/.openclaw/skills/team-tasks/scripts/task_manager.py update vibex-proposals-sprint24 architect-review blocked --blocked-reason "<原因>"
```

---

## 4. 关键决策记录

### D1: P003 Onboarding 组件选择

| 选项 | 决策 | 理由 |
|------|------|------|
| OnboardingModal（5步overlay）| **采纳** | PRD 指定 5 步引导，OnboardingModal 已实现 5 步 |
| GuideOverlay（spotlight）| 保留为 Phase 2 | GuideOverlay 更适合上下文引导，Sprint 24 先完成 overlay |

### D2: P002 TS 修复范围

| 选项 | 决策 | 理由 |
|------|------|------|
| Sprint 24 全部修复 | 待决策 | 取决于 TS 错误数量 |
| Sprint 24 仅验证，降为"确认性"提案 | **待 Coord 决策** | — |

### D3: P004 测试框架

| 选项 | 决策 | 理由 |
|------|------|------|
| MSW + Vitest（复用 S13 handlers）| **采纳** | S13 handlers 已就绪，一致性好 |
| Playwright E2E 替代 | 拒绝 | 覆盖率和隔离性不足 |

---

## 5. 沟通约定

### 5.1 汇报格式

**Heartbeat 汇报（Slack #architect）**：
```
[ARCHITECT] 心跳巡检 <时间>
📊 状态: vibex-proposals-sprint24 architect-review 已完成
✅ 无阻塞。静默待命。
HEARTBEAT_OK
```

**任务完成汇报**：
```
[ARCHITECT] ✅ 阶段任务完成
项目: vibex-proposals-sprint24
阶段: architect-review
产出物:
• architecture.md — 5 提案技术架构 + Mermaid 图 + API 定义 + 测试策略
• IMPLEMENTATION_PLAN.md — 22 个任务分解 + DoD checklist + 里程碑
• AGENTS.md — 角色定义 + 任务矩阵 + 决策记录
验收标准:
• Tech Stack ✅
• Architecture Diagram (Mermaid) ✅ (P001-P005)
• API Definitions ✅
• Testing Strategy ✅
• IMPLEMENTATION_PLAN.md ✅
• AGENTS.md ✅
关键发现:
• P001: CI e2e:summary:slack 已配置 ✅, 缺 webhook dry-run step
• P002: 前端 TS 已清零 ✅, 后端/mcp-server TS 待审计
• P003: Onboarding 基础设施已存在 ✅, 缺 data-testid + 集成
• P004: auth/project API 存在 ✅, 缺 modules/__tests__/ 测试文件
• P005: reviewDiff 基础存在 ✅, 缺 CanvasDiffPage + compareCanvasProjects
耗时: 约 20 分钟
```

---

## 6. 质量门禁

所有提案必须通过以下门禁才能合并：

```bash
# 1. TypeScript 编译
pnpm exec tsc --noEmit
pnpm --filter vibex-fronted exec tsc --noEmit

# 2. Lint
pnpm --filter vibex-fronted run lint

# 3. 单元测试（含覆盖率）
pnpm --filter vibex-fronted run test:unit

# 4. Build
pnpm --filter vibex-fronted build

# 5. 覆盖率 gate（P004）
# vitest --coverage → P004 覆盖率 ≥ 60%
```

---

## 7. 文件清单

| 文件 | 位置 | 状态 |
|------|------|------|
| prd.md | `docs/vibex-proposals-sprint24/prd.md` | ✅ PM |
| analysis.md | `docs/vibex-proposals-sprint24/analysis.md` | ✅ Analyst |
| architecture.md | `docs/vibex-proposals-sprint24/architecture.md` | ✅ Architect |
| IMPLEMENTATION_PLAN.md | `docs/vibex-proposals-sprint24/IMPLEMENTATION_PLAN.md` | ✅ Architect |
| AGENTS.md | `docs/vibex-proposals-sprint24/AGENTS.md` | ✅ Architect |
| specs/01-p001-e2e-slack-validation.md | `docs/vibex-proposals-sprint24/specs/` | ✅ PM |
| specs/02-p002-typescript-debt-confirm.md | `docs/vibex-proposals-sprint24/specs/` | ✅ PM |
| specs/03-p003-onboarding-guide.md | `docs/vibex-proposals-sprint24/specs/` | ✅ PM |
| specs/04-p004-api-module-tests.md | `docs/vibex-proposals-sprint24/specs/` | ✅ PM |
| specs/05-p005-cross-canvas-diff.md | `docs/vibex-proposals-sprint24/specs/` | ✅ PM |

---

## 8. 风险汇总

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| P003 OnboardingModal + GuideOverlay 两套并存 | 中 | 中 | PRD 指定 5 步 overlay 为本期目标；Guide 为 Phase 2 |
| P004 MSW mock 与真实 API 不一致 | 高 | 中 | 先做 auth（清晰 input/output）验证模式 |
| P002 后端 TS 错误量大 | 中 | 高 | 先量化，再决定是否 Sprint 24 修复 |
| P005 diff 算法不收敛 | 低 | 中 | 降级为结构 diff，暂不做语义分析 |

---

*生成时间: 2026-05-03 09:30 GMT+8*
*Architect Agent | VibeX Sprint 24 Agent Assignment*
