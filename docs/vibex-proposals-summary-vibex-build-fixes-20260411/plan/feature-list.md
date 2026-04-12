# Feature List — VibeX 提案汇总（Summary 视角）

**项目**: vibex-proposals-summary-vibex-build-fixes-20260411
**基于**: 各角色提案汇总分析 (analysis.md)
**日期**: 2026-04-11
**Plan 类型**: fix
**Plan 深度**: Lightweight

---

## Feature List

| ID | 功能点 | 描述 | 来源 | 工时估算 |
|----|--------|------|------|----------|
| F1.1 | 删除孤立 Story 文件 | 删除 `CanvasHeader.stories.tsx` | 共识 | 5 min |
| F1.2 | 替换 Unicode 弯引号 | 3个 route.ts 弯引号 → ASCII | 共识 | 5 min |
| F1.3 | 全量构建验证 | next build + pnpm build | 共识 | 5 min |
| P2.1 | CI TypeScript Gate | 前端+后端 TS 类型检查 | Architect/Reviewer | 2h |
| P2.2 | ESLint 规则加固 | no-irregular-whitespace | Architect | 1h |
| P2.3 | pre-commit hook | tsc + 弯引号扫描 | Architect | 1h |
| P2.4 | Story孤立检查脚本 | CI 验证 story 引用组件存在 | Reviewer | 2h |
| P2.5 | PR 合入标准文档 | 构建/质量/安全三部分清单 | Reviewer | 1h |

**总工时**: ~8h（Phase1 15min + Phase2 ~7.5h）

---

## Epic 划分（两阶段）

| Epic | 主题 | 包含 Story | 工时 | 来源 |
|------|------|-----------|------|------|
| Epic 1 | 紧急修复 | F1.1, F1.2, F1.3 | 15 min | 全部共识 |
| Epic 2 | CI/CD 增强 | P2.1, P2.2, P2.3, P2.4, P2.5 | 7.5h | Architect + Reviewer |

---

## 依赖关系

```
Epic 1 → 先执行（解除阻塞）
Epic 2 → 依赖 Epic 1 完成（可选增强）
```
