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
  service: 'vibex-mcp-server'
  version: string
  // E7-S2: tool/duration/success fields for observability
  tool?: string
  duration?: number
  success?: boolean
  message?: string
  event?: string
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

function formatLog(level: LogLevel, message: string, extra?: Record<string, unknown>): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    service: 'vibex-mcp-server',
    version: '0.1.0',
    message,
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
  debug(message: string, extra?: Record<string, unknown>): void {
    if (shouldLog('debug')) {
      write(formatLog('debug', message, extra))
    }
  },

  info(message: string, extra?: Record<string, unknown>): void {
    if (shouldLog('info')) {
      write(formatLog('info', message, extra))
    }
  },

  warn(message: string, extra?: Record<string, unknown>): void {
    if (shouldLog('warn')) {
      write(formatLog('warn', message, extra))
    }
  },

  error(message: string, extra?: Record<string, unknown>): void {
    if (shouldLog('error')) {
      write(formatLog('error', message, extra))
    }
  },

  // E7-S2: Log tool call with duration and success
  logToolCall(tool: string, durationMs: number, success: boolean): void {
    write(formatLog('info', `Tool call: ${tool}`, {
      tool,
      duration: durationMs,
      success,
    }))
  },
}
