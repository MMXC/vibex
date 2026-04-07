# Architecture: VibeX Canvas Evolution Fix

> **项目**: vibex-canvas-evolution-fix  
> **版本**: v1.0.0  
> **日期**: 2026-03-29  
> **类型**: 修复型架构（Process Improvement）  
> **状态**: Active  

---

## 1. 背景与问题

本次修复源于 **CHANGELOG.md 遗漏** 问题：PRD 和架构文档正常产出，但 CHANGELOG.md 作为项目必选产物未被创建，导致其他 Agent 无法追踪项目变更历史。根因分析表明，Phase1 任务缺少明确的产物清单校验机制——AGENTS.md 中的必须产物列表未包含 CHANGELOG.md，且没有脚本化的事后验证。

---

## 2. CHANGELOG.md 放置位置规范

**规范**：每个项目文档目录（`docs/<project>/`）下必须有 `CHANGELOG.md`，由该项目的实施 Agent 负责创建和维护。

- **位置**: `docs/<project>/CHANGELOG.md`
- **格式**: 从上游 changelog page（如 Next.js、React）或项目内 `src/app/changelog/` 导出 Markdown 版本
- **内容**: 版本号、日期、commit ID、变更项（含 emoji 状态标记 ✅/⚠️）
- **校验**: `grep -n "CHANGELOG" docs/<project>/AGENTS.md` 必须有输出；CI 阶段检查产物完整性

当前修复项 `docs/vibex-canvas-evolution-roadmap/CHANGELOG.md` 位置符合规范（47行，从 Next.js changelog page 导出），AGENTS.md 已更新添加 CHANGELOG.md 为必须产物 ✅。

---

## 3. 多项目提交管理策略

**问题**: 本次修复涉及 5 个项目共 28 个文件分散在 workspace 中，历史 commit 记录混乱。

**策略**:

1. **单项目单 commit 原则**: 每个子项目（如 `agent-proposals-20260329`、`architecture`）独立 commit，commit message 格式统一为 `<type>(<scope>): <description>`（参考 Conventional Commits）
2. **主项目索引**: 主项目 `vibex-canvas-evolution-roadmap` 的 AGENTS.md 作为入口文档，通过相对路径引用所有子项目文档（如 `../agent-proposals-20260329/analysis.md`）
3. **统一 commit 入口**: 修复类任务完成后，由 Coord Agent 统一归并——主项目 commit 包含变更摘要，CI 验证产物完整性
4. **禁止跨项目混commit**: 一个 commit 不应同时修改多个不相关的项目目录

---

## 4. 防止同类问题再次发生的机制

**机制 1: 产物清单强校验（CI 门禁）**

每个 Phase1/Phase2 项目的 CI pipeline 增加产物完整性检查脚本：
```bash
# 验证所有必须产物存在
REQUIRED_FILES=(
  "docs/<project>/analysis.md"
  "docs/<project>/prd.md"
  "docs/<project>/architecture.md"
  "docs/<project>/AGENTS.md"
  "docs/<project>/CHANGELOG.md"
)
for f in "${REQUIRED_FILES[@]}"; do
  [ -f "$f" ] || { echo "MISSING: $f"; exit 1; }
done
```
缺失任何一项则 CI 失败，block merge。

**机制 2: AGENTS.md 产物清单模板化**

在 `task_manager.py phase1` 生成的 AGENTS.md 中，预置必须产物清单（含 CHANGELOG.md），Agent 执行任务时不得删除清单项，产物完成后标记 `[x]`。

**机制 3: Coord Agent 双重验证**

每个 Phase1 任务完成后，Coord Agent 在标记 done 前执行：
1. 读取 AGENTS.md 必须产物列表
2. 逐项检查文件是否存在
3. 缺失则创建 fix 子任务，不放行

---

## 5. ADR（Architecture Decision Record）

| ADR | 决策 | 理由 | 状态 |
|-----|------|------|------|
| ADR-1 | 每个项目必须有 CHANGELOG.md | 变更历史可追溯，多 Agent 协作必需 | ✅ Accepted |
| ADR-2 | CI 产物完整性门禁 | 防止人工疏漏导致产物遗漏 | ✅ Accepted |
| ADR-3 | 单项目单 commit + 主项目索引 | 保持提交历史清晰可维护 | ✅ Accepted |

---

## 6. Changelog

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-03-29 | v1.0.0 | 初始架构文档：CHANGELOG.md 规范 + 多项目提交策略 + 防复发机制 |
