#!/usr/bin/env python3
"""Team Tasks — shared JSON task manager for multi-agent pipelines.

★ 推荐工作流: phase1 → phase2
★ 所有任务必须在 DAG 模式下创建
★ 禁止使用 init 直接创建 DAG 项目

Commands:
  phase1    创建阶段一任务链（分析→PRD→架构→决策）★唯一入口★
  phase2    创建阶段二任务链（开发→测试→审查→推送）★唯一入口★
  add       向已存在的 DAG 项目添加任务
  status    显示项目状态
  update    更新任务状态
  claim     领取任务
  ready     获取可执行的任务
  list      列出所有项目
  archive   将已完成项目移动到 projects/completed/ 目录
"""

import argparse
import json
import os
import signal
import sys
from datetime import datetime, timezone

# Add scripts/ to path for current_report module
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if _SCRIPT_DIR not in sys.path:
    sys.path.insert(0, _SCRIPT_DIR)

try:
    from timeout import timeout, TimeoutError
except ImportError:
    # Graceful fallback if timeout.py not available
    def timeout(seconds):
        def decorator(func):
            return func
    class TimeoutError(Exception):
        pass

# Import log_analysis functions (graceful fallback if not available)
try:
    from log_analysis import append_to_memory, clean_cooldown
    HAS_LOG_ANALYSIS = True
except ImportError:
    HAS_LOG_ANALYSIS = False

# Import dedup functions (graceful fallback if not available)
_dedup_pkg = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "vibex", "scripts", "dedup")
if os.path.isdir(_dedup_pkg):
    import importlib.util
    import types
    try:
        # Step 1: stub dedup module (dedup_rules imports from dedup)
        _stub = types.ModuleType("dedup")
        _stub.extract_keywords = None
        _stub.ProjectInfo = None
        sys.modules["dedup"] = _stub

        # Step 2: load dedup_rules
        _rules_spec = importlib.util.spec_from_file_location(
            "dedup_rules", os.path.join(_dedup_pkg, "dedup_rules.py")
        )
        _rules_mod = importlib.util.module_from_spec(_rules_spec)
        sys.modules["dedup_rules"] = _rules_mod
        _rules_spec.loader.exec_module(_rules_mod)
        for _attr in dir(_rules_mod):
            if not _attr.startswith("_"):
                setattr(_stub, _attr, getattr(_rules_mod, _attr))

        # Step 3: load dedup (replaces stub)
        _dedup_spec = importlib.util.spec_from_file_location(
            "dedup", os.path.join(_dedup_pkg, "dedup.py")
        )
        _dedup_mod = importlib.util.module_from_spec(_dedup_spec)
        sys.modules["dedup"] = _dedup_mod
        _dedup_spec.loader.exec_module(_dedup_mod)
        DEDUP = _dedup_mod
        HAS_DEDUP = True
    except Exception as e:
        print(f"Warning: dedup import failed: {e}", file=sys.stderr)
        HAS_DEDUP = False
        DEDUP = None
else:
    HAS_DEDUP = False
    DEDUP = None
    append_to_memory = None
    clean_cooldown = None

TEAM_TASKS_DIR_DEFAULT = "/root/.openclaw/workspace-coord/team-tasks"
LEGACY_TASKS_DIR = "/root/.openclaw/workspace-coord/team-tasks"
TASKS_DIR = os.environ.get("TEAM_TASKS_DIR", TEAM_TASKS_DIR_DEFAULT)

# ── current-report 模块 ─────────────────────────────────────────────────────
import importlib.util
_current_report_pkg = os.path.join(os.path.dirname(os.path.abspath(__file__)), "current_report")
if os.path.isdir(_current_report_pkg):
    _cr_spec = importlib.util.spec_from_file_location("current_report", os.path.join(_current_report_pkg, "__init__.py"))
    _cr_mod = importlib.util.module_from_spec(_cr_spec)
    sys.modules["current_report"] = _cr_mod
    _cr_spec.loader.exec_module(_cr_mod)

    _ap_spec = importlib.util.spec_from_file_location("current_report._active_projects", os.path.join(_current_report_pkg, "_active_projects.py"))
    _ap_mod = importlib.util.module_from_spec(_ap_spec)
    sys.modules["current_report._active_projects"] = _ap_mod
    _ap_spec.loader.exec_module(_ap_mod)

    _fc_spec = importlib.util.spec_from_file_location("current_report._false_completion", os.path.join(_current_report_pkg, "_false_completion.py"))
    _fc_mod = importlib.util.module_from_spec(_fc_spec)
    sys.modules["current_report._false_completion"] = _fc_mod
    _fc_spec.loader.exec_module(_fc_mod)

    _si_spec = importlib.util.spec_from_file_location("current_report._server_info", os.path.join(_current_report_pkg, "_server_info.py"))
    _si_mod = importlib.util.module_from_spec(_si_spec)
    sys.modules["current_report._server_info"] = _si_mod
    _si_spec.loader.exec_module(_si_mod)

    _out_spec = importlib.util.spec_from_file_location("current_report._output", os.path.join(_current_report_pkg, "_output.py"))
    _out_mod = importlib.util.module_from_spec(_out_spec)
    sys.modules["current_report._output"] = _out_mod
    _out_spec.loader.exec_module(_out_mod)

    _rd_spec = importlib.util.spec_from_file_location("current_report._ready_decision", os.path.join(_current_report_pkg, "_ready_decision.py"))
    _rd_mod = importlib.util.module_from_spec(_rd_spec)
    sys.modules["current_report._ready_decision"] = _rd_mod
    _rd_spec.loader.exec_module(_rd_mod)

    HAS_CURRENT_REPORT = True
else:
    HAS_CURRENT_REPORT = False


# ── Slack 通知配置 ───────────────────────────────────────────────────────────
import urllib.request

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


def _curl_slack(channel_id: str, user_token: str, text: str) -> bool:
    """发送 Slack 消息，返回是否成功。curl 失败不阻塞主流程。"""
    if not user_token:
        return False
    payload = json.dumps({"channel": channel_id, "text": text, "mrkdwn": True}).encode()
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
        print(f"⚠️  Slack 通知失败: {e}", file=sys.stderr)
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
        _curl_slack(ch, tok, text)
    elif not tok:
        print(f"⚠️  未配置 SLACK_TOKEN_{agent}，跳过通知", file=sys.stderr)


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
        _curl_slack(ch, tok, text)
    elif not tok:
        print(f"⚠️  未配置 SLACK_TOKEN_{next_agent}，跳过通知", file=sys.stderr)


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
        _curl_slack(ch, tok, text)
    elif not tok:
        print(f"⚠️  未配置 SLACK_TOKEN_{agent}，跳过通知", file=sys.stderr)


def _get_downstream(project: str, stage_id: str) -> tuple[str, str] | None:
    """从 tasks.json DAG 中查找下游 stage 和 agent"""
    tasks_file = task_file(project)
    if not os.path.exists(tasks_file):
        return None
    with open(tasks_file) as f:
        tasks = json.load(f)
    stages = tasks.get("stages", {})
    for tid, stg in stages.items():
        depends = stg.get("dependsOn", [])
        if stage_id in depends:
            return (tid, stg.get("agent", ""))
    return None


def _input_with_timeout(prompt: str = "", timeout: int = 10) -> str:
    """带超时的 input() 包装，防止脚本挂起。

    Args:
        prompt: 提示文本
        timeout: 超时秒数，默认10秒，超时默认返回空字符串

    Returns:
        用户输入或空字符串（超时/非TTY）
    """
    def _timeout_handler(signum, frame):
        raise TimeoutError("input timed out")

    # 非 TTY 直接返回空（自动化场景）
    if not sys.stdin.isatty():
        return ""

    try:
        signal.signal(signal.SIGALRM, _timeout_handler)
        signal.alarm(timeout)
        try:
            result = input(prompt).strip()
        finally:
            signal.alarm(0)
        return result
    except TimeoutError:
        return ""
    except (EOFError, OSError):
        return ""
    except Exception:
        try:
            return input(prompt).strip()
        except Exception:
            return ""


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def task_file(project: str) -> str:
    # Check new projects/*/tasks.json layout in workspace-coord
    new_path = os.path.join(TEAM_TASKS_DIR_DEFAULT, "projects", project, "tasks.json")
    if os.path.exists(new_path):
        return new_path
    # Check legacy flat layout in workspace-coord
    legacy_path = os.path.join(TEAM_TASKS_DIR_DEFAULT, f"{project}.json")
    if os.path.exists(legacy_path):
        return legacy_path
    # Check legacy flat layout in legacy dir
    legacy_legacy = os.path.join(LEGACY_TASKS_DIR, f"{project}.json")
    if os.path.exists(legacy_legacy):
        return legacy_legacy
    # Default to workspace-coord flat path (will be created there)
    return legacy_path


def load_project(project: str) -> dict:
    path = task_file(project)
    if not os.path.exists(path):
        print(f"Error: project '{project}' not found at {path}", file=sys.stderr)
        sys.exit(1)
    with open(path) as f:
        return json.load(f)


# =============================================================================
# Epic 1: Concurrent-safe infrastructure (optimistic locking + atomic writes)
# =============================================================================

_REVISION_KEY = "_revision"


