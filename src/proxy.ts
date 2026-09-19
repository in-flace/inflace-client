import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/main', '/videos', '/channel', '/influencer/']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path))

  if (isProtected && !request.cookies.get('refreshToken')) {
    /* 미로그인 상태로 보호된 경로 접근 시 홈(/)으로 리다이렉트
     * from=protected 쿼리로 보호 경로 접근 시도임을 홈(/)에 전달
     * 로그인 모달을 open
     */
    const url = new URL('/', request.url)
    url.searchParams.set('from', 'protected')
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
