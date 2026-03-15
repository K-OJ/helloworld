import { NextRequest, NextResponse } from 'next/server';

/**
 * 인증 가드 미들웨어
 * - 보호된 라우트(/dashboard, /)에 미인증 접근 시 /login으로 리다이렉트
 * - 이미 로그인 상태에서 /login 접근 시 /dashboard로 리다이렉트
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 쿠키 기반 인증 토큰 검증 (autoqa_auth 또는 auth_token)
  const authCookie = req.cookies.get('autoqa_auth') ?? req.cookies.get('auth_token');
  const isAuthenticated = authCookie !== undefined && authCookie.value !== '';

  // 보호된 라우트: 미인증 접근 차단
  const isProtectedRoute =
    pathname === '/' ||
    pathname.startsWith('/dashboard');

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // /login: 이미 인증된 사용자는 대시보드로 이동
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/login',
  ],
};
