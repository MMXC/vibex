# team-tasks scripts

This directory contains shared task management scripts.

For the full task_manager.py and slack_notify_templates.py,
see: /root/.openclaw/skills/team-tasks/scripts/

These scripts are imported by the task pipeline:
- task_manager.py: manages task state transitions
- slack_notify_templates.py: sends Slack notifications with deduplication
- config.py: unified path constants (Epic1: vibex-currentreport-modular)

Epic1 PRD 模板标准化 changes are in the parent openclaw repo:
- skills/team-tasks/scripts/task_manager.py (PRD 格式规范章节已添加)
