import { describe, expect, it } from 'vitest'

import {
  formatDate,
  formatWon,
  getExpiringCredits,
  getNearestExpiryDate,
  getRemainingCredits,
  getTotalCredits,
  isBillingTab,
} from './billingDerived'
import type { CreditBatch } from '../types'

const creditBatches: CreditBatch[] = [
  {
    id: 'batch-1',
    paymentDate: '2026-08-01',
    expiryDate: '2026-09-01',
    type: 'purchase',
    purchasedCredits: 5,
    usedCredits: 2,
    purchaseAmount: 24000,
    extendable: true,
    refundable: true,
    extendedAt: null,
    refundedAt: null,
  },
  {
    id: 'batch-2',
    paymentDate: '2026-08-02',
    expiryDate: '2026-09-02',
    type: 'purchase',
    purchasedCredits: 3,
    usedCredits: 1,
    purchaseAmount: 15000,
    extendable: true,
    refundable: false,
    extendedAt: null,
    refundedAt: '2026-08-05',
  },
  {
    id: 'batch-3',
    paymentDate: '2026-08-03',
    expiryDate: '2026-10-03',
    type: 'subscription',
    purchasedCredits: 3,
    usedCredits: 0,
    purchaseAmount: 0,
    extendable: false,
    refundable: false,
    extendedAt: null,
    refundedAt: null,
  },
  {
    id: 'batch-4',
    paymentDate: '2026-08-04',
    expiryDate: null,
    type: 'subscription',
    purchasedCredits: 1,
    usedCredits: 0,
    purchaseAmount: 0,
    extendable: false,
    refundable: false,
    extendedAt: null,
    refundedAt: null,
  },
]

describe('billingDerived', () => {
  it('유효한 구독·결제 탭만 허용한다', () => {
    expect(isBillingTab('subscription')).toBe(true)
    expect(isBillingTab('billing-method')).toBe(true)
    expect(isBillingTab('unknown')).toBe(false)
    expect(isBillingTab(null)).toBe(false)
  })

  it('금액과 날짜를 화면 표기 형식으로 변환한다', () => {
    expect(formatWon(29000)).toBe('₩29,000')
    expect(formatWon(-12000)).toBe('-₩12,000')
    expect(formatDate('2026-08-09')).toBe('2026.08.09')
    expect(formatDate(null)).toBe('-')
  })

  it('환불된 배치를 제외하고 남은 크레딧을 계산한다', () => {
    expect(getRemainingCredits(creditBatches[0])).toBe(3)
    expect(getRemainingCredits(creditBatches[1])).toBe(0)
    expect(getTotalCredits(creditBatches)).toBe(7)
  })

  it('지정한 만료 월에 해당하는 크레딧만 합산한다', () => {
    expect(getExpiringCredits(creditBatches, '2026-09')).toBe(3)
    expect(getExpiringCredits(creditBatches, '2026-10')).toBe(3)
  })

  it('환불됐거나 소진된 배치를 제외하고 가장 빠른 만료일을 찾는다', () => {
    expect(getNearestExpiryDate(creditBatches)).toBe('2026-09-01')
    expect(
      getNearestExpiryDate(
        creditBatches.map((batch) => ({ ...batch, usedCredits: 99 }))
      )
    ).toBeNull()
  })
})
