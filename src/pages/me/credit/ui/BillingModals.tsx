'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { isAxiosError } from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  beginBillingIntent,
  clearBillingIntent,
  createIdempotencyKey,
  CREDIT_CONFIRM_PENDING_MESSAGE,
  CreditPurchaseStatusError,
  getBillingErrorMessage,
  PortOnePaymentError,
  formatDate,
  formatWon,
  formatWonSuffix,
  getNextMonthlyBillingDate,
  issueCardBillingKey,
  useCancelSubscription,
  useChangeBillingMethod,
  useDeleteBillingMethod,
  useExtendCreditBatch,
  useBusinessInfo,
  usePurchaseCredits,
  useRefundCreditPurchase,
  useRequestCashReceipt,
  useRequestTaxInvoice,
  useSaveBusinessInfo,
  useRegisterBillingMethod,
  useCheckoutCredits,
  useConfirmCreditCheckout,
  useStartSubscription,
  requestOneTimeCardPayment,
  type BillingSummary,
  type BusinessInfo,
  type CreditPurchaseOption,
  type PaymentCustomer,
  type SubscriptionExitReason,
} from '@/features/me/credit'
import CheckIcon from '@/shared/assets/check-bold.svg'
import IconX from '@/shared/assets/x.svg'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/shadcn/dialog'
import { ModalContent } from './BillingPrimitives'
import { CancelReasonField, isCancelReasonComplete } from './CancelReasonField'
import {
  EMPTY_BUSINESS_INFO,
  EMPTY_PAYER_INFO,
  isBusinessInfoComplete,
  isPayerInfoComplete,
  type ModalState,
  type PayerInfo,
} from './billingPageTypes'

/* 포트원과 백엔드가 같은 값을 받아야 한다. 백엔드 phoneNumber 검증이
 * ^[0-9-]{10,13}$ 이므로 숫자만 남긴 값을 그대로 쓴다. */
function toPaymentCustomer(payerInfo: PayerInfo): PaymentCustomer {
  return {
    fullName: payerInfo.name.trim(),
    phoneNumber: payerInfo.phone.replace(/\D/g, ''),
    email: payerInfo.email.trim(),
  }
}

/* 결제창 호출 실패는 화면을 거의 덮는 모달 위에서 발생한다. 상단 토스트는
 * 모달에 시선이 묶인 사용자가 놓치기 쉬워 버튼 바로 위에 인라인으로 붙인다. */
function FormErrorNotice({ message }: { message: string | null }) {
  if (!message) return null

  return (
    <p
      role='alert'
      className='rounded-12 bg-[rgba(224,47,82,0.1)] px-16 py-12 text-noto-body-xs-normal text-feedback-error'>
      {message}
    </p>
  )
}

function AgreementCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}) {
  return (
    <button
      type='button'
      role='checkbox'
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className='flex w-full items-center gap-12 rounded-6 text-left focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2'>
      <span
        className={cn(
          'flex size-24 items-center justify-center rounded-6 border',
          checked
            ? 'border-brand-primary bg-brand-primary text-white'
            : 'border-stroke-border-gray-stronger bg-white text-transparent'
        )}>
        <CheckIcon className='size-16' />
      </span>
      <span className='text-noto-body-xs-normal text-text-and-icon-primary'>
        {children}
      </span>
    </button>
  )
}

