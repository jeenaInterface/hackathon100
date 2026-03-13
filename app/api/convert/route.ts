import { NextRequest, NextResponse } from 'next/server';
import { getScenario } from '@/lib/storage';
import { saveGeneratedTest } from '@/lib/storage';
import { convertScenarioViaMCP } from '@/lib/mcp-client';
import { scenarioToPlaywrightTemplate } from '@/lib/convert';
import path from 'path';
import fs from 'fs';

const TESTS_DIR = path.join(process.cwd(), 'tests', 'generated');

function ensureTestsDir() {
  const dir = path.join(process.cwd(), 'tests');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(TESTS_DIR)) fs.mkdirSync(TESTS_DIR, { recursive: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scenarioId } = body;
    if (!scenarioId) {
      return NextResponse.json({ error: 'scenarioId required' }, { status: 400 });
    }
    const scenario = getScenario(scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    let testCode: string;
    const mcpResult = await convertScenarioViaMCP(scenario.content);
    if (mcpResult.success && mcpResult.testCode) {
      testCode = mcpResult.testCode;
    } else {
      testCode = scenarioToPlaywrightTemplate(scenario.content);
    }

    ensureTestsDir();
    const fileName = `scenario-${scenarioId.slice(0, 8)}.spec.ts`;
    const filePath = path.join(TESTS_DIR, fileName);
    fs.writeFileSync(filePath, testCode, 'utf-8');

    const saved = saveGeneratedTest({
      scenarioId,
      testCode,
      fileName,
    });
    return NextResponse.json({
      testId: saved.testId,
      fileName,
      testCode: saved.testCode,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Conversion failed' },
      { status: 500 }
    );
  }
}
