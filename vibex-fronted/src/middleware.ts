/**
 * P001-E1 i18n middleware
 * 
 * Detects Accept-Language header and sets locale preference.
 * Stores the detected locale in a cookie for client-side access.
 * 
 * For now, the actual locale switching will be handled by
 * userPreferencesStore.locale (P001-E2).
 * This middleware provides the detection infrastructure.
 * 
 * Usage: P001-E2 will read locale from cookie and sync to userPreferencesStore.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOCALE_COOKIE = 'vibex-locale';
const SUPPORTED_LOCALES = ['en', 'zh'];

/**
 * Parse Accept-Language header and return the best matching locale.
 */
function parseAcceptLanguage(header: string | null): string {
  if (!header) return 'zh';
  
  const preferredLocales = header
    .split(',')
    .map((lang) => {
      const trimmed = lang.trim();
      const semicolonIdx = trimmed.indexOf(';');
      const localePart = semicolonIdx >= 0 ? trimmed.slice(0, semicolonIdx) : trimmed;
      const qPart = semicolonIdx >= 0 ? trimmed.slice(semicolonIdx + 1) : 'q=1';
      return {
        locale: (localePart.split('-')[0] ?? localePart).toLowerCase(),
        q: parseFloat(qPart.replace('q=', '')) || 1,
      };
    })
    .sort((a, b) => b.q - a.q);
  
  for (const { locale } of preferredLocales) {
    if (SUPPORTED_LOCALES.includes(locale)) {
      return locale;
    }
  }
  
  return 'zh';
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // If locale cookie not set, detect from Accept-Language and set it
  const existingLocale = request.cookies.get(LOCALE_COOKIE);
  
  if (!existingLocale) {
    const detectedLocale = parseAcceptLanguage(
      request.headers.get('accept-language')
    );
    
    response.cookies.set(LOCALE_COOKIE, detectedLocale, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
      sameSite: 'lax',
    });
  }
  
  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
