import type { Metadata } from 'next'
import { PrivacyPage } from '@/pages/privacy'

const title = '개인정보처리방침 | 인플레이스'
const description = '인플레이스의 개인정보처리방침을 확인하세요.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/privacy' },
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
  return <PrivacyPage />
}
