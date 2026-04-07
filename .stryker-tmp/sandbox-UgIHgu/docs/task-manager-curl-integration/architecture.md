# ADR-XXX: task_manager.py 内置 curl 催办通知 — 架构设计

**状态**: Accepted
**日期**: 2026-03-30
**角色**: Architect
**项目**: task-manager-curl-integration

---

## Context

`task_manager.py` 当前无任何通知机制。Agent 完成/失败/领取任务后，其他成员依赖心跳被动发现，无实时性。本次集成目标：在 `phase1`/`phase2`/`update`/`claim` 命令中嵌入 curl Slack 通知，实现任务流转的实时推送。

---

## Decision

### Tech Stack

| 技术 | 用途 | 变更 |
|------|------|------|
| Python 3 | 脚本语言 | 无变更 |
| urllib.request | HTTP 请求 | 新增 `_curl_slack` 函数 |
| JSON | 数据格式 | 无变更 |
| Slack Web API | 消息通知 | 新增通知函数 |

### 架构图

```mermaid
graph TB
    subgraph "task_manager.py"
        Phase1["cmd_phase1()<br/>创建阶段一任务链"]
        Phase2["cmd_phase2()<br/>创建阶段二任务链"]
        Update["cmd_update()<br/>更新任务状态"]
        Claim["cmd_claim()<br/>领取任务"]
    end

    subgraph "通知模块 (新增)"
        Config["AGENT_CHANNEL<br/>AGENT_TOKEN"]
        CurlSlack["_curl_slack()"]
        NotifyNew["notify_new_task()"]
        NotifyDone["notify_stage_done()"]
        NotifyReject["notify_stage_rejected()"]
    end

    Phase1 -->|"创建后"| NotifyNew
    Phase2 -->|"创建后"| NotifyNew
    Update -->|"done"| NotifyDone
    Update -->|"pending"| NotifyReject

    Config --> CurlSlack
    NotifyNew --> CurlSlack
    NotifyDone --> CurlSlack
    NotifyReject --> CurlSlack

    CurlSlack -->|"Slack API"| Slack["Slack<br/>实时推送"]
```

### 通知流程

```mermaid
sequenceDiagram
    participant Agent as Agent (CLI)
    participant TM as task_manager.py
    participant Hook as Notification Hook
    participant Slack as Slack API
    participant Target as Target Agent

    Agent->>TM: python3 task_manager.py phase1 ...
    TM->>TM: 创建任务链 (JSON)
    TM->>Hook: notify_new_task(project, stage, agent, goal)
    Hook->>Slack: curl /chat.postMessage
    Slack-->>Target: 📋 新任务 READY
    TM-->>Agent: 任务创建成功
```

---

## 技术方案

### 1. 通知模块结构

```python
# ── Slack 通知配置 ────────────────────────────────────────────────

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
    # Token 由 coord 维护，敏感信息
    # 实际值存储在环境变量或单独配置文件中
    "coord":     os.getenv("SLACK_TOKEN_coord"),
    "analyst":   os.getenv("SLACK_TOKEN_analyst"),
    "pm":        os.getenv("SLACK_TOKEN_pm"),
    "architect": os.getenv("SLACK_TOKEN_architect"),
    "reviewer":  os.getenv("SLACK_TOKEN_reviewer"),
    "tester":    os.getenv("SLACK_TOKEN_tester"),
    "dev":       os.getenv("SLACK_TOKEN_dev"),
}
```

### 2. 核心通知函数

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

### 3. 命令集成点

| 命令 | 集成位置 | 通知类型 |
|------|----------|----------|
| `phase1` | cmd_phase1() 末尾 | notify_new_task |
| `phase2` | cmd_phase2() 末尾 | notify_new_task |
| `update done` | cmd_update() 状态更新后 | notify_stage_done |
| `update pending` | cmd_update() 驳回后 | notify_stage_rejected |

### 4. 下游查找算法

```python
def get_downstream_agent(project: str, stage_id: str) -> Optional[Tuple[str, str]]:
    """从 DAG 依赖中查找下一环节 agent"""
    with open(f"projects/{project}/tasks.json") as f:
        tasks = json.load(f)
    
    # 反查依赖当前 stage 的下一个 stage
    for task_id, task in tasks.items():
        depends_on = task.get("dependsOn", [])
        if stage_id in depends_on:
            return (task_id, task.get("agent", ""))
    
    return None  # 无下游（项目完成）
```

---

## API 定义

### 通知函数签名

```python
def _curl_slack(channel_id: str, user_token: str, text: str) -> bool
def notify_new_task(project: str, stage_id: str, agent: str, goal: str) -> None
def notify_stage_done(project: str, stage_id: str, next_stage: str, next_agent: str, goal: str) -> None
def notify_stage_rejected(project: str, stage_id: str, agent: str, reason: str) -> None
def get_downstream_agent(project: str, stage_id: str) -> Optional[Tuple[str, str]]
```

---

## 性能评估

| 指标 | 影响 | 说明 |
|------|------|------|
| 命令执行时间 | +100-300ms | Slack API 调用耗时 |
| 错误处理 | 不阻塞主流程 | curl 失败仅 warn，不抛异常 |
| Token 安全 | 需环境变量 | AGENT_TOKEN 不硬编码在源码中 |

---

## 测试策略

### 测试框架

- **pytest**: 单元测试（mock urllib.request）
- **手动验证**: 实际 Slack 频道测试

### 核心测试用例

```python
# test_notifications.py

from unittest.mock import patch, MagicMock

def test_curl_slack_success():
    with patch("urllib.request.urlopen") as mock_urlopen:
        mock_response = MagicMock()
        mock_response.read.return_value = b'{"ok": true}'
        mock_urlopen.return_value.__enter__.return_value = mock_response
        
        result = _curl_slack("C0AP93CLPQU", "xoxp-test", "test message")
        assert result == True

def test_curl_slack_failure():
    with patch("urllib.request.urlopen") as mock_urlopen:
        mock_urlopen.side_effect = Exception("Network error")
        
        result = _curl_slack("C0AP93CLPQU", "xoxp-test", "test message")
        assert result == False

def test_curl_slack_no_token():
    result = _curl_slack("C0AP93CLPQU", None, "test message")
    assert result == False
```

---

## 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| Token 泄露 | 高 | Token 存储在环境变量，不硬编码 |
| Slack API 限流 | 低 | 失败不阻塞，仅 warn |
| 网络超时 | 低 | 10s 超时，try-except 包裹 |
| 通知循环 | 低 | 仅通知下游，不通知自己 |

---

## 安全设计

### Token 管理

```python
# ❌ 禁止：Token 硬编码
AGENT_TOKEN = {
    "architect": "xoxp-10787320250594-...",
}

# ✅ 推荐：环境变量
AGENT_TOKEN = {
    "architect": os.getenv("SLACK_TOKEN_architect"),
}

# ✅ 备选：单独配置文件（0600 权限）
with open(".slack_tokens.json") as f:
    AGENT_TOKEN = json.load(f)
```

### 敏感信息日志

```python
# 禁止在日志中打印 Token
print(f"Token: {token}")  # ❌
print(f"Channel: {channel}")  # ✅
```

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: task-manager-curl-integration
- **执行日期**: 2026-03-30
