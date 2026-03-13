/**
 * 错误类型定义
 * 统一应用中的错误处理
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ApiError extends AppError {
  constructor(
    message: string,
    code: string = 'API_ERROR',
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message, code, statusCode, details);
    this.name = 'ApiError';
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AppError {
  constructor(
    message: string = 'Network error occurred',
    details?: Record<string, unknown>
  ) {
    super(message, 'NETWORK_ERROR', 0, details);
    this.name = 'NetworkError';
  }
}

// 错误工厂函数
export function createErrorFromResponse(response: unknown): AppError {
  if (response && typeof response === 'object' && 'message' in response) {
    const msg = (response as { message: string }).message;
    const code = (response as { code?: string }).code || 'UNKNOWN_ERROR';
    const status = (response as { status?: number }).status || 500;
    return new ApiError(msg, code, status);
  }
  return new AppError('Unknown error occurred', 'UNKNOWN_ERROR');
}

// 类型 guard
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
