import { NextRequest, NextResponse } from 'next/server';
import { saveRunResult } from '@/lib/storage';
import { runPlaywrightTest } from '@/lib/playwright-runner';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testId } = body;
    if (!testId) {
      return NextResponse.json({ error: 'testId required' }, { status: 400 });
    }
    const result = await runPlaywrightTest({ testId });
    saveRunResult({
      testId,
      success: result.success,
      reportPath: result.reportPath,
      error: result.error,
    });
    return NextResponse.json({
      success: result.success,
      reportPath: result.reportPath,
      error: result.error,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Run failed' },
      { status: 500 }
    );
  }
}
