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
    // Log entries are direct children divs with p-3 class inside the scrollable container
    const logExists = await page.locator('.max-h-48.overflow-y-auto').isVisible();
    if (logExists) {
      const entries = await page.locator('.max-h-48.overflow-y-auto > div.p-3').count();
      initialLogCount = entries;
    }
  } catch (e) {
    // Log might not exist yet if there are no entries, that's fine
    initialLogCount = 0;
  }

  // Click the "Ping Google" button
  await page.click('button:has-text("Ping Google")');

  // Wait for test to complete - either success or error message should appear
  // The success span contains "ms" text, error span contains "Failed"
  // Both have aria-live="polite" attribute
  await Promise.race([
    page.waitForSelector('span.text-emerald-400:has-text("ms")', { timeout: 10000 }),
    page.waitForSelector('span.text-rose-400:has-text("Failed")', { timeout: 10000 })
  ]);

  // Wait a moment for log entries to populate
  await page.waitForTimeout(1000);

  // Verify the network log exists and contains entries now
  // Log entries are direct children divs with p-3 class inside the scrollable container
  await page.waitForSelector('.max-h-48.overflow-y-auto', { state: 'visible', timeout: 5000 });
  
  // Check that new entries have been added to the log
  const currentEntries = await page.locator('.max-h-48.overflow-y-auto > div.p-3').count();
  expect(currentEntries).toBeGreaterThan(initialLogCount);
  
  // Verify the log contains references to the Google ping
  const logContent = await page.locator('.max-h-48.overflow-y-auto').textContent();
  expect(logContent).toContain('google.com');
}); 
