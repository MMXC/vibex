/**
 * E7-S2: Structured Logging for MCP Server
 *
 * Provides consistent, structured log format for observability.
 * Format: JSON with timestamp, level, event, and context.
 */
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
/**
 * E7-S2: Keys that should be redacted in logs
 */
const SENSITIVE_KEYS = ['token', 'password', 'secret', 'key', 'auth', 'credential', 'passphrase', 'private'];
/**
 * E7-S2: Recursively sanitize sensitive fields from log metadata.
 * Deep-clones the object to avoid mutation.
 */
function sanitize(meta) {
    const result = {};
    for (const [k, v] of Object.entries(meta)) {
        if (SENSITIVE_KEYS.some((sk) => k.toLowerCase().includes(sk))) {
            result[k] = '[REDACTED]';
        }
        else if (v && typeof v === 'object' && !Array.isArray(v)) {
            result[k] = sanitize(v);
        }
        else {
            result[k] = v;
        }
    }
    return result;
}
function formatLog(level, message, extra) {
    const sanitized = extra ? sanitize(extra) : undefined;
    return {
        timestamp: new Date().toISOString(),
        level,
        service: 'vibex-mcp-server',
        version: '0.1.0',
        message,
        ...sanitized,
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
export const logger = {
    debug(message, extra) {
        if (shouldLog('debug')) {
            write(formatLog('debug', message, extra));
        }
    },
    info(message, extra) {
        if (shouldLog('info')) {
            write(formatLog('info', message, extra));
        }
    },
    warn(message, extra) {
        if (shouldLog('warn')) {
            write(formatLog('warn', message, extra));
        }
    },
    error(message, extra) {
        if (shouldLog('error')) {
            write(formatLog('error', message, extra));
        }
    },
    // E7-S2: Log tool call with duration and success
    logToolCall(tool, durationMs, success) {
        write(formatLog('info', `Tool call: ${tool}`, {
            tool,
            duration: durationMs,
            success,
        }));
    },
};
