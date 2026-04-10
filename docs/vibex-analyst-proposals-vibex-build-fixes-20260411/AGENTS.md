# AGENTS.md — 开发约束

**项目**: vibex-build-fixes-20260411
**角色**: Architect
**日期**: 2026-04-11

---

## 约束说明

本项目为纯构建修复，无新增功能代码。以下约束适用于后续开发者参考。

---

## 1. 变更范围约束

**允许操作**:
- ✅ 删除孤立文件（`CanvasHeader.stories.tsx`）
- ✅ 提交工作区已有的代码修复
- ✅ 推送修复到 main

**禁止操作**:
- ❌ 修改任何业务逻辑代码
- ❌ 引入新的依赖或配置变更
- ❌ 修改 feat/e2-code-cleanup 分支状态
- ❌ 修改任何 .env 文件

---

## 2. 质量门槛

- `pnpm build` 前后端均退出码 0
- `tsc --noEmit` 前后端均退出码 0
- commit 包含清晰的修复描述

---

## 3. 分支策略

- 直接在 main 分支操作（构建修复为一次性任务）
- feat/e2-code-cleanup 分支合并时需额外验证

---

## 4. 审查要求

修复提交前需确认:
1. 前端 `pnpm build` 成功
2. 后端 `pnpm build` 成功
3. `tsc --noEmit` 前后端均通过
