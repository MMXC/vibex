import { Context, Next } from 'hono'

import { devLog, safeError } from '@/lib/log-sanitizer';

export interface RequestLog {
  method: string
  path: string
  query: Record<string, string>
  headers: Record<string, string>
  ip?: string
  userAgent?: string
  timestamp: string
}

export interface ResponseLog {
  status: number
  duration: number
  timestamp: string
}

export interface LogEntry {
  type: 'request' | 'response' | 'error' | 'debug' | 'warn'
  request?: RequestLog
  response?: ResponseLog
  error?: {
    message: string
    stack?: string
  }
}

/**
 * API Request Logging Middleware
 * 
 * Logs incoming API requests and outgoing responses with timing information.
 * Logs are structured JSON for easy parsing by log aggregation systems.
 */
export const logger = async (c: Context, next: Next) => {
  const startTime = Date.now()
  const requestId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  
  // Capture request info
  const requestLog: RequestLog = {
    method: c.req.method,
    path: c.req.path,
    query: { ...c.req.query() },
    headers: {
      'content-type': c.req.header('content-type') || '',
      'authorization': c.req.header('authorization') ? '[REDACTED]' : '',
      'user-agent': c.req.header('user-agent') || '',
    },
    ip: c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 
         c.req.header('x-real-ip') || 
         c.env?.['ip'] ||
         'unknown',
    userAgent: c.req.header('user-agent'),
    timestamp: new Date().toISOString(),
  }

  // Set request ID in context for tracking
  c.set('requestId', requestId)
  c.set('requestLog', requestLog)

  // Log incoming request
  log('info', {
    type: 'request',
    request: requestLog,
    requestId,
  } as LogEntry)

  try {
    await next()
    
    // Calculate duration
    const duration = Date.now() - startTime
    const status = c.res.status
    
    // Capture response info
    const responseLog: ResponseLog = {
      status,
      duration,
      timestamp: new Date().toISOString(),
    }

    // Log response
    log('info', {
      type: 'response',
      request: requestLog,
      response: responseLog,
      requestId,
    } as LogEntry)

  } catch (err) {
    // Log error
    const error = err as Error
    log('error', {
      type: 'error',
      request: requestLog,
      error: {
        message: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      },
      requestId,
    } as LogEntry)
    
    throw err
  }
}

/**
 * Log level type
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Core logging function
 * Outputs structured JSON logs
 */
function log(level: LogLevel, entry: LogEntry): void {
  const logObject = {
    level,
    ...entry,
    service: 'vibex-api',
    environment: process.env.NODE_ENV || 'development',
  }

  // Use devLog for Cloudflare Workers compatibility
  // In production, this can be replaced with a proper logging service
  switch (level) {
    case 'debug':
      devLog(JSON.stringify(logObject))
      break
    case 'info':
      devLog(JSON.stringify(logObject))
      break
    case 'warn':
      safeError(JSON.stringify(logObject))
      break
    case 'error':
      safeError(JSON.stringify(logObject))
      break
  }
}

/**
 * Debug-level logger — outputs only when LOG_LEVEL=debug
 * E1-S2: replaces devDebug calls
 */
export function debug(message: string, data?: unknown): void {
  const level = process.env.LOG_LEVEL || 'info';
  if (level !== 'debug') return;

  const entry: LogEntry = {
    type: 'debug',
    // @ts-ignore - debug type
    debug: { message, ...(typeof data === 'object' && data !== null ? { data } : {}) },
  };
  log('debug', entry);
}

/**
 * Warn-level logger — replaces console.warn
 * E1-S3: replaces console.error with context
 */
export function warn(message: string, data?: unknown): void {
  const entry: LogEntry = {
    type: 'warn',
    // @ts-ignore - warn type
    warn: { message, ...(typeof data === 'object' && data !== null ? { data } : {}) },
  };
  log('warn', entry);
}

/**
 * Create a custom logger with custom configuration
 */
export interface LoggerOptions {
  includeBody?: boolean
  excludePaths?: string[]
  customFields?: (c: Context) => Record<string, any>
}

export const createLogger = (options: LoggerOptions = {}) => {
  const { includeBody = false, excludePaths = [], customFields } = options

  return async (c: Context, next: Next) => {
    // Skip logging for excluded paths
    if (excludePaths.some(path => c.req.path.startsWith(path))) {
      await next()
      return
    }

    const startTime = Date.now()
    const requestId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const requestLog: RequestLog = {
      method: c.req.method,
      path: c.req.path,
      query: { ...c.req.query() },
      headers: {
        'content-type': c.req.header('content-type') || '',
        'authorization': c.req.header('authorization') ? '[REDACTED]' : '',
        'user-agent': c.req.header('user-agent') || '',
      },
      ip: c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 
           c.req.header('x-real-ip') || 
           'unknown',
      userAgent: c.req.header('user-agent'),
      timestamp: new Date().toISOString(),
    }

    // Optionally include body (be careful with large payloads)
    if (includeBody && ['POST', 'PUT', 'PATCH'].includes(c.req.method)) {
      try {
        const body = await c.req.json().catch(() => null)
        if (body) {
          requestLog.body = body
        }
      } catch {
        // Ignore body parsing errors
      }
    }

    c.set('requestId', requestId)

    // Log request
    log('info', {
      type: 'request',
      request: requestLog,
      requestId,
      ...(customFields && { custom: customFields(c) }),
    })

    try {
      await next()
      
      const duration = Date.now() - startTime
      const status = c.res.status

      log('info', {
        type: 'response',
        request: requestLog,
        response: {
          status,
          duration,
          timestamp: new Date().toISOString(),
        },
        requestId,
        ...(customFields && { custom: customFields(c) }),
      })

    } catch (err) {
      const error = err as Error
      log('error', {
        type: 'error',
        request: requestLog,
        error: {
          message: error.message,
          stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        },
        requestId,
      })
      
      throw err
    }
  }
}

export default logger
