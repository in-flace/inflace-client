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
    <div className='rounded-12 border border-stroke-border-neutral-default bg-background-gray-default p-32 py-40'>
      <div className='flex flex-col gap-24'>
        <h4 className='flex items-center gap-8 text-ibm-title-lg-normal text-brand-primary'>
          <Icon className='size-26' />
          {title}
        </h4>
        <p className='text-noto-body-md-normal text-text-and-icon-primary'>
          {description}
        </p>
        <div className='min-h-0 w-full'>
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
