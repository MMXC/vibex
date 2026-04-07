# Architecture: vibex-notification-filter

**Project**: Coord 通知过滤机制
**Agent**: architect
**Date**: 2026-03-31
**Analysis**: /root/.openclaw/vibex/docs/notification-filter/analysis.md

---

## 1. 核心设计

```python
# state_change_tracker.py
# 位置: /root/.openclaw/skills/team-tasks/scripts/state_change_tracker.py

import json, time
from pathlib import Path

CACHE_FILE = Path("/root/.openclaw/.notification_cache.json")
COOLDOWN_SECONDS = 300  # 5分钟内同一任务不重复通知

def should_notify(project: str, stage: str, status: str) -> bool:
    cache = json.loads(CACHE_FILE.read_text()) if CACHE_FILE.exists() else {}
    key = f"{project}:{stage}"
    entry = cache.get(key, {})
    last_status = entry.get("status", "")
    last_time = entry.get("time", 0)

    # 状态变更才通知
    if status == last_status and (time.time() - last_time) < COOLDOWN_SECONDS:
        return False  # 冷却期内同一状态不重复

    cache[key] = {"status": status, "time": time.time(), "count": entry.get("count", 0) + 1}
    CACHE_FILE.write_text(json.dumps(cache, indent=2))
    return True
```

---

## 2. 与 Coord 心跳脚本集成

```python
# heartbeat-coord.sh 中调用
NOTIFY_COUNT=$(python3 $TASK_MANAGER notify-status --project $PROJECT --stage $STAGE --status $STATUS)
if [ "$NOTIFY_COUNT" -le 2 ]; then
  openclaw message send --message "..."
fi
```

---

## 3. 文件变更

| 文件 | 操作 |
|------|------|
| `skills/team-tasks/scripts/state_change_tracker.py` | 新增 |
| `skills/team-tasks/scripts/heartbeat-coord.sh` | 修改，调用 should_notify |
| `.notification_cache.json` | 自动创建 |

---

## 4. 测试策略

```bash
# 验证通知 ≤ 2 次
for i in {1..5}; do
  python3 state_change_tracker.py --project test --stage test --status pending
done
# 期望: 只有前 2 次返回 True
```

---

*Architect 产出物 | 2026-03-31*
