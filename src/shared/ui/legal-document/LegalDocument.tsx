import type { ReactNode } from 'react'

interface LegalDocumentProps {
  title: string
  effectiveDate: string
  intro?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

/* 이용약관/개인정보처리방침처럼 "제목 + 시행일 헤더 + 조항 나열 + 부칙" 구조를
 * 공유하는 법률 문서 페이지 레이아웃. TermsPage/PrivacyPage가 이 마크업을
 * 그대로 복붙해 쓰고 있었다. */
export function LegalDocument({
  title,
  effectiveDate,
  intro,
  children,
  footer,
}: LegalDocumentProps) {
  return (
    <article className='mx-auto w-full max-w-5xl px-32 py-64 text-[17px] text-gray-800'>
      <header className='mb-56 border-b border-gray-200 pb-40'>
        <h1 className='text-4xl font-bold text-gray-900'>{title}</h1>
        <p className='mt-16 text-base text-gray-500'>시행일: {effectiveDate}</p>
      </header>

      {intro}

      {children}

      {footer && (
        <footer className='mt-64 border-t border-gray-200 pt-40'>
          {footer}
        </footer>
      )}
    </article>
  )
}

export function LegalSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className='mb-56'>
      <h2 className='mb-20 text-2xl font-semibold text-gray-900'>{title}</h2>
      {children}
    </section>
  )
}
