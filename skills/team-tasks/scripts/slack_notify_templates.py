#!/usr/bin/env python3
"""
Slack 催办 + 阶段任务报告 curl 模板
用法: python3 slack_notify_templates.py <action> [args...]

Actions:
  notify-ready   <agent> <project/task_id> <任务描述> [约束] [产出路径]
  notify-report  <agent> <project> <进度> [报告内容]
  notify-brief   <agent> <project/task_id>   # 超时简略催办（固定格式）
  coord-report   <project> <进度> <状态> [阻塞] [下一步]
  test           <agent>

Agents: analyst, architect, pm, dev, tester, reviewer, coord
"""

import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

# ============================================================
# E4-F1: 通知去重机制 — 5 分钟窗口去重
# ============================================================
# E4 规范：
# - 同一 task_id 在 5 分钟内不应重复发送通知
# - 去重状态存储：{task_id: timestamp}
# - 5 分钟后 entry 过期，可重新发送
# - done/ready 状态不参与去重（冷却期通知不占配额）
_NOTIFY_STATE_FILE = Path.home() / ".openclaw" / "task_notify_dedup.json"
_DEDUP_WINDOW_MS = 5 * 60 * 1000  # 5 分钟 = 300,000ms


def _load_notify_state() -> dict:
    """从磁盘加载通知状态。"""
    try:
        if _NOTIFY_STATE_FILE.exists():
            return json.loads(_NOTIFY_STATE_FILE.read_text())
    except Exception:
        pass
    return {}


def _save_notify_state(state: dict) -> None:
    """持久化通知状态到磁盘（清理过期 entry）。"""
    try:
        _NOTIFY_STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        now_ms = int(__import__('time').time() * 1000)
        # 清理过期 entry
        cleaned = {k: v for k, v in state.items() if now_ms - v < _DEDUP_WINDOW_MS}
        _NOTIFY_STATE_FILE.write_text(json.dumps(cleaned, indent=2, ensure_ascii=False))
    except Exception:
        pass


def _should_notify(task_id: str, status: str) -> tuple[bool, int]:
    """
    判断是否应该发送通知（E4-F1: 5 分钟时间窗口去重）。
    
    返回 (should_send, elapsed_ms_since_last)。
    - status 为 done/ready 时：always allowed，不参与去重
    - 5 分钟窗口内已发过通知：跳过
    - 5 分钟窗口外或无记录：允许发送
    """
    import time as _time_module
    now_ms = int(_time_module.time() * 1000)
    state = _load_notify_state()

    # done/ready 状态：永远允许，不参与去重
    if status in ("done", "ready"):
        last_ts = state.get(task_id, 0)
        elapsed = now_ms - last_ts if last_ts else 0
        return True, elapsed

    last_ts = state.get(task_id, 0)
    elapsed = now_ms - last_ts if last_ts else 0

    # 5 分钟窗口内
    if last_ts and elapsed < _DEDUP_WINDOW_MS:
        return False, elapsed

    return True, elapsed


def _record_notification(task_id: str, status: str) -> None:
    """记录通知发送时间戳（done/ready 不记录）。"""
    if status in ("done", "ready"):
        return

    state = _load_notify_state()
    import time as _time_module
    state[task_id] = int(_time_module.time() * 1000)
    _save_notify_state(state)


def _notify_with_dedup(task_id: str, status: str, send_fn) -> bool:
    """
    执行去重通知：检查 5 分钟窗口 → 发送 → 记录时间戳。
    send_fn: 无参数函数，执行实际发送
    返回是否真正发送了通知。
    """
    should_send, elapsed = _should_notify(task_id, status)
    if not should_send:
        elapsed_s = elapsed / 1000
        remaining_s = (_DEDUP_WINDOW_MS - elapsed) / 1000
        print(f"[dedup] {task_id}: 5 分钟窗口内跳过，剩余 {remaining_s:.0f}s")
        return False
    try:
        send_fn()
        _record_notification(task_id, status)
        print(f"[dedup] {task_id}: 通知已发送 (距上次 {elapsed/1000:.1f}s)")
        return True
    except Exception as e:
        print(f"[dedup] {task_id}: 发送失败 - {e}")
        return False

