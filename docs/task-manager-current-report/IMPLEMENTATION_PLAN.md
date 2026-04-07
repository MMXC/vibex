# Implementation Plan: task_manager.py current-report（决策导向版）

> **项目**: task-manager-current-report
> **阶段**: Phase1 — D1+D2+D3 决策要素实现
> **版本**: 2.0.0
> **日期**: 2026-03-30
> **Architect**: Architect Agent
> **工作目录**: /root/.openclaw/vibex

---

## 1. 概述

### 1.1 目标
基于 PRD v2 实现决策导向的 `current-report` 命令，替代旧版（基于旧 PRD v1）。

### 1.2 核心变更
- ❌ 删除：虚假完成检测、服务器信息（对 Coord 决策无用）
- ✅ 新增：D1 Ready 决策建议、D2 阻塞根因分析、D3 空转提案推荐

### 1.3 依赖关系

```
d1_ready_analyzer.py (新建)
    ↓
d2_blocked_analyzer.py (新建)
    ↓
d3_proposal_recommender.py (新建)
    ↓
report_generator.py (新建)
    ↓
CLI 集成 (修改 task_manager.py)
    ↓
测试 (pytest)
```

---

## 2. 文件变更详情

### 2.1 新建: `src/task_manager/current_report/__init__.py`

```python
"""Decision-oriented current-report module"""

from .d1_ready_analyzer import analyze_ready_tasks, ReadyTask
from .d2_blocked_analyzer import analyze_blocked_tasks, BlockedTask
from .d3_proposal_recommender import scan_proposals, rank_proposals, Proposal
from .report_generator import generate_report, format_as_text, format_as_json, DecisionReport

__all__ = [
    'analyze_ready_tasks',
    'ReadyTask',
    'analyze_blocked_tasks',
    'BlockedTask',
    'scan_proposals',
    'rank_proposals',
    'Proposal',
    'generate_report',
    'format_as_text',
    'format_as_json',
    'DecisionReport'
]
```

### 2.2 新建: `src/task_manager/current_report/d1_ready_analyzer.py`

```python
"""
D1: Ready 任务决策建议分析器

功能:
1. 扫描 pending 任务
2. 检查 dependsOn 是否全部 done
3. 计算等待时长
4. 生成决策建议（do it now / skip / lower priority）
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional, Dict, Any


@dataclass
class ReadyTask:
    project: str
    task_id: str
    agent: str
    depends_on: List[str] = field(default_factory=list)
    waiting_minutes: int = 0
    decision: str = ""  # "do it now" | "skip" | "lower priority"
    reason: str = ""
    blocked_by: Optional[str] = None


def analyze_ready_tasks(tasks_json: Dict[str, Any], now: Optional[datetime] = None) -> List[ReadyTask]:
    """
    分析 Ready 任务并生成决策建议
    
    Args:
        tasks_json: tasks.json 数据
        now: 当前时间（用于测试）
    
    Returns:
        ReadyTask 列表，按等待时长降序排列
    """
    if now is None:
        now = datetime.now()
    
    ready_tasks: List[ReadyTask] = []
    
    for project_name, project in tasks_json.get("projects", {}).items():
        for task in project.get("tasks", []):
            if task["status"] != "pending":
                continue
            
            depends_on = task.get("dependsOn", [])
            
            # 检查依赖是否全部 done
            if not all(is_task_done(tasks_json, dep, project_name) for dep in depends_on):
                continue  # 跳过，不满足 ready 条件
            
            # 计算等待时长
            done_at_times = [
                get_task_done_at(tasks_json, dep, project_name)
                for dep in depends_on
            ]
            max_done_at = max(done_at_times) if done_at_times else now
            waiting_minutes = int((now - max_done_at).total_seconds() / 60)
            
            # 判断依赖链位置
            downstream = get_downstream_tasks(tasks_json, task["id"], project_name)
            is_terminal = len(downstream) == 0
            
            if is_terminal:
                decision = "do it now"
                reason = "下游任务在等待此任务"
            else:
                decision = "lower priority"
                reason = f"有 {len(downstream)} 个下游任务在等待其他任务"
            
            ready_tasks.append(ReadyTask(
                project=project_name,
                task_id=task["id"],
                agent=task.get("agent", "unknown"),
                depends_on=depends_on,
                waiting_minutes=waiting_minutes,
                decision=decision,
                reason=reason
            ))
    
    # 按等待时长降序排列
    return sorted(ready_tasks, key=lambda t: t.waiting_minutes, reverse=True)


def is_task_done(tasks_json: Dict[str, Any], task_id: str, project_name: str) -> bool:
    """检查任务是否已 done"""
    for proj_name, project in tasks_json.get("projects", {}).items():
        for task in project.get("tasks", []):
            if task["id"] == task_id:
                return task.get("status") == "done"
    return False


def get_task_done_at(tasks_json: Dict[str, Any], task_id: str, project_name: str) -> datetime:
    """获取任务完成时间"""
    for project in tasks_json.get("projects", {}).values():
        for task in project.get("tasks", []):
            if task["id"] == task_id:
                done_at = task.get("doneAt")
                if done_at:
                    return datetime.fromisoformat(done_at.replace("Z", "+00:00"))
    return datetime.now()


def get_downstream_tasks(tasks_json: Dict[str, Any], task_id: str, project_name: str) -> List[str]:
    """获取依赖指定任务的下游任务"""
    downstream = []
    for project in tasks_json.get("projects", {}).values():
        for task in project.get("tasks", []):
            if task_id in task.get("dependsOn", []):
                downstream.append(task["id"])
    return downstream
```

