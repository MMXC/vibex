/**
 * safeError.ts — S84-E4: re-export safeError for API route compatibility
 *
 * The template favorite routes import safeError from this path to keep
 * error logging consistent across the codebase.
 */
export { safeError } from '@/lib/log-sanitizer';
