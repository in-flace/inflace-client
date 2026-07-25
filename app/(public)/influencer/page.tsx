import type { Metadata } from 'next'
import { InfluencerPage } from '@/pages/influencer'

const title = '인플루언서 검색 | 인플레이스'
const description =
  '카테고리, 구독자 수, 참여율, 업로드 주기를 기준으로 캠페인에 딱 맞는 인플루언서를 빠르게 찾아보세요. 팬층·콘텐츠·활동·광고 4종 임팩트 지표로 검증까지 한번에.'

export const metadata: Metadata = {
  title,
  description,
  /* 필터가 쿼리 파라미터로 붙어도 정본은 항상 /influencer —
   * 필터 조합마다 중복 URL이 색인되는 것을 막는다.
   */
  alternates: { canonical: '/influencer' },
  openGraph: {
    title,
    description,
    images: [{ url: '/og-influencer.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-influencer.png'],
  },
}

export default function Page() {
  return <InfluencerPage />
}
