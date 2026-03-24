/**
 * @deprecated Use @/components/ui/ErrorBoundary instead.
 * This module is kept for backward compatibility.
 * All ErrorBoundary functionality has been merged into components/ui/ErrorBoundary.tsx.
 */
export {
  ErrorBoundary,
  withErrorBoundary,
  useAsyncError,
} from '@/components/ui/ErrorBoundary';

export type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
} from '@/components/ui/ErrorBoundary';
