#!/usr/bin/env python3
"""Task Scheduler - 并行任务调度器

支持 DAG 依赖解析、并行度可配置、状态持久化
"""

import json
import os
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Set

# 配置
TEAM_TASKS_DIR = os.environ.get("TEAM_TASKS_DIR", "/root/.openclaw/workspace-coord/team-tasks")
LOCK_DIR = os.environ.get("LOCK_DIR", "/var/run/task-lock")
MAX_PARALLEL = int(os.environ.get("MAX_PARALLEL", "4"))
MAX_DEV_PARALLEL = int(os.environ.get("MAX_DEV_PARALLEL", "3"))
MAX_BUILD_PARALLEL = int(os.environ.get("MAX_BUILD_PARALLEL", "1"))


class TaskType(Enum):
    ANALYSIS = "analysis"
    PRD = "prd"
    ARCHITECTURE = "arch"
    DEVELOPMENT = "dev"
    BUILD = "build"
    TEST = "test"
    REVIEW = "review"


class TaskPriority(Enum):
    P0 = "P0"  # 紧急
    P1 = "P1"  # 高
    P2 = "P2"  # 中
    P3 = "P3"  # 低


class TaskStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in-progress"
    DONE = "done"
    FAILED = "failed"


@dataclass
class Task:
    """任务定义"""
    project: str
    stage: str
    agent: str
    task: str = ""
    task_type: TaskType = TaskType.DEVELOPMENT
    priority: TaskPriority = TaskPriority.P2
    depends_on: List[str] = field(default_factory=list)
    file_paths: List[str] = field(default_factory=list)
    estimated_duration: int = 30  # 预估时长（分钟）
    status: TaskStatus = TaskStatus.PENDING
    started_at: Optional[str] = None
    completed_at: Optional[str] = None


@dataclass
class DispatchResult:
    """派发结果"""
    dispatched: List[Task] = field(default_factory=list)
    queued: List[Task] = field(default_factory=list)
    blocked: List[Task] = field(default_factory=list)
    reason: str = ""


def get_task_type_from_agent(agent: str) -> TaskType:
    """根据 agent 类型推断任务类型"""
    agent_lower = agent.lower()
    if "analyst" in agent_lower:
        return TaskType.ANALYSIS
    elif "pm" in agent_lower:
        return TaskType.PRD
    elif "architect" in agent_lower:
        return TaskType.ARCHITECTURE
    elif "dev" in agent_lower:
        return TaskType.DEVELOPMENT
    elif "tester" in agent_lower:
        return TaskType.TEST
    elif "reviewer" in agent_lower:
        return TaskType.REVIEW
    else:
        return TaskType.DEVELOPMENT


def get_priority_from_stage(stage: str) -> TaskPriority:
    """根据 stage 推断优先级"""
    stage_lower = stage.lower()
    if "coord" in stage_lower:
        return TaskPriority.P0
    elif "init" in stage_lower:
        return TaskPriority.P1
    elif "impl" in stage_lower:
        return TaskPriority.P2
    elif "test" in stage_lower:
        return TaskPriority.P2
    elif "review" in stage_lower:
        return TaskPriority.P3
    else:
        return TaskPriority.P2


def task_file(project: str) -> str:
    return os.path.join(TEAM_TASKS_DIR, f"{project}.json")


def load_project(project: str) -> Optional[dict]:
    """加载项目任务数据"""
    path = task_file(project)
    if not os.path.exists(path):
        return None
    try:
        with open(path) as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return None


def save_project(project: str, data: dict):
    """保存项目任务数据"""
    path = task_file(project)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def get_all_projects() -> List[str]:
    """获取所有项目"""
    if not os.path.exists(TEAM_TASKS_DIR):
        return []
    return [f.replace(".json", "") for f in os.listdir(TEAM_TASKS_DIR) if f.endswith(".json")]


class DAGParser:
    """DAG 依赖解析器"""
    
    def __init__(self, project_data: dict):
        self.project_data = project_data
        self.stages = project_data.get("stages", {})
    
    def get_dependencies(self, stage: str) -> List[str]:
        """获取任务的依赖列表"""
        stage_data = self.stages.get(stage, {})
        return stage_data.get("dependsOn", [])
    
    def is_ready(self, stage: str) -> bool:
        """检查任务是否就绪（所有依赖都已完成）"""
        deps = self.get_dependencies(stage)
        if not deps:
            return True
        
        for dep in deps:
            dep_status = self.stages.get(dep, {}).get("status", "")
            if dep_status != "done":
                return False
        return True
    
    def get_ready_stages(self) -> List[str]:
        """获取所有就绪的任务"""
        ready = []
        for stage, data in self.stages.items():
            status = data.get("status", "")
            if status == "pending" and self.is_ready(stage):
                ready.append(stage)
        return ready


