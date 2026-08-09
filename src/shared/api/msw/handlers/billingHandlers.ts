import { http, HttpResponse } from 'msw'

import { mockBillingSummary } from '@/features/me/credit/mock/mockBilling'
import type {
  BillingPlanCode,
  BillingSummary,
  PurchaseCreditsPayload,
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

export const billingHandlers = [
  http.get(`${process.env.NEXT_PUBLIC_API_URL}/billing/summary`, () => {
    return jsonResponse()
  }),

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
    () => {
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

  http.post(`${process.env.NEXT_PUBLIC_API_URL}/billing/method`, () => {
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
  }),

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
            amount: -12000,
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
