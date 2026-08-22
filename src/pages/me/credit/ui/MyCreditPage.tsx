'use client'

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

import {
  BILLING_TABS,
  formatDate,
  formatWon,
  getNearestExpiryDate,
  getTotalCredits,
  issueCardBillingKey,
  isBillingTab,
  useBillingSummary,
  useCancelSubscription,
  useDeleteBillingMethod,
  useExtendCreditBatch,
  usePurchaseCredits,
  useRefundCreditBatch,
  useRegisterBillingMethod,
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

type PayerInfo = {
  name: string
  phone: string
  email: string
}

const emptyPayerInfo: PayerInfo = {
  name: '',
  phone: '',
  email: '',
}

type ModalState =
  | { type: 'subscribe'; plan: BillingPlan }
  | { type: 'cancelReason' }
  | { type: 'cancelNotice' }
  | { type: 'cancelDone' }
  | { type: 'billingRegister' }
  | { type: 'billingChange' }
  | { type: 'billingRegistered' }
  | { type: 'billingChanged' }
  | { type: 'billingDelete' }
  | { type: 'billingDeleted'; last4: string | null }
  | { type: 'creditPurchase' }
  | { type: 'creditExtend'; batch: CreditBatch }
  | { type: 'creditRefund'; batch: CreditBatch }
  | { type: 'document'; item: BillingHistoryItem; documentType: string }
  | null

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'
}

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
        'rounded-16 bg-white p-20 shadow-[0px_2px_6px_0px_#0D0D0D0A] sm:p-32',
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
      className={cn(
        'max-h-[calc(100dvh-3.2rem)] w-[calc(100vw-3.2rem)] max-w-none overflow-y-auto rounded-16 bg-white p-24 shadow-none sm:max-w-none sm:p-40',
        className
      )}>
      <div className='flex flex-col gap-8'>
        <DialogTitle className='text-noto-title-sm-bold text-text-and-icon-default'>
          {title}
        </DialogTitle>
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
    <article className='relative flex min-h-[32rem] flex-1 flex-col rounded-16 border border-stroke-border-gray-default bg-white p-24 sm:min-h-[36.8rem] sm:p-32'>
      {plan.badge && (
        <span className='absolute top-[-2.4rem] right-0 rounded-t-12 rounded-br-0 rounded-bl-12 bg-[#FFF0F0] px-16 py-[1.3rem] text-noto-label-sm-bold text-feedback-error sm:px-24 sm:text-noto-label-md-bold'>
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
        color={plan.code === 'PRO_EARLY_BIRD' ? 'primary' : 'gray'}
        size='lg'
        variant='filled'
        disabled={disabled}
        onClick={onSubscribe}
        className='h-44 w-full'>
        선택하기
      </Button>
    </article>
  )
}

