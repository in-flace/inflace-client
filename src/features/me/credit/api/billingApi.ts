import { axiosInstance } from '@/shared/api'
import type { ApiResponse } from '@/shared/api/types'
import type {
  BillingSummary,
  CancelSubscriptionPayload,
  CreditBatchActionPayload,
  PurchaseCreditsPayload,
  RegisterBillingMethodPayload,
  StartSubscriptionPayload,
} from '../types'

export async function fetchBillingSummary(): Promise<BillingSummary> {
  const response =
    await axiosInstance.get<ApiResponse<BillingSummary>>('/billing/summary')
  return response.data.responseDto
}

export async function startSubscription(
  payload: StartSubscriptionPayload
): Promise<BillingSummary> {
  const response = await axiosInstance.post<ApiResponse<BillingSummary>>(
    '/billing/subscription',
    payload
  )
  return response.data.responseDto
}

export async function cancelSubscription(
  payload: CancelSubscriptionPayload
): Promise<BillingSummary> {
  const response = await axiosInstance.post<ApiResponse<BillingSummary>>(
    '/billing/subscription/cancel',
    payload
  )
  return response.data.responseDto
}

export async function retrySubscriptionPayment(): Promise<BillingSummary> {
  const response = await axiosInstance.post<ApiResponse<BillingSummary>>(
    '/billing/subscription/retry'
  )
  return response.data.responseDto
}

export async function registerBillingMethod(
  payload: RegisterBillingMethodPayload
): Promise<BillingSummary> {
  const response = await axiosInstance.post<ApiResponse<BillingSummary>>(
    '/billing/method',
    payload
  )
  return response.data.responseDto
}

export async function deleteBillingMethod(): Promise<BillingSummary> {
  const response =
    await axiosInstance.delete<ApiResponse<BillingSummary>>('/billing/method')
  return response.data.responseDto
}

export async function purchaseCredits(
  payload: PurchaseCreditsPayload
): Promise<BillingSummary> {
  const response = await axiosInstance.post<ApiResponse<BillingSummary>>(
    '/billing/credits/purchase',
    payload
  )
  return response.data.responseDto
}

export async function extendCreditBatch(
  payload: CreditBatchActionPayload
): Promise<BillingSummary> {
  const response = await axiosInstance.post<ApiResponse<BillingSummary>>(
    `/billing/credits/${payload.batchId}/extend`
  )
  return response.data.responseDto
}

export async function refundCreditBatch(
  payload: CreditBatchActionPayload
): Promise<BillingSummary> {
  const response = await axiosInstance.post<ApiResponse<BillingSummary>>(
    `/billing/credits/${payload.batchId}/refund`
  )
  return response.data.responseDto
}
