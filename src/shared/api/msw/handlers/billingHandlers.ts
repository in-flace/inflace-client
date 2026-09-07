import { http, HttpResponse } from 'msw'

import { mockBillingSummary } from '@/features/me/credit/mock/mockBilling'
import type {
  BillingPlanCode,
  BillingSummary,
} from '@/features/me/credit/types'

const currentSummary: BillingSummary = structuredClone(mockBillingSummary)
let latestSubscriptionOrderId = 1

function apiResponse<T>(responseDto: T, status = 200) {
  return HttpResponse.json(
    { success: true, responseDto, error: null },
    { status }
  )
}

function errorResponse(code: string, message: string, status: number) {
  return HttpResponse.json(
    { success: false, responseDto: null, error: { code, message } },
    { status }
  )
}

function requireIdempotencyKey(request: Request) {
  return request.headers.get('Idempotency-Key')
    ? null
    : errorResponse(
        'COMMON_400_IDEMPOTENCY',
        'Idempotency-Key header is required',
        400
      )
}

function getNextPaymentDate() {
  const nextDate = new Date()
  nextDate.setMonth(nextDate.getMonth() + 1)
  return nextDate.toISOString().slice(0, 10)
}

function getPlan(planCode: BillingPlanCode) {
  return currentSummary.plans.find((plan) => plan.code === planCode)
}

function creditProductCode(credits: number) {
  return `CREDIT_${credits}`
}

function getMockCreditProducts() {
  return currentSummary.creditOptions.map((option) => ({
    code: creditProductCode(option.credits),
    name: `${option.credits}크레딧`,
    creditAmount: option.credits,
    price: option.price,
    unitPrice: option.pricePerCredit,
    validityDays: 90,
  }))
}

function getUserCreditId(batchId: string, index: number) {
  const numericId = batchId.match(/\d+$/)?.[0]
  return Number(numericId ?? index + 1)
}

function getMockUserCredits() {
  return {
    totalRemaining: currentSummary.creditBatches.reduce(
      (total, batch) =>
        total + Math.max(batch.purchasedCredits - batch.usedCredits, 0),
      0
    ),
    batches: currentSummary.creditBatches.map((batch, index) => ({
      userCreditId: getUserCreditId(batch.id, index),
      productName:
        batch.type === 'purchase'
          ? `${batch.purchasedCredits}크레딧`
          : '월 구독 지급',
      initialAmount: batch.purchasedCredits,
      remainingAmount: Math.max(batch.purchasedCredits - batch.usedCredits, 0),
      status: batch.refundedAt
        ? 'REVOKED'
        : batch.usedCredits >= batch.purchasedCredits
          ? 'EXHAUSTED'
          : 'ACTIVE',
      grantedAt: `${batch.paymentDate}T00:00:00`,
      expiresAt: batch.expiryDate ? `${batch.expiryDate}T00:00:00` : null,
    })),
  }
}

function getMockCreditTransactions() {
  const transactions = currentSummary.creditBatches.flatMap((batch, index) => {
    const userCreditId = getUserCreditId(batch.id, index)
    const baseId = userCreditId * 10
    const items = [
      {
        creditTransactionId: baseId + 1,
        userCreditId,
        transactionType: 'GRANT',
        amount: batch.purchasedCredits,
        createdAt: `${batch.paymentDate}T00:00:00`,
      },
    ]

    if (batch.usedCredits > 0) {
      items.push({
        creditTransactionId: baseId + 2,
        userCreditId,
        transactionType: 'USE',
        amount: -batch.usedCredits,
        createdAt: `${batch.paymentDate}T01:00:00`,
      })
    }
    if (batch.extendedAt) {
      items.push({
        creditTransactionId: baseId + 3,
        userCreditId,
        transactionType: 'EXTEND',
        amount: 0,
        createdAt: `${batch.extendedAt}T00:00:00`,
      })
    }
    if (batch.refundedAt) {
      items.push({
        creditTransactionId: baseId + 4,
        userCreditId,
        transactionType: 'REVOKE',
        amount: -batch.purchasedCredits,
        createdAt: `${batch.refundedAt}T00:00:00`,
      })
    }
    return items
  })

  return {
    transactions: transactions.sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    ),
  }
}

