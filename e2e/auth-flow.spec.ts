import { expect, test } from '@playwright/test'

import {
  dismissLoginModalIfOpen,
  ensureLoggedOut,
  logIn,
  logOut,
} from './support/auth'
import {
  captureFlowShot,
  expectNoBrokenImages,
  expectNoProblems,
  watchForProblems,
} from './support/diagnostics'

/* 로그인 왕복은 단위 테스트로 덮을 수 없는 구간이다.
 * 팝업 → postMessage → 전체 새로고침 → /auth/refresh → /user/me로 이어지는
 * 사슬 전체가 브라우저 동작에 걸려 있다.
 *
 * 목 환경에서는 /auth/google이 구글 대신 /auth/mock-callback으로 가므로
 * 실제 OAuth 없이 이 사슬을 그대로 통과시킬 수 있다. */

/* 로그인 한 번에 팝업 왕복 + 전체 새로고침 + 재초기화가 들어간다.
 * dev 서버는 라우트를 처음 밟을 때 컴파일까지 하므로 기본 30초로는 모자란다. */
test.describe('로그인 플로우', () => {
  test.slow()

  test('구글 팝업으로 로그인하면 헤더가 로그아웃 상태로 바뀐다', async ({
    page,
  }) => {
    const problems = watchForProblems(page)

    await page.goto('/')
    await ensureLoggedOut(page)
    await captureFlowShot(page, 'auth-01-로그아웃-상태')

    await logIn(page)
    await captureFlowShot(page, 'auth-02-로그인-완료')

    await expectNoBrokenImages(page)
    expectNoProblems(problems)
  })

  /* 관찰된 것: 로그아웃 직후 로그인 모달이 저절로 열릴 때가 있다.
   * axiosInstance가 401 → refresh 실패 경로에서 useLoginModal.open()을 부르는데
   * (axiosInstance.ts:80), 로그아웃 시점에 인증이 필요한 쿼리가 떠 있으면 그 401이
   * 같은 경로를 탄다. 세션 만료와 자발적 로그아웃이 구분되지 않는 것이다.
   * 사용자가 방금 스스로 로그아웃했는데 곧바로 로그인을 요구받는 셈이라 어색하다.
   *
   * 다만 뜨는지 여부가 그 시점의 쿼리 상태에 달려 있어 재현이 일정하지 않다.
   * 불안정한 조건을 단언으로 걸면 빨간불이 노이즈가 되므로, 모달이 떴든 아니든
   * 최종적으로 비로그인 상태로 돌아오는지만 확인한다. */
  test('로그아웃하면 비로그인 상태로 돌아온다', async ({ page }) => {
    await page.goto('/')
    await ensureLoggedOut(page)
    await logIn(page)

    await logOut(page)
    await captureFlowShot(page, 'auth-03-로그아웃-직후')

    await dismissLoginModalIfOpen(page)
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('로그인 모달을 닫으면 로그아웃 상태가 유지된다', async ({ page }) => {
    await page.goto('/')
    await ensureLoggedOut(page)

    await page.getByRole('button', { name: '로그인' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()

    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible()
  })
})