export function BillingModals({
  modal,
  summary,
  onClose,
  onOpenModal,
}: {
  modal: ModalState
  summary: BillingSummary
  onClose: () => void
  onOpenModal: (modal: ModalState) => void
}) {
  const router = useRouter()
  const [agreedAutoPay, setAgreedAutoPay] = useState(false)
  const [agreedWithdrawalLimit, setAgreedWithdrawalLimit] = useState(false)
  const [cancelReason, setCancelReason] = useState<SubscriptionExitReason | ''>(
    ''
  )
  const [cancelReasonDetail, setCancelReasonDetail] = useState('')
  const [selectedOptionId, setSelectedOptionId] = useState(
    summary.creditOptions[1]?.id ?? summary.creditOptions[0]?.id ?? ''
  )
  const [paymentMethod, setPaymentMethod] = useState<
    'registeredCard' | 'oneTime'
  >(() =>
    summary.billingMethod.status === 'registered' ? 'registeredCard' : 'oneTime'
  )
  const [isPaymentWindowPending, setIsPaymentWindowPending] = useState(false)
  const [payerInfo, setPayerInfo] = useState<PayerInfo>(EMPTY_PAYER_INFO)
  const [formError, setFormError] = useState<string | null>(null)
  const [businessInfo, setBusinessInfo] =
    useState<BusinessInfo>(EMPTY_BUSINESS_INFO)
  const queryClient = useQueryClient()
  const startSubscriptionMutation = useStartSubscription()
  const cancelSubscriptionMutation = useCancelSubscription()
  const registerBillingMethodMutation = useRegisterBillingMethod()
  const changeBillingMethodMutation = useChangeBillingMethod()
  const deleteBillingMethodMutation = useDeleteBillingMethod()
  const purchaseCreditsMutation = usePurchaseCredits()
  const checkoutCreditsMutation = useCheckoutCredits()
  const confirmCreditCheckoutMutation = useConfirmCreditCheckout()
  const extendCreditBatchMutation = useExtendCreditBatch()
  const refundCreditPurchaseMutation = useRefundCreditPurchase()
  const requestTaxInvoiceMutation = useRequestTaxInvoice()
  const requestCashReceiptMutation = useRequestCashReceipt()
  const saveBusinessInfoMutation = useSaveBusinessInfo()

  /* 폼을 열 때만 조회한다. 이미 등록한 정보가 있으면 채워준다. */
  const businessInfoQuery = useBusinessInfo(modal?.type === 'businessInfo')
  const savedBusinessInfo = businessInfoQuery.data ?? null
  const [syncedBusinessInfo, setSyncedBusinessInfo] =
    useState<BusinessInfo | null>(null)
  if (savedBusinessInfo && savedBusinessInfo !== syncedBusinessInfo) {
    setSyncedBusinessInfo(savedBusinessInfo)
    setBusinessInfo(savedBusinessInfo)
  }

  const handleClose = () => {
    /* PC에서 결제창을 취소하고 다시 열린 모달을 닫는 경우처럼, 쓰이지 않고
     * 남은 결제 의도를 정리한다. 이름·연락처가 들어 있어 오래 두지 않는다. */
    clearBillingIntent()
    setAgreedAutoPay(false)
    setAgreedWithdrawalLimit(false)
    setCancelReason('')
    setCancelReasonDetail('')
    setPayerInfo(EMPTY_PAYER_INFO)
    setBusinessInfo(EMPTY_BUSINESS_INFO)
    setSyncedBusinessInfo(null)
    setFormError(null)
    setSelectedOptionId(
      summary.creditOptions[1]?.id ?? summary.creditOptions[0]?.id ?? ''
    )
    setPaymentMethod(
      summary.billingMethod.status === 'registered'
        ? 'registeredCard'
        : 'oneTime'
    )
    onClose()
  }

  const selectedOption =
    summary.creditOptions.find((option) => option.id === selectedOptionId) ??
    summary.creditOptions[0]

  return (
    <Dialog
      open={!!modal}
      onOpenChange={(open) => {
        /* 결제 결과를 확인하는 동안 닫히면 버튼을 다시 눌러 중복 요청이 난다 */
        if (!open && modal?.type !== 'billingReturnPending') handleClose()
      }}>
      {modal?.type === 'billingReturnPending' && (
        <ModalContent
          title='결제 결과를 확인하고 있어요'
          description='잠시만 기다려주세요. 확인이 끝날 때까지 화면을 닫지 마세요.'
          className='sm:w-[50rem]'>
          <p role='status' aria-live='polite' className='sr-only'>
            결제 결과를 확인하는 중입니다.
          </p>
        </ModalContent>
      )}
      {modal?.type === 'billingReturnFailed' &&
        (modal.retry ? (
          <ConfirmModal
            title={modal.title}
            description={modal.message}
            confirmText='다시 시도'
            isPending={false}
            onCancel={handleClose}
            onConfirm={async () => modal.retry?.()}
          />
        ) : (
          <NoticeModal
            title={modal.title}
            description={modal.message}
            buttonText='확인'
            onConfirm={handleClose}
          />
        ))}
      {modal?.type === 'subscribe' && (
        <ModalContent
          title='구독 시작하기'
          className='sm:w-[min(67.8rem,calc(100vw-4.8rem))]'>
          <div className='mt-32 flex flex-col gap-32'>
            <div className='flex flex-col gap-8'>
              <div className='rounded-12 bg-background-gray-default p-20'>
                <strong className='block text-noto-title-sm-bold text-text-and-icon-default'>
                  {formatWonSuffix(modal.plan.price)}
                </strong>
                <span className='mt-6 block text-noto-body-sm-normal text-text-and-icon-secondary'>
                  매월 자동 결제 · 다음 결제일{' '}
                  {getNextMonthlyBillingDate(new Date())}
                </span>
              </div>
              {/* 시안은 카드 등록을 결제와 나눴다. 등록·변경을 마치면 이 모달로
               * 돌아와 결제하기를 누른다. 모바일 결제창을 다녀오는 동안 구독
               * 결제까지 이어 붙이지 않아도 되어 흐름이 단순해진다. */}
              <div className='flex items-center justify-between gap-12 rounded-12 bg-background-gray-default px-20 py-16'>
                <span className='min-w-0 text-noto-body-sm-normal text-text-and-icon-primary'>
                  {summary.billingMethod.status === 'registered'
                    ? `결제 수단: •••• •••• •••• ${summary.billingMethod.last4 ?? ''}`
                    : '결제 수단을 등록하세요.'}
                </span>
                <Button
                  type='button'
                  color='secondary'
                  size='xs'
                  variant='outlined'
                  onClick={() => {
                    setFormError(null)
                    onOpenModal(
                      summary.billingMethod.status === 'registered'
                        ? { type: 'billingChange', pendingPlan: modal.plan }
                        : { type: 'billingRegister', pendingPlan: modal.plan }
                    )
                  }}
                  className='shrink-0'>
                  {summary.billingMethod.status === 'registered'
                    ? '변경'
                    : '등록'}
                </Button>
              </div>
            </div>
            <div className='flex flex-col gap-16'>
              <AgreementCheckbox
                checked={agreedAutoPay}
                onChange={setAgreedAutoPay}>
                매월 자동 갱신·자동 결제에 동의합니다. (필수)
              </AgreementCheckbox>
              <AgreementCheckbox
                checked={agreedWithdrawalLimit}
                onChange={setAgreedWithdrawalLimit}>
                결제 즉시 서비스가 제공되며, 이 경우 청약철회가 제한될 수 있음을
                확인합니다. (필수)
              </AgreementCheckbox>
            </div>
            <div className='flex flex-col gap-12'>
              <Button
                type='button'
                color='primary'
                size='lg'
                variant='filled'
                disabled={
                  summary.billingMethod.status !== 'registered' ||
                  !agreedAutoPay ||
                  !agreedWithdrawalLimit ||
                  startSubscriptionMutation.isPending ||
                  isPaymentWindowPending
                }
                onClick={async () => {
                  setIsPaymentWindowPending(true)
                  try {
                    await startSubscriptionMutation.mutateAsync({
                      idempotencyKey: createIdempotencyKey(),
                      payload: {
                        planCode: modal.plan.code,
                      },
                    })
                    onOpenModal({ type: 'subscribeDone' })
                  } catch (error) {
                    toast.error(getBillingErrorMessage(error, 'subscribe'))
                  } finally {
                    setIsPaymentWindowPending(false)
                  }
                }}
                className='h-44 w-full'>
                결제하기
              </Button>
              <p className='text-center text-noto-body-xs-normal text-text-and-icon-secondary'>
                회원 본인은 주문내용을 확인했으며,{' '}
                {/* 모달 상태를 잃지 않게 새 탭으로 연다 */}
                <Link
                  href='/terms'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='font-bold underline underline-offset-2'>
                  이용약관
                </Link>{' '}
                및{' '}
                <Link
                  href='/privacy'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='font-bold underline underline-offset-2'>
                  개인정보처리방침
                </Link>
                과 결제에 동의합니다.
              </p>
            </div>
          </div>
        </ModalContent>
      )}
      {modal?.type === 'subscribeDone' && (
        <NoticeModal
          title='구독이 시작되었습니다'
          description={`구독 시작일 ${formatDate(summary.subscription.startedAt)} · 다음 결제일 ${formatDate(summary.subscription.nextPaymentDate)} · 크레딧 ${summary.subscription.includedMonthlyCredits}개 지급 완료`}
          buttonText='확인'
          onConfirm={handleClose}
        />
      )}
      {modal?.type === 'cancelReason' && (
        <ModalContent
          title='해지 사유를 알려주세요'
          description='소중한 피드백은 서비스 개선에 활용됩니다'
          className='sm:w-[50rem]'>
          <div className='mt-32 flex flex-col gap-32'>
            <CancelReasonField
              reason={cancelReason}
              detail={cancelReasonDetail}
              onReasonChange={setCancelReason}
              onDetailChange={setCancelReasonDetail}
            />
            <div className='grid grid-cols-2 gap-12'>
              <Button
                type='button'
                color='gray'
                size='lg'
                variant='filled'
                onClick={handleClose}
                className='h-44 w-full'>
                취소
              </Button>
              <Button
                type='button'
                color='secondary'
                size='lg'
                variant='filled'
                disabled={
                  !isCancelReasonComplete(cancelReason, cancelReasonDetail)
                }
                onClick={() => {
                  onOpenModal({ type: 'cancelNotice' })
                }}
                className='h-44 w-full'>
                다음
              </Button>
            </div>
          </div>
        </ModalContent>
      )}
      {modal?.type === 'cancelNotice' && (
        <ModalContent title='해지 전 꼭 확인하세요' className='sm:w-[50rem]'>
          <div className='mt-32 flex flex-col gap-32'>
            <ul className='flex list-disc flex-col gap-4 pl-20 text-noto-body-sm-normal text-text-and-icon-secondary'>
              <li>
                다음 결제일
                {summary.subscription.nextPaymentDate
                  ? `(${formatDate(summary.subscription.nextPaymentDate)})`
                  : ''}
                까지는 계속 이용할 수 있어요.
              </li>
              <li>월 제공 크레딧은 해지 시 소멸됩니다.</li>
              <li>구매한 크레딧은 유효기간까지 그대로 유지됩니다.</li>
            </ul>
            <div className='grid grid-cols-2 gap-12'>
              <Button
                type='button'
                color='gray'
                size='lg'
                variant='filled'
                onClick={handleClose}
                className='h-44 w-full'>
                취소
              </Button>
              <Button
                type='button'
                color='secondary'
                size='lg'
                variant='filled'
                onClick={() => onOpenModal({ type: 'cancelConfirm' })}
                className='h-44 w-full'>
                다음
              </Button>
            </div>
          </div>
        </ModalContent>
      )}
      {modal?.type === 'cancelConfirm' && (
        <ModalContent
          title='정말 해지하시겠어요?'
          description='해지 후에도 결제 완료된 기간까지는 서비스를 이용할 수 있습니다.'
          className='sm:w-[50rem]'>
          <div className='mt-32 grid grid-cols-2 gap-12'>
            <Button
              type='button'
              color='gray'
              size='lg'
              variant='filled'
              onClick={handleClose}
              className='h-44 w-full'>
              취소
            </Button>
            <Button
              type='button'
              color='secondary'
              size='lg'
              variant='filled'
              disabled={
                cancelSubscriptionMutation.isPending ||
                !isCancelReasonComplete(cancelReason, cancelReasonDetail)
              }
              onClick={async () => {
                /* 버튼이 막고 있지만 타입상 사유가 확정됐음을 여기서 좁힌다 */
                if (!isCancelReasonComplete(cancelReason, cancelReasonDetail)) {
                  return
                }
                try {
                  await cancelSubscriptionMutation.mutateAsync({
                    reason: cancelReason,
                    /* 서버는 기타일 때만 직접 입력을 요구한다. 다른 사유에
                     * 남아 있는 입력은 보내지 않는다. */
                    reasonDetail:
                      cancelReason === 'OTHER'
                        ? cancelReasonDetail.trim()
                        : undefined,
                  })
                  onOpenModal({ type: 'cancelDone' })
                } catch (error) {
                  toast.error(
                    getBillingErrorMessage(error, 'cancelSubscription')
                  )
                }
              }}
              className='h-44 w-full'>
              해지하기
            </Button>
          </div>
        </ModalContent>
      )}
      {modal?.type === 'cancelDone' && (
        <NoticeModal
          title='해지가 완료되었습니다.'
          buttonText='홈으로 이동하기'
          onConfirm={() => {
            handleClose()
            router.push('/')
          }}
        />
      )}
      {modal?.type === 'billingRegister' && (
        <ModalContent
          title='본인 정보를 입력해주세요.'
          description='입력한 정보를 기반으로 카드 등록을 시작합니다.'
          className='sm:w-[50rem]'>
          <div className='mt-32 flex flex-col gap-32'>
            <PayerInfoFields value={payerInfo} onChange={setPayerInfo} />
            <div className='flex flex-col gap-12'>
              <div className='flex flex-col gap-4'>
                <h3 className='text-noto-title-sm-bold text-text-and-icon-default'>
                  결제수단을 등록하세요.
                </h3>
                <p className='text-noto-body-xs-normal text-text-and-icon-secondary'>
                  포트원 결제창을 호출해 카드를 등록하고 빌링키를 발급합니다.
                </p>
              </div>
              <div className='rounded-16 bg-background-gray-default p-20 text-noto-body-sm-normal text-text-and-icon-primary'>
                카드 등록 시뮬레이션: •••• •••• •••• 5588
              </div>
            </div>
            <FormErrorNotice message={formError} />
            <div className='grid grid-cols-2 gap-12'>
              <Button
                type='button'
                color='gray'
                size='lg'
                variant='filled'
                onClick={handleClose}
                className='h-44 w-full'>
                취소
              </Button>
              <Button
                type='button'
                color='secondary'
                size='lg'
                variant='filled'
                disabled={
                  !isPayerInfoComplete(payerInfo) ||
                  registerBillingMethodMutation.isPending ||
                  changeBillingMethodMutation.isPending ||
                  isPaymentWindowPending
                }
                onClick={async () => {
                  /* 모달이 열려 있으면 Radix Dialog가 body의 pointer-events를
                   * 잠그고 포커스를 가두는 탓에, body에 iframe으로 붙는 결제창에
                   * 클릭·입력이 닿지 않는다. 호출 전에 닫아 간섭을 없앤다.
                   * 닫은 뒤에도 쓸 값은 미리 지역 변수로 확보한다. */
                  const { pendingPlan, replacing } = modal
                  const customer = toPaymentCustomer(payerInfo)
                  const pendingPlanCode = pendingPlan?.code ?? null

                  setFormError(null)
                  setIsPaymentWindowPending(true)
                  onClose()
                  /* 모바일 결제창은 페이지를 통째로 이동시켜 아래 코드가 이어지지
                   * 않는다. 돌아와서 이어갈 수 있게 결제창을 열기 전에 남긴다.
                   * 등록과 교체는 같은 주소로 돌아오므로 흐름을 함께 남긴다. */
                  beginBillingIntent(
                    replacing
                      ? { flow: 'changeBillingMethod', pendingPlanCode }
                      : {
                          flow: 'registerBillingMethod',
                          payer: customer,
                          pendingPlanCode,
                        }
                  )

                  try {
                    const { billingKey } = await issueCardBillingKey({
                      issueName: replacing
                        ? '인플레이스 결제수단 변경'
                        : '인플레이스 결제수단 등록',
                      customer,
                    })
                    /* 결제창이 이 페이지에서 결과를 돌려줬다면 리디렉션은 없었다(PC).
                     * 남긴 의도는 쓸 곳이 없으니 지운다. finally에서 지우지 않는
                     * 이유는, 모바일에서 SDK가 페이지를 떠나며 결과 없이 끝나도
                     * 그 경로를 타서 돌아와 쓸 의도까지 지워버리기 때문이다. */
                    clearBillingIntent()

                    if (replacing) {
                      await changeBillingMethodMutation.mutateAsync({
                        billingKey,
                      })
                      onOpenModal({ type: 'billingChanged', pendingPlan })
                      return
                    }

                    await registerBillingMethodMutation.mutateAsync({
                      idempotencyKey: createIdempotencyKey(),
                      payload: {
                        billingKey,
                        name: customer.fullName,
                        phoneNumber: customer.phoneNumber,
                        email: customer.email,
                      },
                    })
                    onOpenModal({ type: 'billingRegistered', pendingPlan })
                  } catch (error) {
                    clearIntentUnlessLeaving(error)
                    /* 모달을 닫아둔 상태라 인라인으로 보여줄 자리가 없다.
                     * 입력값이 남아 있는 모달을 다시 열어 에러와 함께 보여준다. */
                    setFormError(
                      getBillingErrorMessage(
                        error,
                        replacing
                          ? 'changeBillingMethod'
                          : 'registerBillingMethod'
                      )
                    )
                    onOpenModal({
                      type: 'billingRegister',
                      pendingPlan,
                      replacing,
                    })
                  } finally {
                    setIsPaymentWindowPending(false)
                  }
                }}
                className='h-44 w-full'>
                {isPaymentWindowPending ? '등록 중…' : '등록하기'}
              </Button>
            </div>
          </div>
        </ModalContent>
      )}
      {modal?.type === 'billingChange' && (
        <ModalContent
          title='결제수단 변경하기'
          description='새 카드로 포트원 결제창을 호출해 빌링키를 재발급합니다. 기존 빌링키는 교체 후 폐기됩니다.'
          className='sm:w-[50rem]'>
          <div className='mt-32 flex flex-col gap-32'>
            <div className='rounded-16 bg-background-gray-default p-20 text-noto-body-sm-normal text-text-and-icon-primary'>
              카드 등록 시뮬레이션: •••• •••• •••• 5588
            </div>
            {/* 시안은 변경을 두 단계로 나눴다. 새 카드 정보는 등록과 같은 폼에서
             * 받고, 그 폼이 교체까지 마친다. */}
            <Button
              type='button'
              color='secondary'
              size='lg'
              variant='filled'
              onClick={() => {
                setFormError(null)
                onOpenModal({
                  type: 'billingRegister',
                  pendingPlan: modal.pendingPlan,
                  replacing: true,
                })
              }}
              className='h-44 w-full'>
              새 카드 등록하기
            </Button>
          </div>
        </ModalContent>
      )}
      {modal?.type === 'billingRegistered' && (
        <NoticeModal
          title='결제수단이 등록되었습니다'
          description={describeNewCard(summary.billingMethod.last4)}
          buttonText='확인'
          onConfirm={() =>
            modal.pendingPlan
              ? onOpenModal({ type: 'subscribe', plan: modal.pendingPlan })
              : handleClose()
          }
        />
      )}
      {modal?.type === 'billingChanged' && (
        <NoticeModal
          title='결제수단이 변경되었습니다'
          description={describeNewCard(summary.billingMethod.last4)}
          buttonText='확인'
          onConfirm={() =>
            modal.pendingPlan
              ? onOpenModal({ type: 'subscribe', plan: modal.pendingPlan })
              : handleClose()
          }
        />
      )}
      {modal?.type === 'billingDelete' && (
        <ModalContent title='결제수단을 삭제할까요?' className='sm:w-[50rem]'>
          <div className='mt-32 flex flex-col gap-32'>
            <p className='text-noto-body-sm-normal text-text-and-icon-secondary'>
              삭제 시 등록된 빌링키가 폐기됩니다. 구독 중이라면 다음 결제 전 새
              카드를 등록해야 자동결제가 유지됩니다.
            </p>
            <div className='grid grid-cols-2 gap-12'>
              <Button
                type='button'
                color='gray'
                size='lg'
                variant='filled'
                onClick={handleClose}
                className='h-44 w-full'>
                취소
              </Button>
              <Button
                type='button'
                color='secondary'
                size='lg'
                variant='filled'
                disabled={deleteBillingMethodMutation.isPending}
                onClick={async () => {
                  try {
                    const last4 = summary.billingMethod.last4
                    await deleteBillingMethodMutation.mutateAsync()
                    onOpenModal({ type: 'billingDeleted', last4 })
                  } catch (error) {
                    toast.error(
                      getBillingErrorMessage(error, 'deleteBillingMethod')
                    )
                  }
                }}
                className='h-44 w-full bg-feedback-error'>
                삭제하기
              </Button>
            </div>
          </div>
        </ModalContent>
      )}
      {modal?.type === 'billingDeleted' && (
        <NoticeModal
          title='결제 수단이 삭제되었습니다'
          description={
            modal.last4
              ? `카드 ···· ···· ···· ${withSubjectParticle(modal.last4)} 결제수단에서 삭제되었습니다.`
              : '카드가 결제수단에서 삭제되었습니다.'
          }
          buttonText='확인'
          onConfirm={handleClose}
        />
      )}
      {modal?.type === 'creditPurchase' && selectedOption && (
        <ModalContent
          title='구매할 크레딧을 선택하세요'
          description='1크레딧당 경쟁 채널 분석 1회 제공'
          className='sm:w-[min(100rem,calc(100vw-4.8rem))]'>
          <div className='mt-32 flex flex-col gap-32'>
            <div className='grid grid-cols-1 gap-24 md:grid-cols-3 md:gap-16'>
              {summary.creditOptions.map((option) => (
                <CreditOptionCard
                  key={option.id}
                  option={option}
                  selected={option.id === selectedOptionId}
                  onSelect={() => setSelectedOptionId(option.id)}
                />
              ))}
            </div>
            <div className='flex flex-col gap-12'>
              <span className='text-noto-body-xs-bold text-text-and-icon-primary'>
                본인 정보를 입력해주세요.
              </span>
              <PayerInfoFields
                value={payerInfo}
                onChange={setPayerInfo}
                layout='inline'
              />
            </div>
            <div className='flex flex-col gap-12'>
              <span className='text-noto-body-xs-bold text-text-and-icon-primary'>
                결제 수단을 선택하세요
              </span>
              <div className='grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-32'>
                <PaymentChoice
                  disabled={summary.billingMethod.status === 'none'}
                  selected={
                    summary.billingMethod.status === 'registered' &&
                    paymentMethod === 'registeredCard'
                  }
                  onSelect={() => setPaymentMethod('registeredCard')}
                  title={
                    summary.billingMethod.status === 'registered'
                      ? '등록 카드로 즉시 구매'
                      : '등록된 결제수단이 없습니다'
                  }
                  description={
                    summary.billingMethod.status === 'registered'
                      ? `···· ···· ···· ${summary.billingMethod.last4} · 카드 재입력 없음`
                      : '등록된 결제수단이 없어 원클릭 구매를 이용할 수 없습니다.'
                  }
                  actionLabel={
                    summary.billingMethod.status === 'none'
                      ? '결제수단 등록하러 가기'
                      : undefined
                  }
                  onAction={
                    summary.billingMethod.status === 'none'
                      ? () => onOpenModal({ type: 'billingRegister' })
                      : undefined
                  }
                />
                <PaymentChoice
                  selected={paymentMethod === 'oneTime'}
                  onSelect={() => setPaymentMethod('oneTime')}
                  title='다른 결제수단으로 구매'
                  description='인증결제(1회성 결제창) · 매번 카드 정보 입력'
                />
              </div>
            </div>
            <Button
              type='button'
              color='primary'
              size='lg'
              variant='filled'
              disabled={
                (paymentMethod === 'registeredCard' &&
                  summary.billingMethod.status !== 'registered') ||
                (paymentMethod === 'oneTime' && !isPayerInfoComplete(payerInfo))
              }
              onClick={() =>
                onOpenModal({
                  type: 'creditConfirm',
                  option: selectedOption,
                  paymentMethod,
                })
              }
              className='h-44 w-full'>
              결제 내역 확인하기
            </Button>
          </div>
        </ModalContent>
      )}
      {modal?.type === 'creditConfirm' && (
        <ModalContent title='결제 내역' className='sm:w-[50rem]'>
          <button
            type='button'
            onClick={handleClose}
            aria-label='닫기'
            className='absolute top-24 right-24 flex size-24 cursor-pointer items-center justify-center text-text-and-icon-default sm:top-40 sm:right-40'>
            <IconX aria-hidden='true' className='size-24' />
          </button>
          <div className='mt-32 flex flex-col gap-32'>
            <dl className='flex flex-col gap-12 rounded-12 bg-background-gray-default p-20 text-noto-body-sm-normal'>
              <div className='flex justify-between gap-12'>
                <dt className='text-text-and-icon-secondary'>상품</dt>
                <dd className='text-text-and-icon-primary'>
                  {modal.option.credits} 크레딧
                </dd>
              </div>
              <div className='flex justify-between gap-12'>
                <dt className='text-text-and-icon-secondary'>결제 금액</dt>
                <dd className='text-text-and-icon-primary'>
                  {formatWonSuffix(modal.option.price)}
                </dd>
              </div>
              <div className='flex justify-between gap-12'>
                <dt className='text-text-and-icon-secondary'>결제 수단</dt>
                <dd className='text-text-and-icon-primary'>
                  {modal.paymentMethod === 'registeredCard'
                    ? `등록 카드 ···· ${summary.billingMethod.last4 ?? ''}`
                    : '다른 결제수단 (1회성 결제창)'}
                </dd>
              </div>
            </dl>
            <FormErrorNotice message={formError} />
            <div className='grid grid-cols-2 gap-12'>
              <Button
                type='button'
                color='gray'
                size='lg'
                variant='filled'
                onClick={() => {
                  setFormError(null)
                  /* 선택한 상품·결제수단·입력값은 그대로 남아 있다 */
                  onOpenModal({ type: 'creditPurchase' })
                }}
                className='h-44 w-full'>
                뒤로가기
              </Button>
              <Button
                type='button'
                color='secondary'
                size='lg'
                variant='filled'
                disabled={
                  purchaseCreditsMutation.isPending ||
                  checkoutCreditsMutation.isPending ||
                  confirmCreditCheckoutMutation.isPending ||
                  isPaymentWindowPending
                }
                onClick={async () => {
                  const option = modal.option
                  const method = modal.paymentMethod
                  const customer = toPaymentCustomer(payerInfo)

                  setFormError(null)
                  setIsPaymentWindowPending(true)

                  try {
                    if (method === 'registeredCard') {
                      await purchaseCreditsMutation.mutateAsync({
                        idempotencyKey: createIdempotencyKey(),
                        payload: { optionId: option.id, paymentMethod: method },
                      })
                      toast.success('크레딧 구매가 완료되었습니다.')
                      handleClose()
                      return
                    }

                    /* 서버가 주문을 먼저 만들고 결제창에 넘길 값을 준다. */
                    const checkout = await checkoutCreditsMutation.mutateAsync({
                      idempotencyKey: createIdempotencyKey(),
                      payload: { optionId: option.id },
                    })

                    /* 결제창은 모달이 열려 있으면 입력이 닿지 않는다.
                     * 빌링키 발급과 같은 이유로 호출 직전에 닫는다. */
                    onClose()
                    /* 돌아와서 결제 결과를 물을 주문 번호를 남긴다. 포트원은
                     * 복귀할 때 결제 ID만 주고 주문 번호는 주지 않는다. */
                    beginBillingIntent({
                      flow: 'creditCheckout',
                      orderId: checkout.orderId,
                    })

                    await requestOneTimeCardPayment({
                      paymentId: checkout.paymentId,
                      orderName: checkout.orderName,
                      totalAmount: checkout.amount,
                      customer,
                    })
                    clearBillingIntent()

                    await confirmCreditCheckoutMutation.mutateAsync(
                      checkout.orderId
                    )
                    toast.success('크레딧 구매가 완료되었습니다.')
                    handleClose()
                  } catch (error) {
                    clearIntentUnlessLeaving(error)
                    /* 결제는 됐는데 확인만 늦는 경우다. 서버가 웹훅으로 확정하므로
                     * 구매하기 버튼이 있는 모달을 다시 열면 이중 결제를 부른다. */
                    if (
                      error instanceof CreditPurchaseStatusError &&
                      error.code === 'CREDIT_PURCHASE_PENDING'
                    ) {
                      void queryClient.invalidateQueries({
                        queryKey: ['billing'],
                      })
                      handleClose()
                      toast.info(CREDIT_CONFIRM_PENDING_MESSAGE)
                      return
                    }

                    /* 결제창 단계에서 모달을 닫았으므로 다시 열어 보여준다. */
                    setFormError(
                      getBillingErrorMessage(error, 'purchaseCredits')
                    )
                    onOpenModal({
                      type: 'creditConfirm',
                      option,
                      paymentMethod: method,
                    })
                  } finally {
                    setIsPaymentWindowPending(false)
                  }
                }}
                className='h-44 w-full'>
                {isPaymentWindowPending ? '결제 확인 중…' : '구매하기'}
              </Button>
            </div>
          </div>
        </ModalContent>
      )}
      {modal?.type === 'creditExtend' && (
        <ConfirmModal
          title='유효기간을 연장할까요?'
          description='이 크레딧 배치는 만료일자 기준 3개월 연장됩니다. 연장은 배치당 1회만 가능합니다.'
          confirmText='연장하기'
          isPending={extendCreditBatchMutation.isPending}
          onCancel={handleClose}
          onConfirm={async () => {
            const beforeExpiryDate = modal.batch.expiryDate
            try {
              /* 연장 API는 본문을 주지 않아 바뀐 만료일을 알 수 없다.
               * 갱신된 요약에서 같은 배치를 찾아 새 만료일을 읽는다. */
              const updated = await extendCreditBatchMutation.mutateAsync({
                batchId: modal.batch.id,
              })
              const afterExpiryDate =
                updated.creditBatches.find(
                  (batch) => batch.id === modal.batch.id
                )?.expiryDate ?? beforeExpiryDate
              onOpenModal({
                type: 'creditExtended',
                beforeExpiryDate,
                afterExpiryDate,
              })
            } catch (error) {
              toast.error(getBillingErrorMessage(error, 'extendCredits'))
            }
          }}
        />
      )}
      {modal?.type === 'creditExtended' && (
        <NoticeModal
          title='유효기간 연장 완료되었습니다.'
          description={`유효기간이 ${formatDate(modal.beforeExpiryDate)} 에서 ${formatDate(modal.afterExpiryDate)} 으로 변경되었습니다.`}
          buttonText='확인'
          onConfirm={handleClose}
        />
      )}
      {modal?.type === 'creditRefund' && (
        <ModalContent title='환불 전 꼭 확인하세요' className='sm:w-[51.2rem]'>
          <div className='mt-32 flex flex-col gap-32'>
            <ul className='flex list-disc flex-col gap-4 pl-20 text-noto-body-sm-normal text-text-and-icon-secondary'>
              <li>결제한 수단으로 환불이 진행됩니다.</li>
              <li>
                환불 완료 후 최종 입금까지 영업일 기준 최대 7일이 소요됩니다.
              </li>
              <li>환불 신청 후 취소가 불가능하오니 신중하게 결정해 주세요.</li>
            </ul>
            <div className='grid grid-cols-2 gap-12'>
              <Button
                type='button'
                color='gray'
                size='lg'
                variant='filled'
                onClick={handleClose}
                className='h-44 w-full'>
                취소
              </Button>
              <Button
                type='button'
                color='secondary'
                size='lg'
                variant='filled'
                onClick={() =>
                  onOpenModal({
                    type: 'creditRefundConfirm',
                    batch: modal.batch,
                  })
                }
                className='h-44 w-full'>
                다음
              </Button>
            </div>
          </div>
        </ModalContent>
      )}
      {modal?.type === 'creditRefundConfirm' && (
        <ConfirmModal
          title='정말 환불하시겠어요?'
          description='환불 신청 후 취소가 불가능하오니 신중하게 결정해 주세요.'
          confirmText='환불하기'
          isPending={refundCreditPurchaseMutation.isPending}
          onCancel={handleClose}
          onConfirm={async () => {
            /* 구매하지 않은(구독 지급) 배치는 주문이 없어 환불 대상이 아니다.
             * 버튼에서 이미 막지만 여기서도 확인한다. */
            if (modal.batch.orderId === null) {
              onOpenModal({ type: 'creditRefundDenied' })
              return
            }
            try {
              await refundCreditPurchaseMutation.mutateAsync({
                idempotencyKey: createIdempotencyKey(),
                payload: { orderId: modal.batch.orderId },
              })
              onOpenModal({ type: 'creditRefunded' })
            } catch (error) {
              /* 7일 경과·사용분은 버튼 단계에서 다 알 수 없다(사용 여부는
               * 서버만 안다). 서버가 거절하면 시안의 환불 불가 안내를 띄운다. */
              if (
                isAxiosError(error) &&
                error.response?.data?.error?.code ===
                  'CREDIT_REFUND_409_NOT_ALLOWED'
              ) {
                onOpenModal({ type: 'creditRefundDenied' })
                return
              }
              toast.error(getBillingErrorMessage(error, 'refundCredits'))
            }
          }}
        />
      )}
      {modal?.type === 'creditRefunded' && (
        <NoticeModal
          title='환불이 완료되었습니다.'
          buttonText='홈으로 이동하기'
          onConfirm={() => {
            handleClose()
            router.push('/')
          }}
        />
      )}
      {modal?.type === 'creditRefundDenied' && (
        <NoticeModal
          title='환불이 불가능합니다'
          description='회사의 이용약관에 따라 환불 시점이 결제 후 7일 이내이며, 해당 결제 지급분 미사용했을 시에만 환불할 수 있습니다.'
          buttonText='확인'
          onConfirm={handleClose}
        />
      )}
      {modal?.type === 'businessInfo' && (
        <ModalContent
          title={`${modal.documentType} 신청`}
          description='영업일 기준 7일 이내 발급되며, 등록된 이메일로 발송됩니다.'
          className='sm:w-[50rem]'>
          <div className='mt-32 flex flex-col gap-32'>
            <BusinessInfoFields
              value={businessInfo}
              onChange={setBusinessInfo}
            />
            <FormErrorNotice message={formError} />
            <Button
              type='button'
              color='secondary'
              size='lg'
              variant='filled'
              disabled={
                !isBusinessInfoComplete(businessInfo) ||
                saveBusinessInfoMutation.isPending ||
                requestTaxInvoiceMutation.isPending ||
                requestCashReceiptMutation.isPending
              }
              onClick={async () => {
                const { orderId, documentType } = modal
                setFormError(null)
                try {
                  /* 발행은 저장된 사업자 정보를 쓰므로 먼저 저장한다.
                   * 값 정리는 API 계층이 맡는다. */
                  await saveBusinessInfoMutation.mutateAsync(businessInfo)

                  if (documentType === '세금계산서') {
                    await requestTaxInvoiceMutation.mutateAsync(orderId)
                    onOpenModal({ type: 'taxInvoiceRequested' })
                    return
                  }

                  /* 사업자등록번호를 함께 받으므로 지출증빙으로 신청한다. */
                  await requestCashReceiptMutation.mutateAsync({
                    orderId,
                    receiptType: 'CORPORATE',
                  })
                  onOpenModal({ type: 'cashReceiptRequested' })
                } catch (error) {
                  setFormError(
                    getBillingErrorMessage(
                      error,
                      documentType === '세금계산서'
                        ? 'issueTaxInvoice'
                        : 'issueCashReceipt'
                    )
                  )
                }
              }}
              className='h-44 w-full'>
              신청하기
            </Button>
          </div>
        </ModalContent>
      )}
      {modal?.type === 'cashReceiptRequested' && (
        <NoticeModal
          title='현금영수증 신청 완료'
          description='영업일 기준 7일 이내 발급되며, 등록된 이메일로 발송됩니다.'
          buttonText='확인'
          onConfirm={handleClose}
        />
      )}
      {modal?.type === 'taxInvoiceRequested' && (
        <NoticeModal
          title='세금계산서 신청 완료'
          description='영업일 기준 7일 이내 발급되며, 등록된 이메일로 발송됩니다.'
          buttonText='확인'
          onConfirm={handleClose}
        />
      )}
      {modal?.type === 'document' && (
        <NoticeModal
          title={`${modal.documentType} 조회`}
          description={`${modal.item.title} 결제 건의 ${modal.documentType} 발급 정보는 결제 대행사 연동 후 제공됩니다.`}
          buttonText='확인'
          onConfirm={handleClose}
        />
      )}
    </Dialog>
  )
}

