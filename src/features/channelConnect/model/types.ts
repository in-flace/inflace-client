/* 유튜브 채널 연동 모달 상태 */
export interface YoutubeConnectModalState {
  isOpen: boolean
  open: () => void
  close: () => void
}

/* 채널 연동/갱신 API 응답 DTO */
export interface ChannelConnectDto {
  channelId: number
  youtubeChannelId: string
  updatedAt: string
}
