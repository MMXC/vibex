# Implementation Plan: Canvas API Completion

| Epic | 工时 | Sprint | 交付物 |
|------|------|--------|--------|
| E1: CRUD 端点 | 6h | Sprint 1 | 9 个 CRUD routes |
| E2: Snapshot 端点 | 3h | Sprint 2 | 5 个 Snapshot routes |
| E3: AI 生成关联 | 2h | Sprint 2 | generate/* routes |
| E4: 集成测试 | 2h | Sprint 3 | api-crud.test.ts |
| **合计** | **13h** | | |

## 任务分解

| Task | 路由文件 | 验证 |
|------|----------|------|
| E1.1 | `/api/v1/projects/route.ts` | `expect(status).toBe(200)` |
| E1.2 | `/api/v1/contexts/route.ts` | CRUD 测试通过 |
| E1.3 | `/api/v1/canvas/flows/route.ts` | CRUD 测试通过 | ✅ (commit ebd007db)
| E1.4 | `/api/v1/components/route.ts` | CRUD 测试通过 |
| E2 | `/api/v1/snapshots/route.ts` | `expect(endpoints).toHaveLength(5)` |
| E3 | `/api/v1/generate/*/route.ts` | `expect(aiOps).toBeDefined()` |
| E4 | `src/tests/api/*.test.ts` | `pnpm test` 全部通过 |

## DoD
- [x] 5 个 Snapshot 端点实现并测试 ✅ — 18 tests, commit `25763af1`
- [ ] 9 个 CRUD 端点实现并测试
- [ ] AI 生成关联操作实现
- [ ] E2E 测试通过

**E1 进度**: E1.3 `/api/v1/canvas/flows` ✅ — 使用 Hono + D1 SQL 实现（适配实际代码库）

**E2 进度**: 5 个 Snapshot 端点 ✅ — 18 tests (commit `25763af1`) + 2 bugs fixed (route order + version conflict logic)

*Architect Agent | 2026-04-05 | Dev 补充 | 2026-04-05*
