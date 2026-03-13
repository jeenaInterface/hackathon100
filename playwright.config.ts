import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/generated',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  outputDir: 'test-results',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on',
    video: 'on',
    screenshot: 'on',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
