import { expect, type Page } from '@playwright/test'

/* 목 환경에서는 /auth/google이 구글 대신 /auth/mock-callback으로 리다이렉트된다.
 * 팝업이 refreshToken 쿠키를 심고 opener에 AUTH_SUCCESS를 postMessage한 뒤
 * 스스로 닫히며, opener는 그 메시지를 받고 '/'로 전체 새로고침한다.
 * 즉 로그인 완료 시점은 "팝업이 닫힌 때"가 아니라 "새로고침이 끝난 때"다. */

const LOGIN_BUTTON = '로그인'
const LOGOUT_BUTTON = '로그아웃'

/* 헤더 버튼은 초기화 중 '로딩중...'이었다가 로그인 여부에 따라 갈린다.
 *
 * '로딩중...'이 사라지기만 기다리면 안 된다. page.goto는 load 시점에 풀리는데
 * 그때는 하이드레이션 전이라 버튼이 아예 없고, "없음"도 hidden으로 통과한다.
 * 게다가 isVisible()은 자동 대기를 하지 않아 그 순간을 그대로 읽어버린다.
 * 둘 중 하나가 실제로 보일 때까지 기다려야 상태를 옳게 읽는다. */
export async function waitForAuthSettled(page: Page) {
  await expect(
    page.getByRole('button', {
      name: new RegExp(`^(${LOGIN_BUTTON}|${LOGOUT_BUTTON})$`),
    })
  ).toBeVisible({ timeout: 20_000 })
}

export async function isLoggedIn(page: Page) {
  await waitForAuthSettled(page)
  return page.getByRole('button', { name: LOGOUT_BUTTON }).isVisible()
}

export async function logIn(page: Page) {
  await page.getByRole('button', { name: LOGIN_BUTTON }).click()

  const modal = page.getByRole('dialog')
  await expect(modal).toBeVisible()

  /* 팝업은 스스로 닫히므로 열리는 순간을 먼저 잡아둔다. */
  const popupPromise = page.waitForEvent('popup')
  await modal.getByRole('button', { name: 'Continue with Google' }).click()
  const popup = await popupPromise
  await popup.waitForEvent('close')

  /* opener가 '/'로 새로고침한다. 그게 끝나야 로그인 상태가 화면에 반영된다. */
  await expect(page.getByRole('button', { name: LOGOUT_BUTTON })).toBeVisible({
    timeout: 15_000,
  })
}

/* 로그아웃하면 로그인 모달이 자동으로 열린다.
 * axiosInstance가 401 → refresh 실패 경로에서 useLoginModal.open()을 부르는데
 * (axiosInstance.ts:80), 로그아웃 직후의 401도 그 경로를 탄다.
 * 모달이 열리면 뒤쪽 헤더가 접근성 트리에서 감춰져 '로그인' 버튼을 찾을 수 없다.
 * 그래서 로그아웃 완료 판정을 '로그인' 버튼이 아니라 '로그아웃' 버튼이
 * 사라졌는지로 한다. */
export async function logOut(page: Page) {
  await page.getByRole('button', { name: LOGOUT_BUTTON }).click()
  await expect(page.getByRole('button', { name: LOGOUT_BUTTON })).toBeHidden({
    timeout: 15_000,
  })
}

/* 자동으로 열린 로그인 모달을 닫아 헤더를 다시 조작 가능한 상태로 만든다. */
export async function dismissLoginModalIfOpen(page: Page) {
  const modal = page.getByRole('dialog')
  if (await modal.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape')
    await expect(modal).toBeHidden({ timeout: 10_000 })
  }
}

/* MSW 핸들러가 로그인 상태를 서비스 워커 모듈 변수로 들고 있어서
 * 테스트 시작 시점의 상태가 보장되지 않는다. 기준점을 맞춰 둔다. */
export async function ensureLoggedOut(page: Page) {
  if (await isLoggedIn(page)) {
    await logOut(page)
    await dismissLoginModalIfOpen(page)
  }
  await expect(page.getByRole('button', { name: LOGIN_BUTTON })).toBeVisible({
    timeout: 15_000,
  })
}