### 2.3 新建: `src/task_manager/current_report/d2_blocked_analyzer.py`

```python
"""
D2: 阻塞任务根因分析器

功能:
1. 检测 blocked 任务
2. 分类根因（agent_down / dependency_not_done / unknown）
3. 生成建议动作
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any


AGENT_DOWN_THRESHOLD_MINUTES = 30


@dataclass
class BlockedTask:
    project: str
    task_id: str
    agent: str
    root_cause: str  # "agent_down" | "dependency_not_done" | "unknown"
    root_cause_detail: str
    blocked_minutes: int = 0
    suggested_action: str = ""  # "降级 pending" | "人工介入" | "等待"
    agent_last_active: Optional[datetime] = None


def analyze_blocked_tasks(
    tasks_json: Dict[str, Any],
    now: Optional[datetime] = None
) -> List[BlockedTask]:
    """
    分析阻塞任务并定位根因
    """
    if now is None:
        now = datetime.now()
    
    blocked_tasks: List[BlockedTask] = []
    
    for project_name, project in tasks_json.get("projects", {}).items():
        for task in project.get("tasks", []):
            if task.get("status") != "blocked":
                continue
            
            agent = task.get("agent", "unknown")
            last_active = get_agent_last_active(tasks_json, agent, now)
            blocked_minutes = calculate_blocked_minutes(task, now)
            
            # 检查依赖是否未完成
            depends_on = task.get("dependsOn", [])
            unfinished_deps = [
                dep for dep in depends_on
                if not is_task_done(tasks_json, dep, project_name)
            ]
            
            if unfinished_deps:
                root_cause = "dependency_not_done"
                root_cause_detail = f"依赖未完成: {', '.join(unfinished_deps)}"
                suggested_action = "等待依赖完成"
                agent_last_active = None
            elif last_active:
                inactive_minutes = (now - last_active).total_seconds() / 60
                if inactive_minutes > AGENT_DOWN_THRESHOLD_MINUTES:
                    root_cause = "agent_down"
                    root_cause_detail = f"{agent} 已 {inactive_minutes:.0f} 分钟无活跃"
                    suggested_action = "人工介入"
                else:
                    root_cause = "agent_idle"
                    root_cause_detail = f"{agent} 最后活跃于 {last_active.strftime('%H:%M')}"
                    suggested_action = "等待"
            else:
                root_cause = "unknown"
                root_cause_detail = "无法确定 agent 状态"
                suggested_action = "人工介入"
            
            blocked_tasks.append(BlockedTask(
                project=project_name,
                task_id=task["id"],
                agent=agent,
                root_cause=root_cause,
                root_cause_detail=root_cause_detail,
                blocked_minutes=blocked_minutes,
                suggested_action=suggested_action,
                agent_last_active=last_active
            ))
    
    return blocked_tasks


def get_agent_last_active(
    tasks_json: Dict[str, Any],
    agent: str,
    now: datetime
) -> Optional[datetime]:
    """获取 agent 最后活跃时间"""
    latest = None
    
    for project in tasks_json.get("projects", {}).values():
        for task in project.get("tasks", []):
            if task.get("agent") != agent:
                continue
            
            # 检查 startedAt
            if "startedAt" in task:
                try:
                    started = datetime.fromisoformat(task["startedAt"].replace("Z", "+00:00"))
                    if latest is None or started > latest:
                        latest = started
                except (ValueError, TypeError):
                    pass
            
            # 检查 doneAt
            if "doneAt" in task:
                try:
                    done = datetime.fromisoformat(task["doneAt"].replace("Z", "+00:00"))
                    if latest is None or done > latest:
                        latest = done
                except (ValueError, TypeError):
                    pass
    
    return latest


def calculate_blocked_minutes(task: Dict[str, Any], now: datetime) -> int:
    """计算任务阻塞时长"""
    blocked_at = task.get("blockedAt") or task.get("startedAt")
    if blocked_at:
        try:
            blocked_time = datetime.fromisoformat(blocked_at.replace("Z", "+00:00"))
            return int((now - blocked_time).total_seconds() / 60)
        except (ValueError, TypeError):
            pass
    return 0


def is_task_done(tasks_json: Dict[str, Any], task_id: str, project_name: str) -> bool:
    """检查任务是否已 done"""
    for project in tasks_json.get("projects", {}).values():
        for task in project.get("tasks", []):
            if task["id"] == task_id:
                return task.get("status") == "done"
    return False
```

