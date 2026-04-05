# Implementation Plan: FlowTree API Fix

| Epic | 工时 | 交付物 |
|------|------|--------|
| E1: API 替换 | 2h | flowStore.ts + flowApi.ts |
| E2: flowId 关联 | 1h | FlowIdSchema |
| E3: 错误处理 | 1h | try/catch |
| **合计** | **4h** | |

## 任务分解
| Task | 文件 | 验证 |
|------|------|------|
| E1: API集成 | flowStore.ts + lib/api/canvas/flows.ts | API调用成功 |
| E2: flowId | FlowIdSchema | flowId格式正确 |
| E3: 错误处理 | flowStore.ts | 错误状态正确 |

## DoD
- [x] 移除mock，API调用成功 — `autoGenerateFlows` → `canvasApi.generateFlows()` ✅ commit `533a6904`
- [x] flowId正确生成 — `mappedFlows` 添加 `id: f.nodeId` ✅ commit `04b443ef`
  - Fix: `flowId: comp.flowId ?? 'mock'` → `comp.flowId || ''`
- [x] 错误状态处理正确 — `flowError` state + try/catch ✅
