import { PortOnePaymentError, type PaymentCustomer } from '../lib/portone'
import type { PortOneRedirectResult } from '../lib/portoneRedirect'
import type { BillingPlanCode } from '../types'
import type { BillingFlow, ConsumedBillingIntent } from './billingIntent'
import type { BillingAction } from './billingErrorMessages'

/* 결제창에서 돌아온 뒤 무엇을 할지. 네트워크·화면과 떼어 두어 분기를 전부
 * 단위 테스트로 확인한다. 실행은 useBillingReturn이 맡는다. */
export type BillingReturnPlan =
  /* 복귀가 아니거나, 이미 처리했거나, 처리할 맥락이 없다 */
  | { kind: 'ignore' }
  | {
      kind: 'register'
      billingKey: string
      payer: PaymentCustomer
      planCode: BillingPlanCode | null
    }
  | { kind: 'change'; billingKey: string }
  | { kind: 'confirmCredit'; orderId: number }
  /* 주문 번호를 잃었지만 서버가 웹훅으로 확정하므로 화면만 새로 받는다 */
  | { kind: 'refreshCredits' }
  | { kind: 'failed'; action: BillingAction; error: PortOnePaymentError }

const ACTION_BY_FLOW: Record<BillingFlow, BillingAction> = {
  registerBillingMethod: 'registerBillingMethod',
  changeBillingMethod: 'changeBillingMethod',
  creditCheckout: 'purchaseCredits',
}

export const REDIRECT_RESULT_UNKNOWN = 'REDIRECT_RESULT_UNKNOWN'
export const BILLING_INTENT_EXPIRED = 'BILLING_INTENT_EXPIRED'

export function resolveBillingReturnPlan(
  consumed: ConsumedBillingIntent,
  redirect: PortOneRedirectResult
): BillingReturnPlan {
  if (redirect.kind === 'none') return { kind: 'ignore' }

  /* 진행 중이던 결제가 없다. 뒤로가기로 복귀 주소에 다시 들어온 경우가
   * 대부분이라, 여기서 에러를 띄우면 이미 끝난 결제를 실패처럼 보이게 한다. */
  if (consumed.status === 'none') return { kind: 'ignore' }

  if (consumed.status === 'expired') {
    /* 크레딧은 서버가 웹훅으로 확정하므로 결과를 잃어도 화면만 갱신하면 된다 */
    if (consumed.flow === 'creditCheckout') return { kind: 'refreshCredits' }
    return {
      kind: 'failed',
      action: ACTION_BY_FLOW[consumed.flow],
      error: new PortOnePaymentError(
        '결제 진행 시간이 지났습니다.',
        BILLING_INTENT_EXPIRED
      ),
    }
  }

  const { intent } = consumed
  const action = ACTION_BY_FLOW[intent.flow]

  if (redirect.kind === 'failure') {
    return {
      kind: 'failed',
      action,
      error: new PortOnePaymentError(
        redirect.message ?? '결제창에서 오류가 발생했습니다.',
        redirect.code
      ),
    }
  }

  /* 크레딧은 주문 번호만 있으면 서버에 결과를 물을 수 있어 쿼리 해석이
   * 필요 없다. 파라미터 이름이 예상과 달라도 영향을 받지 않는다. */
  if (intent.flow === 'creditCheckout') {
    return { kind: 'confirmCredit', orderId: intent.orderId }
  }

  const billingKey = redirect.kind === 'success' ? redirect.billingKey : null
  if (!billingKey) {
    return {
      kind: 'failed',
      action,
      error: new PortOnePaymentError(
        '결제창 결과에서 빌링키를 찾지 못했습니다.',
        REDIRECT_RESULT_UNKNOWN
      ),
    }
  }

  if (intent.flow === 'changeBillingMethod') {
    return { kind: 'change', billingKey }
  }

  return {
    kind: 'register',
    billingKey,
    payer: intent.payer,
    planCode: intent.pendingPlanCode,
  }
}

export type RegisterFailureVerdict = 'succeeded' | 'retryable' | 'fatal'

/* 카드 등록 요청이 실패했을 때 정말 실패인지 다시 본다.
 * 앞선 요청이 서버에 닿았는데 응답만 못 받고 재시도하면 같은 빌링키라 409가
 * 온다. 코드만 보고 실패로 단정하면 이미 등록된 사용자에게 다시 등록하라고
 * 안내하게 된다. 등록 흐름은 카드가 없을 때만 열리므로, 지금 활성 카드가
 * 있다면 그건 이번 요청이 만든 것이다. */
export function interpretRegisterFailure({
  code,
  status,
  hasActiveBillingMethod,
}: {
  code: string | null
  status: number | null
  hasActiveBillingMethod: boolean
}): RegisterFailureVerdict {
  const isDuplicate =
    code === 'PAYMENT_METHOD_409_BILLING_KEY' ||
    code === 'PAYMENT_METHOD_409_ACTIVE'
  if (isDuplicate && hasActiveBillingMethod) return 'succeeded'

  /* 응답이 없거나(네트워크) 서버 쪽 오류면 같은 빌링키로 다시 시도할 수 있다 */
  if (status === null || status >= 500) return 'retryable'

  return 'fatal'
}
