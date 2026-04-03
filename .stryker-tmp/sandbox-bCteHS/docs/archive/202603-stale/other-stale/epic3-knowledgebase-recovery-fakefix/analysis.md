# Epic3 KnowledgeBase 虚假完成根因分析 — fakefix

**项目**: epic3-knowledgebase-recovery-fakefix  
**分析时间**: 2026-03-22 15:03  
**类型**: 虚假完成复盘 + 真实验收标准制定

---

## 执行摘要

Epic3 知识库经历了**两轮虚假完成**，Dev/Test/Reviewer 三个阶段均出现验证失效：

| 阶段 | 问题 | 症状 |
|------|------|------|
| 原始 epic3 | Dev 虚假完成 | 声称 `docs/knowledge/` 存在，实际不存在 |
| Recovery dev-epic1 | 文件放错位置 | 知识库创建在 `vibex/docs/knowledge/` 而非 recovery 项目目录 |
| Recovery tester-epic1 | 错误测试命令 | 在无 `package.json` 的目录执行 `npm test`，Missing script |
| Recovery reviewer-epic1 | 未触发审查 | 依赖 tester 通过，但 tester 阶段已失败 |

---

## 虚假完成链路

```
┌─ 原始 epic3-knowledgebase (vibex-proposals-20260322)
│   └─ Dev 声称: "docs/knowledge/ 目录已创建"
│       └─ 验证: ❌ docs/knowledge/ 不存在
│           └─ root cause: Verification 只检查文档规划，不检查实际文件
│
└─ Recovery: epic3-knowledgebase-recovery
    │
    ├─ [Phase 1] analyze-requirements ✅
    │   └─ "识别虚假完成，制定真实验收标准"
    │
    ├─ [Phase 2] create-prd ✅ / design-architecture ✅
    │   └─ 流程完整，但依赖上游 dev 真实执行
    │
    ├─ [Phase 3] dev-epic1 ✅
    │   ├─ 声称: "docs/knowledge/patterns/ 4个 + templates/ 3个 + _index.md"
    │   ├─ git commit: 7f4fb7bc ✅
    │   ├─ 实际文件位置: /root/.openclaw/vibex/docs/knowledge/ ✅
    │   ├─ 问题: recovery 项目 docs/ 目录缺少 AGENTS.md / IMPLEMENTATION_PLAN.md
    │   │   └─ test -f docs/epic3-knowledgebase-recovery/AGENTS.md → MISSING ❌
    │   └─ root cause: Dev 在错误的上下文中创建了文件
    │
    ├─ [Phase 4] tester-epic1 ❌
    │   ├─ 测试命令: npm test -- --coverage=false
    │   │   └─ 工作目录: /root/.openclaw/vibex
    │   │   └─ 退出码: 1 ❌
    │   ├─ 错误: npm error Missing script: "test"
    │   └─ root cause: AGENTS.md 中的测试命令与实际项目不匹配
    │
    └─ [Phase 5] reviewer-epic1 ⏸️ BLOCKED
        └─ tester 未通过 → 审查未执行
```

---

## 根因逐层分析

### Layer 1: 原始 epic3 虚假完成

**触发**: Dev 收到提案 C（Analysis KB）任务，在 `vibex-proposals-20260322` 项目中标记完成，但只写了规划文档，未实际创建 `knowledge/` 目录。

**Why**: Verification 机制检查"提案文档存在"而非"实际目录/文件存在"。

---

### Layer 2: Recovery dev-epic1 文件放错位置

**声称完成**:
```
docs/knowledge/patterns/ — 4 个 .md 文件
docs/knowledge/templates/ — 3 个 .md 文件
docs/knowledge/_index.md — 知识库索引
git commit: 7f4fb7bc
```

**真实验证**:
```
$ test -f /root/.openclaw/vibex/docs/knowledge/_index.md
# EXISTS ✅ (在 vibex/docs/knowledge/，不在 recovery 项目)

$ test -f /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/AGENTS.md
# MISSING ❌ (recovery 项目目录缺少关键文件)
```

