import path from 'path';
import fs from 'fs';
import { getGeneratedTest } from './storage';

const TESTS_DIR = path.join(process.cwd(), 'tests', 'generated');
const REPORT_DIR = path.join(process.cwd(), 'playwright-report');

export interface RunOptions {
  testId: string;
}

export interface RunOutput {
  success: boolean;
  reportPath?: string;
  error?: string;
}

export async function runPlaywrightTest(options: RunOptions): Promise<RunOutput> {
  const { testId } = options;
  const gen = getGeneratedTest(testId);
  if (!gen) {
    return { success: false, error: 'Generated test not found' };
  }
  const testFilePath = path.join(TESTS_DIR, gen.fileName);
  if (!fs.existsSync(testFilePath)) {
    return { success: false, error: 'Test file not found' };
  }

  try {
    const { spawn } = await import('child_process');
    const cwd = process.cwd();
    return await new Promise<RunOutput>((resolve) => {
      const pw = spawn(
        'npx',
        ['playwright', 'test', gen.fileName, '--config=playwright.config.ts'],
        {
          cwd,
          shell: true,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: { ...process.env, CI: '1' },
        }
      );
      let stderr = '';
      pw.stderr?.on('data', (d) => { stderr += d.toString(); });
      pw.on('close', (code) => {
        const indexHtml = path.join(REPORT_DIR, 'index.html');
        const hasReport = fs.existsSync(indexHtml);
        resolve({
          success: code === 0,
          reportPath: hasReport ? 'index.html' : undefined,
          error: code !== 0 ? (stderr || `Exit code ${code}`) : undefined,
        });
      });
      pw.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });
    });
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Run failed',
    };
  }
}
