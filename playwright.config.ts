import { defineConfig, devices } from '@playwright/test'

/* e2e는 목 환경으로 띄운다.
 * NEXT_PUBLIC_MOCK_ENABLED=true면 /auth/google이 구글 대신
 * /auth/mock-callback으로 리다이렉트되어 OAuth 없이 로그인할 수 있고,
 * MSW 핸들러가 결정적인 응답을 준다. 실서버 데이터로 찍으면 조회수 하나만
 * 바뀌어도 스크린샷이 전부 달라져 비교가 의미를 잃는다.
 *
 * 개발용 dev 서버와 포트를 분리한다. 같은 포트를 쓰면 reuseExistingServer가
 * 목 환경이 아닌 서버를 그대로 붙잡아 테스트가 조용히 실서버를 때린다. */
const E2E_PORT = 3100
const E2E_ORIGIN = `http://localhost:${E2E_PORT}`

/* 반응형 기준선을 재는 폭.
 * 디자인 토큰이 정의한 경계(mobile 375 / tablet 768 / desktop 1024)와
 * 그 경계 바로 아래·위를 함께 본다. 경계에서만 재면 그 사이 구간이 비고,
 * 실제로 768px에서 멀쩡하다가 600px에서 깨지는 화면이 있다. */
const BASELINE_VIEWPORTS = [
  { name: 'w1440', width: 1440 },
  { name: 'w1280', width: 1280 },
  { name: 'w1024', width: 1024 },
  { name: 'w768', width: 768 },
  { name: 'w430', width: 430 },
  { name: 'w375', width: 375 },
]

const VIEWPORT_BASELINE_SPEC = /viewport-baseline\.spec\.ts/

const MOCK_ENV = {
  NEXT_PUBLIC_MOCK_ENABLED: 'true',
  /* mock-callback 리다이렉트와 postMessage origin이 이 값을 쓴다.
   * 비어 있으면 undefined/auth/mock-callback으로 이동해 로그인이 깨진다. */
  NEXT_PUBLIC_APP_URL: E2E_ORIGIN,
  /* axiosInstance와 MSW 핸들러가 같은 변수를 읽으므로 값 자체는 일치하기만
   * 하면 된다. 네트워크로 나가지 않는다는 게 드러나도록 목 호스트를 쓴다. */
  NEXT_PUBLIC_API_URL: 'http://mock.local/api',
}

/**
 * E2E 테스트 설정.
 * 상세: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  /* CI에서 test.only가 남아 있으면 실패시킨다 */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: E2E_ORIGIN,
    /* 재시도 시에만 trace 수집 */
    trace: 'on-first-retry',
  },

  /* 소규모 팀 기준 유지 비용을 낮추기 위해 chromium만 사용한다.
   * 크로스 브라우저 검증이 필요해지면 firefox/webkit을 추가한다.
   *
   * 뷰포트별 측정은 viewport-baseline.spec.ts 하나만 여러 폭으로 돌린다.
   * 모든 스펙을 폭마다 돌리면 실행 시간이 폭 수만큼 늘고, 로그인 플로우처럼
   * 폭과 무관한 검증까지 중복된다. 그래서 프로젝트별로 대상 스펙을 갈라 둔다. */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: VIEWPORT_BASELINE_SPEC,
    },
    ...BASELINE_VIEWPORTS.map(({ name, width }) => ({
      name,
      use: { ...devices['Desktop Chrome'], viewport: { width, height: 900 } },
      testMatch: VIEWPORT_BASELINE_SPEC,
    })),
  ],

  /* 테스트 실행 전 목 환경으로 로컬 서버를 띄운다.
   * reuseExistingServer를 끄는 이유는 위 MOCK_ENV 주석 참고 —
   * 목 환경이 아닌 서버를 재사용하면 실서버를 때리게 된다. */
  webServer: {
    command: `npm run dev -- -p ${E2E_PORT}`,
    url: E2E_ORIGIN,
    reuseExistingServer: false,
    timeout: 120 * 1000,
    /* env를 지정하면 process.env를 대체한다. 그대로 넘기면 PATH가 사라져
     * npm을 찾지 못하고 서버가 영영 뜨지 않는다(증상은 webServer 타임아웃). */
    env: { ...(process.env as Record<string, string>), ...MOCK_ENV },
  },
})
