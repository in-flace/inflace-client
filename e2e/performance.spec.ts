import { test } from '@playwright/test'

/**
 * 성능 지표 측정 스크립트.
 *
 * 단언 없이 관찰만 한다. 성능 작업 전후를 비교하는 용도이며,
 * 회귀 판정 기준선이 정해지면 임계값 단언을 추가할 수 있다.
 *
 * 실행:
 *   npm run test:perf
 *
 * 주의: 로컬 dev 서버 기준이므로 절대값은 실제 환경과 다르다.
 * 같은 조건에서의 상대 비교에 사용한다.
 */

const PAGES = [
  { name: '랜딩', path: '/' },
  { name: '경쟁사 분석', path: '/competitor' },
  { name: '인플루언서 검색', path: '/influencer' },
]

interface Metrics {
  ttfb: number
  fcp: number
  lcp: number
  cls: number
  domContentLoaded: number
  load: number
  transferKB: number
  requestCount: number
}

for (const { name, path } of PAGES) {
  test(`성능 지표 — ${name} (${path})`, async ({ page }) => {
    test.setTimeout(120_000)

    /* 네트워크 전송량 집계 */
    let transferBytes = 0
    let requestCount = 0
    const byType: Record<string, number> = {}

    page.on('response', async (res) => {
      requestCount++
      const headers = res.headers()
      const len = Number(headers['content-length'] ?? 0)
      if (len > 0) {
        transferBytes += len
        const type = res.request().resourceType()
        byType[type] = (byType[type] ?? 0) + len
      }
    })

    /* LCP는 buffered 엔트리로 잡히지 않는 경우가 있어
     * 페이지 로드 전에 PerformanceObserver를 심어 둔다. */
    await page.addInitScript(() => {
      ;(window as unknown as { __lcp: number }).__lcp = 0
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const last = entries[entries.length - 1]
        if (last)
          (window as unknown as { __lcp: number }).__lcp = last.startTime
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    })

    await page.goto(path, { waitUntil: 'load' })

    /* LCP/CLS는 관찰 후 확정되므로 잠시 대기 */
    await page.waitForTimeout(3000)

    const metrics = await page.evaluate<Metrics>(() => {
      const nav = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming

      const paint = performance.getEntriesByType('paint')
      const fcp = paint.find((e) => e.name === 'first-contentful-paint')

      /* LCP: addInitScript의 PerformanceObserver가 기록한 값 */
      const lcp = (window as unknown as { __lcp?: number }).__lcp ?? 0

      /* CLS: layout-shift 중 사용자 입력 없이 발생한 것만 합산 */
      const shifts = performance.getEntriesByType(
        'layout-shift'
      ) as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]
      const cls = shifts
        .filter((s) => !s.hadRecentInput)
        .reduce((sum, s) => sum + s.value, 0)

      return {
        ttfb: nav ? nav.responseStart - nav.requestStart : 0,
        fcp: fcp?.startTime ?? 0,
        lcp,
        cls,
        domContentLoaded: nav?.domContentLoadedEventEnd ?? 0,
        load: nav?.loadEventEnd ?? 0,
        transferKB: 0,
        requestCount: 0,
      }
    })

    const ms = (n: number) => `${Math.round(n)}ms`
    const kb = (b: number) => `${(b / 1024).toFixed(1)}KB`

    console.log(`\n━━━ ${name} (${path}) ━━━`)
    console.log(`  TTFB               ${ms(metrics.ttfb)}`)
    console.log(`  FCP                ${ms(metrics.fcp)}`)
    console.log(`  LCP                ${ms(metrics.lcp)}`)
    console.log(`  CLS                ${metrics.cls.toFixed(4)}`)
    console.log(`  DOMContentLoaded   ${ms(metrics.domContentLoaded)}`)
    console.log(`  Load               ${ms(metrics.load)}`)
    console.log(`  요청 수            ${requestCount}`)
    console.log(`  전송량 합계        ${kb(transferBytes)}`)

    const sorted = Object.entries(byType).sort((a, b) => b[1] - a[1])
    if (sorted.length > 0) {
      console.log(`  ── 리소스 유형별 ──`)
      for (const [type, bytes] of sorted) {
        console.log(`     ${type.padEnd(12)} ${kb(bytes).padStart(10)}`)
      }
    }
  })
}
