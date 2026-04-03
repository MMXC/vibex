# Analysis: coord-decision-report 命令

**任务**: coord-decision-report/analyze-requirements
**日期**: 2026-03-30
**分析师**: analyst
**PRD 来源**: /root/.openclaw/vibex/docs/coord-decision-report/prd.md

---

## 1. 业务场景分析

### 背景
Coord 每 5 分钟运行心跳，需要快速获取三个决策答案：
1. **下一步做什么？** — Ready 任务优先级
2. **有没有卡住？** — Blocked 根因
3. **该不该创建新项目？** — 空转时提案推荐

现有 `coord-heartbeat-latest.sh` 提供大量无关数据（CPU/内存/disk），但真正决策信息缺失。

### 目标用户
- **Coord Agent**: 日常决策支持

### 核心价值
- **效率**: 30 秒内做出下一步判断
- **精准**: 只提供决策必需信息
- **可操作**: 每条建议都有明确行动

---

## 2. 技术可行性分析

### D1: Ready 任务决策建议

**技术方案**: 
1. 扫描所有 `tasks.json`，筛选 `status=pending` 且 `dependsOn` 全部 `done`
2. 计算 `等待时长 = now - MAX(dependsOn.completedAt)`
3. 匹配 `agent` 字段确定执行者

**可行性**: ✅ 高
- 数据源单一（tasks.json）
- 依赖关系已在 DAG 模式中定义
- 无需新增数据采集

**风险**:
| 风险 | 影响 | 缓解 |
|------|------|------|
| dependsOn.completedAt 未设置 | 等待时长无法计算 | 使用 startedAt 或创建时间降级 |
| agent 字段为空 | 无法分配任务 | 标记 "unassigned" |

### D2: 阻塞根因分析

**技术方案**:
1. 检测 `status=in-progress` 但超时的任务
2. 检查 agent 是否仍活跃（通过心跳会话）
3. 分类：agent 挂了 / 依赖未完成

**可行性**: ✅ 高
- 心跳会话记录 agent 启动时间
- 依赖状态已在 tasks.json

**风险**:
| 风险 | 影响 | 缓解 |
|------|------|------|
| 心跳会话丢失 | 无法判断 agent 状态 | 降级为 "unknown" |
| 依赖任务被删除 | 引用失效 | 忽略失效依赖 |

### D3: 空转提案推荐

**技术方案**:
1. 扫描 `proposals/` 目录（来自 agent-proposals-* 项目）
2. 解析 `**/proposals/**/*.md` 文件
3. 综合 Ranking: proposer 多样性 + 实现成本 + 战略价值
4. 输出 Top3

**可行性**: ⚠️ 中等
- 目录结构已存在
- 提案格式未标准化（需要解析多个模板）

**风险**:
| 风险 | 影响 | 缓解 |
|------|------|------|
| 提案格式不统一 | ranking 不准 | 使用固定模板 |
| proposals 目录为空 | 无推荐 | 输出 "无提案" |
| ranking 算法主观 | 结果不确定 | 提供确定性规则 |

---

## 3. 决策建议生成规则（详细）

### D1.1 Ready 任务判定

```python
def is_ready(task):
    if task.status != 'pending':
        return False
    deps = task.dependsOn
    if not deps:
        return True  # 无依赖，直接 ready
    return all(dep.status == 'done' for dep in deps)
```

### D1.2 决策建议生成

```python
def generate_decision(task, all_tasks):
    # 获取任务所在项目的优先级
    project_priority = get_project_priority(task.project)
    
    # 检查是否有更高优先级任务在队列
    higher_priority = [t for t in all_tasks if t.priority > project_priority and is_ready(t)]
    if higher_priority:
        return ("lower priority", f"有 {len(higher_priority)} 个更高优先级任务")
    
    # 检查依赖方状态
    dep_agents = [dep.agent for dep in task.dependsOn if dep.status != 'done']
    if not dep_agents:
        return ("do it now", "依赖链末端，下游阻塞")
    
    # 依赖方还未完成
    return ("skip", f"等待 {dep_agents} 完成")
```

### D3.1 提案 Ranking 算法

```python
def rank_proposals(proposals):
    scored = []
    for p in proposals:
        # 分数 = proposer 多样性权重(3) + 价值权重(5) - 成本权重(2)
        score = (3 if is_multi_agent(p.proposer) else 1) + p.strategic_value * 5 - p.implementation_cost * 2
        scored.append((p, score))
    return sorted(scored, key=lambda x: -x[1])[:3]
```

---

## 4. 数据源确认

| 数据 | 来源 | 格式 |
|------|------|------|
| 活跃任务 | tasks.json | JSON |
| 依赖关系 | tasks.json.dependsOn | Array |
| 提案库 | proposals/ | Markdown |
| 心跳计数 | .heartbeat_count | 文件 |

---

## 5. 明确排除项确认

| 排除项 | 确认 |
|--------|------|
| 系统资源（CPU/内存/磁盘） | ✅ 确认排除 |
| completed/terminated 数量 | ✅ 确认排除 |
| 服务器 uptime | ✅ 确认排除 |
| 虚假完成检测 | ✅ 确认排除（已由 dev 环节保证） |

---

## 6. 验收标准

| # | 标准 | 测试方法 |
|---|------|----------|
| 1 | `decision-report` 命令返回 0 | `task_manager.py decision-report; echo $?` |
| 2 | Ready 任务含决策建议 | `grep -E "do it now\|skip\|lower priority" output` |
| 3 | Blocked 任务含根因分类 | `grep -E "agent 挂了\|依赖未完成" output` |
| 4 | 空转时显示提案 Top3 | 无 ready 时检查提案数量 |
| 5 | 执行时间 < 2秒 | `time task_manager.py decision-report` |
| 6 | --json 输出 valid JSON | `task_manager.py decision-report --json \| jq .` |

---

## 7. 实现约束

1. **纯文本默认**: cron 日志可读
2. **JSON 可选**: 程序消费
3. **无新依赖**: 仅使用现有 psutil（已有）
4. **向后兼容**: 不破坏现有子命令

---

## 8. 工作量估算

| Epic | 复杂度 | 工时 |
|------|--------|------|
| Epic 1: Ready 决策引擎 | 中 | 1h |
| Epic 2: 阻塞根因分析 | 低 | 0.5h |
| Epic 3: 空转提案推荐 | 中 | 1h |
| Epic 4: CLI + 格式化 | 低 | 0.5h |
| **总计** | | **3h** |

---

## 9. 风险评估总结

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 提案格式不统一 | 高 | 中 | 定义标准模板，仅解析符合模板的提案 |
| dependsOn.completedAt 未设置 | 中 | 低 | 降级使用 startedAt 或 created |
| ranking 算法主观 | 中 | 低 | 提供确定性规则文档 |
