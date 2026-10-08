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

/* 모달 안 금액은 시안대로 "9,900원" 형식이다. 표·카드의 가격은 ₩ 표기를 쓴다. */
export function formatWonSuffix(amount: number) {
  return `${amount.toLocaleString('ko-KR')}원`
}

/* 시안은 날짜를 2026-08-25처럼 하이픈으로 쓴다. 서버도 같은 형식으로 준다. */
export function formatDate(value: string | null) {
  return value || '-'
}

/* 구독 모달의 "다음 결제일" 미리보기. 실제 날짜는 결제 시점에 서버가 정하는데,
 * 서버 규칙(다음 달 같은 날, 그날이 없으면 말일)과 같게 계산해 어긋나지 않게 한다. */
export function getNextMonthlyBillingDate(from: Date) {
  const lastDay = new Date(from.getFullYear(), from.getMonth() + 2, 0).getDate()
  const next = new Date(
    from.getFullYear(),
    from.getMonth() + 1,
    Math.min(from.getDate(), lastDay)
  )
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`
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
