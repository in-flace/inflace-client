import { test } from '@playwright/test'

import { measureHorizontalOverflow } from './support/diagnostics'

/* 뷰포트별 가로 넘침 기준선을 재는 스펙이다. 단언하지 않고 기록만 한다.
 *
 * 반응형 작업을 시작하기 전에 "지금 어디가 얼마나 깨져 있는지"를 숫자로 남겨
 * 이후 작업의 진척을 비교할 수 있게 하는 것이 목적이다. 지금 단언을 걸면
 * 대부분의 조합이 빨간불이 되어 신호로 쓸 수 없다.
 *
 * 뷰포트는 playwright.config.ts의 프로젝트로 주입된다. 프로젝트 이름이 곧
 * 측정 폭이므로 여기서는 폭을 알 필요가 없다.
 *
 * 로그인 상태나 채널 연동 여부에 따라 보호 경로는 다른 곳으로 되돌려보내진다.
 * 어느 화면을 실제로 쟀는지가 기록에 남아야 의미가 있으므로 도착 경로를 함께 남긴다. */

const TARGETS = [
  { path: '/', name: '랜딩' },
  { path: '/influencer', name: '인플루언서 검색' },
  { path: '/competitor', name: '경쟁 채널 분석' },
  { path: '/main', name: '메인' },
  { path: '/videos', name: '영상 성과 분석' },
  { path: '/login', name: '로그인' },
]

for (const { path, name } of TARGETS) {
  test(`${name}(${path})`, async ({ page }, testInfo) => {
    test.setTimeout(90_000)

    await page.goto(path, { waitUntil: 'domcontentloaded' })
    /* 목 응답이라 곧 끝나지만, 리다이렉트와 데이터 렌더가 자리잡을 시간을 준다.
     * networkidle은 폴링이 있는 화면에서 영영 오지 않을 수 있어 쓰지 않는다. */
    await page.waitForTimeout(3_000)

    const 도착 = new URL(page.url()).pathname
    const overflow = await measureHorizontalOverflow(page)
    const 넘침 = overflow.scrollWidth - overflow.clientWidth

    const 결과 = {
      뷰포트: testInfo.project.name,
      요청: path,
      도착: 도착,
      폭: overflow.clientWidth,
      넘침,
      원인: overflow.offenders,
    }

    /* 리포트에서 표로 읽을 수 있게 남긴다 */
    testInfo.annotations.push({
      type: '넘침',
      description: `${넘침}px (${도착} @ ${overflow.clientWidth}px)`,
    })
    await testInfo.attach('overflow.json', {
      body: JSON.stringify(결과, null, 2),
      contentType: 'application/json',
    })

    console.log('BASELINE ' + JSON.stringify(결과))
  })
}
