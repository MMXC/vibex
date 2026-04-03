# Analysis: team-evolution-20260328 — Harness Engineering 改进

**Agent**: ANALYST
**Date**: 2026-03-28
**Task**: team-evolution-20260328/analyze-requirements
**Status**: 🔄 分析中

---

## 1. 业务场景分析

### 1.1 背景

当前 Harness Engineering（agent 协作流程）存在两个高优先级的流程缺陷：

| 问题 | 当前状态 | 影响 |
|------|---------|------|
| 打分与 task_done 脱节 | 评分由 `coord-spawn-inspector.sh` 在 spawn 下游 agent 时并行触发，完全独立于 task 完成流程 | agent 完成任务后不知道自己的产出质量，评分反馈滞后 |
| 错误案例无系统沉淀 | HEARTBEAT.md 有经验沉淀区域（E001-E011），但依赖人工写入，没有自动回填机制 | 同样的错误反复出现，团队学习效率低 |

### 1.2 根因分析

**打分脱节根因**：
1. 评分触发点是 `spawn 下游 agent`（coord-spawn-inspector.sh），而非 `task 完成`
2. 评分结果写 `scores.tsv`，但 agent 在完成当前任务时看不到自己上次的评分
3. 评分只覆盖特定 agent 对（tester→dev, reviewer→dev, reviewer-push→reviewer），analyst/pm/architect 没有进入评分循环
4. 评分流程无 agent 端参与 — agent 不知道被打分，也没有机会 self-reflect

**错误回填根因**：
1. HEARTBEAT.md 的经验沉淀依赖人工判断"这条值得记"
2. 没有结构化的错误收集触发机制
3. 没有自动将错误分类写入对应 AGENTS.md/HEARTBEAT.md 的流程

---

## 2. 核心 JTBD

| # | Job-To-Be-Done | 痛点 | 优先级 |
|---|----------------|------|--------|
| JTBD-1 | agent 完成任务时能**立即收到自我评分反馈**，无需等待下游 | 评分滞后一个完整 pipeline 周期（T+1） | P0 |
| JTBD-2 | 系统能**自动捕获错误案例**并分类沉淀到知识库 | 人工写入依赖自觉，无法规模化 | P0 |
| JTBD-3 | **并行执行**做事与评分，两者互不阻塞 | 当前评分在 spawn 下游时触发，逻辑分散在 coord | P1 |
| JTBD-4 | 评分结果能**回写到 agent 的 AGENTS.md** 中形成闭环 | 评分只在 scores.tsv 中，没有更新到 agent 定义文件 | P1 |

---

## 3. 技术方案对比

### 方案 A：Agent 端自评分 + 被动写入（推荐）

**核心理念**：在 task_done 阶段，让 agent 主动完成 self-assessment 和 error-log，无需外部 scorer。

**实现方式**：

```
Agent 完成阶段任务
    │
    ├─► 1. 写入 phase 报告（现有流程）
    │
    ├─► 2. 自我评分：读取 SCORING_RUBRICS.md → 9维自评 → 调用 score.sh record
    │       - 评分者写 "self"
    │       - 不阻塞任务完成（评分失败不影响任务状态）
    │
    ├─► 3. 错误日志：检查 HEARTBEAT.md E00x 是否有相似错误
    │       - 有相似错误 → 在 phase 报告末尾追加 "教训引用: E00x"
    │       - 无相似错误 → 新增 E00x 到 HEARTBEAT.md
    │
    └─► 4. task_manager complete（现有流程）
```

**优点**：
- 无需改变 coord-spawn-inspector.sh 的并行逻辑
- agent 端控制，数据在自己 workspace 内
- 可以产出下游对比的 reference（self vs scorer）
- 错误回填由 agent 自己触发，最接近错误发生时刻

**缺点**：
- agent 端需要实现 self-assessment prompt
- 需要在每个 agent 的 HEARTBEAT.md 的 task_done 节点插入脚本
- self 评分可能存在 bias

**实现工作量**：~2h（主要是 6 个 agent HEARTBEAT.md 的 task_done hook 统一改造）

---

### 方案 B：WebSocket/Webhook task_done 事件 + 独立评分服务

**核心理念**：在 task_manager complete 时触发一个 webhook，由独立 scorer agent 完成评分。

**实现方式**：

```
task_manager.py complete <project> <stage> done
    │
    ├─► task_manager 写 completion timestamp
    │
    └─► curl POST webhook: {project, stage, agent, phase_file}
            │
            ├─► scorer session spawn（并行，不阻塞返回）
            │       - 读取 SCORING_RUBRICS.md
            │       - 读取 phase 文件
            │       - 9维打分 → score.sh record
            │       - error pattern 匹配 → HEARTBEAT.md 回填
            │
            └─► 返回 "queued"（不等待 scorer 完成）
```

**优点**：
- 评分触发点精确在 task_done，无遗漏
- 评分逻辑集中，不污染各 agent workspace
- 可以扩展为独立的 evaluator 微服务

**缺点**：
- 需要修改 task_manager.py（Python），涉及底层改动
- webhook 可靠性需要额外保障
- 并行度依赖 webhook async 机制（需要 sessions_spawn）

**实现工作量**：~6h（涉及 task_manager.py 核心逻辑修改）

---

