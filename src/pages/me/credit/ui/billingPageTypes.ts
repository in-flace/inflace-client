import { isAxiosError } from 'axios'

import type {
  BillingHistoryItem,
  BillingPlan,
  CreditBatch,
  CreditPurchaseOption,
} from '@/features/me/credit'

export type PayerInfo = {
  name: string
  phone: string
  email: string
}

export const EMPTY_PAYER_INFO: PayerInfo = {
  name: '',
  phone: '',
  email: '',
}

/* 포트원과 백엔드가 모두 필수로 요구하는 세 필드가 유효한지. 결제창을
 * 띄우기 전에 버튼을 잠그는 데 쓴다. 전화번호 하한 10자리는 서버
 * RegisterPaymentMethodRequest의 ^[0-9-]{10,13}$ 를 따른 것이다. */
export function isPayerInfoComplete(payerInfo: PayerInfo) {
  return (
    payerInfo.name.trim() !== '' &&
    payerInfo.phone.replace(/\D/g, '').length >= 10 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerInfo.email.trim())
  )
}

export type ModalState =
  | { type: 'subscribe'; plan: BillingPlan }
  /* 해지는 기획·디자인 모두 4단계다.
   * 사유 선택 → 안내 → 최종 확인 → 완료 */
  | { type: 'cancelReason' }
  | { type: 'cancelNotice' }
  | { type: 'cancelConfirm' }
  | { type: 'cancelDone' }
  /* pendingPlan이 있으면 구독 모달에서 넘어온 것이다. 카드 등록 후
   * 원래 하려던 구독 결제까지 이어서 마쳐야 한다. */
  | { type: 'billingRegister'; pendingPlan?: BillingPlan }
  | { type: 'billingChange' }
  | { type: 'billingRegistered' }
  | { type: 'billingChanged' }
  | { type: 'billingDelete' }
  | { type: 'billingDeleted'; last4: string | null }
  | { type: 'creditPurchase' }
  /* 기획·디자인상 구매는 선택 → 결제 내역 확인 → 구매하기 2단계다. */
  | {
      type: 'creditConfirm'
      option: CreditPurchaseOption
      paymentMethod: 'registeredCard' | 'oneTime'
    }
  | { type: 'creditExtend'; batch: CreditBatch }
  | { type: 'document'; item: BillingHistoryItem; documentType: string }
  | { type: 'taxInvoiceRequested' }
  | null

export function getErrorCode(error: unknown) {
  if (isAxiosError(error)) {
    const code = error.response?.data?.error?.code
    if (typeof code === 'string') return code
  }
  return null
}

/* 서버가 내려준 error.message를 우선 보여준다. 결제는 실패 사유가
 * 사용자 행동으로 이어지는 경우가 많아 일반 문구로 덮으면 안 된다. */
export function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const message = error.response?.data?.error?.message
    if (typeof message === 'string') return message
  }
  return error instanceof Error
    ? error.message
    : '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'
}