def atomic_write_json(path: str, data: dict) -> None:
    """Atomically write data to a JSON file using temp file + rename.

    Guarantees that on any exception, the original file is untouched.
    Uses os.rename for atomicity on POSIX systems.

    Args:
        path: Target JSON file path
        data: Python object serializable to JSON
    """
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp_fd, tmp_path = __import__("tempfile").mkstemp(
        prefix=".tmp_", suffix="_" + os.path.basename(path), dir=os.path.dirname(path)
    )
    try:
        with os.fdopen(tmp_fd, "w") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        os.rename(tmp_path, path)
    except Exception:
        # Clean up temp file on failure — original file untouched
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise


def load_project_with_rev(project: str) -> tuple[dict, int]:
    """Load a project and return its data along with the current revision number.

    Args:
        project: Project name

    Returns:
        Tuple of (data dict, revision int). Revision is 0 if not set.

    Raises:
        SystemExit if project file does not exist.
    """
    path = task_file(project)
    with open(path) as f:
        data = json.load(f)
    revision = data.get(_REVISION_KEY, 0)
    return data, int(revision)


def save_project_with_lock(project: str, data: dict, expected_rev: int, max_retries: int = 3) -> int:
    """Save a project with optimistic locking.

    Loads the current revision, verifies it matches expected_rev, then writes
    atomically with an incremented revision. Retries automatically on mismatch.

    Args:
        project: Project name
        data: Updated project data (must NOT include _revision — this function adds it)
        expected_rev: Expected current revision (from load_project_with_rev)
        max_retries: Max retry attempts on revision mismatch

    Returns:
        The new revision number after a successful save.

    Raises:
        RuntimeError: After max_retries failures due to concurrent modification.
        SystemExit: If project file does not exist.
    """
    path = task_file(project)

    for attempt in range(max_retries):
        # Always reload current revision first — verify before write
        try:
            _, current_rev = load_project_with_rev(project)
        except SystemExit:
            raise RuntimeError(f"save_project_with_lock: project '{project}' not found")

        if current_rev != expected_rev:
            # Concurrent modification detected — update expected_rev and retry
            expected_rev = current_rev
            continue

        # Safe to write: current_rev == expected_rev
        new_rev = current_rev + 1
        data_with_rev = dict(data)
        data_with_rev[_REVISION_KEY] = new_rev
        atomic_write_json(path, data_with_rev)
        return new_rev

    raise RuntimeError(
        f"save_project_with_lock: max retries ({max_retries}) exceeded for '{project}' "
        f"(expected_rev={expected_rev}) due to concurrent modifications"
    )


def save_project(project: str, data: dict):
    # Save to new layout if the project already exists there, otherwise use task_file()
    new_path = os.path.join(TEAM_TASKS_DIR_DEFAULT, "projects", project, "tasks.json")
    if os.path.exists(new_path):
        path = new_path
    else:
        path = task_file(project)
    # F1.1 + F1.4: atomic write + backward compatibility (add revision if missing)
    compat_data = dict(data)
    if _REVISION_KEY not in compat_data:
        compat_data[_REVISION_KEY] = 1
    atomic_write_json(path, compat_data)


def make_stage(agent_id: str, task: str = "", depends_on: list = None, 
               constraints: list = None, verification: dict = None, output: str = None,
               features: list = None, redlines: list = None, checklist: list = None) -> dict:
    stage = {
        "agent": agent_id,
        "status": "pending",
        "task": task,
        "startedAt": None,
        "completedAt": None,
        "output": output or "",
        "logs": [],
    }
    if depends_on is not None:
        stage["dependsOn"] = depends_on
    if constraints is not None:
        stage["constraints"] = constraints
    if verification is not None:
        stage["verification"] = verification
    if features is not None:
        stage["features"] = features
    if redlines is not None:
        stage["redlines"] = redlines
    if checklist is not None:
        stage["checklist"] = checklist
    return stage


def detect_cycles(data: dict) -> list:
    """Detect cycles in DAG using DFS."""
    WHITE, GRAY, BLACK = 0, 1, 2
    color = {tid: WHITE for tid in data["stages"]}
    path = []

    def dfs(node):
        color[node] = GRAY
        path.append(node)
        for dep in data["stages"].get(node, {}).get("dependsOn", []):
            if dep not in color:
                continue
            if color[dep] == GRAY:
                cycle_start = path.index(dep)
                return path[cycle_start:]
            if color[dep] == WHITE:
                result = dfs(dep)
                if result:
                    return result
        path.pop()
        color[node] = BLACK
        return []

    for tid in data["stages"]:
        if color[tid] == WHITE:
            result = dfs(tid)
            if result:
                return result
    return []


def compute_ready_tasks(data: dict) -> list:
    """Return task IDs whose dependencies are all done."""
    ready = []
    for task_id, task in data["stages"].items():
        if task["status"] != "pending":
            continue
        deps = task.get("dependsOn", [])
        all_deps_done = all(
            data["stages"].get(d, {}).get("status") in ("done", "skipped")
            for d in deps
        )
        if all_deps_done:
            ready.append(task_id)
    return ready


def check_dag_completion(data: dict):
    """Update project status based on DAG task states."""
    all_tasks = data["stages"]
    statuses = [t["status"] for t in all_tasks.values()]
    if all(s in ("done", "skipped") for s in statuses):
        data["status"] = "completed"
    elif any(s == "failed" for s in statuses):
        ready = compute_ready_tasks(data)
        if not ready and not any(s == "in-progress" for s in statuses):
            data["status"] = "blocked"


# ── cmd_phase1 ─────────────────────────────────────────────────────

