/* 검색엔진에 노출되는 정본(canonical) 호스트.
 *
 * inflace.site(non-www)는 www로 301 리다이렉트되므로 www가 정본이다.
 * metadataBase / sitemap / robots / JSON-LD가 모두 이 값을 공유해야
 * Google에 www·non-www 신호가 모순되지 않는다.
 *
 * NEXT_PUBLIC_APP_URL은 OAuth 리다이렉트용이라 환경별로 달라지므로
 * (로컬은 http://localhost:3000) SEO 기준값으로 쓰지 않는다.
 */
export const SITE_URL = 'https://www.inflace.site'

export const SITE_NAME = '인플레이스'

/* JSON-LD Organization.description과 metadata 미선언 라우트의 meta description을 겸한다.
 * Google이 한글 description을 약 80자에서 절단하므로 그 안에 브랜드명과 핵심 키워드를 담는다.
 */
export const SITE_DESCRIPTION =
  '인플레이스는 유튜브 채널 데이터로 인플루언서를 찾고 분석하는 인플루언서 인텔리전스 플랫폼입니다. 구독자 추이·참여율·시청자 분포를 한 번에 검증하세요.'
