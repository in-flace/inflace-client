'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import {
  CreditPurchaseStatusError,
  fetchBillingSummary,
} from '../api/billingApi'
import { createIdempotencyKey } from '../lib/idempotency'
import type { PaymentCustomer } from '../lib/portone'
import {
  buildCleanReturnPath,
  parsePortOneRedirect,
} from '../lib/portoneRedirect'
import type { BillingPlanCode } from '../types'
import {
  CREDIT_CONFIRM_PENDING_MESSAGE,
  getBillingErrorMessage,
  type BillingAction,
} from './billingErrorMessages'
import { consumeBillingIntent } from './billingIntent'
import {
  interpretRegisterFailure,
  resolveBillingReturnPlan,
  type BillingReturnPlan,
} from './billingReturnPlan'
import {
  useChangeBillingMethod,
  useConfirmCreditCheckout,
  useRegisterBillingMethod,
} from './useBilling'

/* 화면 상태(ModalState)는 pages가 가진다. features가 그걸 알면 의존이
 * 거꾸로 서므로 무슨 일이 있었는지만 알려주고 표현은 페이지가 정한다. */
export type BillingReturnOutcome =
  /* planCode가 있으면 구독 모달에서 왔다. 그 모달로 돌아가 결제하기를 누른다 */
  | { kind: 'registered'; planCode: BillingPlanCode | null }
  | { kind: 'changed'; planCode: BillingPlanCode | null }
  | { kind: 'creditConfirmed' }
  /* 서버가 웹훅으로 확정하므로 실패가 아니다. 재결제를 유도하면 안 된다 */
  | { kind: 'creditPending'; message: string }
  | {
      kind: 'failed'
      action: BillingAction
      message: string
      /* 같은 요청을 다시 보내도 되는 경우에만 있다 */
      retry: (() => void) | null
    }

function getErrorDetail(error: unknown) {
  if (!isAxiosError(error)) return { code: null, status: null }
  const code = error.response?.data?.error?.code
  return {
    code: typeof code === 'string' ? code : null,
    /* 응답 자체가 없으면(네트워크 단절) null — 서버에 닿았는지 모른다 */
    status: error.response?.status ?? null,
  }
}

function isRetryable(error: unknown) {
  const { status } = getErrorDetail(error)
  return status === null || status >= 500
}

/* 모바일 결제창은 페이지를 떠났다가 redirectUrl로 돌아온다. 결제창을 연 함수는
 * 이미 사라졌으므로 여기서 남은 일(서버 등록·구독·결제 확인)을 이어서 한다.
 * PC는 복귀 쿼리가 없어 아무 일도 하지 않는다. */
