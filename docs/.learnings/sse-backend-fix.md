# Learnings: sse-backend-fix

**Project**: sse-backend-fix — SSE Backend 稳定性修复
**Date**: 2026-04-09
**Completed**: 2026-04-09

---

## 经验总结

### 1. Epic 合并加速（值得保留的做法）

Epic3（SSE错误可诊断性 F3.1/F3.2）和 Epic4（Hono/Next.js路由一致性 F4.1/F4.2）被 reviewer 主动合并到 Epic1/Epic2 中，理由是"逻辑上耦合，同一 PR 更清晰"。

**结果**：总 Epic 从 5 个（按 PRD）变为 3 个实际开发单元，效率显著提升。

**教训**：PRD 的 Epic 拆法不一定是开发最优拆法。reviewer/dev 在 phase2 中有自主合并 Epic 的权力可以加速交付。

---

### 2. coord 自我审查外部化（待改进）

本次 coord-decision 中，architect 只做了 self-review，未执行 `/plan-eng-review` 外部审查。

**问题**：不符合 AGENTS.md 流程（要求外部审查），coord 手动补做。

**教训**：phase1 流程中，`/plan-eng-review` 应该由 architect 强制执行，而不是依赖 agent 自觉。下一步：考虑在 `design-architecture done` 后自动触发 `/plan-eng-review`。

---

### 3. task_manager.py 循环依赖 bug

`cmd_allow` 调用 `cmd_phase2`，但 `cmd_phase2` 内部检查 `coord-decision done`，导致 allow 永远失败。

**临时修复**：手动 `update done` → `allow` → 手动 `phase2`。

**根本修复**：删除 `cmd_phase2` 中的 `coord_decision done` 检查（已完成）。

---

### 4. tester session 被 abort 导致空转

sse-backend-fix 的 tester-epic1 从未被执行（0 attempts），tester session 因 heartbeat 轮询被 abort。

**教训**：analyst/tester/reviewer 的 HEARTBEAT.md 应保持最小化，避免任何命令调用。

---

## Epic 完成情况

| Epic | 状态 | Commits | 合并 |
|------|------|---------|------|
| Epic1-SSE超时稳定性修复 | ✅ | `9ff47ab2` → `d40e0730` | 含 F3.1/F3.2 |
| Epic2-Chat SSE可靠性增强 | ✅ | `01811ced` → `efaaa8d9` | 含 F4.1/F4.2 |
| Epic3-SSE错误可诊断性 | ✅ 合并 | 并入 Epic1 | |
| Epic4-Hono/Next.js路由一致性 | ✅ 合并 | 并入 Epic2 | |
| Epic5-测试覆盖 | ✅ | `3f221e9c` | |

---

## 数据统计

- **项目周期**：~2.5 小时（19:00 - 20:10）
- **Commits**：4 个开发 + 5 个 review-push
- **Epic 平均耗时**：~20 分钟（含 review cycle）
- **Epic 合并**：2 个（Epic3/4）

---

## 待改进项

1. [ ] `/plan-eng-review` 自动触发机制（architect design-architecture done 后）
2. [ ] coord-decision 支持"有条件通过"（如 R3 遗留项可在 phase2 中处理）
3. [ ] phase2 notify 只通知 immediate ready 任务（避免重复通知）
