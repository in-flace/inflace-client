import { isAxiosError } from 'axios'

import { axiosInstance } from '@/shared/api'
import type { ApiResponse } from '@/shared/api/types'
import type {
  BillingHistoryPage,
  BillingHistoryStatus,
  BillingHistoryType,
  BillingPlan,
  BillingPlanCode,
  BillingSummary,
  CancelSubscriptionPayload,
  ChangeBillingMethodPayload,
  CreditBatch,
  CreditBatchActionPayload,
  CreditPurchaseOption,
  PurchaseCreditsPayload,
  RegisterBillingMethodPayload,
  PlanUnavailableReason,
  StartSubscriptionPayload,
  Subscription,
} from '../types'

interface IdempotentMutation<TPayload> {
  idempotencyKey: string
  payload: TPayload
}

type UserCreditStatus = 'ACTIVE' | 'EXHAUSTED' | 'EXPIRED' | 'REVOKED'
type CreditTransactionType =
  'GRANT' | 'USE' | 'RESTORE' | 'EXTEND' | 'EXPIRE' | 'REVOKE'
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED'
type OrderStatus = 'PENDING' | 'COMPLETED' | 'FAILED'

interface UserCreditBatchDto {
  userCreditId: number
  productName: string
  initialAmount: number
  remainingAmount: number
  status: UserCreditStatus
  grantedAt: string
  expiresAt: string | null
}

interface PaymentHistoryDto {
  paymentId: number | null
  refundId: number | null
  orderId: number
  type: BillingHistoryType
  description: string
  amount: number
  status: BillingHistoryStatus
  statusLabel: string
  occurredAt: string
}

interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

interface SubscriptionPlanDto {
  code: BillingPlanCode
  name: string
  price: number
  billingPeriod: string
  available: boolean
  /* 구매 가능한 경우 응답에서 제외된다(@JsonInclude NON_NULL) */
  unavailableReason?: PlanUnavailableReason
}

interface SubscriptionPlansResponse {
  plans: SubscriptionPlanDto[]
}

interface GetUserCreditsResponse {
  totalRemaining: number
  batches: UserCreditBatchDto[]
}

interface CreditProductDto {
  code: string
  name: string
  creditAmount: number
  price: number
  unitPrice: number
  validityDays: number
}

interface GetCreditProductsResponse {
  products: CreditProductDto[]
}

interface CreditTransactionDto {
  creditTransactionId: number
  userCreditId: number
  transactionType: CreditTransactionType
  amount: number
  createdAt: string
}

interface GetCreditTransactionsResponse {
  transactions: CreditTransactionDto[]
}

interface CreditPurchaseResponse {
  orderId: number
  status: PaymentStatus
}

interface CreditPurchaseStatusResponse {
  orderId: number
  orderStatus: OrderStatus
  paymentStatus: PaymentStatus
}

type SubscriptionViewStatus =
  | 'FREE'
  | 'PAYMENT_PENDING'
  | 'ACTIVE'
  | 'CANCEL_SCHEDULED'
  | 'PAYMENT_FAILED'
  | 'PAST_DUE'

type ServerSubscriptionStatus = 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'ENDED'

interface SubscriptionDetailsDto {
  planCode: 'PRO' | 'EARLY_BIRD'
  planName: string
  subscribedPrice: number
  status: ServerSubscriptionStatus
  paymentStatus: PaymentStatus
  startedAt: string
  endedAt: string | null
  nextBillingAt: string | null
  cancelAtPeriodEnd: boolean
}

interface SubscriptionOverviewResponse {
  viewStatus: SubscriptionViewStatus
  subscription: SubscriptionDetailsDto | null
}

interface SubscriptionPaymentResponse {
  orderId: number
  status: PaymentStatus
}

interface SubscriptionPaymentStatusResponse {
  orderId: number
  viewStatus: SubscriptionViewStatus
  paymentStatus: PaymentStatus
  subscriptionStatus: ServerSubscriptionStatus
}

interface PaymentMethodResponse {
  paymentMethodId: number
  methodType: string
  cardIssuer: string
  maskedCardNumber: string
  issuedAt: string
}

