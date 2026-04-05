# Implementation Plan: FlowTree Guard Fix

| Epic | 工时 | 交付物 |
|------|------|--------|
| E1: guard 修复 | 1h | guardStore.recheck() |
| E2: TabBar 同步 | 0.5h | setActiveTree |
| E3: E2E 验证 | 0.5h | FlowTreeGuard.test.tsx |
| **合计** | **2h** | |

## 任务分解
| Task | 文件 | 验证 |
|------|------|------|
| E1: guard | guardStore.ts | FlowTree 可见 |
| E2: TabBar | TabBar.tsx | activeTree 正确 |
| E3: 测试 | FlowTreeGuard.test.tsx | Playwright 通过 |

## DoD
- [x] Tab 切换后 FlowTree 可见 — TabBar phase guard ✅ commit `8ed16fd9`
- [x] guard 监听 TabBar + PhaseProgressBar — TabBar.tsx `phaseIdx` vs `tabIdx` guard
- [x] E2 TabBar 同步 — setActiveTree 双向同步（phase→activeTree via advancePhase, tab→activeTree via setActiveTree）✅ 复用 E1 代码
- [x] E2E 测试通过 — TabBar 10 tests ✅ + gstack 浏览器验证 ✅
