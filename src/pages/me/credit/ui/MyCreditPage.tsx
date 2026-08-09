'use client'

import { useEffect, useState, useTransition, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

import {
  BILLING_TABS,
  formatDate,
  formatWon,
  getExpiringCredits,
  getTotalCredits,
  isBillingTab,
  useBillingSummary,
  useCancelSubscription,
  useDeleteBillingMethod,
  useExtendCreditBatch,
  usePurchaseCredits,
  useRefundCreditBatch,
  useRegisterBillingMethod,
  useRetrySubscriptionPayment,
  useStartSubscription,
  type BillingHistoryItem,
  type BillingHistoryStatus,
  type BillingPlan,
  type BillingSummary,
  type BillingTab,
  type CreditBatch,
  type CreditPurchaseOption,
} from '@/features/me/credit'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/shadcn/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { TabGroup } from '@/shared/ui/tabGroup'
import CheckIcon from '@/shared/assets/check-bold.svg'
import PaymentIcon from '@/shared/assets/payment-bold.svg'

type ModalState =
  | { type: 'subscribe'; plan: BillingPlan }
  | { type: 'cancelReason' }
  | { type: 'cancelNotice' }
  | { type: 'cancelDone' }
  | { type: 'billingRegister' }
  | { type: 'billingRegistered' }
  | { type: 'billingDelete' }
  | { type: 'billingDeleted'; last4: string | null }
  | { type: 'creditPurchase' }
  | { type: 'creditExtend'; batch: CreditBatch }
  | { type: 'creditRefund'; batch: CreditBatch }
  | { type: 'document'; item: BillingHistoryItem; documentType: string }
  | null

function StatusBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'success' | 'error' | 'warning' | 'neutral' | 'info'
}) {
  return (
    <span
      className={cn(
        'inline-flex h-24 items-center rounded-6 px-8 text-noto-label-xs-bold',
        tone === 'success' && 'bg-[rgba(0,118,60,0.1)] text-feedback-success',
        tone === 'error' && 'bg-[rgba(224,47,82,0.1)] text-feedback-error',
        tone === 'warning' && 'bg-[#FFF5D8] text-[#8A5A00]',
        tone === 'info' &&
          'bg-[rgba(36,115,230,0.1)] text-feedback-informative',
        tone === 'neutral' &&
          'bg-background-gray-stronger text-text-and-icon-secondary'
      )}>
      {children}
    </span>
  )
}

function SectionCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-16 bg-white p-32 shadow-[0px_2px_6px_0px_#0D0D0D0A]',
        className
      )}>
      {children}
    </section>
  )
}

