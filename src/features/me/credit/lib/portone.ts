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

function getPortOneConfig(): PortOneConfig | null {
  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID
  const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY

  if (!storeId || !channelKey) {
    return null
  }

  return { storeId, channelKey }
}

function isMockPaymentEnabled() {
  return process.env.NEXT_PUBLIC_MOCK_ENABLED === 'true'
}

/* KG이니시스(INICIS_V2)는 oid를 1~40자로 제한한다. 포트원의 issueId·paymentId가
 * 그대로 oid로 넘어가는데 UUID는 하이픈까지 36자라, 접두사를 붙이면 한계를 넘어
 * 결제창이 열리지 않는다. 하이픈을 지워 32자로 줄이고 접두사도 짧게 둔다. */
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
    return {
      billingKey: createId('mock-billing-key'),
      isMock: true,
    }
  }

  const config = getPortOneConfig()
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
    redirectUrl: new URL(
      '/me/credit?tab=billing-method',
      window.location.origin
    ).toString(),
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
  orderName,
  totalAmount,
  customer,
}: RequestOneTimePaymentParams): Promise<OneTimePaymentResult> {
  const paymentId = createId('pay')
  const portOneCustomer = toPortOneCustomer(customer)

  if (isMockPaymentEnabled()) {
    return { paymentId, isMock: true }
  }

  const config = getPortOneConfig()
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
    redirectUrl: new URL(
      '/me/credit?tab=history',
      window.location.origin
    ).toString(),
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
