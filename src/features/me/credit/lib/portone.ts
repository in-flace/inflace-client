type PortOneConfig = {
  storeId: string
  channelKey: string
}

/* 포트원 요청의 customer 블록. 연동한 PG 채널이 이 세 필드를 필수로 요구하며,
 * 빠지면 결제창이 열리기도 전에 INVALID_REQUEST로 거부된다. */
export type PaymentCustomer = {
  fullName: string
  phoneNumber: string
  email: string
}

type IssueBillingKeyParams = {
  issueName: string
  displayAmount?: number
  customer: PaymentCustomer
}

type RequestOneTimePaymentParams = {
  /* 서버가 주문을 만들며 발급한 값. 프론트에서 만들면 결제창이 열리는
   * 시점에 서버가 그 주문을 모르는 상태가 된다.
   * KG이니시스 oid 제한(1~40자)을 서버 값도 지켜야 한다. */
  paymentId: string
  orderName: string
  totalAmount: number
  customer: PaymentCustomer
}

export type BillingKeyIssueResult = {
  billingKey: string
  isMock: boolean
}

export type OneTimePaymentResult = {
  paymentId: string
  isMock: boolean
}

export class PortOnePaymentError extends Error {
  constructor(
    message: string,
    readonly code: string
  ) {
    super(message)
    this.name = 'PortOnePaymentError'
  }
}

/* 정기 구독(빌링키 발급)과 일반 결제(단건)는 서로 다른 PG 계약을 쓰므로
 * 포트원 채널이 분리되어 있다. 호출하는 쪽이 자기 채널키를 넘긴다. */
function getPortOneConfig(
  channelKey: string | undefined
): PortOneConfig | null {
  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID

  if (!storeId || !channelKey) {
    return null
  }

  return { storeId, channelKey }
}

function isMockPaymentEnabled() {
  return process.env.NEXT_PUBLIC_MOCK_ENABLED === 'true'
}

/* 모바일 결제창이 끝나고 돌아올 주소. 등록과 변경은 같은 주소로 돌아오고,
 * 어느 흐름이었는지는 결제 의도(billingIntent)가 구분한다. */
const BILLING_KEY_RETURN_PATH = '/me/credit?tab=billing-method'
const PAYMENT_RETURN_PATH = '/me/credit?tab=history'

function toReturnUrl(path: string) {
  return new URL(path, window.location.origin).toString()
}

/* 목 환경은 포트원을 건너뛰어 결제창이 즉시 끝난다. 그대로면 모바일 복귀
 * 경로가 로컬에서 한 번도 돌지 않으므로, 켜면 실제 모바일처럼 페이지를
 * 떠났다가 결과를 쿼리에 달고 돌아온다. 'fail'이면 결제창 실패로 돌아온다. */
function getMockRedirectMode(): 'success' | 'fail' | null {
  const mode = process.env.NEXT_PUBLIC_MOCK_PAYMENT_REDIRECT
  if (mode === 'true') return 'success'
  if (mode === 'fail') return 'fail'
  return null
}

const MOCK_REDIRECT_FAILURE = {
  code: 'FAILURE_TYPE_PG',
  message: '사용자가 결제를 취소하였습니다',
}

function redirectLikeMobile(
  path: string,
  params: Record<string, string>
): Promise<never> {
  const url = new URL(path, window.location.origin)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  window.location.assign(url.toString())
  /* 실제 모바일처럼 호출부가 이어지면 안 된다. resolve하면 PC 경로를 타서
   * 정작 확인하려던 복귀 처리가 돌지 않는다. */
  return new Promise<never>(() => {})
}

/* 켜면 PC에서도 결제창이 결과를 redirectUrl 쿼리로 돌려준다. 포트원 SDK
 * 본체가 CDN에서 내려와 복귀 쿼리의 실제 키 이름을 코드로 확인할 수 없어,
 * 폰 없이 관찰하려고 둔다. 운영에서는 끈다. */
function shouldForceRedirect() {
  return process.env.NEXT_PUBLIC_PORTONE_FORCE_REDIRECT === 'true'
    ? true
    : undefined
}

/* KG이니시스(INICIS_V2)는 oid를 1~40자로 제한한다. 포트원의 issueId·paymentId가
 * 그대로 oid로 넘어가는데 UUID는 하이픈까지 36자라, 접두사를 붙이면 한계를 넘어
 * 결제창이 열리지 않는다. 하이픈을 지워 32자로 줄이고 접두사도 짧게 둔다. */
