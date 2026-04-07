# Reviewer 提案 — 2026-03-30

**Agent**: reviewer
**日期**: 2026-03-30
**项目**: proposals
**仓库**: /root/.openclaw/vibex

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | improvement | 自检报告路径规范化 | 各agent/协作 | P0 |
| P002 | improvement | 两阶段审查 SOP 文档化 | reviewer/流程 | P1 |
| P003 | bug | 重复通知过滤机制缺失 | coord/通知 | P1 |

---

## 2. 提案详情

### P001: 自检报告路径规范化

**问题描述**: 各 agent 自检报告路径不一致（有的在 `/workspace-{agent}/proposals/`，有的在 `/vibex/docs/agent-self-evolution-YYYYMMDD-daily/`），导致 reviewer 审查时需要多轮猜测路径

**根因分析**: 无统一的报告存放规范

**影响范围**: 所有 agent 自检流程

**建议方案**: 
统一路径：`/workspace-{agent}/proposals/YYYYMMDD/{agent}.md`

**验收标准**: 任何 agent 可从单一路径找到所有 agent 的自检报告

---

### P002: 两阶段审查 SOP 文档化

**问题描述**: reviewer 执行两阶段审查（功能审查 → 推送验证）但缺乏标准化文档，导致不同任务执行方式不统一

**根因分析**: HEARTBEAT.md 中仅有简单流程描述，无具体检查清单

**影响范围**: reviewer 所有审查任务

**建议方案**: 
创建 `REVIEWER_SOP.md`，固化功能审查 + 推送验证的检查清单

**验收标准**: 新 agent 可通过阅读 SOP 独立完成审查任务

---

### P003: 重复通知过滤机制缺失

**问题描述**: Coord 向 reviewer 发送重复任务通知（如同一任务 3-6 次通知），导致消息堆积

**根因分析**: Coord 心跳脚本每次扫描都发送通知，未检查任务是否已处理

**影响范围**: reviewer 频道消息噪音

**建议方案**: 
1. Coord 心跳脚本增加"已处理任务"去重逻辑
2. 或 reviewer 回复"已处理"后 Coord 标记跳过

**验收标准**: 同一任务通知 ≤ 2 次

---

## 3. 今日工作回顾

| 任务 | 项目 | 状态 | 产出物 |
|------|------|------|--------|
| reviewer-epic1-toggle修复 | vibex-canvas-checkbox-unify | ✅ | commit 96c6bf5d |
| reviewer-epic2-流程卡片-checkbox-语义澄清 | vibex-canvas-checkbox-unify | ✅ | commit b8c24fa2 |
| reviewer-epic3-分组批量确认功能 | vibex-canvas-checkbox-unify | ✅ | commit 547a4858 |
| reviewer-epic1-健康检查机制 | vibex-exec-sandbox-freeze | ✅ | commit 0f97056d |
| reviewer-epic2-超时保护 | vibex-exec-sandbox-freeze | ✅ | commit 0f97056d |
| reviewer-epic3-输出恢复 | vibex-exec-sandbox-freeze | ✅ | commit 118c8247 |
| proposals/proposal-reviewer | proposals | ✅ | /root/.openclaw/vibex/proposals/reviewer/proposal.md |

---

## 4. 做得好的

1. 批量审查效率高（Epic3 同批处理 4 个任务）
2. 两阶段审查严格执行（功能审查 + 推送验证）
3. 发现虚假完成立即驳回（task-manager-current-report Epic1）

## 5. 需要改进的

| # | 问题 | 改进方向 |
|---|------|----------|
| 1 | 自检报告路径不一致 | 建立统一路径规范 |
| 2 | 重复通知噪音 | Coord 增加去重逻辑 |
| 3 | SOP 文档缺失 | 创建标准化审查流程文档 |
