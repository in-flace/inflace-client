import Link from 'next/link'

import { NAV_ITEMS } from '@/features/navigation/model/navItems'

export const FooterNav = () => {
  return (
    <div className='grid grid-cols-2 gap-x-32 gap-y-24 py-sm sm:flex sm:flex-wrap sm:gap-2xl'>
      {NAV_ITEMS.map((group) => (
        <div key={group.group}>
          <div className='text-noto-label-md-thin text-text-and-icon-tertiary'>
            {group.group}
          </div>
          <ul>
            {group.items.map((item) => (
              <li
                key={item.title}
                className='mt-sm text-noto-label-md-normal text-text-and-icon-primary'>
                <Link href={item.url}>{item.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
