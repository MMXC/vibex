# Analysis: agent-self-evolution-20260330-daily

**项目**: 每日自检任务自动机
**周期**: 2026-03-29 ~ 2026-03-30
**Analyst**: self-evolution-20260330-daily / analyze-requirements
**产出时间**: 2026-03-30 06:53 CST
**数据来源**: dev / analyst / architect / pm / tester / reviewer / coord 7 份自检文档

---

## 1. 业务场景分析

### 背景

当前团队有 7 个 agent（dev、analyst、architect、pm、tester、reviewer、coord）和 1 个 human overseer（小羊）。每天通过心跳协调驱动多个并行项目，产生了大量分散的 lessons learned、反思和改进建议，但这些知识未被系统性沉淀和转化。

### 当前自检流程

1. **心跳触发** (`heartbeat-coord` cron, 每5分钟) → Coord LLM 响应
2. **派发阶段** → 通过 `task_manager.py` + `curl userToken` 发送 Slack 通知
3. **各 agent 执行** → 领取任务 → 产出 self-check 文档 → 更新任务状态
4. **Coord 汇总** → 检查异常 → 无异常则进入待命模式

### 核心痛点（从自检文档归纳）

| 痛点 | 来源 Agent | 症状 |
|------|-----------|------|
| **任务超时 zombie 未被及时发现** | coord, tester | `tester-analyst-self-check` zombie 481min 未处理 |
| **zombie 任务复活但无法领取** | coord | 待命计数消耗，但任务未真正执行 |
| **并行 Epic 共享函数测试隔离不足** | dev | `matchFlowNode()` 在多个 Epic 测试文件中重复覆盖 |
| **z-index 层级缺乏集中管理** | architect | Canvas overlay 层冲突风险 |
| **技术债务未显式标注** | architect | architecture.md 中 tech debt 散落各处 |
| **工时估算无历史数据支撑** | pm | Phase0 估算 21h 无法校验 |
| **提案收集自动化程度低** | pm | 需人工触发，缺乏定时机制 |

---

## 2. 核心 Jobs-To-Be-Done (JTBD)

### JTBD 1: 知识沉淀自动化
**用户**: 全体 agent
**目标**: 将每日工作反思和教训自动沉淀为结构化知识库，无需人工干预
**当前行为**: 各 agent 手动写 self-check 文档，分散在 `docs/agent-self-evolution-YYYYMMDD/` 目录
**阻碍**: 文档无人汇总，知识在文档堆里消亡
**优先级**: **P0**

### JTBD 2: 系统性异常检测
**用户**: coord, human overseer
**目标**: 在 zombie 任务发生后的合理时间内（<30min）自动告警并采取行动
**当前行为**: zombie 任务在心跳中被检测到，但"重置为 ready"不等于"真正复活"
**阻碍**: 任务被重置后若 agent 未领取，zombie 会再次出现
**优先级**: **P0**

### JTBD 3: 跨 agent 改进建议闭环
**用户**: coord（决策者）
**目标**: 将多个 agent 的自检发现转化为可执行的下一轮开发任务
**当前行为**: 自检文档产出了改进建议，但建议没有进入提案收集→PRD→开发流程
**阻碍**: 建议→行动之间的 gap 无人负责
**优先级**: **P1**

### JTBD 4: 团队节奏治理
**用户**: coord, human overseer
**目标**: 建立清晰的"活跃→待命→提案收集"节奏，减少无谓唤醒
**当前行为**: 待命计数 3/3 才触发提案收集，阈值可能过高或过低
**阻碍**: 待命机制设计缺乏数据支撑
**优先级**: **P2**

---

## 3. 技术方案选项

### 方案 A: 强化心跳协调（轻量级改进）

**核心思路**: 不改变架构，在现有 `heartbeat-coord` 框架内打补丁

**具体措施**:
- 增加 zombie 任务"重派发锁"：zombie 被重置后，5 分钟内若未有人领取则再次告警
- 增加待命计数动态调整：根据项目复杂度历史数据自动调参
- self-check 文档增加结构化摘要字段（JSON frontmatter），便于程序化汇总

