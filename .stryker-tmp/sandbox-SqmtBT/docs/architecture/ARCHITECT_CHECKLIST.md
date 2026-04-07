# ARCHITECT_CHECKLIST.md - Architect 前置检查清单

> 来源: Architect 每日自检 2026-03-26
> 版本: 1.0
> 状态: 启用

---

## 🎯 目的

确保每次 `design-architecture` 任务执行前，技术栈、PRD、Analysis 等前置条件均已满足，
避免因信息不足导致的架构误判（如 D3.js vs ReactFlow 混淆）。

---

## ✅ 设计前检查清单

每次领取 `design-architecture` 任务后，**按顺序执行以下检查**：

### 1. 技术栈核实（必须）

```bash
# 前端技术栈
grep -E "reactflow|@xyflow|next|d3|recharts" frontend/package.json

# 后端技术栈
grep -E "fastify|express|nestjs|python|golang" backend/package.json 2>/dev/null

# 确认关键依赖版本
cat frontend/package.json | grep -E '"@' | head -10
```

**通过条件**: 确认的核心库与 PRD/Analysis 中描述一致
**失败处理**: PRD/Analysis 描述与实际不符 → 在架构文档中标注"技术栈核实修正"

### 2. PRD 存在性检查

```bash
test -f prd.md && echo "✅ PRD ready" || echo "⚠️ WARNING: PRD missing"
```

**通过条件**: `prd.md` 存在
**失败处理**: PRD 缺失 → 架构前置条件不满足，通知 PM 补齐后再开工

### 3. Analysis 存在性检查

```bash
test -f analysis.md && echo "✅ Analysis ready" || echo "⚠️ WARNING: Analysis missing"
```

**通过条件**: `analysis.md` 存在
**失败处理**: Analysis 缺失 → 通知 Analyst 补齐，Architect 可先基于 PRD 开始初步设计

### 4. team-tasks 状态同步检查

```bash
# 检查项目状态是否为 active
python3 /root/.openclaw/skills/team-tasks/scripts/task_manager.py list | grep "<project-name>"

# 检查 design-architecture 任务是否处于 pending/ready
```

**通过条件**: 项目状态为 `active`，任务状态为 `pending` 或 `ready`
**失败处理**: 状态异常 → 修复后通知 coord

---

## 📋 架构文档产出标准

以下清单用于验收 architecture.md 产出质量：

### 必填项

- [ ] **Tech Stack**: 版本选择 + 选择理由
- [ ] **Architecture Diagram**: Mermaid 代码（至少 1 张）
- [ ] **API Definitions**: 接口签名（参数 + 返回值 + 错误码）
- [ ] **Data Model**: 核心实体关系（ER 或 TypeScript 类型）
- [ ] **ADR**: 至少 1 个 ADR，包含 Context / Decision / Consequences
- [ ] **Open Questions**: 识别未解决的问题，给出 Architect 建议
- [ ] **验收时序**: 每个 ADR 的验证指标 + 回滚条件

### 配套文件（按需产出）

- [ ] **IMPLEMENTATION_PLAN.md**: PR 批次划分（Epic 拆分）
- [ ] **AGENTS.md**: Dev/Tester/Reviewer 禁止事项

### 可选（复杂场景）

- [ ] **TypeScript 代码级 API 定义**: 复杂 API 给出可直接使用的代码
- [ ] **至少 2 个方案对比**: 包含 Trade-off 分析

---

## 📝 ADR 验收时序模板

每个 ADR 必须包含：

```markdown
## ADR-XXX: [决策标题]

### 验收时序
- 上线第 1 周: 监控 [指标] ≥ [目标值]
- 上线第 2 周: 如果 [指标] > [阈值]，触发 ADR 重审
- 回滚条件: [指标] > [危险值] 或 [用户投诉数] > [阈值]

### 验证命令
/command/to/verify/decision
```

---

## 📣 下游评分提醒模板

架构完成后，在通知 Dev 的消息中**必须包含**：

```
📋 Architect 架构产出已就绪，请 Dev 评分：
🔗 参考: /root/.openclaw/team-evolution/SCORING_RUBRICS.md 第3节
📊 四维评分: 完整性 | 可执行性 | 清晰度 | 实用性
⏰ 请在 Dev 任务完成前完成评分
```

---

## 🔄 检查流程图

```
领取 design-architecture 任务
        ↓
技术栈核实（grep 确认）
        ↓
PRD 存在？ ── 否 ──→ 通知 PM 补齐，等待
        ↓ 是
Analysis 存在？ ── 否 ──→ 通知 Analyst，先基于 PRD 初步设计
        ↓ 是
team-tasks 状态同步？ ── 否 ──→ 修复状态
        ↓ 是
开始架构设计
        ↓
产出 architecture.md + ADR + 验收时序
        ↓
发送 Dev 通知（含评分提醒）
        ↓
标记任务完成
```

---

## 📌 更新记录

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2026-03-26 | 初始版本，基于 architect 每日自检改进计划创建 |

---

_此清单应作为 Architect 每次执行 design-architecture 任务的参考标准_
