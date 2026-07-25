import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/shared/config/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      /* 개인 데이터 페이지와 콘텐츠 없는 BFF 라우트는 크롤 대상에서 제외한다.
       *
       * /influencer/[channelId]는 의도적으로 열어둔다 — 현재는 클라이언트 페치라
       * 빈 껍데기지만 public + SSR로 전환하면 롱테일 색인의 핵심이 되는 페이지다.
       * 단 src/proxy.ts의 FORCE_LOGIN을 false로 되돌리면 PROTECTED_PATHS의
       * '/influencer/'에 걸려 크롤러가 홈으로 리다이렉트된다. 그때 함께 손봐야 한다.
       */
      disallow: [
        '/auth/',
        '/me/',
        '/main',
        '/channel',
        '/videos',
        '/competitor',
        '/credit-fail',
        '/influencer/bookmarked',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
