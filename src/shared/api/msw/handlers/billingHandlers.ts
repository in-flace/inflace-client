import { http, HttpResponse } from 'msw'

import { mockBillingSummary } from '@/features/me/credit/mock/mockBilling'
import type {
  BillingPlanCode,
  BillingSummary,
  CancelSubscriptionPayload,
  PurchaseCreditsPayload,
  RegisterBillingMethodPayload,
  StartSubscriptionPayload,
} from '@/features/me/credit/types'

let currentSummary: BillingSummary = structuredClone(mockBillingSummary)

function jsonResponse(summary: BillingSummary = currentSummary) {
  return HttpResponse.json({
    success: true,
    responseDto: summary,
    error: null,
  })
}

function getNextPaymentDate() {
  const nextDate = new Date()
  nextDate.setMonth(nextDate.getMonth() + 1)
  return nextDate.toISOString().slice(0, 10)
}

function getPlan(planCode: BillingPlanCode) {
  return currentSummary.plans.find((plan) => plan.code === planCode)
}

function apiResponse<T>(responseDto: T, status = 200) {
  return HttpResponse.json(
    {
      success: true,
      responseDto,
      error: null,
    },
    { status }
  )
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
      productName: `${batch.purchasedCredits}크레딧`,
      initialAmount: batch.purchasedCredits,
      remainingAmount: Math.max(batch.purchasedCredits - batch.usedCredits, 0),
      status:
        batch.usedCredits >= batch.purchasedCredits ? 'EXHAUSTED' : 'ACTIVE',
      grantedAt: `${batch.paymentDate}T00:00:00`,
      expiresAt: `${batch.expiryDate}T00:00:00`,
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

    return items
  })

  return {
    transactions: transactions.sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    ),
  }
}