export const MAX_MERCHANT_ID_LENGTH = 40

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, '')}`
}

/* 포트원이 돌려주는 원문 에러는 필드명이 영어로 노출되므로 결제창 호출 전에
 * 우리 문구로 막는다. mock 모드에서도 같은 검증을 거치게 두어야 로컬에서
 * 통과한 흐름이 실서비스에서 처음 깨지는 일을 막을 수 있다. */
function toPortOneCustomer(customer: PaymentCustomer) {
  const fullName = customer.fullName.trim()
  /* PG사에 따라 하이픈이 섞인 번호를 거부하므로 숫자만 남긴다. */
  const phoneNumber = customer.phoneNumber.replace(/\D/g, '')
  const email = customer.email.trim()

  if (!fullName || !phoneNumber || !email) {
    throw new PortOnePaymentError(
      '이름, 전화번호, 이메일을 모두 입력해주세요.',
      'CUSTOMER_INFO_MISSING'
    )
  }

  return { fullName, phoneNumber, email }
}

export async function issueCardBillingKey({
  issueName,
  displayAmount,
  customer,
}: IssueBillingKeyParams): Promise<BillingKeyIssueResult> {
  const portOneCustomer = toPortOneCustomer(customer)

  if (isMockPaymentEnabled()) {
    const redirectMode = getMockRedirectMode()
    if (redirectMode === 'success') {
      return redirectLikeMobile(BILLING_KEY_RETURN_PATH, {
        transactionType: 'ISSUE_BILLING_KEY',
        billingKey: createId('mock-billing-key'),
      })
    }
    if (redirectMode === 'fail') {
      return redirectLikeMobile(BILLING_KEY_RETURN_PATH, {
        transactionType: 'ISSUE_BILLING_KEY',
        ...MOCK_REDIRECT_FAILURE,
      })
    }
    return {
      billingKey: createId('mock-billing-key'),
      isMock: true,
    }
  }

  const config = getPortOneConfig(
    process.env.NEXT_PUBLIC_PORTONE_BILLING_CHANNEL_KEY
  )
  if (!config) {
    throw new PortOnePaymentError(
      '포트원 결제 설정을 확인해주세요.',
      'PORTONE_CONFIG_MISSING'
    )
  }

  const PortOne = await import('@portone/browser-sdk/v2')
  const response = await PortOne.requestIssueBillingKey({
    ...config,
    billingKeyMethod: 'CARD',
    issueId: createId('bill'),
    issueName,
    displayAmount,
    currency: displayAmount ? 'KRW' : undefined,
    customer: portOneCustomer,
    /* 모바일 결제창은 서비스 제공 기간(range·interval 중 하나)을 필수로 요구한다.
     * 빠지면 AT_LEAST_ONE_REQUIRED로 창이 열리기도 전에 거부된다(QA #78).
     * 월 구독이므로 주기로 표현하고, 실제 결제 시점과 금액은 서버가 정한다. */
    offerPeriod: { interval: '1m' },
    redirectUrl: toReturnUrl(BILLING_KEY_RETURN_PATH),
    forceRedirect: shouldForceRedirect(),
  })

  if (!response) {
    throw new PortOnePaymentError(
      '카드 등록이 취소되었습니다.',
      'PAYMENT_CANCELLED'
    )
  }

  if (response.code) {
    throw new PortOnePaymentError(
      response.message ?? '카드 등록을 완료하지 못했습니다.',
      response.code
    )
  }

  if (!response.billingKey) {
    throw new PortOnePaymentError(
      '발급된 빌링키를 확인할 수 없습니다.',
      'BILLING_KEY_MISSING'
    )
  }

  return { billingKey: response.billingKey, isMock: false }
}

export async function requestOneTimeCardPayment({
  paymentId,
  orderName,
  totalAmount,
  customer,
}: RequestOneTimePaymentParams): Promise<OneTimePaymentResult> {
  const portOneCustomer = toPortOneCustomer(customer)

  if (paymentId.length > MAX_MERCHANT_ID_LENGTH) {
    throw new PortOnePaymentError(
      '결제 요청 정보가 올바르지 않습니다.',
      'PAYMENT_ID_TOO_LONG'
    )
  }

  if (isMockPaymentEnabled()) {
    const redirectMode = getMockRedirectMode()
    if (redirectMode === 'success') {
      return redirectLikeMobile(PAYMENT_RETURN_PATH, {
        transactionType: 'PAYMENT',
        paymentId,
        txId: createId('mock-tx'),
      })
    }
    if (redirectMode === 'fail') {
      return redirectLikeMobile(PAYMENT_RETURN_PATH, {
        transactionType: 'PAYMENT',
        paymentId,
        ...MOCK_REDIRECT_FAILURE,
      })
    }
    return { paymentId, isMock: true }
  }

  const config = getPortOneConfig(
    process.env.NEXT_PUBLIC_PORTONE_PAYMENT_CHANNEL_KEY
  )
  if (!config) {
    throw new PortOnePaymentError(
      '포트원 결제 설정을 확인해주세요.',
      'PORTONE_CONFIG_MISSING'
    )
  }

  const PortOne = await import('@portone/browser-sdk/v2')
  const response = await PortOne.requestPayment({
    ...config,
    paymentId,
    orderName,
    totalAmount,
    currency: 'KRW',
    payMethod: 'CARD',
    customer: portOneCustomer,
    redirectUrl: toReturnUrl(PAYMENT_RETURN_PATH),
    forceRedirect: shouldForceRedirect(),
  })

  if (!response) {
    throw new PortOnePaymentError('결제가 취소되었습니다.', 'PAYMENT_CANCELLED')
  }

  if (response.code) {
    throw new PortOnePaymentError(
      response.message ?? '결제를 완료하지 못했습니다.',
      response.code
    )
  }

  return { paymentId: response.paymentId, isMock: false }
}
