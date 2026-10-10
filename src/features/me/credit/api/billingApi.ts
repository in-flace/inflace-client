import { isAxiosError } from 'axios'

import { axiosInstance } from '@/shared/api'
import type { ApiResponse } from '@/shared/api/types'
import type {
  BillingHistoryPage,
  BusinessInfo,
  CashReceiptType,
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
  orderId: number | null
  productName: string
  initialAmount: number
  remainingAmount: number
  status: UserCreditStatus
  grantedAt: string
  expiresAt: string | null
}

/* POST /credit-purchases/checkout 응답.
 * 결제창에 넘길 paymentId·주문명·금액을 서버가 정해서 주므로 프론트가
 * 따로 계산하지 않는다. 폴링은 orderId로 한다. */
interface CreditCheckoutResponse {
  orderId: number
  paymentId: string
  orderName: string
  amount: number
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
      orderId: batch.orderId,
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
      /* 서버 규칙(CreditRefundTransactionService)을 따른다. 구매분이고,
       * 결제 후 7일 이내이며, 아직 환불되지 않은 배치만 신청할 수 있다.
       * 사용 여부 등 나머지 조건은 서버가 최종 판정한다. */
      /* 서버는 구독으로 매월 지급한 배치에도 구독 주문 번호를 붙여 준다.
       * 주문 번호만 보고 열면 그 주문으로 환불을 요청해 PAYMENT_404가 난다. */
      refundable:
        isPurchasedCredit &&
        batch.orderId !== null &&
        refundedAt === null &&
        isWithinRefundPeriod(batch.grantedAt),
      extendedAt,
      refundedAt,
    }
  })
}

/* 서버 CreditRefundTransactionService.REFUNDABLE_DAYS와 같은 값. */
const CREDIT_REFUNDABLE_DAYS = 7

function isWithinRefundPeriod(grantedAt: string) {
  const paidAt = new Date(grantedAt).getTime()
  if (Number.isNaN(paidAt)) return false
  return Date.now() - paidAt <= CREDIT_REFUNDABLE_DAYS * 24 * 60 * 60 * 1000
}