function SubscriptionTab({
  summary,
  onOpenModal,
}: {
  summary: BillingSummary
  onOpenModal: (modal: ModalState) => void
}) {
  const { subscription, plans } = summary
  const isSubscribed =
    subscription.status === 'active' ||
    subscription.status === 'cancelScheduled' ||
    subscription.status === 'paymentFailed'

  if (!isSubscribed) {
    return (
      <SectionCard className='flex min-h-[64.2rem] flex-col gap-40 px-20 py-32 sm:px-32 sm:py-48'>
        <div className='grid grid-cols-1 gap-40 lg:grid-cols-2 lg:gap-16'>
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
            플랜 구독과 크레딧, 무엇이 다른가요?
          </h3>
          <div className='flex flex-col gap-12 text-noto-body-sm-normal text-text-and-icon-secondary'>
            <p className='before:mr-8 before:content-["·"]'>
              최대한 예산 낭비없이 필요하신 만큼만 사용하실 수 있도록 플랜
              구독과 크레딧제를 별도로 운영하고 있습니다.
            </p>
            <p className='before:mr-8 before:content-["·"]'>
              플랜을 구독하실 경우, 인플루언서 검색 탭 내에서 사용할 수 있는
              검색, 성과 분석, 광고 분석 기능을 무제한으로 사용할 수 있습니다.
            </p>
            <p className='before:mr-8 before:content-["·"]'>
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
          <div className='flex flex-col items-start justify-between gap-24 sm:flex-row sm:items-center'>
            <div className='flex flex-col gap-8'>
              <div className='flex items-center gap-8'>
                <StatusBadge tone='error'>결제 실패</StatusBadge>
                <h3 className='text-noto-body-md-bold text-text-and-icon-default'>
                  이번 달 구독 결제가 실패했습니다.
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
              onClick={() => onOpenModal({ type: 'billingChange' })}>
              결제수단 변경
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
      <div className='grid grid-cols-1 gap-16 sm:grid-cols-2 xl:grid-cols-4 xl:gap-24'>
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
    <SectionCard className='h-[13rem] p-24 sm:h-[13.4rem] sm:p-32'>
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
      <SectionCard className='flex min-h-[17.8rem] flex-col items-center justify-center gap-20 text-center'>
        <div className='flex flex-col items-center gap-8'>
          <h3 className='text-noto-body-md-bold text-text-and-icon-default'>
            등록된 결제수단이 없습니다.
          </h3>
          <p className='max-w-[58rem] text-noto-body-xs-normal text-text-and-icon-secondary'>
            카드를 등록하면 구독 시작, 다음 정기결제, 추가 크레딧 구매를 한
            곳에서 관리할 수 있습니다.
          </p>
        </div>
        <Button
          type='button'
          color='primary'
          size='lg'
          variant='filled'
          onClick={() => onOpenModal({ type: 'billingRegister' })}>
          카드 등록하기
        </Button>
        <p className='text-noto-body-xs-normal text-text-and-icon-tertiary'>
          카드번호는 인플레이스에 저장되지 않으며 포트원/PG사를 통해 안전하게
          처리됩니다.
        </p>
      </SectionCard>
    )
  }

  return (
    <div className='flex flex-col gap-12'>
      <SectionCard className='flex min-h-[9rem] flex-col gap-24 p-24'>
        <div className='flex flex-col items-start justify-between gap-24 sm:flex-row'>
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
          </div>
        </div>
      </SectionCard>
      <div className='flex justify-end gap-8'>
        <Button
          type='button'
          color='secondary'
          size='md'
          variant='filled'
          onClick={() => onOpenModal({ type: 'billingChange' })}>
          변경
        </Button>
        <Button
          type='button'
          color='secondary'
          size='md'
          variant='outlined'
          onClick={() => onOpenModal({ type: 'billingDelete' })}>
          삭제
        </Button>
      </div>
    </div>
  )
}

