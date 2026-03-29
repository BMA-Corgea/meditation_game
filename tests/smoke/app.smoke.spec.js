import { test, expect } from '@playwright/test'

test('app loads and shows the main interactive shell', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('button', { name: /ambience on/i })).toBeVisible()
  await expect(page.locator('.card-title', { hasText: 'Breathe' })).toBeVisible()
  await expect(page.locator('.hand-cards')).toBeVisible()
})
