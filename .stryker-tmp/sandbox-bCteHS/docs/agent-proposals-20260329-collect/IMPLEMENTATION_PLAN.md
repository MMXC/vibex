# 实施计划：Agent 改进提案流程优化

**项目**: agent-proposals-20260329-collect
**日期**: 2026-03-29

---

## 一、实施阶段

### Sprint 0: 止血（P0，1-2 天）

| ID | 功能 | 负责人 | 验收标准 | 依赖 |
|----|------|--------|----------|------|
| F1.3 | task_manager 挂起修复 | dev | filelock + 原子写入，npm test 通过 | 无 |
| F3.1 | page.test.tsx 修复 | dev | 4 个测试全部 PASS | F1.3 |

### Sprint 1: 稳定（P0-P1，2-3 天）

| ID | 功能 | 负责人 | 验收标准 | 依赖 |
|----|------|--------|----------|------|
| F1.1 | 提案执行追踪表 | coord | EXECUTION_TRACKER.md 建立并更新 | 无 |
| F2.1 | heartbeat 幽灵任务修复 | dev | 无 phantom task | F1.3 |
| F2.3 | confirmationStore 重构 | dev | 主文件 ≤ 50 行，Vitest PASS | F1.3 |
| F3.2 | ErrorBoundary 去重 | dev | 只保留 ui/ErrorBoundary.tsx | F1.3 |

### Sprint 2: 质量（P1，2-3 天）

| ID | 功能 | 负责人 | 验收标准 | 依赖 |
|----|------|--------|----------|------|
| F3.4 | dedup 生产验证 | dev + tester | dedup-verify.sh 全部 PASS | F2.1 |
| F2.2 | 提案格式标准化 | analyst | proposals/ 目录格式统一 | F1.1 |
| F2.4 | 提案追踪机制自动化 | tester | Cron 脚本每周推送报告 | F1.1 |

### Sprint 3: 改进（P2，1-2 天）

| ID | 功能 | 负责人 | 验收标准 | 依赖 |
|----|------|--------|----------|------|
| F4.1 | 约束清单解析截断修复 | reviewer | 完整解析所有 MD 约束 | Sprint 0-2 |
| F4.2 | PRD Open Questions 追踪 | pm | 每个 Story 有 OQ 标记 | Sprint 0-2 |

---

## 二、资源分配

| Agent | Sprint 0 | Sprint 1 | Sprint 2 | Sprint 3 |
|-------|----------|----------|----------|----------|
| dev | F1.3, F3.1 | F2.1, F2.3, F3.2 | F3.4 | F4.1 |
| tester | - | - | F3.4, F2.4 | - |
| analyst | - | - | F2.2 | - |
| pm | - | - | - | F4.2 |
| coord | F1.1 | F1.1 | F1.1 | - |

---

## 三、关键路径

```
F1.3 (task_manager) → F2.1 (heartbeat) → F3.4 (dedup verify)
                ↘ F3.1 (page.test)
                ↘ F2.3 (confirmationStore)
```

F1.3 是所有下游任务的共同依赖，必须优先完成。
