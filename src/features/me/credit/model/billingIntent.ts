import type { PaymentCustomer } from '../lib/portone'
import type { BillingPlanCode } from '../types'

/* 모바일 결제창은 페이지를 통째로 이동시켜, 결제창을 연 함수가 이어서
 * 서버 등록을 부르지 못한다. 돌아온 뒤 무엇을 이어서 할지를 여기에 남긴다.
 *
 * - sessionStorage 한 칸만 쓴다. 한 탭에서 결제창은 한 번에 하나뿐이고,
 *   탭 범위라 다른 탭과 섞이지 않는다. URL에 식별자를 싣지 않는 이유는
 *   탭을 누르면 쿼리가 지워지고, 포트원이 우리 쿼리를 보존하는지도 모르기 때문이다.
 * - 멱등키는 넣지 않는다. 서버가 키를 먼저 소모하고 응답을 재생하지 않아,
 *   들고 갔다가 다시 쓰면 복귀 후 요청이 전부 409로 막힌다.
 * - 이름·휴대폰·이메일이 들어가므로 읽는 즉시 지우고 TTL을 짧게 둔다.
 *   같은 스토리지에 키를 둬야 해서 암호화는 보호 효과가 없어 하지 않는다. */
const STORAGE_KEY = 'inflace:billing-intent'

/* 결제창에 머무는 현실적인 상한. 넘기면 이어서 처리하지 않는다. */
export const BILLING_INTENT_TTL_MS = 15 * 60 * 1000

export type BillingIntent =
  | {
      flow: 'registerBillingMethod'
      payer: PaymentCustomer
      /* 구독 모달에서 넘어왔으면 등록을 마친 뒤 그 모달로 돌아간다 */
      pendingPlanCode: BillingPlanCode | null
    }
  | { flow: 'changeBillingMethod'; pendingPlanCode: BillingPlanCode | null }
  | { flow: 'creditCheckout'; orderId: number }

export type BillingFlow = BillingIntent['flow']

export type StoredBillingIntent = BillingIntent & { savedAt: number }

export type ConsumedBillingIntent =
  | { status: 'none' }
  /* 진행 중이던 결제가 있었지만 너무 오래 지났다 */
  | { status: 'expired'; flow: BillingFlow }
  | { status: 'active'; intent: StoredBillingIntent }

type IntentStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function getDefaultStorage(): IntentStorage | null {
  /* 사파리 사생활 보호 모드 등에서는 접근만 해도 예외가 난다 */
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage
  } catch {
    return null
  }
}

const FLOWS: readonly BillingFlow[] = [
  'registerBillingMethod',
  'changeBillingMethod',
  'creditCheckout',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isPayer(value: unknown): value is PaymentCustomer {
  return (
    isRecord(value) &&
    typeof value.fullName === 'string' &&
    typeof value.phoneNumber === 'string' &&
    typeof value.email === 'string'
  )
}

/* 스토리지는 사용자가 고칠 수 있는 외부 입력이다. 모양이 맞을 때만 믿는다. */
export function parseBillingIntent(
  raw: string | null,
  now: number
): ConsumedBillingIntent {
  if (!raw) return { status: 'none' }

  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return { status: 'none' }
  }

  if (
    !isRecord(value) ||
    typeof value.savedAt !== 'number' ||
    !FLOWS.includes(value.flow as BillingFlow)
  ) {
    return { status: 'none' }
  }

  const flow = value.flow as BillingFlow
  if (now - value.savedAt > BILLING_INTENT_TTL_MS || value.savedAt > now) {
    return { status: 'expired', flow }
  }

  const planCode = value.pendingPlanCode
  const pendingPlanCode =
    planCode === 'PRO' || planCode === 'EARLY_BIRD' ? planCode : null

  if (flow === 'registerBillingMethod') {
    if (!isPayer(value.payer)) return { status: 'none' }
    return {
      status: 'active',
      intent: {
        flow,
        payer: value.payer,
        pendingPlanCode,
        savedAt: value.savedAt,
      },
    }
  }

  if (flow === 'creditCheckout') {
    if (typeof value.orderId !== 'number') return { status: 'none' }
    return {
      status: 'active',
      intent: { flow, orderId: value.orderId, savedAt: value.savedAt },
    }
  }

  return {
    status: 'active',
    intent: { flow, pendingPlanCode, savedAt: value.savedAt },
  }
}

/* 결제창을 열기 직전에 await 없이 부른다. 모바일은 호출 직후 문서가
 * 사라지므로 결제창 호출 뒤에 저장하면 아무것도 남지 않는다. */
export function beginBillingIntent(
  intent: BillingIntent,
  now = Date.now(),
  storage: IntentStorage | null = getDefaultStorage()
) {
  try {
    storage?.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...intent, savedAt: now } satisfies StoredBillingIntent)
    )
  } catch {
    /* 저장에 실패해도 PC 결제는 그대로 진행된다. 모바일 복귀만 이어지지 못한다. */
  }
}

/* 읽는 즉시 지운다. 뒤로가기로 복귀 주소에 다시 들어와도 두 번 처리되지 않는다. */
export function consumeBillingIntent(
  now = Date.now(),
  storage: IntentStorage | null = getDefaultStorage()
): ConsumedBillingIntent {
  if (!storage) return { status: 'none' }

  let raw: string | null = null
  try {
    raw = storage.getItem(STORAGE_KEY)
    storage.removeItem(STORAGE_KEY)
  } catch {
    return { status: 'none' }
  }

  return parseBillingIntent(raw, now)
}

/* PC는 결제창이 같은 페이지에서 끝나 리디렉션이 없다. 거기서 남은 intent는
 * 쓸 곳이 없으니 결제가 끝나거나 취소되면 바로 지운다. */
export function clearBillingIntent(
  storage: IntentStorage | null = getDefaultStorage()
) {
  try {
    storage?.removeItem(STORAGE_KEY)
  } catch {
    /* 지우지 못해도 TTL이 지나면 쓰이지 않는다 */
  }
}
