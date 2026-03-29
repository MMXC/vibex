# IMPLEMENTATION_PLAN: task_manager.py 内置 curl 催办通知

> **项目**: task-manager-curl-integration
> **创建日期**: 2026-03-30
> **基于**: PRD v1 + Architecture
> **代码文件**: `vibex/scripts/task_manager.py`

---

## 1. 现状分析

### 1.1 当前通知机制

**task_manager.py 现有命令**：

| 命令 | 功能 | 是否有通知 |
|------|------|-----------|
| `phase1` | 创建 analyst→pm→architect→coord 链路 | ❌ 无 |
| `phase2` | 创建 dev→tester→reviewer→coord 链路 | ❌ 无 |
| `update` | 更新任务状态 | ❌ 无 |
| `claim` | 领取任务 | ❌ 无（仅打印详情） |

### 1.2 文件位置索引

| 元素 | 文件 | 行号 |
|------|------|------|
| `cmd_phase1()` | task_manager.py | ~L358 |
| `cmd_phase2()` | task_manager.py | ~L625 |
| `cmd_update()` | task_manager.py | ~L1206 |
| `cmd_claim()` | task_manager.py | ~L1312 |
| DAG 任务读取 | task_manager.py | ~L100-150 |

---

## 2. Epic 1: 通知模块开发 — 2h

### Story 1.1: 新增配置常量 (0.5h)

**修改**: `task_manager.py` 顶部（import 区之后）

```python
# ── Slack 通知配置 ────────────────────────────────────────────────
import os

SLACK_API = "https://slack.com/api/chat.postMessage"

AGENT_CHANNEL = {
    "coord":     "C0AP3CPJL8N",
    "analyst":   "C0ANZ3J40LT",
    "pm":        "C0APZP2JX2L",
    "architect": "C0AP93CLPQU",
    "reviewer":  "C0AP937RXEY",
    "tester":    "C0APJCNTKPB",
    "dev":       "C0AP92ZGC68",
}

AGENT_TOKEN = {
    "coord":     os.getenv("SLACK_TOKEN_coord"),
    "analyst":   os.getenv("SLACK_TOKEN_analyst"),
    "pm":        os.getenv("SLACK_TOKEN_pm"),
    "architect": os.getenv("SLACK_TOKEN_architect"),
    "reviewer":  os.getenv("SLACK_TOKEN_reviewer"),
    "tester":    os.getenv("SLACK_TOKEN_tester"),
    "dev":       os.getenv("SLACK_TOKEN_dev"),
}
```

### Story 1.2: 实现 _curl_slack 函数 (0.5h)

```python
def _curl_slack(channel_id: str, user_token: str, text: str) -> bool:
    """发送 Slack 消息，返回是否成功"""
    import urllib.request, json
    if not user_token:
        return False
    payload = json.dumps({
        "channel": channel_id,
        "text": text,
        "mrkdwn": True
    }).encode()
    req = urllib.request.Request(
        SLACK_API,
        data=payload,
        headers={
            "Authorization": f"Bearer {user_token}",
            "Content-Type": "application/json",
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read())
            return result.get("ok", False)
    except Exception as e:
        print(f"⚠️ Slack 通知失败: {e}", file=sys.stderr)
        return False
```

### Story 1.3: 实现 notify_new_task (0.5h)

```python
def notify_new_task(project: str, stage_id: str, agent: str, goal: str):
    """通知新任务 READY"""
    text = (
        f"*📋 新任务 READY*\n"
        f"*项目*: `{project}`\n"
        f"*任务*: `{stage_id}`\n"
        f"*目标*: {goal}\n\n"
        f"请领取: `python3 task_manager.py claim {project} {stage_id}`"
    )
    ch = AGENT_CHANNEL.get(agent)
    tok = AGENT_TOKEN.get(agent)
    if ch and tok:
        ok = _curl_slack(ch, tok, text)
        if not ok:
            print(f"⚠️ 通知发送失败: {agent}", file=sys.stderr)
```

### Story 1.4: 实现 notify_stage_done (0.5h)

```python
def notify_stage_done(project: str, stage_id: str,
                      next_stage: str, next_agent: str, goal: str):
    """通知下一环节任务完成"""
    text = (
        f"*✅ 任务完成*\n"
        f"*项目*: `{project}` / `{stage_id}`\n"
        f"*🎯 轮到你了*: `{next_stage}`\n"
        f"*目标*: {goal}\n\n"
        f"请领取: `python3 task_manager.py claim {project} {next_stage}`"
    )
    ch = AGENT_CHANNEL.get(next_agent)
    tok = AGENT_TOKEN.get(next_agent)
    if ch and tok:
        ok = _curl_slack(ch, tok, text)
        if not ok:
            print(f"⚠️ 通知发送失败: {next_agent}", file=sys.stderr)
```

### Story 1.5: 实现 notify_stage_rejected (0.5h)

