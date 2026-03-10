#!/usr/bin/env python3
"""Resource Monitor - 资源监控器

实时监控 CPU/内存/IOPS，支持负载告警和横向扩展
"""

import json
import os
import subprocess
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Optional, Dict

# 配置
METRICS_DIR = os.environ.get("METRICS_DIR", "/var/run/metrics")
ALERT_THRESHOLD_CPU = float(os.environ.get("ALERT_THRESHOLD_CPU", "85.0"))
ALERT_THRESHOLD_MEMORY = float(os.environ.get("ALERT_THRESHOLD_MEMORY", "85.0"))
ALERT_THRESHOLD_DISK = float(os.environ.get("ALERT_THRESHOLD_DISK", "90.0"))
ALERT_THRESHOLD_IOPS_READ = int(os.environ.get("ALERT_THRESHOLD_IOPS_READ", "500"))
ALERT_THRESHOLD_IOPS_WRITE = int(os.environ.get("ALERT_THRESHOLD_IOPS_WRITE", "200"))


@dataclass
class ResourceMetrics:
    """资源指标"""
    timestamp: str
    cpu_percent: float = 0.0
    memory_percent: float = 0.0
    memory_used_mb: float = 0.0
    memory_total_mb: float = 0.0
    disk_percent: float = 0.0
    iops_read: int = 0
    iops_write: int = 0
    running_tasks: int = 0
    
    # 告警阈值（类属性）
    CPU_ALERT_THRESHOLD = ALERT_THRESHOLD_CPU
    MEMORY_ALERT_THRESHOLD = ALERT_THRESHOLD_MEMORY
    DISK_ALERT_THRESHOLD = ALERT_THRESHOLD_DISK
    IOPS_READ_THRESHOLD = ALERT_THRESHOLD_IOPS_READ
    IOPS_WRITE_THRESHOLD = ALERT_THRESHOLD_IOPS_WRITE


@dataclass
class Alert:
    """告警"""
    level: str  # warning, critical
    resource: str
    current: float
    threshold: float
    message: str
    timestamp: str