def cmd_phase1(args):
    """★ 唯一入口：创建阶段一任务链（分析→PRD→架构→决策）
    
    强制流程: analyst → pm → architect → coord-decision
    禁止跳过任何步骤
    """
    project = args.project
    goal = args.goal
    docs_subdir = args.docs_subdir or project
    work_dir = args.work_dir or "/root/.openclaw/vibex"

    project_file = task_file(project)

    print("=" * 50)
    print("📋 创建阶段一任务链 ★唯一入口★")
    print("=" * 50)
    print(f"项目: {project}")
    print(f"目标: {goal}")
    print(f"文档目录: {docs_subdir}")
    print(f"工作目录: {work_dir}")
    print()

    # 检查项目是否存在
    if os.path.exists(project_file):
        print(f"⚠️  项目 {project} 已存在")
        print("   请删除旧项目或使用其他名称")
        sys.exit(1)

    # ★ 重复检测
    if HAS_DEDUP and DEDUP and not getattr(args, "no_check", False):
        dedup_result = DEDUP.check_duplicate_projects(project, goal)
        level = dedup_result.get("level", "pass")
        candidates = dedup_result.get("candidates", [])
        msg = dedup_result.get("message", "")

        if level == "block":
            print("🔍 重复检测:")
            print(f"   {msg}")
            print()
            if not getattr(args, "force", False):
                print("💡 使用 --force 强制创建（如确认不重复）")
                sys.exit(1)
            print("⚠️  已使用 --force 强制创建")
        elif level == "warn":
            print("🔍 重复检测:")
            print(f"   {msg}")
            print()
            if not getattr(args, "force", False) and not getattr(args, "yes", False):
                response = _input_with_timeout("是否继续创建？(y/n): ").lower()
                if response not in ("y", "yes"):
                    print("已取消创建")
                    sys.exit(0)

    # 创建 DAG 项目
    print("📦 创建项目 (DAG 模式)...")
    data = {
        "project": project,
        "goal": goal,
        "created": now_iso(),
        "updated": now_iso(),
        "status": "active",
        "mode": "dag",
        "workspace": work_dir,
        "stages": {},
    }
    save_project(project, data)
    print("✅ 项目创建成功")
    print()

    # 添加 analyze-requirements (analyst)
    print("📝 添加 analyze-requirements (analyst)...")
    data["stages"]["analyze-requirements"] = make_stage(
        agent_id="analyst",
        task=f"""需求分析：{goal}

## 📁 工作目录
- 项目路径: {work_dir}
- 所有文档在 {work_dir}/docs/{docs_subdir}/ 下

## 你的任务
1. 与用户对话，澄清业务目标、目标用户和核心价值。
2. 识别核心 Jobs-To-Be-Done (JTBD)，通常 3-5 个。
3. 输出 analysis.md，包含：
   - 业务场景分析
   - 技术方案选项（至少 2 个）
   - 可行性评估
   - 初步风险识别
   - 验收标准

## 产出物
- 文档: docs/{docs_subdir}/analysis.md
- 验收标准: 具体可测试的条目

## 驳回红线
- 需求模糊无法实现 → 驳回重新分析
- 缺少验收标准 → 驳回补充
""",
        depends_on=[],
        constraints=["强制使用 gstack 技能（/browse /qa /qa-only /canary）验证问题真实性与修复效果",
            
            "产出分析文档",
            "识别技术风险",
            "验收标准具体可测试",
            "每个需求有实现方案",
            f"工作目录: {work_dir}"
        ],
        verification={"command": f"test -f {work_dir}/docs/{docs_subdir}/analysis.md"},
        output=f"{work_dir}/docs/{docs_subdir}/analysis.md"
    )
    save_project(project, data)
    print("✅ analyze-requirements 添加成功")
    print()

    # 添加 create-prd (pm) - 依赖 analyze-requirements
    print("📝 添加 create-prd (pm) - 依赖 analyze-requirements...")
    data["stages"]["create-prd"] = make_stage(
        agent_id="pm",
        task=f"""PRD 细化：Epic/Story 拆分、验收标准、优先级矩阵

## 📁 工作目录
- 项目路径: {work_dir}
- PRD 位置: docs/{docs_subdir}/prd.md
- Specs 目录: docs/{docs_subdir}/specs/

## 你的任务
1. 基于 analysis.md 创建 PRD
2. 定义功能点和验收标准（每个可写 expect() 断言）
3. 创建 specs/ 目录存放详细规格
4. 每个功能点必须有 DoD (Definition of Done)

## 功能点格式
| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | xxx | xxx | expect(...) | 【需页面集成】 |

## 驳回红线
- 功能点模糊，无法写 expect() → 驳回重回阶段一
- 验收标准缺失 → 驳回补充
- 涉及页面但未标注【需页面集成】→ 驳回补充
""",
        depends_on=["analyze-requirements"],
        constraints=["强制使用 gstack 技能（/browse /qa /qa-only /canary）验证问题真实性与修复效果",
            
            "每个功能有验收标准",
            "粒度细化到可写 expect() 断言",
            "DoD 明确",
            "功能ID格式正确",
            "页面集成标注",
            f"工作目录: {work_dir}"
        ],
        verification={
            "command": f"test -f {work_dir}/docs/{docs_subdir}/prd.md && test -d {work_dir}/docs/{docs_subdir}/specs"
        },
        output=f"{work_dir}/docs/{docs_subdir}/prd.md"
    )
    save_project(project, data)
    print("✅ create-prd 添加成功")
    print()

    # 添加 design-architecture (architect) - 依赖 create-prd
    print("📝 添加 design-architecture (architect)...")
    data["stages"]["design-architecture"] = make_stage(
        agent_id="architect",
        task=f"""系统架构设计

## 📁 工作目录
- 项目路径: {work_dir}
- 架构文档: docs/{docs_subdir}/architecture.md
- 实施计划: docs/{docs_subdir}/IMPLEMENTATION_PLAN.md
- 开发约束: docs/{docs_subdir}/AGENTS.md

## 你的任务
1. 基于 PRD 设计系统架构
2. 输出 IMPLEMENTATION_PLAN.md（实施计划）
3. 输出 AGENTS.md（开发约束）
4. 接口文档完整
5. 评估性能影响

## 产出物
- 架构文档: docs/{docs_subdir}/architecture.md
- 实施计划: docs/{docs_subdir}/IMPLEMENTATION_PLAN.md
- 开发约束: docs/{docs_subdir}/AGENTS.md

## 驳回红线
- 架构设计不可行 → 驳回重新设计
- 接口定义不完整 → 驳回补充
- 缺少 IMPLEMENTATION_PLAN.md 或 AGENTS.md → 驳回补充
""",
        depends_on=["create-prd"],
        constraints=["强制使用 gstack 技能（/browse /qa /qa-only /canary）验证问题真实性与修复效果",
            
            "兼容现有架构",
            "接口文档完整",
            "评估性能影响",
            "技术方案可执行",
            "生成 IMPLEMENTATION_PLAN.md",
            "生成 AGENTS.md",
            f"工作目录: {work_dir}"
        ],
        verification={
            "command": f"test -f {work_dir}/docs/{docs_subdir}/architecture.md && test -f {work_dir}/docs/{docs_subdir}/IMPLEMENTATION_PLAN.md && test -f {work_dir}/docs/{docs_subdir}/AGENTS.md"
        },
        output=f"{work_dir}/docs/{docs_subdir}/architecture.md"
    )
    save_project(project, data)
    print("✅ design-architecture 添加成功")
    print()

    # 添加 coord-decision (coord) - 依赖 design-architecture
    print("📝 添加 coord-decision (coord)...")
    data["stages"]["coord-decision"] = make_stage(
        agent_id="coord",
        task=f"""决策：读取产物，决定是否开启阶段二开发

## 📁 工作目录
- 项目路径: {work_dir}

## 你的任务
1. 审阅所有产物文档
2. 做出决策：通过或驳回
3. 如通过，调用 phase2 创建开发任务链

## 强制要求
1. 读取并理解所有产物
2. 如需开发，追加 dev → tester → reviewer → reviewer-push 任务链
3. 任务包含检查清单要求
4. 二阶段必须两次审查

## 驳回红线
- 需求不清晰 → 驳回重做
- 架构不可行 → 驳回重做
- 计划不完整 → 驳回重做
""",
        depends_on=["design-architecture"],
        constraints=[
            "读取并理解产物",
            "如需开发则追加任务",
            "任务包含检查清单要求",
            "决策后标记完成",
            "二阶段必须两次审查",
            f"工作目录: {work_dir}"
        ],
        verification={"command": "echo decision-done"},
        output=""
    )
    save_project(project, data)
    print("✅ coord-decision 添加成功")
    print()

    print("=" * 50)
    print("✅ 阶段一任务链创建完毕")
    print("=" * 50)
    print(f"👉 项目工作目录: {work_dir}")
    print(f"📄 核心交付物：")
    print(f"   - 分析文档: {work_dir}/docs/{docs_subdir}/analysis.md")
    print(f"   - PRD 文档: {work_dir}/docs/{docs_subdir}/prd.md")
    print(f"   - 架构文档: {work_dir}/docs/{docs_subdir}/architecture.md")
    print(f"   - Specs 目录: {work_dir}/docs/{docs_subdir}/specs/")
    print(f"   - 实施计划: {work_dir}/docs/{docs_subdir}/IMPLEMENTATION_PLAN.md")
    print(f"   - 验收脚本: {work_dir}/docs/{docs_subdir}/AGENTS.md")
    print()
    print("🎯 下一步调用示例：")
    print(f"   ./task_manager.py phase2 {project} --epics \"Epic1,Epic2\" --docs-subdir {docs_subdir} --work-dir {work_dir}")

    # Epic 2.1: 通知首个执行者 (analyze-requirements → analyst)
    notify_new_task(project, "analyze-requirements", "analyst", goal)


# ── cmd_phase2 ─────────────────────────────────────────────────────

