import { test, expect } from '@playwright/test';

/**
 * Regression test for the double-login bug.
 *
 * Symptom: visiting a protected tool while logged out redirects to /login;
 * after a successful login the user was bounced back to /login a SECOND time
 * (the soft navigation reused a prefetched logged-out redirect cached for the
 * tool route). The fix makes login do a hard navigation and disables prefetch
 * on the tool links, so one login lands straight on the tool.
 *
 * Requires a running stack (frontend + backend + MongoDB), or set
 * E2E_BASE_URL to the deployed app.
 */

const password = 'secret123';
const email = `e2e_${Date.now()}_${Math.floor(Math.random() * 1e6)}@test.com`;

test.beforeAll(async ({ request }) => {
  // Create the user through the app's own API (proxies to the Express backend).
  const res = await request.post('/api/auth/register', {
    data: { name: 'E2E User', email, password, confirmPassword: password },
  });
  expect(res.ok(), `register failed: ${res.status()}`).toBeTruthy();
});

test('protected tool redirects to login when logged out', async ({ page }) => {
  await page.goto('/tools/merge');
  await expect(page).toHaveURL(/\/login\?next=%2Ftools%2Fmerge/);
});

test('one login lands on the tool with no second redirect', async ({ page }) => {
  // Start at the tool gate while logged out.
  await page.goto('/tools/merge');
  await expect(page).toHaveURL(/\/login/);

  // Log in.
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // We must land on the tool — NOT be bounced back to /login a second time.
  await expect(page).toHaveURL(/\/tools\/merge$/);
  await expect(page.getByRole('button', { name: /^process$/i })).toBeVisible();

  // Reloading the tool while authenticated must also stay on the tool.
  await page.reload();
  await expect(page).toHaveURL(/\/tools\/merge$/);
});
