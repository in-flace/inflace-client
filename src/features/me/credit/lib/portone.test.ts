import { afterEach, describe, expect, it, vi } from 'vitest'

import { issueCardBillingKey, requestOneTimeCardPayment } from './portone'

const payer = {
  fullName: '홍길동',
  phoneNumber: '010-1234-5678',
  email: 'test@example.com',
}

describe('portone adapter', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('mock 환경에서는 외부 결제창 없이 빌링키를 발급한다', async () => {
    vi.stubEnv('NEXT_PUBLIC_MOCK_ENABLED', 'true')

    const result = await issueCardBillingKey({
      issueName: '테스트 카드 등록',
      customer: payer,
    })

    expect(result.isMock).toBe(true)
    expect(result.billingKey).toMatch(/^mock-billing-key-/)
  })

  it('mock 환경에서는 고유한 1회성 결제 ID를 생성한다', async () => {
    vi.stubEnv('NEXT_PUBLIC_MOCK_ENABLED', 'true')

    const first = await requestOneTimeCardPayment({
      orderName: '10 크레딧',
      totalAmount: 3900,
      customer: payer,
    })
    const second = await requestOneTimeCardPayment({
      orderName: '10 크레딧',
      totalAmount: 3900,
      customer: payer,
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
      issueCardBillingKey({ issueName: '테스트 카드 등록', customer: payer })
    ).rejects.toMatchObject({ code: 'PORTONE_CONFIG_MISSING' })
  })

  /* 포트원은 이 세 필드가 비면 INVALID_REQUEST로 거부하며 필드명이 영어로
   * 노출된다. mock 환경에서도 먼저 걸러 로컬에서만 통과하는 일이 없게 한다. */
  it('구매자 정보가 비어 있으면 결제창을 호출하기 전에 막는다', async () => {
    vi.stubEnv('NEXT_PUBLIC_MOCK_ENABLED', 'true')

    await expect(
      issueCardBillingKey({
        issueName: '테스트 카드 등록',
        customer: { ...payer, phoneNumber: '' },
      })
    ).rejects.toMatchObject({ code: 'CUSTOMER_INFO_MISSING' })

    await expect(
      requestOneTimeCardPayment({
        orderName: '10 크레딧',
        totalAmount: 3900,
        customer: { ...payer, fullName: '   ' },
      })
    ).rejects.toMatchObject({ code: 'CUSTOMER_INFO_MISSING' })
  })
})