### 方案 C：混合方案（兼顾速度与质量）

**核心理念**：DAG 并行 — agent 做事实时自评分，scorer 异步复评，两者结果对比写入进化追踪。

**实现方式**：

```
Agent task_done
    │
    ├─► [T+0] 立即自评分 → score.sh record (rater=self) + 错误自检
    │               ↓
    │           返回 task_done 确认（agent 端完成）
    │
    └─► [T+Δ] scorer 异步复评（coord-spawn-inspector.sh 原逻辑）
                ↓
            self vs scorer 差异分析 → analyst-evolution.sh record delta
```

**优点**：
- 保留了现有 scorer 机制，无需大改
- agent 获得即时反馈（T+0）
- self vs scorer 差异形成有价值的进化数据

**缺点**：
- 增加了两个写操作的复杂度（self + scorer）
- 需要处理 self/scorer 评分差异的处理逻辑

**实现工作量**：~3h（推荐在此基础上实现）

---

### 方案 D：仅改进错误回填（最小化改动）

**核心理念**：暂时不改评分流程，只在 HEARTBEAT.md 心跳扫描时增加错误自动提取逻辑。

**实现方式**：

```
heartbeat-analyst.sh
    │
    ├─► 扫描 HEARTBEAT.md 最新心跳记录
    │
    ├─► 检测异常关键词（timeout, error, fail, 429, 不一致）
    │
    └─► 自动写入 HEARTBEAT.md 经验沉淀区（E0xx）
```

**优点**：
- 最小改动范围
- 见效快

**缺点**：
- 只解决了错误回填，未解决评分脱节
- 被动扫描可能遗漏 agent 端已知的错误

**实现工作量**：~1h

---

## 4. 推荐方案与实现路径

**推荐：方案 C（混合方案）**，兼顾即时反馈与质量把控。

### 4.1 DAG 并行设计

```
阶段一（task_done 时执行）：
agent: task_done → self-score + error-log（并行，不阻塞）

阶段二（coord spawn 下游时触发）：
coord: spawn 下游 agent → 并行 spawn scorer（现有逻辑不变）

汇合：
self-score + scorer-score → delta 写入进化追踪
```

### 4.2 具体实现步骤

**Step 1：统一 task_done hook（~1.5h）**
- 在所有 agent 的 HEARTBEAT.md 添加 task_done 段落
- hook 内容：读取 SCORING_RUBRICS.md → 自评分 → 调用 score.sh record
- hook 内容：检查 phase 文件中的 error pattern → 回填 E00x

**Step 2：实现 error-log 自动化脚本（~1h）**
- 创建 `/root/.openclaw/scripts/auto-error-log.sh`
- 输入：phase 文件路径
- 输出：E00x 条目（追加到 HEARTBEAT.md）
- 逻辑：正则提取 error 类型 → 查重 → 写入

**Step 3：实现 self vs scorer delta 追踪（~0.5h）**
- 在 `analyst-evolution.sh` 增加 `downstream-score` 类型
- self/scorer 差异超过阈值（如 2 分）时触发提醒

---

## 5. 验收标准

| ID | 验收标准 | 测试方法 |
|----|---------|---------|
| AC-1 | agent 执行 `task_manager.py complete` 后，scores.tsv 中有 rater=self 的记录 | 手动执行一个阶段任务完成，检查 scores.tsv |
| AC-2 | 错误案例在 phase 完成后 5 分钟内出现在 HEARTBEAT.md 经验沉淀区 | 制造一个已知错误（如 429），验证 E0xx 条目生成 |
| AC-3 | self 评分和 scorer 评分差值记录在 analyst-evolution.sh 中 | 完成一个 agent self-score + 等待 scorer 完成，对比 delta |
| AC-4 | 评分流程不阻塞 agent 正常完成任务的流程 | 计时：task_done → 返回确认 < 30s |
| AC-5 | 所有 6 个 agent（analyst/pm/architect/dev/tester/reviewer）都进入评分循环 | 检查各 agent 的 HEARTBEAT.md 都有 self-score hook |

---

## 6. 风险识别

| 风险 | 可能性 | 影响 | 缓解方案 |
|------|--------|------|---------|
| agent self-score 存在过度宽容 bias | 高 | 中 | self vs scorer 差异超过阈值触发人工 review |
| self-score + scorer 双重写 scores.tsv 导致 merge 冲突 | 低 | 中 | 两个写入使用不同 run_tag，由 score.sh 自己处理 append |
| error-log 脚本误判正常执行为错误 | 中 | 低 | 只检测已知错误模式（timeout, 429, Cannot claim 等） |
| task_manager.py 修改影响其他 agent | 高 | 高 | 方案 C 不修改 task_manager.py，只在 HEARTBEAT.md hook |
| heartbeat 扫描 HEARTBEAT.md 时产生格式破坏 | 中 | 中 | 写入前先备份，读取后验证格式完整性再写回 |

---

## 7. 开放问题

1. self-score 是否有权限写入其他 agent 的 scores.tsv？还是只在各自的 downstream-scores.tsv？
2. error-log 是否需要 coord 审核后才正式写入 HEARTBEAT.md？还是直接写入？
3. self vs scorer 差异阈值设为多少合理？（建议 2 分）
4. analyst 产出的 brief 是否也应该有 PM 端自评分？

