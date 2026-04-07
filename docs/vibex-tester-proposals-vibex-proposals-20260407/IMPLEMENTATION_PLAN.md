# Implementation Plan: Vibex Proposals 2026-04-07

| Sprint | Epic | 工时 | 交付物 |
|--------|------|------|--------|
| Sprint 1 (P0) | E1+E2+E3 | 1.1h | OPTIONS路由+Canvas多选+flowId schema |
| Sprint 2 (P1) | E4+E5+E6 | 4h | SSE超时+限流+去重 |
| Sprint 3 (P2) | E7 | 2h | 提案去重脚本 |
| **合计** | | **7.1h** | |

## 任务分解

| Task | 文件 | 验证 |
|------|------|------|
| E1: OPTIONS路由 | `src/app/api/v1/projects/route.ts` | `expect(status).toBe(204)` |
| E2: Canvas多选 | `BCCheckbox.tsx` + store | `expect(selectedNodeIds).toContain()` |
| E3: flowId schema | `schema/flow.ts` | `expect(/^flow-/).toMatch()` |
| E4: SSE超时 | `lib/sse/stream.ts` | `expect(timeout).toBe(10000)` |
| E5: 限流 | `middleware/rateLimit.ts` | `expect(429).toBe(status)` |
| E6: 去重 | `lib/notify/dedup.ts` | `expect(false).toBe(shouldNotify())` |
| E7: 提案去重 | `proposals/dedup.py` | `python3 dedup.py` |

## DoD
- [ ] 所有P0 Bug修复测试通过
- [ ] P1改进项完成率 > 80%
- [ ] 提案去重脚本可用

*Architect Agent | 2026-04-07*
