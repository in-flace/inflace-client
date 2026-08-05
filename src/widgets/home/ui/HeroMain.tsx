import Image from 'next/image'
import heroSection01Bg from '@/widgets/home/assets/heroSection01Bg.webp'
import heroSection02Bg from '@/widgets/home/assets/heroSection02Bg.webp'
import heroSection02Item from '@/widgets/home/assets/heroSection02Item.webp'
import heroSection03Bg from '@/widgets/home/assets/heroSection03Bg.webp'
import heroSection03Item from '@/widgets/home/assets/heroSection03Item.webp'
import { HeroCtaButton } from '@/widgets/home/ui/HeroCtaButton'
import { HeroScrollButton } from '@/widgets/home/ui/HeroScrollButton'

export function HeroMain() {
  return (
    <>
      {/* section01 - intro */}
      <section className='relative h-[44rem] w-full snap-start snap-always overflow-hidden'>
        <Image
          src={heroSection01Bg}
          alt=''
          fill
          priority
          sizes='100vw'
          className='object-cover'
        />
        <div className='absolute top-[10.6rem] left-0 flex w-full flex-col items-center gap-24'>
          <h3 className='text-center text-heading-sm leading-heading-sm text-white'>
            인플루언서와 마케터가 만나는 공간,
            <strong className='ml-6 bg-gradient-to-b from-[#BBBDF8] to-[#B9CCF6] bg-clip-text text-heading-md leading-heading-md text-transparent drop-shadow-[0_0_100px_#5942F8] filter'>
              인플레이스
            </strong>
          </h3>
          <HeroScrollButton />
        </div>
      </section>

      {/* section02 - slide */}
      <section
        id='section02'
        className='relative flex h-[calc(100vh-var(--spacing-header-height))] w-full snap-start snap-always items-center overflow-hidden px-[12rem]'>
        <Image
          src={heroSection02Bg}
          alt=''
          fill
          sizes='100vw'
          className='object-cover'
        />
        <div className='relative flex h-fit w-full items-center gap-[12rem]'>
          <div className='flex flex-col gap-40'>
            <h3 className='text-ibm-display-sm-normal text-white'>
              유튜브 스튜디오만으론 부족하니까,
            </h3>
            <p className='flex flex-col gap-12 text-noto-heading-sm-bold text-white'>
              내 채널 분석부터 경쟁 채널 염탐까지 가능
              <span className='text-noto-body-sm-normal text-neutral-200'>
                기본, 유입, 참여, 성장 지표로 나누어 다른 툴보다 더 구체적이고
                <br />
                실질적인 성장 데이터를 한눈에 제공합니다.
              </span>
            </p>
            <HeroCtaButton>인플루언서로 무료체험 시작</HeroCtaButton>
          </div>
          <div className='flex-1'>
            <Image
              src={heroSection02Item}
              alt='인플루언서 영상 성과 분석'
              sizes='(min-width: 1024px) 40vw, 90vw'
              className='h-auto w-full'
            />
          </div>
        </div>
      </section>

      {/* section03 - slide */}
      <section className='relative flex h-[calc(100vh-var(--spacing-header-height))] w-full snap-start snap-always items-center overflow-hidden px-[12rem]'>
        <Image
          src={heroSection03Bg}
          alt=''
          fill
          sizes='100vw'
          className='object-cover'
        />
        <div className='relative flex h-fit w-full items-center gap-[12rem]'>
          <div className='flex flex-col gap-40'>
            <h3 className='text-ibm-display-sm-normal text-white'>
              인플루언서 리서치에
              <br />
              밤새던 마케터를 위해,
            </h3>
            <p className='flex flex-col gap-12 text-noto-heading-sm-bold text-white'>
              인플루언서 탐색부터 경쟁사 협업 분석까지, 한 번에
              <span className='text-noto-body-sm-normal text-neutral-200'>
                강력한 가격 경쟁력으로 리소스 낭비 없는 인플루언서/채널 분석
                지표를 경험해 보세요.
              </span>
            </p>
            <HeroCtaButton>마케터로 무료체험 시작</HeroCtaButton>
          </div>
          <div className='flex-1'>
            <Image
              src={heroSection03Item}
              alt='인플루언서 영상 성과 분석'
              sizes='(min-width: 1024px) 40vw, 90vw'
              className='h-auto w-full'
            />
          </div>
        </div>
      </section>
    </>
  )
}
