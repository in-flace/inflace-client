import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuthStore } from '@/shared/api/authStore'
import {
  cancelSubscription,
  changeBillingMethod,
  deleteBillingMethod,
  extendCreditBatch,
  fetchBillingSummary,
  fetchPaymentHistory,
  purchaseCredits,
  registerBillingMethod,
  requestTaxInvoice,
  resumeSubscription,
  startSubscription,
} from '../api/billingApi'
import type { BillingSummary } from '../types'

export const billingQueryKeys = {
  summary: (userId: string | null) => ['billing', 'summary', userId] as const,
  paymentHistory: (userId: string | null, page: number) =>
    ['billing', 'paymentHistory', userId, page] as const,
}

/* 내역은 페이지 단위로 따로 조회한다. 요약(summary)에 묶으면 페이지를 넘길
 * 때마다 크레딧·구독·결제수단까지 다시 받아오게 된다. */
export function usePaymentHistory(page: number) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const userId = useBillingUserId()

  return useQuery({
    queryKey: billingQueryKeys.paymentHistory(userId, page),
    queryFn: () => fetchPaymentHistory(page),
    enabled: !!accessToken && !!userId,
    /* 페이지를 넘기는 동안 이전 페이지를 남겨 표가 비어 보이지 않게 한다. */
    placeholderData: (previous) => previous,
  })
}

function useBillingUserId() {
  return useAuthStore((state) => state.user?.userDetails.id ?? null)
}

export function useBillingSummary() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const userId = useBillingUserId()

  return useQuery({
    queryKey: billingQueryKeys.summary(userId),
    queryFn: fetchBillingSummary,
    enabled: !!accessToken && !!userId,
  })
}

function useBillingMutation<TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<BillingSummary>
) {
  const queryClient = useQueryClient()
  const userId = useBillingUserId()

  return useMutation({
    mutationFn,
    onSuccess: (summary) => {
      queryClient.setQueryData(billingQueryKeys.summary(userId), summary)
    },
  })
}

export function useStartSubscription() {
  return useBillingMutation(startSubscription)
}

export function useCancelSubscription() {
  return useBillingMutation(cancelSubscription)
}

export function useResumeSubscription() {
  return useBillingMutation(() => resumeSubscription())
}

export function useRegisterBillingMethod() {
  return useBillingMutation(registerBillingMethod)
}

export function useChangeBillingMethod() {
  return useBillingMutation(changeBillingMethod)
}

/* 발행 신청은 요약·내역 데이터를 바꾸지 않으므로 캐시를 건드리지 않는다. */
export function useRequestTaxInvoice() {
  return useMutation({
    mutationFn: (orderId: number) => requestTaxInvoice(orderId),
  })
}

export function useDeleteBillingMethod() {
  return useBillingMutation(() => deleteBillingMethod())
}

export function usePurchaseCredits() {
  return useBillingMutation(purchaseCredits)
}

export function useExtendCreditBatch() {
  return useBillingMutation(extendCreditBatch)
}
