/**
 * React Testing Library Utilities for Vibex
 * 
 * Provides a standardized renderWithProviders function that wraps components
 * with all necessary providers (QueryClientProvider, etc.)
 * 
 * @example
 * ```typescript
 * import { renderWithProviders, screen } from '@/test-utils/component-test-utils';
 * 
 * test('renders component', () => {
 *   renderWithProviders(<MyComponent />);
 *   expect(screen.getByText('Hello')).toBeInTheDocument();
 * });
 * ```
 */

import { ReactElement, ReactNode } from 'react';
import * as React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ==================== Query Client ====================

/**
 * Creates a test QueryClient with sensible defaults for testing
 * 
 * Features:
 * - Disables retries for faster test execution
 * - Disables garbage collection
 * - Disables window focus refetching
 * - Sets staleTime to 0 for immediate refetch
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: true,
      },
      mutations: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

// ==================== Types ====================

export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Custom QueryClient instance */
  queryClient?: QueryClient;
  /** Initial router path (for future router integration) */
  initialRoute?: string;
}

// ==================== Wrapper Component ====================

interface ProvidersProps {
  children: ReactNode;
  queryClient: QueryClient;
}

/**
 * Internal wrapper component that provides all necessary providers
 */
function AllProviders({ children, queryClient }: ProvidersProps): React.ReactElement {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - React 19 types have known issue
  return (
    <QueryClientProvider client={queryClient}>
      <>{children}</>
    </QueryClientProvider>
  );
}

// ==================== Main Render Function ====================

/**
 * Renders a component with all necessary providers
 * 
 * This is the recommended way to render components in tests.
 * It automatically wraps the component with QueryClientProvider.
 * 
 * @param ui - The React element to render
 * @param options - Render options including optional custom QueryClient
 * @returns RenderResult from @testing-library/react
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const { getByText } = renderWithProviders(<MyComponent />);
 * 
 * // With custom QueryClient
 * const queryClient = createTestQueryClient();
 * queryClient.setQueryData(['key'], { data: 'value' });
 * renderWithProviders(<MyComponent />, { queryClient });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;

  const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <AllProviders queryClient={queryClient}>{children}</AllProviders>
  );

  return render(ui, { wrapper, ...renderOptions });
}

// ==================== Re-exports ====================

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override render to use our custom render by default
export { renderWithProviders as render };

// ==================== Helper Functions ====================

/**
 * Waits for all pending queries to complete
 * Useful for testing async data fetching
 * 
 * @example
 * ```typescript
 * renderWithProviders(<ComponentWithQuery />);
 * await waitForQueries();
 * expect(screen.getByText('Data loaded')).toBeInTheDocument();
 * ```
 */
export async function waitForQueries(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries();
}

/**
 * Clears all queries and mutations from the cache
 * Useful for test isolation
 */
export function clearQueryCache(queryClient: QueryClient): void {
  queryClient.clear();
}

// ==================== Default Export ====================

export default renderWithProviders;