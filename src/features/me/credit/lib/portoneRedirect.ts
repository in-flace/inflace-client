/* 모바일 결제창은 페이지를 통째로 이동시켰다가 redirectUrl로 돌려보낸다.
 * 결과는 쿼리 파라미터로만 오는데, 포트원 SDK 본체가 CDN에서 내려와(로컬
 * 번들은 로더뿐) 실제 키 이름을 코드로 확인할 수 없다. 응답 타입의 필드명
 * (billingKey, code, message …)과 같을 가능성이 높지만 확정이 아니므로
 * 후보 키를 여러 개 받고, 이 파일 밖으로는 해석된 결과만 내보낸다.
 * 키가 밝혀지면 아래 목록만 고치면 된다. */
const BILLING_KEY_KEYS = ['billingKey', 'billing_key']
const PAYMENT_ID_KEYS = ['paymentId', 'payment_id']
const CODE_KEYS = ['code', 'pgCode', 'pg_code']
const MESSAGE_KEYS = ['message', 'pgMessage', 'pg_message']

/* 우리가 redirectUrl에 직접 싣는 키. 이것만 있으면 복귀가 아니다. */
const OWN_KEYS = ['tab']

export type PortOneRedirectResult =
  /* 복귀 흔적 없음 — PC 경로와 일반 진입은 전부 여기로 빠진다 */
  | { kind: 'none' }
  | { kind: 'success'; billingKey: string | null; paymentId: string | null }
  | { kind: 'failure'; code: string; message: string | null }
  /* 우리가 붙이지 않은 키가 있는데 해석할 수 없다. 키 이름은 진단에 쓴다 */
  | { kind: 'unknown'; keys: string[] }

function pick(params: URLSearchParams, keys: string[]) {
  for (const key of keys) {
    const value = params.get(key)
    if (value) return value
  }
  return null
}

export function parsePortOneRedirect(
  params: URLSearchParams
): PortOneRedirectResult {
  const foreignKeys = Array.from(new Set(params.keys())).filter(
    (key) => !OWN_KEYS.includes(key)
  )
  if (foreignKeys.length === 0) return { kind: 'none' }

  const code = pick(params, CODE_KEYS)
  if (code) {
    return { kind: 'failure', code, message: pick(params, MESSAGE_KEYS) }
  }

  const billingKey = pick(params, BILLING_KEY_KEYS)
  const paymentId = pick(params, PAYMENT_ID_KEYS)
  if (billingKey || paymentId) {
    return { kind: 'success', billingKey, paymentId }
  }

  return { kind: 'unknown', keys: foreignKeys }
}

/* 복귀 처리를 마친 뒤 주소창에 남길 경로. 탭만 남긴다 — 지우면 탭 상태가
 * 기본값으로 되돌아갈 수 있다. 포트원 키든 정체불명 키든 나머지는 전부 뺀다. */
export function buildCleanReturnPath(pathname: string, search: string) {
  const tab = new URLSearchParams(search).get('tab')
  return tab ? `${pathname}?tab=${encodeURIComponent(tab)}` : pathname
}
