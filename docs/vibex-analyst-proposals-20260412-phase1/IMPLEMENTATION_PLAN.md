# Implementation Plan: Analyst Proposals — Phase 1

**Project**: vibex-analyst-proposals-20260412-phase1
**Date**: 2026-04-07
**Total**: 4h

---

## Phase 1: E1 提案状态追踪 (1h)

**目标**: INDEX.md 自动写入 + task done 时更新

### 步骤

```bash
# Step 1: 创建 INDEX.md 模板
mkdir -p docs/proposals
cat > docs/proposals/INDEX.md << 'EOF'
# VibeX 提案索引
## 状态说明
| 状态 | 含义 |
|------|------|
| pending | 已提交，待评审 |
| in-progress | 实施中 |
| done | 已完成 |
| rejected | 已驳回 |

## 提案列表
| ID | 标题 | Sprint | 状态 | Owner | 创建时间 | 更新时间 |
|----|------|--------|------|-------|----------|----------|
EOF

# Step 2: 修改 coord/scheduler.py
# 在 create_project() 中添加自动写入

# Step 3: 修改 task_manager.py
# 在 update() 中添加 status='done' 时自动更新
```

**验收**: 模拟提案创建，INDEX.md 有条目

---

## Phase 2: E2 需求澄清 SOP (1h)

**目标**: AGENTS.md 中标注 Brainstorming 技能

### 步骤

```bash
# 在 vibex/AGENTS.md 或各 agent AGENTS.md 中添加
## 需求澄清 SOP 章节
```

**验收**: `grep -n "Brainstorming" AGENTS.md` 有结果

---

## Phase 3: E3 画布演进路线图 (2h)

### 步骤

```bash
# Step 1: 创建目录
mkdir -p docs/vibex-canvas-evolution-roadmap

# Step 2: 创建 roadmap.md
# (见 architecture.md 3.3.1 节)

# Step 3: 创建 GitHub Actions
mkdir -p .github/workflows
cat > .github/workflows/quarterly-reminder.yml << 'EOF'
name: Quarterly Roadmap Reminder
on:
  schedule:
    - cron: '0 9 1 1,4,7,10 *'
  workflow_dispatch:
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

- INDEX.md: `git checkout -- docs/proposals/INDEX.md`
- AGENTS.md: `git checkout -- AGENTS.md`
- roadmap: `git checkout -- docs/vibex-canvas-evolution-roadmap/`
