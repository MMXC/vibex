/**
 * Test Utilities Entry Point
 * 
 * Exports all testing utilities for easy importing
 */
// @ts-nocheck


// Component testing utilities
export {
  renderWithProviders,
  render,
  createTestQueryClient,
  waitForQueries,
  clearQueryCache,
} from './component-test-utils';

// Mock data factories
export {
  mockBoundedContext,
  mockDomainEntity,
  mockDomainModel,
  mockBusinessFlow,
  mockState,
  mockTransition,
  mockThinkingStep,
  mockAttribute,
  mockDDDAnalysisResult,
  mockSSEResponse,
} from './factories';

// Types
export type {
  TestQueryClientOptions,
  RenderWithProvidersOptions,
  MockFactory,
  MockFactoryWithList,
  MockAsyncState,
  SSEEvent,
  MockSSEStreamOptions,
} from './types';

export {
  mockLoadingState,
  mockSuccessState,
  mockErrorState,
} from './types';

// Re-export testing library for convenience
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';