**优点**: 改动小，风险低，见效快
**缺点**: 仍是补丁式治理，无法系统性解决

### 方案 B: 自检工作流自动化（推荐）

**核心思路**: 建立正式的自检 pipeline，将"自检→分析→决策→行动"流程化

**具体措施**:
1. **自检提交**: 各 agent 在固定时间窗口（如每日 06:00 前）提交 self-check 到统一格式
2. **自动汇总**: cron job 调用 LLM 或规则引擎解析所有 self-check，生成《每日团队状态报告》
3. **决策触发**: 若报告显示异常（zombie > 2，或待命计数 > 阈值），自动创建改进 Epic
4. **闭环追踪**: 改进 Epic 的验收标准引用原始 self-check 文档

**优点**: 流程完整，闭环可追踪
**缺点**: 需要新的 cron job 和格式规范

### 方案 C: 知识图谱驱动（长期演进）

**核心思路**: 将所有 agent 工作产物（proposal、PRD、self-check、ADR）关联建图

**具体措施**:
- 建立 `agent-knowledge-graph.json`：节点 = 项目/Epic/task，边 = 依赖/反馈/改进
- self-check 中的教训自动关联到相关项目节点
- 下次提案收集时，自动推荐相关历史教训

**优点**: 知识可追溯，可发现跨项目模式
**缺点**: 建设成本高，短期收益不明显

---

## 4. 可行性评估

| 方案 | 技术可行 | 组织可行 | ROI | 推荐 |
|------|---------|---------|-----|------|
| A: 强化心跳协调 | ✅ | ✅ | 高 | **立即实施** |
| B: 自检工作流自动化 | ✅ | ✅ | 高 | **下一周期实施** |
| C: 知识图谱驱动 | ⚠️ 需额外基础设施 | ⚠️ 需规范建立 | 中 | 长期规划 |

---

## 5. 初步风险识别

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 自检文档格式不统一，LLM 汇总失败 | 中 | 中 | 先制定 Markdown 结构化模板（方案 A 的第一步）|
| zombie 重派发锁导致频繁告警 | 低 | 低 | 设置最小间隔（如 30min）|
| agent 忘记提交 self-check | 中 | 高 | 纳入 HEARTBEAT.md 强制检查，未提交则心跳告警 |
| 提案收集过度自动化导致噪音 | 低 | 中 | 保留 human overseer 否决权 |

---

## 6. 验收标准

| ID | 验收标准 | 测试方式 |
|----|---------|---------|
| V1 | 每日 06:00 前，所有 7 个 agent 的 self-check 文档存在于 `docs/agent-self-evolution-YYYYMMDD/` | `find docs/agent-self-evolution-*-daily -name "*-selfcheck-*.md" \| wc -l` ≥ 7 |
| V2 | zombie 任务从产生到告警 < 30min | 检查 heartbeat 日志中 zombie 检测时间戳 |
| V3 | Coord 每日起草《团队状态报告》包含：完成项目数、zombie 数、改进建议 | 报告文件存在且包含关键词 |
| V4 | 自检中发现的改进建议在 24h 内进入提案收集或 phase1 | 检查 `proposals/` 目录与 self-check 文档的关联性 |
| V5 | self-check 文档包含结构化摘要（JSON frontmatter 或 Markdown table） | `grep -E "^---|^## " selfcheck-*.md` 有结构化字段 |
| V6 | 所有 agent 自检流程在 1h 内完成（06:00 前提交） | 检查 git commit 时间或文档修改时间 |

---

## 7. 下一步行动建议

### 立即（本周内）
1. **制定 self-check 模板**: 在 `AGENTS.md` 中规定统一的 self-check 文档格式（包含 JSON frontmatter）
2. **增加 zombie 告警升级**: zombie > 2 时自动 @ 小羊，不只是重置为 ready

### 下一周期（明日自检前）
3. **实现方案 B 的第一步**: cron job 自动生成《每日团队状态报告》
4. **建立自检→提案闭环**: self-check 文档中标记 `[ACTIONABLE]` 的条目自动进入 `proposals/YYYYMMDD/`

### 长期
5. 评估知识图谱方案 ROI
