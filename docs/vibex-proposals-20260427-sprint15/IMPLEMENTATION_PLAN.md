# VibeX Sprint 15 QA — E15-P003 BPMN Export

**Project**: vibex-proposals-20260427-sprint15
**Date**: 2026-04-28
**Status**: E15-P003 Complete

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
