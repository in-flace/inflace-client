export type BillingTab =
  'subscription' | 'billing-method' | 'credit' | 'history'

export type BillingPlanCode = 'PRO' | 'EARLY_BIRD'

export type SubscriptionStatus =
  'none' | 'paymentPending' | 'active' | 'cancelScheduled' | 'paymentFailed'

export type BillingMethodStatus = 'none' | 'registered'

export type CreditBatchType = 'subscription' | 'purchase'

export type BillingHistoryType =
  | 'subscription'
  | 'creditPurchase'
  | 'creditRefund'
  | 'creditUsage'
  | 'creditRestore'
  | 'creditExtension'
  | 'creditExpiration'

export type BillingHistoryStatus =
  'paid' | 'failed' | 'refunded' | 'scheduled' | 'completed'

export interface BillingPlan {
  code: BillingPlanCode
  name: string
  price: number
  originalPrice?: number
  badge?: string
  description: string
  features: string[]
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
  date: string
  title: string
  type: BillingHistoryType
  amount: number
  status: BillingHistoryStatus
  receiptAvailable: boolean
  taxInvoiceAvailable: boolean
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
  history: BillingHistoryItem[]
  creditOptions: CreditPurchaseOption[]
}

export interface StartSubscriptionPayload {
  planCode: BillingPlanCode
}

export interface CancelSubscriptionPayload {
  reason: string
}

export interface RegisterBillingMethodPayload {
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