class TaskScheduler:
    """任务调度器"""
    
    def __init__(self):
        self.lock_dir = LOCK_DIR
        os.makedirs(self.lock_dir, exist_ok=True)
    
    def get_ready_tasks(self, project: Optional[str] = None) -> List[Task]:
        """
        获取就绪任务
        
        Args:
            project: 项目名（可选，不传则扫描所有项目）
            
        Returns:
            就绪任务列表（按优先级排序）
        """
        tasks = []
        projects = [project] if project else get_all_projects()
        
        for proj in projects:
            data = load_project(proj)
            if not data:
                continue
            
            parser = DAGParser(data)
            ready_stages = parser.get_ready_stages()
            
            for stage in ready_stages:
                stage_data = data["stages"].get(stage, {})
                task = Task(
                    project=proj,
                    stage=stage,
                    agent=stage_data.get("agent", "dev"),
                    task=stage_data.get("task", ""),
                    task_type=get_task_type_from_agent(stage_data.get("agent", "dev")),
                    priority=get_priority_from_stage(stage),
                    depends_on=parser.get_dependencies(stage),
                    status=TaskStatus.PENDING,
                )
                tasks.append(task)
        
        # 按优先级排序
        priority_order = {TaskPriority.P0: 0, TaskPriority.P1: 1, TaskPriority.P2: 2, TaskPriority.P3: 3}
        tasks.sort(key=lambda t: priority_order.get(t.priority, 99))
        
        return tasks
    
    def get_running_tasks(self, project: Optional[str] = None) -> List[Task]:
        """获取运行中的任务"""
        tasks = []
        projects = [project] if project else get_all_projects()
        
        for proj in projects:
            data = load_project(proj)
            if not data:
                continue
            
            for stage, stage_data in data.get("stages", {}).items():
                status = stage_data.get("status", "")
                if status == "in-progress":
                    task = Task(
                        project=proj,
                        stage=stage,
                        agent=stage_data.get("agent", "dev"),
                        task=stage_data.get("task", ""),
                        task_type=get_task_type_from_agent(stage_data.get("agent", "dev")),
                        priority=get_priority_from_stage(stage),
                        status=TaskStatus.IN_PROGRESS,
                        started_at=stage_data.get("startedAt"),
                    )
                    tasks.append(task)
        
        return tasks
    
    def check_conflicts(self, task: Task) -> List[str]:
        """
        检查任务冲突
        
        Args:
            task: 待检查任务
            
        Returns:
            冲突列表（空列表表示无冲突）
        """
        conflicts = []
        
        # 检查是否有运行中的任务涉及相同文件
        running = self.get_running_tasks()
        for running_task in running:
            # 检查文件路径冲突
            common_files = set(task.file_paths) & set(running_task.file_paths)
            if common_files:
                conflicts.append(f"文件冲突: {running_task.project}/{running_task.stage}")
        
        # 检查构建任务冲突
        if task.task_type == TaskType.BUILD:
            build_running = [t for t in running if t.task_type == TaskType.BUILD]
            if len(build_running) >= MAX_BUILD_PARALLEL:
                conflicts.append("构建队列已满")
        
        return conflicts
    
    def get_parallel_capacity(self) -> int:
        """获取当前可用并行槽位"""
        running = self.get_running_tasks()
        
        # 计算各类型任务并行数
        dev_running = len([t for t in running if t.task_type == TaskType.DEVELOPMENT])
        build_running = len([t for t in running if t.task_type == TaskType.BUILD])
        
        # 计算可用槽位
        dev_capacity = max(0, MAX_DEV_PARALLEL - dev_running)
        build_capacity = max(0, MAX_BUILD_PARALLEL - build_running)
        
        return dev_capacity + build_capacity
    
    def dispatch_parallel(self, tasks: Optional[List[Task]] = None) -> DispatchResult:
        """
        并行派发任务
        
        Args:
            tasks: 就绪任务列表（可选，不传则自动获取）
            
        Returns:
            派发结果
        """
        if tasks is None:
            tasks = self.get_ready_tasks()
        
        result = DispatchResult()
        
        # 按任务类型分组
        dev_tasks = [t for t in tasks if t.task_type == TaskType.DEVELOPMENT]
        build_tasks = [t for t in tasks if t.task_type == TaskType.BUILD]
        other_tasks = [t for t in tasks if t.task_type not in [TaskType.DEVELOPMENT, TaskType.BUILD]]
        
        # 计算可用槽位
        running = self.get_running_tasks()
        dev_running = len([t for t in running if t.task_type == TaskType.DEVELOPMENT])
        build_running = len([t for t in running if t.task_type == TaskType.BUILD])
        
        dev_capacity = MAX_DEV_PARALLEL - dev_running
        build_capacity = MAX_BUILD_PARALLEL - build_running
        
        # 派发开发任务
        for task in dev_tasks[:dev_capacity]:
            conflicts = self.check_conflicts(task)
            if conflicts:
                result.blocked.append(task)
            else:
                result.dispatched.append(task)
        
        # 派发构建任务
        for task in build_tasks[:build_capacity]:
            conflicts = self.check_conflicts(task)
            if conflicts:
                result.blocked.append(task)
            else:
                result.dispatched.append(task)
        
        # 其他任务（不受并行度限制）
        for task in other_tasks:
            conflicts = self.check_conflicts(task)
            if conflicts:
                result.blocked.append(task)
            else:
                result.dispatched.append(task)
        
        return result
    
    def acquire_lock(self, task: Task) -> bool:
        """
        获取任务锁
        
        Args:
            task: 任务
            
        Returns:
            是否成功获取锁
        """
        lock_file = os.path.join(self.lock_dir, f"{task.project}_{task.stage}.lock")
        if os.path.exists(lock_file):
            return False
        
        try:
            with open(lock_file, "w") as f:
                f.write(json.dumps({
                    "project": task.project,
                    "stage": task.stage,
                    "agent": task.agent,
                    "acquired_at": datetime.now(timezone.utc).isoformat(),
                }))
            return True
        except IOError:
            return False
    
    def release_lock(self, task: Task) -> None:
        """
        释放任务锁
        """
        lock_file = os.path.join(self.lock_dir, f"{task.project}_{task.stage}.lock")
        if os.path.exists(lock_file):
            os.remove(lock_file)
    
    def get_status(self) -> dict:
        """获取调度器状态"""
        running = self.get_running_tasks()
        ready = self.get_ready_tasks()
        
        return {
            "max_parallel": MAX_PARALLEL,
            "max_dev_parallel": MAX_DEV_PARALLEL,
            "max_build_parallel": MAX_BUILD_PARALLEL,
            "running_count": len(running),
            "dev_running": len([t for t in running if t.task_type == TaskType.DEVELOPMENT]),
            "build_running": len([t for t in running if t.task_type == TaskType.BUILD]),
            "ready_count": len(ready),
            "capacity": self.get_parallel_capacity(),
        }


