# Implementation Plan: 2026-04-12 Sprint

| Epic | 提案 | 工时 | 交付物 |
|------|------|------|--------|
| E1: 提案质量基础设施 | A-P0-1 + R-P0-1 + R-P1-1 | 2.3h | INDEX.md + CI守卫 + Health版本 |
| E2: 测试基础设施 | T001 + T002 + T003 | 9h | Auth测试恢复 + wait重构 + flowId E2E |
| E3: 运维与流程 | R-P0-2 + R-P1-2 + R-P2-1 + R-P2-2 + A-P1-1 + A-P2-1 + T004 + T005 | 8.5h | 配置集中 + hook + 自动化 + 路线图 |
| **合计** | **14** | **19.8h** | |

## Sprint 规划

### Sprint 1 (2026-04-12 ~ 2026-04-14, ~6.3h)
- T001 (3h) — Auth Mock 修复，解除 CI 门禁
- A-P0-1 (1h) — 提案 INDEX 上线
- R-P0-2 (0.5h) — WebSocket 配置集中
- T005 (1.5h) — Token 日志泄露
- R-P1-1 (0.3h) — Health 版本动态

### Sprint 2 (2026-04-15 ~ 2026-04-18, ~8.5h)
- T002 (4h) — waitForTimeout 重构（87处）
- T003 (2h) — flowId E2E
- A-P1-1 (1h) — 需求澄清 SOP
- R-P1-2 (0.5h) — console.* pre-commit hook
- R-P0-1 (1h) — grepInvert CI 守卫

### Backlog (~5h)
- R-P2-1 (2h) — CHANGELOG 自动化
- A-P2-1 (2h) — 画布演进路线图
- T004 (1h) — JsonTreeModal 单元测试
- R-P2-2 (1h) — WebSocket 连接数监控



## 实施状态 (dev-e1)

| Epic | 状态 | 完成项 |
|------|------|--------|
| E1: 提案质量基础设施 | ✅ done | dedup API 验证通过 |
| E2: 测试基础设施 | ✅ done | flaky-params.txt 创建 + flaky-detector.sh 更新 |
| E3: 运维与流程 | ✅ done | npm scripts 清理 + scripts/test/notify.js 创建 |

**Commit**: d8f344f1 — feat(proposals): E1-E3 internal tools implementation

## 验收标准

| ID | 验收条件 |
|----|----------|
| AC1 | `npm test` in vibex-backend → Test Suites: 79 passed, 0 failed |
| AC2 | `docs/proposals/INDEX.md` 中所有提案有 status 字段 |
| AC3 | `WEBSOCKET_CONFIG` 是唯一 WebSocket 配置源 |
| AC4 | `grep -rn "console\." vibex-backend/src/app/api` → 0 未包装 |
| AC5 | Health check 返回版本 === package.json 版本 |
| AC6 | `grep -rn "waitForTimeout" tests/e2e` → ≤ 10（stability.spec.ts 除外） |
| AC7 | `pnpm changelog:add` 可更新 3 个 CHANGELOG 文件 |
| AC8 | `docs/vibex-canvas-evolution-roadmap/roadmap.md` 存在且完整 |
