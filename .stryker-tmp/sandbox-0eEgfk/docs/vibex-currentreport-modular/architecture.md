# Architecture: vibex-currentreport-modular

**Project**: current_report 模块独立化
**Agent**: coord (代写)
**Date**: 2026-03-31

---

## 1. 执行摘要

将 current_report 硬编码路径常量重构为配置文件，消除重复配置。

## 2. 技术方案

```python
# config.py
REPORT_PATHS = {
    'team_tasks_dir': '~/.openclaw/workspace/skills/team-tasks',
    'proposals_base': '~/.openclaw/workspace-coord/proposals',
    'docs_base': '~/.openclaw/vibex/docs',
}

# 供其他模块 import
from config import REPORT_PATHS
```

## 3. 修改文件

- `task_manager.py` 头部增加 config.py 导入
- 移除硬编码路径常量
