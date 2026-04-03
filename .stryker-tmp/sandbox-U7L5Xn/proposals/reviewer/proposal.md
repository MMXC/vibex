# Reviewer 提案 — 2026-03-30

**Agent**: reviewer
**日期**: 2026-03-30
**项目**: proposals
**仓库**: /root/.openclaw/vibex

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | improvement | 两阶段审查 SOP 文档化 | reviewer/流程 | P1 |
| P002 | bug | 重复通知过滤机制缺失 | coord/通知 | P1 |
| P003 | improvement | 自检报告路径规范化 | 各agent/协作 | P0 |

---

## 2. 提案详情

### P001: 两阶段审查 SOP 文档化

**问题描述**: reviewer 执行两阶段审查（功能审查 → 推送验证）但缺乏标准化文档，导致不同任务执行方式不统一

**根因分析**: HEARTBEAT.md 中仅有简单流程描述，无具体检查清单

**影响范围**: reviewer 所有审查任务

**建议方案**: 创建 `REVIEWER_SOP.md`，固化功能审查 + 推送验证的检查清单，包含：
- 代码扫描命令（grep 模式）
- 测试验证命令
- CHANGELOG 更新规范
- 推送验证步骤

**验收标准**: 新 agent 可通过阅读 SOP 独立完成审查任务

---

### P002: 重复通知过滤机制缺失

**问题描述**: Coord 向 reviewer 发送重复任务通知（如同一任务 3-6 次通知），导致消息堆积

**根因分析**: Coord 心跳脚本每次扫描都发送通知，未检查任务是否已处理

**影响范围**: reviewer 频道消息噪音

**建议方案**: 
1. Coord 心跳脚本增加"已处理任务"去重逻辑
2. 或 reviewer 回复"已处理"后 Coord 标记跳过

**验收标准**: 同一任务通知 ≤ 2 次

---

### P003: 自检报告路径规范化

**问题描述**: 各 agent 自检报告路径不一致（有的在 `/workspace-{agent}/proposals/`，有的在 `/vibex/docs/agent-self-evolution-YYYYMMDD-daily/`），导致 reviewer 审查时需要多轮猜测

**根因分析**: 无统一的报告存放规范

**影响范围**: 所有 agent 自检流程

**建议方案**: 
统一路径：`/workspace-{agent}/proposals/YYYYMMDD/{agent}.md`
- workspace-reviewer → /root/.openclaw/workspace-reviewer/proposals/
- workspace-dev → /root/.openclaw/workspace-dev/proposals/

**验收标准**: 任何 agent 可从单一路径找到所有 agent 的自检报告

---

## 3. 提交方式

使用 `/review` 技能创建 PR，分支：`proposals/20260330-reviewer`
