import { defineConfig, devices } from '@playwright/test'

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
    baseURL: 'http://localhost:3000',
    /* 재시도 시에만 trace 수집 */
    trace: 'on-first-retry',
  },

  /* 소규모 팀 기준 유지 비용을 낮추기 위해 chromium만 사용한다.
   * 크로스 브라우저 검증이 필요해지면 firefox/webkit을 추가한다. */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* 테스트 실행 전 로컬 서버를 띄운다 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})