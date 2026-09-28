'use client'

import dynamic from 'next/dynamic'

import { useInquiryPanel } from '@/features/inquiry'

import { InquiryFloatingButton } from './InquiryFloatingButton'

const InquiryPanel = dynamic(
  () => import('./InquiryPanel').then((module) => module.InquiryPanel),
  { ssr: false }
)

/* 입력값과 전송 상태는 InquiryPanel이 들고 있다. 닫히면 언마운트되므로
 * 다음에 열릴 때 자동으로 빈 폼이 된다. */
export function InquiryWidget() {
  const isOpen = useInquiryPanel((s) => s.isOpen)

  return (
    <>
      {isOpen && <InquiryPanel />}
      <InquiryFloatingButton />
    </>
  )
}
