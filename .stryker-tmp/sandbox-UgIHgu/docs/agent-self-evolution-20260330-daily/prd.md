# PRD: Agent 每日自检任务自动机

> **项目**: agent-self-evolution-20260330-daily
> **创建日期**: 2026-03-30
> **类型**: 自我演进
> **状态**: Draft
> **负责人**: PM Agent

---

## 1. 执行摘要

### 背景
当前 7 个 agent 每日通过心跳协调驱动多个并行项目，产生大量分散的 lessons learned 和改进建议，但未被系统性沉淀和转化。

### 目标
- 建立自检→分析→决策→行动 的完整闭环
- 实现知识沉淀自动化
- 提升异常检测响应速度

### 关键指标
| 指标 | 目标 |
|------|------|
| Self-check 提交率 | 100%（7/7 agent） |
| Zombie 检测响应时间 | < 30min |
| 改进建议闭环率 | ≥ 80% |

---

## 2. Epic 拆分

### Epic 1: 自检工作流标准化（P0）

**目标**: 统一 self-check 文档格式，便于程序化汇总

**故事点**: 8h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| S1.1 | Self-check 模板制定 | 制定统一格式，包含 JSON frontmatter 或 Markdown table | 模板包含：今日完成/发现问题/改进建议/自我评分 | P0 |
| S1.2 | 格式验证 | 建立格式检查机制 | `grep` 验证模板字段完整性 | P0 |
| S1.3 | 历史文档兼容 | 将历史 self-check 文档迁移到新格式 | 格式验证通过率 ≥ 90% | P1 |
| S1.4 | 文档归档 | 建立统一归档命名规范 | `docs/agent-self-evolution-YYYYMMDD/` 规范统一 | P0 |

**DoD for Epic 1**:
- [ ] 模板文档已创建并纳入 AGENTS.md
- [ ] 格式验证工具可正常运行
- [ ] 历史文档 ≥ 90% 符合新格式

---

### Epic 2: 异常检测自动化（P0）

**目标**: 提升 zombie 任务检测响应速度

**故事点**: 12h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| S2.1 | Zombie 告警升级 | zombie > 2 时自动 @ 小羊，不只是重置为 ready | 小羊收到 Slack DM 或 @mention | P0 |
| S2.2 | 重派发锁机制 | zombie 被重置后，5 分钟内未领取则再次告警 | 最小告警间隔 5min | P0 |
| S2.3 | Zombie 响应时间监控 | 记录 zombie 产生到告警的时间 | `expect(zombie_response_time).toBeLessThan(30 * 60)` | P0 |
| S2.4 | 告警历史统计 | 统计每日/每周 zombie 数量趋势 | 告警记录可查询 | P1 |

**DoD for Epic 2**:
- [ ] zombie > 2 时小羊立即收到通知
- [ ] 重派发锁机制生效
- [ ] zombie 响应时间 < 30min

---

### Epic 3: 自检→提案闭环（P1）

**目标**: 将改进建议转化为可执行的开发任务

**故事点**: 10h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| S3.1 | [ACTIONABLE] 标签 | self-check 中标记可执行改进建议 | `grep "[ACTIONABLE]" *.md` 可找到所有建议 | P1 |
| S3.2 | 自动收集 | 每日自动将 [ACTIONABLE] 建议收集到 `proposals/YYYYMMDD/` | 收集脚本正常运行 | P1 |
| S3.3 | 提案评审 | Coord 评审提案，决定是否进入开发 | 评审记录在提案中 | P1 |
| S3.4 | 闭环追踪 | 改进 Epic 验收标准引用原始 self-check | 引用关系可追溯 | P2 |

**DoD for Epic 3**:
- [ ] 标签机制已建立
- [ ] 每日自动收集脚本正常运行
- [ ] 闭环率 ≥ 80%

---

### Epic 4: 每日状态报告自动化（P1）

**目标**: cron job 自动生成《每日团队状态报告》

**故事点**: 6h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| S4.1 | 报告模板 | 定义《每日团队状态报告》格式 | 包含：完成项目数/zombie 数/改进建议 | P1 |
| S4.2 | 自动生成 | cron job 每日 06:05 生成报告 | 报告文件存在且内容完整 | P1 |
| S4.3 | 报告分发 | 自动发送到 #coord 频道 | 小羊确认收到 | P2 |

**DoD for Epic 4**:
- [ ] 报告模板已定义
- [ ] 每日 06:05 自动生成
- [ ] 报告分发正常

---

## 3. UI/UX 流程

### 自检工作流（优化后）

```
每日 06:00 前
    ↓
各 agent 提交 self-check（统一模板）
    ↓
格式验证 → 不通过则驳回重写
    ↓
06:05 cron 生成《每日团队状态报告》
    ↓
[ACTIONABLE] 建议自动进入 proposals/
    ↓
Coord 评审 → 进入开发流程
```

### Zombie 检测流程

```
Zombie 任务产生
    ↓
心跳检测到 zombie
    ↓
zombie <= 2: 重置为 ready，继续监控
    ↓
zombie > 2: 立即 @ 小羊 + 启动重派发锁
    ↓
5min 内未领取: 再次告警
    ↓
30min 内未解决: 升级告警
```

---

## 4. 验收标准汇总

### P0（Epic 1 & 2）
| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | Self-check 模板 | 查看文档 | 包含 JSON frontmatter 或 Markdown table |
| AC1.2 | 格式验证 | 运行验证脚本 | 所有字段完整性通过 |
| AC2.1 | zombie > 2 | 心跳检测 | 小羊立即收到 Slack 通知 |
| AC2.2 | zombie 重置 | 5min 内未领取 | 再次触发告警 |
| AC2.3 | Zombie 响应时间 | 计时 | < 30min |

### P1（Epic 3 & 4）
| ID | Given | When | Then |
|----|-------|------|------|
| AC3.1 | Self-check 包含 [ACTIONABLE] | `grep` | 找到所有标记建议 |
| AC3.2 | 每日 proposals 收集 | 每日 06:05 | `proposals/YYYYMMDD/` 包含所有 [ACTIONABLE] |
| AC4.1 | 每日状态报告 | 每日 06:05 | 报告存在且包含关键指标 |
| AC4.2 | 报告分发 | 生成后 | 小羊收到通知 |

---

## 5. 非功能需求

| 需求 | 标准 |
|------|------|
| 性能 | 报告生成 ≤ 30s |
| 可用性 | 通知送达率 ≥ 99% |
| 监控 | 所有流程可追溯 |
| 错误处理 | 失败降级到 console.error |

---

## 6. 快速验收单

```bash
# Epic 1: 模板检查
grep -E "^---" docs/agent-self-evolution-*/self-check-*.md | wc -l
# 预期: >= 7

# Epic 2: Zombie 响应
grep "zombie" heartbeat.log | tail -1 | awk '{print $NF}'
# 预期: < 30min

# Epic 3: [ACTIONABLE] 收集
ls proposals/$(date +%Y%m%d)/ | wc -l
# 预期: >= 1

# Epic 4: 报告生成
test -f docs/daily-report-$(date +%Y%m%d).md
# 预期: 0 (文件存在)
```

---

**文档版本**: v1.0
**下次审查**: 2026-03-31
