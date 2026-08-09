import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Noto_Sans_KR, IBM_Plex_Sans_KR } from 'next/font/google'
import { GoogleTagManager } from '@next/third-parties/google'

import '../styles'
import { MSWProvider } from '@/app/providers/MSWProvider'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { SidebarTrigger } from '@/shared/ui/shadcn/sidebar'
import { SidebarStoreProvider } from './SidebarStoreProvider'
import { Header, Footer, AppSidebar } from '@/widgets/layout'
import { AuthInitializer } from '@/features/auth'
import { LoginModal, YoutubeConnectModal } from '@/widgets/auth'
import { OnboardingModal } from '@/widgets/onboarding'
import { GoogleAuthNoticeModal } from '@/widgets/googleAuthNotice'
import { GtmPageView } from '@/shared/analytics'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/shared/config/site'
import { Toaster } from '@/shared/ui/sonner'

const gtmId = process.env.NEXT_PUBLIC_GTM_ID

/* 한글 폰트는 유니코드 범위별로 수백 개 파일로 분할된다.
 * preload를 켜두면 실제 사용 여부와 무관하게 전부 선다운로드되어
 * (랜딩 기준 281개 / 2.5MB) 초기 로딩을 크게 지연시킨다.
 * preload: false로 브라우저가 필요한 조각만 받도록 한다. */
const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto',
  display: 'swap',
  preload: false,
})

const ibmPlexSansKr = IBM_Plex_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm',
  display: 'swap',
  preload: false,
})

/* metadata를 선언하지 않은 라우트가 상속하는 기본값.
 * 브랜드명을 앞에 두어 "인플레이스" 검색 대응력을 높인다.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} | 데이터 기반 유튜브 인플루언서 분석 플랫폼`,
  description: SITE_DESCRIPTION,
}

/* Google이 "인플레이스"를 하나의 브랜드 엔티티로 인식할 근거.
 * 동명의 밴드(위키백과 등재)·체코어 "inflace"(인플레이션)와 구별시키는 신호다.
 * @id로 Organization과 WebSite를 상호 참조해 하나의 엔티티 그래프로 묶는다.
 */
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: 'inflace',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.svg`,
      description: SITE_DESCRIPTION,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: 'inflace',
      url: SITE_URL,
      inLanguage: 'ko-KR',
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/influencer?channelName={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang='ko'
      className={`${notoSansKr.variable} ${ibmPlexSansKr.variable}`}>
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      <body className='flex min-h-screen flex-col'>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {gtmId && (
          <Suspense fallback={null}>
            <GtmPageView />
          </Suspense>
        )}
        <MSWProvider>
          <QueryProvider>
            <AuthInitializer />
            <LoginModal />
            <YoutubeConnectModal />
            <OnboardingModal />
            <GoogleAuthNoticeModal />
            <Toaster position='top-center' />
            <div className='flex flex-1'>
              <SidebarStoreProvider>
                <AppSidebar />
                <main className='relative flex min-h-screen min-w-0 flex-1 flex-col'>
                  <SidebarTrigger />
                  <Header />
                  <div className='flex-1'>{children}</div>
                </main>
              </SidebarStoreProvider>
            </div>
            <Footer />
          </QueryProvider>
        </MSWProvider>
      </body>
    </html>
  )
}
