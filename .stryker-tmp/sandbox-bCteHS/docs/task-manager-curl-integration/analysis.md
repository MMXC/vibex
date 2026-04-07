# Analysis: task_manager.py 内置 curl 催办通知

> **任务**: task-manager-curl-integration/analyze-requirements
> **分析日期**: 2026-03-30
> **分析师**: Analyst Agent
> **项目**: task-manager-curl-integration
> **工作目录**: /root/.openclaw/vibex

---

## 1. 执行摘要

`task_manager.py` 当前无任何通知机制。Agent 完成/失败/领取任务后，其他成员依赖心跳被动发现，无实时性。本次集成目标：在 `phase1`/`phase2`/`update`/`claim` 命令中嵌入 curl Slack 通知，实现任务流转的实时推送。

---

## 2. 现状分析

### 2.1 当前通知机制

**task_manager.py 现有命令**：

| 命令 | 功能 | 是否有通知 |
|------|------|-----------|
| `phase1` | 创建 analyst→pm→architect→coord 链路 | ❌ 无 |
| `phase2` | 创建 dev→tester→reviewer→coord 链路 | ❌ 无 |
| `update <s> <s> <status>` | 更新任务状态 | ❌ 无 |
| `claim <p> <s>` | 领取任务 | ❌ 无（仅打印任务详情） |
| `add` | 向已存在项目添加任务 | ❌ 无 |

**TOOLS.md userToken 映射**（已内置，coord 维护）：

| Agent | Channel ID | userToken |
|-------|-----------|-----------|
| coord | C0AP3CPJL8N | xoxp-... |
| analyst | C0ANZ3J40LT | xoxp-... |
| pm | C0APZP2JX2L | xoxp-... |
| architect | C0AP93CLPQU | xoxp-... |
| reviewer | C0AP937RXEY | xoxp-... |
| tester | C0APJCNTKPB | xoxp-... |
| dev | C0AP92ZGC68 | xoxp-... |

### 2.2 催办 vs 报告

- **报告**（→ bot token）：发送到频道，所有人可见
- **催办**（→ user token）：以成员身份发送，@mention 目标成员

---

## 3. 需求拆解

### 3.1 phase1 / phase2 执行后 → 通知首个执行者

**触发**：创建阶段一/阶段二任务链后
**通知目标**：analyze-requirements（phase1）或 dev（phase2）的 agent
**内容**：`📋 新任务 READY | {project} / {stage} — {goal}`

```bash
# 伪代码
def after_phase1_created(project, stages):
    first_stage = "analyze-requirements"
    agent = stages[first_stage]["agent"]
    channel = AGENT_CHANNEL[agent]
    curl_slack(channel, userToken[agent],
        f"📋 新任务 READY | {project}/{first_stage}\n"
        f"目标: {goal}\n"
        f"请领取: python3 task_manager.py claim {project} {first_stage}")
```

### 3.2 update done → 通知下一环节

**触发**：`update <p> <s> done`
**通知目标**：当前 stage 的下一个 stage（依赖方）
**逻辑**：从 DAG 的 dependsOn 推导下一步
**内容**：`✅ {stage} 完成 | 轮到你了：{next_stage}`

```bash
# 伪代码
def after_stage_done(project, stage_id):
    next_stage = get_downstream(project, stage_id)  # 从 dependsOn 反查
    if next_stage:
        agent = stages[next_stage]["agent"]
        channel = AGENT_CHANNEL[agent]
        curl_slack(channel, userToken[agent],
            f"✅ {project}/{stage_id} 已完成\n"
            f"🎯 轮到你了：{next_stage}\n"
            f"请领取: python3 task_manager.py claim {project} {next_stage}")
```

### 3.3 update pending \<reason\> → 驳回通知

**触发**：`update <p> <s> pending <reason>`
**通知目标**：该 stage 的原定 agent
**内容**：`⚠️ 驳回 | {project}/{stage}\n原因：{reason}`

```bash
# 伪代码
def after_stage_pending(project, stage_id, reason):
    agent = stages[stage_id]["agent"]
    channel = AGENT_CHANNEL[agent]
    curl_slack(channel, userToken[agent],
        f"⚠️ 任务被驳回 | {project}/{stage_id}\n"
        f"📋 原因: {reason}\n"
        f"请重新处理后再次提交")
```

### 3.4 claim → 通知其他成员（可选）

**触发**：`claim <p> <s>`
**通知目标**：无（claim 是主动领取，被动通知价值有限）
**建议**：不实现，仅保留任务详情打印

---

## 4. 方案设计

### 4.1 通知函数结构

在 `task_manager.py` 顶部新增通知模块：

