'use client'

import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/shadcn/dialog'
import {
  SocialLoginButton,
  useLoginModal,
  usePopupOAuth,
} from '@/features/auth'
import GoogleIcon from '@/shared/assets/google.svg?react'
import YouTubeIcon from '@/shared/assets/youtube.svg?react'
import LogoSvg from '@/shared/assets/logo.svg?react'
import Link from 'next/link'

export function LoginModal() {
  const isOpen = useLoginModal((s) => s.isOpen)
  const close = useLoginModal((s) => s.close)

  const youtube = usePopupOAuth({
    apiPath: '/auth/youtube',
    popupName: 'youtube-login',
    provider: 'youtube',
  })
  const google = usePopupOAuth({
    apiPath: '/auth/google',
    popupName: 'google-login',
    provider: 'google',
  })

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          close()
          youtube.reset()
          google.reset()
        }
      }}>
      <DialogContent
        showCloseButton={false}
        overlayClassName='bg-background-dim-default'
        className='flex min-h-[44.8rem] w-[48rem] max-w-[calc(100vw-3.2rem)] shrink-0 flex-col items-center gap-[6rem] rounded-16 bg-white px-40 py-64 sm:max-w-[calc(100vw-3.2rem)]'>
        {/* title containter */}
        <div className='flex min-h-[6.8rem] w-full max-w-[40rem] flex-col items-center justify-center gap-16'>
          {/* logo */}
          <div className='flex items-center justify-center'>
            <LogoSvg className='h-32 w-[10.3rem]' />
            <span className='sr-only'>inflace</span>
          </div>

          {/* 메인 문구 */}
          <DialogTitle className='w-full text-center text-noto-body-xs-normal break-keep text-text-and-icon-primary'>
            인플루언서 탐색, 채널 분석, 콘텐츠 분석까지 모두 경험하세요
          </DialogTitle>
        </div>

        {/* 로그인 버튼 + 이용약관*/}
        <div className='flex min-h-[19.2rem] w-full max-w-[40rem] flex-col items-center justify-center gap-64 px-sm'>
          <div className='flex min-h-[10.8rem] w-full max-w-[36rem] flex-col gap-12'>
            <SocialLoginButton
              icon={<YouTubeIcon />}
              label='YouTube로 계속하기'
              onClick={youtube.handleClick}
              disabled={youtube.isLoading}
            />

            <SocialLoginButton
              icon={<GoogleIcon />}
              label={google.isLoading ? '로그인 중...' : 'Google로 계속하기'}
              onClick={google.handleClick}
              disabled={google.isLoading}
            />
            {google.error && (
              <p className='text-sm text-destructive'>{google.error}</p>
            )}
          </div>

          {/* 하단 링크 */}
          <div className='flex size-fit items-center justify-center gap-16 text-noto-label-md-thin text-text-and-icon-secondary'>
            <Link href='/terms'>이용약관</Link>
            <Link href='/privacy'>개인정보처리방침</Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
