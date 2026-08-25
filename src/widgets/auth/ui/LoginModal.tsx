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
        className='flex h-[68rem] w-[56rem] shrink-0 flex-col items-center gap-80 rounded-16 bg-white px-40 py-80 sm:min-h-[68rem] sm:min-w-[56rem]'>
        {/* title containter */}
        <div className='flex h-fit w-full flex-col items-center justify-center gap-16'>
          {/* logo */}
          <div className='flex items-center justify-center'>
            <LogoSvg className='h-[5.5rem] w-[16.6rem]' />
            <span className='sr-only'>inflace</span>
          </div>

          {/* 메인 문구 */}
          <DialogTitle className='size-fit text-center text-noto-body-xs-bold text-text-and-icon-default'>
            인플루언서 탐색, 채널 분석, 콘텐츠 분석까지 모두 경험하세요
          </DialogTitle>
        </div>

        {/* 로그인 버튼 + 이용약관*/}
        <div className='flex h-fit w-full flex-col items-center justify-center gap-64'>
          <div className='flex size-fit flex-col gap-24'>
            <SocialLoginButton
              icon={<YouTubeIcon />}
              label='Continue with YouTube'
              onClick={youtube.handleClick}
              disabled={youtube.isLoading}
            />

            <SocialLoginButton
              icon={<GoogleIcon />}
              label={google.isLoading ? '로그인 중...' : 'Continue with Google'}
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
