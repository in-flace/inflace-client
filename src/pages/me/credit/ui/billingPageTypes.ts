import type {
  BillingHistoryItem,
  BillingPlan,
  CreditBatch,
} from '@/features/me/credit'

export type PayerInfo = {
  name: string
  phone: string
  email: string
}

export const EMPTY_PAYER_INFO: PayerInfo = {
  name: '',
  phone: '',
  email: '',
}

export type ModalState =
  | { type: 'subscribe'; plan: BillingPlan }
  | { type: 'cancelReason' }
  | { type: 'cancelNotice' }
  | { type: 'cancelDone' }
  | { type: 'billingRegister' }
  | { type: 'billingChange' }
  | { type: 'billingRegistered' }
  | { type: 'billingChanged' }
  | { type: 'billingDelete' }
  | { type: 'billingDeleted'; last4: string | null }
  | { type: 'creditPurchase' }
  | { type: 'creditExtend'; batch: CreditBatch }
  | { type: 'document'; item: BillingHistoryItem; documentType: string }
  | null
