import type {
  BillingHistoryItem,
  BusinessInfo,
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

export const EMPTY_BUSINESS_INFO: BusinessInfo = {
  brn: '',
  name: '',
  representativeName: '',
  phoneNumber: '',
  contactEmail: '',
  address: '',
  businessType: '',
  businessClass: '',
}

/* 서버 UserBusinessInfoRequest의 필수는 brn(숫자 10자리)과 contactEmail뿐이다.
 * 나머지는 기획 폼에 있어 받지만 비어 있어도 저장된다. */
export function isBusinessInfoComplete(info: BusinessInfo) {
  return (
    /^\d{10}$/.test(info.brn.replace(/\D/g, '')) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.contactEmail.trim())
  )
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
  /* 결제가 끝나면 시작일·다음 결제일·지급 크레딧을 한 번에 알려준다. */
  | { type: 'subscribeDone' }
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
  /* 연장 결과는 바뀐 만료일을 보여줘야 해서 전/후 날짜를 함께 넘긴다. */
  | {
      type: 'creditExtended'
      beforeExpiryDate: string | null
      afterExpiryDate: string | null
    }
  /* 환불은 주문 단위다. 버튼을 누른 배치의 주문을 그대로 들고 간다. */
  | { type: 'creditRefund'; batch: CreditBatch }
  | { type: 'creditRefunded' }
  | { type: 'document'; item: BillingHistoryItem; documentType: string }
  /* 세금계산서·현금영수증 모두 사업자 정보를 먼저 저장한 뒤 신청한다.
   * 입력 폼이 같아 모달 하나로 두고 대상만 구분한다. */
  | {
      type: 'businessInfo'
      orderId: number
      documentType: '세금계산서' | '현금영수증'
    }
  | { type: 'taxInvoiceRequested' }
  | { type: 'cashReceiptRequested' }
  /* 모바일 결제창에서 돌아와 서버 등록·결제 확인을 이어서 하는 동안.
   * 그 사이 버튼을 또 누르지 못하게 닫을 수 없게 둔다. */
  | { type: 'billingReturnPending' }
  /* 결제창은 이미 끝났고 입력 모달도 닫혀 있어 인라인으로 보여줄 자리가 없다 */
  | {
      type: 'billingReturnFailed'
      title: string
      message: string
      /* 같은 요청을 다시 보내도 되는 경우에만 있다 */
      retry: (() => void) | null
    }
  | null