export const billingHandlers = [
  http.get(`${process.env.NEXT_PUBLIC_API_URL}/billing/summary`, () => {
    return jsonResponse()
  }),

  http.get(`${process.env.NEXT_PUBLIC_API_URL}/credits`, () => {
    return apiResponse(getMockUserCredits())
  }),

  http.get(`${process.env.NEXT_PUBLIC_API_URL}/credit-products`, () => {
    return apiResponse({ products: getMockCreditProducts() })
  }),

  http.get(`${process.env.NEXT_PUBLIC_API_URL}/credits/transactions`, () => {
    return apiResponse(getMockCreditTransactions())
  }),

  http.post(
    `${process.env.NEXT_PUBLIC_API_URL}/credit-purchases`,
    async ({ request }) => {
      if (!request.headers.get('Idempotency-Key')) {
        return HttpResponse.json(
          {
            success: false,
            responseDto: null,
            error: {
              code: 'COMMON_400_IDEMPOTENCY',
              message: 'Idempotency-Key header is required',
            },
          },
          { status: 400 }
        )
      }

      const body = (await request.json()) as { productCode: string }
      const option = currentSummary.creditOptions.find(
        (creditOption) =>
          creditProductCode(creditOption.credits) === body.productCode
      )

      if (!option) {
        return HttpResponse.json(
          {
            success: false,
            responseDto: null,
            error: {
              code: 'CREDIT_PRODUCT_NOT_FOUND',
              message: '크레딧 상품을 찾을 수 없습니다.',
            },
          },
          { status: 404 }
        )
      }

      const today = new Date()
      const expiryDate = new Date(today)
      expiryDate.setDate(expiryDate.getDate() + 90)
      const orderId = Date.now()

      currentSummary = {
        ...currentSummary,
        creditBatches: [
          {
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
          },
          ...currentSummary.creditBatches,
        ],
      }

      return apiResponse({ orderId, status: 'PENDING' }, 202)
    }
  ),

  http.get(
    `${process.env.NEXT_PUBLIC_API_URL}/credit-purchases/:orderId/payment-status`,
    ({ params }) => {
      return apiResponse({
        orderId: Number(params.orderId),
        orderStatus: 'COMPLETED',
        paymentStatus: 'PAID',
      })
    }
  ),

  http.post(
    `${process.env.NEXT_PUBLIC_API_URL}/credits/:userCreditId/extension`,
    ({ params }) => {
      const userCreditId = Number(params.userCreditId)

      currentSummary = {
        ...currentSummary,
        creditBatches: currentSummary.creditBatches.map((batch, index) => {
          if (
            getUserCreditId(batch.id, index) !== userCreditId ||
            !batch.extendable
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
        }),
      }

      const target = currentSummary.creditBatches.find(
        (batch, index) => getUserCreditId(batch.id, index) === userCreditId
      )

      return apiResponse({
        userCreditId,
        expiresAt: `${target?.expiryDate ?? new Date().toISOString().slice(0, 10)}T00:00:00`,
      })
    }
  ),

  http.post(
    `${process.env.NEXT_PUBLIC_API_URL}/billing/subscription`,
    async ({ request }) => {
      const body = (await request.json()) as StartSubscriptionPayload
      const plan = getPlan(body.planCode)

      if (!plan) {
        return HttpResponse.json(
          {
            success: false,
            responseDto: null,
            error: {
              code: 'PLAN_NOT_FOUND',
              message: '플랜을 찾을 수 없습니다.',
            },
          },
          { status: 404 }
        )
      }

      if (currentSummary.billingMethod.status !== 'registered') {
        return HttpResponse.json(
          {
            success: false,
            responseDto: null,
            error: {
              code: 'BILLING_METHOD_REQUIRED',
              message: '구독을 시작하려면 결제수단을 등록해주세요.',
            },
          },
          { status: 400 }
        )
      }

      currentSummary = {
        ...currentSummary,
        subscription: {
          status: 'active',
          planCode: plan.code,
          planName: plan.name,
          monthlyPrice: plan.price,
          nextPaymentDate: getNextPaymentDate(),
          cancelScheduledDate: null,
          paymentFailedReason: null,
          includedMonthlyCredits: 3,
        },
        creditBatches: [
          {
            id: `credit-batch-subscription-${Date.now()}`,
            paymentDate: new Date().toISOString().slice(0, 10),
            expiryDate: getNextPaymentDate(),
            type: 'subscription',
            purchasedCredits: 3,
            usedCredits: 0,
            purchaseAmount: 0,
            extendable: false,
            refundable: false,
            extendedAt: null,
            refundedAt: null,
          },
          ...currentSummary.creditBatches,
        ],
        history: [
          {
            id: `history-subscription-${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            title: `${plan.name} 월 구독`,
            type: 'subscription',
            amount: plan.price,
            status: 'paid',
            receiptAvailable: true,
            taxInvoiceAvailable: true,
          },
          ...currentSummary.history,
        ],
      }

      return jsonResponse()
    }
  ),

  http.post(
    `${process.env.NEXT_PUBLIC_API_URL}/billing/subscription/cancel`,
    async ({ request }) => {
      const body = (await request.json()) as CancelSubscriptionPayload

      if (!body.reason.trim()) {
        return HttpResponse.json(
          {
            success: false,
            responseDto: null,
            error: {
              code: 'CANCEL_REASON_REQUIRED',
              message: '해지 사유를 선택해주세요.',
            },
          },
          { status: 400 }
        )
      }

      currentSummary = {
        ...currentSummary,
        subscription: {
          ...currentSummary.subscription,
          status: 'cancelScheduled',
          cancelScheduledDate:
            currentSummary.subscription.nextPaymentDate ?? getNextPaymentDate(),
        },
      }

      return jsonResponse()
    }
  ),

  http.post(
    `${process.env.NEXT_PUBLIC_API_URL}/billing/subscription/retry`,
    () => {
      currentSummary = {
        ...currentSummary,
        subscription: {
          ...currentSummary.subscription,
          status: 'active',
          paymentFailedReason: null,
          nextPaymentDate:
            currentSummary.subscription.nextPaymentDate ?? getNextPaymentDate(),
        },
      }

      return jsonResponse()
    }
  ),

  http.post(
    `${process.env.NEXT_PUBLIC_API_URL}/billing/method`,
    async ({ request }) => {
      const body = (await request.json()) as RegisterBillingMethodPayload

      if (!body.billingKey) {
        return HttpResponse.json(
          {
            success: false,
            responseDto: null,
            error: {
              code: 'BILLING_KEY_REQUIRED',
              message: '발급된 빌링키가 필요합니다.',
            },
          },
          { status: 400 }
        )
      }

      currentSummary = {
        ...currentSummary,
        billingMethod: {
          status: 'registered',
          id: `billing-method-${Date.now()}`,
          brand: 'Visa',
          last4: '5588',
          updatedAt: new Date().toISOString().slice(0, 10),
        },
      }

      return jsonResponse()
    }
  ),

  http.delete(`${process.env.NEXT_PUBLIC_API_URL}/billing/method`, () => {
    currentSummary = {
      ...currentSummary,
      billingMethod: {
        status: 'none',
        id: null,
        brand: null,
        last4: null,
        updatedAt: null,
      },
    }

    return jsonResponse()
  }),

  http.post(
    `${process.env.NEXT_PUBLIC_API_URL}/billing/credits/purchase`,
    async ({ request }) => {
      const body = (await request.json()) as PurchaseCreditsPayload
      const option = currentSummary.creditOptions.find(
        (creditOption) => creditOption.id === body.optionId
      )

      if (!option) {
        return HttpResponse.json(
          {
            success: false,
            responseDto: null,
            error: {
              code: 'CREDIT_OPTION_NOT_FOUND',
              message: '크레딧 상품을 찾을 수 없습니다.',
            },
          },
          { status: 404 }
        )
      }

      if (body.paymentMethod === 'oneTime' && !body.paymentId) {
        return HttpResponse.json(
          {
            success: false,
            responseDto: null,
            error: {
              code: 'PAYMENT_ID_REQUIRED',
              message: '1회성 결제 식별자가 필요합니다.',
            },
          },
          { status: 400 }
        )
      }

      if (
        body.paymentMethod === 'registeredCard' &&
        currentSummary.billingMethod.status !== 'registered'
      ) {
        return HttpResponse.json(
          {
            success: false,
            responseDto: null,
            error: {
              code: 'BILLING_METHOD_REQUIRED',
              message: '등록된 결제수단을 확인해주세요.',
            },
          },
          { status: 400 }
        )
      }

      const today = new Date()
      const expiryDate = new Date(today)
      expiryDate.setMonth(expiryDate.getMonth() + 3)

      currentSummary = {
        ...currentSummary,
        creditBatches: [
          {
            id: `credit-batch-purchase-${Date.now()}`,
            paymentDate: today.toISOString().slice(0, 10),
            expiryDate: expiryDate.toISOString().slice(0, 10),
            type: 'purchase',
            purchasedCredits: option.credits,
            usedCredits: 0,
            purchaseAmount: option.price,
            extendable: true,
            refundable: true,
            extendedAt: null,
            refundedAt: null,
          },
          ...currentSummary.creditBatches,
        ],
        history: [
          {
            id: `history-credit-${Date.now()}`,
            date: today.toISOString().slice(0, 10),
            title: `크레딧 ${option.credits}개 구매`,
            type: 'creditPurchase',
            amount: option.price,
            status: 'paid',
            receiptAvailable: true,
            taxInvoiceAvailable: true,
          },
          ...currentSummary.history,
        ],
      }

      return jsonResponse()
    }
  ),

  http.post(
    `${process.env.NEXT_PUBLIC_API_URL}/billing/credits/:batchId/extend`,
    ({ params }) => {
      const batchId = String(params.batchId)
      const today = new Date().toISOString().slice(0, 10)

      currentSummary = {
        ...currentSummary,
        creditBatches: currentSummary.creditBatches.map((batch) => {
          if (batch.id !== batchId || !batch.extendable) {
            return batch
          }

          const expiryDate = new Date(batch.expiryDate)
          expiryDate.setMonth(expiryDate.getMonth() + 3)

          return {
            ...batch,
            expiryDate: expiryDate.toISOString().slice(0, 10),
            extendable: false,
            extendedAt: today,
          }
        }),
      }

      return jsonResponse()
    }
  ),

  http.post(
    `${process.env.NEXT_PUBLIC_API_URL}/billing/credits/:batchId/refund`,
    ({ params }) => {
      const batchId = String(params.batchId)
      const today = new Date().toISOString().slice(0, 10)
      const targetBatch = currentSummary.creditBatches.find(
        (batch) => batch.id === batchId
      )

      if (!targetBatch?.refundable || targetBatch.refundedAt) {
        return HttpResponse.json(
          {
            success: false,
            responseDto: null,
            error: {
              code: 'CREDIT_BATCH_NOT_REFUNDABLE',
              message: '환불할 수 없는 크레딧입니다.',
            },
          },
          { status: 400 }
        )
      }

      const remainingCredits = Math.max(
        targetBatch.purchasedCredits - targetBatch.usedCredits,
        0
      )
      const refundAmount = Math.round(
        targetBatch.purchaseAmount *
          (remainingCredits / targetBatch.purchasedCredits)
      )

      currentSummary = {
        ...currentSummary,
        creditBatches: currentSummary.creditBatches.map((batch) =>
          batch.id === batchId && batch.refundable
            ? { ...batch, refundable: false, refundedAt: today }
            : batch
        ),
        history: [
          {
            id: `history-refund-${Date.now()}`,
            date: today,
            title: '크레딧 구매 환불',
            type: 'creditRefund',
            amount: -refundAmount,
            status: 'refunded',
            receiptAvailable: false,
            taxInvoiceAvailable: false,
          },
          ...currentSummary.history,
        ],
      }

      return jsonResponse()
    }
  ),
]
