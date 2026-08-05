'use client'

import Image from 'next/image'
import { useMyProfile } from '@/features/me'
import { CHANNEL_ANALYSIS_VALUE } from '../model/optionsStep02'
import { Need, UserRole, useOnboardingModal } from '@/features/onboarding'
import ImageDefualt from '../assets/onboarding-user-default.png'
import ImageYoutube from '../assets/onboarding-user-youtube.png'

export function OnboardingStep4() {
  const { selections } = useOnboardingModal()
  const roles = selections[1] as UserRole[]
  const needs = selections[2] as Need[]
  const showYoutubeConnect =
    roles?.includes('YOUTUBER') || needs?.includes(CHANNEL_ANALYSIS_VALUE)

  const { data } = useMyProfile()
  const name = data?.account.name ?? ''
  return (
    <>
      <div className='w-full'>
        <div className='grid w-full grid-cols-2 gap-[8rem]'>
          {showYoutubeConnect ? (
            <>
              <div className='relative h-[30rem] w-[39.2rem]'>
                <Image
                  src={ImageYoutube.src}
                  alt='채널분석 화면 미리보기'
                  fill
                  sizes='392px'
                />
              </div>
              <div>
                <p className='text-noto-title-sm-normal text-text-and-icon-default'>
                  환영해요, {name}님 🎉
                  <br />
                  유튜브 채널을 연동하고 채널 분석 결과를 확인하세요
                </p>
                <p className='mt-xs text-noto-body-xs-normal text-text-and-icon-tertiary'>
                  유튜버 환경이 준비됐어요.
                  <br />
                  지금 채널 연동하면 채널 성과부터 경쟁사 분석까지 한눈에 파악할
                  수 있어요.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className='relative h-[30rem] w-[39.2rem]'>
                <Image
                  src={ImageDefualt.src}
                  alt='경쟁 채널 분석 미리보기'
                  fill
                  sizes='392px'
                />
              </div>
              <div>
                <p className='text-noto-title-sm-normal text-text-and-icon-default'>
                  환영해요, {name}님 🎉
                  <br />
                  바로 시작해볼까요?
                </p>
                <p className='mt-xs text-noto-body-xs-normal text-text-and-icon-tertiary'>
                  마케터 맞춤 기능이 세팅됐어요.
                  <br />
                  이제 인플루언서 탐색과 트렌드를 한눈에 확인할 수 있어요.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