function getSubscriptionOverview() {
  const subscription = currentSummary.subscription
  if (subscription.status === 'none' || !subscription.planCode) {
    return { viewStatus: 'FREE', subscription: null }
  }

  const viewStatus = {
    paymentPending: 'PAYMENT_PENDING',
    active: 'ACTIVE',
    cancelScheduled: 'CANCEL_SCHEDULED',
    paymentFailed: 'PAYMENT_FAILED',
  }[subscription.status]

  return {
    viewStatus,
    subscription: {
      planCode: subscription.planCode,
      planName: subscription.planName,
      subscribedPrice: subscription.monthlyPrice,
      status: subscription.status === 'paymentFailed' ? 'PAST_DUE' : 'ACTIVE',
      paymentStatus:
        subscription.status === 'paymentFailed' ? 'FAILED' : 'PAID',
      startedAt: new Date().toISOString(),
      endedAt: null,
      nextBillingAt: subscription.nextPaymentDate
        ? `${subscription.nextPaymentDate}T00:00:00`
        : null,
      cancelAtPeriodEnd: subscription.status === 'cancelScheduled',
    },
  }
}

function getPaymentMethodResponse() {
  const method = currentSummary.billingMethod
  if (method.status !== 'registered') return null

  return {
    paymentMethodId: Number(method.id?.match(/\d+$/)?.[0] ?? 1),
    methodType: 'CARD',
    cardIssuer: method.brand ?? 'Visa',
    maskedCardNumber: `****-****-****-${method.last4 ?? '5588'}`,
    issuedAt: `${method.updatedAt ?? new Date().toISOString().slice(0, 10)}T00:00:00`,
  }
}

