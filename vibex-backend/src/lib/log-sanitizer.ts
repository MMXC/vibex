/**
 * Log Sanitizer Utility
 * Log Sanitizer Utility
 * 
 * Provides safe logging utilities that:
 * 1. Redact sensitive fields from logged objects
 * 2. Control debug logging based on environment
 * 3. Prevent PII/sensitive data from leaking in production
 */

const SENSITIVE_KEYS = [
  'password', 'passwd', 'pwd', 'secret', 'token', 'apikey', 'api_key',
  'authorization', 'auth', 'bearer', 'cookie', 'session', 'sessionid',
  'accesstoken', 'access_token', 'refreshtoken', 'refresh_token',
  'privatekey', 'private_key', 'jwt', 'credential', 'credentials',
  'ssn', 'social_security', 'credit_card', 'creditcard', 'cvv',
  'email', 'phone', 'address', 'birthdate', 'date_of_birth',
  'userid', 'user_id', 'userId', 'uid', 'sub',
  'name', 'firstname', 'lastname', 'fullname',
  'content', 'body', 'data', 'payload', 'input', 'message',
  'raw', 'rawContent', 'rawResponse', 'text', 'query',
];

/**
 * Recursively sanitize sensitive fields in an object.
 * Redacts the VALUE of sensitive keys with [REDACTED].
 */
export function sanitize<T = Record<string, unknown>>(obj: T, depth = 0): T {
  if (depth > 10) return obj; // Prevent infinite recursion
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item, depth + 1)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_KEYS.some(sk => lowerKey.includes(sk));
      if (isSensitive) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = sanitize(value as Record<string, unknown>, depth + 1);
      } else {
        result[key] = value;
      }
    }
    return result as T;
  }

  return obj;
}

/**
 * Truncate a string to a maximum length for safe logging.
 */
export function truncate(str: string, maxLen: number): string {
  if (!str || str.length <= maxLen) return str;
  return str.substring(0, maxLen) + '...';
}

/**
 * Sanitize and truncate a string value (e.g., raw AI response).
 * Keeps first N chars but redacts any email-like patterns.
 */
export function sanitizeAndTruncate(str: string, maxLen = 500): string {
  if (!str) return str;
  // Redact email patterns
  let sanitized = str.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
  // Redact token-like patterns (long alphanumeric strings)
  sanitized = sanitized.replace(/\b[a-f0-9]{32,}\b/gi, '[TOKEN_REDACTED]');
  // Truncate
  return truncate(sanitized, maxLen);
}

/**
 * Development-only logger.
 * Logs only when NODE_ENV !== 'production'.
 */
export function devLog(...args: unknown[]): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
}

/**
 * Debug logger with sanitization.
 * Only logs in non-production environments and sanitizes all arguments.
 */
export function devDebug(...args: unknown[]): void {
  if (process.env.NODE_ENV === 'production') return;
  const sanitized = args.map(arg => {
    if (typeof arg === 'string') return sanitizeAndTruncate(arg, 200);
    if (typeof arg === 'object' && arg !== null) return sanitize(arg);
    return arg;
  });
  devLog(...sanitized);
}

/**
 * Safe safeError replacement.
 * In production, ensures no sensitive data is leaked via error messages.
 */
export function safeError(...args: unknown[]): void {
  const sanitized = args.map(arg => {
    if (typeof arg === 'string') return sanitizeAndTruncate(arg, 500);
    if (typeof arg === 'object' && arg !== null) return sanitize(arg);
    return arg;
  });
  console.error(...sanitized);
}
