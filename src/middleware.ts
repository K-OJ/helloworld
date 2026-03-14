import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const auth = req.cookies.get('autoqa_auth');
  const { pathname } = req.nextUrl;

  // /dashboard 접근 시 로그인 확인
  if (pathname.startsWith('/dashboard') && !auth) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 이미 로그인 상태에서 /login 접근 시 /dashboard로 이동
  if (pathname === '/login' && auth) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
