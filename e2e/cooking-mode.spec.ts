import { test, expect } from '@playwright/test';

test.describe('Cooking Mode', () => {
  test('start cooking enters step view', async ({ page }) => {
    await page.goto('/italian/spaghetti-bolognese.html');
    await page.click('.view-tab:has-text("Cooking")');
    await expect(page.locator('.focus-card')).toBeVisible();
  });

  test('next/back navigation works', async ({ page }) => {
    await page.goto('/italian/spaghetti-bolognese.html');
    await page.click('.view-tab:has-text("Cooking")');
    await expect(page.locator('.step-counter')).toContainText('Step 1');
    // Click next
    await page.click('.nav-btn-next');
    await expect(page.locator('.step-counter')).toContainText('Step 2');
    // Click back
    await page.click('.nav-btn-back');
    await expect(page.locator('.step-counter')).toContainText('Step 1');
  });

  test('step counter is visible and shows step 1', async ({ page }) => {
    await page.goto('/italian/spaghetti-bolognese.html');
    await page.click('.view-tab:has-text("Cooking")');
    await expect(page.locator('.step-counter')).toBeVisible();
    await expect(page.locator('.step-counter')).toContainText('Step 1');
  });

  test('back button is disabled on first step', async ({ page }) => {
    await page.goto('/italian/spaghetti-bolognese.html');
    await page.click('.view-tab:has-text("Cooking")');
    await expect(page.locator('.nav-btn-back')).toBeDisabled();
  });
});
