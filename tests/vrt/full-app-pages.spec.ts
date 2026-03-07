import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for all App/Current page stories.
 *
 * Each test navigates to the Storybook iframe URL for a story's Default
 * variant, waits for rendering to stabilise, then captures a full-page
 * screenshot and compares it against the committed baseline.
 *
 * Story ID format: storybook lowercases the title path and joins with
 * double hyphens for the group separator and single hyphens within words.
 * Example: "App/Current/Home/Dashboard" -> "app-current-home-dashboard--default"
 */

const STORIES = [
  { name: 'Dashboard', id: 'app-current-home-dashboard--default' },
  { name: 'Item Detail', id: 'app-current-reference-items-item-detail--default' },
  { name: 'Items Grid', id: 'app-current-reference-items-items-grid--default' },
  { name: 'Kanban Card', id: 'app-current-resources-kanban-cards-kanban-card--default' },
  {
    name: 'Mobile Device Check',
    id: 'app-current-resources-kanban-cards-mobile-device-check--default',
  },
  { name: 'Scan', id: 'app-current-resources-kanban-cards-scan--default' },
  { name: 'Reset Password', id: 'app-current-system-authentication-reset-password--default' },
  { name: 'Sign In', id: 'app-current-system-authentication-sign-in--default' },
  { name: 'Sign Up', id: 'app-current-system-authentication-sign-up--default' },
  { name: 'Settings Account', id: 'app-current-system-settings--account' },
  { name: 'Order Queue', id: 'app-current-transactions-orders-order-queue--default' },
  { name: 'Receiving', id: 'app-current-transactions-receiving--default' },
] as const;

for (const story of STORIES) {
  test(`VRT: ${story.name}`, async ({ page }) => {
    // Navigate to the story iframe (bypasses Storybook manager chrome).
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=`, {
      waitUntil: 'networkidle',
    });

    // Give async renders (lazy data, animations) time to settle.
    // Disable CSS animations/transitions for deterministic screenshots.
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `,
    });

    // Wait a short period for any final paints.
    await page.waitForTimeout(1000);

    // Full-page screenshot comparison.
    await expect(page).toHaveScreenshot(`${story.id}.png`, {
      fullPage: true,
    });
  });
}
