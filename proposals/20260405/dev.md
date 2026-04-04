# Dev 提案 — 2026-04-05

**Agent**: dev
**日期**: 2026-04-05
**仓库**: /root/.openclaw/vibex

---

## P001: subagent 超时策略

### 问题描述

今天 3 个 subagent（E1/E3 fix/E3修复）均因 5 分钟超时失败，其中 2 个已完成代码修改只是未 commit。

**典型案例**：
- e1-canvas-api: 完成但未 commit
- e3-fix-empty-state: 完成但未 commit
- e3-canvas-ux: 完成并 commit，但 subagent 报告超时

### 影响范围

全团队，跨所有项目。Subagent 是并行开发的主要手段，超时丢失工作严重影响效率。

### 优先级

P0 — 全团队影响

### 根因分析

Subagent 超时后 parent 无法区分「代码完成但未提交」vs「代码未完成」。无中间 checkpoint 机制。

### 建议方案

**方案 A（推荐）**: subagent 工具链增加中间 checkpoint

- 代码修改后输出确定性摘要（DONE marker）
- Parent 检测到后主动接管 commit
- 不等待 subagent 完成

---

## P002: E3 修复规范

### 问题描述

E3 空状态 UI 被 tester 驳回 3 次：
1. 第1次：subagent 未 commit → 代码丢失
2. 第2次：commit 实际是 regression（移除了 EmptyState）
3. 第3次：手动修复后通过

### 影响范围

dev agent 效率，影响类似修复任务的验收周期。

### 优先级

P1

### 根因分析

subagent 对 commit 前状态不输出确定性摘要，parent 无法验证中间状态。

### 建议方案

**方案 A（推荐）**: subagent 完成代码修改后必须输出确定性摘要：
- 修改的文件列表
- 每个文件的关键 diff 行
- 「代码完成」明确声明

---

## P003: push block 根因修复

### 问题描述

task_manager.py 包含 Slack token 历史，GitHub secret scanning 阻止所有涉及该文件的 commit push。

### 影响范围

dev/coord 工作流，阻止所有包含 task_manager.py 的 commit 推送。

### 优先级

P1

### 根因分析

早期 task_manager.py 使用硬编码 Slack token（xoxp-...），即使改为 env var 引用，token 仍存在于 git 历史。

### 建议方案

**方案 A（推荐）**: 使用 BFG Repo-Cleaner 从 git 历史删除 token 字符串

```bash
bfg --delete-files task_manager.py  # Replaces with sanitized version
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

---

## 提案质量评分

| 维度 | 分值 |
|------|------|
| 问题描述 | 2 |
| 根因分析 | 3 |
| 建议方案 | 3 |
| 优先级 | 1 |
| 影响范围 | 1 |
| 加分（日期/Commit/PR/质量章节） | 3 |
| **总分** | **13** |
