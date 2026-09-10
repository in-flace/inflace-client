import type { BillingTab, CreditBatch, SubscriptionExitReason } from '../types'

export const BILLING_TABS = [
  { id: 'subscription', label: '구독 현황' },
  { id: 'credit', label: '크레딧' },
  { id: 'billing-method', label: '결제수단 관리' },
  { id: 'history', label: '결제·환불 내역' },
] as const satisfies readonly { id: BillingTab; label: string }[]

/* 서버는 SubscriptionExitReason enum을 받는다. 화면 문구를 그대로 보내면
 * 사유가 저장되지 않으므로 라벨과 값을 여기서 짝지어 관리한다.
 * 서버 enum의 TEMPORARY_PAUSE/OTHER는 기획에 선택지가 아직 없어 제외했다. */
export const SUBSCRIPTION_EXIT_REASONS = [
  { value: 'NOT_USING_SERVICE', label: '사용 빈도가 낮아요' },
  { value: 'PRICE_TOO_HIGH', label: '가격이 부담돼요' },
  { value: 'MISSING_FEATURES', label: '원하는 기능이 부족해요' },
  { value: 'SWITCHED_TO_ANOTHER_SERVICE', label: '다른 서비스를 이용해요' },
] as const satisfies readonly {
  value: SubscriptionExitReason
  label: string
}[]

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