# ============================================================
# E4-F1: _should_send — 独立 message_key 去重（轻量版）
# ============================================================
_SEND_STATE_FILE = Path.home() / ".openclaw" / "slack_notify_last_send.json"
_SEND_WINDOW_SEC = 5 * 60  # 5 分钟 = 300 秒


def _should_send(message_key: str) -> dict:
    """
    判断是否应该发送（E4: 5 分钟窗口内相同 message_key 不重复）。

    返回 dict:
      - skipped (bool): True=跳过本次发送，False=允许发送
      - remaining_seconds (float): 距可再次发送的秒数（0 表示可发送）
    """
    import time as _time
    now = _time.time()
    state = _load_send_state()
    last = state.get(message_key, 0)
    elapsed = now - last

    if last > 0 and elapsed < _SEND_WINDOW_SEC:
        return {"skipped": True, "remaining_seconds": round(_SEND_WINDOW_SEC - elapsed, 2)}
    return {"skipped": False, "remaining_seconds": 0.0}


def _record_send(message_key: str) -> None:
    """记录 message_key 的发送时间戳。"""
    import time as _time
    state = _load_send_state()
    state[message_key] = _time.time()
    _save_send_state(state)


def _load_send_state() -> dict:
    """从磁盘加载发送状态。"""
    try:
        if _SEND_STATE_FILE.exists():
            return json.loads(_SEND_STATE_FILE.read_text())
    except Exception:
        pass
    return {}


def _save_send_state(state: dict) -> None:
    """持久化发送状态到磁盘（清理过期 entry）。"""
    try:
        _SEND_STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        import time as _time
        now = _time.time()
        # 清理过期 entry
        cleaned = {k: v for k, v in state.items() if now - v < _SEND_WINDOW_SEC}
        _SEND_STATE_FILE.write_text(json.dumps(cleaned, indent=2, ensure_ascii=False))
    except Exception:
        pass


# ============================================================
# Slack Accounts（从环境变量读取，勿硬编码）
# .env 文件位于脚本同目录下，请确保加载：source .env
# ============================================================
import os as _snt_os
_SLACK_ACCOUNTS_RAW = {
    "coord":     "SLACK_TOKEN_COORD",
    "analyst":   "SLACK_TOKEN_ANALYST",
    "architect": "SLACK_TOKEN_ARCHITECT",
    "pm":        "SLACK_TOKEN_PM",
    "dev":       "SLACK_TOKEN_DEV",
    "tester":    "SLACK_TOKEN_TESTER",
    "reviewer":  "SLACK_TOKEN_REVIEWER",
}
SLACK_ACCOUNTS = {k: _snt_os.environ.get(v, "") for k, v in _SLACK_ACCOUNTS_RAW.items()}

CHANNEL_IDS = {
    "coord":     "C0AP3CPJL8N",
    "analyst":   "C0ANZ3J40LT",
    "architect": "C0AP93CLPQU",
    "pm":        "C0APZP2JX2L",
    "dev":       "C0AP92ZGC68",
    "tester":    "C0APJCNTKPB",
    "reviewer":  "C0AP937RXEY",
}

def heartbeat_guide_for(agent: str, project_task: str = "") -> str:
    pt = project_task.replace("/", " ")  # 统一用空格分隔
    return f"""请参考 HEARTBEAT.md 处理阶段任务：
1. 读取 HEARTBEAT.md（情况处理索引）
2. 生成阶段任务报告
3. 读取报告并执行任务
   【重要】可主动用 `session_spawn` 开启子代理处理任务，子代理用完自动关闭，团队任何成员都能开启子代理，没有单点死磕问题
4. 执行完成后更新状态（三种）：
   - 正常完成: `task update {pt} done`
   - 失败/驳回: `task update {pt} rejected --failure-reason "<原因>"`
   - 阻塞: `task update {pt} blocked --blocked-reason "<原因>"`
5. 【强制】完成工作后必须立即更新状态，不更新=任务未完成
6. 更新完成结果并发报告到 Slack **自己频道**"""

