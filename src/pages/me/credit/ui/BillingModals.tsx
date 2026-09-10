'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import {
  formatDate,
  formatWon,
  issueCardBillingKey,
  useCancelSubscription,
  useChangeBillingMethod,
  useDeleteBillingMethod,
  useExtendCreditBatch,
  usePurchaseCredits,
  useRegisterBillingMethod,
  useStartSubscription,
  SUBSCRIPTION_EXIT_REASONS,
  type BillingSummary,
  type CreditPurchaseOption,
  type PaymentCustomer,
  type SubscriptionExitReason,
} from '@/features/me/credit'
import CheckIcon from '@/shared/assets/check-bold.svg'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/shadcn/dialog'
import { ModalContent } from './BillingPrimitives'
import {
  EMPTY_PAYER_INFO,
  getErrorMessage,
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

/* 백엔드는 idempotency 키를 payload와 무관하게 "이미 본 키인가"로만 판정하고,
 * 원래 응답을 재생해주지 않는다. 게다가 preHandle에서 키를 먼저 소모하므로
 * 요청이 실패해도 1시간(TTL) 동안 그 키는 되살아나지 않는다
 * (서버 IdempotencyKeyInterceptor). 키를 재사용하면 재시도가 전부
 * COMMON_409_IDEMPOTENCY로 막히므로 시도마다 새로 만든다.
 * 같은 시도가 중복 전송되는 것은 버튼 비활성화로 막는다. */
function createIdempotencyKey() {
  return crypto.randomUUID()
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
  const [cancelReason, setCancelReason] = useState<SubscriptionExitReason>(
    SUBSCRIPTION_EXIT_REASONS[0].value
  )
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
  const startSubscriptionMutation = useStartSubscription()
  const cancelSubscriptionMutation = useCancelSubscription()
  const registerBillingMethodMutation = useRegisterBillingMethod()
  const changeBillingMethodMutation = useChangeBillingMethod()
  const deleteBillingMethodMutation = useDeleteBillingMethod()
  const purchaseCreditsMutation = usePurchaseCredits()
  const extendCreditBatchMutation = useExtendCreditBatch()

  const handleClose = () => {
    setAgreedAutoPay(false)
    setAgreedWithdrawalLimit(false)
    setCancelReason(SUBSCRIPTION_EXIT_REASONS[0].value)
    setPayerInfo(EMPTY_PAYER_INFO)
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
    <Dialog open={!!modal} onOpenChange={(open) => !open && handleClose()}>
      {modal?.type === 'subscribe' && (
        <ModalContent
          title='구독 시작하기'
          className='sm:w-[min(67.8rem,calc(100vw-4.8rem))]'>
          <div className='mt-32 flex flex-col gap-32'>
            <div className='rounded-12 border border-stroke-border-gray-default bg-background-gray-default p-20'>
              <strong className='block text-noto-title-sm-bold text-text-and-icon-default'>
                {formatWon(modal.plan.price)}
              </strong>
              <span className='mt-6 block text-noto-body-sm-normal text-text-and-icon-secondary'>
                매월 자동 결제 · 다음 결제일은 구독 시작 후 1개월 뒤로
                설정됩니다
              </span>
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
                결제 즉시 서비스가 제공되며, 청약철회가 제한될 수 있음을
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
                  !agreedAutoPay ||
                  !agreedWithdrawalLimit ||
                  startSubscriptionMutation.isPending ||
                  isPaymentWindowPending
                }
                onClick={async () => {
                  /* 카드가 없으면 결제창을 바로 띄우지 않는다. 포트원이 이름·
                   * 전화번호·이메일을 필수로 요구하므로 본인 정보 입력 모달을
                   * 먼저 거친다. 등록이 끝나면 그 모달이 구독까지 이어서 마친다. */
                  if (summary.billingMethod.status === 'none') {
                    setFormError(null)
                    onOpenModal({
                      type: 'billingRegister',
                      pendingPlan: modal.plan,
                    })
                    return
                  }

                  setIsPaymentWindowPending(true)
                  try {
                    await startSubscriptionMutation.mutateAsync({
                      idempotencyKey: createIdempotencyKey(),
                      payload: {
                        planCode: modal.plan.code,
                      },
                    })
                    toast.success('구독이 시작되었습니다.')
                    handleClose()
                  } catch (error) {
                    toast.error(getErrorMessage(error))
                  } finally {
                    setIsPaymentWindowPending(false)
                  }
                }}
                className='h-44 w-full'>
                {summary.billingMethod.status === 'none'
                  ? '카드 등록하고 결제하기'
                  : '결제하고 구독 시작'}
              </Button>
              <p className='text-center text-noto-body-xs-normal text-text-and-icon-secondary'>
                회원 본인은 주문내용을 확인했으며, 이용약관 및
                개인정보처리방침과 결제에 동의합니다.
              </p>
            </div>
          </div>
        </ModalContent>
      )}
      {modal?.type === 'cancelReason' && (
        <ModalContent
          title='해지 사유를 알려주세요'
          description='소중한 피드백은 서비스 개선에 활용됩니다'
          className='sm:w-[50rem]'>
          <div className='mt-32 flex flex-col gap-32'>
            <label className='flex flex-col gap-8'>
              <span className='text-noto-body-xs-bold text-text-and-icon-primary'>
                해지 사유 <span className='font-normal'>(필수)</span>
              </span>
              <select
                value={cancelReason}
                onChange={(event) =>
                  setCancelReason(event.target.value as SubscriptionExitReason)
                }
                name='cancelReason'
                autoComplete='off'
                className='h-44 rounded-6 border border-stroke-border-gray-stronger bg-white px-16 text-noto-body-sm-normal text-text-and-icon-primary focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:outline-none'>
                {SUBSCRIPTION_EXIT_REASONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </label>
            <div className='grid grid-cols-2 gap-12'>
              <Button
                type='button'
                color='gray'
                size='lg'
                variant='filled'
                onClick={handleClose}
                className='h-44 w-full'>
                유지하기
              </Button>
              <Button
                type='button'
                color='primary'
                size='lg'
                variant='filled'
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
            <ul className='flex flex-col gap-8 rounded-12 bg-background-gray-default p-20 text-noto-body-sm-normal text-text-and-icon-secondary'>
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
                돌아가기
              </Button>
              <Button
                type='button'
                color='primary'
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
              계속 이용하기
            </Button>
            <Button
              type='button'
              color='primary'
              size='lg'
              variant='filled'
              disabled={cancelSubscriptionMutation.isPending}
              onClick={async () => {
                try {
                  await cancelSubscriptionMutation.mutateAsync({
                    reason: cancelReason,
                  })
                  onOpenModal({ type: 'cancelDone' })
                } catch (error) {
                  toast.error(getErrorMessage(error))
                }
              }}
              className='h-44 w-full bg-feedback-error'>
              해지 완료하기
            </Button>
          </div>
        </ModalContent>
      )}
      {modal?.type === 'cancelDone' && (
        <NoticeModal
          title='해지가 완료되었습니다.'
          description='지금까지 인플레이스를 이용해주셔서 감사합니다.'
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
          description={
            modal.pendingPlan
              ? '입력한 정보로 카드를 등록한 뒤 바로 구독 결제가 진행됩니다.'
              : '입력한 정보를 기반으로 카드 등록을 시작합니다.'
          }
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
                color='primary'
                size='lg'
                variant='filled'
                disabled={
                  !isPayerInfoComplete(payerInfo) ||
                  registerBillingMethodMutation.isPending ||
                  startSubscriptionMutation.isPending ||
                  isPaymentWindowPending
                }
                onClick={async () => {
                  /* 모달이 열려 있으면 Radix Dialog가 body의 pointer-events를
                   * 잠그고 포커스를 가두는 탓에, body에 iframe으로 붙는 결제창에
                   * 클릭·입력이 닿지 않는다. 호출 전에 닫아 간섭을 없앤다.
                   * 닫은 뒤에도 쓸 값은 미리 지역 변수로 확보한다. */
                  const pendingPlan = modal.pendingPlan
                  const customer = toPaymentCustomer(payerInfo)

                  setFormError(null)
                  setIsPaymentWindowPending(true)
                  onClose()

                  try {
                    const { billingKey } = await issueCardBillingKey({
                      issueName: '인플레이스 결제수단 등록',
                      displayAmount: pendingPlan?.price,
                      customer,
                    })
                    await registerBillingMethodMutation.mutateAsync({
                      idempotencyKey: createIdempotencyKey(),
                      payload: {
                        billingKey,
                        name: customer.fullName,
                        phoneNumber: customer.phoneNumber,
                        email: customer.email,
                      },
                    })

                    /* 구독 모달에서 넘어왔다면 카드 등록에서 멈추지 않고
                     * 원래 하려던 구독 결제까지 이어서 마친다. */
                    if (pendingPlan) {
                      await startSubscriptionMutation.mutateAsync({
                        idempotencyKey: createIdempotencyKey(),
                        payload: { planCode: pendingPlan.code },
                      })
                      toast.success('구독이 시작되었습니다.')
                      handleClose()
                      return
                    }

                    onOpenModal({ type: 'billingRegistered' })
                  } catch (error) {
                    /* 모달을 닫아둔 상태라 인라인으로 보여줄 자리가 없다.
                     * 입력값이 남아 있는 모달을 다시 열어 에러와 함께 보여준다. */
                    setFormError(getErrorMessage(error))
                    onOpenModal({ type: 'billingRegister', pendingPlan })
                  } finally {
                    setIsPaymentWindowPending(false)
                  }
                }}
                className='h-44 w-full'>
                {isPaymentWindowPending
                  ? '등록 중…'
                  : modal.pendingPlan
                    ? '등록하고 결제하기'
                    : '등록하기'}
              </Button>
            </div>
          </div>
        </ModalContent>
      )}
      {modal?.type === 'billingChange' && (
        <ModalContent
          title='결제수단 변경'
          description='새 카드로 포트원 결제창을 호출해 빌링키가 재발급됩니다. 기존 빌링키는 교체 후 폐기됩니다.'
          className='sm:w-[50rem]'>
          <div className='mt-32 flex flex-col gap-32'>
            <div className='flex flex-col gap-12'>
              <span className='text-noto-body-xs-bold text-text-and-icon-primary'>
                본인 정보를 입력해주세요.
              </span>
              <PayerInfoFields value={payerInfo} onChange={setPayerInfo} />
            </div>
            <div className='rounded-16 bg-background-gray-default p-20 text-noto-body-sm-normal text-text-and-icon-primary'>
              새 카드 •••• •••• •••• 5588
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
                color='primary'
                size='lg'
                variant='filled'
                disabled={
                  !isPayerInfoComplete(payerInfo) ||
                  changeBillingMethodMutation.isPending ||
                  isPaymentWindowPending
                }
                onClick={async () => {
                  /* 등록 모달과 같은 이유로 결제창 호출 전에 모달을 닫는다. */
                  const customer = toPaymentCustomer(payerInfo)

                  setFormError(null)
                  setIsPaymentWindowPending(true)
                  onClose()

                  try {
                    const { billingKey } = await issueCardBillingKey({
                      issueName: '인플레이스 결제수단 변경',
                      customer,
                    })
                    await changeBillingMethodMutation.mutateAsync({
                      billingKey,
                    })
                    onOpenModal({ type: 'billingChanged' })
                  } catch (error) {
                    setFormError(getErrorMessage(error))
                    onOpenModal({ type: 'billingChange' })
                  } finally {
                    setIsPaymentWindowPending(false)
                  }
                }}
                className='h-44 w-full'>
                {isPaymentWindowPending ? '교체 중…' : '카드 등록하고 교체하기'}
              </Button>
            </div>
          </div>
        </ModalContent>
      )}
      {modal?.type === 'billingRegistered' && (
        <NoticeModal
          title='결제수단이 등록되었습니다'
          description='새 카드 ···· ···· ···· 5588가 다음 결제부터 사용됩니다.'
          buttonText='확인'
          onConfirm={handleClose}
        />
      )}
      {modal?.type === 'billingChanged' && (
        <NoticeModal
          title='결제수단이 변경되었습니다'
          description='새 카드 ···· ···· ···· 5588가 다음 결제부터 사용됩니다.'
          buttonText='확인'
          onConfirm={handleClose}
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
                color='primary'
                size='lg'
                variant='filled'
                disabled={deleteBillingMethodMutation.isPending}
                onClick={async () => {
                  try {
                    const last4 = summary.billingMethod.last4
                    await deleteBillingMethodMutation.mutateAsync()
                    onOpenModal({ type: 'billingDeleted', last4 })
                  } catch (error) {
                    toast.error(getErrorMessage(error))
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
          description={`카드 ···· ···· ···· ${modal.last4 ?? '5588'}가 결제수단에서 삭제되었습니다.`}
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
                  disabled
                  selected={false}
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
                paymentMethod !== 'registeredCard' ||
                summary.billingMethod.status !== 'registered' ||
                purchaseCreditsMutation.isPending ||
                isPaymentWindowPending
              }
              onClick={async () => {
                setIsPaymentWindowPending(true)
                try {
                  await purchaseCreditsMutation.mutateAsync({
                    idempotencyKey: createIdempotencyKey(),
                    payload: {
                      optionId: selectedOption.id,
                      paymentMethod,
                    },
                  })
                  toast.success('크레딧 구매가 완료되었습니다.')
                  handleClose()
                } catch (error) {
                  toast.error(getErrorMessage(error))
                } finally {
                  setIsPaymentWindowPending(false)
                }
              }}
              className='h-44 w-full'>
              {purchaseCreditsMutation.isPending
                ? '결제 확인 중…'
                : '결제 내역 확인하기'}
            </Button>
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
            try {
              await extendCreditBatchMutation.mutateAsync({
                batchId: modal.batch.id,
              })
              toast.success('유효기간 연장이 완료되었습니다.')
              handleClose()
            } catch (error) {
              toast.error(getErrorMessage(error))
            }
          }}
        />
      )}
      {modal?.type === 'taxInvoiceRequested' && (
        <NoticeModal
          title='세금계산서 신청 완료'
          description='영업일 기준 3일 이내 발급되며, 등록된 이메일로 발송됩니다.'
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
        color='primary'
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
          color='primary'
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
          {formatWon(option.price).replace('₩', '')}
        </strong>
        {option.originalPrice && (
          <span className='text-noto-caption-md-normal text-text-and-icon-disabled line-through'>
            정가 {formatWon(option.originalPrice)}
          </span>
        )}
      </div>
      <span className='text-noto-label-md-normal text-text-and-icon-secondary'>
        {formatWon(option.pricePerCredit).replace('₩', '')}/개
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
