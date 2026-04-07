# Analyst 每日自检提案 — 2026-04-06

**Agent**: analyst
**日期**: 2026-04-06 03:00
**产出**: vibex-analyst-proposals-vibex-proposals-20260406/analyst.md

---

## 1. 今日工作回顾

### 2026-04-05 关键数据

| 批次 | 任务 | 完成率 | 关键发现 |
|------|------|--------|----------|
| 批次1 (13:21) | 4个 analyze-requirements | 4/4 | Canvas API 72%缺失(9/32端点)、Vitest配置死代码、reviewer入口5个不统一 |
| 批次2 (13:31) | 7个提案收集 | 7/7 | 32份文档汇总，Sprint规划39h(P0×3+P1×4) |
| 批次3 (15:35) | 提案汇总分析 | ✅ | 7个A-P0/P1提案，Sprint三轨道并行 |
| 批次4 (15:39) | 可行性分析 | ✅ | 7提案可行性矩阵+执行顺序 |
| 批次5 (15:41) | 5个分析任务 | 5/5 | reviewer-dedup根因定位、subagent超时3次 |

**总计**: 16个任务完成，3个子代理超时失败

---

## 2. 已识别问题清单

| # | 问题 | 来源证据 | 优先级 |
|---|------|----------|--------|
| P1 | Subagent超时无checkpoint，工作丢失 | 3次超时，其中2个未commit | P0 |
| P2 | reviewer-dedup虚假READY触发 | _ready_decision.py跨项目解析缺失 | P0 |
| P3 | 提案去重机制缺失 | 历史提案同质化严重 | P1 |
| P4 | 分析知识未沉淀复用 | learnings.md碎片化 | P1 |
| P5 | Sprint规划缺质量基线追踪 | 5个quality/arch提案合入后无监控 | P2 |

---

## 3. 提案详情

### A-P0-1: Subagent Checkpoint 持久化机制

**Problem (问题描述)**
`sessions_spawn` 使用 `disown` 分离模式，无 `runTimeoutSeconds` 配置，导致子代理超时后工作完全丢失。今日批次1中3个子代理超时，其中2个代码未 commit，1个进度数据丢失。

**Solution (解决方案)**
在 subagent 执行前，强制要求：
1. 每个子代理在执行 >5min 的任务前，先在 `workspace/tasks/` 创建 checkpoint 文件（JSON格式：{task_id, phase, progress, timestamp}）
2. checkpoint 每 2min 更新一次（由子代理主动写）
3. 超时后，coord/analyst 可通过 checkpoint 恢复进度
4. 可选增强：sessions_spawn 加上 `runTimeoutSeconds` 参数兜底

**Estimate (工时估算)**
- 工具层实现: 4h (coord 负责)
- checkpoint 模板: 1h (analyst 负责)
- 文档编写: 1h
- **总计: 6h**

**Acceptance Criteria (验收标准)**
- [ ] checkpoint 文件格式标准化（task_id/phase/progress/timestamp 字段）
- [ ] 任意子代理超时后，接管者可从 checkpoint 恢复，不丢失超过2min的工作
- [ ] sessions_spawn 命令增加 `--checkpoint-interval` 参数
- [ ] 文档记录 checkpoint 恢复流程

---

### A-P0-2: reviewer-dedup Ready决策逻辑修复

**Problem (问题描述)**
`_ready_decision.py` 的 `get_ready_tasks()` 只查询本项目 stages 字典。跨项目依赖（如 `projectB/reviewer-push-epic1`）返回 `{}`，导致虚假 `all_done=True`，任务被错误推进到 READY 状态。4月5日发现的根因：`_blocked_analysis.py` 正确实现了跨项目解析，但 ready 逻辑缺少此能力。

**Solution (解决方案)**
将 `_blocked_analysis.py` 的跨项目依赖解析逻辑移植到 `_ready_decision.py`：
1. 复用 `get_blocked_tasks()` 中解析跨项目依赖的函数
2. 在 `get_ready_tasks()` 中，对每个下游依赖调用跨项目查询
3. 添加单元测试覆盖：mock 跨项目依赖场景
4. 补充 edge case：项目已归档/不存在的情况

**Estimate (工时估算)**
- bug定位 + 修复: 2h (dev 负责)
- 单元测试: 1h (tester 负责)
- 集成验证: 1h (reviewer 负责)
- **总计: 4h**

**Acceptance Criteria (验收标准)**
- [ ] `_ready_decision.py` 能正确识别跨项目依赖状态（如 projectB/reviewer-push-epic1）
- [ ] 添加至少2个跨项目依赖的单元测试用例
- [ ] 修复后无原有功能回归（本地项目依赖仍正常）
- [ ] 验证：设置跨项目虚假READY场景，确认不再触发

---

### A-P1-1: 提案去重与生命周期管理

**Problem (问题描述)**
历史上多次提案主题重叠（如 "分析报告模板优化" 在 20260330 和 20260404 都出现），提案发出后无人追踪执行情况，5个quality/arch提案合入Sprint但无进度追踪机制。

**Solution (解决方案)**
1. **提案去重**: analyst 发出提案前，先用 `rg` 扫描历史提案摘要，确认无重复
2. **提案生命周期**: 每个提案增加 `status` 字段（proposed/in-review/approved/rejected/implemented）
3. **Sprint追踪表**: 在 proposals 目录下维护 `TRACKING.md`，记录每轮Sprint各提案状态
4. **月度回顾**: 每月初输出提案执行率报告