### 2.4 新建: `src/task_manager/current_report/d3_proposal_recommender.py`

```python
"""
D3: 空转提案推荐器

功能:
1. 扫描 proposals/ 目录下的未完成提案
2. 综合评分排序
3. 返回 Top3
"""

from dataclasses import dataclass
from typing import List, Optional, Dict, Any
import os
import re
import glob


AGENT_SCORES = {
    "dev": 8,
    "analyst": 7,
    "architect": 8,
    "pm": 7,
    "tester": 7,
    "reviewer": 6,
    "coord": 6
}


@dataclass
class Proposal:
    name: str
    proposer: str
    priority: int  # 1-5, 1 最高
    target_users: int
    estimated_cost: float  # 人天
    score: float = 0.0
    file_path: str = ""


def scan_proposals(proposals_dir: str = "proposals") -> List[Proposal]:
    """扫描提案库，返回未完成提案"""
    proposals: List[Proposal] = []
    
    if not os.path.exists(proposals_dir):
        return proposals
    
    # 扫描所有 proposals/<date>/ 目录
    for date_dir in glob.glob(f"{proposals_dir}/*/"):
        for md_file in glob.glob(f"{date_dir}/*.md"):
            if is_proposal_complete(md_file):
                continue
            
            proposal = parse_proposal(md_file)
            if proposal:
                proposals.append(proposal)
    
    return proposals


def rank_proposals(proposals: List[Proposal], top_n: int = 3) -> List[Proposal]:
    """
    提案排名算法
    
    综合分数 = 0.5×agent评分 + 0.3×目标用户数归一化 + 0.2×(1-成本归一化)
    """
    if not proposals:
        return []
    
    max_users = max((p.target_users for p in proposals), default=1)
    max_cost = max((p.estimated_cost for p in proposals), default=1)
    
    for p in proposals:
        agent_score = AGENT_SCORES.get(p.proposer, 5)
        users_norm = p.target_users / max_users
        cost_norm = 1 - (p.estimated_cost / max_cost) if max_cost > 0 else 0
        p.score = 0.5 * agent_score + 0.3 * users_norm + 0.2 * cost_norm
    
    return sorted(proposals, key=lambda p: p.score, reverse=True)[:top_n]


def is_proposal_complete(file_path: str) -> bool:
    """检查提案是否已完成"""
    return "completed" in os.path.basename(file_path).lower()


def parse_proposal(file_path: str) -> Optional[Proposal]:
    """解析提案文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        name = os.path.basename(file_path).replace('.md', '')
        proposer = extract_field(content, 'proposer') or "unknown"
        priority = int(extract_field(content, 'priority') or 3)
        target_users = int(extract_field(content, 'target_users') or 1)
        cost = float(extract_field(content, 'estimated_cost') or 
                     extract_field(content, '成本') or 2.0)
        
        return Proposal(
            name=name,
            proposer=proposer,
            priority=priority,
            target_users=target_users,
            estimated_cost=cost,
            file_path=file_path
        )
    except Exception:
        return None


def extract_field(content: str, field: str) -> Optional[str]:
    """从 markdown 内容中提取字段"""
    patterns = [
        rf'{field}:\s*(.+)',
        rf'\*\*{field}\*\*:\s*(.+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return None
```

