/**
 * @deprecated Use @/types/error instead.
 * Re-exports from the shared error types location for backward compatibility.
 */
export {
  DEFAULT_ERROR_MAPPINGS,
  HTTP_STATUS_TO_ERROR_CODE,
} from '@/types/error';

export type {
  ApiErrorResponse,
  ErrorConfig,
  ErrorMiddlewareOptions,
  ErrorSeverity,
  ErrorType,
} from '@/types/error';
