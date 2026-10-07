import { describe, expect, it } from 'vitest'

import {
  BILLING_INTENT_TTL_MS,
  beginBillingIntent,
  clearBillingIntent,
  consumeBillingIntent,
  parseBillingIntent,
} from './billingIntent'

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
    size: () => map.size,
  }
}

const payer = {
  fullName: '홍길동',
  phoneNumber: '01012345678',
  email: 'a@b.kr',
}

describe('billingIntent', () => {
  it('저장한 intent를 그대로 돌려받는다', () => {
    const storage = memoryStorage()
    beginBillingIntent(
      { flow: 'registerBillingMethod', payer, pendingPlanCode: 'PRO' },
      1_000,
      storage
    )
    expect(consumeBillingIntent(2_000, storage)).toEqual({
      status: 'active',
      intent: {
        flow: 'registerBillingMethod',
        payer,
        pendingPlanCode: 'PRO',
        savedAt: 1_000,
      },
    })
  })

  it('한 번 읽으면 지워진다 — 뒤로가기로 다시 들어와도 두 번 처리하지 않는다', () => {
    const storage = memoryStorage()
    beginBillingIntent({ flow: 'changeBillingMethod' }, 1_000, storage)
    consumeBillingIntent(2_000, storage)
    expect(storage.size()).toBe(0)
    expect(consumeBillingIntent(3_000, storage)).toEqual({ status: 'none' })
  })

  it('TTL이 지나면 만료로 알린다 — 어떤 흐름이었는지는 남긴다', () => {
    const storage = memoryStorage()
    beginBillingIntent({ flow: 'creditCheckout', orderId: 7 }, 0, storage)
    expect(consumeBillingIntent(BILLING_INTENT_TTL_MS + 1, storage)).toEqual({
      status: 'expired',
      flow: 'creditCheckout',
    })
  })

  it('저장 시각이 미래면 믿지 않는다', () => {
    expect(
      parseBillingIntent(
        JSON.stringify({ flow: 'changeBillingMethod', savedAt: 5_000 }),
        1_000
      )
    ).toEqual({ status: 'expired', flow: 'changeBillingMethod' })
  })

  it('깨진 값이나 모양이 다른 값은 없는 것으로 본다', () => {
    expect(parseBillingIntent('{not json', 0)).toEqual({ status: 'none' })
    expect(
      parseBillingIntent(JSON.stringify({ flow: 'x', savedAt: 0 }), 0)
    ).toEqual({
      status: 'none',
    })
    expect(
      parseBillingIntent(
        JSON.stringify({
          flow: 'registerBillingMethod',
          savedAt: 0,
          payer: {},
        }),
        0
      )
    ).toEqual({ status: 'none' })
    expect(
      parseBillingIntent(
        JSON.stringify({ flow: 'creditCheckout', savedAt: 0, orderId: '7' }),
        0
      )
    ).toEqual({ status: 'none' })
  })

  it('모르는 플랜 코드는 버린다 — 구독은 이어가지 않고 카드 등록만 한다', () => {
    expect(
      parseBillingIntent(
        JSON.stringify({
          flow: 'registerBillingMethod',
          savedAt: 0,
          payer,
          pendingPlanCode: 'FREE_FOREVER',
        }),
        0
      )
    ).toMatchObject({ status: 'active', intent: { pendingPlanCode: null } })
  })

  it('clear는 남은 intent를 지운다', () => {
    const storage = memoryStorage()
    beginBillingIntent({ flow: 'changeBillingMethod' }, 0, storage)
    clearBillingIntent(storage)
    expect(storage.size()).toBe(0)
  })

  it('스토리지가 없으면 조용히 넘어간다', () => {
    expect(() =>
      beginBillingIntent({ flow: 'changeBillingMethod' }, 0, null)
    ).not.toThrow()
    expect(consumeBillingIntent(0, null)).toEqual({ status: 'none' })
  })
})
