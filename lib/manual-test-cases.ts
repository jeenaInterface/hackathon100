export interface ManualTestCaseRow {
  testCaseId: string;
  stepNo: number;
  testStepDescription: string;
  expectedResult: string;
  applicationUrl: string;
  status: string;
}

/**
 * Parses business scenario text into manual test case rows.
 * Each non-empty line becomes a step; UAC/criteria lines get an expected result.
 */
export function scenarioToManualTestCases(
  scenarioContent: string,
  applicationUrl: string
): ManualTestCaseRow[] {
  const url = applicationUrl?.trim() || 'Not specified';
  const lines = scenarioContent
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [
      {
        testCaseId: 'TC-001',
        stepNo: 1,
        testStepDescription: 'Review scenario and execute test',
        expectedResult: 'Scenario executed as per requirements',
        applicationUrl: url,
        status: 'Not executed',
      },
    ];
  }

  return lines.map((line, index) => {
    const isUac = /^UAC[-‑–—]?\d+/i.test(line) || /^(given|when|then|and)\s+/i.test(line);
    const expectedResult = isUac ? line : `Step completed successfully: ${line.slice(0, 60)}${line.length > 60 ? '...' : ''}`;
    return {
      testCaseId: `TC-${String(index + 1).padStart(3, '0')}`,
      stepNo: index + 1,
      testStepDescription: line,
      expectedResult,
      applicationUrl: index === 0 ? url : '',
      status: 'Not executed',
    };
  });
}
