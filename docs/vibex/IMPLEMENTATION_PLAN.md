# wow-harness OpenClaw 实装 — 实施计划

> **项目**: vibex
> **日期**: 2026-04-13
> **总工时**: ~14h
> **状态**: 待开发

---

## Epic 1: Review Agent 工具隔离（2h） ✅ done 216af89

---

### Story 1.1: Per-agent 工具白名单配置（1h） ✅ done

**实施**:
- `~/.openclaw/openclaw.json` reviewer agent 新增 `tools.sandbox.tools.allow` 配置
- 允许的工具: `Read`, `Grep`, `sessions_history`（3个，只读）
- 禁止工具隐式拒绝: Write, Edit, Bash, exec, applyPatch 等
- Config validated: `openclaw config validate` → valid ✅

**实施commit**: `216af89`

> ⚠️ **路径修正**: `tools.subagents.tools.deny` 不存在。正确路径为 `agents.list[].tools.sandbox.tools.allow`。

**开发文件**: `~/.openclaw/openclaw.json`

**修改内容**:

在 `agents.list` 中为 reviewer agent 添加 tools sandbox allow 白名单：

```json5
{
  agents: {
    list: [
      {
        id: "reviewer",
        workspace: "~/.openclaw/workspace-reviewer",
        tools: {
          sandbox: {
            tools: {
              allow: [
                "read",
                "grep",
                "sessions_history",
                "sessions_list",
                "session_status",
                "memory_search",
                "memory_get",
                "web_search",
                "web_fetch"
              ]
            }
          }
        }
      }
    ]
  }
}
```

**验收标准**:
```bash
# 验证配置：spawn reviewer agent 后，尝试调用 write/edit
# 期望: 工具被拒绝（不在 allow 列表）
# 尝试调用 read/sessions_history
# 期望: 工具可用
```

---

### Story 1.2: Per-agent 工具白名单测试（1h） ✅ done

**实施**:
- `~/.openclaw/agent-governance/tests/test_reviewer_tools.py`
- 7 个测试用例（7/7 pass）：
  - `test_reviewer_agent_has_tools_config`
  - `test_reviewer_has_allow_list`
  - `test_read_tools_allowed`
  - `test_write_tools_not_allowed`
  - `test_only_three_tools`
  - `test_allow_list_exact_values`
  - `test_is_schema_level_not_prompt_level`

**实施commit**: `216af89`

**注意**: OpenClaw 工具名为大写开头（`Read`, `Grep`），测试适配大小写

**开发文件**: `~/.openclaw/agent-governance/tests/test_reviewer_tools.py`

**测试用例**:

```python
def test_reviewer_agent_allow_list():
    """验证 reviewer agent 的 allow 白名单只含读操作"""
    config = load_openclaw_config()
    reviewer_agent = next(a for a in config["agents"]["list"] if a["id"] == "reviewer")
    allow_list = reviewer_agent["tools"]["sandbox"]["tools"]["allow"]
    assert "read" in allow_list
    assert "grep" in allow_list
    assert "sessions_history" in allow_list
    # 写操作不应在 allow 列表
    assert "write" not in allow_list
    assert "edit" not in allow_list
    assert "exec" not in allow_list
    assert "apply_patch" not in allow_list
```

---

## Epic 2: D8 机械化 Progress Check（4h）

---

### Story 2.1: run_d8_check 函数（1h）

**开发文件**: `~/.openclaw/skills/team-tasks/scripts/task_manager.py`

**新增函数**:

```python
def run_d8_check(
    repo: str = "/root/.openclaw/vibex",
    commands: list = None,
    timeout: int = 300
) -> dict:
    """执行 D8 机械化检查"""
    if commands is None:
        commands = ["pnpm build", "pnpm test"]
    results = {"build": None, "test": None, "passed": False, "errors": []}
    for cmd in commands:
        try:
            r = subprocess.run(
                cmd, shell=True, cwd=repo,
                capture_output=True, text=True, timeout=timeout
            )
            label = "build" if "build" in cmd else "test"
            results[label] = r.returncode
            if r.returncode != 0:
                results["errors"].append(f"{label} failed (exit {r.returncode})")
        except subprocess.TimeoutExpired:
            results["errors"].append(f"{cmd} timeout (>300s)")
            results[label] = -1
        except FileNotFoundError:
            results["errors"].append(f"command not found: {cmd.split()[0]}")
            results[label] = -2
    results["passed"] = all(v == 0 for v in [results.get("build"), results.get("test")] 
                            if isinstance(v, int) and v >= 0)
    return results
```

---

### Story 2.2: write_progress_json 函数（0.5h）

**开发文件**: 同上

```python
def write_progress_json(status: str, task: str, errors: list = None):
    """D8 检查后写入 progress.json"""
    import json
    from datetime import datetime
    path = Path("~/.openclaw/progress.json").expanduser()
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump({
            "task": task,
            "status": status,
            "timestamp": datetime.utcnow().isoformat(),
            "errors": errors or []
        }, f, indent=2)
```

