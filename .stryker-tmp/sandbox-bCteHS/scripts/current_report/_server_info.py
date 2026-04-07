"""F3: Server system info via psutil (optional dependency)."""
import os
import time

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False


def get_server_info() -> dict:
    """Gather CPU, memory, disk, uptime. Graceful degradation if psutil unavailable."""
    if not HAS_PSUTIL:
        return {
            "cpu_percent": None,
            "memory_percent": None,
            "memory_mb": None,
            "disk_percent": None,
            "uptime_seconds": None,
            "psutil_available": False,
        }

    try:
        cpu = psutil.cpu_percent(interval=0.5)
    except Exception:
        cpu = None

    try:
        mem = psutil.virtual_memory()
        mem_percent = mem.percent
        mem_mb = int(mem.used / (1024 * 1024))
    except Exception:
        mem_percent = None
        mem_mb = None

    try:
        disk = psutil.disk_usage("/")
        disk_percent = disk.percent
    except Exception:
        disk_percent = None

    try:
        boot_time = psutil.boot_time()
        uptime = int(time.time() - boot_time)
    except Exception:
        uptime = None

    return {
        "cpu_percent": cpu,
        "memory_percent": mem_percent,
        "memory_mb": mem_mb,
        "disk_percent": disk_percent,
        "uptime_seconds": uptime,
        "psutil_available": True,
    }
