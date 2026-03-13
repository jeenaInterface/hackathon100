/**
 * Converts business scenario text to Playwright test code.
 * Generates tests with test.step() for each logical step, scenario attachment, and screenshots.
 */
export function scenarioToPlaywrightTemplate(scenarioContent: string): string {
  const lines = scenarioContent
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const scenarioEscaped = JSON.stringify(scenarioContent);
  const steps = lines.map((line) => {
    const stepTitle = line.slice(0, 80) + (line.length > 80 ? '...' : '');
    const safeComment = line.replace(/\\/g, '\\\\').replace(/\`/g, '\\`').replace(/\$/g, '\\$');
    return `  await test.step(${JSON.stringify(stepTitle)}, async () => {
    // ${safeComment}
    const screenshot = await page.screenshot();
    await testInfo.attach(${JSON.stringify(stepTitle.slice(0, 50))}, { body: screenshot, contentType: 'image/png' });
  });`;
  });

  const scenarioStepsCode = steps.length > 0 ? steps.join('\n\n') : '';

  return `import { test, expect } from '@playwright/test';

const SCENARIO_TEXT = ${scenarioEscaped};

test.describe('Business scenario', () => {
  test('scenario steps', async ({ page }, testInfo) => {
    await testInfo.attach('Business scenario (test data)', {
      body: SCENARIO_TEXT,
      contentType: 'text/plain',
    });

    await test.step('1. Load application', async () => {
      await page.goto('/');
      const screenshot = await page.screenshot();
      await testInfo.attach('Initial page', { body: screenshot, contentType: 'image/png' });
    });

${scenarioStepsCode}

    await test.step('Final: capture end state', async () => {
      const screenshot = await page.screenshot();
      await testInfo.attach('End state', { body: screenshot, contentType: 'image/png' });
    });
  });
});
`;
}
