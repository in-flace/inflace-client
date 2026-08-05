import path from 'node:path'

import bundleAnalyzer from '@next/bundle-analyzer'
import type { NextConfig } from 'next'

/* ANALYZE=true 로 빌드하면 번들 구성 리포트를 생성한다.
 * 사용: npm run build:analyze */
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'yt3.ggpht.com' },
      { protocol: 'https', hostname: 'yt3.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.s3.ap-northeast-2.amazonaws.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pinimg.com' },
    ],
  },
  /* Cross-Origin-Opener-Policy로 인해 팝업이 닫히지 않는 문제 해결 */
  async headers() {
    return [
      {
        source: '/auth/callback',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'unsafe-none' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
        ],
      },
    ]
  },
  webpack(config) {
    const fileLoaderRule = config.module.rules.find(
      (rule: { test?: { test?: (s: string) => boolean } }) =>
        rule.test?.test?.('.svg')
    )

    config.module.rules.push(
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/,
      },
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] },
        use: [{ loader: '@svgr/webpack', options: { icon: true } }],
      }
    )

    fileLoaderRule.exclude = /\.svg$/i

    /* mock이 꺼진 빌드에서는 MSW 트리 전체를 번들에서 제외한다.
     * MSWProvider가 동적 import를 호출하지 않더라도 별도 청크는 생성되어
     * msw + 핸들러 26개 + db.json이 그대로 남는다(gzip 약 119KB). */
    if (process.env.NEXT_PUBLIC_MOCK_ENABLED !== 'true') {
      /* '@/...' 별칭은 tsconfig paths가 먼저 해석하므로,
       * alias 키도 해석 결과와 같은 실제 파일 경로로 지정해야 한다.
       * $ 접미사로 정확히 이 경로만 치환한다. */
      const mswBrowser = path.resolve(__dirname, 'src/shared/api/msw/browser')
      config.resolve.alias = {
        ...config.resolve.alias,
        [`${mswBrowser}$`]: path.resolve(
          __dirname,
          'src/shared/api/msw/browser.stub.ts'
        ),
        [`${mswBrowser}.ts$`]: path.resolve(
          __dirname,
          'src/shared/api/msw/browser.stub.ts'
        ),
      }
    }

    return config
  },
}

export default withBundleAnalyzer(nextConfig)
