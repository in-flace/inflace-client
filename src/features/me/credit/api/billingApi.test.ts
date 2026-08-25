import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}))

vi.mock('@/shared/api', () => ({
  axiosInstance: { get: getMock },
}))

import { fetchBillingSummary } from './billingApi'

function apiResponse<T>(responseDto: T) {
  return { data: { success: true, responseDto, error: null } }
}

describe('fetchBillingSummary', () => {
  beforeEach(() => {
    getMock.mockReset()
  })

  it('거래 이력으로 연장 상태를 복원하고 결제 관련 이력만 노출한다', async () => {
    getMock.mockImplementation((url: string) => {
      if (url === '/credits') {
        return Promise.resolve(
          apiResponse({
            totalRemaining: 12,
            batches: [
              {
                userCreditId: 1,
                productName: '10크레딧',
                initialAmount: 10,
                remainingAmount: 9,
                status: 'ACTIVE',
                grantedAt: '2026-08-18T10:00:00',
                expiresAt: '2026-11-16T10:00:00',
              },
              {
                userCreditId: 2,
                productName: '월 구독 지급',
                initialAmount: 3,
                remainingAmount: 3,
                status: 'ACTIVE',
                grantedAt: '2026-08-19T10:00:00',
                expiresAt: null,
              },
            ],
          })
        )
      }
      if (url === '/credit-products') {
        return Promise.resolve(
          apiResponse({
            products: [
              {
                code: 'CREDIT_10',
                name: '10크레딧',
                creditAmount: 10,
                price: 3900,
                unitPrice: 390,
                validityDays: 90,
              },
            ],
          })
        )
      }
      if (url === '/credits/transactions') {
        return Promise.resolve(
          apiResponse({
            transactions: [
              {
                creditTransactionId: 3,
                userCreditId: 1,
                transactionType: 'EXTEND',
                amount: 0,
                createdAt: '2026-08-20T10:05:00',
              },
              {
                creditTransactionId: 2,
                userCreditId: 1,
                transactionType: 'USE',
                amount: -1,
                createdAt: '2026-08-19T10:05:00',
              },
              {
                creditTransactionId: 1,
                userCreditId: 1,
                transactionType: 'GRANT',
                amount: 10,
                createdAt: '2026-08-18T10:05:00',
              },
            ],
          })
        )
      }
      if (url === '/subscriptions/me') {
        return Promise.resolve(
          apiResponse({
            viewStatus: 'ACTIVE',
            subscription: {
              planCode: 'EARLY_BIRD',
              planName: 'PRO 얼리버드',
              subscribedPrice: 9900,
              status: 'ACTIVE',
              paymentStatus: 'PAID',
              startedAt: '2026-08-01T00:00:00',
              endedAt: null,
              nextBillingAt: '2026-09-01T00:00:00',
              cancelAtPeriodEnd: false,
            },
          })
        )
      }
      if (url === '/payment-methods/active') {
        return Promise.resolve(
          apiResponse({
            paymentMethodId: 7,
            methodType: 'CARD',
            cardIssuer: '현대카드',
            maskedCardNumber: '****-****-****-5588',
            issuedAt: '2026-08-02T00:00:00',
          })
        )
      }
      throw new Error(`Unexpected URL: ${url}`)
    })

    const summary = await fetchBillingSummary()

    expect(summary.creditBatches[0]).toMatchObject({
      type: 'purchase',
      extendable: false,
      extendedAt: '2026-08-20',
    })
    expect(summary.creditBatches[1]).toMatchObject({
      type: 'subscription',
      expiryDate: null,
    })
    expect(summary.history).toEqual([
      expect.objectContaining({
        type: 'creditPurchase',
        title: '10크레딧',
        amount: 3900,
      }),
    ])
    expect(summary.creditOptions[0]).toMatchObject({
      originalPrice: 4600,
    })
    expect(summary.subscription).toMatchObject({
      status: 'active',
      planCode: 'EARLY_BIRD',
      monthlyPrice: 9900,
      nextPaymentDate: '2026-09-01',
    })
    expect(summary.billingMethod).toMatchObject({
      status: 'registered',
      id: '7',
      brand: '현대카드',
      last4: '5588',
    })
  })
})