/* 결제창이 오류 코드와 함께 이 페이지로 결과를 돌려줬다면 리디렉션은 없었다.
 * 남긴 결제 의도는 쓸 곳이 없으니 지운다. 응답 없이 끝난 경우(PAYMENT_CANCELLED)만
 * 모바일 결제창이 페이지를 떠나는 중일 수 있어, 돌아와서 쓸 수 있게 남긴다. */
function clearIntentUnlessLeaving(error: unknown) {
  if (
    error instanceof PortOnePaymentError &&
    error.code === 'PAYMENT_CANCELLED'
  ) {
    return
  }
  clearBillingIntent()
}

/* 카드 끝자리 뒤의 조사. 숫자를 한국어로 읽었을 때 받침이 있으면 '이'다
 * (영·일·삼·육·칠·팔). 시안의 "5588가"는 자리 표시용 숫자라 조사가 맞지 않는다. */
function withSubjectParticle(last4: string) {
  return /[013678]$/.test(last4) ? `${last4}이` : `${last4}가`
}

/* 시안에 고정된 5588이 그대로 나가 모든 사용자에게 같은 카드번호를 보여주고
 * 있었다. 서버가 돌려준 실제 끝자리를 쓴다. */
function describeNewCard(last4: string | null) {
  return last4
    ? `새 카드 ···· ···· ···· ${withSubjectParticle(last4)} 다음 결제부터 사용됩니다.`
    : '새 카드가 다음 결제부터 사용됩니다.'
}

