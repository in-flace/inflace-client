import type { BillingTab, CreditBatch } from '../types'

export const BILLING_TABS = [
  { id: 'subscription', label: '구독 현황' },
  { id: 'credit', label: '크레딧' },
  { id: 'billing-method', label: '결제수단 관리' },
  { id: 'history', label: '결제·환불 내역' },
] as const satisfies readonly { id: BillingTab; label: string }[]

export function isBillingTab(value: string | null): value is BillingTab {
  return BILLING_TABS.some((tab) => tab.id === value)
}

export function formatWon(amount: number) {
  const sign = amount < 0 ? '-' : ''
  return `${sign}₩${Math.abs(amount).toLocaleString('ko-KR')}`
}

export function formatDate(value: string | null) {
  if (!value) {
    return '-'
  }

  return value.replaceAll('-', '.')
}

export function getRemainingCredits(batch: CreditBatch) {
  if (batch.refundedAt) {
    return 0
  }

  return Math.max(batch.purchasedCredits - batch.usedCredits, 0)
}

export function getTotalCredits(batches: CreditBatch[]) {
  return batches.reduce((total, batch) => total + getRemainingCredits(batch), 0)
}

export function getExpiringCredits(
  batches: CreditBatch[],
  expiryMonthPrefix: string
) {
  return batches.reduce((total, batch) => {
    if (batch.refundedAt || !batch.expiryDate?.startsWith(expiryMonthPrefix)) {
      return total
    }

    return total + getRemainingCredits(batch)
  }, 0)
}

export function getNearestExpiryDate(batches: CreditBatch[]) {
  let nearest: string | null = null

  for (const batch of batches) {
    if (
      batch.refundedAt ||
      !batch.expiryDate ||
      getRemainingCredits(batch) === 0
    ) {
      continue
    }

    if (!nearest || batch.expiryDate < nearest) {
      nearest = batch.expiryDate
    }
  }

  return nearest
}
