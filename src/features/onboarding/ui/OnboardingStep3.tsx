'use client'

import { useOnboardingModal } from '../model/useOnboardingModal'
import { FEATURE_SLIDES } from '../model/optionsStep03'
import Image from 'next/image'
import { cn } from '@/shared/lib/utils'

export function OnboardingStep3() {
  const { featureIndex } = useOnboardingModal()
  const slide = FEATURE_SLIDES[featureIndex]

  return (
    <div className='grid grid-cols-2'>
      <div className='w-[39.2rem]'>
        <div className='relative h-[27.8rem] w-full'>
          <Image
            src={slide.image.src}
            alt='기능 소개 이미지'
            fill
            sizes='392px'
          />
        </div>
        <div className='mt-12 flex justify-center gap-2xs'>
          {FEATURE_SLIDES.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-10 w-10 rounded-full border border-gray-400',
                i === featureIndex && 'bg-gray-400'
              )}
            />
          ))}
        </div>
      </div>

      <div className='pl-[5.8rem]'>
        <p className='text-noto-title-sm-normal text-text-and-icon-default'>
          {slide.title}
        </p>
        <p className='mt-xs text-noto-body-xs-normal text-text-and-icon-tertiary'>
          {slide.desc}
        </p>
      </div>
    </div>
  )
}
