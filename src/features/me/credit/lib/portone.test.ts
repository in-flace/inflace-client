import { afterEach, describe, expect, it, vi } from 'vitest'

import { issueCardBillingKey, requestOneTimeCardPayment } from './portone'

describe('portone adapter', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('mock 환경에서는 외부 결제창 없이 빌링키를 발급한다', async () => {
    vi.stubEnv('NEXT_PUBLIC_MOCK_ENABLED', 'true')

    const result = await issueCardBillingKey({
      issueName: '테스트 카드 등록',
    })

    expect(result.isMock).toBe(true)
    expect(result.billingKey).toMatch(/^mock-billing-key-/)
  })

  it('mock 환경에서는 고유한 1회성 결제 ID를 생성한다', async () => {
    vi.stubEnv('NEXT_PUBLIC_MOCK_ENABLED', 'true')

    const first = await requestOneTimeCardPayment({
      orderName: '10 크레딧',
      totalAmount: 3900,
    })
    const second = await requestOneTimeCardPayment({
      orderName: '10 크레딧',
      totalAmount: 3900,
    })

    expect(first.isMock).toBe(true)
    expect(first.paymentId).toMatch(/^payment-/)
    expect(first.paymentId).not.toBe(second.paymentId)
  })

  it('실결제 환경에서 설정이 없으면 목 결제로 우회하지 않는다', async () => {
    vi.stubEnv('NEXT_PUBLIC_MOCK_ENABLED', 'false')
    vi.stubEnv('NEXT_PUBLIC_PORTONE_STORE_ID', '')
    vi.stubEnv('NEXT_PUBLIC_PORTONE_CHANNEL_KEY', '')

    await expect(
      issueCardBillingKey({ issueName: '테스트 카드 등록' })
    ).rejects.toMatchObject({ code: 'PORTONE_CONFIG_MISSING' })
  })
})
