/**
 * validateReturnTo — S1.2: validate returnTo URL to prevent open redirect
 *
 * After 401 redirect to /auth, the returnTo param must be a safe path.
 * Only paths starting with "/" that are NOT absolute URLs are allowed.
 *
 * @param returnTo - The returnTo query param value from URL
 * @returns Safe path or '/' fallback
 */
export function validateReturnTo(returnTo: string | null | undefined): string {
  // Whitelist: only relative paths starting with /
  const ALLOWED_PREFIXES = [
    '/canvas',
    '/design',
    '/projects',
    '/dashboard',
    '/auth',     // allow redirecting back to auth (e.g. from /login)
    '/',
  ];

  if (!returnTo) return '/';

  try {
    // Must start with /
    if (!returnTo.startsWith('/')) return '/';

    // Must NOT be an absolute URL (no protocol)
    if (returnTo.match(/^https?:\/\//)) return '/';

    // Reject protocol-relative URLs (e.g. //evil.com) — must check before prefix whitelist
    if (returnTo.startsWith('//')) return '/';

    // Must match allowed prefix
    const isAllowed = ALLOWED_PREFIXES.some((prefix) =>
      returnTo === prefix || returnTo.startsWith(prefix + '/')
    );

    return isAllowed ? returnTo : '/';
  } catch {
    return '/';
  }
}
