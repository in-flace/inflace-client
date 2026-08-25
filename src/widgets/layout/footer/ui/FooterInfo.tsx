import Link from 'next/link'
import { AppLogo } from '@/widgets/layout/logo'

/* 통신판매업자가 표시해야 하는 사업자 정보.
 * 값이 바뀌면 이 상수만 고치면 되도록 마크업과 분리한다.
 *
 * 항목마다 줄을 나누면 푸터가 네 줄만큼 길어지는 데 비해 정보 밀도가 낮고,
 * 저작권 줄과 글자 크기·색이 같아 다섯 줄이 한 덩어리로 읽힌다.
 * 짧은 항목은 한 줄에 묶고 긴 주소만 따로 두어 두 줄로 압축한다. */
const BUSINESS_LINES = [
  ['사업자등록번호 299-01-04001', '대표자 정다영', '전화 070-8065-3317'],
  ['주소 서울특별시 강남구 영동대로 602, 6층 z216호 (삼성동, 삼성동미켈란107)'],
] as const

export const FooterInfo = () => {
  return (
    <div className='flex flex-col gap-28 self-stretch md:gap-0'>
      <AppLogo variant='footer' />
      <div className='flex-1' />
      <div className='flex flex-col gap-y-xs'>
        <ul className='flex flex-wrap gap-sm'>
          <li className='text-noto-label-md-normal text-text-and-icon-primary'>
            <Link href='/privacy'>개인정보처리방침</Link>
          </li>
          <li className='text-noto-label-md-normal text-text-and-icon-primary'>
            <Link href='/terms'>이용약관</Link>
          </li>
        </ul>

        {/* address는 연락처 정보를 위한 요소라 의미가 맞는다.
         * 브라우저 기본 이탤릭만 not-italic으로 되돌린다.
         *
         * 안쪽 간격을 좁혀 두 줄을 한 묶음으로 보이게 한다.
         * 다만 12px 대 16px은 차이가 4px뿐이라 실제로는 구분되지 않아(측정함),
         * 저작권 쪽에 mt-2xs를 더해 16 + 12 = 28px로 벌린다. */}
        <address className='flex flex-col gap-y-2xs text-noto-caption-md-normal text-text-and-icon-tertiary not-italic'>
          {BUSINESS_LINES.map((parts) => (
            /* 구분자 글자 없이 간격만으로 항목을 나눈다.
             * 문자열을 공백으로 이어 붙이면 HTML이 연속 공백을 한 칸으로 합쳐
             * 항목이 서로 붙어 버린다(white-space: normal). 조각을 각각 span으로
             * 두고 gap으로 벌려야 화면에서도, 줄바꿈이 일어나도 간격이 유지된다. */
            <p key={parts[0]} className='flex flex-wrap gap-x-xs'>
              {parts.map((part) => (
                <span key={part}>{part}</span>
              ))}
            </p>
          ))}
        </address>

        <p className='mt-2xs text-noto-caption-md-normal text-text-and-icon-tertiary'>
          ⓒ 2026. inflace All rights reserved.
        </p>
      </div>
    </div>
  )
}
