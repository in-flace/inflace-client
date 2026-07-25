import type { Metadata } from 'next'
import { TermsPage } from '@/pages/terms'

const title = '이용약관 | 인플레이스'
const description = '인플레이스 서비스 이용 전 꼭 확인해야 할 이용약관을 살펴보세요.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/terms' },
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
  return <TermsPage />
}
