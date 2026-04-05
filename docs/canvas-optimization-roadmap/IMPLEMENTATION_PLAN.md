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
- [x] console.error → canvasLogger ✅ commit `52e01b83` (E1)
- [x] **E2 三层架构** ✅ 已验证
  - UI层: `components/canvas/` (React components)
  - Hook层: `hooks/canvas/useCanvasStore.ts` (unified selectors)
  - 数据层: `stores/` (contextStore, flowStore, componentStore, uiStore, sessionStore)
  - 类型层: `lib/canvas/types.ts`
- [x] dead code 全部清除 ✅ E1: canvasLogger 替换9处; E2: canvasStore.ts/deprecated.ts 移除; E4: phaseProgressBarWrapper 移除
- [x] O(n) 边计算 ✅ edge layers 每边独立 O(1) 计算，useMemo + clustering 自动聚类（>20条）
- [x] ErrorBoundary + 80% 覆盖 ✅
  - ErrorBoundary: AppErrorBoundary (layout.tsx) 全局覆盖 + JsonRenderErrorBoundary (CanvasPreviewModal)
  - 120 canvas tests passing (jest→vi 迁移后)
