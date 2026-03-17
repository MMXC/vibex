/**
 * Test Utilities Types
 * 
 * Type definitions for test utilities and factories
 */

import { QueryClient } from '@tanstack/react-query';
import { RenderOptions } from '@testing-library/react';

// ==================== Query Client Types ====================

export interface TestQueryClientOptions {
  /** Disable retry mechanism */
  retry?: boolean;
  /** Garbage collection time in ms */
  gcTime?: number;
  /** Stale time in ms */
  staleTime?: number;
  /** Refetch on window focus */
  refetchOnWindowFocus?: boolean;
}

// ==================== Render Options Types ====================

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Custom QueryClient instance */
  queryClient?: QueryClient;
  /** Initial router path (for future router integration) */
  initialRoute?: string;
}

// ==================== Factory Types ====================

/**
 * Generic factory function type
 */
export type MockFactory<T> = (overrides?: Partial<T>) => T;

/**
 * Factory function with list generation capability
 */
export interface MockFactoryWithList<T> extends MockFactory<T> {
  /**
   * Generate multiple mock instances
   * @param count - Number of instances to generate
   * @param overrides - Optional overrides applied to all instances
   */
  list: (count?: number, overrides?: Partial<T>) => T[];
}

// ==================== Mock State Types ====================

/**
 * Mock state for testing hooks that use async operations
 */
export interface MockAsyncState<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isSuccess: boolean;
}

/**
 * Creates a loading state
 */
export function mockLoadingState<T>(): MockAsyncState<T> {
  return {
    data: null,
    isLoading: true,
    isError: false,
    error: null,
    isSuccess: false,
  };
}

/**
 * Creates a success state
 */
export function mockSuccessState<T>(data: T): MockAsyncState<T> {
  return {
    data,
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: true,
  };
}

/**
 * Creates an error state
 */
export function mockErrorState<T>(error: Error): MockAsyncState<T> {
  return {
    data: null,
    isLoading: false,
    isError: true,
    error,
    isSuccess: false,
  };
}

// ==================== SSE Mock Types ====================

/**
 * SSE event data structure
 */
export interface SSEEvent {
  event: string;
  data: unknown;
}

/**
 * Options for mock SSE stream
 */
export interface MockSSEStreamOptions {
  /** Events to emit in sequence */
  events: SSEEvent[];
  /** Delay between events in ms */
  delay?: number;
  /** Whether to throw an error */
  shouldError?: boolean;
  /** Error message if shouldError is true */
  errorMessage?: string;
}

// ==================== Export All ====================

export default {
  mockLoadingState,
  mockSuccessState,
  mockErrorState,
};