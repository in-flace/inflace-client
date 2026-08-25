'use client'

import { FooterNav } from './FooterNav'
import { FooterInfo } from './FooterInfo'

export function Footer() {
  return (
    <>
      <footer className='z-11 w-full bg-(--color-background-gray-default)'>
        <div className='w-full px-20 py-32 sm:px-32 lg:px-64 lg:pt-40 lg:pb-64'>
          <div className='flex flex-col gap-32 md:flex-row md:justify-between'>
            <FooterInfo />
            <FooterNav />
          </div>
        </div>
      </footer>
    </>
  )
}
