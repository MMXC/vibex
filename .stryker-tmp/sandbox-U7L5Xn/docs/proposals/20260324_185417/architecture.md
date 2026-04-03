# Epic 1 架构文档 — 工具链止血

## 概述
Epic 1 为工具链层修复，不涉及应用架构变更。

## 关键设计

### P0-2: 超时框架
```python
# scripts/timeout.py（新建）
import signal

class TimeoutError(Exception):
    pass

def timeout(seconds):
    def decorator(func):
        def wrapper(*args, **kwargs):
            def handler(signum, frame):
                raise TimeoutError(f"{func.__name__} timed out after {seconds}s")
            signal.signal(signal.SIGALRM, handler)
            signal.alarm(seconds)
            try:
                result = func(*args, **kwargs)
            finally:
                signal.alarm(0)
            return result
        return wrapper
    return decorator
```

### P1-8: 话题追踪自动化
集成到 `dev-heartbeat.sh` 和 `common.sh`：
- 任务领取成功后调用 `create_thread_and_save`
- feishu_self_notify 自动从响应中提取 thread ID
