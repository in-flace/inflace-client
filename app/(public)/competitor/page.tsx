import type { Metadata } from 'next'
import { CompetitorPage } from '@/pages/competitor'

const title = '경쟁 채널 협찬 영상 분석 | 인플레이스'
const description =
  '경쟁 브랜드가 협업한 인플루언서 콘텐츠 트렌드를 파악하세요. 협찬 광고 이력 분석으로 우리 캠페인 후보군을 전략적으로 확장할 수 있습니다.'

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    images: [{ url: '/og-competitor.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-competitor.png'],
  },
}

export default function Page() {
  return <CompetitorPage />
}
