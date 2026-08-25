import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuthStore } from '@/shared/api/authStore'
import {
  cancelSubscription,
  changeBillingMethod,
  deleteBillingMethod,
  extendCreditBatch,
  fetchBillingSummary,
  purchaseCredits,
  registerBillingMethod,
  resumeSubscription,
  startSubscription,
} from '../api/billingApi'
import type { BillingSummary } from '../types'

export const billingQueryKeys = {
  summary: (userId: string | null) => ['billing', 'summary', userId] as const,
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

export function useDeleteBillingMethod() {
  return useBillingMutation(() => deleteBillingMethod())
}

export function usePurchaseCredits() {
  return useBillingMutation(purchaseCredits)
}

export function useExtendCreditBatch() {
  return useBillingMutation(extendCreditBatch)
}