def cmd_phase2(args):
    """★ 唯一入口：创建阶段二任务链（开发→测试→审查→推送）
    
    强制流程: dev → tester → reviewer → reviewer-push → coord-completed
    禁止跳过任何步骤
    必须先完成阶段一
    """
    project = args.project
    epics = [e.strip() for e in args.epics.split(",") if e.strip()]
    docs_subdir = args.docs_subdir or project
    work_dir = args.work_dir or "/root/.openclaw/vibex"

    project_file = task_file(project)

    print("=" * 50)
    print("📋 创建阶段二任务链 ★唯一入口★")
    print("=" * 50)
    print(f"项目: {project}")
    print(f"Epic 数量: {len(epics)}")
    print(f"文档目录: {docs_subdir}")
    print(f"工作目录: {work_dir}")
    print()

    # 检查项目是否存在
    if not os.path.exists(project_file):
        print(f"❌ 项目 {project} 不存在，请先创建阶段一")
        sys.exit(1)

    # ★ 重复检测（针对 Epic 名称）
    if HAS_DEDUP and DEDUP and not getattr(args, "no_check", False):
        epic_names = ", ".join(epics)
        dedup_result = DEDUP.check_duplicate_projects(project, epic_names)
        level = dedup_result.get("level", "pass")
        candidates = dedup_result.get("candidates", [])
        msg = dedup_result.get("message", "")
        if level == "block":
            print("🔍 重复检测:")
            print(f"   {msg}")
            if not getattr(args, "force", False):
                print("💡 使用 --force 强制继续")
                sys.exit(1)
        elif level == "warn":
            print("🔍 重复检测:")
            print(f"   {msg}")
            if not getattr(args, "force", False) and not getattr(args, "yes", False):
                response = _input_with_timeout("是否继续？(y/n): ").lower()
                if response not in ("y", "yes"):
                    sys.exit(0)

    # 加载项目检查阶段一是否完成
    data = load_project(project)

    coord_decision = data["stages"].get("coord-decision", {})
    if coord_decision.get("status") != "done":
        print("❌ 阶段一未完成（coord-decision 未 done）")
        print("   请先完成阶段一：analyze → pm → architect → coord-decision")
        sys.exit(1)

    print("✅ 阶段一已完成，开始创建阶段二任务链...")
    print()

    # 定义关键路径
    docs_dir = f"{work_dir}/docs/{docs_subdir}"
    impl_plan = f"{docs_dir}/IMPLEMENTATION_PLAN.md"
    agents_file = f"{docs_dir}/AGENTS.md"

    # 解析 Epic 依赖关系（如：Epic2:Epic1,Epic3:Epic1）
    epic_deps = {}  # {epic_name: [dep_epic_names]}
    if args.epic_deps:
        for dep_str in args.epic_deps.split(","):
            if ":" in dep_str:
                epic, dep_epic = dep_str.split(":", 1)
                epic_deps.setdefault(epic.strip(), []).append(dep_epic.strip())

    # 构建 Epic ID 映射
    epic_id_map = {epic.lower().replace(" ", "-").replace("_", "-"): epic for epic in epics}

    # 为每个 Epic 创建任务链（串行调度：后继 epic 依赖前一个 epic 的 reviewer-push）
    prev_epic_id = None
    for epic in epics:
        epic_id = epic.lower().replace(" ", "-").replace("_", "-")

        # 计算 dev 依赖：
        # 1. 第一个 epic: 只依赖 coord-decision
        # 2. 后继 epic: 依赖 coord-decision + 前一个 epic 的 reviewer-push（串行）
        dev_deps = ["coord-decision"]
        if prev_epic_id:
            dev_deps.append(f"reviewer-push-{prev_epic_id}")
        if epic in epic_deps:
            for dep_epic in epic_deps[epic]:
                dep_epic_id = dep_epic.lower().replace(" ", "-").replace("_", "-")
                dev_deps.append(f"reviewer-push-{dep_epic_id}")

        print(f"📦 Epic: {epic} (依赖: {dev_deps[1:] if len(dev_deps) > 1 else '无'})")

        # dev
        print(f"  📝 添加 dev-{epic_id}...")
        data["stages"][f"dev-{epic_id}"] = make_stage(
            agent_id="dev",
            task=f"""开发 Epic: {epic}

## 📁 工作目录
- 项目路径: {work_dir}
- 实施计划: {impl_plan}
- 验收脚本: {agents_file}

## 🛠️ 强制要求：使用 gstack 技能
- 必须使用 `gstack browse`（`/browse`）完成代码修改后的功能验证
- 禁止仅靠"感觉对"来判断功能正确性，必须实际打开页面操作验证
- 审查前先用 `gstack screenshot` 截图确认 UI 状态
- 每次 commit 前：执行 `gstack screenshot` + 断言关键元素可见

## 你的任务
1. 读取 IMPLEMENTATION_PLAN.md，找到 Epic {epic} 对应的所有未完成任务
2. 读取 AGENTS.md，了解运行和测试命令
3. 完成代码实现
4. 提交代码：commit message 需关联 Epic 和功能点 ID

## 驳回红线
- 无 git commit → 驳回重做
- 测试失败 → 驳回重做
- 未更新 IMPLEMENTATION_PLAN.md → 驳回补充
""",
            depends_on=dev_deps,
            constraints=[
                f"工作目录: {work_dir}",
                "必须提交代码",
                "测试通过",
                "更新 IMPLEMENTATION_PLAN.md"
            ],
            verification={"command": f"git -C {work_dir} log --oneline -1"},
            output=work_dir
        )
        save_project(project, data)
        print(f"  ✅ dev-{epic_id} 添加成功")

        # tester
        print(f"  📝 添加 tester-{epic_id}...")
        data["stages"][f"tester-{epic_id}"] = make_stage(
            agent_id="tester",
            task=f"""测试 Epic: {epic}

## 📁 工作目录
- 项目路径: {work_dir}
- 验收脚本: {agents_file}

## 🛠️ 强制要求：使用 gstack 技能
- 必须使用 `gstack browse`（`/browse`）执行端到端功能验证
- 禁止仅靠单元测试通过就判定功能正确，必须实际在浏览器中验证交互流程
- 每个关键功能点至少执行一次完整用户操作路径
- 验收前截图保存证据

## 你的任务
1. 读取 AGENTS.md，执行测试命令
2. 对照 IMPLEMENTATION_PLAN.md 确认测试覆盖
3. 运行测试：确保 100% 通过率

## 驳回红线
- dev 无 commit → 标记 failed
- 测试失败 → 驳回 dev
- 缺少关键测试用例 → 驳回 dev
""",
            depends_on=[f"dev-{epic_id}"],
            constraints=[
                f"工作目录: {work_dir}",
                "测试100%通过",
                "覆盖所有功能点",
                "必须验证上游产出物"
            ],
            verification={"command": f"cd {work_dir} && npm test 2>&1 | tail -5"},
            output="npm test 验证通过"
        )
        save_project(project, data)
        print(f"  ✅ tester-{epic_id} 添加成功")

        # reviewer (第一次审查：功能审查)
        print(f"  📝 添加 reviewer-{epic_id}...")
        data["stages"][f"reviewer-{epic_id}"] = make_stage(
            agent_id="reviewer",
            task=f"""审查 Epic: {epic}（第一步：功能审查）

## 📁 工作目录
- 项目路径: {work_dir}

## 🛠️ 强制要求：使用 gstack 技能
- 必须使用 `gstack browse`（`/browse`）验证代码改动后的实际效果
- 禁止仅靠代码审查判断功能正确性，必须实际在浏览器中打开页面验证
- 每次审查前截图记录当前 UI 状态，作为审查依据

## 你的任务
1. 代码质量审查
2. 安全漏洞扫描
3. 更新 CHANGELOG.md
4. 提交功能 commit

## 驳回红线（第一次审查）
- 无功能 commit → 驳回 dev
- 无 changelog 更新 → 驳回 dev
- 测试未通过 → 驳回 dev
""",
            depends_on=[f"tester-{epic_id}"],
            constraints=[
                f"工作目录: {work_dir}",
                "功能与PRD一致",
                "代码质量达标",
                "changelog 已更新"
            ],
            verification={"command": f"git -C {work_dir} log --oneline -1"},
            output=f"{work_dir}/CHANGELOG.md"
        )
        save_project(project, data)
        print(f"  ✅ reviewer-{epic_id} 添加成功")

        # reviewer-push (第二次审查：推送验证)
        print(f"  📝 添加 reviewer-push-{epic_id}...")
        data["stages"][f"reviewer-push-{epic_id}"] = make_stage(
            agent_id="reviewer",
            task=f"""审查 Epic: {epic}（第二步：推送验证）

## 📁 工作目录
- 项目路径: {work_dir}

## 🛠️ 强制要求：使用 gstack 技能
- 必须使用 `gstack browse`（`/browse`）验证推送后的生产环境效果
- 确认远程部署后的页面实际运行状态，禁止仅靠 git log 判断
- 截图记录最终验证结果

## 你的任务
1. 验证远程 commit 存在
2. 确保本地无未提交修改
3. 推送代码

## 驳回红线（第二次审查）
- 本地有未提交修改 → 驳回 dev
- 推送失败 → 重试或驳回 dev
""",
            depends_on=[f"reviewer-{epic_id}"],
            constraints=[
                f"工作目录: {work_dir}",
                "远程 commit 验证通过",
                "本地无未提交修改",
                "推送成功"
            ],
            verification={"command": f"git -C {work_dir} fetch && git -C {work_dir} log origin/main -1"},
            output="git push 验证"
        )
        save_project(project, data)
        print(f"  ✅ reviewer-push-{epic_id} 添加成功")

        # 串行调度：记录当前 epic ID，供下一个 epic 的 dev 依赖使用
        prev_epic_id = epic_id

        print()

    # 统一 coord-completed 收口（依赖所有 epic 的 reviewer-push）
    reviewer_push_deps = [f"reviewer-push-{epic.lower().replace(' ', '-').replace('_', '-')}" for epic in epics]
    print(f"  📝 添加 coord-completed（统一收口）...")
    data["stages"]["coord-completed"] = make_stage(
        agent_id="coord",
        task=f"""项目完成确认（{len(epics)} 个 Epic 收口）

## 📁 工作目录
- 项目路径: {work_dir}

## 🛠️ 强制要求：使用 gstack 技能
- 必须使用 `gstack browse`（`/browse`）验证最终产出物
- 确认所有 Epic 功能在浏览器中实际可用，禁止仅靠 git/npm 命令判断
- 截图保存最终验收结果，作为项目完成报告的附件

## 🔴 虚假完成检查（必须执行）
对于每个 Epic，必须验证以下产出物真实存在：
| Epic | Dev Commit | Tester 测试通过 | Reviewer changelog | Reviewer-Push 远程验证 |
|------|------------|-----------------|-------------------|----------------------|
{chr(10).join([f"| {epic} | `git log --oneline` | `npm test` | `CHANGELOG.md` 更新 | `git fetch && git log origin/main` |" for epic in epics])}

**检查命令**:
```bash
# 1. 验证 dev commit 存在
git -C {work_dir} log --oneline -5

# 2. 验证 tester 测试通过
cd {work_dir} && npm test

# 3. 验证 changelog 已更新
grep -cF "## [" {work_dir}/CHANGELOG.md

# 4. 验证远程 commit 存在
git -C {work_dir} fetch && git -C {work_dir} log origin/main -1
```

## ✅ 通过标准
- [ ] 所有 Epic 的 dev commit 存在
- [ ] 所有 Epic 的测试通过（npm test）
- [ ] CHANGELOG.md 已更新
- [ ] 远程 origin/main 有对应 commit

## 📝 你的任务
1. 执行上述虚假完成检查
2. 验证所有产出物真实存在
3. 标记项目状态为 completed
4. 生成项目完成报告
""",
        depends_on=reviewer_push_deps,
        constraints=[
            f"工作目录: {work_dir}",
            "所有 Epic 的 dev commit 存在",
            "所有 Epic 的测试通过",
            "changelog 已更新",
            "远程 commit 验证通过",
            "项目状态已标记 completed"
        ],
        verification={"command": f"bash /root/.openclaw/skills/team-tasks/scripts/verify-fake-completion.sh {project}"},
        output="项目完成报告"
    )
    save_project(project, data)
    print(f"  ✅ coord-completed 添加成功")

    print("=" * 50)
    print(f"✅ 阶段二任务链创建完毕（共 {len(epics)} 个 Epic）")
    print("=" * 50)
    print(f"📄 任务链结构：")
    for epic in epics:
        epic_id = epic.lower().replace(" ", "-").replace("_", "-")
        deps_info = ""
        if epic in epic_deps:
            deps = epic_deps[epic]
            deps_info = f" (等待: {', '.join(deps)})"
        print(f"   coord-decision → dev-{epic_id}{deps_info} → tester-{epic_id} → reviewer-{epic_id} → reviewer-push-{epic_id}")
    print(f"   → coord-completed（统一收口）")

    # Epic 2.2: 通知首个 dev Epic
    first_epic = epics[0]
    first_epic_id = first_epic.lower().replace(" ", "-").replace("_", "-")
    first_dev_stage = f"dev-{first_epic_id}"
    # Load fresh data to get goal
    data = load_project(project)
    goal = data.get("goal", "")
    notify_new_task(project, first_dev_stage, "dev", goal)