class ResourceMonitor:
    """资源监控器"""
    
    def __init__(self):
        self.metrics_dir = METRICS_DIR
        os.makedirs(self.metrics_dir, exist_ok=True)
        self._last_iops_check = {}
    
    def get_cpu_usage(self) -> float:
        """获取 CPU 使用率"""
        try:
            # 使用 top 命令获取 CPU 使用率
            result = subprocess.run(
                ["bash", "-c", "top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1"],
                capture_output=True, text=True, timeout=5
            )
            if result.returncode == 0 and result.stdout.strip():
                return float(result.stdout.strip())
        except (subprocess.TimeoutExpired, ValueError, subprocess.SubprocessError):
            pass
        
        # 备用方案：使用 /proc/stat
        try:
            with open("/proc/stat", "r") as f:
                line = f.readline()
                fields = line.split()
                if len(fields) >= 8:
                    # user, nice, system, idle, iowait, irq, softirq, steal
                    total = sum(int(x) for x in fields[1:8])
                    idle = int(fields[4])
                    return round((1 - idle / total) * 100, 1) if total > 0 else 0.0
        except (IOError, ValueError):
            pass
        
        return 0.0
    
    def get_memory_usage(self) -> tuple:
        """获取内存使用情况，返回 (使用率, 已用MB, 总MB)"""
        try:
            result = subprocess.run(
                ["free", "-m"],
                capture_output=True, text=True, timeout=5
            )
            if result.returncode == 0:
                lines = result.stdout.strip().split("\n")
                if len(lines) >= 2:
                    fields = lines[1].split()
                    if len(fields) >= 3:
                        total_mb = int(fields[1])
                        used_mb = int(fields[2])
                        percent = round(used_mb / total_mb * 100, 1) if total_mb > 0 else 0.0
                        return percent, used_mb, total_mb
        except (subprocess.TimeoutExpired, ValueError, subprocess.SubprocessError, IndexError):
            pass
        
        # 备用方案：读取 /proc/meminfo
        try:
            meminfo = {}
            with open("/proc/meminfo", "r") as f:
                for line in f:
                    if ":" in line:
                        key, value = line.split(":", 1)
                        meminfo[key.strip()] = int(value.strip().split()[0])
            
            total_kb = meminfo.get("MemTotal", 0)
            available_kb = meminfo.get("MemAvailable", 0)
            used_kb = total_kb - available_kb
            
            total_mb = total_kb / 1024
            used_mb = used_kb / 1024
            percent = round(used_mb / total_mb * 100, 1) if total_mb > 0 else 0.0
            
            return percent, used_mb, total_mb
        except (IOError, KeyError, ValueError):
            pass
        
        return 0.0, 0.0, 0.0
    
    def get_disk_usage(self) -> float:
        """获取磁盘使用率"""
        try:
            result = subprocess.run(
                ["df", "-h", "/"],
                capture_output=True, text=True, timeout=5
            )
            if result.returncode == 0:
                lines = result.stdout.strip().split("\n")
                if len(lines) >= 2:
                    fields = lines[1].split()
                    if len(fields) >= 5:
                        # 获取使用率，去掉 % 符号
                        percent_str = fields[4]
                        if percent_str.endswith("%"):
                            return float(percent_str[:-1])
        except (subprocess.TimeoutExpired, ValueError, subprocess.SubprocessError, IndexError):
            pass
        
        return 0.0
    
    def get_iops(self) -> tuple:
        """获取磁盘 IOPS，返回 (读IOPS, 写IOPS)"""
        try:
            # 读取 /sys/block/*/stat
            iops_read = 0
            iops_write = 0
            
            # 检查是否支持 iostat
            result = subprocess.run(
                ["which", "iostat"],
                capture_output=True, text=True, timeout=5
            )
            
            if result.returncode == 0:
                # 使用 iostat 获取 IOPS
                result = subprocess.run(
                    ["iostat", "-dx", "1", "1"],
                    capture_output=True, text=True, timeout=10
                )
                if result.returncode == 0:
                    lines = result.stdout.strip().split("\n")
                    for line in lines:
                        fields = line.split()
                        if len(fields) >= 14:
                            try:
                                device = fields[0]
                                if device.startswith("sd") or device.startswith("nvme"):
                                    # r/s = reads/sec, w/s = writes/sec
                                    rps = float(fields[3]) if fields[3] != '0.00' else 0
                                    wps = float(fields[4]) if fields[4] != '0.00' else 0
                                    iops_read += rps
                                    iops_write += wps
                            except (ValueError, IndexError):
                                continue
                    
                    return int(iops_read), int(iops_write)
            
            # 备用：直接从 /proc/diskstat 读取
            iops_read, iops_write = self._read_iops_from_diskstat()
            return iops_read, iops_write
            
        except (subprocess.TimeoutExpired, subprocess.SubprocessError):
            pass
        
        return 0, 0
    
    def _read_iops_from_diskstat(self) -> tuple:
        """从 /proc/diskstat 读取 IOPS"""
        try:
            with open("/proc/diskstat", "r") as f:
                lines = f.readlines()
            
            total_read = 0
            total_write = 0
            
            for line in lines:
                fields = line.split()
                if len(fields) >= 14:
                    device = fields[2]
                    # 跳过 loop 设备
                    if device.startswith("loop") or device.startswith("sr"):
                        continue
                    
                    # sectors read/write (字段 5 和 9)
                    sectors_read = int(fields[5])
                    sectors_write = int(fields[9])
                    
                    # 简单估算：每秒约 1000 次操作
                    total_read += sectors_read
                    total_write += sectors_write
            
            # 返回估算值（基于两次读取的差值）
            now = time.time()
            if self._last_iops_check:
                last_time, last_read, last_write = self._last_iops_check
                time_diff = now - last_time
                if time_diff > 0:
                    rps = int((total_read - last_read) / time_diff)
                    wps = int((total_write - last_write) / time_diff)
                    self._last_iops_check = (now, total_read, total_write)
                    return max(0, rps), max(0, wps)
            
            self._last_iops_check = (now, total_read, total_write)
            return 0, 0
            
        except (IOError, ValueError, IndexError):
            return 0, 0
    
    def get_running_tasks(self) -> int:
        """获取运行中的任务数"""
        try:
            # 从 team-tasks 目录获取
            tasks_dir = os.environ.get("TEAM_TASKS_DIR", "/home/ubuntu/clawd/data/team-tasks")
            if os.path.exists(tasks_dir):
                count = 0
                for f in os.listdir(tasks_dir):
                    if f.endswith(".json"):
                        try:
                            with open(os.path.join(tasks_dir, f), "r") as fp:
                                data = json.load(fp)
                                stages = data.get("stages", {})
                                for stage, info in stages.items():
                                    if info.get("status") == "in-progress":
                                        count += 1
                        except (json.JSONDecodeError, IOError):
                            continue
                return count
        except OSError:
            pass
        
        return 0
    
    def get_metrics(self) -> ResourceMetrics:
        """获取当前资源指标"""
        cpu = self.get_cpu_usage()
        mem_percent, mem_used, mem_total = self.get_memory_usage()
        disk = self.get_disk_usage()
        iops_read, iops_write = self.get_iops()
        running = self.get_running_tasks()
        
        return ResourceMetrics(
            timestamp=datetime.now(timezone.utc).isoformat(),
            cpu_percent=cpu,
            memory_percent=mem_percent,
            memory_used_mb=mem_used,
            memory_total_mb=mem_total,
            disk_percent=disk,
            iops_read=iops_read,
            iops_write=iops_write,
            running_tasks=running,
        )
    
    def check_alerts(self, metrics: Optional[ResourceMetrics] = None) -> List[Alert]:
        """
        检查告警
        
        Args:
            metrics: 资源指标（可选，不传则自动获取）
            
        Returns:
            告警列表
        """
        if metrics is None:
            metrics = self.get_metrics()
        
        alerts = []
        now = datetime.now(timezone.utc).isoformat()
        
        # CPU 告警
        if metrics.cpu_percent >= metrics.CPU_ALERT_THRESHOLD:
            alerts.append(Alert(
                level="warning" if metrics.cpu_percent < 95 else "critical",
                resource="cpu",
                current=metrics.cpu_percent,
                threshold=metrics.CPU_ALERT_THRESHOLD,
                message=f"CPU 使用率过高: {metrics.cpu_percent}%",
                timestamp=now,
            ))
        
        # 内存告警
        if metrics.memory_percent >= metrics.MEMORY_ALERT_THRESHOLD:
            alerts.append(Alert(
                level="warning" if metrics.memory_percent < 95 else "critical",
                resource="memory",
                current=metrics.memory_percent,
                threshold=metrics.MEMORY_ALERT_THRESHOLD,
                message=f"内存使用率过高: {metrics.memory_percent}% ({metrics.memory_used_mb:.0f}MB/{metrics.memory_total_mb:.0f}MB)",
                timestamp=now,
            ))
        
        # 磁盘告警
        if metrics.disk_percent >= metrics.DISK_ALERT_THRESHOLD:
            alerts.append(Alert(
                level="warning" if metrics.disk_percent < 95 else "critical",
                resource="disk",
                current=metrics.disk_percent,
                threshold=metrics.DISK_ALERT_THRESHOLD,
                message=f"磁盘使用率过高: {metrics.disk_percent}%",
                timestamp=now,
            ))
        
        # IOPS 读告警
        if metrics.iops_read >= metrics.IOPS_READ_THRESHOLD:
            alerts.append(Alert(
                level="warning" if metrics.iops_read < metrics.IOPS_READ_THRESHOLD * 1.5 else "critical",
                resource="iops_read",
                current=metrics.iops_read,
                threshold=metrics.IOPS_READ_THRESHOLD,
                message=f"读 IOPS 过高: {metrics.iops_read}",
                timestamp=now,
            ))
        
        # IOPS 写告警
        if metrics.iops_write >= metrics.IOPS_WRITE_THRESHOLD:
            alerts.append(Alert(
                level="warning" if metrics.iops_write < metrics.IOPS_WRITE_THRESHOLD * 1.5 else "critical",
                resource="iops_write",
                current=metrics.iops_write,
                threshold=metrics.IOPS_WRITE_THRESHOLD,
                message=f"写 IOPS 过高: {metrics.iops_write}",
                timestamp=now,
            ))
        
        return alerts
    
    def get_parallel_capacity(self, metrics: Optional[ResourceMetrics] = None) -> int:
        """
        计算可用并行容量
        
        Args:
            metrics: 资源指标（可选，不传则自动获取）
            
        Returns:
            可用并行槽位
        """
        if metrics is None:
            metrics = self.get_metrics()
        
        # 基于资源使用率计算可用槽位
        base_capacity = 4  # 基础并行容量
        
        # CPU 负载因子
        cpu_factor = max(0, 1 - metrics.cpu_percent / 100)
        
        # 内存负载因子
        mem_factor = max(0, 1 - metrics.memory_percent / 100)
        
        # IOPS 负载因子
        iops_factor = 1.0
        if metrics.iops_read >= metrics.IOPS_READ_THRESHOLD or metrics.iops_write >= metrics.IOPS_WRITE_THRESHOLD:
            iops_factor = 0.5
        
        # 计算综合容量
        capacity = int(base_capacity * cpu_factor * mem_factor * iops_factor)
        
        return max(0, min(capacity, base_capacity))
    
    def save_metrics(self, metrics: Optional[ResourceMetrics] = None):
        """保存指标到文件"""
        if metrics is None:
            metrics = self.get_metrics()
        
        # 保存到 JSON 文件
        metrics_file = os.path.join(self.metrics_dir, "latest.json")
        with open(metrics_file, "w") as f:
            json.dump({
                "timestamp": metrics.timestamp,
                "cpu_percent": metrics.cpu_percent,
                "memory_percent": metrics.memory_percent,
                "memory_used_mb": metrics.memory_used_mb,
                "memory_total_mb": metrics.memory_total_mb,
                "disk_percent": metrics.disk_percent,
                "iops_read": metrics.iops_read,
                "iops_write": metrics.iops_write,
                "running_tasks": metrics.running_tasks,
            }, f, indent=2)
    
    def get_status(self) -> dict:
        """获取监控器状态"""
        metrics = self.get_metrics()
        alerts = self.check_alerts(metrics)
        
        return {
            "metrics": {
                "cpu_percent": metrics.cpu_percent,
                "memory_percent": metrics.memory_percent,
                "memory_used_mb": metrics.memory_used_mb,
                "memory_total_mb": metrics.memory_total_mb,
                "disk_percent": metrics.disk_percent,
                "iops_read": metrics.iops_read,
                "iops_write": metrics.iops_write,
                "running_tasks": metrics.running_tasks,
            },
            "alerts": [
                {
                    "level": a.level,
                    "resource": a.resource,
                    "current": a.current,
                    "threshold": a.threshold,
                    "message": a.message,
                }
                for a in alerts
            ],
            "parallel_capacity": self.get_parallel_capacity(metrics),
        }


