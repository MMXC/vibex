# PRD: vibex-canvas-evolution-fix — 修复 Phase1 审查红线

**Agent**: PM
**Date**: 2026-03-29
**Task**: vibex-canvas-evolution-fix/create-prd
**Status**: 🔄 编写中

---

## 1. 执行摘要

### 1.1 背景

`vibex-canvas-evolution-roadmap` 项目 Phase1（样式统一 + 导航修复）审查时发现两条红线：

1. **CHANGELOG.md 缺失**：`docs/CHANGELOG.md` 不存在，无法记录 Phase1 变更
2. **未提交改动**：`git status` 显示存在未提交的改动

### 1.2 目标

- 创建标准化 CHANGELOG.md，记录 Phase1 所有变更条目
- 审查并提交所有未提交改动（28 个文件来自其他项目）

### 1.3 成功指标

| 指标 | 目标 |
|------|------|
| CHANGELOG.md 存在且格式标准 | ✅ |
| Phase1 条目数量 | ≥ 1 |
| 未提交文件数 | 0 |
| Git 工作区干净 | ✅ |

---

## 2. Epic 拆分

### Epic 1: CHANGELOG.md 规范化（P0）

**目标**：建立标准变更日志，记录 Phase1 产出

**Story 列表**：

| Story ID | As a... | I want to... | So that... | 优先级 |
|----------|---------|--------------|------------|--------|
| F1.1 | developer | 创建 docs/CHANGELOG.md | 变更历史有据可查 | P0 |
| F1.2 | developer | CHANGELOG 包含 Phase1 所有变更条目 | review 时能验证变更范围 | P0 |
| F1.3 | reviewer | CHANGELOG 符合 Keep a Changelog 1.0 格式 | 格式规范可被自动解析 | P0 |
| F1.4 | developer | changelog.md（小写）与 CHANGELOG.md（标准）共存 | 兼顾历史文件与新标准 | P1 |

**验收标准**：

| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | 项目根目录 | `ls docs/CHANGELOG.md` | 文件存在 |
| AC1.2 | CHANGELOG.md | 读取文件内容 | 包含 `[Phase1]` 标签 + 日期 |
| AC1.3 | CHANGELOG.md | 读取文件内容 | 包含 ≥ 1 条 `[Added/Changed/Fixed]` 条目 |
| AC1.4 | CHANGELOG.md | 格式检查 | 符合 Keep a Changelog 1.0 规范 |

**DoD**：`expect(exists("docs/CHANGELOG.md")) && expect(grep("Phase1", "docs/CHANGELOG.md"))`

---

### Epic 2: 未提交改动收口（P0）

**目标**：审查并提交所有未提交改动，确保 git 工作区干净

**Story 列表**：

| Story ID | As a... | I want to... | So that... | 优先级 |
|----------|---------|--------------|------------|--------|
| F2.1 | developer | 扫描所有未提交文件 | 了解变更范围 | P0 |
| F2.2 | developer | 审查每个未提交文件的变更内容 | 确保变更正确且必要 | P0 |
| F2.3 | developer | 将合理改动提交到对应项目分支 | git 工作区干净 | P0 |
| F2.4 | reviewer | 审查提交的变更符合规范 | 无安全隐患或破坏性变更 | P1 |

**验收标准**：

| ID | Given | When | Then |
|----|-------|------|------|
| AC2.1 | vibex 根目录 | `git status --short` | 输出为空（工作区干净） |
| AC2.2 | 所有提交的 commit | 检查 message | 符合 Conventional Commits 格式 |
| AC2.3 | docs/ 目录 | 变更审查 | 所有文档变更有合理理由 |

**DoD**：`expect(trim(exec("git status --short")) === "")`

---

## 3. 实施计划

### Phase 1: CHANGELOG 创建（~15min）

1. 创建 `docs/CHANGELOG.md`，采用 Keep a Changelog 格式
2. 读取 `vibex-canvas-evolution-roadmap` Phase1 所有 commits
3. 生成变更条目（Added/Changed/Fixed）
4. 审查并补充缺失条目
5. Commit + Push

### Phase 2: 未提交改动处理（~30min）

1. `git status --short` 扫描所有未提交文件
2. 按项目分组审查每批改动
3. 判断：提交 / 忽略 / 归档
4. 对每批改动写 commit message（Conventional Commits）
5. `git push` 推送所有分支
6. 最终验证 `git status` 为空

---

## 4. 验收清单

### P0（必须交付）

- [ ] `docs/CHANGELOG.md` 已创建
- [ ] CHANGELOG 包含 Phase1 变更条目（≥ 1 条）
- [ ] `git status --short` 输出为空
- [ ] 所有 commit message 符合 Conventional Commits 格式

### P1（审查后交付）

- [ ] changelog.md 小写文件已确认（历史文件保留）
- [ ] 未提交文件分类记录（提交/忽略）有文档记录

---

## 5. 风险

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| 未提交文件包含破坏性变更 | 低 | 高 | 逐文件审查，不批量提交 |
| CHANGELOG 格式不规范 | 低 | 中 | 参照 Keep a Changelog 1.0 模板 |

---

*PRD 版本：v1.0 | PM：vibex-canvas-evolution-fix | 创建时间：2026-03-29*
