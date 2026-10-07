import type { BillingTab, CreditBatch, SubscriptionExitReason } from '../types'

export const BILLING_TABS = [
  { id: 'subscription', label: '플랜 구독' },
  { id: 'credit', label: '크레딧' },
  { id: 'billing-method', label: '결제수단 관리' },
  { id: 'history', label: '결제·환불 내역' },
] as const satisfies readonly { id: BillingTab; label: string }[]

/* 서버는 SubscriptionExitReason enum을 받는다. 화면 문구를 그대로 보내면
 * 사유가 저장되지 않으므로 라벨과 값을 여기서 짝지어 관리한다.
 * 순서와 문구는 기획 확정안을 따른다. 서버의 NOT_USING_SERVICE는 기획
 * 선택지에 없어 쓰지 않는다. "일시적으로 사용하지 않아요"는 일시 중단에
 * 해당하는 TEMPORARY_PAUSE로 보낸다. */
export const SUBSCRIPTION_EXIT_REASONS = [
  {
    value: 'YOUTUBE_CHANNEL_CONNECTION_DIFFICULTY',
    label: '유튜브 채널 연동이 불편해요',
  },
  { value: 'MISSING_FEATURES', label: '필요한 분석 기능이 부족해요' },
  { value: 'PRICE_TOO_HIGH', label: '구독 플랜 가격이 부담돼요' },
  { value: 'DASHBOARD_USAGE_DIFFICULTY', label: '대시보드 사용이 어려워요' },
  {
    value: 'SWITCHED_TO_ANOTHER_SERVICE',
    label: '다른 마케팅/채널 분석 툴로 이동해요',
  },
  { value: 'TEMPORARY_PAUSE', label: '일시적으로 사용하지 않아요' },
  { value: 'OTHER', label: '기타 직접 입력' },
] as const satisfies readonly {
  value: SubscriptionExitReason
  label: string
}[]

/* 기타 사유를 직접 입력할 때의 상한. 서버 검증(@Size(max = 500))과 같다. */
export const SUBSCRIPTION_EXIT_REASON_DETAIL_MAX_LENGTH = 500

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