def cli_warning_for(project_task: str = "") -> str:
    pt = project_task.replace("/", " ")  # 统一用空格分隔
    return f"""⚠️ *强制要求（禁止省略）*
必须用 CLI 更新状态，禁止手动编辑任务 JSON 文件中的 status 字段：

  # 正常完成:
  task update {pt} done

  # 失败/驳回（产出不达标）:
  task update {pt} rejected --failure-reason "<原因>"
  # （failed 也是 rejected 的别名，效果相同）

  # 阻塞（依赖异常，coord 处理）:
  task update {pt} blocked --blocked-reason "<原因>"

❌ 手动改 JSON → coord 无法感知进度 → 流程名存实亡"""

CHANNEL_MAP = {
    "coord": "coord", "analyst": "analyst", "architect": "architect",
    "pm": "pm", "dev": "dev", "tester": "tester", "reviewer": "reviewer"
}

# ============================================================
# curl 发送函数
# ============================================================
def slack_post(channel_id: str, token: str, text: str) -> bool:
    """发送 Slack 消息，返回 True=成功"""
    data = json.dumps({"channel": channel_id, "text": text}).encode()
    req = urllib.request.Request(
        "https://slack.com/api/chat.postMessage",
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read())
            if not result.get("ok"):
                print(f"Slack error: {result.get('error')}", file=sys.stderr)
            return result.get("ok", False)
    except Exception as e:
        print(f"Request failed: {e}", file=sys.stderr)
        return False


def send_slack(channel_id: str, token: str, message_key: str, text: str) -> dict:
    """
    发送 Slack 消息（带 E4 去重检查）。

    Args:
        channel_id: Slack 频道 ID
        token: Slack userToken
        message_key: 去重用唯一 key（相同 key 5 分钟内不重复发送）
        text: 消息内容

    Returns:
        {"ok": bool, "skipped": bool, "remaining_seconds": float, "error": str|None}
    """
    result = _should_send(message_key)
    if result["skipped"]:
        print(f"[send_slack] {message_key}: 5 分钟窗口内跳过，"
              f"剩余 {result['remaining_seconds']:.0f}s")
        return {
            "ok": False,
            "skipped": True,
            "remaining_seconds": result["remaining_seconds"],
            "error": None,
        }

    ok = slack_post(channel_id, token, text)
    if ok:
        _record_send(message_key)
        print(f"[send_slack] {message_key}: 发送成功")
        return {"ok": True, "skipped": False, "remaining_seconds": 0.0, "error": None}
    else:
        print(f"[send_slack] {message_key}: 发送失败")
        return {"ok": False, "skipped": False, "remaining_seconds": 0.0, "error": "slack_post failed"}


# ============================================================
# 模板生成
# ============================================================
def make_ready_message(agent: str, project_task: str, task_desc: str,
                       constraints: str = "", output_path: str = "") -> str:
    """生成任务 ready 催办消息

    格式：
    @<agent> 任务 ready: <project/task_id>
    请参考 HEARTBEAT.md 处理。

    任务：<task_desc>
    约束：<constraints>
    产出：<output_path>

    ⚠️ 强制要求（禁止省略）
    """
    lines = [
        f"@{agent} 任务 ready: {project_task}",
        f"{heartbeat_guide_for(agent, project_task)}",
        "",
        f"任务：{task_desc}",
    ]
    if constraints:
        lines.append(f"约束：{constraints}")
    if output_path:
        lines.append(f"产出：{output_path}")
    lines.append(cli_warning_for(project_task))
    return "\n".join(lines)


def make_phase_report(agent: str, project: str, progress: str,
                      report: str = "") -> str:
    """生成阶段任务报告消息"""
    lines = [
        f":clipboard: *{agent}* 阶段报告 | {project}",
        f"进度：{progress}",
    ]
    if report:
        lines.append("")
        lines.append(report)
    return "\n".join(lines)


def make_coord_report(project: str, progress: str, status: str,
                      blockers: str = "", next_steps: str = "") -> str:
    """coord 汇报（汇总各 agent 报告）"""
    lines = [
        f":bar_chart: *coord* 汇报 | {project}",
        f"整体进度：{progress}",
        f"状态：{status}",
    ]
    if blockers:
        lines.append(f"阻塞：{blockers}")
    if next_steps:
        lines.append(f"下一步：{next_steps}")
    return "\n".join(lines)