export const billingHandlers = [
  http.get(`${process.env.NEXT_PUBLIC_API_URL}/credits`, () =>
    apiResponse(getMockUserCredits())
  ),

  http.get(`${process.env.NEXT_PUBLIC_API_URL}/credit-products`, () =>
    apiResponse({ products: getMockCreditProducts() })
  ),

  http.get(`${process.env.NEXT_PUBLIC_API_URL}/credits/transactions`, () =>
    apiResponse(getMockCreditTransactions())
  ),

  http.post(
    `${process.env.NEXT_PUBLIC_API_URL}/credit-purchases`,
    async ({ request }) => {
      const idempotencyError = requireIdempotencyKey(request)
      if (idempotencyError) return idempotencyError

      const body = (await request.json()) as { productCode: string }
      const option = currentSummary.creditOptions.find(
        (item) => creditProductCode(item.credits) === body.productCode
      )
      if (!option) {
        return errorResponse(
          'CREDIT_PRODUCT_NOT_FOUND',
          '크레딧 상품을 찾을 수 없습니다.',
          404
        )
      }

      const today = new Date()
      const expiryDate = new Date(today)
      expiryDate.setDate(expiryDate.getDate() + 90)
      const orderId = Date.now()
      currentSummary.creditBatches.unshift({
        id: String(orderId),
        paymentDate: today.toISOString().slice(0, 10),
        expiryDate: expiryDate.toISOString().slice(0, 10),
        type: 'purchase',
        purchasedCredits: option.credits,
        usedCredits: 0,
        purchaseAmount: option.price,
        extendable: true,
        refundable: false,
        extendedAt: null,
        refundedAt: null,
      })
      return apiResponse({ orderId, status: 'PENDING' }, 202)
    }
  ),

  http.get(
    `${process.env.NEXT_PUBLIC_API_URL}/credit-purchases/:orderId/payment-status`,
    ({ params }) =>
      apiResponse({
        orderId: Number(params.orderId),
        orderStatus: 'COMPLETED',
        paymentStatus: 'PAID',
      })
  ),

  http.post(
    `${process.env.NEXT_PUBLIC_API_URL}/credits/:userCreditId/extension`,
    ({ params }) => {
      const userCreditId = Number(params.userCreditId)
      currentSummary.creditBatches = currentSummary.creditBatches.map(
        (batch, index) => {
          if (
            getUserCreditId(batch.id, index) !== userCreditId ||
            !batch.extendable ||
            !batch.expiryDate
          ) {
            return batch
          }
          const expiryDate = new Date(batch.expiryDate)
          expiryDate.setMonth(expiryDate.getMonth() + 3)
          return {
            ...batch,
            expiryDate: expiryDate.toISOString().slice(0, 10),
            extendable: false,
            extendedAt: new Date().toISOString().slice(0, 10),
          }
        }
      )
      const target = currentSummary.creditBatches.find(
        (batch, index) => getUserCreditId(batch.id, index) === userCreditId
      )
      return apiResponse({
        userCreditId,
        expiresAt: target?.expiryDate ? `${target.expiryDate}T00:00:00` : null,
      })
    }
  ),

  http.get(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/me`, () =>
    apiResponse(getSubscriptionOverview())
  ),

  http.post(
    `${process.env.NEXT_PUBLIC_API_URL}/subscriptions`,
    async ({ request }) => {
      const idempotencyError = requireIdempotencyKey(request)
      if (idempotencyError) return idempotencyError

      const body = (await request.json()) as { planCode: BillingPlanCode }
      const plan = getPlan(body.planCode)
      if (!plan) {
        return errorResponse(
          'SUBSCRIPTION_PLAN_404',
          '플랜을 찾을 수 없습니다.',
          404
        )
      }
      if (currentSummary.billingMethod.status !== 'registered') {
        return errorResponse(
          'PAYMENT_METHOD_404',
          '등록된 결제수단이 필요합니다.',
          404
        )
      }

      const orderId = ++latestSubscriptionOrderId
      currentSummary.subscription = {
        status: 'active',
        planCode: plan.code,
        planName: plan.name,
        monthlyPrice: plan.price,
        nextPaymentDate: getNextPaymentDate(),
        cancelScheduledDate: null,
        paymentFailedReason: null,
        includedMonthlyCredits: 3,
      }
      return apiResponse({ orderId, status: 'PENDING' }, 202)
    }
  ),

  http.get(
    `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/orders/:orderId/payment-status`,
    ({ params }) =>
      apiResponse({
        orderId: Number(params.orderId),
        viewStatus: 'ACTIVE',
        paymentStatus: 'PAID',
        subscriptionStatus: 'ACTIVE',
      })
  ),

  http.patch(
    `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/me`,
    async ({ request }) => {
      const body = (await request.json()) as { cancelAtPeriodEnd: boolean }
      currentSummary.subscription = {
        ...currentSummary.subscription,
        status: body.cancelAtPeriodEnd ? 'cancelScheduled' : 'active',
        cancelScheduledDate: body.cancelAtPeriodEnd
          ? (currentSummary.subscription.nextPaymentDate ??
            getNextPaymentDate())
          : null,
      }
      return apiResponse(null)
    }
  ),

  http.get(`${process.env.NEXT_PUBLIC_API_URL}/payment-methods/active`, () => {
    const method = getPaymentMethodResponse()
    return method
      ? apiResponse(method)
      : errorResponse(
          'PAYMENT_METHOD_404',
          'Active payment method not found',
          404
        )
  }),

  http.post(
    `${process.env.NEXT_PUBLIC_API_URL}/payment-methods`,
    async ({ request }) => {
      const idempotencyError = requireIdempotencyKey(request)
      if (idempotencyError) return idempotencyError
      const body = (await request.json()) as { billingKey: string }
      if (!body.billingKey) {
        return errorResponse(
          'PAYMENT_METHOD_400_BILLING_KEY',
          '발급된 빌링키가 필요합니다.',
          400
        )
      }
      currentSummary.billingMethod = {
        status: 'registered',
        id: `billing-method-${Date.now()}`,
        brand: 'Visa',
        last4: '5588',
        updatedAt: new Date().toISOString().slice(0, 10),
      }
      return apiResponse(getPaymentMethodResponse())
    }
  ),

  http.patch(
    `${process.env.NEXT_PUBLIC_API_URL}/payment-methods/active`,
    async ({ request }) => {
      const body = (await request.json()) as { billingKey: string }
      if (!body.billingKey) {
        return errorResponse(
          'PAYMENT_METHOD_400_BILLING_KEY',
          '발급된 빌링키가 필요합니다.',
          400
        )
      }
      currentSummary.billingMethod = {
        status: 'registered',
        id: currentSummary.billingMethod.id ?? 'billing-method-1',
        brand: 'Visa',
        last4: '5588',
        updatedAt: new Date().toISOString().slice(0, 10),
      }
      return apiResponse(getPaymentMethodResponse())
    }
  ),

  http.delete(
    `${process.env.NEXT_PUBLIC_API_URL}/payment-methods/active`,
    () => {
      currentSummary.billingMethod = {
        status: 'none',
        id: null,
        brand: null,
        last4: null,
        updatedAt: null,
      }
      return apiResponse(null)
    }
  ),
]