def main():
    """CLI 入口"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Task Scheduler")
    parser.add_argument("command", choices=["ready", "status", "dispatch", "locks"],
                        help="命令")
    parser.add_argument("--project", "-p", help="项目名")
    parser.add_argument("--verbose", "-v", action="store_true", help="详细输出")
    
    args = parser.parse_args()
    
    scheduler = TaskScheduler()
    
    if args.command == "ready":
        tasks = scheduler.get_ready_tasks(args.project)
        print(f"就绪任务 ({len(tasks)}):")
        for task in tasks:
            print(f"  - {task.project}/{task.stage} [{task.priority.value}] ({task.task_type.value})")
    
    elif args.command == "status":
        status = scheduler.get_status()
        print(f"调度器状态:")
        print(f"  最大并行: {status['max_parallel']}")
        print(f"  开发并行: {status['dev_running']}/{status['max_dev_parallel']}")
        print(f"  构建并行: {status['build_running']}/{status['max_build_parallel']}")
        print(f"  就绪任务: {status['ready_count']}")
        print(f"  可用槽位: {status['capacity']}")
    
    elif args.command == "dispatch":
        result = scheduler.dispatch_parallel()
        print(f"派发结果:")
        print(f"  已派发: {len(result.dispatched)}")
        print(f"  已排队: {len(result.queued)}")
        print(f"  被阻塞: {len(result.blocked)}")
        for task in result.dispatched:
            print(f"    - {task.project}/{task.stage}")
    
    elif args.command == "locks":
        lock_dir = scheduler.lock_dir
        if os.path.exists(lock_dir):
            locks = [f for f in os.listdir(lock_dir) if f.endswith(".lock")]
            print(f"活跃锁 ({len(locks)}):")
            for lock in locks:
                print(f"  - {lock}")
        else:
            print("无活跃锁")


if __name__ == "__main__":
    main()
