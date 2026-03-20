import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @deprecated
 * Redirect middleware - This file handles route consolidation.
 * The /confirm/* and /requirements/* routes are deprecated.
 * All traffic should now go through the homepage (/) flow.
 * 
 * @deprecated since 2026-03-21 - Use homepage step flow instead
 * @see docs/vibex-page-structure-consolidation/IMPLEMENTATION_PLAN.md
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect /confirm/* routes to homepage
  if (pathname.startsWith('/confirm')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl, 301);
  }

  // Redirect /requirements/* routes to homepage (excluding /requirements/new which may be needed)
  if (pathname.startsWith('/requirements') && !pathname.startsWith('/requirements/new')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl, 301);
  }

  // Also redirect /requirements (without trailing slash) to /
  if (pathname === '/requirements') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and api routes
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
