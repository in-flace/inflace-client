import { expect, test } from '@playwright/test'

import { waitForAuthSettled } from './support/auth'
import {
  captureFlowShot,
  expectNoProblems,
  measureHorizontalOverflow,
  watchForProblems,
} from './support/diagnostics'

/* 주요 화면을 한 번씩 밟으며 스크린샷을 남기고, 눈으로 보지 않아도 알 수 있는
 * 증상(콘솔 에러, 4xx/5xx, 가로 스크롤)을 확인한다.
 *
 * 구조 개편으로 파일을 옮기기 직전이라 이 스크린샷들이 전후 비교의 기준이 된다.
 * 위젯 103개에 단위 테스트가 1건뿐이라 조립이 깨져도 단위 테스트로는 안 잡힌다.
 *
 * 목 환경이라 앱이 로그인 상태로 부팅된다(MSW authHandlers의 isMockLoggedIn 초기값).
 * 다만 채널이 미연동이라 일부 경로는 되돌려보내진다 — 아래 PAGES 주석 참고.
 *
 * /channel은 목록에서 뺐다. 목 유저의 userChannelDetails가 null이라
 * (channelLinked) 라우트 그룹이 404를 반환한다. 채널 연동 상태를 만들어야
 * 의미가 있으므로 별도 작업으로 둔다. */

interface TargetPage {
  path: string
  name: string
  slug: string
  /* 실제 도착 경로. 요청한 곳과 다르면 리다이렉트가 있다는 뜻이고,
   * 그 사실 자체를 여기 적어 문서로 남긴다. */
  landsOn?: string
  /* 목록이 길어 fullPage 스크린샷에 시간이 걸리는 화면 */
  slowShot?: boolean
}

/* 목 유저는 로그인 상태이고 채널은 미연동(userChannelDetails: null)이다.
 * 그 조합에서 관찰된 라우팅:
 *   /        -> /main   로그인 상태면 랜딩 대신 메인으로 보낸다
 *   /videos  -> /main   (channelLinked) 그룹이 채널 없으면 되돌려보낸다
 *   /channel -> 404     같은 이유. 목록에서 제외했다
 * 이 규칙을 모르면 랜딩·메인·영상 스크린샷이 전부 같은 그림이 되고도
 * 테스트는 통과한다. 실제로 그런 적이 있어서 도착 경로를 단언한다. */
const PAGES: TargetPage[] = [
  { path: '/', name: '랜딩', slug: 'page-01-랜딩', landsOn: '/main' },
  {
    path: '/influencer',
    name: '인플루언서 검색',
    slug: 'page-02-인플루언서',
    slowShot: true,
  },
  { path: '/competitor', name: '경쟁 채널 분석', slug: 'page-03-경쟁사' },
  { path: '/main', name: '메인', slug: 'page-04-메인' },
  {
    path: '/videos',
    name: '영상 성과 분석',
    slug: 'page-05-영상',
    landsOn: '/main',
  },
]

for (const { path, name, slug, slowShot, landsOn } of PAGES) {
  test(`${name}(${path}) 진입 시 스크린샷과 진단`, async ({ page }) => {
    test.setTimeout(slowShot ? 120_000 : 60_000)

    const problems = watchForProblems(page)

    await page.goto(path)
    await waitForAuthSettled(page)
    /* 데이터가 붙은 뒤를 찍어야 의미가 있다. 목 응답이라 곧바로 끝난다. */
    await page.waitForLoadState('networkidle')

    /* 실제로 그 화면에 있는지 먼저 확인한다.
     * 보호 경로는 로그인 상태에 따라 클라이언트에서 '/'로 되돌려보내는데,
     * 그러면 조용히 랜딩 페이지를 찍고 통과해버린다. 실제로 랜딩·메인·영상
     * 스크린샷이 바이트까지 같았던 적이 있다. 전후 비교의 기준으로 쓸 그림이라
     * 어느 화면을 찍었는지가 보장되어야 한다. */
    expect(
      new URL(page.url()).pathname,
      `${path} 진입 후 예상과 다른 곳에 도착했다`
    ).toBe(landsOn ?? path)

    await captureFlowShot(page, slug)

    /* 가로 스크롤은 단언하지 않고 기록만 한다.
     *
     * 원인은 이미 특정했다 — entities/main/videoCard의 VideoCard에 걸린
     * min-w-[51.2rem](512px)이 컨테이너를 밀어내 scrollWidth가 1285가 된다.
     * 이 카드가 없는 /channel에서는 넘치지 않는다는 게 근거다.
     *
     * 그런데 발생 여부가 실행마다 갈린다. 로그인·데이터 상태에 따라 카드가
     * 렌더되기도 하고 아니기도 해서다. 조건이 불안정한 것을 단언으로 걸면
     * 빨간불이 노이즈가 되므로, 리포트에 남기고 판단은 사람이 한다.
     * VideoCard 통합 때 min-width와 함께 정리하는 것이 자연스럽다. */
    const overflow = await measureHorizontalOverflow(page)
    test.info().annotations.push({
      type: '가로 스크롤',
      description: overflow.overflowed
        ? `${overflow.scrollWidth - overflow.clientWidth}px 넘침 (scrollWidth ${overflow.scrollWidth} > clientWidth ${overflow.clientWidth})`
        : '없음',
    })

    if (problems.knownIssues.length > 0) {
      test.info().annotations.push({
        type: '알려진 결함',
        description: problems.knownIssues.join('\n'),
      })
    }

    expectNoProblems(problems)
  })
}
