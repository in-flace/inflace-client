import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/shared/config/site'

/* 색인 가치가 있는 공개 라우트만 등록한다.
 * /login은 검색 노출 가치가 없어 제외.
 *
 * ponytail: 정적 배열. 인플루언서 상세(/influencer/[channelId])를 public + SSR로
 * 전환하면 여기서 채널 목록을 받아 동적 생성하도록 바꾼다.
 *
 * lastModified는 넣지 않는다 — 배포마다 전체 페이지가 갱신됐다고 주장하는
 * 잘못된 신호가 되고, Google은 신뢰할 수 없는 값을 무시한다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['', '/influencer', '/terms', '/privacy']

  return paths.map((path) => ({ url: `${SITE_URL}${path}` }))
}
