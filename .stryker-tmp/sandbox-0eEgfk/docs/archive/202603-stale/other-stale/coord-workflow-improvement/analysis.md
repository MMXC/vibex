# 项目完成报告自动发送 Slack 改进需求分析

名称: dev
任务: coord-workflow-improvement/analyze-requirements
结果: ✅ 完成
工作目录: /root/.openclaw/vibex

---

## 执行摘要

当前项目完成时缺乏结构化的自动报告机制，用户无法及时了解项目完成状态和产出物。需要实现自动化的项目完成报告发送 Slack，确保用户第一时间获取项目交付信息。

**核心改进点**:
| 当前 | 目标 |
|------|------|
| 无自动报告 | 项目完成自动发送 Slack 消息 |
| 消息格式不统一 | 结构化报告模板 |
| 缺少产出物清单 | 包含产出物列表和验证结果 |

---

## 1. 现状分析

### 1.1 当前通知机制

| 渠道 | 用途 | 状态 |
|------|------|------|
| HEARTBEAT.md 要求 | Dev 任务完成通知 Slack | 有要求但实现分散 |
| escalation/notifier.py | 任务阻塞升级通知 | 已实现 |
| task_manager.py | 任务状态更新 | 基础功能 |
| 手动 sessions_send | 任务完成协调 | 依赖 Agent 手动执行 |

### 1.2 当前问题

| 问题 | 影响 | 证据 |
|------|------|------|
| 无自动触发 | 项目完成后用户不知道 | 需要 Coord/Dev 手动发 |
| 报告格式不统一 | 信息不完整 | 各 Agent 格式各异 |
| 缺少产出物汇总 | 不知道交付了什么 | 只有任务状态 |
| 无验证结果 | 不知道是否真通过 | 缺少测试结果 |

### 1.3 用户痛点

| 角色 | 痛点 | 需求 |
|------|------|------|
| 用户 | 不知道项目何时完成 | 自动通知 |
| 用户 | 不知道产出物是什么 | 产出物清单 |
| 用户 | 不知道验证结果 | 测试/审查结果 |

---

## 2. 改进方案设计

### 2.1 报告触发时机

```
项目完成报告发送时机：
1. 项目状态从 active → completed 时自动触发
2. 最后一个任务 (reviewer) 标记 done 时触发
3. 显式调用命令时触发
```

### 2.2 报告内容模板

```yaml
# 项目完成报告模板
project_completion_report:
  header:
    emoji: "🎉"
    title: "项目完成报告"
    project_name: "<project>"
    completion_time: "<timestamp>"
  
  summary:
    total_tasks: <n>
    completed_tasks: <n>
    failed_tasks: <n>
    duration: "<duration>"
  
  deliverables:
    - role: "analyst"
      artifact: "docs/**/analysis.md"
      status: "✅"
    - role: "pm"
      artifact: "docs/**/prd.md"
      status: "✅"
    - role: "architect"
      artifact: "docs/**/architecture.md"
      status: "✅"
    - role: "dev"
      artifact: "代码变更"
      status: "✅"
    - role: "tester"
      artifact: "screenshots/*.png"
      count: <n>
      status: "✅"
    - role: "reviewer"
      artifact: "reviews/**/*.md"
      status: "✅"
  
  verification:
    test_results: "PASSED/FAILED"
    code_review: "APPROVED/REJECTED"
    artifacts_complete: true/false
  
  next_steps:
    - "项目已就绪，可部署生产环境"
    - "如有问题，请联系 Coord"
```

### 2.3 Slack 消息格式

```
🎉 项目完成报告

📦 项目: coord-workflow-improvement
⏱️ 耗时: 2小时
📊 进度: 4/4 任务完成

📋 产出物清单:
  ✅ analyst - 分析文档
  ✅ pm - PRD 文档
  ✅ architect - 架构文档
  ✅ dev - 代码变更
  ✅ tester - 3 个截图
  ✅ reviewer - 审查通过

🔍 验证结果:
  • 测试: PASSED
  • 审查: APPROVED

💡 下一步: 项目已就绪，可部署生产环境
```

---

## 3. 技术实现方案

### 3.1 方案 A: task_manager.py 增强（推荐）

**实现**: 在 `task_manager.py` 中添加自动报告功能

