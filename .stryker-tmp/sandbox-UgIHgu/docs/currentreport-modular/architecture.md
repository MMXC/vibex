# Architecture: vibex-currentreport-modular

**Project**: current_report 模块独立化
**Agent**: architect
**Date**: 2026-03-31
**Analysis**: /root/.openclaw/vibex/docs/currentreport-modular/analysis.md

---

## 1. 问题

`current_report` 硬编码多个路径常量：
```python
TEAM_TASKS_DIR = "/root/.openclaw/workspace-coord/team-tasks"
PROPOSALS_DIRS = ["/root/.openclaw/workspace-coord/proposals", ...]
```

---

## 2. 统一配置接口

```python
# config.py
import json
from pathlib import Path

CONFIG_FILE = Path.home() / ".openclaw" / "config.json"

class Config:
    _instance = None
    _data = None

    @classmethod
    def get(cls):
        if cls._data is None:
            if CONFIG_FILE.exists():
                cls._data = json.loads(CONFIG_FILE.read_text())
            else:
                cls._data = cls._defaults()
        return cls._data

    @classmethod
    def _defaults(cls):
        return {
            "team_tasks_dir": "/root/.openclaw/workspace-coord/team-tasks",
            "proposals_dirs": [
                "/root/.openclaw/workspace-coord/proposals",
            ],
            "workspace_root": "/root/.openclaw",
        }

    @classmethod
    def get_path(cls, key: str) -> str:
        paths = cls.get()
        return paths.get(key, cls._defaults()[key])
```

**使用**：
```python
from config import Config
TEAM_TASKS_DIR = Config.get_path("team_tasks_dir")
```

---

## 3. config.json 模板

```json
{
  "team_tasks_dir": "/root/.openclaw/workspace-coord/team-tasks",
  "proposals_dirs": [
    "/root/.openclaw/workspace-coord/proposals"
  ],
  "workspace_root": "/root/.openclaw"
}
```

---

## 4. 文件变更

| 文件 | 操作 |
|------|------|
| `skills/team-tasks/scripts/config.py` | 新增 |
| `skills/team-tasks/scripts/_current_report.py` | 修改，使用 Config.get_path() |
| `~/.openclaw/config.json` | 可选，用户提供覆盖配置 |

---

## 5. 验证

```bash
python3 -c "from config import Config; print(Config.get_path('team_tasks_dir'))"
# 期望: /root/.openclaw/workspace-coord/team-tasks
```

---

*Architect 产出物 | 2026-03-31*
