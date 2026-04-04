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
  activate  设置项目状态 (active | completed)
"""

import argparse
import json
import os
import signal
import sys
import importlib
import time
from datetime import datetime, timezone

from config import (
    TASK_LOCK_BASE as _TASK_LOCK_BASE,
    UPDATE_LOG as _UPDATE_LOG,
    MAC_KEY_FILE as _MAC_KEY_FILE,
    CURRENT_REPORT_PKG as _current_report_pkg,
    DEFAULT_WORK_DIR,
)

# ── Load .env file（自动加载同目录下的 .env）──────────────────────────
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_ENV_FILE = os.path.join(_SCRIPT_DIR, ".env")
if os.path.exists(_ENV_FILE):
    try:
        with open(_ENV_FILE) as _f:
            for _line in _f:
                _line = _line.strip()
                if not _line or _line.startswith("#"):
                    continue
                if "=" in _line:
                    _k, _v = _line.split("=", 1)
                    os.environ.setdefault(_k.strip(), _v.strip())
    except Exception:
        pass

# ── current_report module (dynamic import) ─────────────────────────────────────
if os.path.isdir(_current_report_pkg):
    import importlib.util
    _cr_spec = importlib.util.spec_from_file_location("current_report", os.path.join(_current_report_pkg, "__init__.py"))
    if _cr_spec and _cr_spec.loader:
        _cr_mod = importlib.util.module_from_spec(_cr_spec)
        sys.modules["current_report"] = _cr_mod
        _cr_spec.loader.exec_module(_cr_mod)

# ── E4: 虚假完成检测 ────────────────────────────────────────────────────────────
def validate_task_completion(project: str, stage_id: str, stage_info: dict, repo: str = "/root/.openclaw/vibex") -> dict:
    """
    检测任务是否虚假完成。
    返回 dict: {
        "valid": bool,           # True = 真实完成，False = 虚假完成
        "warnings": list[str],    # 警告信息列表
        "commit": str|None,       # 当前 HEAD commit
    }
    """
    import subprocess
    warnings = []

    try:
        current_commit = subprocess.check_output(
            ["git", "-C", repo, "rev-parse", "HEAD"],
            stderr=subprocess.DEVNULL, text=True
        ).strip()[:40]
    except Exception:
        current_commit = None

    # 检查1: commit 是否更新（虚假完成检测）
    prev_commit = stage_info.get("commit")
    if prev_commit and current_commit and prev_commit == current_commit:
        warnings.append(
            f"\n⚠️  WARNING: Duplicate 'done' without new commit\n"
            f"   Task {project}/{stage_id} was already completed\n"
            f"   Commit unchanged: {current_commit[:8]}\n"
            f"   Recommended: Make a new commit before marking done"
        )

    # 检查2: Dev 任务是否有测试文件变更
    if stage_id.startswith("dev-") and current_commit and stage_info.get("status") != "done":
        try:
            diff = subprocess.check_output(
                ["git", "-C", repo, "diff-tree", "--no-commit-id", "--name-only", "-r", current_commit],
                stderr=subprocess.DEVNULL, text=True
            ).strip()
            test_patterns = (".test.", ".spec.", "__tests__/", "/tests/")
            has_test = any(p in diff for p in test_patterns)
            if not has_test and diff:
                # Only warn if commit has actual file changes (not empty commits)
                warnings.append(
                    f"\n⚠️  WARNING: Dev task '{stage_id}' marked done without test file changes\n"
                    f"   Commit: {current_commit[:8]}\n"
                    f"   No test files found in commit. Add tests before marking done."
                )
        except Exception:
            pass

    valid = len(warnings) == 0
    return {"valid": valid, "warnings": warnings, "commit": current_commit}


# ── E3-F1: 提案完整性验证 ────────────────────────────────────────────────────────
_REQUIRED_PROPOSAL_SECTIONS = ['问题描述', '根因分析', '建议方案', '验收标准']


def _validate_proposal_content(filepath: str) -> bool:
    """
    验证提案文件是否包含所有必需章节。

    E3-F1 实现:
    - 检查 4 个强制章节: 问题描述、根因分析、建议方案、验收标准
    - 返回 True 表示验证通过，False 表示缺少章节
    - 验证失败时打印错误并 sys.exit(1)
    """
    try:
        content = open(filepath).read()
    except FileNotFoundError:
        print(f"❌ 提案文件不存在: {filepath}", file=sys.stderr)
        print(f"   请在提案任务 details 中指定 proposal_file 路径", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ 读取提案文件失败: {e}", file=sys.stderr)
        sys.exit(1)

    missing = [s for s in _REQUIRED_PROPOSAL_SECTIONS if s not in content]
    if missing:
        print(f"❌ 提案缺少必需章节: {', '.join(missing)}", file=sys.stderr)
        print(f"   请参考 proposals/TEMPLATE.md 补全提案", file=sys.stderr)
        sys.exit(1)

    print(f"✅ 提案验证通过 (4/4 章节完整)")


# ── Task File Lock（git sync 强制约束）─────────────────────────────
# 锁文件路径: ~/.task_locks/<project>/<task_id>.lock
# claim 时创建锁，update 到终态（done/rejected/blocked/skipped）时删除锁
# CI/git hook 用 `task_manager check-lock <project>` 验证一致性

def _task_lock_path(project: str, task_id: str) -> str:
    return os.path.join(_TASK_LOCK_BASE, project, f"{task_id}.lock")

def _acquire_task_lock(project: str, task_id: str, agent: str) -> bool:
    """创建任务锁文件。返回 True 表示成功，False 表示锁已存在（被占用）。"""
    lock_dir = os.path.join(_TASK_LOCK_BASE, project)
    lock_file = _task_lock_path(project, task_id)
    try:
        os.makedirs(lock_dir, exist_ok=True)
        if os.path.exists(lock_file):
            # 锁已存在，检查是否过期（>24h 视为孤儿锁）
            try:
                meta = json.load(open(lock_file))
                age = time.time() - meta.get("_ctime", 0)
                if age > 86400:
                    print(f"⚠️  发现孤儿锁（>24h），自动清理: {lock_file}")
                    os.remove(lock_file)
                else:
                    print(f"🔒 任务锁已存在: {project}/{task_id}（由 {meta.get('agent')} 持有，{age/3600:.1f}h 前）")
                    return False
            except Exception:
                os.remove(lock_file)  # 损坏的锁文件直接删
        meta = {
            "project": project,
            "task_id": task_id,
            "agent": agent,
            "_ctime": time.time(),
        }
        with open(lock_file, "w") as f:
            json.dump(meta, f, indent=2)
        return True
    except Exception as e:
        print(f"⚠️  文件锁创建失败: {e}", file=sys.stderr)
        return True  # 锁失败不阻塞 claim

def _release_task_lock(project: str, task_id: str) -> bool:
    """删除任务锁文件。返回 True 表示已删除，False 表示锁不存在。"""
    lock_file = _task_lock_path(project, task_id)
    try:
        if os.path.exists(lock_file):
            os.remove(lock_file)
            return True
        return False
    except Exception as e:
        print(f"⚠️  文件锁删除失败: {e}", file=sys.stderr)
        return False

def cmd_resign(args):
    """强制重新签名项目文件（用于修复损坏的 _mac）。"""
    project = args.project
    path = task_file(project)
    if not os.path.exists(path):
        print(f"Error: project '{project}' not found", file=sys.stderr)
        sys.exit(1)
    with open(path) as f:
        raw = json.load(f)
    # 移除旧签名
    raw.pop(_MAC_FIELD, None)
    signed = _sign_data(raw)
    tmp_fd, tmp_path = __import__("tempfile").mkstemp(
        prefix=".tmp_resign_", dir=os.path.dirname(path)
    )
    try:
        with os.fdopen(tmp_fd, "w") as f:
            json.dump(signed, f, indent=2, ensure_ascii=False)
        os.rename(tmp_path, path)
        _set_json_readonly(path)
        print(f"✅ 已重新签名: {project}")
    except Exception as e:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
        print(f"❌ 重签名失败: {e}", file=sys.stderr)
        sys.exit(1)


def cmd_check_lock(args):
    """检查项目中是否存在未解锁的任务（锁存在但状态已是终态）。"""
    project = args.project
    data, _ = load_project_with_rev(project)
    lock_dir = os.path.join(_TASK_LOCK_BASE, project)

    terminal = {"done", "rejected", "blocked", "skipped"}
    orphans = []

    if os.path.isdir(lock_dir):
        for lf in os.listdir(lock_dir):
            if not lf.endswith(".lock"):
                continue
            task_id = lf[:-5]  # 去掉 .lock
            stage = data.get("stages", {}).get(task_id, {})
            status = stage.get("status", "unknown")
            if status in terminal:
                try:
                    meta = json.load(open(os.path.join(lock_dir, lf)))
                    agent = meta.get("agent", "?")
                    age_h = (time.time() - meta.get("_ctime", 0)) / 3600
                except Exception:
                    agent, age_h = "?", 0
                orphans.append((task_id, status, agent, age_h, os.path.join(lock_dir, lf)))

    if orphans:
        print(f"🔴 发现 {len(orphans)} 个未解锁的终态任务:")
        for task_id, status, agent, age_h, lf_path in orphans:
            print(f"   • {task_id} [{status}] — {agent}, {age_h:.1f}h 前 claim")
        if getattr(args, "fix", False):
            for task_id, status, agent, age_h, lf_path in orphans:
                try:
                    os.remove(lf_path)
                    print(f"   ✅ 已清理: {task_id}")
                except Exception as e:
                    print(f"   ❌ 清理失败: {task_id} — {e}")
            print(f"\n💡 请确认任务状态已正确更新，或手动: task_manager update {project} <task_id> done")
            sys.exit(0)
        else:
            print(f"\n💡 修复（手动）: task_manager update {project} <task_id> done")
            print(f"   或自动修复: task_manager check-lock {project} --fix")
            sys.exit(1)
    else:
        print(f"✅ 所有任务锁已正确释放（{project}）")
        sys.exit(0)

# ── update 操作日志（tail -100 溯源）────────────────────────────────
def _log_update(project: str, stage_id: str, old_status: str, new_status: str, updated_by: str):
    try:
        os.makedirs(os.path.dirname(_UPDATE_LOG), exist_ok=True)
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        line = f"{ts} | {project}/{stage_id} | {old_status} → {new_status} | {updated_by}\n"
        with open(_UPDATE_LOG, "a") as f:
            f.write(line)
    except Exception:
        pass

# ── HMAC 防篡改签名 ─────────────────────────────────────────────
_MAC_FIELD = "_mac"

def _get_mac_key() -> bytes:
    """读取或生成 HMAC 密钥。"""
    key_path = _MAC_KEY_FILE
    if os.path.exists(key_path):
        return open(key_path, "rb").read().strip()
    # 首次运行：生成 32 字节随机密钥
    import secrets
    key = secrets.token_hex(32)
    os.makedirs(os.path.dirname(key_path), exist_ok=True)
    with open(key_path, "wb") as f:
        f.write(key.encode())
    os.chmod(key_path, 0o600)
    return key.encode()

def _compute_mac(data: dict) -> str:
    """对 JSON 数据（不含 _mac 字段）计算 HMAC-SHA256，返回 hex 字符串。"""
    import hmac, hashlib
    payload = json.dumps(data, sort_keys=True, ensure_ascii=False, default=str)
    # 去除 _mac 字段后再算（load 时还没有 _mac，所以 save 时也要排除）
    data_for_signing = {k: v for k, v in data.items() if k != _MAC_FIELD}
    payload_clean = json.dumps(data_for_signing, sort_keys=True, ensure_ascii=False, default=str)
    return hmac.new(_get_mac_key(), payload_clean.encode(), hashlib.sha256).hexdigest()

def _sign_data(data: dict) -> dict:
    """给数据追加 _mac 签名字段。"""
    out = {k: v for k, v in data.items() if k != _MAC_FIELD}
    out[_MAC_FIELD] = _compute_mac(out)
    return out

def _verify_and_strip_mac(data: dict) -> dict:
    """验签已禁用（用户要求移除），直接返回原始数据。"""
    return data

import hmac  # noqa: F401 — used in _compute_mac and _verify_and_strip_mac

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

HAS_CURRENT_REPORT = os.path.isdir(_current_report_pkg)

TEAM_TASKS_DIR_DEFAULT = "/root/.openclaw/workspace-coord/team-tasks"
LEGACY_TASKS_DIR = "/home/ubuntu/clawd/data/team-tasks"
TASKS_DIR = os.environ.get("TEAM_TASKS_DIR", TEAM_TASKS_DIR_DEFAULT)


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
        raw = json.load(f)
    # HMAC 验签：手动改 JSON 会被检测到
    return _verify_and_strip_mac(raw)


# =============================================================================
# Epic 1: Concurrent-safe infrastructure (optimistic locking + atomic writes)
# =============================================================================

_REVISION_KEY = "_revision"


def _set_json_readonly(path: str) -> None:
    """Set a JSON task file to read-only (444), blocking direct edits."""
    try:
        os.chmod(path, 0o444)
    except OSError:
        pass  # Non-fatal — file may not exist yet

def atomic_write_json(path: str, data: dict) -> None:
    """Atomically write data to a JSON file using temp file + rename.

    Guarantees that on any exception, the original file is untouched.
    Uses os.rename for atomicity on POSIX systems.
    After a successful write, the file is set to read-only (444) to
    prevent agents from bypassing the CLI and editing the JSON directly.

    Args:
        path: Target JSON file path
        data: Python object serializable to JSON
    """
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp_fd, tmp_path = __import__("tempfile").mkstemp(
        prefix=".tmp_", suffix="_" + os.path.basename(path), dir=os.path.dirname(path)
    )
    try:
        # 临时提权：迁移场景下文件可能是 444，必须可写才能写
        if os.path.exists(path):
            os.chmod(path, 0o644)
        # HMAC 签名：写入前对数据签名，防止 agent 手动改 JSON 绕过 CLI
        signed_data = _sign_data(data)
        with os.fdopen(tmp_fd, "w") as f:
            json.dump(signed_data, f, indent=2, ensure_ascii=False)
        os.rename(tmp_path, path)
        # Lock the file after a successful write — agents must use CLI
        _set_json_readonly(path)
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
        raw = json.load(f)
    # HMAC 验签：手动改 JSON 会被检测到
    data = _verify_and_strip_mac(raw)
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
    # Preserve the caller's data (which may have in-memory modifications)
    # from being shadowed by the local variable in load_project_with_rev
    data_to_write = data

    for attempt in range(max_retries):
        # Always reload just the current revision first — verify before write
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
        data_with_rev = dict(data_to_write)
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
    """Return task IDs whose dependencies are all done (status=pending only)."""
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


def wake_downstream(data: dict, done_stage_id: str) -> list:
    """Re-activate all downstream tasks when a stage is marked done.
    
    Finds all tasks that depend on done_stage_id and sets them to ready
    (regardless of their current status: pending/rejected/blocked/in-progress).
    Returns list of task IDs that were woken up.
    """
    woken = []
    for task_id, task in data["stages"].items():
        # Skip if already done/skipped
        if task["status"] in ("done", "skipped"):
            continue
        deps = task.get("dependsOn", [])
        if done_stage_id not in deps:
            continue
        # 关键修复：只有当该任务的所有依赖都完成时才能唤醒
        all_deps_done = all(
            data["stages"].get(d, {}).get("status") in ("done", "skipped")
            for d in deps
        )
        if not all_deps_done:
            continue
        old_status = task["status"]
        task["status"] = "ready"
        task.pop("completedAt", None)
        task["updatedBy"] = "cli"
        _log_update(None, task_id, old_status, "ready", "cli")
        if "logs" not in task:
            task["logs"] = []
        task["logs"].append({
            "time": now_iso(),
            "event": f"status: {old_status} → ready (上游 {done_stage_id} 重新完成)",
        })
        woken.append(task_id)
    return woken


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
    work_dir = args.work_dir or DEFAULT_WORK_DIR

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

## PRD 格式规范（必须包含以下章节）
1. **执行摘要** — 背景/目标/成功指标
2. **Epic 拆分** — Epic/Story 表格（含工时估算）
3. **验收标准** — 每个 Story 可测试的 expect() 条目
4. **DoD (Definition of Done)** — 研发完成的判断标准

## PRD 格式校验（自检后再提交）
- [ ] 执行摘要包含：背景 + 目标 + 成功指标
- [ ] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [ ] 每个 Story 有可写的 expect() 断言
- [ ] DoD 章节存在且具体

## 驳回红线
- PRD 缺少执行摘要/Epic拆分/验收标准/DoD 任一章节 → 驳回补充
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
2. 逐项质量检查（见下方检查清单）
3. 做出决策：通过或驳回
4. 如通过，执行 `allow` 命令开启阶段二
5. 如驳回，写清驳回原因 + 修改要求

## 质量检查清单（必须逐项确认）

### analysis.md（analyze-requirements）
- [ ] 问题描述清晰，有复现步骤
- [ ] 使用 gstack 验证问题真实性
- [ ] 风险识别完整
- [ ] 验收标准具体可测试

### prd.md（create-prd）
- [ ] Epic/Story 划分合理
- [ ] 每个功能有验收标准（可写断言）
- [ ] DoD（完成定义）明确
- [ ] 功能ID格式正确

### architecture.md（design-architecture）
- [ ] 架构设计可行
- [ ] 包含 IMPLEMENTATION_PLAN.md
- [ ] 包含 AGENTS.md
- [ ] 性能影响已评估
- [ ] 接口文档完整

## 驳回标准（触发条件任一即驳回）
- 产物缺失任何一项检查清单 → 驳回
- 问题描述不清晰 → 驳回
- 需求无法落地 → 驳回
- 架构不可行 → 驳回
- 无 IMPLEMENTATION_PLAN.md → 驳回

## 决策操作（两步骤）
1. 通过后执行 `allow` 命令（建 phase2）：
   task allow <project> coord-decision
2. allow 成功后再标记 done：
   task update <project> coord-decision done
""",
        depends_on=["design-architecture"],
        constraints=[
            "逐项检查清单，全部通过才能通过",
            "驳回必须有具体原因",
            "通过必须先执行 allow 再 update done",
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
    print(f"   task phase2 {project} --epics \"Epic1,Epic2\" --docs-subdir {docs_subdir} --work-dir {work_dir}")


# ── cmd_proposals ─────────────────────────────────────────────────

def cmd_proposals(args):
    """★ 提案收集链：各成员提案 → analyst分析 → pm产品分析 → architect架构 → coord决策
    
    流程: agent提交提案 → analyst(gstack分析) → pm(产品分析) → architect(架构设计) → coord(决策是否开启phase1)
    禁止跳过任何步骤
    """
    project = args.project
    goal = args.goal
    primary_agent = args.agent or "analyst"
    docs_subdir = args.docs_subdir or project
    work_dir = args.work_dir or DEFAULT_WORK_DIR

    project_file = task_file(project)

    print("=" * 50)
    print("📋 创建提案收集链 ★唯一入口★")
    print("=" * 50)
    print(f"项目: {project}")
    print(f"目标: {goal}")
    print(f"提案代理: {primary_agent}")
    print(f"文档目录: {docs_subdir}")
    print(f"工作目录: {work_dir}")
    print()

    # 检查项目是否存在
    if os.path.exists(project_file):
        print(f"⚠️  项目 {project} 已存在")
        print("   请删除旧项目或使用其他名称")
        sys.exit(1)

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

    # 添加 agent-submit（提案提交）
    print(f"📝 添加 agent-submit ({primary_agent})...")
    data["stages"]["agent-submit"] = make_stage(
        agent_id=primary_agent,
        task=f"""提案提交：{goal}

## 📁 工作目录
- 项目路径: {work_dir}
- 提案目录: {work_dir}/proposals/{{date}}/

## 你的任务
1. 使用 PR_TEMPLATE.md 模板撰写提案
2. 提案写入: {work_dir}/proposals/{{date}}/{primary_agent}.md
3. 提案必须包含：
   - 问题描述（清晰、有复现步骤）
   - 根因分析
   - 影响范围
   - 建议方案（含工作量估算）
   - 验收标准（可测试）
4. 完成后通知 coord

## 模板位置
/root/.openclaw/workspace/PR_TEMPLATE.md

## 驳回红线
- 提案缺少问题描述 → 驳回
- 缺少验收标准 → 驳回
""",
        depends_on=[],
        constraints=[
            "使用 /root/.openclaw/workspace/PR_TEMPLATE.md 模板",
            "提案写入 proposals/{YYYYMMDD}/{agent}.md",
            "包含问题描述/根因/影响/方案/验收标准",
            f"工作目录: {work_dir}"
        ],
        verification={"command": f"test -f {work_dir}/proposals/{{date}}/{primary_agent}.md"},
        output=f"{work_dir}/proposals/{{date}}/{primary_agent}.md"
    )
    save_project(project, data)
    print("✅ agent-submit 添加成功")
    print()

    # 添加 analyst-review (analyst) - 依赖 agent-submit
    print("📝 添加 analyst-review (analyst) - 依赖 agent-submit...")
    data["stages"]["analyst-review"] = make_stage(
        agent_id="analyst",
        task=f"""提案分析（gstack）：{goal}

## 📁 工作目录
- 项目路径: {work_dir}
- 提案位置: {work_dir}/proposals/{{date}}/{primary_agent}.md
- 分析输出: {work_dir}/docs/{docs_subdir}/analysis.md

## 你的任务
1. 读取提案文档
2. 使用 gstack 技能（/browse /qa）验证问题真实性
3. 输出 analysis.md，包含：
   - 业务场景分析
   - 技术方案选项（至少 2 个）
   - 可行性评估
   - 初步风险识别
   - 验收标准

## 驳回红线
- 问题不真实（gstack验证失败）→ 驳回
- 需求模糊无法实现 → 驳回
- 缺少验收标准 → 驳回
""",
        depends_on=["agent-submit"],
        constraints=[
            "强制使用 gstack 技能（/browse /qa /qa-only /canary）验证问题真实性",
            "产出分析文档: docs/{docs_subdir}/analysis.md",
            "识别技术风险",
            "验收标准具体可测试",
            f"工作目录: {work_dir}"
        ],
        verification={"command": f"test -f {work_dir}/docs/{docs_subdir}/analysis.md"},
        output=f"{work_dir}/docs/{docs_subdir}/analysis.md"
    )
    save_project(project, data)
    print("✅ analyst-review 添加成功")
    print()

    # 添加 pm-review (pm) - 依赖 analyst-review
    print("📝 添加 pm-review (pm) - 依赖 analyst-review...")
    data["stages"]["pm-review"] = make_stage(
        agent_id="pm",
        task=f"""产品分析（PRD）：{goal}

## 📁 工作目录
- 项目路径: {work_dir}
- 分析文档: {work_dir}/docs/{docs_subdir}/analysis.md
- PRD 位置: {work_dir}/docs/{docs_subdir}/prd.md
- Specs 目录: {work_dir}/docs/{docs_subdir}/specs/

## 你的任务
1. 基于 analysis.md 创建 PRD
2. 定义 Epic/Story 和验收标准（每个可写 expect() 断言）
3. 创建 specs/ 目录存放详细规格
4. 每个功能点必须有 DoD (Definition of Done)

## 功能点格式
| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | xxx | xxx | expect(...) | 【需页面集成】 |

## PRD 格式规范（必须包含以下章节）
1. **执行摘要** — 背景/目标/成功指标
2. **Epic 拆分** — Epic/Story 表格（含工时估算）
3. **验收标准** — 每个 Story 可测试的 expect() 条目
4. **DoD (Definition of Done)** — 研发完成的判断标准

## PRD 格式校验（自检后再提交）
- [ ] 执行摘要包含：背景 + 目标 + 成功指标
- [ ] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [ ] 每个 Story 有可写的 expect() 断言
- [ ] DoD 章节存在且具体

## 驳回红线
- PRD 缺少执行摘要/Epic拆分/验收标准/DoD 任一章节 → 驳回补充
- 功能点模糊，无法写 expect() → 驳回
- 验收标准缺失 → 驳回
- 涉及页面但未标注【需页面集成】→ 驳回
""",
        depends_on=["analyst-review"],
        constraints=[
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
    print("✅ pm-review 添加成功")
    print()

    # 添加 architect-review (architect) - 依赖 pm-review
    print("📝 添加 architect-review (architect) - 依赖 pm-review...")
    data["stages"]["architect-review"] = make_stage(
        agent_id="architect",
        task=f"""架构设计：{goal}

## 📁 工作目录
- 项目路径: {work_dir}
- PRD 文档: {work_dir}/docs/{docs_subdir}/prd.md
- 架构文档: {work_dir}/docs/{docs_subdir}/architecture.md
- 实施计划: {work_dir}/docs/{docs_subdir}/IMPLEMENTATION_PLAN.md
- 开发约束: {work_dir}/docs/{docs_subdir}/AGENTS.md

## 你的任务
1. 基于 PRD 设计系统架构
2. 输出 architecture.md
3. 输出 IMPLEMENTATION_PLAN.md（实施计划）
4. 输出 AGENTS.md（开发约束）
5. 接口文档完整
6. 评估性能影响

## 驳回红线
- 架构设计不可行 → 驳回
- 接口定义不完整 → 驳回
- 缺少 IMPLEMENTATION_PLAN.md 或 AGENTS.md → 驳回
""",
        depends_on=["pm-review"],
        constraints=[
            "兼容现有架构",
            "接口文档完整",
            "评估性能影响",
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
    print("✅ architect-review 添加成功")
    print()

    # 添加 coord-decision (coord) - 依赖 architect-review
    print("📝 添加 coord-decision (coord) - 依赖 architect-review...")
    data["stages"]["coord-decision"] = make_stage(
        agent_id="coord",
        task=f"""决策：提案评审，决定是否开启阶段一

## 📁 工作目录
- 项目路径: {work_dir}

## 你的任务
1. 审阅所有产物文档
2. 逐项质量检查（见下方检查清单）
3. 做出决策：通过或驳回
4. 如通过，创建新的 phase1 项目（详见下方决策操作）
5. 如驳回，写清驳回原因 + 修改要求
5. 如驳回，写清驳回原因 + 修改要求

## 质量检查清单（必须逐项确认）

### analysis.md（analyst-review）
- [ ] 问题描述清晰，有复现步骤
- [ ] 使用 gstack 验证问题真实性
- [ ] 风险识别完整
- [ ] 验收标准具体可测试

### prd.md（pm-review）
- [ ] Epic/Story 划分合理
- [ ] 每个功能有验收标准（可写断言）
- [ ] DoD 明确
- [ ] 功能ID格式正确

### architecture.md（architect-review）
- [ ] 架构设计可行
- [ ] 包含 IMPLEMENTATION_PLAN.md
- [ ] 包含 AGENTS.md
- [ ] 性能影响已评估
- [ ] 接口文档完整

## 驳回标准
- 产物缺失检查清单任一项 → 驳回
- 问题描述不清晰 → 驳回
- 需求无法落地 → 驳回
- 架构不可行 → 驳回

## 决策操作（两步骤）
1. 通过后创建新项目（建 phase1）：
   task phase1 <new-project> "<目标描述>"
2. 创建成功后再标记 done：
   task update <project> coord-decision done
""",
        depends_on=["architect-review"],
        constraints=[
            "逐项检查清单，全部通过才能通过",
            "驳回必须有具体原因",
            "通过必须先执行 phase1 再 update done",
            f"工作目录: {work_dir}"
        ],
        verification={"command": "echo decision-done"},
        output=""
    )
    save_project(project, data)
    print("✅ coord-decision 添加成功")
    print()

    print("=" * 50)
    print("✅ 提案收集链创建完毕")
    print("=" * 50)
    print(f"👉 项目工作目录: {work_dir}")
    print(f"📄 核心交付物：")
    print(f"   - 提案: {work_dir}/proposals/{{date}}/{primary_agent}.md")
    print(f"   - 分析文档: {work_dir}/docs/{docs_subdir}/analysis.md")
    print(f"   - PRD 文档: {work_dir}/docs/{docs_subdir}/prd.md")
    print(f"   - 架构文档: {work_dir}/docs/{docs_subdir}/architecture.md")
    print(f"   - 实施计划: {work_dir}/docs/{docs_subdir}/IMPLEMENTATION_PLAN.md")
    print(f"   - 开发约束: {work_dir}/docs/{docs_subdir}/AGENTS.md")
    print()
    print("🎯 下一步：各 agent 领取 agent-submit 任务，提交提案")



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
    work_dir = args.work_dir or DEFAULT_WORK_DIR

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
3. **regenerate lockfile（npm 项目必须）**：`cd {work_dir} && rm -f package-lock.json && npm install && git add package-lock.json && git commit -m "chore: regenerate lockfile" --allow-empty`
4. 推送代码

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


# ── cmd_allow ─────────────────────────────────────────────────────

def cmd_allow(args):
    """开启阶段二：读取 PRD 检测 Epic，创建 phase2 任务链（coord-decision done 前置步骤）

    用法：
      task allow <project> coord-decision

    流程：
      1. 从 PRD 自动检测 Epic
      2. 调用 phase2 创建开发任务链
      3. coord-decision 状态保持 pending（等待手动 update done）
    """
    import re as _re

    project = args.project
    stage_id = args.stage  # 固定为 coord-decision

    project_file = task_file(project)
    if not os.path.exists(project_file):
        print(f"❌ 项目 {project} 不存在", file=sys.stderr)
        sys.exit(1)

    # 加载项目检查阶段一
    data = load_project(project)

    coord_decision = data["stages"].get("coord-decision", {})
    if coord_decision.get("status") == "done":
        print("⚠️  coord-decision 已 done，allow 无需重复执行")
        sys.exit(0)

    if coord_decision.get("status") not in ("pending", "ready"):
        print(f"⚠️  coord-decision 当前状态为 '{coord_decision.get('status')}'，allow 仅适用于 pending/ready")
        if not getattr(args, "force", False):
            print("💡 使用 --force 强制继续")
            sys.exit(1)

    # 自动检测 Epic
    proj_work_dir = data.get("workspace", DEFAULT_WORK_DIR)
    proj_docs_dir = f"{proj_work_dir}/docs/{project}"
    prd_file = f"{proj_docs_dir}/prd.md"
    epics_detected = []

    if os.path.exists(prd_file):
        try:
            content = open(prd_file, encoding="utf-8").read()
            for m in _re.finditer(r"^###\s+Epic\s+(\d+)[\s:]+(.+)$", content, _re.M):
                num, name = m.group(1), m.group(2).strip()
                if _re.search(r'[（\(]P[23][）\)]', name):
                    print(f"   ⏭️  跳过 {m.group(0).strip()}（P2/P3 延期）")
                    continue
                name = _re.sub(r'[（\(]P\d[）\)]', '', name).strip()
                epics_detected.append(f"Epic{num}-{name}")
            seen = set()
            epics_detected = [e for e in epics_detected if not (e in seen or seen.add(e))]
        except Exception as e:
            print(f"⚠️  读取 PRD 失败: {e}")
    else:
        print(f"⚠️  PRD 不存在: {prd_file}，请手动指定 --epics")
        sys.exit(1)

    if not epics_detected:
        print(f"❌ 未检测到 Epic，请手动指定：")
        print(f"   task phase2 {project} --epics \"Epic1-Feature1,Epic2-Feature2\" ...")
        sys.exit(1)

    print(f"📤 检测到 {len(epics_detected)} 个 Epic: {', '.join(epics_detected)}")
    print(f"🚀 触发 phase2 创建任务链...\n")

    # 调用 phase2
    auto_args = argparse.Namespace(
        project=project,
        epics=",".join(epics_detected),
        docs_subdir=project,
        work_dir=proj_work_dir,
        epic_deps=getattr(args, "epic_deps", None),
        force=getattr(args, "force", False),
        yes=True,
        no_check=True,
    )
    cmd_phase2(auto_args)

    print(f"\n✅ allow 完成：phase2 已创建")
    print(f"📌 下一步：手动标记 coord-decision done")
    print(f"   task update {project} coord-decision done")


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
            print("  请参考 HEARTBEAT.md 处理。")

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

    # failed is an alias for rejected (统一为 rejected)
    if new_status == "failed":
        new_status = "rejected"
        print(f"ℹ️  'failed' is now 'rejected'")

    valid = ("pending", "in-progress", "done", "skipped", "rejected", "blocked", "ready")
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
                    env=os.environ.copy(), capture_output=True, text=True, timeout=30
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

    # ── 先更新状态（phase2 需要从文件读 coord_decision）────────────

    # ── E3-F1: 提案完整性验证 ────────────────────────────────
    if new_status == "done" and stage_id.startswith("proposal-"):
        details = stage.get("details", {})
        proposal_file = details.get("proposalFile") or details.get("proposal_file")
        if proposal_file:
            repo = details.get("workDir") or details.get("work_dir") or "/root/.openclaw"
            proposal_path = os.path.join(repo, proposal_file)
            _validate_proposal_content(proposal_path)

    stage["status"] = new_status
    stage["updatedBy"] = "cli"   # CLI 触发的状态更新标识
    _log_update(args.project, stage_id, old_status, new_status, "cli")
    if new_status == "in-progress" and not stage.get("startedAt"):
        stage["startedAt"] = now_iso()
    elif new_status in ("done", "failed", "skipped"):
        stage["completedAt"] = now_iso()

    # ── E1-T1 / E4: Commit hash recording on done ────────────────
    if new_status == "done":
        result = validate_task_completion(args.project, stage_id, stage)
        if result["commit"]:
            stage["commit"] = result["commit"]
        for warning in result["warnings"]:
            print(warning)

    # ── 失败原因记录 ──────────────────────────────────────────────
    if new_status == "rejected":
        failure_reason = getattr(args, "failure_reason", None)
        if not failure_reason:
            print("❌ 必填信息: --failure-reason 不能为空")
            print(f"   用法: update {args.project} {stage_id} rejected --failure-reason \"具体原因\"")
            sys.exit(1)
        stage["failure_reason"] = failure_reason
        print(f"📝 失败原因已记录: {failure_reason}")

    if new_status == "blocked":
        blocked_reason = getattr(args, "blocked_reason", None)
        if not blocked_reason:
            print("❌ 必填信息: --blocked-reason 不能为空")
            print(f"   用法: update {args.project} {stage_id} blocked --blocked-reason \"具体原因\"")
            sys.exit(1)
        stage["blocked_reason"] = blocked_reason
        print(f"📝 阻塞原因已记录: {blocked_reason}")

    if "logs" not in stage:
        stage["logs"] = []
    stage["logs"].append({
        "time": now_iso(),
        "event": f"status: {old_status} → {new_status}" + (
            f" (reason: {getattr(args, 'failure_reason', None) or '未记录'})" if new_status == "rejected" else
            f" (reason: {getattr(args, 'blocked_reason', None) or '未记录'})" if new_status == "blocked" else ""
        ),
    })

    # ── done / rejected / blocked 统一通知 ─────────────────────
    # 所有保存统一在这里进行（在所有逻辑之后）
    needs_save = new_status in ("done", "rejected", "blocked")
    pending_save_rev = None  # 用于通知时获取最新 rev

    if needs_save:
        import subprocess
        notify_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "slack_notify_templates.py")
        current_stage = data["stages"][stage_id]
        task_desc = current_stage.get("task", stage_id)
        constraints = current_stage.get("constraints", [])
        output_path = current_stage.get("output", "")
        constraints_str = "; ".join(constraints) if constraints else ""

        if new_status == "done":
            # Wake up ALL downstream tasks (pending/rejected/blocked/in-progress), not just pending
            ready = compute_ready_tasks(data)
            # Also wake up rejected/blocked/in-progress tasks that depend on this stage
            all_downstream_woken = []
            for task_id, task in data["stages"].items():
                if task["status"] in ("done", "skipped"):
                    continue
                deps = task.get("dependsOn", [])
                if stage_id in deps and task["status"] != "ready":
                    old_status = task["status"]
                    task["status"] = "ready"
                    task.pop("completedAt", None)
                    task["updatedBy"] = "cli"
                    _log_update(args.project, task_id, old_status, "ready", "cli")
                    if "logs" not in task:
                        task["logs"] = []
                    task["logs"].append({
                        "time": now_iso(),
                        "event": f"status: {old_status} → ready (上游 {stage_id} 重新完成)",
                    })
                    all_downstream_woken.append(task_id)
            # Merge with pending tasks that are now ready
            ready = list(set(ready + all_downstream_woken))
            if "coord-decision" in ready:
                try:
                    subprocess.run([
                        "python3", notify_script,
                        "notify-ready", "coord",
                        f"{args.project}/coord-decision",
                        task_desc, constraints_str, output_path
                    ], env=os.environ.copy(), capture_output=True, text=True, timeout=10)
                    print(f"📤 已触发 coord-decision 通知到 #coord")
                except Exception as e:
                    print(f"⚠️ Failed to notify coord-decision: {e}", file=sys.stderr)
            # 按 task_id 逐条通知（不走 agent 去重，每个 epic 独立通知下游）
            for tid in ready:
                if tid == "coord-decision":
                    continue
                stage_info = data["stages"][tid]
                stage_agent = stage_info.get("agent", "dev")
                td = stage_info.get("task", tid)
                c = "; ".join(stage_info.get("constraints", [])) if stage_info.get("constraints") else ""
                op = stage_info.get("output", "")
                try:
                    subprocess.run([
                        "python3", notify_script,
                        "notify-ready", stage_agent,
                        f"{args.project}/{tid}",
                        td, c, op
                    ], env=os.environ.copy(), capture_output=True, text=True, timeout=10)
                    print(f"📤 已触发 {tid} 通知到 #{stage_agent}（{stage_info.get('status', 'ready')}）")
                except Exception as e:
                    print(f"⚠️ Failed to notify {tid}: {e}", file=sys.stderr)
            if ready:
                print(f"🟢 Unblocked: {', '.join(ready)}")
            elif data["status"] == "completed":
                print("🎉 All tasks completed!")

            # ── 级联唤醒 blocked 任务（依赖链下游的 blocked 任务）──
            # 当下游 rejected → ready 后，上游 done 无法自动触发 blocked 唤醒，
            # 需要在此处额外处理（最多递归 3 层，防止循环依赖）
            for _ in range(3):
                newly_unblocked = []
                for tid, t in data["stages"].items():
                    if t["status"] != "blocked":
                        continue
                    deps = t.get("dependsOn", [])
                    # 非阻塞状态：done（完成）/ skipped（跳过）/ ready（可领取但尚未完成）
                    all_deps_ready = all(
                        data["stages"].get(d, {}).get("status") in ("done", "skipped", "ready")
                        for d in deps
                    )
                    if all_deps_ready:
                        old_status = t["status"]
                        t["status"] = "ready"
                        t.pop("completedAt", None)
                        t["updatedBy"] = "cli"
                        _log_update(args.project, tid, old_status, "ready", "cli")
                        if "logs" not in t:
                            t["logs"] = []
                        t["logs"].append({
                            "time": now_iso(),
                            "event": f"status: blocked → ready (所有依赖已完成)",
                        })
                        newly_unblocked.append(tid)
                if not newly_unblocked:
                    break
                for tid in newly_unblocked:
                    t = data["stages"][tid]
                    ragent = t.get("agent", "dev")
                    rtd = t.get("task", tid)
                    rc = "; ".join(t.get("constraints", [])) if t.get("constraints") else ""
                    rop = t.get("output", "")
                    try:
                        subprocess.run([
                            "python3", notify_script,
                            "notify-ready", ragent,
                            f"{args.project}/{tid}", rtd, rc, rop
                        ], env=os.environ.copy(), capture_output=True, text=True, timeout=10)
                        print(f"📤 已级联唤醒 blocked 任务 {tid} → #{ragent}")
                    except Exception:
                        pass
                print(f"🟢 级联 Unblocked: {', '.join(newly_unblocked)}")

        elif new_status == "rejected":
            # ── rejected: 找上游阶段的 agent 并通知它 ─
            depends_on = current_stage.get("dependsOn", [])
            upstream_agent = None
            for dep in depends_on:
                dep_name = dep.split("/")[-1] if "/" in dep else dep
                dep_stage = data["stages"].get(dep_name, {})
                ua = dep_stage.get("agent")
                if ua and ua != "coord":
                    upstream_agent = ua
                    break
            # Fallback: 如果没有上游 agent（比如入口任务被驳回），通知当前 agent
            if upstream_agent is None:
                agent = current_stage.get("agent", stage_id.split("-")[0])
                upstream_agent = agent if agent not in ("coord",) else "dev"
            reason = stage.get("failure_reason", "（未记录原因）")
            title = f"{args.project}/{stage_id}（被驳回）"
            content = task_desc
            const = constraints_str
            out = output_path
            try:
                subprocess.run([
                    "python3", notify_script,
                    "notify-rejected", upstream_agent,
                    title, content, reason, const, out
                ], env=os.environ.copy(), capture_output=True, text=True, timeout=10)
                print(f"📤 已触发 rejected 通知到 #{upstream_agent}（驳回上游）")
            except Exception as e:
                print(f"⚠️ Failed to notify rejected: {e}", file=sys.stderr)

            # ── 重置上游 dev 任务为 ready（多次驳回场景：dev 已经是 done，触发新的领取通知）──
            for dep in depends_on:
                dep_name = dep.split("/")[-1] if "/" in dep else dep
                dep_stage = data["stages"].get(dep_name)
                if dep_stage and dep_stage.get("agent") == "dev" and dep_stage.get("status") in ("done", "rejected"):
                    old_status = dep_stage["status"]
                    dep_stage["status"] = "ready"
                    dep_stage.pop("completedAt", None)
                    dep_stage["updatedBy"] = "cli"
                    _log_update(args.project, dep_name, old_status, "ready", "cli")
                    if "logs" not in dep_stage:
                        dep_stage["logs"] = []
                    dep_stage["logs"].append({
                        "time": now_iso(),
                        "event": f"status: {old_status} → ready (下游驳回，重新开放)"
                    })
                    print(f"🔄 已将 {dep_name} 重置为 ready（触发新的领取通知）")

            # ── 把当前 rejected 任务自身也变回 ready，触发完整 wake_downstream ─
            old_status = current_stage["status"]
            current_stage["status"] = "ready"
            current_stage.pop("completedAt", None)
            current_stage["updatedBy"] = "cli"
            _log_update(args.project, stage_id, old_status, "ready", "cli")
            if "logs" not in current_stage:
                current_stage["logs"] = []
            current_stage["logs"].append({
                "time": now_iso(),
                "event": f"status: rejected → ready (下游完成，重新开放)",
            })
            print(f"🔄 已将 {stage_id} 自身从 rejected 变回 ready")

            # 触发完整 wake_downstream（与 done 分支同逻辑）
            ready_tasks = compute_ready_tasks(data)
            all_downstream_woken = []
            for tid, t in data["stages"].items():
                if t["status"] in ("done", "skipped"):
                    continue
                deps = t.get("dependsOn", [])
                if stage_id in deps and t["status"] != "ready":
                    t["status"] = "ready"
                    t.pop("completedAt", None)
                    t["updatedBy"] = "cli"
                    _log_update(args.project, tid, t["status"], "ready", "cli")
                    if "logs" not in t:
                        t["logs"] = []
                    t["logs"].append({
                        "time": now_iso(),
                        "event": f"status: {t['status']} → ready (上游 {stage_id} 重新完成)",
                    })
                    all_downstream_woken.append(tid)
            ready_tasks = list(set(ready_tasks + all_downstream_woken))
            if "coord-decision" in ready_tasks:
                ready_tasks.remove("coord-decision")
            for rtid in ready_tasks:
                rstage = data["stages"][rtid]
                ragent = rstage.get("agent", "dev")
                rtd = rstage.get("task", rtid)
                rc = "; ".join(rstage.get("constraints", [])) if rstage.get("constraints") else ""
                rop = rstage.get("output", "")
                try:
                    subprocess.run([
                        "python3", notify_script,
                        "notify-ready", ragent,
                        f"{args.project}/{rtid}", rtd, rc, rop
                    ], env=os.environ.copy(), capture_output=True, text=True, timeout=10)
                    print(f"📤 已触发 {rtid} 通知到 #{ragent}")
                except Exception:
                    pass

        elif new_status == "blocked":
            depends_on = current_stage.get("dependsOn", [])
            done_blockers = []
            for dep in depends_on:
                dep_name = dep.split("/")[-1] if "/" in dep else dep
                dep_stage = data["stages"].get(dep_name, {})
                if dep_stage.get("status") == "done":
                    done_blockers.append(dep)
            blocked_by_str = ", ".join(done_blockers) if done_blockers else "（未知）"
            reason = getattr(args, "blocked_reason", None) or f"被已完成任务 {blocked_by_str} 阻塞"
            try:
                subprocess.run([
                    "python3", notify_script,
                    "notify-blocked",
                    f"{args.project}/{stage_id}",
                    task_desc, reason, blocked_by_str, constraints_str, output_path
                ], env=os.environ.copy(), capture_output=True, text=True, timeout=10)
                print(f"📤 已触发 blocked 通知到 #coord")
            except Exception as e:
                print(f"⚠️ Failed to notify blocked: {e}", file=sys.stderr)

    # ── 文件锁：终态时自动释放 ──────────────────────────────────
    if new_status in ("done", "rejected", "blocked", "skipped"):
        released = _release_task_lock(args.project, stage_id)
        if released:
            print(f"🔓 文件锁已释放: {args.project}/{stage_id}")

    # ── 统一保存（DAG 和非 DAG 都在这里）────────────────────────
    # 统一保存（DAG 和非 DAG 都在这里）
    if data.get("mode") == "dag":
        check_dag_completion(data)
    data["updated"] = now_iso()
    new_rev = save_project_with_lock(args.project, data, expected_rev=expected_rev)
    print(f"💾 已保存 (rev {expected_rev} → {new_rev})")

    # Auto-append to MEMORY.md if --log-analysis was provided.
    if needs_save and args.log_analysis and HAS_LOG_ANALYSIS:
        append_to_memory(
            project=args.project,
            task_id=stage_id,
            summary=args.log_analysis,
            workspace=os.environ.get("WORKSPACE", "/root/.openclaw"),
        )


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
    stage["updatedBy"] = claiming_agent
    _log_update(args.project, stage_id, old_status, "in-progress", claiming_agent)
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

    # ── 文件锁：claim 时创建 ─────────────────────────────────────
    lock_ok = _acquire_task_lock(args.project, stage_id, claiming_agent)
    if lock_ok:
        print(f"🔐 文件锁已创建: {args.project}/{stage_id}")

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
    print("请参考 HEARTBEAT.md 处理。\n")
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


# ── cmd_exclude ───────────────────────────────────────────────────

def cmd_exclude(args):
    """将任务加入 / 从虚假完成白名单移除"""
    action = args.action  # "add" or "remove"
    project = args.project
    task_id = args.task_id

    whitelist_path = os.path.join(TEAM_TASKS_DIR_DEFAULT, ".false_completion_whitelist.txt")
    entry = f"{project}/{task_id}"

    # Load current whitelist
    entries = set()
    if os.path.exists(whitelist_path):
        with open(whitelist_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    entries.add(line)

    if action == "add":
        if entry in entries:
            print(f"⏭️  已存在白名单: {entry}")
        else:
            entries.add(entry)
            with open(whitelist_path, "a") as f:
                f.write(f"{entry}\n")
            print(f"✅ 已加入白名单: {entry}")
            print(f"   后续 false-completion 检测将跳过此任务")
    elif action == "remove":
        if entry not in entries:
            print(f"⏭️  不在白名单中: {entry}")
        else:
            entries.discard(entry)
            # Rewrite file without the entry
            with open(whitelist_path, "w") as f:
                for e in sorted(entries):
                    f.write(f"{e}\n")
            print(f"🗑️  已从白名单移除: {entry}")
    elif action == "list":
        if not entries:
            print("📋 白名单为空")
        else:
            print(f"📋 虚假完成白名单 ({len(entries)} 项):")
            for e in sorted(entries):
                print(f"   {e}")
    elif action == "clear":
        entries.clear()
        with open(whitelist_path, "w") as f:
            pass
        print("🗑️  白名单已清空")


def cmd_activate(args):
    """Set project status to active or completed"""
    tasks_file = task_file(args.project)
    if not os.path.exists(tasks_file):
        print(f"Error: project '{args.project}' not found", file=sys.stderr)
        sys.exit(1)
    with open(tasks_file) as f:
        data = json.load(f)

    old_status = data.get("status", "unknown")
    new_status = args.status

    if old_status == new_status:
        print(f"ℹ️  project '{args.project}' already status='{new_status}', no change")
        return

    data["status"] = new_status
    if new_status == "completed":
        data["completed_at"] = datetime.now(timezone.utc).isoformat()
    elif new_status == "active":
        data["completed_at"] = None

    atomic_write_json(tasks_file, data)
    print(f"✅ project '{args.project}' status: '{old_status}' → '{new_status}'")


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

    # ★ 提案收集链（唯一入口）
    p = sub.add_parser("proposals", help="★ 创建提案收集链 ★唯一入口★")
    p.add_argument("project", help="项目名称")
    p.add_argument("goal", help="项目目标描述")
    p.add_argument("--agent", "-a", default="analyst", help="提案提交 agent（默认：analyst）")
    p.add_argument("--docs-subdir", help="文档子目录（默认：项目名称）")
    p.add_argument("--work-dir", help="工作目录（默认：/root/.openclaw/vibex）")

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

    # allow（开启阶段二：coord-decision 通过后建 phase2，唯一入口）
    p = sub.add_parser("allow", help="★ 开启阶段二：创建 phase2 任务链（coord-decision 通过后执行）★")
    p.add_argument("project", help="项目名称")
    p.add_argument("stage", nargs="?", default="coord-decision", help="固定为 coord-decision")
    p.add_argument("--epics", "-e", help="Epic 列表（逗号分隔，默认从 PRD 自动检测）")
    p.add_argument("--epic-deps", help="Epic 依赖关系")
    p.add_argument("--force", action="store_true", help="强制继续")

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
    p = sub.add_parser("diagnose", help="诊断项目的失败和阻塞任务，发送原因通知")
    p.add_argument("project", help="项目名称")
    p.add_argument("--notify", action="store_true", help="自动发送通知（failed→agent, blocked→#coord）")
    p.add_argument("--notify-agent", action="store_true", help="仅发送 failed 通知给对应 agent")
    p.add_argument("--notify-coord", action="store_true", help="仅发送 blocked 通知给 #coord")

    p = sub.add_parser("update", help="更新任务状态")
    p.add_argument("project", help="项目名称")
    p.add_argument("stage", help="任务 ID")
    p.add_argument("status", help="状态: pending|in-progress|done|skipped|rejected|blocked（failed 已合并到 rejected）")
    p.add_argument("--log-analysis", "-l", help="Append summary to MEMORY.md on done")
    p.add_argument("--result", "-r", help="任务产出摘要（用于 gstack 验证）")
    p.add_argument("--skip-gstack-verify", action="store_true", help="跳过 gstack 验证（coord 专用）")
    p.add_argument("--failure-reason", help="失败原因（当 status=failed 时使用）")
    p.add_argument("--blocked-reason", help="阻塞原因（当 status=blocked 时使用）")

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

    p = sub.add_parser("activate", help="设置项目状态 (active | completed)")
    p.add_argument("project", help="项目名称")
    p.add_argument("status", choices=["active", "completed"], help="目标状态")

    # exclude（虚假完成白名单管理）
    p = sub.add_parser("exclude", help="管理虚假完成检测白名单")
    p.add_argument("action", choices=["add", "remove", "list", "clear"], help="操作")
    p.add_argument("project", nargs="?", help="项目名称")
    p.add_argument("task_id", nargs="?", help="任务 ID")

    p = sub.add_parser("clean-cooldown", help="Clean stale entries from cooldown.json")
    p.add_argument("--file", "-f", help="cooldown.json 路径")
    p.add_argument("--ttl-seconds", "-t", type=int, help="TTL 秒数（默认 86400）")

    # check-dup
    sub.add_parser("health", help="健康检查：测试 list/claim 执行时间")
    p = sub.add_parser("current-report", help="生成项目待决策报告（Ready任务 + 阻塞根因 + 空转提案）")
    p.add_argument("--json", action="store_true", help="输出 JSON 格式")
    p.add_argument("--workspace", default="/root/.openclaw/workspace-coord", help="工作空间路径")
    p.add_argument("--idle", type=int, default=None, help="连续空转次数")
    p.add_argument("--notify", action="store_true", help="生成后自动发送到 #coord 频道")

    p = sub.add_parser("check-dup", help="检查项目是否重复（提案去重）")
    p.add_argument("name", help="项目名称")
    p.add_argument("goal", nargs="?", default="", help="项目目标描述")
    p.add_argument("--workspace", "-w", help="工作目录")
    p.add_argument("--threshold", "-t", type=float, default=0.4, help="相似度阈值（默认 0.4）")

    p = sub.add_parser("check-lock", help="检查项目中未释放的任务锁（CI/git hook 用）")
    p.add_argument("project", help="项目名称")
    p.add_argument("--fix", action="store_true", help="自动释放孤儿锁")

    p = sub.add_parser("resign", help="强制重新签名项目文件（修复 _mac 损坏）")
    p.add_argument("project", help="项目名称")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)

    cmds = {
        "phase1": cmd_phase1,
        "phase2": cmd_phase2,
        "allow": cmd_allow,
        "proposals": cmd_proposals,
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
        "activate": cmd_activate,
        "clean-cooldown": cmd_clean_cooldown,
        "exclude": cmd_exclude,
        "check-dup": cmd_check_dup,
        "resign": cmd_resign,
        "check-lock": cmd_check_lock,
        "health": cmd_health,
        "current-report": cmd_current_report,
        "diagnose": cmd_diagnose,
    }

    if args.command not in cmds:
        print(f"Error: unknown command '{args.command}'", file=sys.stderr)
        print(f"Available commands: {', '.join(cmds.keys())}", file=sys.stderr)
        sys.exit(1)

    cmds[args.command](args)


# ── cmd_diagnose ──────────────────────────────────────────────────

# Agent → Slack Channel ID 映射（用于发送失败通知）
# Tokens 从环境变量读取（.env 文件），禁止硬编码
import os as _tm_os
_AGENT_CHANNEL_MAP = {
    "analyst":   ("C0ANZ3J40LT", _tm_os.environ.get("SLACK_TOKEN_ANALYST", "")),
    "architect": ("C0AP93CLPQU", _tm_os.environ.get("SLACK_TOKEN_ARCHITECT", "")),
    "pm":        ("C0APZP2JX2L", _tm_os.environ.get("SLACK_TOKEN_PM", "")),
    "dev":       ("C0AP92ZGC68", _tm_os.environ.get("SLACK_TOKEN_DEV", "")),
    "tester":    ("C0APJCNTKPB", _tm_os.environ.get("SLACK_TOKEN_TESTER", "")),
    "reviewer":  ("C0AP937RXEY", _tm_os.environ.get("SLACK_TOKEN_REVIEWER", "")),
    "coord":     ("C0AP3CPJL8N", _tm_os.environ.get("SLACK_TOKEN_COORD", "")),
}


def _send_slack_notification(channel_id: str, token: str, text: str) -> bool:
    """发送 Slack 消息，返回是否成功。"""
    import urllib.request
    import urllib.error
    payload = json.dumps({
        "channel": channel_id,
        "text": text,
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://slack.com/api/chat.postMessage",
        data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json; charset=utf-8",
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            return result.get("ok", False)
    except Exception:
        return False


def cmd_diagnose(args):
    """诊断失败(failed)和阻塞(blocked)任务，输出原因并可发送通知。"""
    project = args.project
    notify = getattr(args, "notify", False)
    notify_agent = getattr(args, "notify_agent", False)
    notify_coord = getattr(args, "notify_coord", False)

    # 默认为全面通知
    do_notify_agent = notify or notify_agent
    do_notify_coord = notify or notify_coord

    print(f"🔍 Diagnose: {project}")
    print("=" * 50)

    data = load_project(project)
    stages = data.get("stages", {})

    failed_tasks = []
    blocked_tasks = []

    for tid, stage in stages.items():
        status = stage.get("status")
        if status == "failed":
            failure_reason = stage.get("failure_reason", "（未记录原因）")
            agent = stage.get("agent", "unknown")
            completed_at = stage.get("completedAt", "（无时间）")
            failed_tasks.append({
                "task_id": tid,
                "agent": agent,
                "failure_reason": failure_reason,
                "completed_at": completed_at,
            })
        elif status == "pending":
            # 检查是否被已完成任务阻塞（blocked 逻辑参考 _blocked_analysis.py）
            depends_on = stage.get("dependsOn", [])
            if depends_on:
                done_blockers = []
                for dep in depends_on:
                    dep_key = dep if "/" in dep else f"{project}/{dep}"
                    dep_info = stages.get(dep.replace(f"{project}/", "").replace(dep, ""), {})
                    # 简化：直接查 stages
                    dep_stage_name = dep.split("/")[-1] if "/" in dep else dep
                    dep_stage = stages.get(dep_stage_name, {})
                    if dep_stage.get("status") == "done":
                        done_blockers.append(dep)
                if done_blockers:
                    blocked_tasks.append({
                        "task_id": tid,
                        "agent": stage.get("agent", "unknown"),
                        "blocked_by": done_blockers,
                        "root_cause": done_blockers[0],
                    })

    # ── 失败任务 ──────────────────────────────────────────────────
    print(f"\n❌ Failed 任务: {len(failed_tasks)}")
    if failed_tasks:
        for t in failed_tasks:
            print(f"\n  任务: {t['task_id']}")
            print(f"  Agent: {t['agent']}")
            print(f"  失败原因: {t['failure_reason']}")
            print(f"  时间: {t['completed_at']}")

            if do_notify_agent and t["agent"] in _AGENT_CHANNEL_MAP:
                channel_id, token = _AGENT_CHANNEL_MAP[t["agent"]]
                msg = (
                    f"🔴 任务失败通知\n"
                    f"项目: `{project}`\n"
                    f"任务: `{t['task_id']}`\n"
                    f"失败原因: {t['failure_reason']}\n"
                    f"时间: {t['completed_at']}\n\n"
                    f"请参考上方原因修复，或联系 coord 确认下一步。"
                )
                ok = _send_slack_notification(channel_id, token, msg)
                print(f"  📤 已通知 @{t['agent']}: {'✅' if ok else '❌'}")
    else:
        print("  （无）")

    # ── 阻塞任务 ──────────────────────────────────────────────────
    print(f"\n🚧 Blocked 任务: {len(blocked_tasks)}")
    if blocked_tasks:
        for t in blocked_tasks:
            print(f"\n  任务: {t['task_id']}")
            print(f"  Agent: {t['agent']}")
            print(f"  阻塞原因: 被已完成任务 {t['root_cause']} 阻塞（异常）")
            print(f"  阻塞依赖: {t['blocked_by']}")

            if do_notify_coord:
                channel_id, token = _AGENT_CHANNEL_MAP["coord"]
                msg = (
                    f"🚧 任务阻塞通知（需 coord 处理）\n"
                    f"项目: `{project}`\n"
                    f"任务: `{t['task_id']}`\n"
                    f"Agent: `{t['agent']}`\n"
                    f"阻塞原因: 被已完成任务 `{t['root_cause']}` 阻塞\n"
                    f"完整依赖: `{t['blocked_by']}`\n\n"
                    f"⚠️ 正常情况下已完成任务不应阻塞下游，请检查依赖关系是否正确。"
                )
                ok = _send_slack_notification(channel_id, token, msg)
                print(f"  📤 已通知 #coord: {'✅' if ok else '❌'}")
    else:
        print("  （无）")

    print("\n" + "=" * 50)
    if not failed_tasks and not blocked_tasks:
        print("✅ 未发现失败或阻塞任务")
    else:
        print(f"共 {len(failed_tasks)} 个 failed，{len(blocked_tasks)} 个 blocked")


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


# ── cmd_current_report ─────────────────────────────────────────────────

def cmd_current_report(args):
    """生成项目待决策报告（Ready任务 + 阻塞根因 + 空转提案）。"""
    import sys as _sys

    if not HAS_CURRENT_REPORT:
        print("❌ current_report 模块不可用", file=_sys.stderr)
        _sys.exit(1)

    tasks_path = args.workspace + "/team-tasks"

    try:
        from current_report import (
            get_ready_tasks,
            get_blocked_tasks,
            get_active_projects,
            detect_false_completions,
            get_server_info,
            format_text,
            format_json,
            format_slack_blocks,
        )
    except ImportError as e:
        print(f"❌ 导入失败: {e}", file=_sys.stderr)
        _sys.exit(1)

    try:
        ready = get_ready_tasks(tasks_path)
        blocked = get_blocked_tasks(tasks_path)
        active = get_active_projects(tasks_path)
        false_comp = detect_false_completions(tasks_path)
        server = get_server_info()
    except (OSError, IOError, ValueError) as e:
        print(f"❌ 数据读取失败: {e}", file=_sys.stderr)
        _sys.exit(1)

    if args.json:
        output = format_json(active, false_comp, server, ready, blocked)
        print(output)
    else:
        output = format_text(active, false_comp, server, ready, blocked)
        print(output)

    # Auto-send to #coord if --notify flag is set
    if getattr(args, "notify", False):
        try:
            import urllib.request
            import urllib.error
            token = _tm_os.environ.get("SLACK_TOKEN_COORD", "")
            channel_id = "C0AP3CPJL8N"
            # Use Block Kit if available, else fallback to plain text
            if 'format_slack_blocks' in dir():
                slack_payload = format_slack_blocks(active, false_comp, server, ready, blocked)
                slack_payload["channel"] = channel_id
            else:
                slack_payload = {
                    "channel": channel_id,
                    "text": f"```\n{output}\n```"
                }
            payload = json.dumps(slack_payload).encode("utf-8")
            req = urllib.request.Request(
                "https://slack.com/api/chat.postMessage",
                data=payload,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json; charset=utf-8",
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                if result.get("ok"):
                    print("\n✅ 已发送 Block Kit 报告到 #coord 频道", file=_sys.stderr)
                else:
                    print(f"\n⚠️ 发送失败: {result.get('error')}", file=_sys.stderr)
        except Exception as e:
            print(f"\n⚠️ 发送通知异常: {e}", file=_sys.stderr)

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
    print('CALLING MAIN', flush=True)
    main()
