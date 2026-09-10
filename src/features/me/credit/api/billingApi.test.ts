import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}))

vi.mock('@/shared/api', () => ({
  axiosInstance: { get: getMock },
}))

import { fetchBillingSummary, fetchPaymentHistory } from './billingApi'

function apiResponse<T>(responseDto: T) {
  return { data: { success: true, responseDto, error: null } }
}

describe('fetchBillingSummary', () => {
  beforeEach(() => {
    getMock.mockReset()
  })

  it('거래 이력으로 연장 상태를 복원하고 결제 관련 이력만 노출한다', async () => {
    getMock.mockImplementation((url: string) => {
      if (url === '/subscriptions/plans') {
        return Promise.resolve(
          apiResponse({
            plans: [
              {
                code: 'PRO',
                name: 'PRO',
                price: 29900,
                billingPeriod: 'MONTHLY',
                available: true,
              },
              {
                code: 'EARLY_BIRD',
                name: 'PRO 얼리버드',
                price: 9900,
                billingPeriod: 'MONTHLY',
                available: false,
                unavailableReason: 'SOLD_OUT',
              },
            ],
          })
        )
      }
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

    /* 플랜은 서버 응답으로 만든다. 할인 표기는 정상가(PRO) 대비로 계산되고,
     * 설명·혜택은 서버에 없으므로 코드별 로컬 문구가 붙는다. */
    expect(summary.plans).toEqual([
      expect.objectContaining({
        code: 'PRO',
        price: 29900,
        available: true,
        unavailableReason: null,
        originalPrice: undefined,
        badge: undefined,
      }),
      expect.objectContaining({
        code: 'EARLY_BIRD',
        price: 9900,
        originalPrice: 29900,
        badge: '기간한정 67% 할인, 곧 종료!',
        available: false,
        unavailableReason: 'SOLD_OUT',
      }),
    ])
    expect(summary.plans[0].features.length).toBeGreaterThan(0)

    expect(summary.creditBatches[0]).toMatchObject({
      type: 'purchase',
      extendable: false,
      extendedAt: '2026-08-20',
    })
    expect(summary.creditBatches[1]).toMatchObject({
      type: 'subscription',
      expiryDate: null,
    })
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

describe('fetchPaymentHistory', () => {
  beforeEach(() => {
    getMock.mockReset()
  })

  /* 이전 구현은 크레딧 거래에서 내역을 만들어 구독 결제가 빠졌다.
   * 서버 페이지 응답을 그대로 옮기는지, 환불의 음수 금액이 살아남는지 본다. */
  it('서버 페이지 응답을 화면용 내역으로 옮긴다', async () => {
    getMock.mockImplementation((url: string) => {
      if (url !== '/payment-history') {
        throw new Error(`Unexpected URL: ${url}`)
      }
      return Promise.resolve(
        apiResponse({
          content: [
            {
              paymentId: 101,
              refundId: null,
              orderId: 1001,
              type: 'SUBSCRIPTION_PAYMENT',
              description: '월 구독료',
              amount: 9900,
              status: 'PAYMENT_COMPLETED',
              statusLabel: '결제 완료',
              occurredAt: '2026-08-01T09:00:00',
            },
            {
              paymentId: null,
              refundId: 201,
              orderId: 1002,
              type: 'REFUND',
              description: '크레딧 미사용분 환급',
              amount: -3900,
              status: 'REFUND_COMPLETED',
              statusLabel: '환불 완료',
              occurredAt: '2026-06-15T09:00:00',
            },
          ],
          totalElements: 12,
          totalPages: 2,
          number: 1,
          size: 10,
          first: false,
          last: true,
        })
      )
    })

    const page = await fetchPaymentHistory(1)

    expect(getMock).toHaveBeenCalledWith('/payment-history', {
      params: { page: 1, size: 10 },
    })
    expect(page).toMatchObject({
      totalElements: 12,
      totalPages: 2,
      page: 1,
      first: false,
      last: true,
    })
    expect(page.items[0]).toMatchObject({
      orderId: 1001,
      date: '2026-08-01',
      title: '월 구독료',
      type: 'SUBSCRIPTION_PAYMENT',
      amount: 9900,
      statusLabel: '결제 완료',
    })
    /* 환불은 음수 금액을 그대로 유지해야 -3,900원으로 표기된다. */
    expect(page.items[1].amount).toBe(-3900)
    /* 같은 주문의 결제/환불이 서로 다른 키를 갖는지 */
    expect(page.items[0].id).not.toBe(page.items[1].id)
  })
})
