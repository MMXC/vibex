# PRD: team-evolution-20260328 — Harness Engineering 自我进化机制

**Agent**: PM
**Date**: 2026-03-28
**Task**: team-evolution-20260328/create-prd
**Status**: 🔄 编写中

---

## 1. 执行摘要

### 1.1 背景

Harness Engineering（agent 协作流程）存在两个高优先级流程缺陷：

1. **打分与 task_done 脱节**：评分由 `coord-spawn-inspector.sh` 在 spawn 下游时并行触发，agent 完成任务后不知道自己产出质量，评分反馈滞后 T+1
2. **错误案例无系统沉淀**：HEARTBEAT.md 经验沉淀区（E001-E011）依赖人工写入，缺乏自动回填机制

### 1.2 目标

建立 agent 端自我进化闭环：
- agent 完成任务时立即获得自我评分反馈
- 错误案例自动捕获并分类沉淀到知识库
- self vs scorer 评分差异形成进化追踪数据

### 1.3 成功指标

| 指标 | 目标 |
|------|------|
| self-score 覆盖率 | 100%（所有 6 个 agent） |
| 错误自动回填率 | ≥80%（已知错误模式） |
| task_done → self-score 延迟 | < 30s（不阻塞任务完成） |
| self vs scorer delta 记录率 | 100%（有 scorer 的任务对） |

### 1.4 推荐方案

**方案 C（混合方案）**：
- [T+0] agent task_done → self-score + error-log（并行，不阻塞）
- [T+Δ] coord spawn 下游 → 并行 spawn scorer（原逻辑不变）
- 汇合：self-score + scorer-score → delta 写入进化追踪

---

## 2. Epic 拆分

### Epic 1: Agent Self-Score 机制（P0）

**目标**：agent 完成任务时立即自评分，无需等待下游 scorer

**Story 列表**：

| Story ID | As a... | I want to... | So that... | 优先级 |
|----------|---------|--------------|------------|--------|
| F1.1 | agent | 在 task_done 时自动触发自我评分 | 我能立即知道自己的产出质量 | P0 |
| F1.2 | agent | 在 HEARTBEAT.md 的 task_done 段落执行 self-score hook | 评分逻辑与任务完成流程绑定 | P0 |
| F1.3 | agent | self-score 结果写入 scores.tsv（rater=self） | 评分有持久化记录 | P0 |
| F1.4 | system | self-score 失败不影响 task 状态 | 评分是锦上添花，不阻塞工作流 | P0 |
| F1.5 | agent | 所有 6 个 agent 都配置 self-score hook | 评分循环覆盖全团队 | P1 |

**验收标准**：

| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | agent 完成一个阶段任务 | 执行 `task_manager.py complete` 后 | scores.tsv 中出现 rater=self 的记录，延迟 < 30s |
| AC1.2 | 无已知错误模式可评 | self-score 执行 | 跳过评分，task 状态仍为 done |
| AC1.3 | 所有 6 个 agent | 检查各自 HEARTBEAT.md | 都有 self-score hook 段落 |
| AC1.4 | scores.tsv | 读取所有记录 | self 评分与 scorer 评分互不覆盖 |
| AC1.5 | agent 完成阶段任务 | 无评分失败 | task 状态不受影响，仍为 done |

**DoD**：self-score hook 已在所有 agent HEARTBEAT.md 中配置；`expect(grep "rater=self" scores.tsv)` 返回 ≥1 条记录

---

### Epic 2: 错误案例自动回填机制（P0）

**目标**：错误发生时自动捕获并分类沉淀到 HEARTBEAT.md 经验区

**Story 列表**：

| Story ID | As a... | I want to... | So that... | 优先级 |
|----------|---------|--------------|------------|--------|
| F2.1 | system | 在 task_done 时检测 phase 文件中的错误模式 | 错误能被自动发现 | P0 |
| F2.2 | system | 检测到的错误自动追加到 HEARTBEAT.md E00x 区 | 错误经验被结构化沉淀 | P0 |
| F2.3 | system | 新错误与已有 E00x 查重 | 避免重复条目 | P0 |
| F2.4 | agent | 查看 phase 报告时看到"教训引用: E00x" | 我能快速定位相关历史错误 | P1 |
| F2.5 | system | 写入 HEARTBEAT.md 前备份 | 格式破坏可恢复 | P2 |

