#!/usr/bin/env python3
"""Build Queue - 构建队列

任务排队、优先级管理、并发控制
支持 FIFO + 优先级队列，集成 IOPS 限制
"""

import json
import os
import subprocess
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import List, Optional, Dict
import threading

# 配置
QUEUE_DIR = os.environ.get("QUEUE_DIR", "/var/run/build-queue")
MAX_CONCURRENT_BUILDS = int(os.environ.get("MAX_CONCURRENT_BUILDS", "1"))
QUEUE_LOCK_TIMEOUT = int(os.environ.get("QUEUE_LOCK_TIMEOUT", "3600"))  # 1小时


class QueueStatus(Enum):
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"


class TaskPriority(Enum):
    HIGH = 0    # 高优先级
    NORMAL = 1  # 普通优先级
    LOW = 2     # 低优先级


@dataclass
class QueuedTask:
    """队列任务"""
    id: str
    project: str
    command: str
    priority: TaskPriority = TaskPriority.NORMAL
    added_at: str = ""
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    status: str = "queued"  # queued, running, completed, failed, cancelled
    output: str = ""
    exit_code: Optional[int] = None
    
    def __lt__(self, other):
        # 用于优先级队列排序
        if self.priority != other.priority:
            return self.priority < other.priority
        return self.added_at < other.added_at


@dataclass
class QueueStats:
    """队列统计"""
    total_queued: int = 0
    total_completed: int = 0
    total_failed: int = 0
    current_running: int = 0
    average_wait_time: float = 0.0


