import type { Metadata } from 'next'
import { AdminLayout } from '@/pages/admin'

// 내부 관리자 화면 — 검색 노출 금지
export const metadata: Metadata = {
  title: '어드민 | 인플레이스',
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>
}
