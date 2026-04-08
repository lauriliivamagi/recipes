import { test, expect } from '@playwright/test';

test.describe('i18n', () => {
  test('English labels display correctly', async ({ page }) => {
    await page.goto('/italian/spaghetti-bolognese.html');
    await expect(page.locator('body')).toContainText('Overview');
    await expect(page.locator('body')).toContainText('Cooking');
    await expect(page.locator('body')).toContainText('Relaxed');
    await expect(page.locator('body')).toContainText('Optimized');
  });
});
