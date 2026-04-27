# VibeX Sprint 15 QA — E15-P003 BPMN Export

**Project**: vibex-proposals-20260427-sprint15
**Date**: 2026-04-28
**Status**: E15-P003 Complete

## E15-P004: Version Compare UI

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U1 | SnapshotSelector (two dropdowns) | ✅ | — | Two selectors for arbitrary snapshot compare; same-snapshot boundary handled |
| U2 | Diff colors | ✅ | — | added #22c55e / removed #ef4444 / modified #eab308 |
| U3 | Restore button | ✅ | — | "还原到此版本" button exists in version-history page |
| U4 | Restore with backup | ✅ | U1/U3 | addCustomSnapshot called before jumpToSnapshot |

## Implementation

- **confirmationStore.ts**: `addCustomSnapshot` added for backup snapshots
- **version-history/page.tsx**: two dropdowns (`compareSelectA`/`compareSelectB`), `handleCompare()` validates same-snapshot, `handleRestore()` creates backup before jump
- **version-history.module.css**: `.snapshotSelector`, `.selector`, `.compareButton`, `.selectorVs` styles added
- **page.test.tsx**: E15-P004 U1/U4 tests added

## Verification

- TypeScript: `pnpm tsc --noEmit` 0 errors (pako/useCanvas pre-existing)
- Vitest: `pnpm vitest run src/app/version-history/page.test.tsx` 5/5 passed
- Diff colors: #22c55e (added) / #ef4444 (removed) / #eab308 (modified) per spec

---

## E15-P003: BPMN Export

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U1 | bpmn-js dynamic import | ✅ | — | bpmn-js/bpmn-moddle dynamically imported, no SSR bundle issue |
| U2 | Flow → BPMN XML mapping | ✅ | U1 | StartEvent / EndEvent / ServiceTask / SequenceFlow mapped |
| U3 | FlowTab BPMN download | ✅ | U2 | Real .bpmn file download triggered from FlowTab |
| U4 | Unit tests | ✅ | U3 | Tests verify bpmnModeler instantiation and XML structure |

## Implementation

- **export-bpmn.ts**: `createBpmnModeler()` + `exportFlowToBpmn(flow)` with dynamic bpmn-js import
- **delivery/export/route.ts**: `format === 'bpmn'` returns `application/xml` attachment
- **deliveryStore.ts**: `exportItem` handles bpmn format with correct filename
- **export-bpmn.test.ts**: mock bpmn-js, verify 4 element types in output

## Verification

- TypeScript: bpmn-related files 0 errors (pako errors pre-existing, unrelated)
- BPMN XML contains `<bpmn:startEvent>`, `<bpmn:endEvent>`, `<bpmn:serviceTask>`, `<bpmn:sequenceFlow>`

## E15-P006: 技术债清理审计 (部分完成)

| ID | Name | Status | Note |
|----|------|--------|------|
| U1 | ESLint NEEDS FIX 清零 | 🔄 部分 | init.ts 修复，9 个 NEEDS FIX 仍待处理 |
| U2 | lint + tsc 通过 | ⬜ | 需 U1 全部完成后执行 |
| U3 | 废弃目录清理 | ⬜ | 待执行 |
| U4 | 回归测试 | ⬜ | 待 U1-U3 完成后执行 |

**Commit**: 44b724abf — partial U1 fix (init.ts dynamic require)
**剩余工作**: SearchIndex.ts / SearchFilter.tsx / useCanvasExport.ts / api-generated.ts ESLint 修复
