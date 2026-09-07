'use client'

import { useRef, useState, type ReactNode } from 'react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'

import {
  formatWon,
  issueCardBillingKey,
  useCancelSubscription,
  useChangeBillingMethod,
  useDeleteBillingMethod,
  useExtendCreditBatch,
  usePurchaseCredits,
  useRegisterBillingMethod,
  useStartSubscription,
  type BillingSummary,
  type CreditPurchaseOption,
} from '@/features/me/credit'
import CheckIcon from '@/shared/assets/check-bold.svg'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/shadcn/dialog'
import { ModalContent } from './BillingPrimitives'
import {
  EMPTY_PAYER_INFO,
  type ModalState,
  type PayerInfo,
} from './billingPageTypes'

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const message = error.response?.data?.error?.message
    if (typeof message === 'string') return message
  }
  return error instanceof Error
    ? error.message
    : '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'
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

function getStableIdempotencyKey(ref: { current: string | null }) {
  ref.current ??= crypto.randomUUID()
  return ref.current
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
  const [agreedAutoPay, setAgreedAutoPay] = useState(false)
  const [agreedWithdrawalLimit, setAgreedWithdrawalLimit] = useState(false)
  const [cancelReason, setCancelReason] = useState('사용 빈도가 낮아요')
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
  const registerBillingMethodIdempotencyKeyRef = useRef<string | null>(null)
  const startSubscriptionIdempotencyKeyRef = useRef<string | null>(null)
  const purchaseCreditsIdempotencyKeyRef = useRef<string | null>(null)
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
    setCancelReason('사용 빈도가 낮아요')
    setPayerInfo(EMPTY_PAYER_INFO)
    setSelectedOptionId(
      summary.creditOptions[1]?.id ?? summary.creditOptions[0]?.id ?? ''
    )
    registerBillingMethodIdempotencyKeyRef.current = null
    startSubscriptionIdempotencyKeyRef.current = null
    purchaseCreditsIdempotencyKeyRef.current = null
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
                  registerBillingMethodMutation.isPending ||
                  isPaymentWindowPending
                }
                onClick={async () => {
                  setIsPaymentWindowPending(true)
                  try {
                    if (summary.billingMethod.status === 'none') {
                      const { billingKey } = await issueCardBillingKey({
                        issueName: `${modal.plan.name} 정기결제 카드 등록`,
                        displayAmount: modal.plan.price,
                      })
                      await registerBillingMethodMutation.mutateAsync({
                        idempotencyKey: getStableIdempotencyKey(
                          registerBillingMethodIdempotencyKeyRef
                        ),
                        payload: { billingKey },
                      })
                    }
                    await startSubscriptionMutation.mutateAsync({
                      idempotencyKey: getStableIdempotencyKey(
                        startSubscriptionIdempotencyKeyRef
                      ),
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
          title='구독을 해지하시겠어요?'
          description='해지해도 결제 완료 기간까지 플랜을 이용할 수 있습니다.'
          className='sm:w-[50rem]'>
          <div className='mt-32 flex flex-col gap-32'>
            <label className='flex flex-col gap-8'>
              <span className='text-noto-body-xs-bold text-text-and-icon-primary'>
                해지 사유
              </span>
              <select
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                name='cancelReason'
                autoComplete='off'
                className='h-44 rounded-6 border border-stroke-border-gray-stronger bg-white px-16 text-noto-body-sm-normal text-text-and-icon-primary focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:outline-none'>
                <option>사용 빈도가 낮아요</option>
                <option>가격이 부담돼요</option>
                <option>원하는 기능이 부족해요</option>
                <option>다른 서비스를 이용해요</option>
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
        <ModalContent title='해지 전 확인해주세요' className='sm:w-[50rem]'>
          <div className='mt-32 flex flex-col gap-32'>
            <div className='rounded-12 bg-background-gray-default p-20 text-noto-body-sm-normal text-text-and-icon-secondary'>
              해지 후 재가입하면 얼리버드 혜택이 종료되고 정상가 29,000원이
              적용됩니다.
            </div>
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
                className='h-44 w-full'>
                해지 예약
              </Button>
            </div>
          </div>
        </ModalContent>
      )}
      {modal?.type === 'cancelDone' && (
        <NoticeModal
          title='해지가 완료되었습니다.'
          buttonText='확인'
          onConfirm={handleClose}
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
                  registerBillingMethodMutation.isPending ||
                  isPaymentWindowPending
                }
                onClick={async () => {
                  setIsPaymentWindowPending(true)
                  try {
                    const { billingKey } = await issueCardBillingKey({
                      issueName: '인플레이스 결제수단 등록',
                    })
                    await registerBillingMethodMutation.mutateAsync({
                      idempotencyKey: getStableIdempotencyKey(
                        registerBillingMethodIdempotencyKeyRef
                      ),
                      payload: { billingKey },
                    })
                    onOpenModal({ type: 'billingRegistered' })
                  } catch (error) {
                    toast.error(getErrorMessage(error))
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
          title='결제수단 변경'
          description='새 카드로 포트원 결제창을 호출해 빌링키가 재발급됩니다. 기존 빌링키는 교체 후 폐기됩니다.'
          className='sm:w-[50rem]'>
          <div className='mt-32 flex flex-col gap-32'>
            <div className='rounded-16 bg-background-gray-default p-20 text-noto-body-sm-normal text-text-and-icon-primary'>
              새 카드 •••• •••• •••• 5588
            </div>
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
                  changeBillingMethodMutation.isPending ||
                  isPaymentWindowPending
                }
                onClick={async () => {
                  setIsPaymentWindowPending(true)
                  try {
                    const { billingKey } = await issueCardBillingKey({
                      issueName: '인플레이스 결제수단 변경',
                    })
                    await changeBillingMethodMutation.mutateAsync({
                      billingKey,
                    })
                    onOpenModal({ type: 'billingChanged' })
                  } catch (error) {
                    toast.error(getErrorMessage(error))
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
                    idempotencyKey: getStableIdempotencyKey(
                      purchaseCreditsIdempotencyKeyRef
                    ),
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
}[] = [
  { key: 'name', label: '이름', type: 'text', autoComplete: 'name' },
  {
    key: 'phone',
    label: '전화번호',
    type: 'tel',
    autoComplete: 'tel',
    inputMode: 'tel',
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
                onChange({ ...value, [field.key]: event.target.value })
              }
              placeholder={field.label}
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
