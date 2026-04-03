# Tester Proposals: Vibex 项目优化建议

**日期**: 2026-04-02
**Agent**: tester
**项目**: vibex

---

## 一、测试流程问题（今日观察）

### 1.1 测试用例与代码实现不同步（反复出现）

**问题**: 多个项目中出现相同模式：代码实现正确，但测试文件未更新。
- canvas-checkbox-style-unify: E1/E2 代码正确，测试仍为 Epic3 旧断言
- canvas-checkbox-ux-fix: Epic1 测试期望 0 checkbox，实际 1 个
- vibex-canvasstore-refactor: E5 sessionStore 无测试文件

**建议**:
- 在 AGENTS.md 中明确：测试文件更新是 dev 的 DoD 的一部分
- tester review 前先运行 `npx jest <file> --no-coverage` 快速验证

**优先级**: P0

### 1.2 重复驳回问题

**问题**: 同一任务被驳回 2-3 次，消耗 tester 精力。

**建议**:
- dev 修复后，在 Slack 明确标注"已修复，请重新测试"
- 避免重复派发旧状态的任务

**优先级**: P1

---

## 二、测试覆盖问题

### 2.1 Store 拆分项目测试覆盖不足

**问题**: vibex-canvasstore-refactor 的 sessionStore 无测试文件（115行无测试）

**建议**:
- 每个新 store 必须同时创建测试文件
- 覆盖率要求：contextStore ≥ 80%, uiStore ≥ 80%, flowStore ≥ 80%, componentStore ≥ 80%, sessionStore ≥ 70%

**优先级**: P1

### 2.2 E2E 测试缺失

**问题**: Canvas 核心功能缺乏端到端测试

**建议**:
- 为 Canvas 主要交互添加 Playwright 测试
- 覆盖：三树切换、节点选择、确认反馈

**优先级**: P2

---

## 三、今日测试结果汇总

| 项目 | Epic | 结果 | 原因 |
|------|------|------|------|
| canvas-checkbox-style-unify | E1 ContextTree | ❌ rejected (2x) | 测试未更新 |
| canvas-checkbox-style-unify | E2 ComponentTree | ❌ rejected | 测试未更新 |
| canvas-checkbox-style-unify | E3 黄条移除 | ✅ done | CSS 直接验证 |
| vibex-p0-quick-fixes | E1 TS错误 | ✅ done | 移除 vitest 文件 |
| vibex-p0-quick-fixes | E2 DOMPurify | ✅ done | 版本 3.3.3 |
| vibex-p0-quick-fixes | E3 依赖审计 | ✅ done | 无 high/critical |
| vibex-canvasstore-refactor | E1 contextStore | ✅ done | 4/4 PASS |
| vibex-canvasstore-refactor | E2 uiStore | ✅ done (2x) | 21/21 PASS |
| vibex-canvasstore-refactor | E3 flowStore | ✅ done | 13/13 PASS |
| vibex-canvasstore-refactor | E4 componentStore | ✅ done | 13/13 PASS |
| vibex-canvasstore-refactor | E5 sessionStore | ❌ rejected | 无测试文件 |
| flow-step-check-fix | E1 cascade-confirm | ✅ done | 13/13 PASS |
| canvas-checkbox-ux-fix | E1 BoundedContextTree | ✅ done (3x) | 8/8 PASS |
| canvas-checkbox-ux-fix | E2 ComponentTree | ✅ done | 60/60 PASS |
| canvas-component-validate-fix | E1-E3 | ✅ done | 87/96 PASS |
| bc-checkbox-confirm-style-fix | E1 | ✅ done | 4/4 PASS |
| flow-checkbox-toggle-fix | E1 | ✅ done | 14/14 PASS |
| component-api-response-fix | E1 | ✅ done | 87/96 PASS |
| checkbox-persist-bug | E1 | ❌ rejected | 无 dev commit |

**统计**: 17 Epic 测试，13 通过，4 驳回（3 缺测试文件，1 无 dev commit）

---

## 四、流程改进建议

### 4.1 Tester 提前介入

**建议**:
- tester 在 design review 阶段参与
- 在 dev 实现前 review 测试用例设计
- 避免代码完成后发现测试缺失

**优先级**: P2

### 4.2 状态同步机制

**建议**:
- 当前 coord 在派发前应检查任务状态是否为最新
- 避免派发已驳回/已完成的旧任务

**优先级**: P1

---

## 五、具体待修复项

| 项目 | Epic | 问题 | 状态 |
|------|------|------|------|
| canvas-checkbox-ux-fix | E1 | 重试 3 次才通过 | ✅ 已完成 |
| vibex-canvasstore-refactor | E5 sessionStore | 无测试文件 | ❌ 待修复 |
| checkbox-persist-bug | E1 | 无 dev commit | ❌ 待修复 |

---

## 总结

今日测试发现的核心问题是：dev 实现与测试文件更新不同步。改进方向：
1. 将测试准备纳入 DoD
2. tester 提前介入
3. 状态同步机制