function toSubscription(overview: SubscriptionOverviewResponse): Subscription {
  const details = overview.subscription
  if (!details || overview.viewStatus === 'FREE') {
    return {
      status: 'none',
      planCode: null,
      planName: null,
      monthlyPrice: 0,
      startedAt: null,
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
    startedAt: toNullableDate(details.startedAt),
    nextPaymentDate: toNullableDate(details.nextBillingAt),
    cancelScheduledDate: details.cancelAtPeriodEnd
      ? toNullableDate(details.nextBillingAt ?? details.endedAt)
      : null,
    /* 시안 문구에는 승인 실패 일자가 들어가지만 서버가 그 값을 주지 않아
     * 날짜 없이 안내한다. */
    paymentFailedReason:
      status === 'paymentFailed'
        ? '결제수단 관리에서 다시 한번 확인해주세요.'
        : null,
    includedMonthlyCredits: 3,
  }
}

/* 서버는 포트원의 카드 발급사 코드를 그대로 준다. 화면에는 한글 이름을 쓰고,
 * 목록에 없는 값은 받은 그대로 보여준다. */
const CARD_ISSUER_LABELS: Record<string, string> = {
  KOOKMIN_CARD: 'KB국민카드',
  SHINHAN_CARD: '신한카드',
  SAMSUNG_CARD: '삼성카드',
  HYUNDAI_CARD: '현대카드',
  LOTTE_CARD: '롯데카드',
  HANA_CARD: '하나카드',
  WOORI_CARD: '우리카드',
  BC_CARD: 'BC카드',
  NH_CARD: 'NH농협카드',
  CITI_CARD: '씨티카드',
  SUHYUP_CARD: '수협카드',
  GWANGJU_CARD: '광주카드',
  JEONBUK_CARD: '전북카드',
  JEJU_CARD: '제주카드',
  KAKAO_BANK: '카카오뱅크',
  K_BANK: '케이뱅크',
  TOSS_BANK: '토스뱅크',
  KOREA_DEVELOPMENT_BANK: 'KDB산업은행',
  KFCC: '새마을금고',
  SHINHYUP: '신협',
  EPOST: '우체국',
  SAVINGS_BANK_KOREA: '저축은행',
  MIRAE_ASSET_SECURITIES: '미래에셋증권',
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

  /* 이니시스는 앞 6자리와 맨 끝 1자리만 보여준다(451842*********0). 가려진
   * 자리를 지우고 숫자만 모으면 앞자리가 끝자리처럼 섞이므로, 구분자만 빼고
   * 마지막 네 칸을 가려진 그대로 쓴다(***0). */
  const last4 = paymentMethod.maskedCardNumber.replace(/[\s-]/g, '').slice(-4)
  return {
    status: 'registered' as const,
    id: String(paymentMethod.paymentMethodId),
    brand:
      CARD_ISSUER_LABELS[paymentMethod.cardIssuer] ?? paymentMethod.cardIssuer,
    last4,
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

/* 폴링 결과는 "결제가 실패했다"와 "아직 확인되지 않았다"로 갈리고, 사용자에게
 * 줄 지시가 정반대다. 서버가 웹훅으로 결제를 확정하므로 확인이 늦을 뿐인데
 * 실패로 안내하면 사용자가 다시 결제해 이중 결제가 난다. 그래서 코드로 구분한다. */
export class CreditPurchaseStatusError extends Error {
  constructor(
    message: string,
    readonly code: 'CREDIT_PURCHASE_FAILED' | 'CREDIT_PURCHASE_PENDING'
  ) {
    super(message)
    this.name = 'CreditPurchaseStatusError'
  }
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
      throw new CreditPurchaseStatusError(
        '크레딧 결제에 실패했습니다.',
        'CREDIT_PURCHASE_FAILED'
      )
    }

    if (attempt < CREDIT_PURCHASE_MAX_POLL_COUNT - 1) {
      await delay(CREDIT_PURCHASE_POLL_INTERVAL_MS)
    }
  }

  throw new CreditPurchaseStatusError(
    '결제 확인이 지연되고 있습니다.',
    'CREDIT_PURCHASE_PENDING'
  )
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

/* 저장이 전체 교체(PUT)라 기획 폼에 없는 주소·업태·종목도 그대로 왕복시킨다.
 * 조회에서 버리면 저장할 때 빈 값으로 덮여 세금계산서 발행이 막힌다. */
interface BusinessInfoDto {
  brn: string | null
  name: string | null
  representativeName: string | null
  address: string | null
  businessType: string | null
  businessClass: string | null
  phoneNumber: string | null
  contactEmail: string | null
}

export async function fetchBusinessInfo(): Promise<BusinessInfo | null> {
  try {
    const response =
      await axiosInstance.get<ApiResponse<BusinessInfoDto>>('/business-info')
    const data = response.data.responseDto
    return {
      brn: data.brn ?? '',
      name: data.name ?? '',
      representativeName: data.representativeName ?? '',
      phoneNumber: data.phoneNumber ?? '',
      contactEmail: data.contactEmail ?? '',
      address: data.address ?? '',
      businessType: data.businessType ?? '',
      businessClass: data.businessClass ?? '',
    }
  } catch (error) {
    /* 아직 등록한 적이 없으면 404다. 빈 폼으로 시작한다. */
    if (isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw error
  }
}

/* 빈 문자열로 저장하면 서버가 "값이 있는데 비어 있는" 상태로 들고 있다가
 * 세금계산서 발행 때 포트원에 그대로 넘긴다. 선택 항목은 비었으면 빼서
 * null로 남긴다. 서버 검증은 brn \d{10}과 contactEmail @Email 둘뿐이다. */
function toBusinessInfoDto(payload: BusinessInfo) {
  const optional = (value: string) => value.trim() || undefined

  return {
    brn: payload.brn.replace(/\D/g, ''),
    contactEmail: payload.contactEmail.trim(),
    name: optional(payload.name),
    representativeName: optional(payload.representativeName),
    phoneNumber: optional(payload.phoneNumber),
    address: optional(payload.address),
    businessType: optional(payload.businessType),
    businessClass: optional(payload.businessClass),
  }
}

export async function saveBusinessInfo(payload: BusinessInfo): Promise<void> {
  await axiosInstance.put<ApiResponse<BusinessInfoDto>>(
    '/business-info',
    toBusinessInfoDto(payload)
  )
}

/* 현금영수증은 사업자 정보를 저장한 뒤 발행 유형만 보낸다. */
export async function requestCashReceipt(request: {
  orderId: number
  receiptType: CashReceiptType
}): Promise<void> {
  await axiosInstance.post<ApiResponse<unknown>>(
    `/payment-history/${request.orderId}/cash-receipt`,
    { receiptType: request.receiptType }
  )
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

/* 등록 카드 구매. 서버가 빌링키로 바로 승인하므로 결제창을 띄우지 않는다. */
export async function purchaseCredits(
  request: IdempotentMutation<PurchaseCreditsPayload>
): Promise<BillingSummary> {
  if (request.payload.paymentMethod !== 'registeredCard') {
    throw new Error('등록된 결제수단 구매에만 쓸 수 있습니다.')
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

/* 타 결제수단 구매 1단계. 주문을 만들고 결제창에 넘길 값을 받아온다.
 * 결제창 호출은 브라우저 SDK라 화면에서 이어서 한다. */
export async function checkoutCredits(
  request: IdempotentMutation<{ optionId: string }>
): Promise<CreditCheckoutResponse> {
  const response = await axiosInstance.post<
    ApiResponse<CreditCheckoutResponse>
  >(
    '/credit-purchases/checkout',
    { productCode: request.payload.optionId },
    idempotencyHeaders(request.idempotencyKey)
  )

  return response.data.responseDto
}

/* 타 결제수단 구매 2단계. 결제창을 닫고 돌아오면 서버 승인이 끝날 때까지
 * 기다린 뒤 요약을 새로 받는다. */
export async function confirmCreditCheckout(
  orderId: number
): Promise<BillingSummary> {
  await waitForCreditPurchase(orderId)
  return fetchBillingSummary()
}

/* 서버는 body 없이 orderId와 Idempotency-Key만 받는다. */
export async function refundCreditPurchase(
  request: IdempotentMutation<{ orderId: number }>
): Promise<BillingSummary> {
  await axiosInstance.post<ApiResponse<unknown>>(
    `/credit-purchases/${request.payload.orderId}/refund`,
    undefined,
    idempotencyHeaders(request.idempotencyKey)
  )
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
