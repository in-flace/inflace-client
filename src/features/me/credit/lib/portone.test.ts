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
      paymentId: 'pay-11111111111111111111111111111111',
      orderName: '10 크레딧',
      totalAmount: 3900,
      customer: payer,
    })
    const second = await requestOneTimeCardPayment({
      paymentId: 'pay-22222222222222222222222222222222',
      orderName: '10 크레딧',
      totalAmount: 3900,
      customer: payer,
    })

    expect(first.isMock).toBe(true)
    expect(first.paymentId).toMatch(/^pay-/)
    expect(first.paymentId).not.toBe(second.paymentId)
  })

  /* KG이니시스는 oid를 40자로 제한하며, 넘기면 결제창 자체가 열리지 않는다.
   * 접두사를 늘리다 한계를 넘기는 일이 생기지 않게 길이를 고정해 지킨다. */
  it('결제 식별자는 PG oid 길이 제한 40자를 넘지 않는다', async () => {
    vi.stubEnv('NEXT_PUBLIC_MOCK_ENABLED', 'true')

    const { paymentId } = await requestOneTimeCardPayment({
      paymentId: 'pay-55555555555555555555555555555555',
      orderName: '10 크레딧',
      totalAmount: 3900,
      customer: payer,
    })

    /* 서버가 준 값을 그대로 쓴다. 프론트가 다시 만들면 서버 주문과 어긋난다. */
    expect(paymentId).toBe('pay-55555555555555555555555555555555')
    expect(paymentId.length).toBeLessThanOrEqual(40)
  })

  it('실결제 환경에서 설정이 없으면 목 결제로 우회하지 않는다', async () => {
    vi.stubEnv('NEXT_PUBLIC_MOCK_ENABLED', 'false')
    vi.stubEnv('NEXT_PUBLIC_PORTONE_STORE_ID', '')
    vi.stubEnv('NEXT_PUBLIC_PORTONE_BILLING_CHANNEL_KEY', '')
    vi.stubEnv('NEXT_PUBLIC_PORTONE_PAYMENT_CHANNEL_KEY', '')

    await expect(
      issueCardBillingKey({ issueName: '테스트 카드 등록', customer: payer })
    ).rejects.toMatchObject({ code: 'PORTONE_CONFIG_MISSING' })
  })

  /* 정기 구독과 일반 결제는 채널이 분리되어 있다. 한쪽 채널키만 설정된
   * 상태에서 다른 쪽을 호출하면 조용히 성공하지 않고 막혀야 한다. */
  it('정기 구독 채널키만 있으면 일반 결제는 설정 누락으로 막는다', async () => {
    vi.stubEnv('NEXT_PUBLIC_MOCK_ENABLED', 'false')
    vi.stubEnv('NEXT_PUBLIC_PORTONE_STORE_ID', 'store-test')
    vi.stubEnv('NEXT_PUBLIC_PORTONE_BILLING_CHANNEL_KEY', 'channel-key-billing')
    vi.stubEnv('NEXT_PUBLIC_PORTONE_PAYMENT_CHANNEL_KEY', '')

    await expect(
      requestOneTimeCardPayment({
        paymentId: 'pay-44444444444444444444444444444444',
        orderName: '10 크레딧',
        totalAmount: 3900,
        customer: payer,
      })
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
        paymentId: 'pay-33333333333333333333333333333333',
        orderName: '10 크레딧',
        totalAmount: 3900,
        customer: { ...payer, fullName: '   ' },
      })
    ).rejects.toMatchObject({ code: 'CUSTOMER_INFO_MISSING' })
  })

  /* 서버가 접두사를 붙이거나 형식을 바꾸면 40자를 넘길 수 있다. 그러면
   * 이니시스가 결제창 자체를 열지 않으므로 호출 전에 막는다. */
  it('서버가 준 paymentId가 40자를 넘으면 결제창을 열지 않는다', async () => {
    vi.stubEnv('NEXT_PUBLIC_MOCK_ENABLED', 'true')

    await expect(
      requestOneTimeCardPayment({
        paymentId: `payment-${'0'.repeat(40)}`,
        orderName: '10 크레딧',
        totalAmount: 3900,
        customer: payer,
      })
    ).rejects.toMatchObject({ code: 'PAYMENT_ID_TOO_LONG' })
  })
})