function NoticeModal({
  title,
  description,
  buttonText,
  onConfirm,
}: {
  title: string
  description?: string
  buttonText: string
  onConfirm: () => void
}) {
  return (
    <ModalContent
      title={title}
      description={description}
      className='sm:w-[50rem]'>
      <Button
        type='button'
        color='secondary'
        size='lg'
        variant='filled'
        onClick={onConfirm}
        className='mt-32 h-44 w-full'>
        {buttonText}
      </Button>
    </ModalContent>
  )
}

function ConfirmModal({
  title,
  description,
  confirmText,
  isPending,
  onCancel,
  onConfirm,
}: {
  title: string
  description: string
  confirmText: string
  isPending: boolean
  onCancel: () => void
  onConfirm: () => Promise<void>
}) {
  return (
    <ModalContent
      title={title}
      description={description}
      className='sm:w-[50rem]'>
      <div className='mt-32 grid grid-cols-2 gap-12'>
        <Button
          type='button'
          color='gray'
          size='lg'
          variant='filled'
          onClick={onCancel}
          className='h-44 w-full'>
          취소
        </Button>
        <Button
          type='button'
          color='secondary'
          size='lg'
          variant='filled'
          disabled={isPending}
          onClick={onConfirm}
          className='h-44 w-full'>
          {isPending ? '처리 중…' : confirmText}
        </Button>
      </div>
    </ModalContent>
  )
}

