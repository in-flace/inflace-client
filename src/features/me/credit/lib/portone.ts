type PortOneConfig = {
  storeId: string
  channelKey: string
}

type IssueBillingKeyParams = {
  issueName: string
  displayAmount?: number
}

type RequestOneTimePaymentParams = {
  orderName: string
  totalAmount: number
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

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export async function issueCardBillingKey({
  issueName,
  displayAmount,
}: IssueBillingKeyParams): Promise<BillingKeyIssueResult> {
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
    issueId: createId('billing'),
    issueName,
    displayAmount,
    currency: displayAmount ? 'KRW' : undefined,
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
}: RequestOneTimePaymentParams): Promise<OneTimePaymentResult> {
  const paymentId = createId('payment')

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
