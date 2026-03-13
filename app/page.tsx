'use client';

import { useState, useEffect, useCallback } from 'react';

type Scenario = { id: string; name: string; content: string; createdAt: string };
type GeneratedTest = { scenarioId: string; testId: string; testCode: string; fileName: string; createdAt: string };
type RunResult = { runId: string; testId: string; success: boolean; reportPath?: string; error?: string; finishedAt: string };

export default function Home() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [tests, setTests] = useState<GeneratedTest[]>([]);
  const [runs, setRuns] = useState<Record<string, RunResult>>({});
  const [uploadText, setUploadText] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [copilotPrompt, setCopilotPrompt] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [sRes, tRes] = await Promise.all([
        fetch('/api/scenarios'),
        fetch('/api/tests'),
      ]);
      if (sRes.ok) setScenarios(await sRes.json());
      if (tRes.ok) setTests(await tRes.json());
    } catch (e) {
      setError('Failed to load data');
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpload = async () => {
    if (!uploadText.trim()) return;
    setError(null);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: uploadName || 'Untitled scenario', content: uploadText.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
      setUploadText('');
      setUploadName('');
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    }
  };

  const handleConvert = async (scenarioId: string) => {
    setConvertingId(scenarioId);
    setError(null);
    try {
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Conversion failed');
      await loadData();
      setSelectedTestId(data.testId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversion failed');
    } finally {
      setConvertingId(null);
    }
  };

  const handleRun = async (testId: string) => {
    setRunningId(testId);
    setError(null);
    try {
      const res = await fetch('/api/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Run failed');
      setRuns((prev) => ({ ...prev, [testId]: data }));
      setCopilotPrompt(`Run the Playwright test for testId: ${testId}. Report path: ${data.reportPath || 'N/A'}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Run failed');
    } finally {
      setRunningId(null);
    }
  };

  const testForScenario = (scenarioId: string) => tests.find((t) => t.scenarioId === scenarioId);
  const latestRun = (testId: string) => runs[testId];

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-6xl mx-auto">
      <header className="mb-10">
        <h1 className="text-2xl font-bold text-white">Business Scenario → Playwright</h1>
        <p className="text-[var(--text-muted)] mt-1">
          Upload scenarios, convert with Copilot (MCP), run tests, view HTML reports
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-400">
          {error}
        </div>
      )}

      <section className="card mb-8">
        <h2 className="text-lg font-semibold mb-3">Upload business scenario</h2>
        <input
          type="text"
          placeholder="Scenario name (optional)"
          value={uploadName}
          onChange={(e) => setUploadName(e.target.value)}
          className="mb-3"
        />
        <textarea
          placeholder="Paste or type your business scenario (e.g. Gherkin or plain steps)..."
          value={uploadText}
          onChange={(e) => setUploadText(e.target.value)}
          rows={5}
          className="font-mono text-sm"
        />
        <div className="mt-3 flex justify-end">
          <button onClick={handleUpload} className="btn-primary" disabled={!uploadText.trim()}>
            Save scenario
          </button>
        </div>
      </section>

      <section className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">Scenarios & tests</h2>
        {scenarios.length === 0 ? (
          <p className="text-[var(--text-muted)]">No scenarios yet. Add one above.</p>
        ) : (
          <ul className="space-y-4">
            {scenarios.map((s) => {
              const gen = testForScenario(s.id);
              const run = gen ? latestRun(gen.testId) : null;
              return (
                <li key={s.id} className="rounded-lg border border-[var(--border)] bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium truncate">{s.name}</h3>
                      <pre className="mt-2 text-xs text-[var(--text-muted)] whitespace-pre-wrap font-mono max-h-24 overflow-y-auto">
                        {s.content.slice(0, 300)}{s.content.length > 300 ? '...' : ''}
                      </pre>
                    </div>
                    <div className="flex flex-shrink-0 flex-wrap gap-2">
                      <button
                        onClick={() => handleConvert(s.id)}
                        disabled={!!convertingId}
                        className="btn-secondary text-sm"
                      >
                        {convertingId === s.id ? 'Converting…' : gen ? 'Re-convert' : 'Convert to Playwright'}
                      </button>
                      {gen && (
                        <>
                          <button
                            onClick={() => setSelectedTestId(gen.testId)}
                            className="btn-secondary text-sm"
                          >
                            View test
                          </button>
                          <button
                            onClick={() => handleRun(gen.testId)}
                            disabled={!!runningId}
                            className="btn-primary text-sm"
                          >
                            {runningId === gen.testId ? 'Running…' : 'Run test'}
                          </button>
                          {run?.reportPath && (
                            <a
                              href={`/api/report/${run.reportPath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-secondary text-sm inline-block"
                            >
                              HTML report
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {run && (
                    <p className={`mt-2 text-sm ${run.success ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                      Last run: {run.success ? 'Passed' : run.error || 'Failed'}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {copilotPrompt && (
        <section className="card mb-8">
          <h2 className="text-lg font-semibold mb-2">Copilot prompt (run test)</h2>
          <p className="text-[var(--text-muted)] text-sm mb-2">
            You can ask Copilot: &quot;Run the Playwright test&quot; and share this context:
          </p>
          <pre className="rounded-lg bg-black/40 p-3 text-sm font-mono overflow-x-auto">
            {copilotPrompt}
          </pre>
        </section>
      )}

      {selectedTestId && (() => {
        const t = tests.find((x) => x.testId === selectedTestId);
        if (!t) return null;
        return (
          <section className="card fixed inset-4 md:inset-10 z-10 overflow-hidden flex flex-col bg-[var(--bg)]">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Generated Playwright test</h2>
              <button onClick={() => setSelectedTestId(null)} className="btn-secondary text-sm">
                Close
              </button>
            </div>
            <pre className="flex-1 overflow-auto rounded-lg bg-black/40 p-4 text-sm font-mono whitespace-pre">
              {t.testCode}
            </pre>
          </section>
        );
      })()}
    </div>
  );
}
