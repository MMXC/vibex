# Architecture: Epic3 KnowledgeBase 虚假完成修复

**Project**: `epic3-knowledgebase-recovery-fakefix`  
**Architect**: architect  
**Date**: 2026-03-22  
**Status**: design-architecture

---

## 1. Context & Problem

### Root Cause Summary
Epic3 知识库经历了两轮虚假完成：
1. **Dev** 在 `vibex/docs/knowledge/` 创建了文件，但 `epic3-knowledgebase-recovery` 项目目录缺少 `AGENTS.md` / `IMPLEMENTATION_PLAN.md`
2. **Tester** 使用 `npm test` 验证文档项目，但 `package.json` 无 test 脚本 → Missing script

### Goals
| # | Goal |
|---|------|
| G1 | 补全 recovery 项目缺失文档（AGENTS.md, IMPLEMENTATION_PLAN.md） |
| G2 | 建立文档项目专用验证方法（文件存在性替代 npm test） |
| G3 | 建立防虚假完成的系统性机制 |

---

## 2. Architecture

### 2.1 Component Overview

```
epic3-knowledgebase-recovery/
├── analysis.md           ✅ 已有
├── prd.md                ✅ 已有（来自 project root）
├── specs/                ✅ 已有
├── architecture.md       📋 补全（本文档）
├── AGENTS.md             📋 补全
├── IMPLEMENTATION_PLAN.md 📋 补全
└── specs/
    └── verification-guide.md  📋 新增：文档项目验证指南
```

### 2.2 Verification Strategy

**Problem**: `npm test` 不适用于无 `package.json` 的文档项目。

**Solution**: 文档项目使用文件系统验证，代码项目使用 `npm test`。

| 项目类型 | 验证命令 |
|----------|---------|
| 代码项目（`package.json` 存在） | `npm test` / `jest` |
| 文档项目（`package.json` 不存在） | `test -f <path>` + `ls *.md \| wc -l` |

### 2.3 Anti-Fake-Completion Mechanisms

#### Mechanism 1: expected-location Field

在提案 PRD 中增加 `expected-location` 字段：

```markdown
## F3.1 建立提案落地检查清单
- **expected-location**: `/root/.openclaw/vibex/docs/<project-name>/`
- **verification**: `test -d <expected-location> && test -f <expected-location>/AGENTS.md`
```

#### Mechanism 2: workspace Constraint in team-tasks

在 `task_manager.py` 的任务约束中增加 `workspace` 字段：

```bash
# task_manager.py status 输出中显示
🔴 Constraints: [..., 'workspace: /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/']
```

Dev 必须在 `workspace` 指定的目录创建文件。

#### Mechanism 3: Two-Stage Verification

| Stage | Who | Checks |
|-------|-----|--------|
| Pre-commit | Dev | `test -f <workspace>/AGENTS.md` 返回 0 |
| Post-claim | Tester | 文件位置 + 内容非空验证 |

---

## 3. Testing Strategy

### 3.1 Verification Script

```bash
#!/bin/bash
# verify-doc-project.sh — 文档项目验证脚本

set -e
PROJECT="$1"
WORKSPACE="/root/.openclaw/vibex/docs/$PROJECT"

echo "=== 验证 $PROJECT ==="

# 必须存在的文件
for f in AGENTS.md IMPLEMENTATION_PLAN.md; do
    if [ -f "$WORKSPACE/$f" ]; then
        echo "✅ $f 存在"
    else
        echo "❌ $f 缺失"
        exit 1
    fi
done

# specs/ 目录
if [ -d "$WORKSPACE/specs/" ]; then
    echo "✅ specs/ 存在"
else
    echo "❌ specs/ 缺失"
    exit 1
fi

# 知识库 patterns 文件数
PATTERNS=$(ls /root/.openclaw/vibex/docs/knowledge/patterns/*.md 2>/dev/null | wc -l)
if [ "$PATTERNS" -ge 4 ]; then
    echo "✅ patterns: $PATTERNS ≥ 4"
else
    echo "❌ patterns: $PATTERNS < 4"
    exit 1
fi

# 知识库 templates 文件数
TEMPLATES=$(ls /root/.openclaw/vibex/docs/knowledge/templates/*.md 2>/dev/null | wc -l)
if [ "$TEMPLATES" -ge 3 ]; then
    echo "✅ templates: $TEMPLATES ≥ 3"
else
    echo "❌ templates: $TEMPLATES < 3"
    exit 1
fi

echo "=== 验证通过 ==="
```

### 3.2 Test Cases

| ID | 描述 | 验证命令 |
|----|------|---------|
| TC1 | AGENTS.md 存在 | `test -f .../AGENTS.md` |
| TC2 | IMPLEMENTATION_PLAN.md 存在 | `test -f .../IMPLEMENTATION_PLAN.md` |
| TC3 | specs/ 目录存在 | `test -d .../specs/` |
| TC4 | patterns ≥ 4 个非空文件 | `ls *.md \| wc -l` ≥ 4 |
| TC5 | templates ≥ 3 个非空文件 | `ls *.md \| wc -l` ≥ 3 |
| TC6 | 文件非空（无空文件） | `for f in *.md; [ -s "$f" ]; done` |
| TC7 | verification-guide.md 存在 | `test -f .../specs/verification-guide.md` |

---

## 4. Implementation Plan

### Phase 1: Document Completion (Dev)

| Task | File | Content |
|------|------|---------|
| Create architecture.md | `docs/epic3-knowledgebase-recovery/architecture.md` | 本文档 |
| Create AGENTS.md | `docs/epic3-knowledgebase-recovery/AGENTS.md` | 角色分工 + 文档项目验证命令 |
| Create IMPLEMENTATION_PLAN.md | `docs/epic3-knowledgebase-recovery/IMPLEMENTATION_PLAN.md` | 补全计划 |
| Create verification-guide.md | `docs/epic3-knowledgebase-recovery/specs/verification-guide.md` | 文档项目验证指南 |

### Phase 2: Anti-Fake-Completion (Dev + team-tasks)

| Task | Description |
|------|-------------|
| Update AGENTS.md template | 文档项目使用文件验证，代码项目使用 npm test |
| Add expected-location to PRD | 在 PRD 中标记 expected-location |
| Document workspace constraint | 说明 team-tasks 任务的 workspace 字段 |

---

## 5. Trade-offs

| Decision | Trade-off |
|----------|-----------|
| 知识库文件保留在 vibex/docs/knowledge/ | ✅ 复用性好；⚠️ recovery 项目不包含完整内容 |
| verification-guide.md 作为独立文件 | ✅ 可复用；⚠️ 增加文件数量 |
| 不修改 task_manager.py | ✅ 无代码变更风险；⚠️ workspace 约束只能文档化，无法强制 |

---

## 6. Verification Checklist

- [ ] `epic3-knowledgebase-recovery/architecture.md` 存在
- [ ] `epic3-knowledgebase-recovery/AGENTS.md` 存在，测试命令不含 `npm test`
- [ ] `epic3-knowledgebase-recovery/IMPLEMENTATION_PLAN.md` 存在
- [ ] `epic3-knowledgebase-recovery/specs/verification-guide.md` 存在
- [ ] `docs/knowledge/patterns/*.md` ≥ 4 个非空文件
- [ ] `docs/knowledge/templates/*.md` ≥ 3 个非空文件
- [ ] AGENTS.md 中测试命令使用 `test -f` 而非 `npm test`
