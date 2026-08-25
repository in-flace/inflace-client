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
      <section className='relative flex h-[34rem] w-full snap-start snap-always items-center justify-center overflow-hidden sm:h-[38rem] lg:h-[44rem]'>
        <Image
          src={heroSection01Bg}
          alt=''
          fill
          priority
          sizes='100vw'
          className='object-cover'
        />
        <div className='relative flex w-full flex-col items-center gap-20 px-20 text-center sm:gap-24'>
          <h3 className='font-point text-[2.4rem] leading-[1.35] font-normal text-white sm:text-[3rem] lg:text-heading-sm lg:leading-heading-sm'>
            <span className='block sm:inline'>
              인플루언서와 마케터가 만나는 공간,
            </span>
            <strong className='mt-4 block bg-gradient-to-b from-[#BBBDF8] to-[#B9CCF6] bg-clip-text font-point text-[3.2rem] leading-[1.25] font-normal text-transparent drop-shadow-[0_0_100px_#5942F8] filter sm:mt-0 sm:ml-6 sm:inline sm:text-[4rem] lg:text-heading-md lg:leading-heading-md'>
              인플레이스
            </strong>
          </h3>
          <HeroScrollButton />
        </div>
      </section>

      {/* section02 - slide */}
      <section
        id='section02'
        className='relative flex min-h-[calc(100svh-var(--spacing-header-height))] w-full snap-start snap-always items-center overflow-hidden px-20 py-48 sm:px-32 md:px-48 md:py-56 lg:px-[8rem] xl:px-[12rem]'>
        <Image
          src={heroSection02Bg}
          alt=''
          fill
          sizes='100vw'
          className='object-cover'
        />
        <div className='relative mx-auto flex w-full max-w-[144rem] flex-col items-center gap-40 md:flex-row md:gap-56 lg:gap-[8rem] xl:gap-[12rem]'>
          <div className='flex w-full max-w-[48rem] flex-col items-center gap-28 text-center md:items-start md:text-left lg:gap-40'>
            <h3 className='font-point text-[2.8rem] leading-[1.25] font-normal text-white sm:text-[3.6rem] lg:text-ibm-display-sm-normal'>
              유튜브 스튜디오만으론 부족하니까,
            </h3>
            <p className='flex flex-col gap-12 text-[2rem] leading-[1.45] font-bold text-white sm:text-[2.4rem] lg:text-noto-heading-sm-bold'>
              내 채널 분석부터 경쟁 채널 염탐까지 가능
              <span className='text-[1.5rem] leading-[1.65] font-normal text-neutral-200 sm:text-[1.6rem] lg:text-noto-body-sm-normal'>
                기본, 유입, 참여, 성장 지표로 나누어 다른 툴보다 더 구체적이고
                <br className='hidden lg:block' />
                실질적인 성장 데이터를 한눈에 제공합니다.
              </span>
            </p>
            <HeroCtaButton>인플루언서로 무료체험 시작</HeroCtaButton>
          </div>
          <div className='w-full max-w-[42rem] flex-1 sm:max-w-[52rem] md:max-w-none'>
            <Image
              src={heroSection02Item}
              alt='인플루언서 영상 성과 분석'
              sizes='(min-width: 1280px) 42vw, (min-width: 768px) 46vw, 90vw'
              className='h-auto w-full'
            />
          </div>
        </div>
      </section>

      {/* section03 - slide */}
      <section className='relative flex min-h-[calc(100svh-var(--spacing-header-height))] w-full snap-start snap-always items-center overflow-hidden px-20 py-48 sm:px-32 md:px-48 md:py-56 lg:px-[8rem] xl:px-[12rem]'>
        <Image
          src={heroSection03Bg}
          alt=''
          fill
          sizes='100vw'
          className='object-cover'
        />
        <div className='relative mx-auto flex w-full max-w-[144rem] flex-col items-center gap-40 md:flex-row md:gap-56 lg:gap-[8rem] xl:gap-[12rem]'>
          <div className='flex w-full max-w-[48rem] flex-col items-center gap-28 text-center md:items-start md:text-left lg:gap-40'>
            <h3 className='font-point text-[2.8rem] leading-[1.25] font-normal text-white sm:text-[3.6rem] lg:text-ibm-display-sm-normal'>
              인플루언서 리서치에
              <br />
              밤새던 마케터를 위해,
            </h3>
            <p className='flex flex-col gap-12 text-[2rem] leading-[1.45] font-bold text-white sm:text-[2.4rem] lg:text-noto-heading-sm-bold'>
              인플루언서 탐색부터 경쟁사 협업 분석까지, 한 번에
              <span className='text-[1.5rem] leading-[1.65] font-normal text-neutral-200 sm:text-[1.6rem] lg:text-noto-body-sm-normal'>
                강력한 가격 경쟁력으로 리소스 낭비 없는 인플루언서/채널 분석
                지표를 경험해 보세요.
              </span>
            </p>
            <HeroCtaButton>마케터로 무료체험 시작</HeroCtaButton>
          </div>
          <div className='w-full max-w-[42rem] flex-1 sm:max-w-[52rem] md:max-w-none'>
            <Image
              src={heroSection03Item}
              alt='인플루언서 영상 성과 분석'
              sizes='(min-width: 1280px) 42vw, (min-width: 768px) 46vw, 90vw'
              className='h-auto w-full'
            />
          </div>
        </div>
      </section>
    </>
  )
}