def make_rejected_message(agent: str, project_task: str, task_desc: str,
                         rejection_reason: str, constraints: str = "",
                         output_path: str = "") -> str:
    """生成任务被 rejected（打回）通知消息

    格式：
    标题: <project_task>（被驳回）
    原因: <rejection_reason>（下游失败原因）
    任务: <task_desc>（上游任务内容，让被通知人知道要修什么）
    约束: <constraints>
    产出: <output_path>

    ⚠️ 强制要求（禁止省略）
    """
    lines = [
        f"🔴 @{agent} 任务被驳回: {project_task}",
        "",
        f"*驳回原因（下游失败原因）*: {rejection_reason}",
        "",
        f"{heartbeat_guide_for(agent, project_task)}",
        "",
        f"📋 *上游任务内容（需修复的部分）*:",
        f"{task_desc}",
    ]
    if constraints:
        lines.append(f"约束：{constraints}")
    if output_path:
        lines.append(f"产出：{output_path}")
    lines.append(cli_warning_for(project_task))
    return "\n".join(lines)


def make_blocked_message(agent: str, project_task: str, task_desc: str,
                         blocked_reason: str, blocked_by: str = "",
                         constraints: str = "", output_path: str = "") -> str:
    """生成任务被 blocked（阻塞）通知消息，发给 coord

    格式：
    🚧 coord 需处理任务阻塞: <project/task_id>
    被阻塞原因: <blocked_reason>
    阻塞来源: <blocked_by>

    任务：<task_desc>
    约束：<constraints>
    产出：<output_path>
    """
    lines = [
        f"🚧 *coord 需处理*: 任务阻塞 | {project_task}",
        "",
        f"*阻塞原因*: {blocked_reason}",
    ]
    if blocked_by:
        lines.append(f"*阻塞来源*: {blocked_by}")
    lines.extend([
        "",
        f"任务：{task_desc}",
    ])
    if constraints:
        lines.append(f"约束：{constraints}")
    if output_path:
        lines.append(f"产出：{output_path}")
    lines.append("\n⚠️ 请检查依赖关系并处理阻塞，或调整任务 DAG。")
    return "\n".join(lines)


def make_brief_reminder(project_task: str) -> str:
    """生成超时简略催办消息（固定格式，不可增删）

    格式：处理<阶段任务名>，处理完成通过cli更新done/rejected/blocked，记得发阶段任务报告
    """
    return f"处理{project_task}，处理完成通过cli更新done/rejected/blocked，记得发阶段任务报告"


