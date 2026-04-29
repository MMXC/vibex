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
    service: 'vibex-mcp-server';
    version: string;
    tool?: string;
    duration?: number;
    success?: boolean;
    message?: string;
    event?: string;
    [key: string]: unknown;
}
/**
 * E7-S2: Structured logger
 */
export declare const logger: {
    debug(message: string, extra?: Record<string, unknown>): void;
    info(message: string, extra?: Record<string, unknown>): void;
    warn(message: string, extra?: Record<string, unknown>): void;
    error(message: string, extra?: Record<string, unknown>): void;
    logToolCall(tool: string, durationMs: number, success: boolean): void;
};
