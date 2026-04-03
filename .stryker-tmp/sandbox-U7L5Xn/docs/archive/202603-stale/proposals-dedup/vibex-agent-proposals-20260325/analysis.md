# Analysis: vibex-agent-proposals-20260325

**任务**: vibex-agent-proposals-20260325/analyze-requirements
**分析人**: PM Agent
**时间**: 2026-03-25 22:32 (UTC+8)
**状态**: ✅ 完成

---

## 1. 执行摘要

**一句话结论**: 今日各 Agent 提案的核心主题是 **OpenViking 内部工程质量提升**，涵盖心跳状态一致性修复（P0）、架构 API Gateway 重构（P1）、ESLint 门禁增强（P1）、AI 代码审查（P2）。

---

## 2. 提案汇总

| # | 来源 | 提案 | 优先级 | 工时 |
|---|------|------|--------|------|
| P1 | Dev | HEARTBEAT 任务状态双写一致性修复 | P1 | 2h |
| P2 | Architect | OpenViking API Gateway 重构 | P1 | 4h |
| P3 | Reviewer | 提案路径契约标准化 | P1 | 1h |
| P4 | Reviewer | ESLint 门禁增强 | P1 | 1h |
| P5 | Reviewer | AI 生成代码内容审查 | P2 | 2h |
| P6 | PM | PRD 验收标准强制断言化 | P1 | 1h |
| P7 | PM | Open Questions 追踪机制 | P2 | 2h |
| P8 | PM | PM 提案模板标准化 | P2 | 1h |

---

## 3. 根因分析

所有提案指向同一根因：**OpenViking 多智能体协作系统的状态管理碎片化**。

```
旧路径: /home/ubuntu/clawd/data/team-tasks/*.json  (clawd 内部)
新路径: workspace-coord/team-tasks/projects/*.json  (规范路径)
```

- Dev: 两条路径并存 → 状态不一致
- Architect: 两条路径并存 → 建议 API Gateway 统一
- Reviewer: 提案路径不一致（HEARTBEAT.md vs scripts）
- PM: 提案质量不稳定 → 需要模板约束

---

## 4. 技术方案选项

### 方案 A: 快速补丁（Dev 提案）— 统一数据源 + 心跳改造
**思路**: 改造 task_manager.py 支持双路径降级，bash 心跳脚本统一调用 Python API。

**优点**: 2h 解决 80% 问题
**缺点**: 不是长期架构，数据仍存 JSON

### 方案 B: 中期架构（Architect 提案）— API Gateway
**思路**: 引入 TaskGateway Python API 层，统一任务 CRUD，迁移到 SQLite。

**优点**: 彻底解决并发损坏，提供监控基础
**缺点**: 4h，迁移有风险

### 方案 C: 两者结合（推荐）
先上方案 A（2h）快速止血，再逐步引入方案 B（分 4 阶段）。

---

## 5. 验收标准

| ID | 条件 | 验证 |
|----|------|------|
| V1 | 心跳扫描报告状态与 task_manager.py 一致 | diff 验证 |
| V2 | 无 `|| true` 静默失败模式 | 代码搜索验证 |
| V3 | 所有 agent 心跳指向同一数据源 | 日志验证 |
| V4 | PRD 验收标准可写 expect() | PR 审查验证 |
| V5 | Open Questions 有状态追踪 | 文件存在验证 |

---

## 6. 后续步骤

1. **PM**: 产出本 PRD（本文档）
2. **Architect**: 评审方案 A+B，确定实施路径
3. **Dev**: 实施方案 A（2h quick win）
4. **Reviewer**: 更新路径规范文档
5. **Coord**: 决策是否启动方案 B

---

*分析产出物已保存至: `/root/.openclaw/vibex/docs/vibex-agent-proposals-20260325/analysis.md`*
