'use client'

import { useState } from 'react'
import { TabGroup } from '@/shared/ui/tabGroup'
import { SearchBar } from '@/shared/ui/search-bar'
import { Pagination } from '@/shared/ui/pagination'
import { formatComma } from '@/shared/lib/format'
import { useFeedbacks, type FeedbackStatus } from '@/features/admin'
import { FeedbackTable } from '@/widgets/adminFeedback'

const PAGE_SIZE = 10
const KAKAO_CHANNEL_URL = 'https://pf.kakao.com/_KpzSX'

type Tab = 'ALL' | FeedbackStatus

export function AdminFeedbackPage() {
  const [tab, setTab] = useState<Tab>('ALL')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)

  const { data } = useFeedbacks({
    status: tab === 'ALL' ? undefined : tab,
    keyword: keyword || undefined,
    page,
    size: PAGE_SIZE,
  })

  const tabs = [
    { id: 'ALL', label: '전체' },
    { id: 'UNCONFIRMED', label: `미확인 ${data?.unconfirmedCount ?? ''}` },
    { id: 'ON_HOLD', label: `보류 ${data?.onHoldCount ?? ''}` },
    { id: 'CONFIRMED', label: '확인 완료' },
  ] as const

  // 필터가 바뀌면 첫 페이지로
  function changeTab(next: Tab) {
    setTab(next)
    setPage(0)
  }
  function changeKeyword(next: string) {
    setKeyword(next)
    setPage(0)
  }

  const feedbacks = data?.feedbacks.content ?? []
  const totalPages = data?.feedbacks.totalPages ?? 0

  return (
    <div className='flex w-full flex-col gap-24 p-24'>
      <div className='max-w-[74rem]'>
        <TabGroup tabs={tabs} activeTab={tab} onTabChange={changeTab} />
      </div>

      <section className='flex flex-col gap-16 rounded-16 bg-white p-24'>
        <div className='flex items-end justify-between gap-16'>
          <label className='flex w-full max-w-[76rem] flex-col gap-8'>
            <span className='text-noto-label-sm-bold text-text-and-icon-secondary'>
              텍스트 검색
            </span>
            <SearchBar
              placeholder='접수 내용 검색'
              value={keyword}
              onChange={(e) => changeKeyword(e.target.value)}
              onClear={() => changeKeyword('')}
            />
          </label>
          <a
            href={KAKAO_CHANNEL_URL}
            target='_blank'
            rel='noreferrer'
            className='shrink-0 rounded-8 bg-[#FFE500] px-16 py-10 text-noto-label-sm-bold text-black'>
            카카오 채널 바로가기
          </a>
        </div>

        <FeedbackTable feedbacks={feedbacks} />
      </section>

      <div className='flex items-center justify-between'>
        <span className='text-noto-label-xs-normal text-text-and-icon-secondary'>
          {formatComma(data?.unconfirmedCount)} 건 대기 중 · {feedbacks.length}{' '}
          건 표시
        </span>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  )
}
