import { test, expect } from '@playwright/test';

test.describe('Servings Scaling', () => {
  test('servings increase updates count', async ({ page }) => {
    await page.goto('/italian/spaghetti-bolognese.html');
    // Default servings is 4
    await expect(page.locator('.servings-count')).toContainText('4');
    // Click + four times (4 -> 5 -> 6 -> 7 -> 8)
    await page.click('.servings-btn:has-text("+")');
    await page.click('.servings-btn:has-text("+")');
    await page.click('.servings-btn:has-text("+")');
    await page.click('.servings-btn:has-text("+")');
    await expect(page.locator('.servings-count')).toContainText('8');
  });

  test('servings decrease updates count', async ({ page }) => {
    await page.goto('/italian/spaghetti-bolognese.html');
    // Default servings is 4, click − twice (4 -> 3 -> 2)
    await page.click('.servings-btn:has-text("−")');
    await page.click('.servings-btn:has-text("−")');
    await expect(page.locator('.servings-count')).toContainText('2');
  });
});
