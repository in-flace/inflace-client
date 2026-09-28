import type {
  TypeEngagementSummaryDto,
  TypeEngagementVideoDto,
} from '../model/types'

export const mockTypeEngagementChart: TypeEngagementSummaryDto = {
  longFormEngagementRate: 63.5,
  shortFormEngagementRate: 36.5,
}

export const mockTypeEngagementList: TypeEngagementVideoDto[] = [
  {
    rank: 1,
    videoId: 1,
    title: '아이패드로 노트북 대체 가능할까? 2주 실사용 후기',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=320&h=180&fit=crop',
    contentType: 'LONG_FORM',
    engagementRate: 7.4,
  },
  {
    rank: 2,
    videoId: 2,
    title: '10만원대 기계식 키보드 추천 TOP 5',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=320&h=180&fit=crop',
    contentType: 'LONG_FORM',
    engagementRate: 6.9,
  },
  {
    rank: 3,
    videoId: 3,
    title: '맥북 처음 사면 꼭 바꿔야 하는 설정 7가지',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=320&h=180&fit=crop',
    contentType: 'LONG_FORM',
    engagementRate: 6.2,
  },
  {
    rank: 4,
    videoId: 4,
    title: '갤럭시 꿀팁 30초 요약',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=320&h=180&fit=crop',
    contentType: 'SHORT_FORM',
    engagementRate: 4.1,
  },
  {
    rank: 5,
    videoId: 5,
    title: '노트북 살 때 모르면 손해보는 체크리스트',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=320&h=180&fit=crop',
    contentType: 'SHORT_FORM',
    engagementRate: 3.8,
  },
]
