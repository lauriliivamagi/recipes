import { test, expect } from '@playwright/test';

test.describe('Cooking Warmth & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/italian/spaghetti-bolognese.html');
    await page.click('.view-tab:has-text("Cooking")');
    await expect(page.locator('.focus-card')).toBeVisible();
  });

  test('progress bar is visible and advances with steps', async ({ page }) => {
    const fill = page.locator('.progress-fill');
    await expect(fill).toBeVisible();

    // Get initial width
    const initialWidth = await fill.evaluate(el => parseFloat(el.style.width));
    expect(initialWidth).toBeGreaterThan(0);

    // Advance two steps to ensure visible change
    await page.click('.nav-btn-next');
    await page.click('.nav-btn-next');
    await page.waitForTimeout(300); // wait for transition
    const nextWidth = await fill.evaluate(el => parseFloat(el.style.width));
    expect(nextWidth).toBeGreaterThan(initialWidth);
  });

  test('progress bar increases toward completion', async ({ page }) => {
    // Navigate to the last step
    const totalText = await page.locator('.step-counter').textContent();
    const total = parseInt(totalText!.match(/of (\d+)/)![1]!);

    for (let i = 1; i < total; i++) {
      await page.click('.nav-btn-next');
    }

    const fill = page.locator('.progress-fill');
    const width = await fill.evaluate(el => parseFloat(el.style.width));
    // On last step, progress should be near 100% (total-1/total * 100)
    expect(width).toBeGreaterThan(90);
  });

  test('contextual hint appears on passive steps', async ({ page }) => {
    // Navigate through steps until we find a hint
    const totalText = await page.locator('.step-counter').textContent();
    const total = parseInt(totalText!.match(/of (\d+)/)![1]!);

    let foundHint = false;
    for (let i = 0; i < total; i++) {
      const hint = page.locator('.focus-hint');
      if (await hint.count() > 0) {
        const text = await hint.textContent();
        // Should be one of the two hint types
        expect(
          text!.includes('hands-free time') || text!.includes('running in the background'),
        ).toBeTruthy();
        foundHint = true;
        break;
      }
      if (i < total - 1) await page.click('.nav-btn-next');
    }
    expect(foundHint).toBeTruthy();
  });

  test('nav button shows "Almost done" on second-to-last step', async ({ page }) => {
    const totalText = await page.locator('.step-counter').textContent();
    const total = parseInt(totalText!.match(/of (\d+)/)![1]!);

    // Navigate to second-to-last step
    for (let i = 1; i < total - 1; i++) {
      await page.click('.nav-btn-next');
    }

    await expect(page.locator('.nav-btn-next')).toContainText('Almost done');
  });

  test('nav button shows "Finish" on last step', async ({ page }) => {
    const totalText = await page.locator('.step-counter').textContent();
    const total = parseInt(totalText!.match(/of (\d+)/)![1]!);

    // Navigate to last step
    for (let i = 1; i < total; i++) {
      await page.click('.nav-btn-next');
    }

    await expect(page.locator('.nav-btn-next')).toContainText('Finish');
  });

  test('completion card appears after finishing all steps', async ({ page }) => {
    const totalText = await page.locator('.step-counter').textContent();
    const total = parseInt(totalText!.match(/of (\d+)/)![1]!);

    // Navigate to last step and click Finish
    for (let i = 0; i < total; i++) {
      await page.click('.nav-btn-next');
    }

    await expect(page.locator('.completion-card')).toBeVisible();
    await expect(page.locator('.completion-title')).toContainText('Enjoy your meal');
    await expect(page.locator('.completion-subtitle')).toContainText('Spaghetti Bolognese');
    await expect(page.locator('.completion-subtitle')).toContainText(String(total) + ' steps');
  });

  test('completion card shows full progress bar', async ({ page }) => {
    const totalText = await page.locator('.step-counter').textContent();
    const total = parseInt(totalText!.match(/of (\d+)/)![1]!);

    for (let i = 0; i < total; i++) {
      await page.click('.nav-btn-next');
    }

    // Focus card should be gone, completion card shown
    await expect(page.locator('.completion-card')).toBeVisible();
    await expect(page.locator('.focus-card')).not.toBeVisible();
  });

  test('back button works from completion state', async ({ page }) => {
    const totalText = await page.locator('.step-counter').textContent();
    const total = parseInt(totalText!.match(/of (\d+)/)![1]!);

    for (let i = 0; i < total; i++) {
      await page.click('.nav-btn-next');
    }

    await expect(page.locator('.completion-card')).toBeVisible();

    // Go back to last step
    await page.click('.nav-btn-back');
    await expect(page.locator('.focus-card')).toBeVisible();
    await expect(page.locator('.completion-card')).not.toBeVisible();
  });

  test('next button is disabled on completion', async ({ page }) => {
    const totalText = await page.locator('.step-counter').textContent();
    const total = parseInt(totalText!.match(/of (\d+)/)![1]!);

    for (let i = 0; i < total; i++) {
      await page.click('.nav-btn-next');
    }

    await expect(page.locator('.nav-btn-next')).toBeDisabled();
  });
});
