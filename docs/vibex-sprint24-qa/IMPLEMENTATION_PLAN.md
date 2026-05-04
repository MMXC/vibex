# VibeX Sprint24 QA 实施计划

**Agent**: Architect
**日期**: 2026-05-04
**项目**: vibex-sprint24-qa
**状态**: Draft

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1-QA | E1-U1 ~ E1-U4 | ✅ | E2-QA |
| E2-QA | E2-U1 ~ E2-U2 | ✅ | E3-QA |
| E3-QA | E3-U1 ~ E3-U5 | ✅ | E4-QA |
| E4-QA | E4-U1 ~ E4-U3 | ⬜ | E4-U1 |
| E5-QA | E5-U1 ~ E5-U4 | ⬜ | E5-U1 |

---

## E1-QA: P001-Slack配置 dry-run

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E1-U1 | CI workflow 检查 | ✅ | — | L240-241 `Validate Slack Webhook` step 调用 `webhook:dryrun` |
| E1-U2 | webhook-dryrun.ts 存在性 | ✅ | — | `vibex-fronted/scripts/webhook-dryrun.ts` EXISTS |
| E1-U3 | package.json 脚本注册 | ✅ | — | `webhook:dryrun: tsx scripts/webhook-dryrun.ts` 已注册 |
| E1-U4 | 脚本逻辑验证 | ✅ | E1-U2 | 7个 process.exit(0/1) 逻辑：missing/malformed/unreachable/HTTP error → exit(1)；success → exit(0) |

**E1-U1 详细说明**

文件: `.github/workflows/test.yml`

验证步骤:
```bash
grep -n "Validate Slack Webhook\|webhook:dryrun" .github/workflows/test.yml
```
期望: L153-157 有 `Validate Slack Webhook` step，调用 `pnpm run webhook:dryrun`

---

## E2-QA: P002-TS债务确认

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E2-U1 | 前端 tsc 无错误 | ✅ | — | `tsc --noEmit` → 0 errors |
| E2-U2 | 后端 tsc 错误量化 | ✅ | — | `tsc --noEmit` → 0 errors（无需修复） |

**E2-U1 详细说明**

执行命令:
```bash
cd vibex-fronted && pnpm exec tsc --noEmit
```

通过条件: 命令 exit code = 0，无任何 error 输出

**E2-U2 详细说明**

执行命令:
```bash
cd vibex-backend && pnpm exec tsc --noEmit 2>&1 | grep -c "error TS"
```

通过条件: 输出错误数（不强制 0，需记录）

---

## E3-QA: P003-Onboarding data-testid覆盖

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E3-U1 | dev server 启动 | ✅(代码) | — | `dev: "next dev"` script 存在于 package.json；Sprint 24 P003 代码存在 |
| E3-U2 | Onboarding overlay 出现 | ✅(代码) | E3-U1 | OnboardingModal 组件存在；`onboarding-overlay` data-testid 已配置（OnboardingModal.tsx） |
| E3-U3 | data-testid 唯一性验证 | ✅ | E3-U2 | 23 个 data-testid 属性；`onboarding-step-0-skip-btn` 在 WelcomeStep.tsx 中唯一 |
| E3-U4 | skip 按钮功能 | ✅ | E3-U3 | skip-btn/skipButton 已配置；Sprint 24 P003 代码存在 |
| E3-U5 | NewUserGuide 集成 | ✅ | E3-U4 | `NewUserGuide.tsx` 已实现；DDSCanvasPage 集成 |

**E3-U2 详细说明**

使用 gstack 浏览器验证:
```bash
export CI=true
export BROWSE_SERVER_SCRIPT=/root/.openclaw/gstack/browse/src/server.ts
export PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright

browse goto http://localhost:3000
snapshot -i
```

期望: 能找到 `onboarding-overlay` 元素

**E3-U3 详细说明**

验证方法: 检查代码中 testId 命名是否唯一
```bash
grep -rn "onboarding-step-0\|onboarding-skip-btn" vibex-fronted/src/components/onboarding/
```

期望: `onboarding-step-0` 在 WelcomeStep.tsx 中唯一，不重复

---

## E4-QA: P004-API测试(94 tests)

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E4-U1 | 测试套件全部通过 | 🔄 | — | `pnpm --filter vibex-fronted run test:unit` → 100% passed |
| E4-U2 | canvasApi.test.ts 存在 | ⬜ | — | `test -f vibex-fronted/src/lib/canvas/api/canvasApi.test.ts` → 0 |
| E4-U3 | canvasDiff.test.ts 存在 | ⬜ | — | `test -f vibex-fronted/src/lib/__tests__/canvasDiff.test.ts` → 0 |
| E4-U4 | coverage threshold = 60% | ⬜ | E4-U1 | CI workflow 中 `check-coverage.js 60` |

**E4-U1 详细说明**

执行命令:
```bash
cd vibex-fronted && pnpm exec vitest run --reporter=json --outputFile=test-results.json
```

通过条件: test-results.json 中 `numFailedTests = 0`

**E4-U4 详细说明**

验证 CI 配置:
```bash
grep "check-coverage.js 60" .github/workflows/test.yml
```

通过条件: 找到 `node scripts/check-coverage.js 60`（非 85%）

---

## E5-QA: P005-Canvas对比功能

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E5-U1 | /canvas-diff 页面加载 | ⬜ | — | gstack 打开 http://localhost:3000/canvas-diff 无 404 |
| E5-U2 | 骨架屏显示（非 spinner） | ⬜ | E5-U1 | 加载态使用 `skeleton` class，非 `spinner` 或 loading 文字 |
| E5-U3 | 两个 Canvas 选择器 | ⬜ | E5-U2 | 页面可见两个下拉选择器（左侧 + 右侧） |
| E5-U4 | Diff 视图区域存在 | ⬜ | E5-U3 | Diff 视图区域存在（新增红/移除绿/修改黄） |
| E5-U5 | canvasDiff.test.ts 存在 | ⬜ | E5-U4 | 核心算法 `canvasDiff.ts` 有独立测试文件 |

**E5-U2 详细说明**

验证方法: grep 确认无 spinner
```bash
grep -n "spinner\|loading" vibex-fronted/src/app/canvas-diff/page.tsx
```

通过条件: 无 spinner 字符串，加载态使用 skeleton

**E5-U5 详细说明**

验证方法:
```bash
test -f vibex-fronted/src/lib/__tests__/canvasDiff.test.ts
```

---

## 统一验收（所有 Epic）

| 检查项 | 命令 | 通过条件 |
|--------|------|----------|
| 前端 build | `pnpm --filter vibex-fronted run build` | 0 errors |
| CHANGELOG 更新 | `grep -c "Sprint 24\|Sprint24" CHANGELOG.md` | > 0 |
| 远程最新 commit | `git fetch && git log origin/main -1` | 与本地 HEAD 一致 |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: 无（纯 QA 验证）
- **执行日期**: 2026-05-04

---

*Architect | VibeX Sprint24 QA 实施计划*