---

### Story 2.3: task_manager D8 钩子（1.5h）

**开发文件**: `~/.openclaw/skills/team-tasks/scripts/task_manager.py`

**修改点**: 在 `validate_task_completion()` 函数中增加 D8 检查调用：

```python
def validate_task_completion(project, stage_id, stage_info, old_status=None, repo=DEFAULT_WORK_DIR):
    # ... 现有 commit 检查逻辑 ...
    
    # E2: D8 机械化检查（仅在 status == "done" 时触发）
    if old_status == "done" or "done" in str(stage_info.get("status", "")):
        d8 = run_d8_check(repo=repo)
        write_progress_json(
            "pass" if d8["passed"] else "fail",
            f"{project}/{stage_id}",
            d8["errors"]
        )
        if not d8["passed"]:
            warnings.append(f"D8 CHECK FAILED: {'; '.join(d8['errors'])}")
            return {"valid": False, "warnings": warnings, "commit": current_commit}
```

---

### Story 2.4: D8 测试覆盖（1h）

**开发文件**: `~/.openclaw/skills/team-tasks/scripts/test_d8_check.py`

**测试用例**（mock subprocess）:

```python
def test_d8_both_pass(monkeypatch):
    monkeypatch.setattr(subprocess, "run", Mock(returncode=0))
    result = run_d8_check()
    assert result["passed"] is True

def test_d8_build_fail(monkeypatch):
    def fake_run(cmd, **kwargs):
        if "build" in cmd: return Mock(returncode=1, stderr="build error")
        return Mock(returncode=0)
    monkeypatch.setattr(subprocess, "run", fake_run)
    result = run_d8_check()
    assert result["passed"] is False
    assert "build failed" in result["errors"][0]

def test_progress_json_write(tmp_path, monkeypatch):
    monkeypatch.setattr(Path, "expanduser", lambda self: tmp_path / str(self).replace("~/.openclaw/", ""))
    write_progress_json("pass", "vibex/test", [])
    assert (tmp_path / "progress.json").exists()
```

---

## Epic 3: Loop Detection + Session Reflection（4h）

---

### Story 3.1: agent-governance 目录创建（0.5h）

**创建目录**: `~/.openclaw/agent-governance/`

**创建文件结构**:
```
~/.openclaw/agent-governance/
├── __init__.py
├── config.json          # 集中配置（阈值、开关）
├── loop_detector.py
├── metrics_collector.py
├── pattern_db.py
└── sessions/            # 每个 session 一个 state 文件
```

---

### Story 3.2: LoopDetector 实现（1.5h）

**开发文件**: `~/.openclaw/agent-governance/loop_detector.py`

**核心逻辑**: 按文件路径追踪 edit/exec/write 调用次数，超阈值返回警告文本。

**关键方法**:
- `record_edit(file_path, tool)` → `Optional[str]`（警告文本或 None）
- `get_edit_count(file_path)` → `int`
- `reset_file(file_path)` → `None`
- `save()` → 持久化到 `sessions/{session_id}.json`

---

### Story 3.3: MetricsCollector 实现（1h）

**开发文件**: `~/.openclaw/agent-governance/metrics_collector.py`

**核心逻辑**: 记录 tool 调用频次、guard 命中数，session 结束时追加写入 metrics.jsonl。

**关键方法**:
- `record_tool(tool: str)` → `None`
- `record_guard_hit(guard: str)` → `None`
- `set_agent_type(agent_type: str)` → `None`
- `write()` → 追加写入 `sessions/{session_id}/metrics.jsonl`

---

### Story 3.4: SOUL.md Loop Detection 集成（1h）

> ⚠️ **方案修正**: task_manager.py 无法拦截 agent 的 edit/write 调用，改为通过 SOUL.md system prompt 注入。

**开发文件**: `~/.openclaw/workspace-<agentId>/SOUL.md`（各 agent workspace）

**修改内容**: 在 SOUL.md 末尾追加 Loop Detection 集成片段：

```markdown
## Loop Detection Integration

每次执行 `edit` 或 `write` 工具后，立即调用：

```bash
python3 -c "
import sys, os, json
sys.path.insert(0, '/root/.openclaw/agent-governance')
from loop_detector import LoopDetector
from metrics_collector import MetricsCollector

session_id = os.environ.get('OPENCLAW_SESSION_ID', 'unknown')
file_path = '<FILL_IN_FILE_PATH>'
tool = '<FILL_IN_TOOL>'