**已知错误模式（正则）**：

```
429|rate.limit|Rate limit exceeded
timeout|Timed out|timeout after
Cannot claim|already claimed|locked
error|Error:|ERROR|❌|FAILED
inconsisten|不一致|mismatch|不匹配
```

**验收标准**：

| ID | Given | When | Then |
|----|-------|------|------|
| AC2.1 | phase 文件包含 "429" 关键词 | task_done 后 5 分钟内 | HEARTBEAT.md E00x 区出现新条目（429 相关） |
| AC2.2 | phase 文件包含已知错误模式 | 自动回填 | 新条目与已有 E00x 不重复 |
| AC2.3 | HEARTBEAT.md E00x 区 | 写入前 | 自动创建 .bak 备份文件 |
| AC2.4 | phase 文件无已知错误模式 | 自动回填 | 无写入，task 状态仍为 done |
| AC2.5 | 错误案例 | E00x 条目写入 | 包含：错误描述、发生时间、项目名、教训 |

**DoD**：已知错误模式能被自动捕获；`expect(grep -c "^E[0-9]" HEARTBEAT.md)` 数量增长 ≥1

---

### Epic 3: Self vs Scorer Delta 追踪（P1）

**目标**：self 评分与 scorer 评分差异形成进化追踪数据

**Story 列表**：

| Story ID | As a... | I want to... | So that... | 优先级 |
|----------|---------|--------------|------------|--------|
| F3.1 | system | 在 scorer 完成复评后对比 self vs scorer 分数 | 差异可被量化分析 | P1 |
| F3.2 | system | self vs scorer 差值超过阈值时触发提醒 | 大的评分偏差被及时关注 | P1 |
| F3.3 | analyst | 查看进化追踪记录 | 能看到 self vs scorer 的历史趋势 | P2 |

**验收标准**：

| ID | Given | When | Then |
|----|-------|------|------|
| AC3.1 | self-score=8, scorer=6 | scorer 完成复评后 | scores.tsv 中出现 delta=-2 记录 |
| AC3.2 | self vs scorer 差值 ≥ 2 | delta 写入 | analyst 收到 Slack 提醒 |
| AC3.3 | scores.tsv | 读取所有评分对 | 能筛选出所有有 self 和 scorer 两条记录的任务 |

**DoD**：`expect(delta_records ≥ 0)` 能返回有效记录

---

### Epic 4: 进化追踪数据化（P2）

**目标**：将进化数据结构化存档，支持趋势分析

**Story 列表**：

| Story ID | As a... | I want to... | So that... | 优先级 |
|----------|---------|--------------|------------|--------|
| F4.1 | analyst | 定期查看 self-score vs scorer 趋势图 | 了解团队整体进化方向 | P2 |
| F4.2 | coord | 评分覆盖率达到 100%（所有 agent 对） | 进化机制无死角 | P2 |
| F4.3 | system | 每周生成进化报告 | 团队有量化进步指标 | P3 |

**验收标准**：

| ID | Given | When | Then |
|----|-------|------|------|
| AC4.1 | scores.tsv | 累计 30 天数据 | analyst-evolution.sh 能生成趋势摘要 |
| AC4.2 | 所有 agent 对 | 任意一个任务完成 | 都有对应的 self 或 scorer 评分记录 |

---

## 3. UI/UX 流程

### 3.1 正常流程（Epic 1 + Epic 2）

```
Agent 执行阶段任务
    │
    ▼
task_done (写入 phase 报告)
    │
    ├─► [并行] self-score hook 执行
    │       - 读取 SCORING_RUBRICS.md
    │       - 9维自评
    │       - score.sh record (rater=self)
    │       - 延迟 < 30s
    │
    ├─► [并行] error-log hook 执行
    │       - 读取 phase 文件
    │       - 检测已知错误模式
    │       - 查重 → 写入 HEARTBEAT.md E00x
    │
    └─► task_manager complete → done
```

### 3.2 完整流程（含 Scorer 复评 + Delta）

```
Agent task_done
    │
    ├─► [T+0] self-score + error-log → done（并行，不阻塞）
    │
    └─► [T+Δ] coord spawn 下游 → 并行 spawn scorer（原逻辑）
                │
                ▼
            scorer 复评 → score.sh record (rater=scorer)
                │
                ▼
            self vs scorer delta → analyst-evolution.sh record
                │
                ▼
            delta ≥ 2 → Slack 提醒 analyst
```

