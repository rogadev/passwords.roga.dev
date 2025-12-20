import { test, expect } from '@playwright/test';

test('Network monitoring shows network activity when pinging Google', async ({ page }) => {
  // Navigate to the home page
  await page.goto('/');

  // Open the Network Activity Monitor panel
  await page.click('button:has-text("Network Activity Monitor")');

  // Wait for the panel to be visible
  await page.waitForSelector('#network-monitor-panel', { state: 'visible' });

  // Count network log entries before the ping
  let initialLogCount = 0;
  try {
    // If log exists and has entries, count them
    const logExists = await page.locator('.max-h-64.overflow-y-auto').isVisible();
    if (logExists) {
      const entries = await page.locator('.max-h-64.overflow-y-auto div[class*="border-b"]').count();
      initialLogCount = entries;
    }
  } catch (e) {
    // Log might not exist yet if there are no entries, that's fine
    initialLogCount = 0;
  }

  // Click the "Ping Google" button
  await page.click('button:has-text("Ping Google")');

  // Wait for test to complete - either success or error message should appear
  await Promise.race([
    page.waitForSelector('div.text-green-700', { timeout: 10000 }),
    page.waitForSelector('div.text-red-700', { timeout: 10000 })
  ]);

  // Wait a moment for log entries to populate
  await page.waitForTimeout(1000);

  // Verify the network log exists and contains entries now
  await page.waitForSelector('.max-h-64.overflow-y-auto', { state: 'visible', timeout: 5000 });
  
  // Check that new entries have been added to the log
  const currentEntries = await page.locator('.max-h-64.overflow-y-auto div[class*="border-b"]').count();
  expect(currentEntries).toBeGreaterThan(initialLogCount);
  
  // Verify the log contains references to the Google ping
  const logContent = await page.locator('.max-h-64.overflow-y-auto').textContent();
  expect(logContent).toContain('google.com');
}); 