def main():
    """CLI 入口"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Resource Monitor")
    parser.add_argument("command", choices=["status", "metrics", "alerts", "capacity"],
                        help="命令")
    parser.add_argument("--verbose", "-v", action="store_true", help="详细输出")
    
    args = parser.parse_args()
    
    monitor = ResourceMonitor()
    
    if args.command == "status":
        status = monitor.get_status()
        print(f"资源状态:")
        print(f"  CPU: {status['metrics']['cpu_percent']:.1f}%")
        print(f"  内存: {status['metrics']['memory_percent']:.1f}% ({status['metrics']['memory_used_mb']:.0f}MB/{status['metrics']['memory_total_mb']:.0f}MB)")
        print(f"  磁盘: {status['metrics']['disk_percent']:.1f}%")
        print(f"  IOPS: R={status['metrics']['iops_read']} W={status['metrics']['iops_write']}")
        print(f"  运行任务: {status['metrics']['running_tasks']}")
        print(f"  可用并行: {status['parallel_capacity']}")
        
        if status['alerts']:
            print(f"\n告警 ({len(status['alerts'])}):")
            for alert in status['alerts']:
                print(f"  [{alert['level'].upper()}] {alert['message']}")
    
    elif args.command == "metrics":
        metrics = monitor.get_metrics()
        print(json.dumps({
            "timestamp": metrics.timestamp,
            "cpu_percent": metrics.cpu_percent,
            "memory_percent": metrics.memory_percent,
            "memory_used_mb": metrics.memory_used_mb,
            "memory_total_mb": metrics.memory_total_mb,
            "disk_percent": metrics.disk_percent,
            "iops_read": metrics.iops_read,
            "iops_write": metrics.iops_write,
            "running_tasks": metrics.running_tasks,
        }, indent=2))
    
    elif args.command == "alerts":
        alerts = monitor.check_alerts()
        if alerts:
            for alert in alerts:
                print(f"[{alert.level.upper()}] {alert.message}")
        else:
            print("无告警")
    
    elif args.command == "capacity":
        capacity = monitor.get_parallel_capacity()
        print(f"可用并行槽位: {capacity}")


if __name__ == "__main__":
    main()