### 2.5 新建: `src/task_manager/current_report/report_generator.py`

```python
"""
决策报告生成器

整合 D1 + D2 + D3 输出
"""

from dataclasses import dataclass, asdict
from datetime import datetime
from typing import List, Dict, Any
import json


@dataclass
class DecisionReport:
    """决策报告完整数据结构"""
    generated_at: str
    ready_tasks: List[Dict[str, Any]]
    blocked_tasks: List[Dict[str, Any]]
    idle: Dict[str, Any]


def generate_report(
    tasks_json: Dict[str, Any],
    consecutive_idle: int = 0,
    proposals_dir: str = "proposals"
) -> DecisionReport:
    """生成完整决策报告"""
    from .d1_ready_analyzer import analyze_ready_tasks
    from .d2_blocked_analyzer import analyze_blocked_tasks
    from .d3_proposal_recommender import scan_proposals, rank_proposals
    
    # D1: Ready 任务分析
    ready_tasks_raw = analyze_ready_tasks(tasks_json)
    ready_tasks = [
        {
            "project": t.project,
            "task_id": t.task_id,
            "agent": t.agent,
            "waiting_min": t.waiting_minutes,
            "decision": t.decision,
            "reason": t.reason,
            "depends_on": t.depends_on
        }
        for t in ready_tasks_raw
    ]
    
    # D2: Blocked 任务分析
    blocked_tasks_raw = analyze_blocked_tasks(tasks_json)
    blocked_tasks = [
        {
            "project": t.project,
            "task_id": t.task_id,
            "root_cause": t.root_cause,
            "root_cause_detail": t.root_cause_detail,
            "blocked_min": t.blocked_minutes,
            "suggested_action": t.suggested_action
        }
        for t in blocked_tasks_raw
    ]
    
    # D3: 空转提案推荐
    proposals = scan_proposals(proposals_dir)
    top_proposals = rank_proposals(proposals, top_n=3)
    idle_proposals = [
        {
            "name": p.name,
            "proposer": p.proposer,
            "rank": i + 1,
            "score": round(p.score, 2)
        }
        for i, p in enumerate(top_proposals)
    ]
    
    # 统计活跃项目数
    active_count = sum(
        1 for p in tasks_json.get("projects", {}).values()
        if p.get("status") == "active"
    )
    
    return DecisionReport(
        generated_at=datetime.now().isoformat(),
        ready_tasks=ready_tasks,
        blocked_tasks=blocked_tasks,
        idle={
            "active": active_count,
            "ready": len(ready_tasks),
            "consecutive_idle": consecutive_idle,
            "top_proposals": idle_proposals
        }
    )


def format_as_text(report: DecisionReport) -> str:
    """格式化为人类可读的文本报告"""
    lines = [
        "=== Coord Decision Report ===",
        f"Generated: {report.generated_at}",
        "",
        "--- Ready to Execute ---"
    ]
    
    if not report.ready_tasks:
        lines.append("📋 None")
    else:
        for task in report.ready_tasks:
            lines.append(
                f"📋 {task['project']}/{task['task_id']} [{task['agent']}]\n"
                f"   依赖: {', '.join(task['depends_on']) or 'none'} ✅\n"
                f"   等待: {task['waiting_min']}min\n"
                f"   决策: ✅ {task['decision']} — {task['reason']}"
            )
    
    lines.extend(["", "--- Blocked Tasks ---"])
    if not report.blocked_tasks:
        lines.append("🔴 None")
    else:
        for task in report.blocked_tasks:
            lines.append(
                f"🔴 {task['project']}/{task['task_id']} blocked\n"
                f"   原因: {task['root_cause_detail']}\n"
                f"   建议: {task['suggested_action']}"
            )
    
    idle = report.idle
    lines.extend([
        "",
        "--- Idle Status ---",
        f"⏳ {idle['active']} active | 📋 {idle['ready']} ready | 连续空转: {idle['consecutive_idle']}/3"
    ])
    
    if idle['consecutive_idle'] >= 3 and idle['top_proposals']:
        lines.append("   → 提案库 Top 推荐:")
        for p in idle['top_proposals']:
            lines.append(f"   → Top{p['rank']}: {p['name']} [{p['proposer']}]")
        lines.append("   → 输入 y 确认拉起 Top1，n 跳过")
    
    return "\n".join(lines)


def format_as_json(report: DecisionReport) -> str:
    """格式化为 JSON"""
    return json.dumps(asdict(report), indent=2, ensure_ascii=False)
```

