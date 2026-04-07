/**
 * E7-S2: Structured Logging for MCP Server
 * 
 * Provides consistent, structured log format for observability.
 * Format: JSON with timestamp, level, event, and context.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  event: string
  service: 'vibex-mcp-server'
  version: string
  message?: string
  [key: string]: unknown
}

const LOG_LEVEL = (process.env.MCP_LOG_LEVEL as LogLevel) ?? 'info'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL]
}

function formatLog(level: LogLevel, event: string, extra?: Record<string, unknown>): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    event,
    service: 'vibex-mcp-server',
    version: '0.1.0',
    ...extra,
  }
}

function write(entry: LogEntry): void {
  const output = JSON.stringify(entry)
  if (entry.level === 'error') {
    console.error(output)
  } else {
    console.log(output)
  }
}

/**
 * E7-S2: Structured logger
 */
export const logger = {
  debug(event: string, extra?: Record<string, unknown>): void {
    if (shouldLog('debug')) {
      write(formatLog('debug', event, extra))
    }
  },

  info(event: string, extra?: Record<string, unknown>): void {
    if (shouldLog('info')) {
      write(formatLog('info', event, extra))
    }
  },

  warn(event: string, extra?: Record<string, unknown>): void {
    if (shouldLog('warn')) {
      write(formatLog('warn', event, extra))
    }
  },

  error(event: string, extra?: Record<string, unknown>): void {
    if (shouldLog('error')) {
      write(formatLog('error', event, extra))
    }
  },
}
