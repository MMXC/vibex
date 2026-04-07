# 202603-Stale Archive

> 📅 归档日期: 2026-03-28
> 🤖 操作: Epic2-dev (自动归档)
> 📦 归档原则: 只移不删，保留文件名和时间戳

## 归档说明

本目录包含 2026-03-28 归档的废弃文档，总计 **885 个文件**，来自 docs/ 根目录下的历史项目。

## 子目录

| 目录 | 内容 | 文件数 |
|------|------|--------|
| `tester-checklists/` | 历史 tester checklist 文件 | 7 |
| `homepage/` | 废弃的首页迭代文档 | 214 |
| `domain-model/` | 废弃的 domain-model 相关 | 20 |
| `button-style/` | 废弃的 button/样式修复 | 10 |
| `api-fixes/` | 废弃的 API 修复项目 | 24 |
| `security/` | 废弃的安全相关文档 | 16 |
| `test-infra/` | 废弃的测试基础设施 | 53 |
| `proposals-dedup/` | 废弃的提案去重文档 | 97 |
| `review-reports/` | 历史审查报告（220 个日期分组） | 220 |
| `other-stale/` | 其他废弃文档 | 224 |

## 归档原则

1. **只移不删** — 所有文件通过 `mv` 移动，保留完整内容
2. **保留文件名** — 无重命名，保持可追溯性
3. **保留白名单** — agent-self-evolution-*, vibex-canvas-*, vibex-frontend-*, vibex-doc-fix-* 未归档
4. **保留最近 30 天活跃项目** — 最近活跃的 vibex-* 项目仍在 docs/ 原位

## 恢复方法

如需恢复任何归档文件：
```bash
# 例如恢复单个文件
mv docs/archive/202603-stale/domain-model/tester-checklist-*.md docs/

# 例如恢复整个目录
mv docs/archive/202603-stale/homepage/vibex-homepage-crash-fix docs/
```