### 2.6 修改: `task_manager.py`

```python
# 添加 current-report 子命令

def add_current_report_command(subparsers):
    parser = subparsers.add_parser(
        'current-report',
        help='生成 Coord 决策报告'
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='输出 JSON 格式'
    )
    parser.add_argument(
        '--proposals-dir',
        default='proposals',
        help='提案库目录（默认: proposals）'
    )
    parser.add_argument(
        '--idle-count',
        type=int,
        default=0,
        help='连续空转次数（默认: 0）'
    )
    return parser


def handle_current_report(args, tasks_json):
    """处理 current-report 命令"""
    import json
    from pathlib import Path
    
    # 生成报告
    from task_manager.current_report import generate_report, format_as_text, format_as_json
    
    report = generate_report(
        tasks_json,
        consecutive_idle=args.idle_count,
        proposals_dir=args.proposals_dir
    )
    
    # 输出
    if args.json:
        print(format_as_json(report))
    else:
        print(format_as_text(report))
```

---

## 3. 测试

### 3.1 单元测试

```bash
# 运行所有测试
pytest tests/task_manager/current_report/ -v

# 覆盖率
pytest tests/task_manager/current_report/ --cov=src/task_manager/current_report --cov-report=term-missing
```

### 3.2 集成测试

```bash
# 测试 CLI
python -m task_manager current-report
python -m task_manager current-report --json
python -m task_manager current-report --json | python -m json.tool
```

---

## 4. 估计工时

| 任务 | 估计 |
|------|------|
| D1 Ready 分析器 | 1h |
| D2 Blocked 分析器 | 1h |
| D3 提案推荐器 | 1h |
| 报告生成器 | 0.5h |
| CLI 集成 | 0.5h |
| 测试 | 1h |
| **总计** | **~5h** |

---

## 5. 验收标准

- [ ] `current-report` 命令存在且返回 0
- [ ] Ready 任务含"决策建议"字段
- [ ] Blocked 任务含"根因"字段
- [ ] 空转时显示提案库 Top3
- [ ] 执行时间 < 2 秒
- [ ] --json 输出 valid JSON
- [ ] 单元测试覆盖率 > 80%

---

*本文档由 Architect Agent 生成*
