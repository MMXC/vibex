# Epic0 Reviewer 驳回争议升级 — 2026-04-12

## 问题描述

**reviewer-epic0-紧急修复（p0-—-sprint-0）** 被 reviewer 连续驳回7次。

## 核心分歧

| 审查方 | 期望 | 实际情况 |
|--------|------|----------|
| reviewer | `packages/__tests__/auth/mock-factory.ts` + `createMockUser/createMockSession` | 文件不存在 |
| IMPL PLAN | `tests/unit/__mocks__/auth/index.ts` + `createAuthStoreMock/createAuthApiMock` | **已实现** (b4cb4956) |

## 已验证的事实

1. `tests/unit/__mocks__/auth/index.ts` 存在，4753 bytes，2026-04-10
2. commit b4cb4956 在 main 分支：`git branch --contains b4cb4956` → main ✅
3. CHANGELOG.md:262-271 有完整 E0.2 记录 ✅
4. Auth API 测试 (jest): 14/14 passed ✅
5. Auth 单元测试 (vitest): 21/21 passed ✅

## 真正需要修复的问题

**3个测试失败**（与 Auth Mock Factory 无关）:
1. `canvas-module-exports.test.ts` (2 fails) — CSS @forward 指令数量断言
2. `MermaidCodeEditor.test.tsx` (1 fail) — 组件导出类型无效

## 建议

1. **方案A**: 更新 IMPL PLAN，将文件路径改为 `packages/__tests__/auth/mock-factory.ts`，让 dev 按 reviewer 期望重新实现
2. **方案B**: 确认 IMPL PLAN 正确，强制 reviewer 按 `tests/unit/__mocks__/auth/index.ts` 验收
3. **立即修复**: 3个失败的测试（canvas-module-exports × 2, MermaidCodeEditor × 1）

## 时间线

- 08:05 — tester 完成验收 (done)
- 08:56 — reviewer 第1次驳回 (错误理由)
- 09:12 — reviewer 第2次驳回 (同样错误)
- 09:27 — reviewer 第3-6次驳回 (同样错误)
- 10:16 — reviewer 第7次驳回 (同样错误)


## Epic1 补充证据 (2026-04-12 11:33)

origin/main 核实:
```
git ls-tree origin/main -- vibex-fronted/tests/unit/__mocks__/auth/index.ts
→ 100644 blob cac7d722 ✅

git ls-tree origin/main -- vibex-fronted/src/components/canvas/panels/TreeErrorBoundary.tsx  
→ 100644 blob 604146dc ✅

git ls-tree origin/main -- vibex-backend/src/lib/log-sanitizer.ts
→ 100644 blob 2002e4e1 ✅

git log origin/main | grep b4cb4956
→ b4cb4956 feat(test): E0.2 create centralized auth mock factory ✅

git log origin/main | grep e251c813
→ e251c813 feat(docs): E2 create PROPOSALS_STATUS_SOP.md ✅
```

结论: reviewer对git仓库的检查有误，origin/main包含所有声称缺失的代码。
