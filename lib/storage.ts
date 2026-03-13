import path from 'path';
import fs from 'fs';

export interface Scenario {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

export interface GeneratedTest {
  scenarioId: string;
  testId: string;
  testCode: string;
  fileName: string;
  createdAt: string;
}

export interface RunResult {
  runId: string;
  testId: string;
  success: boolean;
  reportPath?: string;
  error?: string;
  finishedAt: string;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const STORAGE_FILE = path.join(DATA_DIR, 'storage.json');

interface StoredData {
  scenarios: Record<string, Scenario>;
  generatedTests: Record<string, GeneratedTest>;
  runResults: Record<string, RunResult>;
}

function loadFromFile(): StoredData {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
      const data = JSON.parse(raw) as StoredData;
      return {
        scenarios: data.scenarios ?? {},
        generatedTests: data.generatedTests ?? {},
        runResults: data.runResults ?? {},
      };
    }
  } catch {
    // ignore parse errors, start fresh
  }
  return { scenarios: {}, generatedTests: {}, runResults: {} };
}

function saveToFile(data: StoredData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 0), 'utf-8');
  } catch (e) {
    console.error('Failed to persist storage:', e);
  }
}

let stored = loadFromFile();
const scenarios = new Map<string, Scenario>(Object.entries(stored.scenarios));
const generatedTests = new Map<string, GeneratedTest>(Object.entries(stored.generatedTests));
const runResults = new Map<string, RunResult>(Object.entries(stored.runResults));

function persist(): void {
  saveToFile({
    scenarios: Object.fromEntries(scenarios),
    generatedTests: Object.fromEntries(generatedTests),
    runResults: Object.fromEntries(runResults),
  });
}

export function saveScenario(scenario: Omit<Scenario, 'id' | 'createdAt'>): Scenario {
  const id = crypto.randomUUID();
  const created: Scenario = {
    ...scenario,
    id,
    createdAt: new Date().toISOString(),
  };
  scenarios.set(id, created);
  persist();
  return created;
}

export function getScenario(id: string): Scenario | undefined {
  return scenarios.get(id);
}

export function listScenarios(): Scenario[] {
  return Array.from(scenarios.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function saveGeneratedTest(test: Omit<GeneratedTest, 'testId' | 'createdAt'>): GeneratedTest {
  const testId = crypto.randomUUID();
  const created: GeneratedTest = {
    ...test,
    testId,
    createdAt: new Date().toISOString(),
  };
  generatedTests.set(testId, created);
  persist();
  return created;
}

export function getGeneratedTest(testId: string): GeneratedTest | undefined {
  return generatedTests.get(testId);
}

export function getGeneratedTestByScenarioId(scenarioId: string): GeneratedTest | undefined {
  return Array.from(generatedTests.values()).find((t) => t.scenarioId === scenarioId);
}

export function listGeneratedTests(): GeneratedTest[] {
  return Array.from(generatedTests.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function saveRunResult(result: Omit<RunResult, 'runId' | 'finishedAt'>): RunResult {
  const runId = crypto.randomUUID();
  const created: RunResult = {
    ...result,
    runId,
    finishedAt: new Date().toISOString(),
  };
  runResults.set(runId, created);
  persist();
  return created;
}

export function getRunResult(runId: string): RunResult | undefined {
  return runResults.get(runId);
}

export function getLatestRunForTest(testId: string): RunResult | undefined {
  const forTest = Array.from(runResults.values())
    .filter((r) => r.testId === testId)
    .sort((a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime());
  return forTest[0];
}
