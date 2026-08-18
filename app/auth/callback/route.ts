import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import type { LoginResponse } from '@/features/auth/model/types'

//구글에서 리다이렉트 된 후 실행되는 콜백 함수
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // /api/auth/google에서 저장한 쿠키의 state와 콜백의 state를 대조하여 CSRF 검증
  const cookieStore = await cookies()
  const storedState = cookieStore.get('oauth_state')?.value

  cookieStore.delete('oauth_state')

  const provider = state?.split(':')[0] ?? 'google'

  if (error || !code || !state || state !== storedState) {
    const errorMessage = error || 'OAuth 검증에 실패했습니다.'
    return new NextResponse(
      buildPostMessageHtml('AUTH_ERROR', { error: errorMessage }),
      {
        headers: {
          'Content-Type': 'text/html',
          'Cross-Origin-Opener-Policy': 'unsafe-none',
        },
      }
    )
  }

  /**
   * authorization code를 백엔드 POST /auth/login에 JSON body로 전달
   * 개발 환경이라면 local login 진행
   */
  try {
    const loginPath =
      process.env.NODE_ENV === 'development' ? 'local/auth/login' : 'auth/login'
    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/${loginPath}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: process.env.NEXT_PUBLIC_APP_URL!,
        },
        body: JSON.stringify({ provider, code }),
      }
    )

    if (!backendResponse.ok) {
      const errText = await backendResponse.text()
      throw new Error(`백엔드 ${backendResponse.status}: ${errText}`)
    }

    const data: LoginResponse = await backendResponse.json()

    if (!data.success) {
      throw new Error(
        typeof data.error === 'object' && data.error !== null
          ? data.error.message
          : '백엔드 인증에 실패했습니다.'
      )
    }

    if (typeof data.responseDto !== 'object') {
      throw new Error(`responseDto 타입 오류: ${typeof data.responseDto}`)
    }

    const { accessToken, userDetails, userChannelDetails, isNewUser } =
      data.responseDto

    // 백엔드가 Set-Cookie 헤더로 refreshToken을 내려주므로 값을 추출하여 재설정
    const setCookieHeader = backendResponse.headers.get('set-cookie')
    const refreshTokenMatch = setCookieHeader?.match(/refreshToken=([^;]+)/)
    const refreshToken = refreshTokenMatch?.[1]

    if (refreshToken) {
      cookieStore.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
    }

    const user = { userDetails, userChannelDetails: userChannelDetails ?? null }

    return new NextResponse(
      buildPostMessageHtml('AUTH_SUCCESS', {
        accessToken,
        user,
        /* 가입 전환 집계에 쓰인다. 이 값은 로그인 응답에만 있고 새로고침 뒤에는
         * 어디서도 다시 얻을 수 없어 여기서 opener로 넘겨야 한다. */
        isNewUser: Boolean(isNewUser),
      }),
      {
        headers: {
          'Content-Type': 'text/html',
          'Cross-Origin-Opener-Policy': 'unsafe-none',
        },
      }
    )
  } catch (e) {
    console.error('[auth/callback] error:', e)
    return new NextResponse(
      buildPostMessageHtml('AUTH_ERROR', {
        error: e instanceof Error ? e.message : String(e),
      }),
      {
        headers: {
          'Content-Type': 'text/html',
          'Cross-Origin-Opener-Policy': 'unsafe-none',
        },
      }
    )
  }
}

//HTML 페이지를 반환하여 postMessage로 accessToken + user를 부모 창에 전달하고 팝업을 닫는다
function buildPostMessageHtml(type: string, payload: Record<string, unknown>) {
  const targetOrigin = process.env.NEXT_PUBLIC_APP_URL!
  const message = JSON.stringify({ type, ...payload })
  return `<!DOCTYPE html>
<html>
<body>
<script>
  window.opener.postMessage(${message}, "${targetOrigin}");
  window.close();
</script>
</body>
</html>`
}
