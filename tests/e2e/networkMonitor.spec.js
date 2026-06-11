import { test, expect } from '@playwright/test'

test('Network monitoring shows network activity when pinging Google', async ({
  page,
}) => {
  // Navigate to the home page
  await page.goto('/')

  // Open the Network Activity Monitor panel
  await page.locator('button', { hasText: 'Network Activity Monitor' }).click()

  // The panel should become visible
  await expect(page.locator('#network-monitor-panel')).toBeVisible()

  // Count network log entries before the ping. `.count()` resolves to 0 when
  // the log is empty, so no visibility guard or try/catch is needed.
  const logEntries = page.locator('.max-h-48.overflow-y-auto > div.p-3')
  const initialLogCount = await logEntries.count()

  // Click the "Ping Google" button
  await page.locator('button', { hasText: 'Ping Google' }).click()

  // Wait for the request to resolve: either the success span (contains "ms")
  // or the error span (contains "Failed") becomes visible.
  const success = page.locator('span.text-emerald-400', { hasText: 'ms' })
  const failure = page.locator('span.text-rose-400', { hasText: 'Failed' })
  await expect(success.or(failure).first()).toBeVisible({ timeout: 10000 })

  // The log container should be visible and have gained entries.
  await expect(page.locator('.max-h-48.overflow-y-auto')).toBeVisible()
  await expect
    .poll(() => logEntries.count(), { timeout: 5000 })
    .toBeGreaterThan(initialLogCount)

  // The log should reference the Google ping.
  await expect(page.locator('.max-h-48.overflow-y-auto')).toContainText(
    'google.com',
  )
})