```python
def notify_stage_rejected(project: str, stage_id: str,
                          agent: str, reason: str):
    """通知任务被驳回"""
    text = (
        f"*⚠️ 任务被驳回*\n"
        f"*项目*: `{project}` / `{stage_id}`\n"
        f"*📋 原因*: {reason}\n\n"
        f"请重新处理后再次提交。"
    )
    ch = AGENT_CHANNEL.get(agent)
    tok = AGENT_TOKEN.get(agent)
    if ch and tok:
        ok = _curl_slack(ch, tok, text)
        if not ok:
            print(f"⚠️ 通知发送失败: {agent}", file=sys.stderr)
```

**DoD**:
- [x] `AGENT_CHANNEL` 和 `AGENT_TOKEN` 配置正确
- [x] `_curl_slack` 能发送消息到 Slack
- [x] 三个通知函数签名正确
- [x] curl 失败不阻塞主流程

---

## 3. Epic 2: 命令集成 — 4h

### Story 2.1: phase1 命令集成 (1h)

**修改**: `cmd_phase1()` 末尾（L358 附近）

```python
def cmd_phase1(args):
    # ... 现有逻辑 ...
    
    # 新增：通知首个执行者 (analyze-requirements)
    first_agent = stages[0]["agent"]
    first_stage = stages[0]["id"]
    goal = project_data.get("goal", "")
    notify_new_task(project, first_stage, first_agent, goal)
    
    print(f"✅ 项目 {project} 已创建")
```

### Story 2.2: phase2 命令集成 (1h)

**修改**: `cmd_phase2()` 末尾（L625 附近）

```python
def cmd_phase2(args):
    # ... 现有逻辑 ...
    
    # 新增：通知首个执行者 (dev)
    first_agent = stages[0]["agent"]
    first_stage = stages[0]["id"]
    goal = project_data.get("goal", "")
    notify_new_task(project, first_stage, first_agent, goal)
    
    print(f"✅ 项目 {project} 阶段二已创建")
```

### Story 2.3: update done 命令集成 (1h)

**修改**: `cmd_update()` 状态更新后（L1206 附近）

```python
def cmd_update(args):
    # ... 状态更新逻辑 ...
    
    if new_status == "done":
        # 查找下游
        downstream = get_downstream_agent(project, stage_id)
        if downstream:
            next_stage, next_agent = downstream
            goal = project_data.get("goal", "")
            notify_stage_done(project, stage_id, next_stage, next_agent, goal)
    
    elif new_status == "pending":
        # 查找当前 agent
        agent = stages[stage_id].get("agent", "")
        reason = " ".join(args.extra) if args.extra else "未说明"
        notify_stage_rejected(project, stage_id, agent, reason)
```

### Story 2.4: get_downstream_agent 实现 (1h)

```python
def get_downstream_agent(project: str, stage_id: str) -> Optional[Tuple[str, str]]:
    """从 DAG 依赖中查找下一环节 agent"""
    project_dir = os.path.join("projects", project)
    tasks_file = os.path.join(project_dir, "tasks.json")
    
    if not os.path.exists(tasks_file):
        return None
    
    with open(tasks_file) as f:
        tasks = json.load(f)
    
    # 反查依赖当前 stage 的下一个 stage
    for task_id, task in tasks.items():
        depends_on = task.get("dependsOn", [])
        if stage_id in depends_on:
            return (task_id, task.get("agent", ""))
    
    return None  # 无下游（项目完成）
```

**DoD**:
- [x] phase1 创建后通知 analyst
- [x] phase2 创建后通知 dev
- [x] update done 后通知下一环节
- [x] update pending 后通知原 agent
- [x] 无下游时不通知（正常结束）

---

## 4. Epic 3: 环境配置与文档 — 1h

### Story 3.1: 环境变量配置 (0.5h)

创建 `.env.example` 文件：

```bash
# Slack User Tokens (from Slack App)
SLACK_TOKEN_coord=xoxp-...
SLACK_TOKEN_analyst=xoxp-...
SLACK_TOKEN_pm=xoxp-...
SLACK_TOKEN_architect=xoxp-...
SLACK_TOKEN_reviewer=xoxp-...
SLACK_TOKEN_tester=xoxp-...
SLACK_TOKEN_dev=xoxp-...
```

### Story 3.2: 更新 TOOLS.md (0.5h)

在 `TOOLS.md` 中添加通知配置说明。

---

## 5. 总工时

| Epic | 任务 | 工时 |
|------|------|------|
| Epic 1 | 通知模块开发 | 2h |
| Epic 2 | 命令集成 | 4h |
| Epic 3 | 环境配置 | 1h |
| **合计** | | **7h** |

---

## 6. 文件清单

**修改文件**:
- `vibex/scripts/task_manager.py`

**新增文件**:
- `vibex/.env.example`

**验证**:
- 手动测试 phase1/phase2 创建通知
- 手动测试 update done/pending 通知
