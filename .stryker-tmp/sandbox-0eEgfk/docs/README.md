# VibeX Docs

VibeX 项目的文档根目录，包含项目架构、设计规范、API 契约、变更日志等核心文档。

## 📁 目录结构

| 目录/文件 | 说明 |
|-----------|------|
| `agent-self-evolution-*/` | Agent 每日自检报告（最近 30 天活跃） |
| `vibex-*/` | 各项目文档目录 |
| `analysis/` | 通用分析模板和报告 |
| `architecture/` | 系统架构文档 |
| `proposals/` | 提案汇总 |
| `prd/` | 产品需求文档 |
| `reviews/` | 审查记录 |
| `templates/` | 文档模板 |
| `guides/` | 使用指南 |
| `knowledge/` | 知识库 |
| `knowledge-base/` | 知识库内容 |
| `bug/` | Bug 追踪 |
| `archive/` | **归档目录**（见下方） |

## 📦 归档目录 (archive/)

废弃文档统一归档在 `archive/202603-stale/`，按主题分类：

| 子目录 | 说明 |
|--------|------|
| `tester-checklists/` | 历史 tester checklist 文件（7 个） |
| `homepage/` | 废弃的首页迭代文档（214 个文件） |
| `domain-model/` | 废弃的 domain-model 相关文档（20 个文件） |
| `button-style/` | 废弃的 button/样式修复文档（10 个文件） |
| `api-fixes/` | 废弃的 API 修复文档（24 个文件） |
| `security/` | 废弃的安全相关文档（16 个文件） |
| `test-infra/` | 废弃的测试基础设施文档（53 个文件） |
| `proposals-dedup/` | 废弃的提案去重文档（97 个文件） |
| `review-reports/` | 历史审查报告（220 个文件） |
| `other-stale/` | 其他废弃文档（224 个文件） |

**总计归档**: 885 个文件（2026-03-28）

## 📋 文档命名规范

> ⚠️ **强制规范**（2026-03-28 起生效）

1. **禁止**使用 `tester-checklist-` 前缀命名新文件，该类文件已统一归档
2. **禁止**使用 `-fix`、`-improve`、`-v2`、`-v3` 等版本后缀，应使用日期戳（如 `-20260328`）
3. **禁止**在 docs/ 根目录创建散落文件，所有项目文档必须在项目目录下
4. **项目文档命名**应使用 `kebab-case`，包含日期或功能描述

## 🔄 文档生命周期规范

> 📅 **归档规则**（2026-03-28 起生效）

- **归档触发条件**: 项目完成或停止维护 **30 天后**
- **归档操作**: 使用 `mv` 移动到 `archive/202603-stale/` 对应分类，**禁止删除**
- **保留白名单**（永不归档）:
  - `agent-self-evolution-*` — Agent 自检报告
  - `vibex-canvas-*` — Canvas 模块
  - `vibex-frontend-*` — Frontend 模块
  - `vibex-doc-fix-*` — 文档修复项目
  - 当前活跃项目（30 天内有更新）
- **归档后**: 更新 `docs/README.md` 和 `CLAUDE.md` 中的引用

## 📄 核心文档

| 文件 | 说明 |
|------|------|
| `api-contract.yaml` | API 契约（OpenAPI 3.0） |
| `LEARNINGS.md` | 项目经验教训 |
| `VIBEX_REQUIREMENTS.md` | 需求总览 |
| `projects.md` | 项目列表 |
| `changelog.md` | 变更日志 |
| `首页PRD.md` | 首页产品需求文档（中文） |
| `首页功能清单.md` | 首页功能清单（中文） |

## 🏷️ 归档记录

| 日期 | 归档数量 | 操作人 | 说明 |
|------|----------|--------|------|
| 2026-03-28 | 885 | Epic2-dev | 首次大规模归档，清理 47+ 废弃文档 |

---

_Last updated: 2026-03-28 by Epic2-dev_
