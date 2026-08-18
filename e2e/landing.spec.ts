import { expect, test } from '@playwright/test'

test.describe('랜딩 페이지', () => {
  test('비로그인 상태에서 히어로 CTA가 노출된다', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/인플레이스/)
    await expect(
      page.getByRole('button', { name: '인플루언서로 무료체험 시작' })
    ).toBeVisible()
  })

  test('CTA 클릭 시 로그인 모달이 열린다', async ({ page }) => {
    await page.goto('/')

    await page
      .getByRole('button', { name: '인플루언서로 무료체험 시작' })
      .click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})
