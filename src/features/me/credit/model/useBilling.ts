import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuthStore } from '@/shared/api/authStore'
import {
  cancelSubscription,
  deleteBillingMethod,
  extendCreditBatch,
  fetchBillingSummary,
  purchaseCredits,
  registerBillingMethod,
  refundCreditBatch,
  retrySubscriptionPayment,
  startSubscription,
} from '../api/billingApi'
import type { BillingSummary } from '../types'

export const billingQueryKeys = {
  summary: ['billing', 'summary'] as const,
}

export function useBillingSummary() {
  const accessToken = useAuthStore((state) => state.accessToken)

  return useQuery({
    queryKey: billingQueryKeys.summary,
    queryFn: fetchBillingSummary,
    enabled: !!accessToken,
  })
}

function useBillingMutation<TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<BillingSummary>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (summary) => {
      queryClient.setQueryData(billingQueryKeys.summary, summary)
    },
  })
}

export function useStartSubscription() {
  return useBillingMutation(startSubscription)
}

export function useCancelSubscription() {
  return useBillingMutation(() => cancelSubscription())
}

export function useRetrySubscriptionPayment() {
  return useBillingMutation(() => retrySubscriptionPayment())
}

export function useRegisterBillingMethod() {
  return useBillingMutation(registerBillingMethod)
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

export function useRefundCreditBatch() {
  return useBillingMutation(refundCreditBatch)
}
