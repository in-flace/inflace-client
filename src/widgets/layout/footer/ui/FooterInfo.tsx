import Link from 'next/link'
import { AppLogo } from '@/widgets/layout/logo'

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
        <p className='text-noto-caption-md-normal text-text-and-icon-tertiary'>
          ⓒ 2026. inflace All rights reserved.
        </p>
      </div>
    </div>
  )
}
