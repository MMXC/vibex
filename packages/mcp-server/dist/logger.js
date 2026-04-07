"use strict";
/**
 * E7-S2: Structured Logging for MCP Server
 *
 * Provides consistent, structured log format for observability.
 * Format: JSON with timestamp, level, event, and context.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const LOG_LEVEL = process.env.MCP_LOG_LEVEL ?? 'info';
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
function shouldLog(level) {
    return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL];
}
function formatLog(level, event, extra) {
    return {
        timestamp: new Date().toISOString(),
        level,
        event,
        service: 'vibex-mcp-server',
        version: '0.1.0',
        ...extra,
    };
}
function write(entry) {
    const output = JSON.stringify(entry);
    if (entry.level === 'error') {
        console.error(output);
    }
    else {
        console.log(output);
    }
}
/**
 * E7-S2: Structured logger
 */
exports.logger = {
    debug(event, extra) {
        if (shouldLog('debug')) {
            write(formatLog('debug', event, extra));
        }
    },
    info(event, extra) {
        if (shouldLog('info')) {
            write(formatLog('info', event, extra));
        }
    },
    warn(event, extra) {
        if (shouldLog('warn')) {
            write(formatLog('warn', event, extra));
        }
    },
    error(event, extra) {
        if (shouldLog('error')) {
            write(formatLog('error', event, extra));
        }
    },
};