# ── cmd_add ────────────────────────────────────────────────────────

def cmd_add(args):
    """向已存在的 DAG 项目添加任务"""
    data = load_project(args.project)

    if data.get("mode") != "dag":
        print("Error: 'add' is only for DAG mode projects.", file=sys.stderr)
        sys.exit(1)

    task_id = args.task_id
    if task_id in data["stages"]:
        print(f"Error: task '{task_id}' already exists", file=sys.stderr)
        sys.exit(1)

    agent = args.agent or task_id
    depends_on = args.depends.split(",") if args.depends else []
    task_desc = args.desc or ""

    # 验证依赖存在
    for dep in depends_on:
        if dep not in data["stages"]:
            print(f"Error: dependency '{dep}' not found. Add it first.", file=sys.stderr)
            sys.exit(1)

    # 解析 constraints
    constraints = None
    if args.constraints:
        try:
            constraints = json.loads(args.constraints)
        except json.JSONDecodeError:
            constraints = [c.strip() for c in args.constraints.split(",")]

    # 解析 verification
    verification = None
    if args.verification:
        try:
            verification = json.loads(args.verification)
        except json.JSONDecodeError:
            print(f"Error: --verification must be valid JSON", file=sys.stderr)
            sys.exit(1)

    # 添加任务
    data["stages"][task_id] = make_stage(
        agent_id=agent,
        task=task_desc,
        depends_on=depends_on,
        constraints=constraints,
        verification=verification,
        output=args.output or ""
    )

    # 检查循环依赖
    cycles = detect_cycles(data)
    if cycles:
        del data["stages"][task_id]
        print(f"Error: adding '{task_id}' creates a cycle: {' → '.join(cycles + [cycles[0]])}", file=sys.stderr)
        sys.exit(1)

    data["updated"] = now_iso()
    save_project(args.project, data)

    dep_str = f" (depends on: {', '.join(depends_on)})" if depends_on else " (no dependencies)"
    print(f"✅ Added task '{task_id}' → agent: {agent}{dep_str}")


# ── cmd_status ─────────────────────────────────────────────────────

def cmd_status(args):
    """显示项目状态"""
    data = load_project(args.project)

    if args.json:
        print(json.dumps(data, indent=2, ensure_ascii=False))
        return

    mode = data.get("mode", "linear")
    print(f"📋 Project: {data.get('project') or data.get('name', args.project)}")
    if data.get("goal"):
        print(f"🎯 Goal: {data['goal']}")
    print(f"📊 Status: {data['status']}  |  Mode: {mode}")
    if data.get("workspace"):
        print(f"🗂️  Workspace: {data['workspace']}")
    print()

    status_icons = {
        "pending": "⬜",
        "in-progress": "🔄",
        "done": "✅",
        "failed": "❌",
        "skipped": "⏭️",
    }

    if mode == "dag":
        ready = compute_ready_tasks(data)

        def display_task(tid, indent=0):
            task = data["stages"].get(tid, {})
            icon = status_icons.get(task.get("status", "pending"), "❓")
            ready_mark = " 🟢 READY" if tid in ready else ""
            deps = task.get("dependsOn", [])
            dep_str = f" ← [{', '.join(deps)}]" if deps else ""
            prefix = "  " * indent
            print(f"{prefix}  {icon} {tid} ({task.get('agent', '?')}): {task.get('status', 'pending')}{ready_mark}{dep_str}")
            raw_task = task.get("task", "")
            # 去掉 task 中的工作目录章节，避免重复展示
            clean_task = raw_task.split("## 📁 工作目录")[0].strip()
            task_preview = clean_task[:60]
            if task_preview:
                print(f"{prefix}     Task: {task_preview}{'...' if len(clean_task) > 60 else ''}")
            if task.get("constraints"):
                visible = [c for c in task["constraints"] if not c.startswith("工作目录:")]
                if visible:
                    print(f"{prefix}     🔴 Constraints: {visible}")
            if task.get("output"):
                out_preview = task["output"][:80]
                print(f"{prefix}     Output: {out_preview}{'...' if len(task['output']) > 80 else ''}")

        roots = [tid for tid, t in data["stages"].items() if not t.get("dependsOn")]
        non_roots = [tid for tid, t in data["stages"].items() if t.get("dependsOn")]
        for tid in roots:
            display_task(tid)
        for tid in non_roots:
            display_task(tid)

        if ready:
            print(f"\n  🟢 Ready to dispatch: {', '.join(ready)}")

    # Progress bar
    all_tasks = list(data["stages"].values())
    done_count = sum(1 for t in all_tasks if t.get("status") in ("done", "skipped"))
    total = len(all_tasks)
    if total:
        bar = "█" * done_count + "░" * (total - done_count)
        print(f"\n  Progress: [{bar}] {done_count}/{total}")


# ── cmd_update ─────────────────────────────────────────────────────

# ── cmd_graph ──────────────────────────────────────────────────────
def cmd_graph(args):
    """Visualize project DAG"""
    data = load_project(args.project)
    stages = data["stages"]

    status_icons = {
        "pending": "⬜",
        "in-progress": "🔄",
        "done": "✅",
        "failed": "❌",
        "skipped": "⏭️",
    }

    def topological_groups():
        remaining = set(stages.keys())
        groups = []
        while remaining:
            group = []
            for tid in list(remaining):
                deps = set(stages[tid].get("dependsOn", []))
                if deps.issubset(set(k for g in groups for k in g)):
                    group.append(tid)
            if not group:
                break
            groups.append(sorted(group))
            for tid in group:
                remaining.discard(tid)
        return groups

    if args.style == "tree":
        proj = data.get("project", args.project)
        print("📋 %s — DAG Graph" % proj)
        print("")

        # 递归树：按依赖深度缩进
        children = {tid: [] for tid in stages}
        for tid, t in stages.items():
            for dep in t.get("dependsOn", []):
                if dep in children:
                    children[dep].append(tid)

        visited = set()
        def print_tree(tid, prefix="", is_last=True):
            if tid in visited:
                connector = "└─" if is_last else "├─"
                icon = status_icons.get(stages[tid].get("status", "pending"), "❓")
                print("%s%s %s %s [↑ see above]" % (prefix, connector, icon, tid))
                return
            visited.add(tid)
            t = stages[tid]
            icon = status_icons.get(t.get("status", "pending"), "❓")
            agent = t.get("agent", "?")
            connector = "└─" if is_last else "├─"
            print("%s%s %s %s [%s]" % (prefix, connector, icon, tid, agent))
            kids = children.get(tid, [])
            for i, kid in enumerate(kids):
                child_prefix = prefix + ("   " if is_last else "│  ")
                print_tree(kid, child_prefix, i == len(kids) - 1)

        # 找所有根节点（无依赖）
        roots = sorted([tid for tid, t in stages.items() if not t.get("dependsOn")])
        for i, root in enumerate(roots):
            print_tree(root, "", i == len(roots) - 1)

        # 兜底：未访问到的孤立节点（环形引用保护）
        orphans = set(stages.keys()) - visited
        for tid in sorted(orphans):
            t = stages[tid]
            icon = status_icons.get(t.get("status", "pending"), "❓")
            agent = t.get("agent", "?")
            print("  %s %s %s [%s] (orphan)" % (icon, tid, agent))

        print("")
        total = len(stages)
        done = sum(1 for t in stages.values() if t.get("status") == "done")
        pct = int(done/total*4) if total > 0 else 0
        bar = "█" * pct + "░" * (4 - pct)
        print("Progress: [%s] %d/%d" % (bar, done, total))

    elif args.style == "mermaid":
        print("```mermaid")
        print("graph LR")
        for tid, t in stages.items():
            deps = t.get("dependsOn", [])
            for dep in deps:
                safe_dep = dep.replace("-", "_")
                safe_tid = tid.replace("-", "_")
                print("    %s[[%s]] --> %s[[%s]]" % (safe_dep, dep, safe_tid, tid))
            if not deps:
                safe_tid = tid.replace("-", "_")
                print("    %s[[%s]]" % (safe_tid, tid))
        print("```")

    elif args.style == "list":
        proj = data.get("project", args.project)
        print("📊 %s — Task List" % proj)
        print("")
        for tid, t in stages.items():
            icon = status_icons.get(t.get("status", "pending"), "❓")
            agent = t.get("agent", "?")
            deps = t.get("dependsOn", [])
            dep_str = " <- " + ", ".join(deps) if deps else ""
            print("  %s %s [%s]%s" % (icon, tid, agent, dep_str))

    total = len(stages)
    done = sum(1 for t in stages.values() if t.get("status") == "done")
    pending = sum(1 for t in stages.values() if t.get("status") == "pending")
    ip = sum(1 for t in stages.values() if t.get("status") == "in-progress")
    print("📈 Summary: %d done | %d in-progress | %d pending | %d total" % (done, ip, pending, total))

