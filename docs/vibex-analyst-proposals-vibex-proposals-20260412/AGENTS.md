# AGENTS.md: Analyst Proposals Sprint — 2026-04-12

**Project**: vibex-analyst-proposals-vibex-proposals-20260412
**Date**: 2026-04-07

---

## 开发约束

1. **INDEX.md 写入**: coord create_project 时必须同时写入 INDEX.md
2. **INDEX.md 格式**: 保持 Markdown table 格式，否则 grep 分析失败
3. **Brainstorming 触发**: 满足触发条件时必须使用 Brainstorming，不能跳过

---

## 提交规范

```bash
git commit -m "feat(coord): auto-write INDEX.md on project create

- coord/scheduler.py: create_project() writes INDEX.md
- task_manager.py: update() auto-updates status on done"

git commit -m "docs(agents): add Brainstorming SOP to AGENTS.md

- Define trigger conditions
- Document Brainstorming flow"

git commit -m "docs(roadmap): add VibeX Canvas Evolution Roadmap

- docs/vibex-canvas-evolution-roadmap/roadmap.md
- .github/workflows/quarterly-reminder.yml"
```

---

## PR 清单

- [ ] INDEX.md 自动写入
- [ ] task done 时 INDEX.md status 更新
- [ ] AGENTS.md 包含 Brainstorming SOP
- [ ] roadmap.md 存在
- [ ] quarterly-reminder.yml 可触发
