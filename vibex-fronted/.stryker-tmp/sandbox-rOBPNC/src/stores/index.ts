/**
 * Stores - Unified Exports
 * 
 * This file provides a single entry point for all store imports.
 * Components should import from '@/stores' instead of individual store files.
 */
// @ts-nocheck


// ==================== Auth Store ====================
export { useAuthStore, authActions } from './authStore';
export type { User } from './authStore';

// ==================== Navigation Store ====================
export { useNavigationStore } from './navigationStore';
export type { NavItem, ProjectContext, BreadcrumbItem, NavigationState } from './navigationStore';
export { 
  selectCurrentGlobalNav,
  selectCurrentProjectNav,
  selectBreadcrumbs 
} from './navigationStore';

// ==================== Preview Store ====================
export { usePreviewStore, STEP_CONFIG, STEP_ORDER, getNextStep, getStepProgress } from './previewStore';
export type { PreviewStep } from './previewStore';

// ==================== Template Store ====================
export { useTemplateStore } from './templateStore';

// ==================== Design Store ====================
export { useDesignStore } from './designStore';
export type { 
  DesignStep,
  ClarificationRound,
  DomainEntity,
  BusinessFlow,
  UIComponent,
  UIPage,
  PrototypeData
} from './designStore';
export {
  selectCurrentStep,
  selectRequirementText,
  selectClarificationRounds,
  selectDomainEntities,
  selectBusinessFlows,
  selectUIPages,
  selectPrototype
} from './designStore';

// ==================== Confirmation Store ====================
export { useConfirmationStore } from './confirmationStore';
export type {
  ConfirmationStep,
  ConfirmationSnapshot,
  BoundedContext,
  ContextRelationship,
  DomainModel,
  DomainProperty,
  BusinessFlow as ConfirmationBusinessFlow,
  FlowState,
  FlowTransition,
  ConfirmationFlowState
} from './confirmationStore';

// ==================== Context Slice (New) ====================
export { useContextStore } from './contextSlice';
export type { ContextRelationship as ContextRel, ContextState } from './contextSlice';
export {
  selectBoundedContexts,
  selectSelectedContexts,
  selectCoreContexts,
  selectSupportingContexts,
  selectGenericContexts,
  selectExternalContexts,
  selectContextMermaidCode,
  selectIsContextPanelOpen
} from './contextSlice';

// ==================== Model Slice (New) ====================
export { useModelStore } from './modelSlice';
export type { 
  DomainModelProperty, 
  DomainModel as DomainModelEntity,
  ModelState 
} from './modelSlice';
export {
  selectDomainModels,
  selectSelectedModels,
  selectAggregateRoots,
  selectEntities,
  selectValueObjects,
  selectModelsByContextId,
  selectModelMermaidCode,
  selectIsModelPanelOpen
} from './modelSlice';

// ==================== Onboarding Store ====================
export { useOnboardingStore } from './onboarding/onboardingStore';

// ==================== HomePage Store (Epic 9) ====================
export { useHomePageStore, useCurrentStep, useCompletedSteps, useRequirementText, useSSEState } from './homePageStore';
export type { HomePageStep, HomePageState, HomePageSnapshot, MermaidCodes } from './homePageStore';

// ==================== Simplified Flow Store (Epic 1) ====================
export { useSimplifiedFlowStore } from './simplifiedFlowStore';
export type {
  SimplifiedStep,
  BusinessDomain,
  Feature,
  FlowNode,
  FlowEdge,
  FlowData,
  Clarification,
  SelectedComponent,
  SimplifiedFlowState
} from './simplifiedFlowStore';
export {
  selectSimplifiedStep,
  selectDomains,
  selectSelectedDomainIds,
  selectFlow,
  selectClarifications,
  selectComponents,
  selectIsGenerating,
  selectError
} from './simplifiedFlowStore';