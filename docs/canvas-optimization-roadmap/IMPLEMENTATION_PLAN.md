# Implementation Plan: Canvas Optimization Roadmap

| Sprint | Epic | 工时 | 交付物 |
|--------|------|------|--------|
| Sprint 1 | E1: Phase 0 清理 | 4h | dead code清除 |
| Sprint 2 | E2: Phase 1 架构分层 | 6h | 三层架构 |
| Sprint 3 | E3: Phase 2 性能优化 | 4h | O(n)算法 |
| Sprint 4 | E4: Phase 3 可靠性 | 3h | ErrorBoundary+测试 |
| **合计** | | **17h** | |

## 任务分解
| Task | 验证 |
|------|------|
| S1.1-S1.5: Phase 0 | dead code 0, console 0 |
| S2.1: Phase 1 | 代码审查 3层 |
| S3.1: Phase 2 | 性能测试通过 |
| S4.1-S4.2: Phase 3 | coverage > 80% |

## DoD
- [x] console.error → canvasLogger — `src/lib/canvas/canvasLogger.ts` ✅ commit `52e01b83`
  - 9 console.error → canvasLogger.{Component}.error()
- [ ] dead code 全部清除（E2-E4）
- [ ] O(n) 边计算（E3）
- [ ] ErrorBoundary + 80% 覆盖（E4）
