import type { Metadata } from 'next'
import { LoginPage } from '@/pages/login'

const title = '로그인 | 인플레이스'
const description =
  '데이터 기반으로 임팩트 있는 유튜브 인플루언서를 찾고, 내 채널을 성장시키세요. 브랜드와 크리에이터를 연결하는 유튜브 마케팅 플랫폼, 인플레이스.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/login' },
  openGraph: {
    title,
    description,
    images: [{ url: '/og-main.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-main.png'],
  },
}

export default function Page() {
  return <LoginPage />
}
