import type {
  BillingHistoryStatus,
  BillingHistoryType,
  BillingSummary,
} from '../types'

export const mockBillingSummary: BillingSummary = {
  plans: [
    {
      code: 'PRO',
      name: 'PRO',
      price: 29900,
      available: true,
      unavailableReason: null,
      description: '모든 인플루언서 검색 기능을 제한 없이 사용합니다.',
      features: [
        '인플루언서 검색 탭 내 모든 기능 무제한',
        '경쟁 채널 분석이 가능한 3 크레딧 무료 제공',
      ],
    },
    {
      code: 'EARLY_BIRD',
      name: 'PRO 얼리버드',
      price: 9900,
      originalPrice: 29900,
      badge: '기간한정 67% 할인, 곧 종료!',
      available: true,
      unavailableReason: null,
      description: '초기 고객을 위한 월 구독 할인 플랜입니다.',
      features: [
        '인플루언서 검색 탭 내 모든 기능 무제한',
        '경쟁 채널 분석이 가능한 3 크레딧 무료 제공',
      ],
    },
  ],
  subscription: {
    status: 'none',
    planCode: null,
    planName: null,
    monthlyPrice: 0,
    nextPaymentDate: null,
    cancelScheduledDate: null,
    paymentFailedReason: null,
    includedMonthlyCredits: 3,
  },
  billingMethod: {
    status: 'registered',
    id: 'billing-method-1',
    brand: 'Visa',
    last4: '4242',
    updatedAt: '2026-08-01',
  },
  creditBatches: [
    {
      id: 'credit-batch-1',
      paymentDate: '2026-08-01',
      expiryDate: '2026-11-01',
      type: 'subscription',
      purchasedCredits: 3,
      usedCredits: 1,
      purchaseAmount: 0,
      extendable: false,
      refundable: false,
      extendedAt: null,
      refundedAt: null,
    },
    {
      id: 'credit-batch-2',
      paymentDate: '2026-07-20',
      expiryDate: '2026-10-20',
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
      id: 'credit-batch-3',
      paymentDate: '2026-06-28',
      expiryDate: '2026-09-28',
      type: 'purchase',
      purchasedCredits: 10,
      usedCredits: 10,
      purchaseAmount: 45000,
      extendable: true,
      refundable: false,
      extendedAt: null,
      refundedAt: null,
    },
    {
      id: 'credit-batch-4',
      paymentDate: '2026-05-14',
      expiryDate: '2026-11-14',
      type: 'purchase',
      purchasedCredits: 10,
      usedCredits: 3,
      purchaseAmount: 45000,
      extendable: false,
      refundable: true,
      extendedAt: '2026-08-04',
      refundedAt: null,
    },
  ],
  creditOptions: [
    {
      id: 'credit-option-10',
      credits: 10,
      price: 3900,
      pricePerCredit: 390,
      originalPrice: 4600,
    },
    {
      id: 'credit-option-30',
      credits: 30,
      price: 9900,
      pricePerCredit: 330,
      originalPrice: 11700,
      badge: '15% 할인',
    },
    {
      id: 'credit-option-100',
      credits: 100,
      price: 24900,
      pricePerCredit: 249,
      originalPrice: 39000,
      badge: '36% 할인',
    },
  ],
}

/* GET /payment-history 목 데이터. 서버는 구독 결제·크레딧 구매·환불을
 * 한 목록으로 내려주므로 목도 세 유형을 모두 담는다. */
export const mockPaymentHistory: {
  paymentId: number | null
  refundId: number | null
  orderId: number
  type: BillingHistoryType
  description: string
  amount: number
  status: BillingHistoryStatus
  statusLabel: string
  occurredAt: string
}[] = [
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
    paymentId: 102,
    refundId: null,
    orderId: 1002,
    type: 'CREDIT_PURCHASE',
    description: '30크레딧',
    amount: 9900,
    status: 'PAYMENT_COMPLETED',
    statusLabel: '결제 완료',
    occurredAt: '2026-07-20T09:00:00',
  },
  {
    paymentId: 103,
    refundId: null,
    orderId: 1003,
    type: 'SUBSCRIPTION_PAYMENT',
    description: '월 구독료',
    amount: 9900,
    status: 'PAYMENT_FAILED',
    statusLabel: '결제 실패',
    occurredAt: '2026-07-01T09:00:00',
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
]
