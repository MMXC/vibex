# VibeX Sprint 20 — Agent Collaboration Spec

**Architect**: architect 🤖
**Date**: 2026-05-01
**Project**: vibex-sprint20-qa

---

## Agent Roles

| Role | Agent | Responsibility |
|------|-------|----------------|
| Solution Architect | architect | Tech stack, architecture diagram, API definitions, testing strategy |
| Analyst | analyst | Requirements analysis, PRD, acceptance criteria, risk matrix |
| Engineer | engineer | Code review, /plan-eng-review, type safety, CHANGELOG |
| Tester | tester | gstack QA validation, E2E tests, performance tests |
| Coord | coord | Phase gating, deployment sign-off, rollback decisions |

---

## Phase Gate: Technical Design

**Owner**: architect
**Input**: `analysis.md`, `prd.md`, `specs/*.md`
**Output**: `architecture.md`, `IMPLEMENTATION_PLAN.md`, `AGENTS.md`

### architect 职责

1. **Tech Stack 定义**: 版本选择及理由（约束：@tanstack/react-virtual@3, Hono@4, Vitest@2）
2. **架构图**: Mermaid flowchart，涵盖 Client / Backend / Runtime 三层
3. **API Definitions**: 接口签名（Method + Path + Request + Response + Status）
4. **Data Model**: 核心实体（SessionRecord, DDSCanvasStore）
5. **Testing Strategy**: 测试框架 + 覆盖率目标 + 核心测试用例示例
6. **Performance Architecture**: 虚拟化配置约束（estimateSize=120, overscan=3），超时配置（30s）
7. **Security Posture**: XSS/CSRF/数据存储风险评估

### architect 产出物

```
docs/vibex-sprint20-qa/
├── architecture.md        # 技术架构（含 Mermaid 架构图）
├── IMPLEMENTATION_PLAN.md # 实施计划（含验证命令）
└── AGENTS.md            # 本文件 — Agent 协作规范
```

### architect 驳回条件

- ❌ 未使用 Mermaid 格式 → 驳回
- ❌ 未定义 Testing Strategy → 驳回
- ❌ 未包含 API Definitions → 驳回
- ❌ 未包含 Data Model → 驳回

---

## Phase Gate: Code Review + /plan-eng-review

**Owner**: engineer
**Input**: `architecture.md`, `IMPLEMENTATION_PLAN.md`
**Constraint**: 强制使用 `/plan-eng-review` 技术审查

### engineer 职责

1. **TypeScript Clean**: `tsc --noEmit` → 0 errors
2. **CHANGELOG 完整性**: 4 个 commit 全部附带 changelog（analyst analysis.md §1.2 已确认 ✅）
3. **Mock 清理**: P006 CodingAgentService 无 `MOCK`/`mockAgentCall` 残留
4. **/plan-eng-review 审查**: 检查技术方案可行性、性能影响、接口完整性

### engineer 驳回条件

- ❌ TypeScript errors → 驳回重修
- ❌ CHANGELOG 缺失 → 驳回
- ❌ Mock 残留 → 驳回

---

## Phase Gate: QA Validation (gstack)

**Owner**: tester
**Constraint**: 强制使用 gstack 技能（`/browse` / `/qa` / `/qa-only` / `/canary`）验证问题真实性与修复效果

### tester 职责

| 验证项 | 技能 | 目标 |
|--------|------|------|
| P004 真实 DOM P50 | `/canary` | 100 节点 P50 < 100ms |
| P004 dropped frames | `/canary` | 150 节点 dropped frames < 2 |
| P003 E2E journey | `/qa` | workbench-journey.spec.ts 0 failures |
| P006 Gateway 可达 | `/browse` | gateway health check |
| P006 API smoke test | `/qa` | POST → 201, DELETE → 204 |

### tester 强制执行命令

```bash
# P004 — 真实 DOM 性能（必须用 gstack canary）
pnpm exec playwright test tests/e2e/canvas-virtualization-perf.spec.ts

# P003 — E2E journey
pnpm exec playwright test tests/e2e/workbench-journey.spec.ts

# P006 — API smoke test
curl -X POST http://localhost:3000/api/agent/sessions \
  -H "Content-Type: application/json" \
  -d '{"task": "test connectivity"}'
```

### tester 驳回条件

- ❌ P004 P50 ≥ 100ms → 驳回，性能不达标
- ❌ P004 dropped frames ≥ 2 → 驳回，jank 可见
- ❌ P003 E2E any failure → 驳回
- ❌ P006 gateway unreachable → 阻塞，上报 coord

---

## Data Flow

```
analyst (analysis.md + prd.md)
  → architect (architecture.md + IMPLEMENTATION_PLAN.md + AGENTS.md)
  → engineer (/plan-eng-review)
  → tester (gstack QA validation)
  → coord (deployment sign-off)
```

---

## Decision Gate Summary

| Phase | Gate | Pass Criterion |
|-------|------|----------------|
| Requirements | analyst | analysis.md + prd.md ✅ |
| Technical Design | architect | architecture.md + IMPLEMENTATION_PLAN.md ✅ |
| Code Review | engineer | TypeScript 0 errors + CHANGELOG ✅ |
| QA Validation | tester | E2E 0 failures + P004 perf ✅ |
| Deployment | coord | All gates passed + flag configured ✅ |

---

## Traceability

| DoD Item | E3-S2 | E3-S3 | E4-S6 | 上线门槛 |
|----------|-------|-------|-------|----------|
| P004 真实 DOM P50 | ✅ 目标 | — | — | ✅ |
| P004 dropped frames | — | ✅ 目标 | — | ✅ |
| P006 Gateway 可达 | — | — | ✅ 目标 | ✅ |
| E2E journey | — | — | — | ✅ |
| TypeScript clean | — | — | — | ✅ |

---

## 执行决策

| 字段 | 内容 |
|------|------|
| **决策** | **已采纳** |
| **执行项目** | vibex-sprint20-qa |
| **执行日期** | 2026-05-01 |

---

*版本: 1.0*
*Architect: architect 🤖*
*定义时间: 2026-05-01 07:58 GMT+8*