function CreditOptionCard({
  option,
  selected,
  onSelect,
}: {
  option: CreditPurchaseOption
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type='button'
      onClick={onSelect}
      className={cn(
        'relative flex h-[15.8rem] flex-col items-center justify-center gap-12 rounded-6 border p-16 text-center focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:outline-none',
        selected
          ? 'border-stroke-border-gray-default bg-[rgba(90,68,242,0.08)]'
          : 'border-stroke-border-gray-default bg-background-gray-default'
      )}>
      {option.badge && (
        <span className='absolute top-[-1.3rem] right-0 rounded-4 bg-feedback-error px-12 py-2 text-noto-title-sm-bold text-white'>
          {option.badge}
        </span>
      )}
      <span className='text-ibm-title-md-normal text-text-and-icon-default'>
        {option.credits}크레딧
      </span>
      <div className='flex flex-col items-center'>
        <strong className='text-ibm-heading-lg-bold text-brand-primary'>
          {formatWonSuffix(option.price)}
        </strong>
        {option.originalPrice && (
          <span className='text-noto-caption-md-normal text-text-and-icon-disabled line-through'>
            정가 {formatWon(option.originalPrice)}
          </span>
        )}
      </div>
      <span className='text-noto-label-md-normal text-text-and-icon-secondary'>
        {formatWonSuffix(option.pricePerCredit)}/개
      </span>
    </button>
  )
}

