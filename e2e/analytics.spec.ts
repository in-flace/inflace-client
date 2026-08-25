import { expect, test } from '@playwright/test'

import { ensureLoggedOut } from './support/auth'

/* 가입 전환 계측이 실제로 dataLayer에 쌓이는지 확인한다.
 *
 * 계측은 조용히 깨진다. 이벤트명을 잘못 쓰거나 호출부가 빠져도 화면은 멀쩡하고
 * 테스트도 통과한다. GTM 컨테이너 쪽에서야 "데이터가 안 들어온다"로 드러나는데
 * 그때는 이미 유입을 놓친 뒤다. 브라우저에서 직접 확인하는 것이 유일한 자동 장치다. */

const DATA_LAYER_KEY = '__dl'

/* 로그인 성공 시 '/'로 전체 새로고침이 일어나 dataLayer가 초기화된다.
 * push를 가로채 sessionStorage에 누적해야 내비게이션 뒤에도 읽을 수 있다. */
async function recordDataLayer(page: import('@playwright/test').Page) {
  await page.addInitScript((key) => {
    const w = window as unknown as { dataLayer?: unknown[] }
    w.dataLayer = w.dataLayer || []
    const orig = w.dataLayer.push.bind(w.dataLayer)
    w.dataLayer.push = (...args: unknown[]) => {
      try {
        const prev = JSON.parse(sessionStorage.getItem(key) ?? '[]')
        for (const a of args) {
          if (a && typeof a === 'object' && 'event' in (a as object))
            prev.push(a)
        }
        sessionStorage.setItem(key, JSON.stringify(prev))
      } catch {
        /* 계측 확인용이므로 실패해도 화면 동작을 막지 않는다 */
      }
      return orig(...args)
    }
  }, DATA_LAYER_KEY)
}

async function readEvents(page: import('@playwright/test').Page) {
  const raw = await page.evaluate(
    (key) => sessionStorage.getItem(key),
    DATA_LAYER_KEY
  )
  return JSON.parse(raw ?? '[]') as Record<string, unknown>[]
}

test('구글 로그인 퍼널이 dataLayer에 순서대로 쌓인다', async ({ page }) => {
  test.setTimeout(120_000)
  await recordDataLayer(page)

  await page.goto('/')
  await ensureLoggedOut(page)

  await page.getByRole('button', { name: '로그인' }).click()
  const modal = page.getByRole('dialog')
  await expect(modal).toBeVisible()

  const popupPromise = page.waitForEvent('popup')
  await modal.getByRole('button', { name: 'Continue with Google' }).click()
  const popup = await popupPromise
  await popup.waitForEvent('close')
  await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible({
    timeout: 15_000,
  })

  const events = await readEvents(page)

  /* 전환율 분모. 진입 경로가 실려야 어느 CTA가 가입을 만드는지 알 수 있다. */
  expect(events).toContainEqual(
    expect.objectContaining({ event: 'login_modal_opened', trigger: 'header' })
  )

  expect(events).toContainEqual(
    expect.objectContaining({ event: 'login_provider_click', method: 'google' })
  )

  /* 전환 지점. 목 콜백이 isNewUser: true를 주므로 sign_up이어야 한다. */
  const signUps = events.filter((e) => e.event === 'sign_up')
  expect(signUps).toHaveLength(1)
  expect(signUps[0]).toMatchObject({ method: 'google' })
  expect(String(signUps[0].user_id)).not.toBe('')
})

/* LoginModal은 구글·유튜브용으로 usePopupOAuth를 두 개 만들고 두 인스턴스가
 * 모두 window의 message를 듣는다. 걸러내지 않으면 한 번의 로그인에 양쪽이
 * 반응해 sign_up이 두 번 발행되고 제공자도 잘못 붙는다(실제로 그랬다). */
test('로그인 한 번에 전환 이벤트가 한 번만 발행된다', async ({ page }) => {
  test.setTimeout(120_000)
  await recordDataLayer(page)

  await page.goto('/')
  await ensureLoggedOut(page)

  await page.getByRole('button', { name: '로그인' }).click()
  const popupPromise = page.waitForEvent('popup')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Continue with Google' })
    .click()
  const popup = await popupPromise
  await popup.waitForEvent('close')
  await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible({
    timeout: 15_000,
  })

  const events = await readEvents(page)
  const conversions = events.filter(
    (e) => e.event === 'sign_up' || e.event === 'login'
  )

  expect(conversions).toHaveLength(1)
  expect(conversions[0]).toMatchObject({ method: 'google' })
})
