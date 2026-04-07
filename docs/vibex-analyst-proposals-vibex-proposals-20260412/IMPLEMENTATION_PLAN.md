# Implementation Plan: Analyst Proposals — 2026-04-12 Sprint

**Project**: vibex-analyst-proposals-vibex-proposals-20260412
**Date**: 2026-04-07
**Total**: 4h

---

## Phase 1: A-P0-1 提案状态追踪 (1h)

```bash
# Step 1: 检查 docs/proposals/INDEX.md 是否存在
ls docs/proposals/INDEX.md

# Step 2: 创建模板（如不存在）
mkdir -p docs/proposals

# Step 3: 修改 coord/scheduler.py
# 在 create_project() 中添加 INDEX 写入

# Step 4: 修改 task_manager.py
# 在 update() 中添加 status='done' 时自动更新
```

**验收**: 模拟提案创建，INDEX.md 有新条目

---

## Phase 2: A-P1-1 需求澄清 SOP (1h)

```bash
# 在 AGENTS.md 中添加 SOP 章节
```

**验收**: `grep "Brainstorming" AGENTS.md` 有结果

---

## Phase 3: A-P2-1 画布演进路线图 (2h)

```bash
mkdir -p docs/vibex-canvas-evolution-roadmap
cat > docs/vibex-canvas-evolution-roadmap/roadmap.md << 'EOF'
# VibeX Canvas 演进路线图
(见 architecture.md 3.3 节)
EOF

mkdir -p .github/workflows
cat > .github/workflows/quarterly-reminder.yml << 'EOF'
name: Quarterly Roadmap Reminder
on:
  schedule:
    - cron: '0 9 1 1,4,7,10 *'
jobs:
  reminder:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.create({
              title: '[Reminder] Quarterly Roadmap Update',
              body: '请更新 docs/vibex-canvas-evolution-roadmap/roadmap.md'
            })
EOF
```

**验收**: roadmap.md 存在，quarterly-reminder.yml 可触发

---

## Rollback

```bash
git checkout -- docs/proposals/INDEX.md
git checkout -- AGENTS.md
git checkout -- docs/vibex-canvas-evolution-roadmap/
```