function ModalContent({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <DialogContent
      showCloseButton={false}
      overlayClassName='bg-background-dim-default'
      className={cn('rounded-16 bg-white p-40 shadow-none', className)}>
      <VisuallyHidden>
        <DialogTitle>{title}</DialogTitle>
      </VisuallyHidden>
      <div className='flex flex-col gap-8'>
        <h2 className='text-noto-title-sm-bold text-text-and-icon-default'>
          {title}
        </h2>
        {description && (
          <p className='text-noto-body-xs-normal text-text-and-icon-secondary'>
            {description}
          </p>
        )}
      </div>
      {children}
    </DialogContent>
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
      className='flex w-full items-center gap-12 text-left'>
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

function PlanCard({
  plan,
  disabled,
  onSubscribe,
}: {
  plan: BillingPlan
  disabled: boolean
  onSubscribe: () => void
}) {
  return (
    <article className='relative flex h-[36.8rem] flex-1 flex-col rounded-16 border border-stroke-border-gray-default bg-white p-32'>
      {plan.badge && (
        <span className='absolute top-[-2.4rem] right-0 rounded-t-12 rounded-br-0 rounded-bl-12 bg-brand-primary px-24 py-[1.3rem] text-noto-label-md-bold text-white'>
          {plan.badge}
        </span>
      )}
      <div className='flex flex-1 flex-col gap-32'>
        <div className='flex flex-col gap-16'>
          <h3 className='text-noto-title-sm-bold text-text-and-icon-default'>
            {plan.name}
          </h3>
          <div className='flex items-end gap-8'>
            {plan.originalPrice && (
              <span className='pb-6 text-noto-body-lg-normal text-text-and-icon-disabled line-through'>
                {formatWon(plan.originalPrice)}
              </span>
            )}
            <span className='text-ibm-heading-md-bold text-text-and-icon-default'>
              {formatWon(plan.price)}
            </span>
            <span className='pb-8 text-noto-body-sm-normal text-text-and-icon-secondary'>
              / 월
            </span>
          </div>
        </div>
        <ul className='flex flex-col gap-8'>
          {plan.features.map((feature) => (
            <li
              key={feature}
              className='flex items-center gap-6 text-noto-body-sm-normal text-text-and-icon-primary'>
              <CheckIcon className='size-20 text-brand-primary' />
              {feature}
            </li>
          ))}
        </ul>
      </div>
      <Button
        type='button'
        color='primary'
        size='lg'
        variant='filled'
        disabled={disabled}
        onClick={onSubscribe}
        className='h-44 w-full'>
        구독 시작하기
      </Button>
    </article>
  )
}

function SubscriptionTab({
  summary,
  onOpenModal,
  onRetryPayment,
  isRetrying,
}: {
  summary: BillingSummary
  onOpenModal: (modal: ModalState) => void
  onRetryPayment: () => void
  isRetrying: boolean
}) {
  const { subscription, plans } = summary
  const isSubscribed =
    subscription.status === 'active' ||
    subscription.status === 'cancelScheduled' ||
    subscription.status === 'paymentFailed'

  if (!isSubscribed) {
    return (
      <SectionCard className='flex min-h-[64.2rem] flex-col gap-40 px-32 py-48'>
        <div className='grid grid-cols-2 gap-16'>
          {plans.map((plan) => (
            <PlanCard
              key={plan.code}
              plan={plan}
              disabled={false}
              onSubscribe={() => onOpenModal({ type: 'subscribe', plan })}
            />
          ))}
        </div>
        <div className='flex flex-col gap-20'>
          <h3 className='text-noto-body-md-bold text-text-and-icon-default'>
            플랜과 크레딧은 이렇게 운영됩니다
          </h3>
          <div className='flex flex-col gap-12 text-noto-body-sm-normal text-text-and-icon-secondary'>
            <p>
              최대한 예산 낭비없이 필요하신 만큼만 사용하실 수 있도록 플랜
              구독과 크레딧제를 별도로 운영하고 있습니다.
            </p>
            <p>
              플랜을 구독하실 경우, 인플루언서 검색 탭 내에서 사용할 수 있는
              검색, 성과 분석, 광고 분석 기능을 무제한으로 사용할 수 있습니다.
            </p>
            <p>
              크레딧은 경쟁 채널 분석을 할 수 있는 별도의 이용권입니다. 1크레딧
              당 1회의 분석을 진행할 수 있습니다.
            </p>
          </div>
        </div>
      </SectionCard>
    )
  }

  return (
    <div className='flex flex-col gap-24'>
      {subscription.status === 'paymentFailed' && (
        <SectionCard className='border border-feedback-error bg-[rgba(224,47,82,0.05)]'>
          <div className='flex items-center justify-between gap-24'>
            <div className='flex flex-col gap-8'>
              <div className='flex items-center gap-8'>
                <StatusBadge tone='error'>결제 실패</StatusBadge>
                <h3 className='text-noto-body-md-bold text-text-and-icon-default'>
                  이번 달 구독 결제가 완료되지 않았습니다
                </h3>
              </div>
              <p className='text-noto-body-sm-normal text-text-and-icon-secondary'>
                {subscription.paymentFailedReason ??
                  '결제수단을 확인하거나 결제를 다시 시도해주세요.'}
              </p>
            </div>
            <Button
              type='button'
              color='primary'
              size='md'
              variant='filled'
              disabled={isRetrying}
              onClick={onRetryPayment}>
              다시 결제하기
            </Button>
          </div>
        </SectionCard>
      )}
      {subscription.status === 'cancelScheduled' && (
        <SectionCard className='border border-[#E9B949] bg-[#FFF9E8]'>
          <div className='flex flex-col gap-8'>
            <div className='flex items-center gap-8'>
              <StatusBadge tone='warning'>해지 예약</StatusBadge>
              <h3 className='text-noto-body-md-bold text-text-and-icon-default'>
                {formatDate(subscription.cancelScheduledDate)}까지 플랜을 이용할
                수 있습니다
              </h3>
            </div>
            <p className='text-noto-body-sm-normal text-text-and-icon-secondary'>
              해지 후 재가입하면 정상가 29,000원이 적용됩니다.
            </p>
          </div>
        </SectionCard>
      )}
      <div className='grid grid-cols-4 gap-24'>
        <MetricCard
          label='현재 플랜'
          value={subscription.planName ?? '-'}
          suffix='월 구독'
        />
        <MetricCard
          label='월 결제 금액'
          value={formatWon(subscription.monthlyPrice)}
          suffix='VAT 포함'
        />
        <MetricCard
          label='다음 결제일'
          value={formatDate(subscription.nextPaymentDate)}
          suffix='매월 자동 결제'
        />
        <MetricCard
          label='보유 크레딧'
          value={`${getTotalCredits(summary.creditBatches)}개`}
        />
      </div>
      <SectionCard className='flex flex-col gap-20'>
        <h3 className='text-noto-body-md-bold text-text-and-icon-default'>
          구독 이용 안내
        </h3>
        <ul className='flex flex-col gap-8 text-noto-body-sm-normal text-text-and-icon-secondary'>
          <li>구독 유지 중에는 매월 3 크레딧이 자동 지급됩니다.</li>
          <li>월 지급 크레딧은 다음 달로 이월되지 않습니다.</li>
          <li>해지해도 결제 완료 기간까지 이용할 수 있습니다.</li>
          <li>크레딧은 만료일까지 사용 가능합니다.</li>
        </ul>
        {subscription.status === 'active' && (
          <div className='flex justify-end'>
            <Button
              type='button'
              color='gray'
              size='lg'
              variant='filled'
              onClick={() => onOpenModal({ type: 'cancelReason' })}>
              해지하기
            </Button>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

function MetricCard({
  label,
  value,
  suffix,
}: {
  label: string
  value: string
  suffix?: string
}) {
  return (
    <SectionCard className='h-[13.4rem] p-32'>
      <div className='flex h-full flex-col justify-between'>
        <span className='text-noto-body-sm-bold text-text-and-icon-secondary'>
          {label}
        </span>
        <div className='flex items-end gap-8'>
          <strong className='text-noto-title-sm-bold text-text-and-icon-default'>
            {value}
          </strong>
          {suffix && (
            <span className='mb-2 rounded-6 bg-background-gray-stronger px-8 py-4 text-noto-label-xs-normal text-text-and-icon-secondary'>
              {suffix}
            </span>
          )}
        </div>
      </div>
    </SectionCard>
  )
}

function BillingMethodTab({
  summary,
  onOpenModal,
}: {
  summary: BillingSummary
  onOpenModal: (modal: ModalState) => void
}) {
  const { billingMethod } = summary

  if (billingMethod.status === 'none') {
    return (
      <SectionCard className='flex h-[17.8rem] flex-col items-center justify-center gap-20'>
        <div className='flex flex-col items-center gap-8'>
          <h3 className='text-noto-body-md-bold text-text-and-icon-default'>
            등록된 결제수단이 없습니다
          </h3>
          <p className='text-noto-body-xs-normal text-text-and-icon-secondary'>
            구독과 크레딧 원클릭 구매를 위해 카드를 등록해주세요.
          </p>
        </div>
        <Button
          type='button'
          color='primary'
          size='lg'
          variant='filled'
          onClick={() => onOpenModal({ type: 'billingRegister' })}>
          결제수단 등록
        </Button>
      </SectionCard>
    )
  }

  return (
    <SectionCard className='flex min-h-[17.8rem] flex-col gap-24'>
      <div className='flex items-start justify-between gap-24'>
        <div className='flex flex-col gap-16'>
          <div className='flex items-center gap-8'>
            <PaymentIcon className='size-24 text-text-and-icon-primary' />
            <h3 className='text-noto-body-md-bold text-text-and-icon-default'>
              결제 수단
            </h3>
          </div>
          <p className='pl-32 text-noto-body-sm-normal text-text-and-icon-primary'>
            {billingMethod.brand} ···· {billingMethod.last4}
          </p>
          <p className='pl-32 text-noto-body-xs-normal text-text-and-icon-secondary'>
            다음 결제부터 이 카드로 자동 결제됩니다.
          </p>
        </div>
        <div className='flex gap-8'>
          <Button
            type='button'
            color='gray'
            size='md'
            variant='filled'
            onClick={() => onOpenModal({ type: 'billingRegister' })}>
            변경
          </Button>
          <Button
            type='button'
            color='gray'
            size='md'
            variant='filled'
            onClick={() => onOpenModal({ type: 'billingDelete' })}>
            삭제
          </Button>
        </div>
      </div>
    </SectionCard>
  )
}

function CreditTab({
  summary,
  onOpenModal,
}: {
  summary: BillingSummary
  onOpenModal: (modal: ModalState) => void
}) {
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(
    () => new Set()
  )
  const isSubscribed = summary.subscription.status !== 'none'
  const selectedCount = selectedBatchIds.size

  const toggleBatch = (batchId: string) => {
    setSelectedBatchIds((current) => {
      const next = new Set(current)
      if (next.has(batchId)) {
        next.delete(batchId)
      } else {
        next.add(batchId)
      }
      return next
    })
  }

  return (
    <div className='flex flex-col gap-24'>
      <div className='flex justify-start'>
        <Button
          type='button'
          color='primary'
          size='lg'
          variant='filled'
          disabled={!isSubscribed}
          onClick={() => onOpenModal({ type: 'creditPurchase' })}>
          크레딧 구매
        </Button>
      </div>
      {!isSubscribed && (
        <p className='text-noto-body-xs-normal text-text-and-icon-secondary'>
          크레딧은 플랜 구독 후 구매할 수 있습니다.
        </p>
      )}
      <div className='grid grid-cols-2 gap-24'>
        <MetricCard
          label='보유 크레딧'
          value={`${getTotalCredits(summary.creditBatches)}개`}
          suffix='사용 가능'
        />
        <MetricCard
          label='만료 예정 크레딧'
          value={`${getExpiringCredits(summary.creditBatches, '2026-09')}개`}
          suffix='2026.09 기준'
        />
      </div>
      <SectionCard className='min-h-[44.8rem] p-24'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-44 bg-transparent'>
                <span className='sr-only'>선택</span>
              </TableHead>
              <TableHead>결제 날짜</TableHead>
              <TableHead>만료 일자</TableHead>
              <TableHead>유형</TableHead>
              <TableHead>구매 크레딧</TableHead>
              <TableHead>사용 크레딧</TableHead>
              <TableHead>연장 신청</TableHead>
              <TableHead>환불 신청</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.creditBatches.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell>
                  <button
                    type='button'
                    role='checkbox'
                    aria-checked={selectedBatchIds.has(batch.id)}
                    onClick={() => toggleBatch(batch.id)}
                    className={cn(
                      'flex size-20 items-center justify-center rounded-4 border',
                      selectedBatchIds.has(batch.id)
                        ? 'border-brand-primary bg-brand-primary text-white'
                        : 'border-stroke-border-gray-stronger bg-white text-transparent'
                    )}>
                    <CheckIcon className='size-14' />
                  </button>
                </TableCell>
                <TableCell>{formatDate(batch.paymentDate)}</TableCell>
                <TableCell>{formatDate(batch.expiryDate)}</TableCell>
                <TableCell>
                  {batch.type === 'subscription' ? '구독 지급' : '구매'}
                </TableCell>
                <TableCell>{batch.purchasedCredits}개</TableCell>
                <TableCell>{batch.usedCredits}개</TableCell>
                <TableCell>
                  <Button
                    type='button'
                    color='gray'
                    size='xs'
                    variant='filled'
                    disabled={!batch.extendable || !!batch.refundedAt}
                    onClick={() => onOpenModal({ type: 'creditExtend', batch })}
                    className='h-28 w-full'>
                    {batch.extendedAt ? '연장 완료' : '연장'}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    type='button'
                    color='gray'
                    size='xs'
                    variant='filled'
                    disabled={!batch.refundable || !!batch.refundedAt}
                    onClick={() => onOpenModal({ type: 'creditRefund', batch })}
                    className='h-28 w-full'>
                    {batch.refundedAt ? '환불 완료' : '환불'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className='mt-32 flex items-center justify-between'>
          <span className='text-noto-body-sm-normal text-text-and-icon-secondary'>
            {selectedCount}개 선택
          </span>
          <div className='flex gap-12'>
            <Button type='button' color='gray' size='md' variant='filled'>
              이전
            </Button>
            <Button type='button' color='gray' size='md' variant='filled'>
              다음
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

function HistoryTab({
  history,
  onOpenModal,
}: {
  history: BillingHistoryItem[]
  onOpenModal: (modal: ModalState) => void
}) {
  return (
    <SectionCard className='min-h-[44.8rem] p-24'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>결제 날짜</TableHead>
            <TableHead>내역</TableHead>
            <TableHead>구분</TableHead>
            <TableHead>금액</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>현금영수증</TableHead>
            <TableHead>세금계산서</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{formatDate(item.date)}</TableCell>
              <TableCell className='text-left'>{item.title}</TableCell>
              <TableCell>{getHistoryTypeLabel(item.type)}</TableCell>
              <TableCell>{formatWon(item.amount)}</TableCell>
              <TableCell>
                <HistoryStatusBadge status={item.status} />
              </TableCell>
              <TableCell>
                <Button
                  type='button'
                  color='gray'
                  size='xs'
                  variant='filled'
                  disabled={!item.receiptAvailable}
                  onClick={() =>
                    onOpenModal({
                      type: 'document',
                      item,
                      documentType: '현금영수증',
                    })
                  }
                  className='h-28 w-full'>
                  조회
                </Button>
              </TableCell>
              <TableCell>
                <Button
                  type='button'
                  color='gray'
                  size='xs'
                  variant='filled'
                  disabled={!item.taxInvoiceAvailable}
                  onClick={() =>
                    onOpenModal({
                      type: 'document',
                      item,
                      documentType: '세금계산서',
                    })
                  }
                  className='h-28 w-full'>
                  조회
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className='mt-32 flex justify-end gap-12'>
        <Button type='button' color='gray' size='md' variant='filled'>
          이전
        </Button>
        <Button type='button' color='gray' size='md' variant='filled'>
          다음
        </Button>
      </div>
    </SectionCard>
  )
}

function getHistoryTypeLabel(type: BillingHistoryItem['type']) {
  switch (type) {
    case 'subscription':
      return '구독'
    case 'creditPurchase':
      return '크레딧 구매'
    case 'creditRefund':
      return '환불'
  }
}

function HistoryStatusBadge({ status }: { status: BillingHistoryStatus }) {
  switch (status) {
    case 'paid':
      return <StatusBadge tone='success'>결제 완료</StatusBadge>
    case 'failed':
      return <StatusBadge tone='error'>결제 실패</StatusBadge>
    case 'refunded':
      return <StatusBadge tone='neutral'>환불 완료</StatusBadge>
    case 'scheduled':
      return <StatusBadge tone='info'>예정</StatusBadge>
  }
}

function BillingModals({
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
  const [selectedOptionId, setSelectedOptionId] = useState(
    summary.creditOptions[1]?.id ?? summary.creditOptions[0]?.id ?? ''
  )
  const startSubscriptionMutation = useStartSubscription()
  const cancelSubscriptionMutation = useCancelSubscription()
  const registerBillingMethodMutation = useRegisterBillingMethod()
  const deleteBillingMethodMutation = useDeleteBillingMethod()
  const purchaseCreditsMutation = usePurchaseCredits()
  const extendCreditBatchMutation = useExtendCreditBatch()
  const refundCreditBatchMutation = useRefundCreditBatch()

  const handleClose = () => {
    setAgreedAutoPay(false)
    setAgreedWithdrawalLimit(false)
    onClose()
  }

  const selectedOption =
    summary.creditOptions.find((option) => option.id === selectedOptionId) ??
    summary.creditOptions[0]

  return (
    <Dialog open={!!modal} onOpenChange={(open) => !open && handleClose()}>
      {modal?.type === 'subscribe' && (
        <ModalContent title='구독 시작하기' className='w-[67.8rem] max-w-none'>
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
                  startSubscriptionMutation.isPending
                }
                onClick={async () => {
                  await startSubscriptionMutation.mutateAsync({
                    planCode: modal.plan.code,
                  })
                  handleClose()
                }}
                className='h-44 w-full'>
                결제하고 구독 시작
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
          className='w-[50rem] max-w-none'>
          <div className='mt-32 flex flex-col gap-32'>
            <label className='flex flex-col gap-8'>
              <span className='text-noto-body-xs-bold text-text-and-icon-primary'>
                해지 사유
              </span>
              <select className='h-44 rounded-6 border border-stroke-border-gray-stronger bg-white px-16 text-noto-body-sm-normal text-text-and-icon-primary outline-none'>
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
                onClick={onClose}
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
        <ModalContent
          title='해지 전 확인해주세요'
          className='w-[50rem] max-w-none'>
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
                onClick={onClose}
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
                  await cancelSubscriptionMutation.mutateAsync()
                  onOpenModal({ type: 'cancelDone' })
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
          onConfirm={onClose}
        />
      )}
      {modal?.type === 'billingRegister' && (
        <ModalContent
          title='결제수단 등록하기'
          description='포트원 결제창을 호출해 카드를 등록하고 빌링키를 발급합니다.'
          className='w-[50rem] max-w-none'>
          <div className='mt-32 flex flex-col gap-32'>
            <div className='rounded-12 border border-stroke-border-gray-default bg-background-gray-default p-20 text-noto-body-sm-normal text-text-and-icon-primary'>
              카드 등록 시뮬레이션: ···· ···· ···· 5588
            </div>
            <div className='grid grid-cols-2 gap-12'>
              <Button
                type='button'
                color='gray'
                size='lg'
                variant='filled'
                onClick={onClose}
                className='h-44 w-full'>
                취소
              </Button>
              <Button
                type='button'
                color='primary'
                size='lg'
                variant='filled'
                disabled={registerBillingMethodMutation.isPending}
                onClick={async () => {
                  await registerBillingMethodMutation.mutateAsync({
                    billingKey: 'mock-billing-key',
                  })
                  onOpenModal({ type: 'billingRegistered' })
                }}
                className='h-44 w-full'>
                등록하기
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
          onConfirm={onClose}
        />
      )}
      {modal?.type === 'billingDelete' && (
        <ModalContent
          title='결제수단을 삭제할까요?'
          className='w-[50rem] max-w-none'>
          <div className='mt-32 flex flex-col gap-32'>
            <p className='text-noto-body-sm-normal text-text-and-icon-secondary'>
              삭제 후에는 다음 결제 전 새 결제수단을 등록해야 합니다.
            </p>
            <div className='grid grid-cols-2 gap-12'>
              <Button
                type='button'
                color='gray'
                size='lg'
                variant='filled'
                onClick={onClose}
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
                  const last4 = summary.billingMethod.last4
                  await deleteBillingMethodMutation.mutateAsync()
                  onOpenModal({ type: 'billingDeleted', last4 })
                }}
                className='h-44 w-full'>
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
          onConfirm={onClose}
        />
      )}
      {modal?.type === 'creditPurchase' && selectedOption && (
        <ModalContent
          title='구매할 크레딧을 선택하세요'
          description='1크레딧당 경쟁 채널 분석 1회 제공'
          className='w-[100rem] max-w-none'>
          <div className='mt-32 flex flex-col gap-32'>
            <div className='grid grid-cols-3 gap-16'>
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
                결제 수단을 선택하세요
              </span>
              <div className='grid grid-cols-2 gap-32'>
                <PaymentChoice
                  disabled={summary.billingMethod.status === 'none'}
                  title={
                    summary.billingMethod.status === 'registered'
                      ? '등록 카드로 즉시 구매'
                      : '등록된 결제수단이 없습니다'
                  }
                  description={
                    summary.billingMethod.status === 'registered'
                      ? `···· ···· ···· ${summary.billingMethod.last4} · 카드 재입력 없음`
                      : '결제수단 관리 탭에서 카드를 먼저 등록해주세요.'
                  }
                />
                <PaymentChoice
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
              disabled={purchaseCreditsMutation.isPending}
              onClick={async () => {
                await purchaseCreditsMutation.mutateAsync({
                  optionId: selectedOption.id,
                  paymentMethod:
                    summary.billingMethod.status === 'registered'
                      ? 'registeredCard'
                      : 'oneTime',
                })
                handleClose()
              }}
              className='h-44 w-full'>
              {formatWon(selectedOption.price)} 결제하기
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
            await extendCreditBatchMutation.mutateAsync({
              batchId: modal.batch.id,
            })
            handleClose()
          }}
        />
      )}
      {modal?.type === 'creditRefund' && (
        <ConfirmModal
          title='환불을 신청할까요?'
          description='사용하지 않은 크레딧 기준으로 환불 요청이 접수됩니다. 실제 환불 금액은 결제 정책에 따라 달라질 수 있습니다.'
          confirmText='환불 신청'
          isPending={refundCreditBatchMutation.isPending}
          onCancel={handleClose}
          onConfirm={async () => {
            await refundCreditBatchMutation.mutateAsync({
              batchId: modal.batch.id,
            })
            handleClose()
          }}
        />
      )}
      {modal?.type === 'document' && (
        <NoticeModal
          title={`${modal.documentType} 조회`}
          description={`${modal.item.title}에 대한 ${modal.documentType} mock 액션입니다. 실제 발급 API는 추후 연결합니다.`}
          buttonText='확인'
          onConfirm={onClose}
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
    <ModalContent title={title} description={description} className='w-[50rem]'>
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
    <ModalContent title={title} description={description} className='w-[50rem]'>
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
          {confirmText}
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
        'relative flex h-[15.8rem] flex-col items-start justify-between rounded-12 border p-16 text-left',
        selected
          ? 'border-brand-primary bg-[rgba(90,68,242,0.06)]'
          : 'border-stroke-border-gray-default bg-white'
      )}>
      {option.badge && (
        <span className='absolute top-[-1.2rem] right-0 rounded-t-8 rounded-bl-8 bg-brand-primary px-12 py-2 text-noto-label-xs-bold text-white'>
          {option.badge}
        </span>
      )}
      <span className='text-noto-body-md-bold text-text-and-icon-default'>
        {option.credits} 크레딧
      </span>
      <div className='flex flex-col'>
        <strong className='text-ibm-heading-md-bold text-text-and-icon-default'>
          {formatWon(option.price)}
        </strong>
        <span className='text-noto-caption-md-normal text-text-and-icon-secondary'>
          1크레딧당 {formatWon(option.pricePerCredit)}
        </span>
      </div>
      <span className='w-full text-center text-noto-body-xs-normal text-brand-primary'>
        경쟁 채널 분석 {option.credits}회
      </span>
    </button>
  )
}

function PaymentChoice({
  title,
  description,
  disabled,
}: {
  title: string
  description: string
  disabled?: boolean
}) {
  return (
    <div
      className={cn(
        'flex h-[9rem] flex-col justify-center gap-4 rounded-12 border p-24',
        disabled
          ? 'border-stroke-border-gray-default bg-background-gray-default text-text-and-icon-disabled'
          : 'border-stroke-border-gray-default bg-white text-text-and-icon-primary'
      )}>
      <strong className='text-noto-body-md-bold'>{title}</strong>
      <span className='text-noto-body-xs-normal text-text-and-icon-secondary'>
        {description}
      </span>
    </div>
  )
}

function LoadingState() {
  return (
    <div className='flex h-[40rem] items-center justify-center rounded-16 bg-white shadow-[0px_2px_6px_0px_#0D0D0D0A]'>
      <span className='text-noto-body-sm-normal text-text-and-icon-secondary'>
        구독·결제 정보를 불러오는 중입니다.
      </span>
    </div>
  )
}

export function MyCreditPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [modal, setModal] = useState<ModalState>(null)
  const { data: summary, isLoading } = useBillingSummary()
  const retrySubscriptionPaymentMutation = useRetrySubscriptionPayment()

  const tabParam = searchParams?.get('tab') ?? null
  const activeTab = isBillingTab(tabParam) ? tabParam : 'subscription'

  useEffect(() => {
    if (!tabParam || isBillingTab(tabParam)) {
      return
    }

    router.replace('/me/credit?tab=subscription')
  }, [router, tabParam])

  const handleTabChange = (tab: BillingTab) => {
    startTransition(() => {
      router.replace(`/me/credit?tab=${tab}`)
    })
  }

  return (
    <div className='flex max-w-[118.6rem] flex-1 flex-col gap-32'>
      <header className='flex items-center justify-between'>
        <h1 className='text-noto-title-sm-bold text-text-and-icon-default'>
          구독·결제
        </h1>
        {summary?.subscription.status === 'paymentFailed' && (
          <StatusBadge tone='error'>결제 확인 필요</StatusBadge>
        )}
      </header>
      <TabGroup
        tabs={BILLING_TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        type='fill'
      />
      <div className={cn(isPending && 'opacity-70')}>
        {isLoading || !summary ? (
          <LoadingState />
        ) : (
          <>
            {activeTab === 'subscription' && (
              <SubscriptionTab
                summary={summary}
                onOpenModal={setModal}
                onRetryPayment={() =>
                  retrySubscriptionPaymentMutation.mutateAsync()
                }
                isRetrying={retrySubscriptionPaymentMutation.isPending}
              />
            )}
            {activeTab === 'billing-method' && (
              <BillingMethodTab summary={summary} onOpenModal={setModal} />
            )}
            {activeTab === 'credit' && (
              <CreditTab summary={summary} onOpenModal={setModal} />
            )}
            {activeTab === 'history' && (
              <HistoryTab history={summary.history} onOpenModal={setModal} />
            )}
            <BillingModals
              modal={modal}
              summary={summary}
              onClose={() => setModal(null)}
              onOpenModal={setModal}
            />
          </>
        )}
      </div>
    </div>
  )
}