def cmd_update(args):
    """更新任务状态"""
    # F3.1: use optimistic lock for concurrent safety
    data, expected_rev = load_project_with_rev(args.project)
    stage_id = args.stage
    new_status = args.status

    if stage_id not in data["stages"]:
        print(f"Error: stage '{stage_id}' not found", file=sys.stderr)
        sys.exit(1)

    valid = ("pending", "in-progress", "done", "failed", "skipped")
    if new_status not in valid:
        print(f"Error: status must be one of {valid}", file=sys.stderr)
        sys.exit(1)

    stage = data["stages"][stage_id]
    old_status = stage["status"]

    # ── gstack 验证 ──────────────────────────────────────────────
    if new_status == "done" and not getattr(args, "skip_gstack_verify", False):
        details = stage.get("details", {})
        constraints = details.get("constraints", [])
        result_text = getattr(args, "result", "") or ""

        # 检查约束是否要求 gstack
        gstack_required = any(
            "gstack" in str(c).lower() or "/browse" in str(c) or "/qa" in str(c) or "/canary" in str(c)
            for c in constraints
        )

        if gstack_required:
            # 导入验证脚本
            import subprocess
            script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "verify_gstack_usage.py")
            work_dir = details.get("workDir") or details.get("work_dir")

            cmd = ["python3", script_path]
            if result_text:
                cmd.append(result_text)

            try:
                proc = subprocess.run(
                    cmd + ([work_dir] if work_dir else []),
                    capture_output=True, text=True, timeout=30
                )
                if proc.returncode != 0:
                    print(f"", file=sys.stderr)
                    print(f"🔴 GSTACK_VERIFICATION_FAILED", file=sys.stderr)
                    print(f"   任务要求使用 gstack 技能，但未检测到使用证据", file=sys.stderr)
                    print(f"   请在任务报告中包含:", file=sys.stderr)
                    print(f"   - 截图文件路径", file=sys.stderr)
                    print(f"   - browse snapshot 输出", file=sys.stderr)
                    print(f"   - qa/canary 报告路径", file=sys.stderr)
                    print(f"   - console 日志", file=sys.stderr)
                    print(f"", file=sys.stderr)
                    print(f"   如需跳过，请使用: --skip-gstack-verify", file=sys.stderr)
                    sys.exit(1)
            except Exception as e:
                print(f"⚠️  gstack 验证脚本执行失败: {e}，跳过验证", file=sys.stderr)
    stage["status"] = new_status

    if new_status == "in-progress" and not stage.get("startedAt"):
        stage["startedAt"] = now_iso()
    elif new_status in ("done", "failed", "skipped"):
        stage["completedAt"] = now_iso()

    if "logs" not in stage:
        stage["logs"] = []
    stage["logs"].append({
        "time": now_iso(),
        "event": f"status: {old_status} → {new_status}",
    })

    if data.get("mode") == "dag":
        check_dag_completion(data)
        data["updated"] = now_iso()
        # F3.1: use optimistic lock
        new_rev = save_project_with_lock(args.project, data, expected_rev=expected_rev)
        print(f"✅ {stage_id}: {old_status} → {new_status} (rev {expected_rev} → {new_rev})")

        if new_status == "done":
            ready = compute_ready_tasks(data)
            if ready:
                print(f"🟢 Unblocked: {', '.join(ready)}")
            elif data["status"] == "completed":
                print("🎉 All tasks completed!")

            # Epic 2.3: 通知下一环节 agent
            downstream = _get_downstream(args.project, stage_id)
            if downstream:
                next_stage_id, next_agent = downstream
                goal = data.get("goal", "")
                notify_stage_done(args.project, stage_id, next_stage_id, next_agent, goal)

            # Auto-append to MEMORY.md if --log-analysis was provided.
            if args.log_analysis and HAS_LOG_ANALYSIS:
                append_to_memory(
                    project=args.project,
                    task_id=stage_id,
                    summary=args.log_analysis,
                    workspace=os.environ.get("WORKSPACE", "/root/.openclaw"),
                )
        elif new_status == "pending":
            # Epic 2.3: 通知任务被驳回
            agent = data["stages"][stage_id].get("agent", "")
            reason = getattr(args, "result", None) or "未说明"
            notify_stage_rejected(args.project, stage_id, agent, reason)
    else:
        data["updated"] = now_iso()
        # F3.1: use optimistic lock
        new_rev = save_project_with_lock(args.project, data, expected_rev=expected_rev)
        print(f"✅ {stage_id}: {old_status} → {new_status} (rev {expected_rev} → {new_rev})")


# ── cmd_claim ──────────────────────────────────────────────────────

@timeout(5)
def cmd_claim(args):
    """领取任务"""
    # F3.2: use optimistic lock for concurrent safety
    data, expected_rev = load_project_with_rev(args.project)
    stage_id = args.stage

    if stage_id not in data["stages"]:
        print(f"Error: stage '{stage_id}' not found", file=sys.stderr)
        sys.exit(1)

    stage = data["stages"][stage_id]

    # 检查依赖
    deps = stage.get("dependsOn", [])
    if deps:
        not_done = []
        for dep in deps:
            dep_status = data["stages"].get(dep, {}).get("status")
            if dep_status not in ("done", "skipped"):
                not_done.append(f"{dep} ({dep_status})")
        if not_done:
            print(f"❌ Cannot claim '{stage_id}': upstream dependencies not satisfied:")
            for d in not_done:
                print(f"   - {d}")
            sys.exit(1)

    # 检查状态
    current_status = stage["status"]
    if current_status not in ("pending", "ready"):
        print(f"❌ Cannot claim '{stage_id}': current status is '{current_status}'")
        sys.exit(1)

    # 检查 agent 归属
    assigned_agent = stage.get("agent", "")
    claiming_agent = getattr(args, "agent", None) or stage_id.split("-")[0]
    if assigned_agent and assigned_agent != claiming_agent:
        if getattr(args, "force", False):
            print(f"⚠️ Force claiming '{stage_id}' (assigned to '{assigned_agent}', claiming as '{claiming_agent}')")
        else:
            print(f"❌ Cannot claim '{stage_id}': task assigned to '{assigned_agent}', you are '{claiming_agent}'")
            print(f"   Hint: use --force to override (coord only)")
            sys.exit(1)

    # 更新状态
    old_status = stage["status"]
    stage["status"] = "in-progress"
    if not stage.get("startedAt"):
        stage["startedAt"] = now_iso()
    if "logs" not in stage:
        stage["logs"] = []
    stage["logs"].append({
        "time": now_iso(),
        "event": f"status: {old_status} → in-progress (claimed by {claiming_agent})",
    })

    # 收集上游产物
    dep_outputs = {}
    for dep in deps:
        dep_task = data["stages"].get(dep, {})
        if dep_task.get("output"):
            dep_outputs[dep] = dep_task["output"]

    data["updated"] = now_iso()
    # F3.2: use optimistic lock
    new_rev = save_project_with_lock(args.project, data, expected_rev=expected_rev)

    # 输出任务详情
    print(f"✅ Claimed: {stage_id} (rev {expected_rev} → {new_rev})")
    print()
    print(f"## 项目目标")
    print(f"{data.get('goal', '')}")
    print()
    print(f"## 阶段任务")
    print(f"{stage.get('task', '')}")
    print()
    if stage.get("constraints"):
        print(f"## 🔴 约束清单")
        for c in stage["constraints"]:
            print(f"- {c}")
        print()
    if stage.get("checklist"):
        print(f"## ✅ 检查单")
        for c in stage["checklist"]:
            print(f"- [ ] {c}")
        print()
    if stage.get("output"):
        print(f"## 📦 产出路径")
        print(f"{stage['output']}")
        print()
    if dep_outputs:
        print(f"## 📤 上游产物")
        for dep_id, out in dep_outputs.items():
            print(f"- {dep_id}: {out}")
        print()


# ── cmd_ready ──────────────────────────────────────────────────────

def cmd_ready(args):
    """获取可执行的任务"""
    data = load_project(args.project)

    if data["status"] == "completed":
        print("🎉 All tasks completed — nothing to dispatch")
        return

    ready = compute_ready_tasks(data)

    if not ready:
        in_progress = [tid for tid, t in data["stages"].items() if t["status"] == "in-progress"]
        if in_progress:
            print(f"⏳ No ready tasks — waiting for: {', '.join(in_progress)}")
        else:
            print("❌ No ready tasks (pipeline may be blocked)")
        return

    print(f"🟢 Ready to dispatch ({len(ready)} tasks):\n")
    for tid in ready:
        task = data["stages"][tid]
        deps = task.get("dependsOn", [])
        deps_str = f" ← [{', '.join(deps)}]" if deps else ""
        print(f"  📌 {tid} → agent: {task.get('agent', tid)}{deps_str}")
        if task.get("constraints"):
            print(f"     🔴 Constraints: {task['constraints']}")
        if task.get("output"):
            print(f"     Output: {task['output']}")
        print()


# ── cmd_list ──────────────────────────────────────────────────────

def cmd_result(args):
    """设置任务产出物路径，供下游依赖引用"""
    data = load_project(args.project)
    stage_id = args.stage
    if stage_id not in data["stages"]:
        print(f"Error: stage '{stage_id}' not found", file=sys.stderr)
        sys.exit(1)
    data["stages"][stage_id]["output"] = args.output
    data["updated"] = now_iso()
    save_project(args.project, data)
    print(f"✅ Result set for {stage_id}: {args.output}")


