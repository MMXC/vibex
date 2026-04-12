# Feature List — VibeX 构建修复（Architect 视角）

**项目**: vibex-architect-proposals-vibex-build-fixes-20260411
**基于**: Architect 提案 (proposal.md)
**日期**: 2026-04-11
**Plan 类型**: fix + feat
**Plan 深度**: Lightweight

---

## Feature List

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|----------|----------|
| F1.1 | 删除孤立 Story 文件 | 删除 `CanvasHeader.stories.tsx` | 问题1 | 5 min |
| F1.2 | 替换 Unicode 弯引号 | 3个 route.ts 弯引号 → ASCII | 问题2 | 5 min |
| F1.3 | 全量构建验证 | next build + pnpm build | - | 5 min |
| L1.1 | ESLint no-irregular-whitespace | 阻止弯引号进入代码库 | L1 预防 | 1h |
| L1.2 | pre-commit tsc --noEmit | 阻止类型错误进入代码库 | L1 预防 | 1h |
| L1.3 | Story-Component 同步 SOP | PR 模板增加同步检查项 | L1 预防 | 1h |
| L2.1 | CI TypeScript Gate（前端） | PR 级别阻断前端类型错误 | L2 检测 | 1h |
| L2.2 | CI TypeScript Gate（后端） | PR 级别阻断后端类型错误 | L2 检测 | 1h |
| L3.1 | Storybook 构建纳入 CI | build-storybook 加入 CI | L3 监控 | 1h |
| L3.2 | 构建时间基线监控 | 记录并监控构建时长 | L3 监控 | 1h |
| L4.1 | 快速 revert 策略文档化 | 减少 MTTR | L4 恢复 | 1h |

**总工时**: ~9h（构建修复15min + CI/CD L1-L4 增强~8.5h）

---

## Epic 划分

| Epic | 主题 | 包含 Story | 工时 |
|------|------|-----------|------|
| Epic 1 | 构建修复 | F1.1, F1.2, F1.3 | 15 min |
| Epic L1 | L1 预防层 | L1.1, L1.2, L1.3 | 3h |
| Epic L2 | L2 检测层 | L2.1, L2.2 | 2h |
| Epic L3 | L3 监控层 | L3.1, L3.2 | 2h |
| Epic L4 | L4 恢复层 | L4.1 | 1h |

---

## 依赖关系

```
Epic 1 → 先执行（解除阻塞）
Epic L1-L4 → 顺序执行（预防→检测→监控→恢复）
```
