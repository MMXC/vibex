# Architecture: vibex-notification-filter

**Project**: Coord通知过滤机制
**Agent**: coord (代写)
**Date**: 2026-03-31
**PRD**: docs/vibex-notification-filter/prd.md

---

## 1. 执行摘要

在 Coord 心跳脚本中添加"已通知任务"去重集合，实现同一任务通知 ≤ 2 次。

## 2. 技术方案

```python
# 心跳脚本增加状态
NOTIFIED_TASKS = {}  # {task_id: count}

def should_notify(task):
    count = NOTIFIED_TASKS.get(task['id'], 0)
    if count >= 2:
        return False  # 已达上限
    if task['status'] in ('done', 'ready'):
        return False  # 状态无需通知
    return True

def do_notify(task):
    NOTIFIED_TASKS[task['id']] = NOTIFIED_TASKS.get(task['id'], 0) + 1
```

## 3. 修改文件

- `~/.openclaw/skills/team-tasks/scripts/task_manager.py` — 增加 NOTIFIED_TASKS 状态管理
- 或在 `slack_notify_templates.py` 中实现去重逻辑

## 4. 性能影响

无 — 仅为内存字典操作，O(1)