@timeout(5)
def cmd_list(args):
    """列出所有项目（同时扫描根目录和 projects/ 子目录）"""
    # Import topological sort lazily to avoid hard dependency
    topo_sort_available = False
    _ts = None
    try:
        import importlib.util
        spec = importlib.util.find_spec("topological_sort")
        if spec is None:
            import os as _os_mod
            script_dir = _os_mod.path.dirname(_os_mod.path.abspath(__file__))
            topo_path = _os_mod.path.join(script_dir, "topological_sort.py")
            if _os_mod.path.exists(topo_path):
                spec = importlib.util.spec_from_file_location("topological_sort", topo_path)
                topo_module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(topo_module)
                topo_sort_available = True
                _ts = topo_module
        else:
            import topological_sort as _ts
            topo_sort_available = True
    except Exception:
        _ts = None
        topo_sort_available = False
    os.makedirs(TASKS_DIR, exist_ok=True)
    
    # 扫描根目录 *.json
    root_files = [f for f in os.listdir(TASKS_DIR) if f.endswith(".json")]
    
    # 扫描 projects/ 子目录
    projects_dir = os.path.join(TASKS_DIR, "projects")
    subdir_projects = []
    if os.path.isdir(projects_dir):
        for subdir in os.listdir(projects_dir):
            tasks_json = os.path.join(projects_dir, subdir, "tasks.json")
            if os.path.isfile(tasks_json):
                subdir_projects.append((subdir, tasks_json))
    
    all_files = root_files
    seen = set(f.replace(".json", "") for f in root_files)
    for subdir, _ in subdir_projects:
        if subdir not in seen:
            all_files.append(f"{subdir}.json")  # marker for subdir project
    
    if not all_files:
        print("No projects found.")
        return

    # Topological sort mode: output tasks in dependency order
    if getattr(args, "topo", False):
        project_filter = getattr(args, "project", None)
        if project_filter:
            filtered = []
            for f in all_files:
                if f.replace(".json", "") == project_filter:
                    filtered.append(f)
            all_files = filtered if filtered else [f"{project_filter}.json"]

        for f in sorted(all_files):
            name = f.replace(".json", "")
            if project_filter and name != project_filter:
                continue
            try:
                root_path = os.path.join(TASKS_DIR, f)
                if os.path.isfile(root_path):
                    with open(root_path) as fh:
                        data = json.load(fh)
                else:
                    tasks_path = os.path.join(TASKS_DIR, "projects", name, "tasks.json")
                    with open(tasks_path) as fh:
                        data = json.load(fh)

                stages = data.get("stages", {})
                if not stages:
                    continue

                if topo_sort_available and _ts is not None:
                    sorted_ids = _ts.topological_sort(stages)
                    if sorted_ids is None:
                        print(f"# ⚠️ Cycle detected in {name}, falling back to alphabetical", file=sys.stderr)
                        sorted_ids = sorted(stages.keys())
                else:
                    sorted_ids = sorted(stages.keys())

                goal = data.get("goal", "")[:60]
                print(f"# {name}: {goal}")
                for tid in sorted_ids:
                    task = stages[tid]
                    status = task.get("status", "?")
                    deps = task.get("dependsOn", [])
                    dep_str = f" (deps: {', '.join(deps)})" if deps else ""
                    print(f"  {name} {tid} [{status}]{dep_str}")
                print()
            except Exception as e:
                print(f"# {name} [error: {e}]")
        return

    def print_project(name, data):
        goal = data.get("goal", "")[:50]
        status = data.get("status", "unknown")
        mode = data.get("mode", "linear")
        done = sum(1 for t in data.get("stages", {}).values()
                   if t.get("status") in ("done", "skipped"))
        total = len(data.get("stages", {}))
        print(f"  {name} [{status}] ({done}/{total}) mode={mode} {goal}")

    for f in sorted(all_files):
        name = f.replace(".json", "")
        try:
            # 优先从根目录读取
            root_path = os.path.join(TASKS_DIR, f)
            if os.path.isfile(root_path):
                with open(root_path) as fh:
                    data = json.load(fh)
                print_project(name, data)
            else:
                # 回退到 projects/ 子目录
                tasks_path = os.path.join(TASKS_DIR, "projects", name, "tasks.json")
                with open(tasks_path) as fh:
                    data = json.load(fh)
                print_project(name, data)
        except Exception as e:
            print(f"  {name} [error reading: {e}]")


# ── cmd_log_analysis ─────────────────────────────────────────────────────────

def cmd_log_analysis(args):
    """Append task findings to MEMORY.md (via log_analysis.py)"""
    if not HAS_LOG_ANALYSIS:
        print("Error: log_analysis.py not found in scripts directory.", file=sys.stderr)
        print("Please ensure scripts/log_analysis.py exists.", file=sys.stderr)
        sys.exit(1)

    workspace = args.workspace or os.environ.get("WORKSPACE", "/root/.openclaw")
    append_to_memory(
        project=args.project,
        task_id=args.task_id,
        summary=args.summary,
        key_finding=args.key_finding or "",
        workspace=workspace,
    )
    print(f"✅ log-analysis: {args.project}/{args.task_id} appended to MEMORY.md")


def cmd_archive(args):
    """Archive completed projects by moving them to a completed/ subdirectory"""
    TEAM_TASKS_DIR = TEAM_TASKS_DIR_DEFAULT
    PROJECTS_DIR = os.path.join(TEAM_TASKS_DIR, "projects")
    COMPLETED_DIR = os.path.join(PROJECTS_DIR, "completed")

    os.makedirs(COMPLETED_DIR, exist_ok=True)

    if args.all:
        # Archive all completed projects
        archived = 0
        for name in os.listdir(PROJECTS_DIR):
            proj_dir = os.path.join(PROJECTS_DIR, name)
            if not os.path.isdir(proj_dir):
                continue
            tasks_file = os.path.join(proj_dir, "tasks.json")
            if not os.path.exists(tasks_file):
                continue
            try:
                with open(tasks_file) as f:
                    data = json.load(f)
                if data.get("status") == "completed":
                    dest = os.path.join(COMPLETED_DIR, name)
                    if os.path.exists(dest):
                        if not args.force:
                            print(f"⏭️  skip {name}: already exists in completed/")
                            continue
                        import shutil
                        shutil.rmtree(dest)
                    os.rename(proj_dir, dest)
                    print(f"✅ archived {name}")
                    archived += 1
            except (json.JSONDecodeError, OSError) as e:
                print(f"⚠️  skip {name}: {e}")
        print(f"📦 Archived {archived} project(s)")
        return

    # Archive single project
    project = args.project
    tasks_file = task_file(project)
    if not os.path.exists(tasks_file):
        print(f"Error: project '{project}' not found", file=sys.stderr)
        sys.exit(1)
    with open(tasks_file) as f:
        data = json.load(f)
    if data.get("status") != "completed":
        print(f"Error: project '{project}' status is '{data.get('status')}', must be 'completed' to archive", file=sys.stderr)
        sys.exit(1)

    proj_dir = os.path.join(PROJECTS_DIR, project)
    dest = os.path.join(COMPLETED_DIR, project)
    if os.path.exists(dest) and not args.force:
        print(f"Error: {dest} already exists (use --force to overwrite)", file=sys.stderr)
        sys.exit(1)
    if os.path.exists(dest):
        import shutil
        shutil.rmtree(dest)
    os.rename(proj_dir, dest)
    print(f"✅ archived {project} → {COMPLETED_DIR}/")


def cmd_clean_cooldown(args):
    """Clean stale entries from cooldown.json"""
    if not HAS_LOG_ANALYSIS:
        print("Error: log_analysis.py not found in scripts directory.", file=sys.stderr)
        sys.exit(1)

    file = args.file or "/root/.openclaw/workspace-analyst/cooldown.json"
    ttl = args.ttl_seconds or 86400
    removed = clean_cooldown(file, ttl)
    print(f"✅ clean-cooldown: removed {removed} entries from {file}")