d = LoopDetector(session_id)
m = MetricsCollector(session_id)
w = d.record_edit(file_path, tool)
if w: print(w)
m.record_tool(tool)
m.write()
"
```

**填充说明**:
- `<FILL_IN_FILE_PATH>`: 替换为 edit/write 工具操作的实际文件路径
- `<FILL_IN_TOOL>`: 替换为 "edit" 或 "write"

**Metrics 自动写入**: MetricsCollector.write() 在每次调用后执行（append-only，无性能问题）。

---

## Epic 4: Risk Tracking + Pattern Learning（4h）

---

### Story 4.1: Pattern DB 初始化（1h）

**开发文件**: `~/.openclaw/failure-patterns.jsonl`

**初始化数据**（≥10 条）:

```jsonl
{"type": "SyntaxError", "pattern": "SyntaxError.*Unexpected token", "solution": "Check for missing commas, brackets, or semicolons"}
{"type": "TypeError", "pattern": "TypeError.*Cannot read property", "solution": "Verify object exists before accessing properties"}
{"type": "BuildError", "pattern": "pnpm.*build.*failed", "solution": "Run pnpm build locally"}
{"type": "ImportError", "pattern": "Cannot find module.*", "solution": "Verify import path and installation"}
{"type": "TSError", "pattern": "TS[0-9]+:.*", "solution": "Run tsc --noEmit"}
{"type": "TestFail", "pattern": "FAIL.*test.*", "solution": "Run test with --verbose"}
{"type": "MergeConflict", "pattern": "<<<<<<.*======.*>>>>>>", "solution": "Resolve merge conflicts manually"}
{"type": "LinterError", "pattern": "ESLint.*error", "solution": "Run eslint --fix"}
{"type": "RuntimeCrash", "pattern": "ReferenceError.*is not defined", "solution": "Check variable scoping"}
{"type": "TimeoutError", "pattern": "Timeout.*exceeded", "solution": "Increase timeout or optimize"}
{"type": "CircularDep", "pattern": "Circular dependency detected", "solution": "Review imports and refactor"}
{"type": "AuthError", "pattern": "401.*Unauthorized", "solution": "Refresh auth token or re-login"}
```

---

### Story 4.2: Pattern Lookup 接口（1h）

**开发文件**: `~/.openclaw/agent-governance/pattern_db.py`

```python
def lookup_pattern(error_msg: str) -> Optional[dict]:
    """模糊匹配，返回最匹配的 pattern"""
    ...

def add_pattern(entry: dict) -> None:
    """追加新 pattern"""
    ...
```

---

### Story 4.3: Risk 高频警告（1h）

**开发文件**: `~/.openclaw/agent-governance/metrics_collector.py`

在 `MetricsCollector` 中增加高频检测：

```python
RISK_THRESHOLDS = {"exec": 20, "edit": 10, "write": 5}

def check_risk_warnings(self) -> Optional[str]:
    """检查高频操作，返回警告文本"""
    warnings = []
    for tool, count in self.data["toolCalls"].items():
        threshold = RISK_THRESHOLDS.get(tool, float("inf"))
        if count >= threshold:
            warnings.append(
                f"⚠️ High frequency {tool}: {count} calls detected. "
                f"Consider if this is productive or a loop."
            )
            self.record_guard_hit("risk_warnings")
    return "\n".join(warnings) if warnings else None
```

---

### Story 4.4: Pattern DB + Metrics 测试覆盖（1h）

**开发文件**: `~/.openclaw/agent-governance/tests/`

```python
def test_pattern_lookup_exact():
    result = lookup_pattern("SyntaxError: Unexpected token in parse")
    assert result["type"] == "SyntaxError"
    assert "solution" in result

def test_pattern_lookup_no_match():
    result = lookup_pattern("totally unknown error xyz")
    assert result is None

def test_metrics_tool_counting():
    mc = MetricsCollector("test")
    for _ in range(5): mc.record_tool("edit")
    assert mc.data["toolCalls"]["edit"] == 5

def test_risk_warning_trigger():
    mc = MetricsCollector("test")
    for _ in range(21): mc.record_tool("exec")
    warning = mc.check_risk_warnings()
    assert warning is not None
    assert "exec" in warning
```

---

## 完整测试命令

```bash
# E1: 工具策略验证
python3 -c "import json; c=json.load(open('/root/.openclaw/openclaw.json')); print('deny:', c['tools']['subagents']['tools']['deny'])"

# E2: D8 检查（本地）
cd /root/.openclaw
python3 -m pytest skills/team-tasks/scripts/test_d8_check.py -v

# E3: Loop Detector
python3 -m pytest ~/.openclaw/agent-governance/tests/test_loop_detector.py -v

# E4: Pattern DB
python3 -m pytest ~/.openclaw/agent-governance/tests/test_pattern_db.py -v

# 完整集成测试
python3 -m pytest ~/.openclaw/agent-governance/tests/ -v

# 手动验证
python3 -c "
from agent_governance.loop_detector import LoopDetector
d = LoopDetector('manual-test')
for i in range(6):
    w = d.record_edit('src/test.ts')
    print(f'Edit {i+1}: warning={w is not None}')
"
```

---

*实施计划: 待开发*
*Next: Dev 领取 → 按 Epic 顺序实现 → Tester 覆盖 → Reviewer 审查*
