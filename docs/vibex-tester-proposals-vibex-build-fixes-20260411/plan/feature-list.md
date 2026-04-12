# Feature List — VibeX 构建修复（Tester 视角）

**项目**: vibex-tester-proposals-vibex-build-fixes-20260411
**基于**: Tester 视角分析 (analysis.md)
**日期**: 2026-04-11
**Plan 类型**: fix + feat
**Plan 深度**: Lightweight

---

## Feature List

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|----------|----------|
| F1.1 | 删除孤立 Story 文件 | 删除 `CanvasHeader.stories.tsx` | 问题1 | 5 min |
| F1.2 | 替换 Unicode 弯引号 | 3个 route.ts 弯引号 → ASCII | 问题2 | 5 min |
| F1.3 | 前端构建验证 | `next build` 退出码 0 | - | 5 min |
| F1.4 | 后端构建验证 | `pnpm build` 退出码 0 | - | 5 min |
| T2.1 | Smoke Test | 核心功能冒烟测试（登录/创建项目/画布加载） | QA | 2h |
| T2.2 | 回归测试 | 修复影响范围回归验证 | QA | 2h |
| T2.3 | Storybook 构建测试 | `build-storybook` CI 验证 | 防止回归 | 1h |
| T2.4 | Unicode 扫描验证 | 全库弯引号扫描无残留 | 防止回归 | 1h |

**总工时**: ~7h（Phase1 20min + Phase2 ~6h）

---

## Epic 划分

| Epic | 主题 | 包含 Story | 工时 |
|------|------|-----------|------|
| Epic 1 | 紧急修复与验证 | F1.1, F1.2, F1.3, F1.4 | 20 min |
| Epic 2 | QA 验证体系 | T2.1, T2.2, T2.3, T2.4 | 6h |

---

## 依赖关系

```
Epic 1 → 先执行（解除阻塞）
Epic 2 → 依赖 Epic 1 完成
```
