/**
 * [F3.1] SSE Error Type Classifier
 * Classifies SSE errors into: timeout | network | llm_error
 */

export type SSEErrorType = 'timeout' | 'network' | 'llm_error';

export interface ErrorContext {
  stage: 'context' | 'model' | 'flow' | 'components';
}

export type ErrorClassifierFn = (err: unknown, ctx: ErrorContext) => SSEErrorType;

/**
 * [F3.1] Classifies an error into SSEErrorType.
 * Rules:
 * 1. AbortError → timeout
 * 2. LLM API errors (success=false) → llm_error
 * 3. Network errors → network
 * 4. Fallback → llm_error
 */
export function errorClassifier(err: unknown, _ctx: ErrorContext): SSEErrorType {
  // 1. AbortError → timeout
  if (err instanceof DOMException && err.name === 'AbortError') return 'timeout';
  if (err instanceof Error && err.name === 'AbortError') return 'timeout';

  // 2. LLM API errors
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    if (e.success === false) return 'llm_error';
  }

  // 3. Network errors
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (
      msg.includes('fetch') ||
      msg.includes('network') ||
      msg.includes('econnrefused') ||
      msg.includes('enotfound') ||
      msg.includes('etimedout')
    ) {
      return 'network';
    }
  }

  // 4. Fallback
  return 'llm_error';
}
