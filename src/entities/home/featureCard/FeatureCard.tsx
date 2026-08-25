import Image from 'next/image'
import { FeatureCardItem } from '@/entities/home/featureCard/config/types'
import { FeatureCardCtaButton } from '@/entities/home/featureCard/FeatureCardCtaButton'

export function FeatureCard({
  icon: Icon,
  title,
  description,
  imgSrc,
}: FeatureCardItem) {
  return (
    <div className='flex h-full flex-col rounded-12 border border-stroke-border-neutral-default bg-background-gray-default px-20 py-28 sm:px-28 sm:py-36 lg:px-32 lg:py-40'>
      <div className='flex flex-1 flex-col gap-20 sm:gap-24'>
        <h4 className='flex items-center gap-5 font-point text-[2rem] leading-[1.35] font-normal text-brand-primary sm:gap-6 sm:text-ibm-title-lg-normal'>
          <Icon className='size-[1.3rem] shrink-0 sm:size-[1.7rem]' />
          {title}
        </h4>
        <p className='text-[1.5rem] leading-[1.65] font-normal text-text-and-icon-primary sm:text-noto-body-md-normal'>
          {description}
        </p>
        <div className='mt-auto min-h-0 w-full'>
          <Image
            src={imgSrc}
            alt={title}
            sizes='(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw'
            className='h-auto w-full max-w-full object-cover'
          />
        </div>
      </div>
      <FeatureCardCtaButton />
    </div>
  )
}