export function useBillingReturn({
  enabled,
  onPending,
  onOutcome,
}: {
  /* 요약이 로드된 뒤에 켠다. 결제 mutation이 사용자 ID로 캐시를 갱신하는데
   * 그 전에 돌면 엉뚱한 키에 쓰이고, 결과를 띄울 모달도 아직 없다. */
  enabled: boolean
  onPending: () => void
  onOutcome: (outcome: BillingReturnOutcome) => void
}) {
  const queryClient = useQueryClient()
  const registerMutation = useRegisterBillingMethod()
  const changeMutation = useChangeBillingMethod()
  const confirmCreditMutation = useConfirmCreditCheckout()

  /* effect는 한 번만 돌지만 콜백은 매 렌더 새로 만들어진다. 비동기 처리가
   * 끝났을 때 최신 콜백을 부르도록 ref로 들고 있는다. */
  const callbacksRef = useRef({ onPending, onOutcome })
  useEffect(() => {
    callbacksRef.current = { onPending, onOutcome }
  })

  /* StrictMode의 이중 실행 방지. intent도 한 번 읽으면 지워지지만, 두 번째
   * 실행이 "intent 없음"으로 결론 내리기 전에 막는 편이 명확하다. */
  const processedRef = useRef(false)

  useEffect(() => {
    if (!enabled || processedRef.current) return

    const redirect = parsePortOneRedirect(
      new URLSearchParams(window.location.search)
    )
    if (redirect.kind === 'none') return
    processedRef.current = true

    const consumed = consumeBillingIntent()

    /* 처리 중 새로고침해도 다시 돌지 않게 주소부터 정리한다. 재처리 방지는
     * intent를 이미 지운 것으로 끝났고, 이건 주소창을 깨끗이 하는 일이다.
     * router.replace는 배포 환경에서 내비게이션을 일으키지 못한 전례(c936a43)가
     * 있어 쓰지 않는다. 네이티브 replaceState는 Next 라우터와 동기화된다. */
    window.history.replaceState(
      null,
      '',
      buildCleanReturnPath(window.location.pathname, window.location.search)
    )

    if (redirect.kind === 'unknown' && consumed.status === 'active') {
      /* 포트원 복귀 쿼리의 실제 키 이름을 확정하는 단서다. 값에는 빌링키가
       * 섞여 있을 수 있어 이름만 남긴다. */
      console.warn(
        '[billing] 해석하지 못한 결제창 복귀 파라미터',
        redirect.keys
      )
    }

    const report = (outcome: BillingReturnOutcome) =>
      callbacksRef.current.onOutcome(outcome)

    async function register(
      billingKey: string,
      payer: PaymentCustomer,
      planCode: BillingPlanCode | null
    ) {
      callbacksRef.current.onPending()

      try {
        /* 멱등키는 결제창 너머로 들고 오지 않는다. 서버가 키를 먼저 소모하고
         * 응답을 재생하지 않아 재사용하면 409로 막힌다. */
        await registerMutation.mutateAsync({
          idempotencyKey: createIdempotencyKey(),
          payload: {
            billingKey,
            name: payer.fullName,
            phoneNumber: payer.phoneNumber,
            email: payer.email,
          },
        })
      } catch (error) {
        const fresh = await fetchBillingSummary().catch(() => null)
        const verdict = interpretRegisterFailure({
          ...getErrorDetail(error),
          hasActiveBillingMethod: fresh?.billingMethod.status === 'registered',
        })
        void queryClient.invalidateQueries({ queryKey: ['billing'] })

        if (verdict !== 'succeeded') {
          report({
            kind: 'failed',
            action: 'registerBillingMethod',
            message: getBillingErrorMessage(error, 'registerBillingMethod'),
            /* 빌링키와 입력 정보는 메모리에만 둔다. 스토리지에 다시 쓰지 않는다 */
            retry:
              verdict === 'retryable'
                ? () => void register(billingKey, payer, planCode)
                : null,
          })
          return
        }
      }

      report({ kind: 'registered', planCode })
    }

    async function change(
      billingKey: string,
      planCode: BillingPlanCode | null
    ) {
      callbacksRef.current.onPending()
      try {
        await changeMutation.mutateAsync({ billingKey })
        report({ kind: 'changed', planCode })
      } catch (error) {
        report({
          kind: 'failed',
          action: 'changeBillingMethod',
          message: getBillingErrorMessage(error, 'changeBillingMethod'),
          retry: isRetryable(error)
            ? () => void change(billingKey, planCode)
            : null,
        })
      }
    }

    async function confirmCredit(orderId: number) {
      callbacksRef.current.onPending()
      try {
        await confirmCreditMutation.mutateAsync(orderId)
        /* 요약은 mutation이 갱신하지만 결제·환불 내역은 따로 받는다.
         * 복귀하면 내역 탭이 열리므로 방금 결제가 보이게 같이 새로 받는다. */
        void queryClient.invalidateQueries({ queryKey: ['billing'] })
        report({ kind: 'creditConfirmed' })
      } catch (error) {
        void queryClient.invalidateQueries({ queryKey: ['billing'] })
        const failed =
          error instanceof CreditPurchaseStatusError &&
          error.code === 'CREDIT_PURCHASE_FAILED'
        report(
          failed
            ? {
                kind: 'failed',
                action: 'purchaseCredits',
                message: getBillingErrorMessage(error, 'purchaseCredits'),
                retry: null,
              }
            : { kind: 'creditPending', message: CREDIT_CONFIRM_PENDING_MESSAGE }
        )
      }
    }

    function execute(plan: BillingReturnPlan) {
      switch (plan.kind) {
        case 'ignore':
          return
        case 'refreshCredits':
          void queryClient.invalidateQueries({ queryKey: ['billing'] })
          return
        case 'failed':
          report({
            kind: 'failed',
            action: plan.action,
            message: getBillingErrorMessage(plan.error, plan.action),
            retry: null,
          })
          return
        case 'register':
          void register(plan.billingKey, plan.payer, plan.planCode)
          return
        case 'change':
          void change(plan.billingKey, plan.planCode)
          return
        case 'confirmCredit':
          void confirmCredit(plan.orderId)
          return
      }
    }

    execute(resolveBillingReturnPlan(consumed, redirect))
    /* mutation 객체는 상태가 바뀔 때마다 새로 만들어져 effect가 다시 돌지만,
     * processedRef가 첫 줄에서 막는다. */
  }, [
    enabled,
    queryClient,
    registerMutation,
    changeMutation,
    confirmCreditMutation,
  ])
}