class BuildQueue:
    """构建队列管理器"""
    
    def __init__(self):
        self.queue_dir = QUEUE_DIR
        os.makedirs(self.queue_dir, exist_ok=True)
        
        self.queue_file = os.path.join(self.queue_dir, "queue.json")
        self.lock_file = os.path.join(self.queue_dir, "lock")
        self.stats_file = os.path.join(self.queue_dir, "stats.json")
        
        self._lock = threading.Lock()
        self._init_queue()
    
    def _init_queue(self):
        """初始化队列文件"""
        if not os.path.exists(self.queue_file):
            self._save_queue([])
        if not os.path.exists(self.stats_file):
            self._save_stats(QueueStats())
    
    def _load_queue(self) -> List[QueuedTask]:
        """加载队列"""
        try:
            with open(self.queue_file, "r") as f:
                data = json.load(f)
                return [QueuedTask(**item) for item in data]
        except (json.JSONDecodeError, IOError):
            return []
    
    def _save_queue(self, queue: List[QueuedTask]):
        """保存队列"""
        with open(self.queue_file, "w") as f:
            json.dump([vars(task) for task in queue], f, indent=2, ensure_ascii=False)
    
    def _load_stats(self) -> QueueStats:
        """加载统计"""
        try:
            with open(self.stats_file, "r") as f:
                data = json.load(f)
                return QueueStats(**data)
        except (json.JSONDecodeError, IOError):
            return QueueStats()
    
    def _save_stats(self, stats: QueueStats):
        """保存统计"""
        with open(self.stats_file, "w") as f:
            json.dump(vars(stats), f, indent=2)
    
    def enqueue(self, project: str, command: str, priority: TaskPriority = TaskPriority.NORMAL) -> str:
        """
        添加任务到队列
        
        Args:
            project: 项目名
            command: 构建命令
            priority: 优先级
            
        Returns:
            任务 ID
        """
        with self._lock:
            queue = self._load_queue()
            
            # 生成任务 ID
            task_id = f"{project}_{int(time.time() * 1000)}"
            
            task = QueuedTask(
                id=task_id,
                project=project,
                command=command,
                priority=priority,
                added_at=datetime.now(timezone.utc).isoformat(),
            )
            
            queue.append(task)
            
            # 按优先级排序
            queue.sort()
            
            self._save_queue(queue)
            
            # 更新统计
            stats = self._load_stats()
            stats.total_queued += 1
            self._save_stats(stats)
            
            return task_id
    
    def dequeue(self) -> Optional[QueuedTask]:
        """
        获取下一个待执行任务
        
        Returns:
            任务（如果没有则返回 None）
        """
        with self._lock:
            queue = self._load_queue()
            
            # 找到第一个 queued 状态的任务
            for task in queue:
                if task.status == "queued":
                    return task
            
            return None
    
    def get_task(self, task_id: str) -> Optional[QueuedTask]:
        """获取指定任务"""
        queue = self._load_queue()
        for task in queue:
            if task.id == task_id:
                return task
        return None
    
    def update_task_status(self, task_id: str, status: str, exit_code: Optional[int] = None, output: str = ""):
        """更新任务状态"""
        with self._lock:
            queue = self._load_queue()
            
            for task in queue:
                if task.id == task_id:
                    task.status = status
                    if status == "running":
                        task.started_at = datetime.now(timezone.utc).isoformat()
                    elif status in ["completed", "failed", "cancelled"]:
                        task.completed_at = datetime.now(timezone.utc).isoformat()
                        task.exit_code = exit_code
                        task.output = output
                    
                    # 更新统计
                    stats = self._load_stats()
                    if status == "running":
                        stats.current_running += 1
                    elif status == "completed":
                        stats.current_running = max(0, stats.current_running - 1)
                        stats.total_completed += 1
                    elif status == "failed":
                        stats.current_running = max(0, stats.current_running - 1)
                        stats.total_failed += 1
                    
                    self._save_stats(stats)
                    break
            
            self._save_queue(queue)
    
    def cancel_task(self, task_id: str) -> bool:
        """取消任务"""
        with self._lock:
            queue = self._load_queue()
            
            for task in queue:
                if task.id == task_id and task.status == "queued":
                    task.status = "cancelled"
                    task.completed_at = datetime.now(timezone.utc).isoformat()
                    self._save_queue(queue)
                    return True
            
            return False
    
    def get_queue_status(self) -> Dict:
        """获取队列状态"""
        queue = self._load_queue()
        stats = self._load_stats()
        
        queued_tasks = [t for t in queue if t.status == "queued"]
        running_tasks = [t for t in queue if t.status == "running"]
        completed_tasks = [t for t in queue if t.status == "completed"]
        failed_tasks = [t for t in queue if t.status == "failed"]
        
        return {
            "status": QueueStatus.RUNNING.value if running_tasks else QueueStatus.IDLE.value,
            "max_concurrent": MAX_CONCURRENT_BUILDS,
            "current_running": len(running_tasks),
            "queued_count": len(queued_tasks),
            "total_completed": stats.total_completed,
            "total_failed": stats.total_failed,
            "tasks": {
                "queued": [
                    {
                        "id": t.id,
                        "project": t.project,
                        "command": t.command,
                        "priority": t.priority.name,
                        "added_at": t.added_at,
                    }
                    for t in queued_tasks
                ],
                "running": [
                    {
                        "id": t.id,
                        "project": t.project,
                        "command": t.command,
                        "started_at": t.started_at,
                    }
                    for t in running_tasks
                ],
            }
        }
    
    def clear_completed(self, before_days: int = 7):
        """清理已完成任务"""
        with self._lock:
            queue = self._load_queue()
            cutoff = datetime.now(timezone.utc).timestamp() - (before_days * 86400)
            
            # 保留 running 和最近的任务
            filtered = []
            for task in queue:
                if task.status in ["running", "queued"]:
                    filtered.append(task)
                elif task.completed_at:
                    try:
                        completed_time = datetime.fromisoformat(task.completed_at.replace("Z", "+00:00")).timestamp()
                        if completed_time > cutoff:
                            filtered.append(task)
                    except (ValueError, OSError):
                        filtered.append(task)
            
            self._save_queue(filtered)
    
    def acquire_lock(self, project: str) -> bool:
        """
        获取项目构建锁
        
        Args:
            project: 项目名
            
        Returns:
            是否成功获取锁
        """
        lock_path = os.path.join(self.lock_file, f"{project}.lock")
        
        try:
            os.makedirs(self.lock_file, exist_ok=True)
            
            # 检查锁是否存在且未过期
            if os.path.exists(lock_path):
                try:
                    with open(lock_path, "r") as f:
                        lock_data = json.load(f)
                        acquired_at = datetime.fromisoformat(lock_data["acquired_at"])
                        age = (datetime.now(timezone.utc) - acquired_at).total_seconds()
                        
                        # 如果锁超过超时时间，强制释放
                        if age > QUEUE_LOCK_TIMEOUT:
                            os.remove(lock_path)
                        else:
                            return False
                except (json.JSONDecodeError, IOError, ValueError, OSError):
                    return False
            
            # 创建新锁
            with open(lock_path, "w") as f:
                json.dump({
                    "project": project,
                    "acquired_at": datetime.now(timezone.utc).isoformat(),
                }, f)
            
            return True
            
        except IOError:
            return False
    
    def release_lock(self, project: str):
        """释放项目构建锁"""
        lock_path = os.path.join(self.lock_file, f"{project}.lock")
        try:
            if os.path.exists(lock_path):
                os.remove(lock_path)
        except OSError:
            pass
    
    def is_locked(self, project: str) -> bool:
        """检查项目是否被锁定"""
        lock_path = os.path.join(self.lock_file, f"{project}.lock")
        return os.path.exists(lock_path)


