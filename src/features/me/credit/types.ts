export type BillingTab =
  'subscription' | 'billing-method' | 'credit' | 'history'

export type BillingPlanCode = 'PRO' | 'EARLY_BIRD'

export type SubscriptionStatus =
  'none' | 'paymentPending' | 'active' | 'cancelScheduled' | 'paymentFailed'

export type BillingMethodStatus = 'none' | 'registered'

export type CreditBatchType = 'subscription' | 'purchase'

/* 서버 PaymentHistoryType과 1:1 */
export type BillingHistoryType =
  'SUBSCRIPTION_PAYMENT' | 'CREDIT_PURCHASE' | 'REFUND'

/* 서버 PaymentHistoryStatus와 1:1 */
export type BillingHistoryStatus =
  | 'PAYMENT_PENDING'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'REFUND_REQUESTED'
  | 'REFUND_PROCESSING'
  | 'REFUND_COMPLETED'
  | 'REFUND_FAILED'

/* 서버 PlanUnavailableReason과 1:1 */
export type PlanUnavailableReason =
  'SOLD_OUT' | 'NOT_ON_SALE' | 'REJOIN_NOT_ALLOWED'

export interface BillingPlan {
  code: BillingPlanCode
  name: string
  price: number
  originalPrice?: number
  badge?: string
  description: string
  features: string[]
  /* 서버가 판정한 구매 가능 여부. false면 구매 버튼을 잠근다. */
  available: boolean
  unavailableReason: PlanUnavailableReason | null
}

export interface Subscription {
  status: SubscriptionStatus
  planCode: BillingPlanCode | null
  planName: string | null
  monthlyPrice: number
  nextPaymentDate: string | null
  cancelScheduledDate: string | null
  paymentFailedReason: string | null
  includedMonthlyCredits: number
}

export interface BillingMethod {
  status: BillingMethodStatus
  id: string | null
  brand: string | null
  last4: string | null
  updatedAt: string | null
}

export interface CreditBatch {
  id: string
  paymentDate: string
  expiryDate: string | null
  type: CreditBatchType
  purchasedCredits: number
  usedCredits: number
  purchaseAmount: number
  extendable: boolean
  refundable: boolean
  extendedAt: string | null
  refundedAt: string | null
}

export interface BillingHistoryItem {
  id: string
  /* 세금계산서·현금영수증 신청이 주문 단위라 함께 들고 있는다. */
  orderId: number
  date: string
  title: string
  type: BillingHistoryType
  amount: number
  status: BillingHistoryStatus
  /* 서버가 내려주는 상태 문구. 프론트에서 매핑을 중복 관리하지 않는다. */
  statusLabel: string
}

/* 결제·환불 내역은 페이지네이션이라 요약(BillingSummary)과 분리해 조회한다. */
export interface BillingHistoryPage {
  items: BillingHistoryItem[]
  totalElements: number
  totalPages: number
  page: number
  first: boolean
  last: boolean
}

export interface CreditPurchaseOption {
  id: string
  credits: number
  price: number
  pricePerCredit: number
  originalPrice?: number
  badge?: string
}

export interface BillingSummary {
  plans: BillingPlan[]
  subscription: Subscription
  billingMethod: BillingMethod
  creditBatches: CreditBatch[]
  creditOptions: CreditPurchaseOption[]
}

export interface StartSubscriptionPayload {
  planCode: BillingPlanCode
}

/* 서버 SubscriptionExitReason과 1:1 */
export type SubscriptionExitReason =
  | 'PRICE_TOO_HIGH'
  | 'NOT_USING_SERVICE'
  | 'MISSING_FEATURES'
  | 'SWITCHED_TO_ANOTHER_SERVICE'
  | 'TEMPORARY_PAUSE'
  | 'OTHER'

export interface CancelSubscriptionPayload {
  reason: SubscriptionExitReason
  /* 서버 @Size(max = 500). 현재 UI에는 입력란이 없어 보내지 않는다. */
  reasonDetail?: string
}

/* 서버 RegisterPaymentMethodRequest와 1:1로 맞춘다. 네 필드 모두 @NotBlank이고
 * phoneNumber는 ^[0-9-]{10,13}$, email은 @Email 검증을 받는다. */
export interface RegisterBillingMethodPayload {
  billingKey: string
  name: string
  phoneNumber: string
  email: string
}

/* 변경은 ChangePaymentMethodRequest가 billingKey만 받는다. */
export interface ChangeBillingMethodPayload {
  billingKey: string
}

export interface PurchaseCreditsPayload {
  optionId: string
  paymentMethod: 'registeredCard' | 'oneTime'
  paymentId?: string
}

export interface CreditBatchActionPayload {
  batchId: string
}
