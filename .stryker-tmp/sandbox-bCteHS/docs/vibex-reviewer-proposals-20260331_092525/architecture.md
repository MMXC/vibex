# Architecture: vibex-reviewer-proposals-20260331_092525

**Project**: Reviewer 自检提案 — 路径规范 + SOP + 通知过滤
**Agent**: architect
**Date**: 2026-03-31
**PRD**: docs/vibex-reviewer-proposals-20260331_092525/prd.md

---

## 1. 规范路径

```
/root/.openclaw/workspace-{agent}/proposals/YYYYMMDD/{agent}-proposals.md
```

验证脚本检查所有现有报告路径，不合规则 exit 1。

---

## 2. 通知去重

5 分钟内同一任务同一状态不重复通知，状态变更缓存到 JSON 文件。

---

*Architect 产出物 | 2026-03-31*
