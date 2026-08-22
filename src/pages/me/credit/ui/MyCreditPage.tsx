'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import {
  BILLING_TABS,
  isBillingTab,
  useBillingSummary,
  type BillingTab,
} from '@/features/me/credit'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { TabGroup } from '@/shared/ui/tabGroup'
import { BillingModals } from './BillingModals'
import { StatusBadge } from './BillingPrimitives'
import {
  BillingMethodTab,
  CreditTab,
  HistoryTab,
  SubscriptionTab,
} from './BillingTabs'
import type { ModalState } from './billingPageTypes'

function LoadingState() {
  return (
    <div
      role='status'
      aria-live='polite'
      className='flex h-[40rem] items-center justify-center rounded-16 bg-white shadow-[0px_2px_6px_0px_#0D0D0D0A]'>
      <span className='text-noto-body-sm-normal text-text-and-icon-secondary'>
        구독·결제 정보를 불러오는 중입니다…
      </span>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role='alert'
      className='flex min-h-[32rem] flex-col items-center justify-center gap-20 rounded-16 bg-white p-24 text-center shadow-[0px_2px_6px_0px_#0D0D0D0A]'>
      <div className='flex flex-col gap-8'>
        <strong className='text-noto-title-sm-bold text-pretty text-text-and-icon-default'>
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
    if (!tabParam || isBillingTab(tabParam)) return
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
      <main className={cn('min-w-0', isPending && 'opacity-70')}>
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
      </main>
    </div>
  )
}
