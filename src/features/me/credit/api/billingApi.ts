import { mockBillingSummary } from '@/features/me/credit/mock/mockBilling'
import { axiosInstance } from '@/shared/api'
import type { ApiResponse } from '@/shared/api/types'
import type {
  BillingHistoryItem,
  BillingHistoryStatus,
  BillingHistoryType,
  BillingSummary,
  CancelSubscriptionPayload,
  CreditBatch,
  CreditBatchActionPayload,
  CreditPurchaseOption,
  PurchaseCreditsPayload,
  RegisterBillingMethodPayload,
  StartSubscriptionPayload,
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

const CREDIT_PURCHASE_POLL_INTERVAL_MS = 1500
const CREDIT_PURCHASE_MAX_POLL_COUNT = 20

function idempotencyHeaders(idempotencyKey: string) {
  return {
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
  }
}

function toDate(value: string | null | undefined) {
  return value?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function findProductForBatch(
  batch: UserCreditBatchDto,
  products: CreditProductDto[]
) {
  return products.find(
    (product) =>
      product.name === batch.productName ||
      product.creditAmount === batch.initialAmount
  )
}

function toCreditOptions(products: CreditProductDto[]): CreditPurchaseOption[] {
  return products.map((product) => ({
    id: product.code,
    credits: product.creditAmount,
    price: product.price,
    pricePerCredit: product.unitPrice,
  }))
}

function toCreditBatches(
  credits: GetUserCreditsResponse,
  products: CreditProductDto[]
): CreditBatch[] {
  return credits.batches.map((batch) => {
    const product = findProductForBatch(batch, products)
    const isPurchasedCredit = !!product
    const usedCredits = Math.max(batch.initialAmount - batch.remainingAmount, 0)

    return {
      id: String(batch.userCreditId),
      paymentDate: toDate(batch.grantedAt),
      expiryDate: toDate(batch.expiresAt),
      type: isPurchasedCredit ? 'purchase' : 'subscription',
      purchasedCredits: batch.initialAmount,
      usedCredits,
      purchaseAmount: product?.price ?? 0,
      extendable:
        isPurchasedCredit && batch.status === 'ACTIVE' && !!batch.expiresAt,
      refundable: false,
      extendedAt: null,
      refundedAt: null,
    }
  })
}

function getTransactionHistoryMeta(transactionType: CreditTransactionType): {
  type: BillingHistoryType
  status: BillingHistoryStatus
  title: (amount: number) => string
} {
  switch (transactionType) {
    case 'GRANT':
      return {
        type: 'creditPurchase',
        status: 'paid',
        title: (amount) => `크레딧 ${Math.abs(amount)}개 적립`,
      }
    case 'RESTORE':
      return {
        type: 'creditRestore',
        status: 'completed',
        title: (amount) => `크레딧 ${Math.abs(amount)}개 복원`,
      }
    case 'EXTEND':
      return {
        type: 'creditExtension',
        status: 'completed',
        title: () => '크레딧 유효기간 연장',
      }
    case 'EXPIRE':
      return {
        type: 'creditExpiration',
        status: 'completed',
        title: (amount) => `크레딧 ${Math.abs(amount)}개 만료`,
      }
    case 'REVOKE':
      return {
        type: 'creditRefund',
        status: 'refunded',
        title: (amount) => `크레딧 ${Math.abs(amount)}개 회수`,
      }
    case 'USE':
      return {
        type: 'creditUsage',
        status: 'completed',
        title: (amount) => `크레딧 ${Math.abs(amount)}개 사용`,
      }
  }
}

function toCreditHistory(
  transactions: CreditTransactionDto[],
  batches: CreditBatch[]
): BillingHistoryItem[] {
  const batchById = new Map(batches.map((batch) => [batch.id, batch]))

  return transactions.map((transaction) => {
    const meta = getTransactionHistoryMeta(transaction.transactionType)
    const batch = batchById.get(String(transaction.userCreditId))
    const isGrant = transaction.transactionType === 'GRANT'

    return {
      id: String(transaction.creditTransactionId),
      date: toDate(transaction.createdAt),
      title: meta.title(transaction.amount),
      type: meta.type,
      amount: isGrant ? (batch?.purchaseAmount ?? 0) : 0,
      status: meta.status,
      receiptAvailable: isGrant && !!batch?.purchaseAmount,
      taxInvoiceAvailable: isGrant && !!batch?.purchaseAmount,
    }
  })
}

function composeBillingSummary({
  credits,
  products,
  transactions,
}: {
  credits: GetUserCreditsResponse
  products: GetCreditProductsResponse
  transactions: GetCreditTransactionsResponse
}): BillingSummary {
  const creditOptions = toCreditOptions(products.products)
  const creditBatches = toCreditBatches(credits, products.products)

  return {
    ...mockBillingSummary,
    creditOptions,
    creditBatches,
    history: toCreditHistory(transactions.transactions, creditBatches),
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

    await delay(CREDIT_PURCHASE_POLL_INTERVAL_MS)
  }

  throw new Error('결제 확인이 지연되고 있습니다. 잠시 후 다시 확인해주세요.')
}

export async function fetchBillingSummary(): Promise<BillingSummary> {
  const [creditsResponse, productsResponse, transactionsResponse] =
    await Promise.all([
      axiosInstance.get<ApiResponse<GetUserCreditsResponse>>('/credits'),
      axiosInstance.get<ApiResponse<GetCreditProductsResponse>>(
        '/credit-products'
      ),
      axiosInstance.get<ApiResponse<GetCreditTransactionsResponse>>(
        '/credits/transactions'
      ),
    ])

  return composeBillingSummary({
    credits: creditsResponse.data.responseDto,
    products: productsResponse.data.responseDto,
    transactions: transactionsResponse.data.responseDto,
  })
}

export async function startSubscription(
  request: IdempotentMutation<StartSubscriptionPayload>
): Promise<BillingSummary> {
  const response = await axiosInstance.post<ApiResponse<BillingSummary>>(
    '/billing/subscription',
    request.payload,
    idempotencyHeaders(request.idempotencyKey)
  )
  return response.data.responseDto
}

export async function cancelSubscription(
  payload: CancelSubscriptionPayload
): Promise<BillingSummary> {
  const response = await axiosInstance.post<ApiResponse<BillingSummary>>(
    '/billing/subscription/cancel',
    payload
  )
  return response.data.responseDto
}

export async function retrySubscriptionPayment(): Promise<BillingSummary> {
  const response = await axiosInstance.post<ApiResponse<BillingSummary>>(
    '/billing/subscription/retry'
  )
  return response.data.responseDto
}

export async function registerBillingMethod(
  request: IdempotentMutation<RegisterBillingMethodPayload>
): Promise<BillingSummary> {
  const response = await axiosInstance.post<ApiResponse<BillingSummary>>(
    '/billing/method',
    request.payload,
    idempotencyHeaders(request.idempotencyKey)
  )
  return response.data.responseDto
}

export async function deleteBillingMethod(): Promise<BillingSummary> {
  const response =
    await axiosInstance.delete<ApiResponse<BillingSummary>>('/billing/method')
  return response.data.responseDto
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

export async function refundCreditBatch(
  payload: CreditBatchActionPayload
): Promise<BillingSummary> {
  const response = await axiosInstance.post<ApiResponse<BillingSummary>>(
    `/billing/credits/${payload.batchId}/refund`
  )
  return response.data.responseDto
}
