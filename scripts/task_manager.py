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
"""

import argparse
import json
import os
import signal
import sys
from datetime import datetime, timezone

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

TASKS_DIR = os.environ.get("TEAM_TASKS_DIR", "/home/ubuntu/clawd/data/team-tasks")


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
    return os.path.join(TASKS_DIR, f"{project}.json")


def load_project(project: str) -> dict:
    path = task_file(project)
    if not os.path.exists(path):
        print(f"Error: project '{project}' not found at {path}", file=sys.stderr)
        sys.exit(1)
    with open(path) as f:
        return json.load(f)


def save_project(project: str, data: dict):
    path = task_file(project)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


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
        constraints=[
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
        constraints=[
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
    print(f"📋 Project: {data['project']}")
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
    data = load_project(args.project)
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
        save_project(args.project, data)
        print(f"✅ {stage_id}: {old_status} → {new_status}")

        if new_status == "done":
            ready = compute_ready_tasks(data)
            if ready:
                print(f"🟢 Unblocked: {', '.join(ready)}")
            elif data["status"] == "completed":
                print("🎉 All tasks completed!")

            # Auto-append to MEMORY.md if --log-analysis was provided.
            if args.log_analysis and HAS_LOG_ANALYSIS:
                append_to_memory(
                    project=args.project,
                    task_id=stage_id,
                    summary=args.log_analysis,
                    workspace=os.environ.get("WORKSPACE", "/root/.openclaw"),
                )
    else:
        data["updated"] = now_iso()
        save_project(args.project, data)
        print(f"✅ {stage_id}: {old_status} → {new_status}")


# ── cmd_claim ──────────────────────────────────────────────────────

@timeout(5)
def cmd_claim(args):
    """领取任务"""
    data = load_project(args.project)
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
    save_project(args.project, data)

    # 输出任务详情
    print(f"✅ Claimed: {stage_id}")
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
    """列出所有项目"""
    os.makedirs(TASKS_DIR, exist_ok=True)
    files = [f for f in os.listdir(TASKS_DIR) if f.endswith(".json")]
    if not files:
        print("No projects found.")
        return

    for f in sorted(files):
        name = f.replace(".json", "")
        try:
            with open(os.path.join(TASKS_DIR, f)) as fh:
                data = json.load(fh)
            goal = data.get("goal", "")[:50]
            status = data.get("status", "unknown")
            mode = data.get("mode", "linear")
            done = sum(1 for t in data.get("stages", {}).values()
                       if t.get("status") in ("done", "skipped"))
            total = len(data.get("stages", {}))
            print(f"  {name} [{status}] ({done}/{total}) mode={mode} {goal}")
        except Exception:
            print(f"  {name} [error reading]")


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
    sub.add_parser("list", help="列出所有项目")

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
    p = sub.add_parser("clean-cooldown", help="Clean stale entries from cooldown.json")
    p.add_argument("--file", "-f", help="cooldown.json 路径")
    p.add_argument("--ttl-seconds", "-t", type=int, help="TTL 秒数（默认 86400）")

    # check-dup
    sub.add_parser("health", help="健康检查：测试 list/claim 执行时间")

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
        "clean-cooldown": cmd_clean_cooldown,
        "check-dup": cmd_check_dup,
        "health": cmd_health,
    }

    if args.command not in cmds:
        print(f"Error: unknown command '{args.command}'", file=sys.stderr)
        print(f"Available commands: {', '.join(cmds.keys())}", file=sys.stderr)
        sys.exit(1)

    cmds[args.command](args)


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