```python
# task_manager.py 新增功能
def generate_completion_report(project: str) -> dict:
    """生成项目完成报告"""
    tasks = load_tasks(project)
    project_info = load_project(project)
    
    report = {
        "project": project,
        "goal": project_info.get("goal"),
        "completion_time": datetime.now().isoformat(),
        "tasks": [],
        "deliverables": [],
        "verification": {}
    }
    
    for task in tasks:
        # 收集任务信息
        report["tasks"].append({
            "id": task["task_id"],
            "role": task["role"],
            "status": task["status"],
            "result": task.get("result", "")
        })
        
        # 收集产出物
        if task["role"] == "tester":
            report["deliverables"].append({
                "role": "tester",
                "artifact": "测试截图",
                "files": extract_files(task.get("result", ""))
            })
        # ... 其他角色
    
    return report

def send_completion_notification(project: str):
    """发送项目完成通知到 Slack"""
    report = generate_completion_report(project)
    message = format_slack_message(report)
    
    # 使用 openclaw message 发送
    subprocess.run([
        "openclaw", "message", "send",
        "--channel", "slack",
        "--target", "C0AG6F5T05V",
        "--message", message
    ])
```

**优点**: 与现有系统集成紧密，触发时机可控
**缺点**: 需要修改 task_manager.py

### 3.2 方案 B: 独立脚本

**实现**: 创建 `notify-completion.sh`

```bash
#!/bin/bash
# notify-completion.sh <project>

PROJECT=$1
REPORT=$(python3 task_manager.py report $PROJECT)

openclaw message send \
  --channel=slack \
  --target=C0AG6F5T05V \
  --message="$REPORT"
```

**优点**: 独立，易于修改
**缺点**: 需要手动调用

### 3.3 方案 C: Coord Agent 集成

**实现**: 在 Coord 的 HEARTBEAT 中检查项目完成并发送报告

**优点**: 灵活性高
**缺点**: 依赖心跳频率

---

## 4. 推荐实现

### 4.1 Phase 1: 报告生成逻辑（推荐方案 A）

- [ ] 在 task_manager.py 中添加 `report` 子命令
- [ ] 实现 `generate_completion_report()` 函数
- [ ] 实现 `format_slack_message()` 函数
- [ ] 在 `update <project> completed` 时自动触发

### 4.2 Phase 2: 消息优化

- [ ] 支持 Block Kit 格式
- [ ] 添加项目描述
- [ ] 添加产出物链接

### 4.3 Phase 3: 验证增强

- [ ] 集成 project-completion-verification 产出物检查
- [ ] 添加测试结果汇总
- [ ] 添加审查意见摘要

---

## 5. 技术风险

| 风险 | 影响 | 可能性 | 缓解 |
|------|------|--------|------|
| Slack 发送失败 | 用户收不到 | 低 | 记录日志，重试机制 |
| 报告格式问题 | 信息不完整 | 中 | 模板化，字段校验 |
| 触发时机问题 | 重复发送 | 低 | 状态检查，只发一次 |

---

## 6. 验收标准

### 6.1 功能验收

| 验收项 | 标准 | 测试方法 |
|--------|------|----------|
| 完成自动发送 | 项目 completed 时自动发 | 模拟项目完成 |
| 消息格式正确 | 包含项目名、产出物、验证结果 | 检查消息内容 |
| 发送成功 | Slack 收到消息 | 查看 Slack 频道 |

### 6.2 内容验收

| 验收项 | 标准 |
|--------|------|
| 包含项目名称 | 是 |
| 包含任务进度 | 4/4 形式 |
| 包含产出物清单 | 各角色产出物 |
| 包含验证结果 | 测试/审查状态 |

### 6.3 兼容性验收

| 验收项 | 标准 |
|--------|------|
| 现有项目不受影响 | 仅对新 completed 项目生效 |
| 多角色项目支持 | analyst/pm/architect/dev/tester/reviewer |

---

## 7. 实施计划

| 阶段 | 任务 | 预估时间 |
|------|------|----------|
| Phase 1 | task_manager.py 报告生成 | 2 小时 |
| Phase 2 | Slack 消息格式化 | 1 小时 |
| Phase 3 | 自动触发集成 | 1 小时 |
| Phase 4 | 测试验证 | 1 小时 |

**总预估**: 5 小时

---

## 8. 约束确认

- ✅ 工作目录: /root/.openclaw/vibex
- ✅ 产出分析文档: docs/coord-workflow-improvement/analysis.md
- ✅ 识别技术风险: 已识别（见上文风险表）
- ✅ 验收标准具体可测试: 已明确
- ✅ 每个需求有实现方案: 已提供 3 个方案

---

## 9. 结论

**推荐方案**: 在 task_manager.py 中增强自动报告功能

**理由**:
1. 与现有任务管理流程紧密集成
2. 触发时机可控（项目 completed 时）
3. 可复用现有 Slack 通知机制

**核心产出**:
- 项目完成自动发送 Slack 消息
- 消息包含结构化产出物清单
- 消息包含验证结果摘要

---

**产出物**: `docs/coord-workflow-improvement/analysis.md`
**验证**: `test -f /root/.openclaw/vibex/docs/coord-workflow-improvement/analysis.md`
