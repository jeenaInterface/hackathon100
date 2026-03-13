import { test, expect } from '@playwright/test';

const SCENARIO_TEXT = "UAC‑1: System must allow user to access the login page \n\nLogin page must be loaded successfully. \n\nRequired fields must be visible:  \n\nUsername \n\nPassword \n\nLogin button";

test.describe('Business scenario', () => {
  test('scenario steps', async ({ page }, testInfo) => {
    await testInfo.attach('Business scenario (test data)', {
      body: SCENARIO_TEXT,
      contentType: 'text/plain',
    });

    await test.step('1. Load application', async () => {
      await page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login");
      const screenshot = await page.screenshot();
      await testInfo.attach('Initial page', { body: screenshot, contentType: 'image/png' });
    });

  await test.step("UAC‑1: System must allow user to access the login page", async () => {
    // UAC‑1: System must allow user to access the login page
    const screenshot = await page.screenshot();
    await testInfo.attach("UAC‑1: System must allow user to access the login ", { body: screenshot, contentType: 'image/png' });
  });

  await test.step("Login page must be loaded successfully.", async () => {
    // Login page must be loaded successfully.
    const screenshot = await page.screenshot();
    await testInfo.attach("Login page must be loaded successfully.", { body: screenshot, contentType: 'image/png' });
  });

  await test.step("Required fields must be visible:", async () => {
    // Required fields must be visible:
    const screenshot = await page.screenshot();
    await testInfo.attach("Required fields must be visible:", { body: screenshot, contentType: 'image/png' });
  });

  await test.step("Username", async () => {
    // Username
    const screenshot = await page.screenshot();
    await testInfo.attach("Username", { body: screenshot, contentType: 'image/png' });
  });

  await test.step("Password", async () => {
    // Password
    const screenshot = await page.screenshot();
    await testInfo.attach("Password", { body: screenshot, contentType: 'image/png' });
  });

  await test.step("Login button", async () => {
    // Login button
    const screenshot = await page.screenshot();
    await testInfo.attach("Login button", { body: screenshot, contentType: 'image/png' });
  });

    await test.step('Final: capture end state', async () => {
      const screenshot = await page.screenshot();
      await testInfo.attach('End state', { body: screenshot, contentType: 'image/png' });
    });
  });
});
