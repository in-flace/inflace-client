'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import {
  formatDate,
  formatWon,
  getNearestExpiryDate,
  getTotalCredits,
  type BillingHistoryItem,
  type BillingHistoryStatus,
  type BillingPlan,
  type BillingSummary,
  type CreditBatch,
} from '@/features/me/credit'
import CheckIcon from '@/shared/assets/check-bold.svg'
import PaymentIcon from '@/shared/assets/payment-bold.svg'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { SectionCard, StatusBadge } from './BillingPrimitives'
import type { ModalState } from './billingPageTypes'

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

export function SubscriptionTab({
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

  const subscriptionStatus = {
    none: { label: '미구독', tone: 'neutral' as const },
    active: { label: '구독중', tone: 'success' as const },
    cancelScheduled: { label: '해지 예약', tone: 'success' as const },
    paymentFailed: { label: '결제 실패', tone: 'error' as const },
  }[subscription.status]

  return (
    <div className='flex flex-col gap-24'>
      {subscription.status === 'active' && (
        <SectionCard className='border border-[rgba(36,115,230,0.08)] bg-[rgba(36,115,230,0.08)] p-24'>
          <div className='flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-32'>
            <StatusBadge tone='info'>안내</StatusBadge>
            <div className='flex min-w-0 flex-col gap-4'>
              <h3 className='text-noto-body-md-bold text-pretty text-text-and-icon-default'>
                얼리버드 구독이 유지 중입니다.
              </h3>
              <p className='text-noto-body-xs-normal text-pretty text-text-and-icon-secondary'>
                다음 결제일까지 이용 가능하며, 해지 후 재가입하면 정상가가
                적용됩니다.
              </p>
            </div>
          </div>
        </SectionCard>
      )}
      {subscription.status === 'paymentFailed' && (
        <SectionCard className='border border-feedback-error bg-[rgba(224,47,82,0.05)]'>
          <div className='flex flex-col items-start justify-between gap-24 sm:flex-row sm:items-center'>
            <div className='flex flex-col gap-8'>
              <div className='flex items-center gap-8'>
                <StatusBadge tone='error'>조치 필요</StatusBadge>
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
              onClick={() => onOpenModal({ type: 'billingChange' })}
              className='h-44 w-full sm:w-auto'>
              결제수단 변경
            </Button>
          </div>
        </SectionCard>
      )}
      {subscription.status === 'cancelScheduled' && (
        <SectionCard className='border border-[#E9B949] bg-[#FFF9E8]'>
          <div className='flex flex-col gap-8'>
            <div className='flex items-center gap-8'>
              <StatusBadge tone='warning'>확인 필요</StatusBadge>
              <h3 className='text-noto-body-md-bold text-pretty text-text-and-icon-default'>
                구독 해지가 예약되어 있습니다.
              </h3>
            </div>
            <p className='text-noto-body-sm-normal text-text-and-icon-secondary'>
              {formatDate(subscription.cancelScheduledDate)}까지 이용 가능하며,
              그 전에는 결제를 철회할 수 있습니다.
            </p>
          </div>
        </SectionCard>
      )}
      <div className='grid grid-cols-1 gap-16 sm:grid-cols-2 xl:grid-cols-4 xl:gap-24'>
        <MetricCard
          label='현재 플랜'
          value={subscription.planName ?? '-'}
          suffix={subscriptionStatus.label}
          suffixTone={subscriptionStatus.tone}
        />
        <MetricCard
          label='월 결제 금액'
          value={formatWon(subscription.monthlyPrice)}
          suffix='VAT 포함'
        />
        <MetricCard
          label='다음 결제일'
          value={formatDate(subscription.nextPaymentDate)}
          suffix='자동결제'
          suffixTone='info'
        />
        <MetricCard
          label='보유 크레딧'
          value={`${getTotalCredits(summary.creditBatches)}개`}
        />
      </div>
      <SectionCard className='flex flex-col gap-20'>
        <h3 className='text-noto-body-md-bold text-text-and-icon-default'>
          구독 정책
        </h3>
        <ul className='flex flex-col gap-8 text-noto-body-sm-normal text-text-and-icon-secondary [&>li]:before:mr-8 [&>li]:before:content-["·"]'>
          <li>구독 유지 중에는 매월 3 크레딧이 자동 지급됩니다.</li>
          <li>월 지급 크레딧은 다음 달로 이월되지 않습니다.</li>
          <li>해지해도 결제 완료 기간까지 이용할 수 있습니다.</li>
          <li>크레딧은 만료일까지 사용 가능합니다.</li>
        </ul>
      </SectionCard>
      {subscription.status === 'active' && (
        <div className='flex justify-start'>
          <Button
            type='button'
            color='primary'
            size='sm'
            variant='filled'
            onClick={() => onOpenModal({ type: 'cancelReason' })}
            className='bg-feedback-error'>
            해지하기
          </Button>
        </div>
      )}
    </div>
  )
}

function MetricCard({
  label,
  value,
  suffix,
  suffixTone = 'neutral',
}: {
  label: string
  value: string
  suffix?: string
  suffixTone?: 'success' | 'error' | 'warning' | 'neutral' | 'info'
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
          {suffix && <StatusBadge tone={suffixTone}>{suffix}</StatusBadge>}
        </div>
      </div>
    </SectionCard>
  )
}

export function BillingMethodTab({
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
    <SectionCard className='min-h-[12.4rem] p-24'>
      <div className='flex flex-col gap-16 sm:flex-row sm:items-center sm:justify-between sm:gap-24'>
        <div className='flex min-w-0 flex-1 items-center gap-12 rounded-12 bg-background-gray-default p-16'>
          <PaymentIcon
            aria-hidden='true'
            className='size-24 shrink-0 text-text-and-icon-primary'
          />
          <div className='flex min-w-0 flex-col gap-4'>
            <span className='text-noto-body-xs-normal text-text-and-icon-secondary'>
              결제 수단
            </span>
            <strong className='truncate text-noto-body-sm-bold text-text-and-icon-primary'>
              {billingMethod.brand} ···· {billingMethod.last4}
            </strong>
          </div>
        </div>
        <div className='grid grid-cols-2 gap-12 sm:min-w-[38rem]'>
          <Button
            type='button'
            color='secondary'
            size='md'
            variant='filled'
            onClick={() => onOpenModal({ type: 'billingChange' })}
            className='h-44 w-full'>
            변경
          </Button>
          <Button
            type='button'
            color='secondary'
            size='md'
            variant='outlined'
            onClick={() => onOpenModal({ type: 'billingDelete' })}
            className='h-44 w-full'>
            삭제
          </Button>
        </div>
      </div>
    </SectionCard>
  )
}

export function CreditTab({
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

export function HistoryTab({
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
                    'mx-auto flex size-20 items-center justify-center rounded-4 border focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:outline-none',
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
                      'mx-auto flex size-20 items-center justify-center rounded-4 border focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:outline-none',
                      selectedIds.has(item.id)
                        ? 'border-brand-primary bg-brand-primary text-white'
                        : 'border-stroke-border-gray-stronger text-transparent'
                    )}>
                    <CheckIcon className='size-14' />
                  </button>
                </TableCell>
                <TableCell>{formatDate(item.date)}</TableCell>
                <TableCell>{getHistoryTypeLabel(item.type)}</TableCell>
                <TableCell className='max-w-[28rem] truncate text-left'>
                  {item.title}
                </TableCell>
                <TableCell className='tabular-nums'>
                  {formatWon(item.amount)}
                </TableCell>
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
