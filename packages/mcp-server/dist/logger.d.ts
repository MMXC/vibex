/**
 * E7-S2: Structured Logging for MCP Server
 *
 * Provides consistent, structured log format for observability.
 * Format: JSON with timestamp, level, event, and context.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    event: string;
    service: 'vibex-mcp-server';
    version: string;
    message?: string;
    [key: string]: unknown;
}
/**
 * E7-S2: Structured logger
 */
export declare const logger: {
    debug(event: string, extra?: Record<string, unknown>): void;
    info(event: string, extra?: Record<string, unknown>): void;
    warn(event: string, extra?: Record<string, unknown>): void;
    error(event: string, extra?: Record<string, unknown>): void;
};