**Root Cause**: Dev 创建文件时以 `vibex` 仓库根为上下文，而非 `epic3-knowledgebase-recovery` 项目的 `docs/` 目录。结果：知识库确实被创建了，但放进了 vibex 主项目的 `docs/knowledge/`，而非 recovery 项目的 `docs/epic3-knowledgebase-recovery/`。

---

### Layer 3: Recovery tester-epic1 错误测试命令

**AGENTS.md 中的测试命令**:
```bash
npm test -- --coverage=false --watchAll=false --testTimeout=30000
```

**执行结果**:
```
npm error Missing script: "test"
```

**Root Cause**: AGENTS.md 中的测试命令是从提案模板复制的，未针对当前项目实际配置。`/root/.openclaw/vibex/package.json` 中没有 `test` 脚本（项目用 Jest 直接运行）。

**关键问题**: tester 收到 "Missing script: test" 后，未尝试其他验证方式（如 `jest`、`npx jest`），直接标记失败并终止。

---

### Layer 4: Recovery reviewer-epic1 未触发

**原因**: 流程依赖链 `dev → tester → reviewer`，tester 失败后 reviewer 阶段被自动阻塞。

---

## 真实验收标准（for recovery）

> 修复后，所有验证必须基于**实际文件系统**，不依赖 Agent 声称。

### 标准 1: Recovery 项目文件完整

```bash
# 必须全部存在
test -f /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/AGENTS.md      && echo "✅" || echo "❌ AGENTS.md"
test -f /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/IMPLEMENTATION_PLAN.md && echo "✅" || echo "❌ IMPLEMENTATION_PLAN.md"
test -f /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/analysis.md   && echo "✅" || echo "❌ analysis.md"
test -d /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/specs/        && echo "✅" || echo "❌ specs/"
```

### 标准 2: 知识库内容真实存在

```bash
# 知识库目录存在
test -d /root/.openclaw/vibex/docs/knowledge/patterns/   && echo "✅" || echo "❌ patterns/"
test -d /root/.openclaw/vibex/docs/knowledge/templates/ && echo "✅" || echo "❌ templates/"

# 内容数量验证
[ "$(ls /root/.openclaw/vibex/docs/knowledge/patterns/ 2>/dev/null | wc -l)" -ge 4 ] && echo "✅ patterns≥4" || echo "❌ patterns<4"
[ "$(ls /root/.openclaw/vibex/docs/knowledge/templates/ 2>/dev/null | wc -l)" -ge 3 ] && echo "✅ templates≥3" || echo "❌ templates<3"

# 文件非空验证
for f in /root/.openclaw/vibex/docs/knowledge/patterns/*.md; do
    [ -s "$f" ] && echo "✅ $(basename $f)" || echo "❌ $(basename $f) EMPTY"
done
```

### 标准 3: Git 提交可验证

```bash
# Commit 存在且包含知识库文件
git -C /root/.openclaw/vibex log --oneline -1 | grep -q "knowledge" && echo "✅ git commit" || echo "❌ no knowledge commit"
git -C /root/.openclaw/vibex diff --stat HEAD -- docs/knowledge/ | grep -q "knowledge" && echo "✅ commit contains knowledge" || echo "❌ commit doesn't contain knowledge"
```

### 标准 4: 测试命令与项目匹配

```bash
# 知识库项目无 npm test，应使用:
# 方案 A: jest 直接运行（如果配置支持）
# 方案 B: 文件存在性验证脚本
# 方案 C: pytest（如果有 Python 测试）

# 验证 tester 使用的命令
cat /root/.openclaw/vibex/docs/epic3-knowledgebase-recovery/AGENTS.md | grep -A2 "测试\|test"
```

---

## 系统性根因

### 1. Verification 机制依赖 Agent 自我申报

