/**
 * middleware.ts — VibeX 认证中间件
 *
 * 保护 /dashboard、/canvas、/design 等路径。
 * 未登录用户访问受保护路径时返回 307 重定向到 /auth。
 * E1-S1.5
 */
import { NextRequest, NextResponse } from 'next/server';

// 需要认证的路径前缀
const PROTECTED_PATHS = ['/dashboard', '/canvas', '/design', '/project-settings', '/preview'];

// 无需认证的路径（登录页、公开资源）
// 注意: /auth 不在此列表 — 已登录用户访问 /auth 应重定向，而非直接放行
const PUBLIC_PATHS = ['/login', '/oauth/callback', '/api/auth'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 放行公开路径
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 2. 放行静态资源和 Next.js 内部路由
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 3. 检查认证状态：使用 httpOnly cookie（与 sessionStorage 双保险）
  // sessionStorage 在 middleware 中不可用，cookie 可从服务端读取
  const authToken =
    request.cookies.get('auth_token')?.value ||
    request.cookies.get('auth_session')?.value;

  // 4. 受保护路径需要认证
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  if (isProtected && !authToken) {
    const returnTo = pathname + request.nextUrl.search;
    const redirectUrl = new URL('/auth', request.url);
    redirectUrl.searchParams.set('returnTo', returnTo);
    return NextResponse.redirect(redirectUrl);
  }

  // 5. 已登录用户访问 /auth → 重定向到 /dashboard
  if (pathname === '/auth' && authToken) {
    const returnTo = request.nextUrl.searchParams.get('returnTo');
    if (returnTo) {
      return NextResponse.redirect(new URL(returnTo, request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了:
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
