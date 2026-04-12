/**
 * middleware-auth.test.ts — VibeX Auth Middleware Unit Tests
 * Epic3-S3.1: vibex-auth-401-handling
 *
 * Tests the actual middleware function from src/middleware.ts with mocked
 * NextRequest/NextResponse from 'next/server'.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock cookie store — lets tests control what cookies the request sees
// We use a plain object so cookies are looked up dynamically (not captured
// at construction time) and reset between tests with mockCookieStore.clear().
// ---------------------------------------------------------------------------
const mockCookieStore: Record<string, string> = {};

// ---------------------------------------------------------------------------
// Mock next/server BEFORE the real middleware is imported
// ---------------------------------------------------------------------------
vi.mock('next/server', () => {
  const MockNextUrl = vi.fn().mockImplementation((url: string) => {
    const parsed = new URL(url, 'http://localhost');
    return {
      pathname: parsed.pathname,
      search: parsed.search,
      searchParams: {
        get: (key: string) => parsed.searchParams.get(key),
      },
    };
  });

  class MockNextRequest {
    nextUrl: ReturnType<typeof MockNextUrl>;
    url: string;
    // Use a getter so the lookup is always fresh from mockCookieStore
    get cookies() {
      return {
        get: (name: string) => {
          const val = mockCookieStore[name];
          return val !== undefined ? { value: val } : undefined;
        },
        has: (name: string) => name in mockCookieStore,
      };
    }

    constructor(url: string) {
      const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
      this.url = fullUrl;
      this.nextUrl = MockNextUrl(fullUrl);
    }
  }

  class MockNextResponse {
    static next = vi.fn(() => new MockResponse(null, 200));
    static redirect = vi.fn((url: URL) => new MockResponse(null, 307, url.toString()));
  }

  class MockResponse {
    status: number;
    statusText: string;
    ok: boolean;
    private _headers: Record<string, string>;
    body: unknown;

    constructor(body: unknown, status = 200, redirectLocation?: string) {
      this.status = status;
      this.statusText = status === 200 ? 'OK' : status === 307 ? 'Temporary Redirect' : '';
      this.ok = status >= 200 && status < 300;
      this._headers = {};
      if (redirectLocation) {
        this._headers['location'] = redirectLocation;
      }
      this.body = body;
    }

    get statusCode() {
      return this.status;
    }

    getHeaders(): Record<string, string> {
      return this._headers;
    }

    get headers() {
      return {
        get: (name: string) => this._headers[name] ?? null,
        has: (name: string) => name in this._headers,
        set: (name: string, value: string) => { this._headers[name] = value; },
      };
    }

    // Make it await-able to match NextResponse pattern
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    then<TResult1 = any, TResult2 = never>(
      onfulfilled?: ((value: this) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2> {
      return Promise.resolve(this).then(onfulfilled, onrejected);
    }
  }

  return {
    NextRequest: MockNextRequest,
    NextResponse: MockNextResponse,
  };
});

// ---------------------------------------------------------------------------
// Import the ACTUAL middleware function (after mocking next/server)
// ---------------------------------------------------------------------------
import { middleware } from '@/middleware';

// ---------------------------------------------------------------------------
// Helper: set up cookie map for a test
// ---------------------------------------------------------------------------
function setCookies(cookies: Record<string, string>) {
  Object.keys(mockCookieStore).forEach((k) => delete mockCookieStore[k]);
  Object.entries(cookies).forEach(([key, value]) => {
    mockCookieStore[key] = value;
  });
}

// ---------------------------------------------------------------------------
// Helper: build request URL
// ---------------------------------------------------------------------------
function url(path: string): string {
  return `http://localhost${path}`;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
describe('middleware — auth protection', () => {
  beforeEach(() => {
    Object.keys(mockCookieStore).forEach((k) => delete mockCookieStore[k]);
    vi.clearAllMocks();
  });

  // ------------------------------------------------------------------
  // T1: GET /canvas (no cookie) → 307 /auth?returnTo=/canvas
  // ------------------------------------------------------------------
  it('T1: redirects unauthenticated GET /canvas to /auth with returnTo', async () => {
    const { NextRequest } = await import('next/server');
    const req = new NextRequest(url('/canvas'));
    const res = middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/auth');
    expect(res.headers.get('location')).toContain('returnTo=');
    // returnTo is URL-encoded: / → %2F
    expect(res.headers.get('location')).toMatch(/returnTo=%2Fcanvas$/);
  });

  // ------------------------------------------------------------------
  // T2: GET /dashboard/subpath (no cookie) → 307 /auth?returnTo=/dashboard/subpath
  // ------------------------------------------------------------------
  it('T2: redirects unauthenticated GET /dashboard/subpath to /auth with returnTo', async () => {
    const { NextRequest } = await import('next/server');
    const req = new NextRequest(url('/dashboard/subpath'));
    const res = middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/auth');
    expect(res.headers.get('location')).toContain('returnTo=');
    // returnTo is URL-encoded: / → %2F
    expect(res.headers.get('location')).toMatch(/returnTo=%2Fdashboard%2Fsubpath$/);
  });

  // ------------------------------------------------------------------
  // T3: GET /canvas (auth_token cookie) → 200 (next)
  // ------------------------------------------------------------------
  it('T3: allows authenticated GET /canvas with auth_token cookie', async () => {
    setCookies({ auth_token: 'valid-token' });
    const { NextRequest } = await import('next/server');
    const req = new NextRequest(url('/canvas'));
    const res = middleware(req);

    expect(res.status).toBe(200);
  });

  // ------------------------------------------------------------------
  // T4: GET /canvas (auth_session cookie) → 200 (next)
  // ------------------------------------------------------------------
  it('T4: allows authenticated GET /canvas with auth_session cookie', async () => {
    setCookies({ auth_session: 'valid-session' });
    const { NextRequest } = await import('next/server');
    const req = new NextRequest(url('/canvas'));
    const res = middleware(req);

    expect(res.status).toBe(200);
  });

  // ------------------------------------------------------------------
  // T5: GET /auth (with cookie, no returnTo) → 302 /dashboard
  // ------------------------------------------------------------------
  it('T5: authenticated user on /auth without returnTo redirects to /dashboard', async () => {
    setCookies({ auth_token: 'valid-token' });
    const { NextRequest } = await import('next/server');
    const req = new NextRequest(url('/auth'));
    const res = middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toMatch(/\/dashboard$/);
  });

  // ------------------------------------------------------------------
  // T6: GET /auth?returnTo=/canvas (with cookie) → 302 /canvas
  // ------------------------------------------------------------------
  it('T6: authenticated user on /auth with returnTo redirects to returnTo URL', async () => {
    setCookies({ auth_token: 'valid-token' });
    const { NextRequest } = await import('next/server');
    const req = new NextRequest(url('/auth?returnTo=/canvas'));
    const res = middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toMatch(/\/canvas$/);
    // Should NOT contain returnTo param in final redirect
    expect(res.headers.get('location')).not.toMatch(/returnTo=/);
  });

  // ------------------------------------------------------------------
  // T7: GET /_next/static/file.js → 200 (next)
  // ------------------------------------------------------------------
  it('T7: allows static asset /_next/static/file.js without auth', async () => {
    const { NextRequest } = await import('next/server');
    const req = new NextRequest(url('/_next/static/file.js'));
    const res = middleware(req);

    expect(res.status).toBe(200);
  });

  // ------------------------------------------------------------------
  // T8: GET /api/auth/login (no cookie) → 200 (next)
  // ------------------------------------------------------------------
  it('T8: allows public API endpoint /api/auth/login without auth', async () => {
    const { NextRequest } = await import('next/server');
    const req = new NextRequest(url('/api/auth/login'));
    const res = middleware(req);

    expect(res.status).toBe(200);
  });
});
