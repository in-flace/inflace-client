import { isAxiosError } from 'axios'

import { CreditPurchaseStatusError } from '../api/billingApi'
import { PortOnePaymentError } from '../lib/portone'

/* 실패 문구는 "무엇이 안 됐는지"로 시작해야 사용자가 상황을 안다.
 * 에러 코드로 사유를 특정하지 못할 때 쓰는 동작별 기본 문구다. */
const ACTION_FALLBACKS = {
  subscribe: '구독을 시작하지 못했습니다.',
  cancelSubscription: '구독을 해지하지 못했습니다.',
  registerBillingMethod: '카드를 등록하지 못했습니다.',
  changeBillingMethod: '결제수단을 변경하지 못했습니다.',
  deleteBillingMethod: '결제수단을 삭제하지 못했습니다.',
  purchaseCredits: '크레딧을 구매하지 못했습니다.',
  extendCredits: '유효기간을 연장하지 못했습니다.',
  refundCredits: '환불을 신청하지 못했습니다.',
  issueTaxInvoice: '세금계산서를 신청하지 못했습니다.',
  issueCashReceipt: '현금영수증을 신청하지 못했습니다.',
} as const

export type BillingAction = keyof typeof ACTION_FALLBACKS

const RETRY_SUFFIX = ' 잠시 후 다시 시도해주세요.'

/* 서버 ErrorDefine의 code와 1:1. 사용자가 다음에 뭘 해야 하는지까지 적는다.
 * 서버 원문(message)은 영어라 그대로 노출하면 안 된다. */
const MESSAGE_BY_CODE: Record<string, string> = {
  /* 공통 */
  COMMON_409_IDEMPOTENCY:
    '같은 요청이 처리 중입니다. 잠시 후 다시 시도해주세요.',
  AUTH_401_UNAUTHORIZED: '로그인이 만료되었습니다. 다시 로그인해주세요.',
  AUTH_401_ACCESS: '로그인이 만료되었습니다. 다시 로그인해주세요.',
  AUTH_401_LOGOUT: '로그인이 만료되었습니다. 다시 로그인해주세요.',

  /* 결제수단 */
  PAYMENT_METHOD_404: '등록된 카드가 없습니다. 카드를 먼저 등록해주세요.',
  PAYMENT_METHOD_409_ACTIVE:
    '이미 등록된 카드가 있습니다. 카드를 바꾸시려면 결제수단 변경을 이용해주세요.',
  PAYMENT_METHOD_409_BILLING_KEY:
    '이미 등록된 카드입니다. 다른 카드로 등록해주세요.',
  PAYMENT_METHOD_400_BILLING_KEY:
    '카드 정보를 확인하지 못했습니다. 카드 등록을 다시 진행해주세요.',
  PAYMENT_METHOD_400_TYPE: '지원하지 않는 결제수단입니다. 카드로 결제해주세요.',
  PAYMENT_400_CUSTOMER: '이름, 휴대폰 번호, 이메일을 모두 입력해주세요.',
  PAYMENT_502_PROVIDER:
    '결제사와 연결하지 못했습니다. 잠시 후 다시 시도해주세요.',

  /* 구독 */
  SUBSCRIPTION_PLAN_404:
    '선택한 플랜을 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.',
  SUBSCRIPTION_PLAN_409: '지금은 신청할 수 없는 플랜입니다.',
  SUBSCRIPTION_409_EARLY_BIRD:
    '얼리버드 플랜이 마감되었습니다. 다른 플랜을 선택해주세요.',
  SUBSCRIPTION_409_EARLY_BIRD_REJOIN:
    '얼리버드 플랜은 구독 이력이 없는 분만 신청할 수 있습니다. 다른 플랜을 선택해주세요.',
  SUBSCRIPTION_409_ACTIVE: '이미 구독 중입니다.',
  SUBSCRIPTION_409_NOT_CANCELLABLE: '해지할 수 있는 구독이 없습니다.',
  PAYMENT_402_REJECTED:
    '카드사에서 결제를 거절했습니다. 카드 상태를 확인하거나 다른 카드로 시도해주세요.',
  SUBSCRIPTION_REFUND_409_NOT_ALLOWED:
    '환불할 수 없는 결제입니다. 결제 후 7일 이내이고 유료 기능을 사용하지 않은 경우에만 환불할 수 있습니다.',
  SUBSCRIPTION_REFUND_409_DUPLICATE: '이미 환불을 신청했습니다.',

  /* 크레딧 */
  CREDIT_400_INSUFFICIENT: '보유 크레딧이 부족합니다.',
  CREDIT_404: '크레딧 내역을 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.',
  CREDIT_404_TRANSACTION:
    '크레딧 내역을 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.',
  CREDIT_400_EXTEND: '연장할 수 없는 크레딧입니다.',
  CREDIT_409_EXTEND: '이미 연장한 크레딧입니다. 연장은 한 번만 할 수 있습니다.',
  CREDIT_PRODUCT_404:
    '선택한 크레딧 상품을 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.',
  CREDIT_PRODUCT_409: '지금은 구매할 수 없는 크레딧 상품입니다.',
  CREDIT_402_REJECTED:
    '카드사에서 결제를 거절했습니다. 카드 상태를 확인하거나 다른 카드로 시도해주세요.',
  CREDIT_REFUND_409_NOT_ALLOWED:
    '환불할 수 없는 크레딧입니다. 결제 후 7일 이내이고 지급분을 사용하지 않은 경우에만 환불할 수 있습니다.',
  CREDIT_REFUND_409_DUPLICATE: '이미 환불을 신청했습니다.',

  /* 증빙 서류 */
  PAYMENT_404_ORDER:
    '결제 내역을 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.',
  PAYMENT_404: '결제 내역을 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.',
  PAYMENT_404_BUSINESS_INFO:
    '사업자 정보를 저장하지 못했습니다. 입력한 내용을 확인하고 다시 시도해주세요.',
  PAYMENT_400_TAX_INVOICE:
    '결제가 완료된 내역만 세금계산서를 신청할 수 있습니다.',
  PAYMENT_409_TAX_INVOICE:
    '이미 증빙 서류를 신청한 결제입니다. 세금계산서와 현금영수증은 둘 중 하나만 발행할 수 있습니다.',
  PAYMENT_503_TAX_INVOICE:
    '지금은 세금계산서를 발행할 수 없습니다. 고객센터로 문의해주세요.',
  PAYMENT_404_TAX_INVOICE: '세금계산서 신청 내역을 찾을 수 없습니다.',
  PAYMENT_400_CASH_RECEIPT:
    '결제가 완료된 내역만 현금영수증을 신청할 수 있습니다.',
  PAYMENT_409_CASH_RECEIPT:
    '이미 증빙 서류를 신청한 결제입니다. 세금계산서와 현금영수증은 둘 중 하나만 발행할 수 있습니다.',
  PAYMENT_404_CASH_RECEIPT: '현금영수증 신청 내역을 찾을 수 없습니다.',
}

