'use client'

import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/shadcn/dialog'
import {
  useYoutubeConnectModal,
  useConnectChannel,
  YoutubeConnectActions,
} from '@/features/auth'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import Image from 'next/image'

import youtubeConnectModalImage from '@/widgets/auth/assets/youtube-connect-modal-image.png'

export function YoutubeConnectModal() {
  const isOpen = useYoutubeConnectModal((s) => s.isOpen)
  const close = useYoutubeConnectModal((s) => s.close)

  const { mutate: connect, isPending, error } = useConnectChannel()

  const handleConnect = () => {
    connect()
    // 응답 지연 시 팝업이 계속 떠있는 문제 방지: 요청 전송 0.5초 후 닫고 새로고침
    setTimeout(() => {
      close()
      window.location.reload()
    }, 300)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName='bg-background-dim-default'
        className='flex min-h-[60.6rem] w-full max-w-[min(61rem,calc(100vw-3.2rem))] flex-col items-center justify-center gap-40 rounded-16 bg-white px-[6rem] py-40 sm:max-w-[min(61rem,calc(100vw-3.2rem))]'>
        <VisuallyHidden>
          <DialogTitle>유튜브 채널 연동하기</DialogTitle>
        </VisuallyHidden>

        {/* 헤더 + 이미지 묶음 */}
        <div className='flex min-h-[40.6rem] w-full flex-col items-center gap-20'>
          {/* 헤더: 제목 + 설명 */}
          <div className='flex w-full flex-col items-center gap-8'>
            <h2 className='text-center text-ibm-heading-sm-normal text-text-and-icon-default'>
              유튜브 채널 연동하기
            </h2>
            <p className='text-center text-noto-body-xs-normal text-text-and-icon-primary'>
              채널을 연동하고 내 채널 데이터 분석 및 인플루언서 분석 기능을
              사용해보세요.
            </p>
          </div>

          {/* 목업 이미지 */}
          <Image
            src={youtubeConnectModalImage}
            alt='유튜브 채널 연동 목업 이미지'
            className='h-[32.6rem] w-full rounded-8 object-cover'
          />
        </div>

        <YoutubeConnectActions
          onConnect={handleConnect}
          onLater={close}
          isPending={isPending}
          error={error}
        />
      </DialogContent>
    </Dialog>
  )
}
