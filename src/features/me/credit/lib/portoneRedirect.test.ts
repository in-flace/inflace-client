import { describe, expect, it } from 'vitest'

import { buildCleanReturnPath, parsePortOneRedirect } from './portoneRedirect'

const parse = (search: string) =>
  parsePortOneRedirect(new URLSearchParams(search))

describe('parsePortOneRedirect', () => {
  it('우리가 붙인 tab만 있으면 복귀가 아니다 — PC 경로가 여기로 빠진다', () => {
    expect(parse('?tab=billing-method')).toEqual({ kind: 'none' })
    expect(parse('')).toEqual({ kind: 'none' })
  })

  it('빌링키가 오면 성공이다', () => {
    expect(
      parse(
        '?tab=billing-method&transactionType=ISSUE_BILLING_KEY&billingKey=bk_1'
      )
    ).toEqual({ kind: 'success', billingKey: 'bk_1', paymentId: null })
  })

  it('키 표기가 snake_case여도 읽는다', () => {
    expect(parse('?billing_key=bk_2')).toEqual({
      kind: 'success',
      billingKey: 'bk_2',
      paymentId: null,
    })
  })

  it('결제 ID만 와도 성공이다', () => {
    expect(parse('?tab=history&paymentId=pay_1&txId=tx_1')).toEqual({
      kind: 'success',
      billingKey: null,
      paymentId: 'pay_1',
    })
  })

  it('code가 있으면 빌링키가 같이 와도 실패다', () => {
    expect(
      parse('?billingKey=bk_1&code=FAILURE_TYPE_PG&message=%EC%B7%A8%EC%86%8C')
    ).toEqual({ kind: 'failure', code: 'FAILURE_TYPE_PG', message: '취소' })
  })

  it('message가 없으면 pgMessage를 쓴다', () => {
    expect(parse('?pgCode=V023&pgMessage=pg')).toEqual({
      kind: 'failure',
      code: 'V023',
      message: 'pg',
    })
  })

  it('해석할 수 없는 키만 있으면 키 이름을 진단용으로 돌려준다', () => {
    expect(parse('?tab=billing-method&foo=1&bar=2')).toEqual({
      kind: 'unknown',
      keys: ['foo', 'bar'],
    })
  })
})

describe('buildCleanReturnPath', () => {
  it('tab만 남기고 나머지를 지운다', () => {
    expect(
      buildCleanReturnPath(
        '/me/credit',
        '?tab=billing-method&billingKey=bk&foo=1'
      )
    ).toBe('/me/credit?tab=billing-method')
  })

  it('tab이 없으면 경로만 남긴다', () => {
    expect(buildCleanReturnPath('/me/credit', '?billingKey=bk')).toBe(
      '/me/credit'
    )
  })
})
