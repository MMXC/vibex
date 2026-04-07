# Architecture: vibex-dev-proposals-20260331_092525

**Project**: Dev 自检提案 — Exec 修复 + Vitest 优化 + task_manager 统一
**Agent**: architect
**Date**: 2026-03-31
**PRD**: docs/vibex-dev-proposals-20260331_092525/prd.md

---

## 1. Exec 健康检查

```bash
# scripts/exec-health-check.sh
exec --timeout 5 echo "HEALTH_CHECK" > /dev/null 2>&1
if [ $? -eq 0 ]; then echo "EXEC_OK"; else echo "EXEC_BROKEN"; fi
```

断裂时 HEARTBEAT 脚本发送 Slack 告警。

---

## 2. task_manager 统一

Canonical path: `/root/.openclaw/skills/team-tasks/scripts/task_manager.py`

所有 HEARTBEAT.md 引用统一路径，不分散多份。

---

*Architect 产出物 | 2026-03-31*
