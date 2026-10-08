import { describe, expect, it } from 'vitest'

import type { PortOneRedirectResult } from '../lib/portoneRedirect'
import type { ConsumedBillingIntent } from './billingIntent'
import {
  BILLING_INTENT_EXPIRED,
  REDIRECT_RESULT_UNKNOWN,
  interpretRegisterFailure,
  resolveBillingReturnPlan,
} from './billingReturnPlan'

const payer = {
  fullName: '홍길동',
  phoneNumber: '01012345678',
  email: 'a@b.kr',
}

const register = (
  pendingPlanCode: 'PRO' | null = null
): ConsumedBillingIntent => ({
  status: 'active',
  intent: { flow: 'registerBillingMethod', payer, pendingPlanCode, savedAt: 0 },
})
const change: ConsumedBillingIntent = {
  status: 'active',
  intent: { flow: 'changeBillingMethod', pendingPlanCode: 'PRO', savedAt: 0 },
}
const credit: ConsumedBillingIntent = {
  status: 'active',
  intent: { flow: 'creditCheckout', orderId: 42, savedAt: 0 },
}

const success = (billingKey: string | null): PortOneRedirectResult => ({
  kind: 'success',
  billingKey,
  paymentId: billingKey ? null : 'pay_1',
})
const failure: PortOneRedirectResult = {
  kind: 'failure',
  code: 'FAILURE_TYPE_PG',
  message: '취소',
}
const unknown: PortOneRedirectResult = { kind: 'unknown', keys: ['foo'] }
const none: PortOneRedirectResult = { kind: 'none' }

describe('resolveBillingReturnPlan', () => {
  it('복귀 흔적이 없으면 intent가 있어도 아무것도 하지 않는다 — PC 경로 보호', () => {
    expect(resolveBillingReturnPlan(register(), none)).toEqual({
      kind: 'ignore',
    })
  })

  it('intent가 없으면 결과가 실패여도 띄우지 않는다 — 뒤로가기 재진입', () => {
    expect(resolveBillingReturnPlan({ status: 'none' }, failure)).toEqual({
      kind: 'ignore',
    })
  })

  describe('카드 등록', () => {
    it('빌링키가 오면 등록한다', () => {
      expect(resolveBillingReturnPlan(register(), success('bk'))).toEqual({
        kind: 'register',
        billingKey: 'bk',
        payer,
        planCode: null,
      })
    })

    it('구독 모달에서 왔으면 플랜을 함께 넘긴다', () => {
      expect(
        resolveBillingReturnPlan(register('PRO'), success('bk'))
      ).toMatchObject({
        kind: 'register',
        planCode: 'PRO',
      })
    })

    it('결제창 실패는 그 코드로 실패 처리한다', () => {
      const plan = resolveBillingReturnPlan(register(), failure)
      expect(plan).toMatchObject({
        kind: 'failed',
        action: 'registerBillingMethod',
      })
      expect(plan.kind === 'failed' && plan.error.code).toBe('FAILURE_TYPE_PG')
    })

    it('빌링키를 찾지 못하면 진단용 코드로 실패한다', () => {
      for (const redirect of [unknown, success(null)]) {
        const plan = resolveBillingReturnPlan(register(), redirect)
        expect(plan.kind === 'failed' && plan.error.code).toBe(
          REDIRECT_RESULT_UNKNOWN
        )
      }
    })
  })

  describe('결제수단 변경', () => {
    it('등록과 같은 주소로 돌아와도 변경으로 처리한다', () => {
      expect(resolveBillingReturnPlan(change, success('bk'))).toEqual({
        kind: 'change',
        billingKey: 'bk',
        planCode: 'PRO',
      })
    })

    it('결제창 실패는 변경 실패다', () => {
      expect(resolveBillingReturnPlan(change, failure)).toMatchObject({
        kind: 'failed',
        action: 'changeBillingMethod',
      })
    })
  })

  describe('크레딧 결제', () => {
    it('성공이든 해석 불가든 주문 번호로 서버에 확인한다', () => {
      for (const redirect of [success(null), unknown]) {
        expect(resolveBillingReturnPlan(credit, redirect)).toEqual({
          kind: 'confirmCredit',
          orderId: 42,
        })
      }
    })

    it('결제창 실패는 구매 실패다', () => {
      expect(resolveBillingReturnPlan(credit, failure)).toMatchObject({
        kind: 'failed',
        action: 'purchaseCredits',
      })
    })
  })

  describe('만료', () => {
    it('크레딧은 화면만 새로 받는다 — 서버가 웹훅으로 확정한다', () => {
      expect(
        resolveBillingReturnPlan(
          { status: 'expired', flow: 'creditCheckout' },
          unknown
        )
      ).toEqual({ kind: 'refreshCredits' })
    })

    it('카드 등록은 만료로 실패 처리한다', () => {
      const plan = resolveBillingReturnPlan(
        { status: 'expired', flow: 'registerBillingMethod' },
        success('bk')
      )
      expect(plan.kind === 'failed' && plan.error.code).toBe(
        BILLING_INTENT_EXPIRED
      )
    })
  })
})

describe('interpretRegisterFailure', () => {
  it('중복 409인데 활성 카드가 있으면 이미 등록된 것이다', () => {
    for (const code of [
      'PAYMENT_METHOD_409_BILLING_KEY',
      'PAYMENT_METHOD_409_ACTIVE',
    ]) {
      expect(
        interpretRegisterFailure({
          code,
          status: 409,
          hasActiveBillingMethod: true,
        })
      ).toBe('succeeded')
    }
  })

  it('중복 409인데 카드가 없으면 실패다', () => {
    expect(
      interpretRegisterFailure({
        code: 'PAYMENT_METHOD_409_BILLING_KEY',
        status: 409,
        hasActiveBillingMethod: false,
      })
    ).toBe('fatal')
  })

  it('응답이 없거나 5xx면 다시 시도할 수 있다', () => {
    expect(
      interpretRegisterFailure({
        code: null,
        status: null,
        hasActiveBillingMethod: false,
      })
    ).toBe('retryable')
    expect(
      interpretRegisterFailure({
        code: 'PAYMENT_502_PROVIDER',
        status: 502,
        hasActiveBillingMethod: false,
      })
    ).toBe('retryable')
  })

  it('그 밖의 4xx는 다시 시도해도 같다', () => {
    expect(
      interpretRegisterFailure({
        code: 'PAYMENT_METHOD_400_BILLING_KEY',
        status: 400,
        hasActiveBillingMethod: false,
      })
    ).toBe('fatal')
  })
})