const CREDIT_PURCHASE_POLL_INTERVAL_MS = 1500
const CREDIT_PURCHASE_MAX_POLL_COUNT = 20
const SUBSCRIPTION_PAYMENT_MAX_POLL_COUNT = 20

const CREDIT_OPTION_PRESENTATION: Record<
  string,
  Pick<CreditPurchaseOption, 'originalPrice' | 'badge'>
> = {
  CREDIT_10: { originalPrice: 4600 },
  CREDIT_30: { originalPrice: 11700, badge: '15% 할인' },
  CREDIT_100: { originalPrice: 39000, badge: '36% 할인' },
}

function idempotencyHeaders(idempotencyKey: string) {
  return {
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
  }
}

function toDate(value: string) {
  return value.slice(0, 10)
}

function toNullableDate(value: string | null) {
  return value ? toDate(value) : null
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function findProductForBatch(
  batch: UserCreditBatchDto,
  products: CreditProductDto[]
) {
  return products.find((product) => product.name === batch.productName)
}

function toCreditOptions(products: CreditProductDto[]): CreditPurchaseOption[] {
  return products.map((product) => {
    const presentation = CREDIT_OPTION_PRESENTATION[product.code]

    return {
      id: product.code,
      credits: product.creditAmount,
      price: product.price,
      pricePerCredit: product.unitPrice,
      ...presentation,
    }
  })
}

function toCreditBatches(
  credits: GetUserCreditsResponse,
  products: CreditProductDto[],
  transactions: CreditTransactionDto[]
): CreditBatch[] {
  const extensionByBatchId = new Map<number, string>()
  const refundByBatchId = new Map<number, string>()

  for (const transaction of transactions) {
    const transactionDate = toDate(transaction.createdAt)
    if (transaction.transactionType === 'EXTEND') {
      extensionByBatchId.set(transaction.userCreditId, transactionDate)
    }
    if (transaction.transactionType === 'REVOKE') {
      refundByBatchId.set(transaction.userCreditId, transactionDate)
    }
  }

  return credits.batches.map((batch) => {
    const product = findProductForBatch(batch, products)
    const isPurchasedCredit = !!product
    const usedCredits = Math.max(batch.initialAmount - batch.remainingAmount, 0)
    const extendedAt = extensionByBatchId.get(batch.userCreditId) ?? null
    const refundedAt = refundByBatchId.get(batch.userCreditId) ?? null

    return {
      id: String(batch.userCreditId),
      paymentDate: toDate(batch.grantedAt),
      expiryDate: toNullableDate(batch.expiresAt),
      type: isPurchasedCredit ? 'purchase' : 'subscription',
      purchasedCredits: batch.initialAmount,
      usedCredits,
      purchaseAmount: product?.price ?? 0,
      extendable:
        isPurchasedCredit &&
        batch.status === 'ACTIVE' &&
        !!batch.expiresAt &&
        !extendedAt,
      refundable: false,
      extendedAt,
      refundedAt,
    }
  })
}

function toSubscription(overview: SubscriptionOverviewResponse): Subscription {
  const details = overview.subscription
  if (!details || overview.viewStatus === 'FREE') {
    return {
      status: 'none',
      planCode: null,
      planName: null,
      monthlyPrice: 0,
      nextPaymentDate: null,
      cancelScheduledDate: null,
      paymentFailedReason: null,
      includedMonthlyCredits: 0,
    }
  }

  const statusByView = {
    PAYMENT_PENDING: 'paymentPending',
    ACTIVE: 'active',
    CANCEL_SCHEDULED: 'cancelScheduled',
    PAYMENT_FAILED: 'paymentFailed',
    PAST_DUE: 'paymentFailed',
  } as const
  const status = statusByView[overview.viewStatus]

  return {
    status,
    planCode: details.planCode,
    planName: details.planName,
    monthlyPrice: details.subscribedPrice,
    nextPaymentDate: toNullableDate(details.nextBillingAt),
    cancelScheduledDate: details.cancelAtPeriodEnd
      ? toNullableDate(details.nextBillingAt ?? details.endedAt)
      : null,
    paymentFailedReason:
      status === 'paymentFailed' ? '등록된 결제수단을 확인해주세요.' : null,
    includedMonthlyCredits: 3,
  }
}

function toBillingMethod(paymentMethod: PaymentMethodResponse | null) {
  if (!paymentMethod) {
    return {
      status: 'none' as const,
      id: null,
      brand: null,
      last4: null,
      updatedAt: null,
    }
  }

  const digits = paymentMethod.maskedCardNumber.replace(/\D/g, '')
  return {
    status: 'registered' as const,
    id: String(paymentMethod.paymentMethodId),
    brand: paymentMethod.cardIssuer,
    last4: digits.slice(-4) || paymentMethod.maskedCardNumber.slice(-4),
    updatedAt: toDate(paymentMethod.issuedAt),
  }
}

/* 서버 SubscriptionPlansResponse는 code·name·price·available만 준다.
 * 설명과 혜택 목록은 마케팅 문구라 서버에 없으므로 코드별로 여기서 붙인다. */
const PLAN_COPY: Record<
  BillingPlanCode,
  { description: string; features: string[] }
> = {
  PRO: {
    description: '모든 인플루언서 검색 기능을 제한 없이 사용합니다.',
    features: [
      '인플루언서 검색 탭 내 모든 기능 무제한',
      '경쟁 채널 분석이 가능한 3 크레딧 무료 제공',
    ],
  },
  EARLY_BIRD: {
    description: '초기 고객을 위한 월 구독 할인 플랜입니다.',
    features: [
      '인플루언서 검색 탭 내 모든 기능 무제한',
      '경쟁 채널 분석이 가능한 3 크레딧 무료 제공',
    ],
  },
}

function toPlans(plans: SubscriptionPlanDto[]): BillingPlan[] {
  /* 할인 표기는 정상가(PRO) 대비로 계산한다. 서버 가격이 바뀌어도
   * 취소선 금액과 할인율이 따라가도록 하드코딩하지 않는다. */
  const listPrice = plans.find((plan) => plan.code === 'PRO')?.price ?? null

  return plans.map((plan) => {
    const isDiscounted =
      plan.code !== 'PRO' && listPrice !== null && listPrice > plan.price
    const discountRate = isDiscounted
      ? Math.round((1 - plan.price / listPrice) * 100)
      : null

    return {
      code: plan.code,
      name: plan.name,
      price: plan.price,
      originalPrice: isDiscounted ? listPrice : undefined,
      badge:
        discountRate !== null
          ? `기간한정 ${discountRate}% 할인, 곧 종료!`
          : undefined,
      available: plan.available,
      unavailableReason: plan.unavailableReason ?? null,
      ...PLAN_COPY[plan.code],
    }
  })
}

function composeBillingSummary({
  plans,
  credits,
  products,
  transactions,
  subscription,
  paymentMethod,
}: {
  plans: SubscriptionPlansResponse
  credits: GetUserCreditsResponse
  products: GetCreditProductsResponse
  transactions: GetCreditTransactionsResponse
  subscription: SubscriptionOverviewResponse
  paymentMethod: PaymentMethodResponse | null
}): BillingSummary {
  const creditOptions = toCreditOptions(products.products)
  const creditBatches = toCreditBatches(
    credits,
    products.products,
    transactions.transactions
  )

  return {
    plans: toPlans(plans.plans),
    subscription: toSubscription(subscription),
    billingMethod: toBillingMethod(paymentMethod),
    creditOptions,
    creditBatches,
  }
}

async function fetchActivePaymentMethod() {
  try {
    const response = await axiosInstance.get<
      ApiResponse<PaymentMethodResponse>
    >('/payment-methods/active')
    return response.data.responseDto
  } catch (error) {
    if (
      isAxiosError<ApiResponse<never>>(error) &&
      error.response?.data.error?.code === 'PAYMENT_METHOD_404'
    ) {
      return null
    }
    throw error
  }
}

async function fetchCreditPurchaseStatus(orderId: number) {
  const response = await axiosInstance.get<
    ApiResponse<CreditPurchaseStatusResponse>
  >(`/credit-purchases/${orderId}/payment-status`)

  return response.data.responseDto
}

async function waitForCreditPurchase(orderId: number) {
  for (
    let attempt = 0;
    attempt < CREDIT_PURCHASE_MAX_POLL_COUNT;
    attempt += 1
  ) {
    const status = await fetchCreditPurchaseStatus(orderId)

    if (status.paymentStatus === 'PAID') {
      return status
    }

    if (status.paymentStatus === 'FAILED' || status.orderStatus === 'FAILED') {
      throw new Error('크레딧 결제에 실패했습니다. 결제수단을 확인해주세요.')
    }

    if (attempt < CREDIT_PURCHASE_MAX_POLL_COUNT - 1) {
      await delay(CREDIT_PURCHASE_POLL_INTERVAL_MS)
    }
  }

  throw new Error('결제 확인이 지연되고 있습니다. 잠시 후 다시 확인해주세요.')
}

export const PAYMENT_HISTORY_PAGE_SIZE = 10

/* 결제·환불 내역은 서버가 구독 결제·크레딧 구매·환불을 한 곳에 모아
 * 페이지 단위로 준다. 크레딧 거래에서 만들어 쓰던 이전 방식은 구독 결제가
 * 빠져 있었다. */
export async function fetchPaymentHistory(
  page: number
): Promise<BillingHistoryPage> {
  const response = await axiosInstance.get<
    ApiResponse<PageResponse<PaymentHistoryDto>>
  >('/payment-history', {
    params: { page, size: PAYMENT_HISTORY_PAGE_SIZE },
  })

  const data = response.data.responseDto

  return {
    items: data.content.map((item) => ({
      /* 결제 건과 환불 건이 같은 orderId를 공유하므로 둘을 합쳐 키를 만든다. */
      id: `${item.orderId}-${item.refundId ?? item.paymentId ?? 'unknown'}`,
      orderId: item.orderId,
      date: toDate(item.occurredAt),
      title: item.description,
      type: item.type,
      amount: item.amount,
      status: item.status,
      statusLabel: item.statusLabel,
    })),
    totalElements: data.totalElements,
    totalPages: data.totalPages,
    page: data.number,
    first: data.first,
    last: data.last,
  }
}

export async function fetchBillingSummary(): Promise<BillingSummary> {
  const [
    plansResponse,
    creditsResponse,
    productsResponse,
    transactionsResponse,
    subscriptionResponse,
    paymentMethod,
  ] = await Promise.all([
    axiosInstance.get<ApiResponse<SubscriptionPlansResponse>>(
      '/subscriptions/plans'
    ),
    axiosInstance.get<ApiResponse<GetUserCreditsResponse>>('/credits'),
    axiosInstance.get<ApiResponse<GetCreditProductsResponse>>(
      '/credit-products'
    ),
    axiosInstance.get<ApiResponse<GetCreditTransactionsResponse>>(
      '/credits/transactions'
    ),
    axiosInstance.get<ApiResponse<SubscriptionOverviewResponse>>(
      '/subscriptions/me'
    ),
    fetchActivePaymentMethod(),
  ])

  return composeBillingSummary({
    plans: plansResponse.data.responseDto,
    credits: creditsResponse.data.responseDto,
    products: productsResponse.data.responseDto,
    transactions: transactionsResponse.data.responseDto,
    subscription: subscriptionResponse.data.responseDto,
    paymentMethod,
  })
}

async function waitForSubscriptionPayment(orderId: number) {
  for (
    let attempt = 0;
    attempt < SUBSCRIPTION_PAYMENT_MAX_POLL_COUNT;
    attempt += 1
  ) {
    const response = await axiosInstance.get<
      ApiResponse<SubscriptionPaymentStatusResponse>
    >(`/subscriptions/orders/${orderId}/payment-status`)
    const status = response.data.responseDto

    if (status.paymentStatus === 'PAID' && status.viewStatus === 'ACTIVE') {
      return status
    }
    if (
      status.paymentStatus === 'FAILED' ||
      status.viewStatus === 'PAYMENT_FAILED' ||
      status.viewStatus === 'PAST_DUE'
    ) {
      throw new Error('구독 결제에 실패했습니다. 결제수단을 확인해주세요.')
    }
    if (attempt < SUBSCRIPTION_PAYMENT_MAX_POLL_COUNT - 1) {
      await delay(CREDIT_PURCHASE_POLL_INTERVAL_MS)
    }
  }

  throw new Error(
    '구독 결제 확인이 지연되고 있습니다. 잠시 후 다시 확인해주세요.'
  )
}

export async function startSubscription(
  request: IdempotentMutation<StartSubscriptionPayload>
): Promise<BillingSummary> {
  const response = await axiosInstance.post<
    ApiResponse<SubscriptionPaymentResponse>
  >(
    '/subscriptions',
    request.payload,
    idempotencyHeaders(request.idempotencyKey)
  )
  await waitForSubscriptionPayment(response.data.responseDto.orderId)
  return fetchBillingSummary()
}

export async function cancelSubscription(
  payload: CancelSubscriptionPayload
): Promise<BillingSummary> {
  if (!payload.reason) {
    throw new Error('해지 사유를 선택해주세요.')
  }
  /* 서버 SubscriptionCancellationRequest가 사유까지 받는다.
   * 이 값을 빼면 해지 사유 집계가 비어버린다. */
  await axiosInstance.patch<ApiResponse<null>>('/subscriptions/me', {
    cancelAtPeriodEnd: true,
    reason: payload.reason,
    reasonDetail: payload.reasonDetail,
  })
  return fetchBillingSummary()
}

export async function resumeSubscription(): Promise<BillingSummary> {
  await axiosInstance.patch<ApiResponse<null>>('/subscriptions/me', {
    cancelAtPeriodEnd: false,
  })
  return fetchBillingSummary()
}

export async function registerBillingMethod(
  request: IdempotentMutation<RegisterBillingMethodPayload>
): Promise<BillingSummary> {
  await axiosInstance.post<ApiResponse<PaymentMethodResponse>>(
    '/payment-methods',
    request.payload,
    idempotencyHeaders(request.idempotencyKey)
  )
  return fetchBillingSummary()
}

export async function changeBillingMethod(
  payload: ChangeBillingMethodPayload
): Promise<BillingSummary> {
  await axiosInstance.patch<ApiResponse<PaymentMethodResponse>>(
    '/payment-methods/active',
    payload
  )
  return fetchBillingSummary()
}

/* 디자인상 별도 입력 폼 없이 행을 고르고 바로 신청한다.
 * 서버도 orderId만 받는다(POST /payment-history/{orderId}/tax-invoice). */
export async function requestTaxInvoice(orderId: number): Promise<void> {
  await axiosInstance.post<ApiResponse<unknown>>(
    `/payment-history/${orderId}/tax-invoice`
  )
}

export async function deleteBillingMethod(): Promise<BillingSummary> {
  await axiosInstance.delete<ApiResponse<null>>('/payment-methods/active')
  return fetchBillingSummary()
}

export async function purchaseCredits(
  request: IdempotentMutation<PurchaseCreditsPayload>
): Promise<BillingSummary> {
  if (request.payload.paymentMethod !== 'registeredCard') {
    throw new Error('현재는 등록된 결제수단으로만 크레딧을 구매할 수 있습니다.')
  }

  const response = await axiosInstance.post<
    ApiResponse<CreditPurchaseResponse>
  >(
    '/credit-purchases',
    { productCode: request.payload.optionId },
    idempotencyHeaders(request.idempotencyKey)
  )

  await waitForCreditPurchase(response.data.responseDto.orderId)
  return fetchBillingSummary()
}

export async function extendCreditBatch(
  payload: CreditBatchActionPayload
): Promise<BillingSummary> {
  await axiosInstance.post<
    ApiResponse<{ userCreditId: number; expiresAt: string }>
  >(`/credits/${payload.batchId}/extension`)

  return fetchBillingSummary()
}