# 兼容旧接口：使用全局实例
_queue_instance = None
_queue_lock = threading.Lock()


def get_queue() -> BuildQueue:
    """获取队列实例（单例）"""
    global _queue_instance
    if _queue_instance is None:
        with _queue_lock:
            if _queue_instance is None:
                _queue_instance = BuildQueue()
    return _queue_instance


def enqueue_build(project: str, command: str, priority: TaskPriority = TaskPriority.NORMAL) -> str:
    """添加构建任务到队列"""
    return get_queue().enqueue(project, command, priority)


def run_with_iops_limit(command: str, project: str) -> tuple:
    """
    使用 IOPS 限制运行构建命令
    
    Args:
        command: 构建命令
        project: 项目名
        
    Returns:
        (exit_code, output)
    """
    queue = get_queue()
    
    # 检查是否可以立即运行
    if queue.is_locked(project):
        # 加入队列
        task_id = queue.enqueue(project, command, TaskPriority.HIGH)
        return None, f"Task {task_id} queued, waiting for lock"
    
    # 获取锁
    if not queue.acquire_lock(project):
        task_id = queue.enqueue(project, command, TaskPriority.HIGH)
        return None, f"Task {task_id} queued, failed to acquire lock"
    
    try:
        # 运行命令
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=QUEUE_LOCK_TIMEOUT,
        )
        
        output = result.stdout + result.stderr
        exit_code = result.returncode
        
        return exit_code, output
        
    except subprocess.TimeoutExpired:
        return -1, "Build timed out"
    except Exception as e:
        return -1, str(e)
    finally:
        queue.release_lock(project)


def main():
    """CLI 入口"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Build Queue")
    parser.add_argument("command", choices=["enqueue", "status", "list", "cancel", "clear"],
                        help="命令")
    parser.add_argument("--project", "-p", help="项目名")
    parser.add_argument("--command", "-c", help="构建命令")
    parser.add_argument("--priority", choices=["high", "normal", "low"], default="normal",
                        help="优先级")
    parser.add_argument("--task-id", help="任务 ID")
    parser.add_argument("--verbose", "-v", action="store_true", help="详细输出")
    
    args = parser.parse_args()
    
    queue = get_queue()
    priority_map = {"high": TaskPriority.HIGH, "normal": TaskPriority.NORMAL, "low": TaskPriority.LOW}
    
    if args.command == "enqueue":
        if not args.project or not args.command:
            print("Error: --project and --command are required")
            return
        
        task_id = queue.enqueue(args.project, args.command, priority_map[args.priority])
        print(f"Task {task_id} enqueued")
    
    elif args.command == "status":
        status = queue.get_queue_status()
        print(f"队列状态:")
        print(f"  状态: {status['status']}")
        print(f"  最大并发: {status['max_concurrent']}")
        print(f"  当前运行: {status['current_running']}")
        print(f"  排队数量: {status['queued_count']}")
        print(f"  已完成: {status['total_completed']}")
        print(f"  失败: {status['total_failed']}")
    
    elif args.command == "list":
        status = queue.get_queue_status()
        
        if status["tasks"]["queued"]:
            print(f"排队任务 ({len(status['tasks']['queued'])}):")
            for task in status["tasks"]["queued"]:
                print(f"  - {task['project']}: {task['command']} [{task['priority']}]")
        
        if status["tasks"]["running"]:
            print(f"\n运行中 ({len(status['tasks']['running'])}):")
            for task in status["tasks"]["running"]:
                print(f"  - {task['project']}: {task['command']}")
    
    elif args.command == "cancel":
        if args.task_id:
            if queue.cancel_task(args.task_id):
                print(f"Task {args.task_id} cancelled")
            else:
                print(f"Task {args.task_id} not found or cannot be cancelled")
        else:
            print("Error: --task-id is required")
    
    elif args.command == "clear":
        queue.clear_completed()
        print("Completed tasks cleared")


if __name__ == "__main__":
    main()
