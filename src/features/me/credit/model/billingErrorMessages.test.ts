import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it, vi } from 'vitest'

import { PortOnePaymentError } from '../lib/portone'
import { getBillingErrorMessage } from './billingErrorMessages'

function serverError(code: string, message = 'Bad Request: something') {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError('Request failed', code, config, null, {
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config,
    data: { error: { code, message } },
  })
}

describe('getBillingErrorMessage', () => {
  it('서버 코드를 우리 문구로 바꾼다', () => {
    expect(
      getBillingErrorMessage(serverError('CREDIT_409_EXTEND'), 'extendCredits')
    ).toBe('이미 연장한 크레딧입니다. 연장은 한 번만 할 수 있습니다.')
  })

  it('서버 원문(영어)을 그대로 노출하지 않는다', () => {
    const message = getBillingErrorMessage(
      serverError(
        'PAYMENT_503_TAX_INVOICE',
        'Service Unavailable: Tax invoice service is not enabled'
      ),
      'issueTaxInvoice'
    )
    expect(message).not.toMatch(/[A-Za-z]{4,}/)
  })

  it('모르는 코드는 동작별 기본 문구로 보낸다', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(getBillingErrorMessage(serverError('BRAND_404'), 'subscribe')).toBe(
      '구독을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.'
    )
    /* 원문은 문의 대응에 필요하므로 콘솔에는 남겨야 한다. */
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('포트원 PG 원문을 그대로 노출하지 않는다', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const message = getBillingErrorMessage(
      new PortOnePaymentError(
        '[V023] 신용카드 본인인증은 계약되지 않은 인증방법입니다',
        'V023'
      ),
      'registerBillingMethod'
    )
    expect(message).toBe(
      '카드를 등록하지 못했습니다. 잠시 후 다시 시도해주세요.'
    )
    spy.mockRestore()
  })

  it('사용자가 취소한 경우는 실패로 말하지 않는다', () => {
    expect(
      getBillingErrorMessage(
        new PortOnePaymentError('결제가 취소되었습니다.', 'PAYMENT_CANCELLED'),
        'purchaseCredits'
      )
    ).toBe('결제를 취소했습니다.')
  })

  it('에러 객체가 아니어도 문구를 만든다', () => {
    expect(getBillingErrorMessage(undefined, 'refundCredits')).toBe(
      '환불을 신청하지 못했습니다. 잠시 후 다시 시도해주세요.'
    )
  })
})
