# Learnings: vibex-sprint-0412 (2026-04-12)

## Project Summary
- **Goal**: P0 基础设施修复（Auth Mock + TS 错误 + CI 门禁）+ P1/P2 增强
- **Epics**: E0–E7 (8 epics), all completed
- **Duration**: ~3 hours pipeline execution
- **Team**: analyst → pm → architect → coord → dev/tester/reviewer (per Epic)

## Key Learnings

### 1. E5 测试管道重入 Bug（Critical）
**问题**: tester-e5 驳回 dev-e5 后，dev-e5 重新提交了 commit (433c0f8e)，触发了新的 tester-e5。但 tester-e5 是在驳回发生前派发的任务，检查的是未修复的代码，导致再次驳回。

**根因**: 驳回发生时，如果 upstream dev 已经重新提交，下游 tester 需要重新派发。但派发的 tester 任务实例是驳回前创建的，检查的是旧代码。

**防范**: tester 任务在执行时应先 `git pull` 拉取最新代码再测试。

### 2. stability.spec.ts 路径 Bug
**问题**: `__dirname = tests/e2e`，`resolve('..')` 指向 `tests/` 而非 `vibex-fronted/`，导致扫描路径错误。

**修复**: `const VIBEX_FRONTED_DIR = resolve(__dirname, '../..')`

**发现**: tester 发现，E6 reviewer 在 review 时直接修复了（commit df3b8cba）。

### 3. Cross-Epic Commit 污染
**问题**: E6 reviewer-push 包含了 E5 相关文件 (stability.spec.ts) 的修复，导致 E5 的测试管道重新被触发。

**防范**: reviewer-push 前应检查 diff 是否只包含本 Epic 内容。

### 4. False Positive Test Rejections
**问题**: `findSpecFiles()` 只扫描 `.spec.ts` 文件，漏掉 `.ts` 文件中的 `waitForTimeout` 违规。

**防范**: 扫描函数应同时包含 `.spec.ts` 和 `.test.ts` 以及其他 `.ts` 测试文件。

### 5. TS Error Scope（206 错误）
**发现**: TypeScript 有 206 个错误，太大无法在一个 Sprint 完成。后续 Epic 拆分：
- E0.1: TypeScript 修复
- E0.2: Auth Mock Factory

### 6. 虚假完成检测
**验证方法**: `git fetch && git log origin/main -1` 确认远程 commit 存在。

## Process Improvements
1. tester 任务开始时强制 `git pull`
2. reviewer-push 前强制 diff 检查
3. 扫描函数路径修正为 `../..`
