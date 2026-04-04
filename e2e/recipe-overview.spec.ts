import { test, expect } from '@playwright/test';

test.describe('Recipe Overview', () => {
  test('recipe page shows ingredients and equipment', async ({ page }) => {
    await page.goto('/italian/spaghetti-bolognese.html');
    await expect(page.locator('body')).toContainText('Onion');
    await expect(page.locator('body')).toContainText('Spaghetti');
    // Check equipment
    await expect(page.locator('body')).toContainText('Large');
  });

  test('mode toggle switches between relaxed and optimized', async ({ page }) => {
    await page.goto('/italian/spaghetti-bolognese.html');
    // Relaxed is default — check the relaxed button is active
    await expect(page.locator('.mode-btn.active')).toContainText('Relaxed');
    // Click optimized mode button
    await page.click('.mode-btn:has-text("Optimized")');
    // Now optimized should be active
    await expect(page.locator('.mode-btn.active')).toContainText('Optimized');
  });

  test('phase cards display', async ({ page }) => {
    await page.goto('/italian/spaghetti-bolognese.html');
    const phases = page.locator('.phase-card');
    const count = await phases.count();
    expect(count).toBeGreaterThan(0);
  });
});