const PAYER_INFO_FIELDS: {
  key: keyof PayerInfo
  label: string
  type: 'text' | 'tel' | 'email'
  autoComplete: string
  inputMode?: 'text' | 'tel' | 'email'
  placeholder?: string
  /* 입력 시점에 값을 정규화한다. maxLength 속성으로 자르면 하이픈이 섞인 값을
   * 붙여넣을 때 숫자까지 함께 잘려나가므로, 숫자만 남긴 뒤 길이를 맞춘다. */
  sanitize?: (value: string) => string
}[] = [
  { key: 'name', label: '이름', type: 'text', autoComplete: 'name' },
  {
    key: 'phone',
    label: '전화번호',
    type: 'tel',
    autoComplete: 'tel',
    inputMode: 'tel',
    placeholder: '전화번호 (숫자만)',
    /* PG는 하이픈 없는 숫자만 받는다. 표기가 갈리지 않게 입력 단계에서 통일한다. */
    sanitize: (value) => value.replace(/\D/g, '').slice(0, 11),
  },
  {
    key: 'email',
    label: '이메일',
    type: 'email',
    autoComplete: 'email',
    inputMode: 'email',
  },
]

function PayerInfoFields({
  value,
  onChange,
  layout = 'stack',
}: {
  value: PayerInfo
  onChange: (value: PayerInfo) => void
  layout?: 'stack' | 'inline'
}) {
  return (
    <div
      className={cn(
        'grid gap-12',
        layout === 'inline' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'
      )}>
      {PAYER_INFO_FIELDS.map((field) => {
        const inputId = `billing-payer-${field.key}-${layout}`
        return (
          <label key={field.key} htmlFor={inputId} className='min-w-0'>
            <span className='sr-only'>{field.label}</span>
            <input
              id={inputId}
              name={field.key}
              type={field.type}
              inputMode={field.inputMode}
              value={value[field.key]}
              onChange={(event) =>
                onChange({
                  ...value,
                  [field.key]: field.sanitize
                    ? field.sanitize(event.target.value)
                    : event.target.value,
                })
              }
              placeholder={field.placeholder ?? field.label}
              autoComplete={field.autoComplete}
              spellCheck={field.key === 'email' ? false : undefined}
              className='h-44 w-full min-w-0 rounded-6 border border-stroke-border-gray-stronger bg-white px-16 text-noto-label-md-normal text-text-and-icon-primary placeholder:text-text-and-icon-disabled focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:outline-none'
            />
          </label>
        )
      })}
    </div>
  )
}

