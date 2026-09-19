import type { ReactNode } from 'react'

export interface SocialLoginButtonProps {
  icon: ReactNode
  label: string
  onClick?: () => void
  disabled?: boolean
  className?: string
  /* 라벨 타이포가 화면마다 달라(로그인 label/md, 채널 연동 label/lg) 호출부에서 덮어쓴다 */
  labelClassName?: string
}
