import { Context, Next } from 'hono'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
  details?: any
}

export class AppError extends Error implements ApiError {
  statusCode: number
  code: string
  details?: any

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code || 'INTERNAL_ERROR'
    this.details = details
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

/**
 * Hono error handling middleware
 * Catches all errors and returns consistent JSON response
 */
export const errorHandler = async (err: Error | ApiError, c: Context, next: Next) => {
  if (err) {
    const statusCode = (err as ApiError).statusCode || 500
    const code = (err as ApiError).code || 'INTERNAL_ERROR'
    const message = err.message || 'Internal server error'
    const details = (err as ApiError).details

    // Log error in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error:', {
        message: err.message,
        stack: err.stack,
        statusCode,
        code,
        path: c.req.path,
        method: c.req.method,
      })
    }

    // Send consistent error response
    const response = {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
      },
      timestamp: new Date().toISOString(),
      path: c.req.path,
    }

    return c.text(JSON.stringify(response), statusCode)
  }

  await next()
}

/**
 * Async handler wrapper to catch errors automatically
 */
export const asyncHandler = (fn: (c: Context, next: Next) => Promise<Response | void>) => {
  return async (c: Context, next: Next) => {
    try {
      await fn(c, next)
    } catch (err) {
      errorHandler(err as Error, c, next)
    }
  }
}

/**
 * Not found handler for undefined routes
 */
export const notFoundHandler = (c: Context) => {
  const response = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${c.req.method} ${c.req.path}`,
      timestamp: new Date().toISOString(),
      path: c.req.path,
    },
  }
  return c.text(JSON.stringify(response), 404)
}

/**
 * Success response helper
 */
export const successResponse = <T>(c: Context, data: T, message?: string) => {
  return c.json({
    success: true,
    message: message || 'Success',
    data,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Paginated response helper
 */
export const paginatedResponse = <T>(
  c: Context,
  data: T[],
  total: number,
  page: number,
  pageSize: number
) => {
  return c.json({
    success: true,
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
    timestamp: new Date().toISOString(),
  })
}