---

## 4. 实施计划

### Phase 1: Self-Score 基础（~1.5h）

1. 创建 `self-score-hook.sh` 脚本
2. 在 6 个 agent HEARTBEAT.md 添加 task_done hook 段落
3. 端到端测试：执行一个阶段任务，验证 scores.tsv 有 self 记录

### Phase 2: Error-Log 自动化（~1h）

1. 创建 `auto-error-log.sh` 脚本
2. 在 HEARTBEAT.md 经验区添加 E012 占位
3. 端到端测试：制造已知错误，验证 E00x 条目生成

### Phase 3: Delta 追踪（~0.5h）

1. 在 `analyst-evolution.sh` 增加 delta 记录类型
2. 端到端测试：完成 self + scorer，对比 delta

### Phase 4: 全量覆盖（~1h）

1. 验证所有 6 个 agent 都有 self-score hook
2. 运行 1 周收集数据
3. 分析 self vs scorer 趋势

---

## 5. 技术规格

### 5.1 核心脚本

| 脚本 | 位置 | 输入 | 输出 |
|------|------|------|------|
| `self-score-hook.sh` | `/root/.openclaw/scripts/heartbeats/` | phase 文件路径 | score.sh record |
| `auto-error-log.sh` | `/root/.openclaw/scripts/heartbeats/` | phase 文件路径 | HEARTBEAT.md E00x 追加 |
| `delta-tracker.sh` | `/root/.openclaw/scripts/heartbeats/` | scores.tsv | analyst-evolution.sh record |

### 5.2 配置文件

| 文件 | 位置 | 说明 |
|------|------|------|
| `SCORING_RUBRICS.md` | `/root/.openclaw/team-evolution/` | 9维评分标准 |
| `scores.tsv` | `/root/.openclaw/team-evolution/` | 所有评分记录（含 rater 列） |

### 5.3 错误模式定义

```bash
ERROR_PATTERNS=(
  "429.*rate.limit"
  "timeout.*exceeded"
  "Cannot.claim"
  "ERROR.*❌.*FAILED"
  "inconsisten.*mismatch"
)
```

---

## 6. 验收清单

### P0（必须交付）

- [ ] `self-score-hook.sh` 可独立执行，输出 valid score
- [ ] 6 个 agent HEARTBEAT.md 都有 self-score hook 段落
- [ ] `expect(grep "rater=self" scores.tsv)` 返回 ≥1 条
- [ ] `auto-error-log.sh` 能检测已知错误模式
- [ ] 已知错误发生后 5 分钟内 HEARTBEAT.md E00x 有新条目
- [ ] self-score 失败不影响 task 状态为 done

### P1（交付后验证）

- [ ] self vs scorer delta 写入 analyst-evolution.sh
- [ ] delta ≥ 2 触发 Slack 提醒
- [ ] 所有 6 个 agent 都进入评分循环

### P2（持续优化）

- [ ] 30 天数据趋势图
- [ ] 评分覆盖率 100%

---

## 7. 风险与缓解

| 风险 | 可能性 | 影响 | 缓解方案 |
|------|--------|------|---------|
| agent self-score 存在过度宽容 bias | 高 | 中 | self vs scorer 差异超过 2 分触发人工 review |
| error-log 误判正常执行为错误 | 中 | 低 | 只检测已知错误模式（timeout, 429, Cannot claim 等） |
| HEARTBEAT.md 写入格式破坏 | 中 | 中 | 写入前先创建 .bak 备份 |
| scores.tsv 多进程写冲突 | 低 | 低 | score.sh 自己处理 append，不覆盖 |

---

## 8. 开放问题

| # | 问题 | 建议答案 |
|---|------|---------|
| Q1 | self-score 是否有权限写入其他 agent 的 scores.tsv？ | 是的，scores.tsv 是团队共享文件 |
| Q2 | error-log 是否需要 coord 审核后才写入 HEARTBEAT.md？ | 直接写入（P0），审核作为 P2 优化 |
| Q3 | self vs scorer 差异阈值设为多少合理？ | 2 分（基于经验） |
| Q4 | analyst 产出的 brief 是否也需要自评分？ | P2 阶段覆盖 |

---

*PRD 版本：v1.0 | PM：team-evolution-20260328 | 创建时间：2026-03-28*
