import Link from 'next/link'
import { AppLogo } from '@/widgets/layout/logo'

/* 통신판매업자가 표시해야 하는 사업자 정보.
 * 값이 바뀌면 이 상수만 고치면 되도록 마크업과 분리한다. */
const BUSINESS_INFO = [
  { label: '사업자등록번호', value: '299-01-04001' },
  { label: '대표자', value: '정다영' },
  { label: '전화', value: '070-8065-3317' },
  {
    label: '주소',
    value:
      '서울특별시 강남구 영동대로 602, 6층 z216호 (삼성동, 삼성동미켈란107)',
  },
] as const

export const FooterInfo = () => {
  return (
    <div className='flex flex-col self-stretch'>
      <AppLogo variant='footer' />
      <div className='flex-1' />
      <div className='flex flex-col gap-y-xs'>
        <ul className='flex gap-sm'>
          <li className='text-noto-label-md-normal text-text-and-icon-primary'>
            <Link href='/privacy'>개인정보처리방침</Link>
          </li>
          <li className='text-noto-label-md-normal text-text-and-icon-primary'>
            <Link href='/terms'>이용약관</Link>
          </li>
        </ul>

        {/* address는 연락처 정보를 위한 요소라 의미가 맞는다.
         * 브라우저 기본 이탤릭만 not-italic으로 되돌린다. */}
        <address className='flex flex-col gap-y-2xs text-noto-caption-md-normal text-text-and-icon-tertiary not-italic'>
          {BUSINESS_INFO.map(({ label, value }) => (
            <p key={label}>
              {label} {value}
            </p>
          ))}
        </address>

        <p className='text-noto-caption-md-normal text-text-and-icon-tertiary'>
          ⓒ 2026. inflace All rights reserved.
        </p>
      </div>
    </div>
  )
}