const BUSINESS_INFO_FIELDS: {
  key: keyof BusinessInfo
  label: string
  required?: boolean
  inputMode?: 'text' | 'tel' | 'email' | 'numeric'
  autoComplete: string
  sanitize?: (value: string) => string
}[] = [
  {
    key: 'brn',
    label: '사업자등록번호',
    required: true,
    inputMode: 'numeric',
    autoComplete: 'off',
    /* 서버 검증이 \d{10}이라 하이픈을 받지 않는다. */
    sanitize: (value) => value.replace(/\D/g, '').slice(0, 10),
  },
  {
    key: 'contactEmail',
    label: '이메일',
    required: true,
    inputMode: 'email',
    autoComplete: 'email',
  },
  { key: 'name', label: '상호명', autoComplete: 'organization' },
  { key: 'representativeName', label: '대표자명', autoComplete: 'name' },
  {
    key: 'phoneNumber',
    label: '휴대폰 번호',
    inputMode: 'tel',
    autoComplete: 'tel',
    sanitize: (value) => value.replace(/\D/g, '').slice(0, 11),
  },
]

function BusinessInfoFields({
  value,
  onChange,
}: {
  value: BusinessInfo
  onChange: (value: BusinessInfo) => void
}) {
  return (
    <div className='flex flex-col gap-12'>
      {BUSINESS_INFO_FIELDS.map((field) => {
        const inputId = `billing-business-${field.key}`
        return (
          <label key={field.key} htmlFor={inputId} className='flex flex-col'>
            {/* 시안은 입력란에 라벨 없이 placeholder만 둔다. 스크린리더는
             * placeholder를 라벨로 읽지 않으므로 라벨을 시각적으로만 숨긴다. */}
            <span className='sr-only'>
              {field.label}
              {field.required && ' (필수)'}
            </span>
            <input
              id={inputId}
              name={field.key}
              type='text'
              inputMode={field.inputMode}
              value={value[field.key]}
              onChange={(event) =>
                onChange({
                  ...value,
                  [field.key]: field.sanitize
                    ? field.sanitize(event.target.value)
                    : event.target.value,
                })
              }
              placeholder={`${field.label}${field.required ? '(필수)' : ''}`}
              autoComplete={field.autoComplete}
              spellCheck={field.key === 'contactEmail' ? false : undefined}
              className='h-44 w-full min-w-0 rounded-6 border border-stroke-border-gray-stronger bg-white px-16 text-noto-label-md-normal text-text-and-icon-primary placeholder:text-text-and-icon-disabled focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:outline-none'
            />
          </label>
        )
      })}
    </div>
  )
}

function PaymentChoice({
  title,
  description,
  disabled,
  selected,
  onSelect,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  disabled?: boolean
  selected: boolean
  onSelect: () => void
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div
      className={cn(
        'flex min-h-[11rem] flex-col justify-center gap-12 rounded-12 border p-24 text-left transition-colors',
        selected
          ? 'border-brand-primary bg-[rgba(90,68,242,0.06)] text-text-and-icon-primary'
          : 'border-stroke-border-gray-default bg-white text-text-and-icon-primary',
        disabled && 'bg-background-gray-default text-text-and-icon-disabled'
      )}>
      <button
        type='button'
        disabled={disabled}
        onClick={onSelect}
        aria-pressed={selected}
        className='flex flex-col gap-4 rounded-6 text-left focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none disabled:pointer-events-none'>
        <strong className='text-noto-body-md-bold'>{title}</strong>
        <span className='text-noto-body-xs-normal text-text-and-icon-secondary'>
          {description}
        </span>
      </button>
      {actionLabel && onAction && (
        <Button
          type='button'
          color='gray'
          size='xs'
          variant='filled'
          onClick={onAction}
          className='h-28 w-full'>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
