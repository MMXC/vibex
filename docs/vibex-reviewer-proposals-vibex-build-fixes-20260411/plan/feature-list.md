# Feature List — VibeX 构建修复（Reviewer 视角）

**项目**: vibex-reviewer-proposals-vibex-build-fixes-20260411
**基于**: Reviewer 提案 (proposal.md)
**日期**: 2026-04-11
**Plan 类型**: fix + feat
**Plan 深度**: Lightweight

---

## Feature List

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|----------|----------|
| F1.1 | 删除孤立 Story 文件 | 删除 `CanvasHeader.stories.tsx`（引用的组件不存在） | 问题1 | 5 min |
| F1.2 | 替换 Unicode 弯引号 | 3个 route.ts 弯引号 → ASCII 直引号 | 问题2 | 5 min |
| F1.3 | 全量验证构建 | 前端 `next build` + 后端 `pnpm build` 验证 | - | 5 min |
| F2.1 | PR 合入标准文档化 | 明确构建/代码质量/安全检查清单 | 合入标准 | 1h |
| F3.1 | Story 孤立组件检查脚本 | CI 中验证 story 文件引用的组件均存在 | 规则1 | 2h |
| F3.2 | ESLint 弯引号规则 | `no-irregular-whitespace` 规则 + pre-commit hook | 规则2 | 1h |
| F3.3 | Storybook 构建纳入 CI | `build-storybook` 加入 GitHub Actions | 规则4 | 1h |
| F4.1 | 自动化 CI 质量门禁 | TypeScript + ESLint + Prettier + 弯引号扫描 | 门禁1-6 | 2h |

**总工时**: ~8h

---

## Epic 划分

| Epic | 主题 | 包含 Story | 工时 |
|------|------|-----------|------|
| Epic 1 | 构建修复 | F1.1, F1.2, F1.3 | 15 min |
| Epic 2 | PR 合入标准 | F2.1 | 1h |
| Epic 3 | 预防规则（CI/ESLint） | F3.1, F3.2, F3.3 | 4h |
| Epic 4 | 质量门禁体系 | F4.1 | 2h |

---

## 依赖关系

```
Epic 1 → 先执行（解除阻塞）
Epic 2 → 可与 Epic 1 并行
Epic 3 → 依赖 Epic 1 完成
Epic 4 → 依赖 Epic 3 完成
```
