'use client'

import { Button } from '@/shared/ui/button'

import { useAuth } from '../model/useAuth'
import { useLoginModal } from '../model/useLoginModal'
import { UserIcon } from '@/features/userStatus'

/*
 * 로그인 여부에 따라 달라지는 버튼
 * 비로그인 시 '로그인'
 * 로그인 시 '로그아웃' 표시
 */
export function LoginButton() {
  const { isLoggedIn, isInitializing, logout } = useAuth()
  const openModal = useLoginModal((s) => s.open)

  if (isInitializing) {
    return (
      <Button color='gray' size='sm' variant='filled' disabled>
        <span className='text-label-sm'>로딩중...</span>
      </Button>
    )
  }

  /* 로그인 상태일 때 */
  if (isLoggedIn) {
    return (
      <div className='flex size-fit gap-16'>
        <Button color='secondary' size='sm' variant='filled' onClick={logout}>
          <span className='text-label-sm'>로그아웃</span>
        </Button>
        <UserIcon size={34} showBadge={false} />
      </div>
    )
  }

  /* 로그아웃 상태일 때 */
  return (
    <Button
      color='secondary'
      size='sm'
      variant='filled'
      onClick={() => openModal('header')}>
      <span className='text-label-sm'>로그인</span>
    </Button>
  )
}