# ── Main ───────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Team Tasks ★唯一入口: phase1 → phase2")
    sub = parser.add_subparsers(dest="command", help="Command")

    # ★ 阶段一（唯一入口）
    p = sub.add_parser("phase1", help="★ 创建阶段一任务链 ★唯一入口★")
    p.add_argument("project", help="项目名称")
    p.add_argument("goal", help="项目目标描述")
    p.add_argument("docs_subdir", nargs="?", help="文档子目录（默认：项目名称）")
    p.add_argument("work_dir", nargs="?", help="工作目录（默认：/root/.openclaw/vibex）")
    p.add_argument("--force", action="store_true", help="强制创建（跳过重复检测 block）")
    p.add_argument("--yes", "-y", action="store_true", help="自动确认 warn 提示")
    p.add_argument("--no-check", action="store_true", help="跳过重复检测")

    # ★ 阶段二（唯一入口）
    p = sub.add_parser("phase2", help="★ 创建阶段二任务链 ★唯一入口★")
    p.add_argument("project", help="项目名称")
    p.add_argument("--epics", "-e", required=True, help="Epic 列表（逗号分隔）")
    p.add_argument("--docs-subdir", help="文档子目录（默认：项目名称）")
    p.add_argument("--work-dir", help="工作目录（默认：/root/.openclaw/vibex）")
    p.add_argument("--epic-deps", help="Epic 依赖关系（如：Epic2:Epic1,Epic3:Epic1 表示 Epic2 依赖 Epic1，Epic3 依赖 Epic1）")
    p.add_argument("--force", action="store_true", help="强制创建（跳过重复检测 block）")
    p.add_argument("--yes", "-y", action="store_true", help="自动确认 warn 提示")
    p.add_argument("--no-check", action="store_true", help="跳过重复检测")

    # add（向已存在 DAG 项目添加任务）
    p = sub.add_parser("add", help="向 DAG 项目添加任务")
    p.add_argument("project", help="项目名称")
    p.add_argument("task_id", help="任务 ID")
    p.add_argument("--agent", "-a", help="Agent ID（默认：task_id）")
    p.add_argument("--depends", "-d", help="依赖任务 ID（逗号分隔）")
    p.add_argument("--desc", help="任务描述")
    p.add_argument("--constraints", "-c", help="约束（JSON 数组或逗号分隔）")
    p.add_argument("--verification", "-v", help="验证（JSON 对象）")
    p.add_argument("--output", "-o", help="产出路径")

    # graph
    p = sub.add_parser("graph", help="Visualize DAG")
    p.add_argument("project", help="Project name")
    p.add_argument("--style", "-s", choices=["tree", "mermaid", "list"], default="tree", help="View style")

    # status
    p = sub.add_parser("status", help="显示项目状态")
    p.add_argument("project", help="项目名称")
    p.add_argument("--json", "-j", action="store_true", help="JSON 输出")

    # update
    p = sub.add_parser("update", help="更新任务状态")
    p.add_argument("project", help="项目名称")
    p.add_argument("stage", help="任务 ID")
    p.add_argument("status", help="状态: pending|in-progress|done|failed|skipped")
    p.add_argument("--log-analysis", "-l", help="Append summary to MEMORY.md on done")
    p.add_argument("--result", "-r", help="任务产出摘要（用于 gstack 验证）")
    p.add_argument("--skip-gstack-verify", action="store_true", help="跳过 gstack 验证（coord 专用）")

    # claim
    p = sub.add_parser("claim", help="领取任务")
    p.add_argument("project", help="项目名称")
    p.add_argument("stage", help="任务 ID")
    p.add_argument("--agent", "-a", help="Agent ID claiming this task")
    p.add_argument("--force", "-f", action="store_true", help="Force claim even if agent mismatch (coord only)")

    # ready
    p = sub.add_parser("ready", help="获取可执行的任务")
    p.add_argument("project", help="项目名称")

    # list
    p = sub.add_parser("list", help="列出所有项目")
    p.add_argument("--topo", action="store_true", help="按拓扑排序输出任务（适用于心跳扫描）")
    p.add_argument("--project", "-p", help="仅显示指定项目的任务拓扑序")

    # result（设置任务产出物路径，供下游依赖引用）
    p = sub.add_parser("result", help="设置任务产出物路径")
    p.add_argument("project", help="项目名称")
    p.add_argument("stage", help="任务 ID")
    p.add_argument("output", help="产出路径或结果描述")

    # log-analysis（向 MEMORY.md 追加分析记录）
    p = sub.add_parser("log-analysis", help="Append task finding to MEMORY.md")
    p.add_argument("project", help="项目名称")
    p.add_argument("task_id", help="任务 ID")
    p.add_argument("--summary", "-s", required=True, help="简短总结")
    p.add_argument("--key-finding", "-k", default="", help="关键发现（可选）")
    p.add_argument("--workspace", "-w", default="/root/.openclaw", help="工作区根路径")

    # clean-cooldown（清理 cooldown.json 中的过期条目）
    p = sub.add_parser("archive", help="Archive completed projects to completed/ subdirectory")
    p.add_argument("project", nargs="?", help="Project name to archive")
    p.add_argument("--all", action="store_true", help="Archive all completed projects at once")
    p.add_argument("--force", action="store_true", help="Overwrite if destination exists")

    p = sub.add_parser("clean-cooldown", help="Clean stale entries from cooldown.json")
    p.add_argument("--file", "-f", help="cooldown.json 路径")
    p.add_argument("--ttl-seconds", "-t", type=int, help="TTL 秒数（默认 86400）")

    # check-dup
    sub.add_parser("health", help="健康检查：测试 list/claim 执行时间")

    # current-report: 生成项目待决策报告（活跃项目 + 虚假完成检测 + 服务器信息）
    p = sub.add_parser("current-report", help="生成项目待决策报告")
    p.add_argument("--json", "-j", action="store_true", help="JSON 格式输出")
    p.add_argument("--tasks-path", default=None, help="tasks.json 路径（默认: workspace-coord/team-tasks/tasks.json）")
    p.add_argument("--workspace", "-w", default="/root/.openclaw/vibex", help="工作区根路径（用于解析相对路径）")

    p = sub.add_parser("check-dup", help="检查项目是否重复（提案去重）")
    p.add_argument("name", help="项目名称")
    p.add_argument("goal", nargs="?", default="", help="项目目标描述")
    p.add_argument("--workspace", "-w", help="工作目录")
    p.add_argument("--threshold", "-t", type=float, default=0.4, help="相似度阈值（默认 0.4）")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)

    cmds = {
        "phase1": cmd_phase1,
        "phase2": cmd_phase2,
        "add": cmd_add,
        "status": cmd_status,
        "graph": cmd_graph,
        "update": cmd_update,
        "claim": cmd_claim,
        "ready": cmd_ready,
        "list": cmd_list,
        "result": cmd_result,
        "log-analysis": cmd_log_analysis,
        "archive": cmd_archive,
        "clean-cooldown": cmd_clean_cooldown,
        "check-dup": cmd_check_dup,
        "health": cmd_health,
        "current-report": cmd_current_report,
    }

    if args.command not in cmds:
        print(f"Error: unknown command '{args.command}'", file=sys.stderr)
        print(f"Available commands: {', '.join(cmds.keys())}", file=sys.stderr)
        sys.exit(1)

    cmds[args.command](args)


# ── cmd_current_report ──────────────────────────────────────────────────────

def cmd_current_report(args):
    """Generate current-report: active projects + false completion + server info."""
    if not HAS_CURRENT_REPORT:
        print("ERROR: current_report module not found", file=sys.stderr)
        sys.exit(1)

    tasks_dir = args.tasks_path or TASKS_DIR

    active = current_report._active_projects.get_active_projects(tasks_dir)
    false_comp = current_report._false_completion.detect_false_completions(tasks_dir)
    server = current_report._server_info.get_server_info()

    if args.json:
        output = current_report._output.format_json(active, false_comp, server)
    else:
        output = current_report._output.format_text(active, false_comp, server)

    print(output)


# ── cmd_health ────────────────────────────────────────────────────

def cmd_health(args):
    """Health check: verify list and claim execute within time limit."""
    import time
    results = []

    # Test list
    try:
        start = time.perf_counter()
        os.makedirs(TASKS_DIR, exist_ok=True)
        files = [f for f in os.listdir(TASKS_DIR) if f.endswith(".json")]
        elapsed = time.perf_counter() - start
        results.append(("list", "OK", f"{elapsed:.3f}s", len(files)))
    except Exception as e:
        results.append(("list", "FAIL", str(e), 0))

    # Test claim (dry-run: just load project)
    try:
        start = time.perf_counter()
        _ = load_project("vibex-epic1-toolchain-20260324")
        elapsed = time.perf_counter() - start
        results.append(("load_project", "OK", f"{elapsed:.3f}s", None))
    except Exception as e:
        results.append(("load_project", "FAIL", str(e), None))

    # Summary
    all_ok = all(r[1] == "OK" for r in results)
    for name, status, detail, count in results:
        icon = "✅" if status == "OK" else "❌"
        extra = f" ({count} files)" if count is not None else ""
        print(f"  {icon} {name}: {detail}{extra}")

    if all_ok:
        print("\n✅ Health check PASSED — task_manager is responsive")
        sys.exit(0)
    else:
        print("\n❌ Health check FAILED")
        sys.exit(1)


# ── cmd_current_report ─────────────────────────────────────────────

def cmd_current_report(args):
    """生成项目待决策报告（Ready任务 + 活跃项目 + 虚假完成检测 + 服务器信息）。"""
    import sys as _sys

    # Dynamically import to avoid hard dependency at module load time
    try:
        from current_report import (
            get_active_projects,
            detect_false_completions,
            get_server_info,
            get_ready_tasks,
            get_blocked_tasks,
            format_text,
            format_json,
        )
    except ImportError:
        # Fallback: try relative import
        try:
            from .current_report import (
                get_active_projects,
                detect_false_completions,
                get_server_info,
                get_ready_tasks,
                get_blocked_tasks,
                format_text,
                format_json,
            )
        except ImportError:
            print("Error: current_report module not found", file=_sys.stderr)
            _sys.exit(1)

    tasks_path = args.tasks_path
    workspace = args.workspace

    try:
        ready = get_ready_tasks(tasks_path)
        blocked = get_blocked_tasks(tasks_path)
        active = get_active_projects(tasks_path)
        false_comp = detect_false_completions(tasks_path)
        server = get_server_info()
    except (OSError, IOError, ValueError) as e:
        # Catch path-related errors (e.g. invalid filenames from malformed JSON data)
        print(f"Error gathering report data: {e}", file=_sys.stderr)
        _sys.exit(1)

    if args.json:
        print(format_json(active, false_comp, server, ready, blocked))
    else:
        print(format_text(active, false_comp, server, ready, blocked))

    _sys.exit(0)


# ── cmd_check_dup ─────────────────────────────────────────────────

def cmd_check_dup(args):
    """检查项目是否重复"""
    import sys as _sys
    if not HAS_DEDUP or not DEDUP:
        print("❌ 重复检测模块不可用（dedup.py 未找到）", file=_sys.stderr)
        _sys.exit(1)

    threshold = getattr(args, "threshold", 0.4)
    result = DEDUP.check_duplicate_projects(
        args.name,
        args.goal,
        workspace=getattr(args, "workspace", None),
        threshold=threshold,
    )

    print(f"🔍 检查项目: {args.name}")
    print(f"📊 目标: {args.goal}")
    print()
    print(result["message"])
    sys.exit(1 if result["level"] == "block" else 0)


if __name__ == '__main__':
    import sys
    print('CALLING MAIN', flush=True, file=sys.stderr)
    main()