/* 포트원 SDK가 돌려주는 message는 "[V023] 신용카드 본인인증은 계약되지 않은
 * 인증방법입니다" 같은 PG 내부 문구라 그대로 노출하면 안 된다.
 * 사용자가 조치할 수 있는 코드만 문구를 정해두고 나머지는 기본 문구로 보낸다. */
const MESSAGE_BY_PORTONE_CODE: Record<string, string> = {
  PAYMENT_CANCELLED: '결제를 취소했습니다.',
  CUSTOMER_INFO_MISSING: '이름, 휴대폰 번호, 이메일을 모두 입력해주세요.',
  FAILURE_TYPE_PG_PROVIDER:
    '카드사에서 결제를 거절했습니다. 카드 상태를 확인하거나 다른 카드로 시도해주세요.',
  /* 아래 둘은 포트원 코드가 아니라 모바일 결제창 복귀 처리가 만든다 */
  REDIRECT_RESULT_UNKNOWN:
    '결제창 결과를 확인하지 못했습니다. 결제수단 관리에서 카드가 등록됐는지 확인해주세요.',
  BILLING_INTENT_EXPIRED:
    '결제 진행 시간이 지났습니다. 처음부터 다시 시도해주세요.',
}

/* 크레딧은 서버가 결제 결과를 직접 확정한다. 화면에서 확인이 늦어졌다고
 * "구매하지 못했다"고 하면 사용자가 다시 결제해 이중 결제가 난다. */
export const CREDIT_CONFIRM_PENDING_MESSAGE =
  '결제는 접수되었습니다. 크레딧 반영까지 잠시 걸릴 수 있어요.'

function getErrorCode(error: unknown) {
  if (isAxiosError(error)) {
    const code = error.response?.data?.error?.code
    if (typeof code === 'string') return code
  }
  return null
}

/* 사용자에게 보여줄 한 문장을 만든다. 원문은 지원 문의 때 필요하므로
 * 콘솔에만 남기고 화면에는 올리지 않는다. */
export function getBillingErrorMessage(error: unknown, action: BillingAction) {
  const fallback = ACTION_FALLBACKS[action] + RETRY_SUFFIX

  if (error instanceof CreditPurchaseStatusError) {
    return error.code === 'CREDIT_PURCHASE_PENDING'
      ? CREDIT_CONFIRM_PENDING_MESSAGE
      : '크레딧 결제에 실패했습니다. 결제수단을 확인해주세요.'
  }

  if (error instanceof PortOnePaymentError) {
    const known = MESSAGE_BY_PORTONE_CODE[error.code]
    if (known) return known

    console.error(`[portone:${error.code}] ${error.message}`)
    return ACTION_FALLBACKS[action] + RETRY_SUFFIX
  }

  const code = getErrorCode(error)
  if (code) {
    const known = MESSAGE_BY_CODE[code]
    if (known) return known

    console.error(`[billing:${code}]`, error)
  }

  return fallback
}