# ============================================================
# CLI 入口
# ============================================================
def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    action = sys.argv[1]

    if action == "coord-report":
        # python3 slack_notify_templates.py coord-report <project> <进度> <状态> [阻塞] [下一步]
        if len(sys.argv) < 5:
            print("Usage: coord-report <project> <progress> <status> [blockers] [next_steps]")
            sys.exit(1)
        agent = "coord"  # coord-report always goes to coord channel
        token = SLACK_ACCOUNTS[agent]
        channel_id = CHANNEL_IDS[agent]
        project = sys.argv[2]
        progress = sys.argv[3]
        status = sys.argv[4]
        blockers = sys.argv[5] if len(sys.argv) > 5 else ""
        next_steps = sys.argv[6] if len(sys.argv) > 6 else ""
        text = make_coord_report(project, progress, status, blockers, next_steps)

    elif action in ("notify-ready", "notify-report", "notify-rejected", "notify-blocked", "notify-brief", "test"):
        if len(sys.argv) < 3:
            print(__doc__)
            sys.exit(1)
        agent = sys.argv[2]
        if agent not in SLACK_ACCOUNTS:
            print(f"Unknown agent: {agent}. Choices: {list(SLACK_ACCOUNTS.keys())}")
            sys.exit(1)
        token = SLACK_ACCOUNTS[agent]
        channel_id = CHANNEL_IDS[agent]

        if action == "notify-ready":
            # python3 slack_notify_templates.py notify-ready <agent> <project/task_id> <任务描述> [约束] [产出]
            if len(sys.argv) < 5:
                print("Usage: notify-ready <agent> <project/task_id> <task_desc> [constraints] [output_path]")
                sys.exit(1)
            project_task = sys.argv[3]
            task_desc = sys.argv[4]
            constraints = sys.argv[5] if len(sys.argv) > 5 else ""
            output_path = sys.argv[6] if len(sys.argv) > 6 else ""
            text = make_ready_message(agent, project_task, task_desc, constraints, output_path)

        elif action == "notify-report":
            # python3 slack_notify_templates.py notify-report <agent> <project> <进度> [报告内容]
            if len(sys.argv) < 5:
                print("Usage: notify-report <agent> <project> <progress> [report]")
                sys.exit(1)
            project = sys.argv[3]
            progress = sys.argv[4]
            report = sys.argv[5] if len(sys.argv) > 5 else ""
            text = make_phase_report(agent, project, progress, report)

        elif action == "notify-rejected":
            # python3 slack_notify_templates.py notify-rejected <agent> <project/task_id> <任务描述> <拒绝原因> [约束] [产出]
            if len(sys.argv) < 6:
                print("Usage: notify-rejected <agent> <project/task_id> <task_desc> <reason> [constraints] [output_path]")
                sys.exit(1)
            project_task = sys.argv[3]
            task_desc = sys.argv[4]
            reason = sys.argv[5]
            constraints = sys.argv[6] if len(sys.argv) > 6 else ""
            output_path = sys.argv[7] if len(sys.argv) > 7 else ""
            text = make_rejected_message(agent, project_task, task_desc, reason, constraints, output_path)

        elif action == "notify-brief":
            # python3 slack_notify_templates.py notify-brief <agent> <project/task_id>
            # 超时简略催办，固定格式，不计入通知配额
            if len(sys.argv) < 4:
                print("Usage: notify-brief <agent> <project/task_id>")
                sys.exit(1)
            project_task = sys.argv[3]
            text = make_brief_reminder(project_task)
            # 简略催办不计入去重配额，直接发送
            slack_post(channel_id, token, text)
            print("ok")
            sys.exit(0)

        elif action == "notify-blocked":
            # python3 slack_notify_templates.py notify-blocked <project/task_id> <任务描述> <阻塞原因> [阻塞来源] [约束] [产出]
            if len(sys.argv) < 5:
                print("Usage: notify-blocked <project/task_id> <task_desc> <blocked_reason> [blocked_by] [constraints] [output_path]")
                sys.exit(1)
            project_task = sys.argv[3]
            task_desc = sys.argv[4]
            blocked_reason = sys.argv[5]
            blocked_by = sys.argv[6] if len(sys.argv) > 6 else ""
            constraints = sys.argv[7] if len(sys.argv) > 7 else ""
            output_path = sys.argv[8] if len(sys.argv) > 8 else ""
            # blocked 永远发到 coord 频道
            agent = "coord"
            token = SLACK_ACCOUNTS[agent]
            channel_id = CHANNEL_IDS[agent]
            text = make_blocked_message(agent, project_task, task_desc, blocked_reason, blocked_by, constraints, output_path)

        elif action == "test":
            text = f":white_check_mark: {agent} userToken 验证消息"

    else:
        print(f"Unknown action: {action}")
        print(__doc__)
        sys.exit(1)

    # Epic1: 通知去重 — 检查配额后再发送
    notify_status = {
        "notify-ready": "ready",
        "notify-rejected": "rejected",
        "notify-blocked": "blocked",
    }.get(action, "unknown")

    # 确定去重用的唯一 key
    if action in ("notify-ready", "notify-rejected", "notify-blocked") and 'project_task' in dir():
        dedup_key = project_task  # "project/stage_id" 格式
    elif action == "coord-report":
        dedup_key = f"coord-report:{project}"  # 按项目去重
    elif action == "notify-report":
        dedup_key = f"notify-report:{agent}:{project}"
    else:
        dedup_key = f"{agent}:{action}"

    def do_send():
        slack_post(channel_id, token, text)

    sent = _notify_with_dedup(dedup_key, notify_status, do_send)
    if not sent:
        # 去重跳过时不执行 slack_post，也不算失败
        sys.exit(0)

    print("ok" if sent else "failed")
    sys.exit(0 if sent else 1)


if __name__ == "__main__":
    main()