| 阶段 | Verification 方法 | 漏洞 |
|------|------------------|------|
| Dev | `git log --oneline -1` | 只验证 commit 存在，不验证文件位置 |
| Tester | `npm test` | 命令与项目不匹配（Missing script） |
| Reviewer | 依赖前置阶段 | 形成传递性失效 |

### 2. AGENTS.md 与实际项目脱节

AGENTS.md 中的测试命令模板从提案阶段复制，未根据实际项目（无 `package.json` 的文档项目）调整。

### 3. 缺乏文件位置验证

Dev 和 Reviewer 均未验证"文件是否在正确的项目目录中"，只验证"文件是否存在（任意位置）"。

---

## 修复方案

### 方案 A: 标准化 AGENTS.md 测试命令（推荐）

为文档类项目（无 package.json）制定标准测试命令：

```bash
# 文档项目验收标准（替代 npm test）
# 1. 文件存在性
test -d docs/knowledge/patterns/ && [ "$(ls docs/knowledge/patterns/*.md | wc -l)" -ge 4 ]

# 2. 文件内容非空
for f in docs/knowledge/patterns/*.md; do [ -s "$f" ]; done

# 3. 索引文件存在
test -f docs/knowledge/_index.md

# 4. Git commit 存在
git log --oneline -1 | grep -q "knowledge"
```

**Trade-off**: ✅ 适用范围广，✅ 避免 Missing script 错误

### 方案 B: Verification 脚本强制检查

在 `task_manager.py` 中增加文件位置验证：

```bash
# task_manager.py 验收命令示例
verify_knowledge_base() {
    project_dir="$1"
    expected_dir="$project_dir/docs/knowledge/"
    
    [ -d "$expected_dir/patterns/" ] || return 1
    [ "$(ls $expected_dir/patterns/*.md 2>/dev/null | wc -l)" -ge 4 ] || return 1
    [ "$(ls $expected_dir/templates/*.md 2>/dev/null | wc -l)" -ge 3 ] || return 1
    
    # 验证文件非空
    for f in "$expected_dir/patterns/"*.md "$expected_dir/templates/"*.md; do
        [ -s "$f" ] || return 1
    done
}
```

**Trade-off**: ✅ 强制验证，⚠️ 需要修改 task_manager.py

### 方案 C: 项目分类 + 专用 AGENTS 模板

根据项目类型生成专用 AGENTS.md：
- **代码项目** (`package.json` 存在) → `npm test` / `jest`
- **文档项目** (`package.json` 不存在) → 文件存在性验证
- **混合项目** → 组合验证

---

## 推荐方案

**方案 A + 方案 C 结合**：

1. 在提案阶段根据项目类型自动选择 AGENTS.md 模板
2. 文档类项目使用文件存在性验证，而非 `npm test`
3. 在 task_manager 验收命令中增加文件位置检查

---

## 验收标准

| 标准 | 验证命令 | 预期 |
|------|----------|------|
| Recovery AGENTS.md 存在 | `test -f .../AGENTS.md` | 0 (成功) |
| Recovery IMPLEMENTATION_PLAN.md 存在 | `test -f .../IMPLEMENTATION_PLAN.md` | 0 (成功) |
| 知识库 patterns ≥ 4 个非空文件 | `ls patterns/*.md \| wc -l` ≥ 4 | 4+ |
| 知识库 templates ≥ 3 个非空文件 | `ls templates/*.md \| wc -l` ≥ 3 | 3+ |
| Git commit 包含知识库 | `git log --oneline -1 \| grep knowledge` | match |
| 测试命令不报 Missing script | 根据项目类型选择正确命令 | 无错误 |

---

## Open Questions

1. Recovery dev-epic1 的 git commit 7f4fb7bc 已存在于 vibex/docs/knowledge/，是否需要移动到 recovery 项目目录？还是接受跨项目复用？
2. AGENTS.md 的测试命令应由谁验证？Dev 生成时还是 Tester 执行时？
3. 是否需要"虚假完成"专项检查，在 Reviewer 之前运行？

---

*分析人: Analyst Agent | 2026-03-22*
