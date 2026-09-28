export type NewInflowResponseDto = {
  rank: number
  videoId: number
  title: string
  thumbnailUrl: string
  viewCount: number
  subscriptionConversionCount: number
  newSubscriberRatio: number
  retentionRate: number
}

export type NewInflowListResponseDto = {
  videos: NewInflowResponseDto[]
}