```python
# ── Slack 通知 ────────────────────────────────────────────────────

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
    "coord":     "xoxp-10787320250594-...",
    "analyst":   "xoxp-10787320250594-...",
    "pm":        "xoxp-10787320250594-...",
    "architect": "xoxp-10787320250594-...",
    "reviewer":  "xoxp-10787320250594-...",
    "tester":    "xoxp-10787320250594-...",
    "dev":       "xoxp-10787320250594-...",
}

def _curl_slack(channel_id: str, user_token: str, text: str) -> bool:
    """发送 Slack 消息，返回是否成功"""
    import urllib.request, json
    payload = json.dumps({"channel": channel_id, "text": text, "mrkdwn": True}).encode()
    req = urllib.request.Request(
        SLACK_API,
        data=payload,
        headers={
            "Authorization": f"Bearer {user_token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read())
            return result.get("ok", False)
    except Exception:
        return False

def notify_new_task(project: str, stage_id: str, agent: str, goal: str):
    text = (
        f"*📋 新任务 READY*\n"
        f"*项目*: `{project}`\n"
        f"*任务*: `{stage_id}`\n"
        f"*目标*: {goal}"
    )
    ch = AGENT_CHANNEL.get(agent)
    tok = AGENT_TOKEN.get(agent)
    if ch and tok:
        _curl_slack(ch, tok, text)

def notify_stage_done(project: str, stage_id: str, next_stage: str, next_agent: str, goal: str):
    text = (
        f"*✅ 任务完成*\n"
        f"*项目*: `{project}` / `{stage_id}`\n"
        f"*🎯 轮到你了*: `{next_stage}`\n"
        f"*目标*: {goal}"
    )
    ch = AGENT_CHANNEL.get(next_agent)
    tok = AGENT_TOKEN.get(next_agent)
    if ch and tok:
        _curl_slack(ch, tok, text)

def notify_stage_rejected(project: str, stage_id: str, agent: str, reason: str):
    text = (
        f"*⚠️ 任务被驳回*\n"
        f"*项目*: `{project}` / `{stage_id}`\n"
        f"*📋 原因*: {reason}"
    )
    ch = AGENT_CHANNEL.get(agent)
    tok = AGENT_TOKEN.get(agent)
    if ch and tok:
        _curl_slack(ch, tok, text)
```

### 4.2 集成点

**cmd_phase1 / cmd_phase2 末尾**：
- 提取首个 stage 的 agent_id
- 调用 `notify_new_task()`

**cmd_update（done 分支）**：
- 加载完整 project data
- 查找当前 stage 的下游（`dependsOn` 反查）
- 调用 `notify_stage_done()`

**cmd_update（pending 分支）**：
- 提取 `<reason>` 追加参数
- 调用 `notify_stage_rejected()`

### 4.3 下游 agent 查找算法

```python
def get_downstream_agent(project_data: dict, done_stage_id: str) -> tuple[str, str] | None:
    """返回 (next_stage_id, next_agent_id) 或 None"""
    # 从所有 stage 的 dependsOn 中查找谁依赖了 done_stage_id
    for stage_id, stage in project_data["stages"].items():
        deps = stage.get("dependsOn", [])
        if done_stage_id in deps:
            return stage_id, stage.get("agent", "")
    return None
```

---

## 5. 验收标准

- [ ] `phase1` 执行后，analyst 频道收到 Slack 消息（含项目名 + 任务名 + goal）
- [ ] `phase2` 执行后，dev 频道收到 Slack 消息
- [ ] `update <p> <s> done` 后，下一环节 agent 频道收到 Slack 消息
- [ ] `update <p> <s> pending <reason>` 后，原 agent 频道收到驳回消息（含原因）
- [ ] curl 失败（如无网络）不阻塞命令执行，输出 `⚠️ 通知发送失败` 到 stderr
- [ ] 独立脚本测试验证通过后再替换旧脚本（coord 要求）
- [ ] `grep -n "_curl_slack\|notify_" task_manager.py` → 新增通知函数可见

---

## 6. 风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| userToken 过期/失效 | 低 | 中 | curl 失败不阻塞，warn only |
| phase1/phase2 链路过长时通知顺序 | 低 | 低 | 仅通知首个 stage |
| update done 找不到下游（异常流程） | 低 | 低 | 找不到下游时跳过通知 |
| Slack API 429 限速 | 中 | 低 | 添加 retry（1次）+ 10s timeout |

---

## 7. 工时估算

| 改动 | 工时 |
|------|------|
| 新增通知模块（顶部 +3 个通知函数） | 1h |
| cmd_phase1/cmd_phase2 集成 | 1h |
| cmd_update（done + pending）集成 | 2h |
| 下游 agent 查找算法 | 1h |
| 独立脚本测试验证 | 2h |
| **合计** | **7h** |