function CreditTab({
  summary,
  onOpenModal,
  onRequestSubscription,
}: {
  summary: BillingSummary
  onOpenModal: (modal: ModalState) => void
  onRequestSubscription: () => void
}) {
  const isSubscribed = summary.subscription.status !== 'none'

  if (!isSubscribed) {
    return (
      <EmptyActionCard
        title='크레딧 구매 및 분석 실행은 구독자 전용 기능입니다.'
        actionText='구독 탭으로 이동'
        onAction={onRequestSubscription}
      />
    )
  }

  return (
    <div className='flex flex-col gap-24'>
      <div className='flex justify-start'>
        <Button
          type='button'
          color='primary'
          size='lg'
          variant='filled'
          onClick={() => onOpenModal({ type: 'creditPurchase' })}>
          크레딧 구매
        </Button>
      </div>
      <div className='grid grid-cols-1 gap-16 sm:grid-cols-2 sm:gap-24'>
        <MetricCard
          label='보유 크레딧'
          value={`${getTotalCredits(summary.creditBatches)}개`}
        />
        <MetricCard
          label='가장 빠른 만료일'
          value={formatDate(getNearestExpiryDate(summary.creditBatches))}
        />
      </div>
      <SectionCard className='min-h-[44.8rem] p-24'>
        <Table className='min-w-[100rem] table-fixed'>
          <TableHeader>
            <TableRow>
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
                <TableCell>{formatDate(batch.paymentDate)}</TableCell>
                <TableCell>{formatDate(batch.expiryDate)}</TableCell>
                <TableCell>
                  {batch.type === 'subscription' ? '월 제공' : '구매'}
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
                    {getCreditExtendLabel(batch)}
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
                    {getCreditRefundLabel(batch)}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className='mt-32 flex items-center justify-between'>
          <span className='text-noto-body-sm-normal text-text-and-icon-secondary'>
            <strong className='mr-8 text-brand-primary'>
              {summary.creditBatches.length}
            </strong>
            results
          </span>
          <div className='flex gap-12'>
            <Button
              type='button'
              color='gray'
              size='md'
              variant='filled'
              disabled>
              이전
            </Button>
            <Button
              type='button'
              color='secondary'
              size='md'
              variant='outlined'
              disabled>
              다음
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

function getCreditExtendLabel(batch: CreditBatch) {
  if (batch.extendedAt) return '연장 완료'
  if (!batch.extendable || batch.refundedAt) return '연장 불가'
  return '연장 신청'
}

function getCreditRefundLabel(batch: CreditBatch) {
  if (batch.refundedAt) return '환불 완료'
  if (!batch.refundable) return '환불 불가'
  return '환불 신청'
}

function EmptyActionCard({
  title,
  description,
  actionText,
  onAction,
}: {
  title: string
  description?: string
  actionText: string
  onAction: () => void
}) {
  return (
    <SectionCard className='flex min-h-[16.1rem] flex-col items-center justify-center gap-20 text-center'>
      <div className='flex flex-col items-center gap-8'>
        <h3 className='text-noto-body-md-bold text-text-and-icon-default'>
          {title}
        </h3>
        {description && (
          <p className='text-noto-body-xs-normal text-text-and-icon-secondary'>
            {description}
          </p>
        )}
      </div>
      <Button
        type='button'
        color='primary'
        size='lg'
        variant='filled'
        onClick={onAction}>
        {actionText}
      </Button>
    </SectionCard>
  )
}

function HistoryTab({
  history,
  onOpenModal,
  onRequestSubscription,
}: {
  history: BillingHistoryItem[]
  onOpenModal: (modal: ModalState) => void
  onRequestSubscription: () => void
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const selectedItem = history.find((item) => selectedIds.has(item.id))
  const allSelected = history.length > 0 && selectedIds.size === history.length

  const toggleItem = (itemId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  const openDocumentModal = (documentType: string) => {
    if (!selectedItem) {
      toast.info('내역을 선택해주세요.')
      return
    }
    onOpenModal({ type: 'document', item: selectedItem, documentType })
  }

  if (history.length === 0) {
    return (
      <EmptyActionCard
        title='아직 결제·환불 내역이 없습니다'
        description='구독을 시작하거나 크레딧을 구매하면 이곳에서 내역을 확인할 수 있습니다.'
        actionText='구독 탭으로 이동'
        onAction={onRequestSubscription}
      />
    )
  }

  return (
    <div className='flex flex-col gap-24'>
      <div className='flex flex-wrap gap-12'>
        <Button
          type='button'
          color='gray'
          size='lg'
          variant='filled'
          disabled={selectedItem ? !selectedItem.taxInvoiceAvailable : false}
          onClick={() => openDocumentModal('세금계산서')}>
          세금계산서 신청
        </Button>
        <Button
          type='button'
          color='gray'
          size='lg'
          variant='filled'
          disabled={selectedItem ? !selectedItem.receiptAvailable : false}
          onClick={() => openDocumentModal('현금영수증')}>
          현금영수증 신청
        </Button>
      </div>
      <SectionCard className='min-h-[44.8rem] p-24'>
        <Table className='min-w-[90rem] table-fixed'>
          <TableHeader>
            <TableRow>
              <TableHead className='w-44 bg-transparent'>
                <button
                  type='button'
                  role='checkbox'
                  aria-label='전체 결제 내역 선택'
                  aria-checked={allSelected}
                  onClick={() =>
                    setSelectedIds(
                      allSelected
                        ? new Set()
                        : new Set(history.map((item) => item.id))
                    )
                  }
                  className={cn(
                    'mx-auto flex size-20 items-center justify-center rounded-4 border',
                    allSelected
                      ? 'border-brand-primary bg-brand-primary text-white'
                      : 'border-stroke-border-gray-stronger text-transparent'
                  )}>
                  <CheckIcon className='size-14' />
                </button>
              </TableHead>
              <TableHead>결제 날짜</TableHead>
              <TableHead>유형</TableHead>
              <TableHead>내용</TableHead>
              <TableHead>금액</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <button
                    type='button'
                    role='checkbox'
                    aria-label={`${item.title} 선택`}
                    aria-checked={selectedIds.has(item.id)}
                    onClick={() => toggleItem(item.id)}
                    className={cn(
                      'mx-auto flex size-20 items-center justify-center rounded-4 border',
                      selectedIds.has(item.id)
                        ? 'border-brand-primary bg-brand-primary text-white'
                        : 'border-stroke-border-gray-stronger text-transparent'
                    )}>
                    <CheckIcon className='size-14' />
                  </button>
                </TableCell>
                <TableCell>{formatDate(item.date)}</TableCell>
                <TableCell>{getHistoryTypeLabel(item.type)}</TableCell>
                <TableCell className='text-left'>{item.title}</TableCell>
                <TableCell>{formatWon(item.amount)}</TableCell>
                <TableCell>
                  <HistoryStatusBadge status={item.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className='mt-32 flex items-center justify-between gap-12'>
          <span className='text-noto-body-sm-normal text-text-and-icon-secondary'>
            <strong className='mr-8 text-brand-primary'>
              {history.length}
            </strong>
            results
          </span>
          <div className='flex gap-12'>
            <Button
              type='button'
              color='gray'
              size='md'
              variant='filled'
              disabled>
              이전
            </Button>
            <Button
              type='button'
              color='secondary'
              size='md'
              variant='outlined'
              disabled>
              다음
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

function getHistoryTypeLabel(type: BillingHistoryItem['type']) {
  switch (type) {
    case 'subscription':
      return '구독 결제'
    case 'creditPurchase':
      return '크레딧 구매'
    case 'creditRefund':
      return '환불'
    case 'creditUsage':
      return '크레딧 사용'
    case 'creditRestore':
      return '크레딧 복원'
    case 'creditExtension':
      return '크레딧 연장'
    case 'creditExpiration':
      return '크레딧 만료'
  }
}

function HistoryStatusBadge({ status }: { status: BillingHistoryStatus }) {
  switch (status) {
    case 'paid':
      return <StatusBadge tone='success'>결제 완료</StatusBadge>
    case 'failed':
      return <StatusBadge tone='error'>결제 실패</StatusBadge>
    case 'refunded':
      return <StatusBadge tone='warning'>환불 완료</StatusBadge>
    case 'scheduled':
      return <StatusBadge tone='error'>해지 예약</StatusBadge>
    case 'completed':
      return <StatusBadge tone='neutral'>완료</StatusBadge>
  }
}

function getStableIdempotencyKey(ref: { current: string | null }) {
  ref.current ??= crypto.randomUUID()
  return ref.current
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
  const [payerInfo, setPayerInfo] = useState<PayerInfo>(emptyPayerInfo)
  const registerBillingMethodIdempotencyKeyRef = useRef<string | null>(null)
  const startSubscriptionIdempotencyKeyRef = useRef<string | null>(null)
  const purchaseCreditsIdempotencyKeyRef = useRef<string | null>(null)
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
    setCancelReason('사용 빈도가 낮아요')
    setPayerInfo(emptyPayerInfo)
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
                className='h-44 rounded-6 border border-stroke-border-gray-stronger bg-white px-16 text-noto-body-sm-normal text-text-and-icon-primary outline-none'>
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
          onConfirm={onClose}
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
                onClick={onClose}
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
                등록하기
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
                onClick={onClose}
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
                      issueName: '인플레이스 결제수단 변경',
                    })
                    await registerBillingMethodMutation.mutateAsync({
                      idempotencyKey: getStableIdempotencyKey(
                        registerBillingMethodIdempotencyKeyRef
                      ),
                      payload: { billingKey },
                    })
                    onOpenModal({ type: 'billingChanged' })
                  } catch (error) {
                    toast.error(getErrorMessage(error))
                  } finally {
                    setIsPaymentWindowPending(false)
                  }
                }}
                className='h-44 w-full'>
                카드 등록하고 교체하기
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
      {modal?.type === 'billingChanged' && (
        <NoticeModal
          title='결제수단이 변경되었습니다'
          description='새 카드 ···· ···· ···· 5588가 다음 결제부터 사용됩니다.'
          buttonText='확인'
          onConfirm={onClose}
        />
      )}
      {modal?.type === 'billingDelete' && (
        <ModalContent title='결제수단을 삭제할까요?' className='sm:w-[50rem]'>
          <div className='mt-32 flex flex-col gap-32'>
            <p className='text-noto-body-sm-normal text-text-and-icon-secondary'>
              삭제 시 등록된 빌링키가 폐기됩니다. 구독 중이라면 다음 결제 전
              새 카드를 등록해야 자동결제가 유지됩니다.
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
          onConfirm={onClose}
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
              결제 내역 확인하기
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
      {modal?.type === 'creditRefund' && (
        <ConfirmModal
          title='환불을 신청할까요?'
          description='사용하지 않은 크레딧 기준으로 환불 요청이 접수됩니다. 실제 환불 금액은 결제 정책에 따라 달라질 수 있습니다.'
          confirmText='환불 신청'
          isPending={refundCreditBatchMutation.isPending}
          onCancel={handleClose}
          onConfirm={async () => {
            try {
              await refundCreditBatchMutation.mutateAsync({
                batchId: modal.batch.id,
              })
              toast.success('환불 신청이 접수되었습니다.')
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
        'relative flex h-[15.8rem] flex-col items-center justify-center gap-12 rounded-6 border p-16 text-center',
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

function PayerInfoFields({
  value,
  onChange,
  layout = 'stack',
}: {
  value: PayerInfo
  onChange: (value: PayerInfo) => void
  layout?: 'stack' | 'inline'
}) {
  const fields: { key: keyof PayerInfo; label: string; autoComplete: string }[] = [
    { key: 'name', label: '이름', autoComplete: 'name' },
    { key: 'phone', label: '전화번호', autoComplete: 'tel' },
    { key: 'email', label: '이메일', autoComplete: 'email' },
  ]

  return (
    <div
      className={cn(
        'grid gap-12',
        layout === 'inline' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'
      )}>
      {fields.map((field) => (
        <input
          key={field.key}
          value={value[field.key]}
          onChange={(event) =>
            onChange({ ...value, [field.key]: event.target.value })
          }
          placeholder={field.label}
          autoComplete={field.autoComplete}
          className='h-44 rounded-6 border border-stroke-border-gray-stronger bg-white px-16 text-noto-label-md-normal text-text-and-icon-primary outline-none placeholder:text-text-and-icon-disabled focus:border-brand-primary'
        />
      ))}
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
        className='flex flex-col gap-4 text-left disabled:pointer-events-none'>
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

function LoadingState() {
  return (
    <div className='flex h-[40rem] items-center justify-center rounded-16 bg-white shadow-[0px_2px_6px_0px_#0D0D0D0A]'>
      <span className='text-noto-body-sm-normal text-text-and-icon-secondary'>
        구독·결제 정보를 불러오는 중입니다.
      </span>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className='flex min-h-[32rem] flex-col items-center justify-center gap-20 rounded-16 bg-white p-24 text-center shadow-[0px_2px_6px_0px_#0D0D0D0A]'>
      <div className='flex flex-col gap-8'>
        <strong className='text-noto-title-sm-bold text-text-and-icon-default'>
          구독·결제 정보를 불러오지 못했습니다
        </strong>
        <p className='text-noto-body-sm-normal text-text-and-icon-secondary'>
          네트워크 상태를 확인한 뒤 다시 시도해주세요.
        </p>
      </div>
      <Button
        type='button'
        color='primary'
        size='lg'
        variant='filled'
        onClick={onRetry}>
        다시 불러오기
      </Button>
    </div>
  )
}

export function MyCreditPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [modal, setModal] = useState<ModalState>(null)
  const { data: summary, isLoading, isError, refetch } = useBillingSummary()

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
    <div className='flex w-full max-w-[118.6rem] min-w-0 flex-1 flex-col gap-24 px-16 pb-40 sm:px-24 lg:gap-32 lg:px-0'>
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
        scrollable
      />
      <div className={cn(isPending && 'opacity-70')}>
        {isLoading ? (
          <LoadingState />
        ) : isError || !summary ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : (
          <>
            {activeTab === 'subscription' && (
              <SubscriptionTab summary={summary} onOpenModal={setModal} />
            )}
            {activeTab === 'billing-method' && (
              <BillingMethodTab summary={summary} onOpenModal={setModal} />
            )}
            {activeTab === 'credit' && (
              <CreditTab
                summary={summary}
                onOpenModal={setModal}
                onRequestSubscription={() => handleTabChange('subscription')}
              />
            )}
            {activeTab === 'history' && (
              <HistoryTab
                history={summary.history}
                onOpenModal={setModal}
                onRequestSubscription={() => handleTabChange('subscription')}
              />
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
