'use client'

import { useState } from 'react'
import { TabGroup } from '@/shared/ui/tabGroup'
import { PendingBrandQueue } from './PendingBrandQueue'
import { BrandHistory } from './BrandHistory'

const TABS = [
  { id: 'pending', label: '검수 대기 큐' },
  { id: 'history', label: '검수 완료 내역' },
] as const
type Tab = (typeof TABS)[number]['id']

export function AdminBrandReviewPage() {
  const [tab, setTab] = useState<Tab>('pending')

  return (
    <div className='flex w-full flex-col gap-24 p-24'>
      <div className='max-w-[74rem]'>
        <TabGroup tabs={TABS} activeTab={tab} onTabChange={setTab} />
      </div>
      {tab === 'pending' ? <PendingBrandQueue /> : <BrandHistory />}
    </div>
  )
}