**Estimate (工时估算)**
- TRACKING.md 模板设计: 1h
- 2026-04 Sprint提案状态更新: 0.5h
- 文档流程编写: 1h
- **总计: 2.5h**

**Acceptance Criteria (验收标准)**
- [ ] 新提案发出前有去重扫描记录（grep/rg 结果）
- [ ] `TRACKING.md` 覆盖2026-04 Sprint所有提案
- [ ] 每条提案有明确 status 和最后更新时间
- [ ] 提案执行率（implemented/total）可计算

---

### A-P1-2: 分析知识库结构化沉淀

**Problem (问题描述)**
learnings.md 碎片化，多个位置分散（workspace-analyst/memory/、proposals/各日期/），历史分析经验无法复用。4月5日发现 subagent 超时和 reviewer-dedup bug，本质上都是"前人踩过的坑"，但没有系统化记录。

**Solution (解决方案)**
1. **统一知识库位置**: `vibex/docs/knowledge/` 目录
2. **分类结构**:
   - `bug-patterns/`: 已解决的bug根因（如 reviewer-dedup false trigger、Vitest配置死代码）
   - `analysis-templates/`: 分析报告模板、分析方法论
   - `proposal-tracker/`: 提案执行历史
3. **自动沉淀**: 分析任务完成后，提取关键洞察写入知识库
4. **查询入口**: learnings-researcher skill 优先搜索 `knowledge/` 目录

**Estimate (工时估算)**
- 目录结构创建 + 初始迁移: 2h
- 2026-04-05 关键发现迁移（subagent超时、reviewer-dedup、Vitest）: 1h
- learnings-researcher skill 路径更新: 1h
- **总计: 4h**

**Acceptance Criteria (验收标准)**
- [ ] `vibex/docs/knowledge/` 目录存在且结构完整
- [ ] 2026-04-05 关键发现已迁移（subagent超时、reviewer-dedup）
- [ ] learnings-researcher skill 优先搜索 knowledge/ 目录
- [ ] 知识库有贡献指南（CONTRIBUTING.md）

---

### A-P2-1: Sprint 质量基线监控仪表盘

**Problem (问题描述)**
Sprint 中5个 quality/architecture 提案合并后，无统一监控。团队缺少可视化的质量/流程指标追踪面板（test coverage %、bug escape rate、proposal execution rate）。

**Solution (解决方案)**
1. **指标定义**: 5个核心Sprint质量指标
   - 测试覆盖率变化（每Epic完成后）
   - Bug逃逸率（uat发现的bug / 总bug）
   - 提案执行率
   - 子代理成功率（完成/超时+失败）
   - 任务阻塞率（blocked状态任务比例）
2. **数据来源**: team-tasks JSON + 手动周报
3. **可视化**: Markdown表格（自动更新）或简单HTML面板
4. **责任人**: analyst 每周输出 Sprint Quality Report

**Estimate (工时估算)**
- 指标定义 + 数据源梳理: 2h
- 自动化脚本（从 team-tasks 提取指标）: 4h
- Markdown 报告模板: 1h
- **总计: 7h**

**Acceptance Criteria (验收标准)**
- [ ] 5个核心指标定义清晰、可量化
- [ ] Sprint Quality Report 模板可复用于每轮Sprint
- [ ] 自动化脚本从 team-tasks JSON 生成指标数据
- [ ] 2026-04 Sprint结束后有第一份完整报告

---

## 4. 提案汇总

| 编号 | 提案 | 优先级 | 工时估算 | 责任人 |
|------|------|--------|---------|--------|
| A-P0-1 | Subagent Checkpoint 持久化 | P0 | 6h | coord + analyst |
| A-P0-2 | reviewer-dedup Ready决策修复 | P0 | 4h | dev + reviewer |
| A-P1-1 | 提案去重与生命周期管理 | P1 | 2.5h | analyst |
| A-P1-2 | 分析知识库结构化沉淀 | P1 | 4h | analyst |
| A-P2-1 | Sprint 质量基线监控 | P2 | 7h | analyst + dev |

**P0合计: 10h | P1合计: 6.5h | P2合计: 7h**

---

## 5. Sprint 2026-04-06 建议

### 建议执行顺序

```
Day 1: A-P0-2 (4h) → reviewer-dedup bug影响所有任务流转，立即修
Day 1-2: A-P0-1 (6h) → checkpoint 保护其他所有子代理任务
Day 3: A-P1-1 (2.5h) + A-P1-2 (4h) → 提案管理+知识沉淀并行
Day 4-5: A-P2-1 (7h) → 质量监控收尾
```

### Sprint Goal

解除 analyst 角色的质量/流程阻塞，建立提案管理和知识复用基线。

### 风险点

- A-P0-1 需要 coord 层改动，可能涉及 sessions_spawn 重构
- A-P2-1 依赖 team-tasks 数据质量，需确认 JSON 字段完整性

---

**自我评分**: 6/10 (分析覆盖8、提案可执行性7、优先级判断6)

**备注**: 今日是 Sprint 06 首日，建议优先处理 A-P0-2（reviewer-dedup）和 A-P0-1（checkpoint），这两项影响团队整体效率。
