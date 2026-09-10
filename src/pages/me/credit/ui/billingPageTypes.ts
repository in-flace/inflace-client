import type {
  BillingHistoryItem,
  BillingPlan,
  CreditBatch,
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
  | { type: 'cancelReason' }
  | { type: 'cancelNotice' }
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
  | { type: 'creditExtend'; batch: CreditBatch }
  | { type: 'document'; item: BillingHistoryItem; documentType: string }
  | null
