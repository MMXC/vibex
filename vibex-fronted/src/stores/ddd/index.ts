/**
 * DDD Store Module
 *
 * Re-exports the three DDD slices and the state sync middleware.
 *
 * Usage:
 *   import { useContextStore } from '@/stores/ddd';
 *   import { initDDDStateSync } from '@/stores/ddd/middleware';
 */

export {
  useContextStore,
  type ContextState,
  type ContextRelationship,
  selectBoundedContexts,
  selectSelectedContexts,
  selectCoreContexts,
  selectSupportingContexts,
  selectGenericContexts,
  selectExternalContexts,
  selectContextMermaidCode,
  selectIsContextPanelOpen,
} from '../contextSlice';

export {
  useModelStore,
  type ModelState,
  type DomainModel,
  type DomainModelProperty,
  selectDomainModels,
  selectSelectedModels,
  selectAggregateRoots,
  selectEntities,
  selectValueObjects,
  selectModelsByContextId,
  selectModelMermaidCode,
  selectIsModelPanelOpen,
} from '../modelSlice';

export {
  useDesignStore,
  type DesignStep,
  selectCurrentStep,
  selectRequirementText,
  selectClarificationRounds,
  selectDomainEntities,
  selectBusinessFlows,
  selectUIPages,
  selectPrototype,
} from '../designStore';

export {
  initDDDStateSync,
  checkDDDStateRestore,
  clearDDDSnapshot,
  useDDDSyncKeys,
  computeContextSyncKey,
  computeModelSyncKey,
  computeFlowSyncKey,
  dddStateSyncManager,
  type PersistedDDDState,
} from './middleware';

export {
  persistSnapshot,
  restoreSnapshot,
  clearSnapshot,
  hasValidSnapshot,
  getSnapshotAge,
  type DDDCrossPageSnapshot,
} from './sessionStorageAdapter';
