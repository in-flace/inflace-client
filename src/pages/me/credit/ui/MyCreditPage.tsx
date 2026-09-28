'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import {
  BILLING_TABS,
  isBillingTab,
  useBillingSummary,
  type BillingTab,
} from '@/features/me/credit'
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
  const [modal, setModal] = useState<ModalState>(null)
  const { data: summary, isLoading, isError, refetch } = useBillingSummary()

  const tabParam = searchParams?.get('tab') ?? null

  /* 화면에 무엇을 그릴지는 이 상태가 정한다. URL에서만 파생시켰더니
   * router.replace가 내비게이션을 일으키지 못할 때 탭이 통째로 멈췄다
   * (배포 환경에서 재현: 핸들러는 정상 실행되는데 URL이 바뀌지 않음).
   * URL은 공유·새로고침·뒤로가기를 위해 뒤따라 맞춰주는 값으로 둔다. */
  const [activeTab, setActiveTab] = useState<BillingTab>(() =>
    isBillingTab(tabParam) ? tabParam : 'subscription'
  )

  /* 뒤로가기나 포트원 리다이렉트처럼 URL이 밖에서 바뀌는 경우를 따라간다.
   * 렌더 중 보정이라 effect를 거치지 않아 중간 프레임이 생기지 않는다. */
  const [syncedTabParam, setSyncedTabParam] = useState(tabParam)
  if (tabParam !== syncedTabParam) {
    setSyncedTabParam(tabParam)
    if (isBillingTab(tabParam)) {
      setActiveTab(tabParam)
    }
  }

  const handleTabChange = (tab: BillingTab) => {
    setActiveTab(tab)
    /* URL 동기화는 부수효과다. 실패해도 화면 전환은 이미 끝나 있다. */
    router.replace(`/me/credit?tab=${tab}`, { scroll: false })
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
      <main className='min-w-0'>
        {isLoading ? (
          <LoadingState />
        ) : isError || !summary ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : (
          <>
            {activeTab === 'subscription' && (
              <SubscriptionTab
                summary={summary}
                onOpenModal={setModal}
                onRetry={() => void refetch()}
              />
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
