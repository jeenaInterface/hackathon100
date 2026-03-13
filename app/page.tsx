'use client';

import { useState, useEffect, useCallback } from 'react';
import IntelliTestLogo from '@/components/IntelliTestLogo';
import { scenarioToManualTestCases, type ManualTestCaseRow } from '@/lib/manual-test-cases';

type Scenario = { id: string; name: string; content: string; createdAt: string };
type GeneratedTest = { scenarioId: string; testId: string; testCode: string; fileName: string; createdAt: string };
type RunResult = { runId: string; testId: string; success: boolean; reportPath?: string; error?: string; finishedAt: string };

function downloadManualTestCasesExcel(rows: ManualTestCaseRow[], scenarioName: string) {
  import('xlsx').then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(
      rows.map((r) => ({
        'Test Case ID': r.testCaseId,
        'Step No.': r.stepNo,
        'Test Step Description': r.testStepDescription,
        'Expected Result': r.expectedResult,
        'Application URL': r.applicationUrl || undefined,
        'Status': r.status,
      }))
    );
    const colWidths = [{ wch: 12 }, { wch: 8 }, { wch: 45 }, { wch: 45 }, { wch: 35 }, { wch: 14 }];
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, (scenarioName || 'Manual Test Cases').slice(0, 31));
    XLSX.writeFile(wb, `IntelliTest_Manual_Test_Cases_${Date.now()}.xlsx`);
  });
}

export default function Home() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [tests, setTests] = useState<GeneratedTest[]>([]);
  const [runs, setRuns] = useState<Record<string, RunResult>>({});
  const [applicationUrl, setApplicationUrl] = useState('');
  const [uploadText, setUploadText] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [manualTestCases, setManualTestCases] = useState<ManualTestCaseRow[] | null>(null);
  const [manualTestCasesExpanded, setManualTestCasesExpanded] = useState(true);
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

  const handleGenerateManualTestCases = () => {
    if (!uploadText.trim()) {
      setError('Enter a business scenario first.');
      return;
    }
    setError(null);
    const rows = scenarioToManualTestCases(uploadText.trim(), applicationUrl.trim());
    setManualTestCases(rows);
  };

  const handleConvert = async (scenarioId: string) => {
    setConvertingId(scenarioId);
    setError(null);
    try {
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId, baseUrl: applicationUrl.trim() || undefined }),
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="flex flex-col items-center text-center mb-12">
          <IntelliTestLogo className="mb-4" size={48} />
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">IntelliTest</h1>
          <p className="text-slate-600 max-w-xl">
            Enter application URL and business scenario to generate manual test cases or automated Playwright tests.
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 shadow-sm">
            {error}
          </div>
        )}

        <section className="card mb-8 border-0 shadow-lg shadow-slate-200/50">
          <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-indigo-500" /> Application URL
          </h2>
          <input
            type="url"
            placeholder="https://example.com"
            value={applicationUrl}
            onChange={(e) => setApplicationUrl(e.target.value)}
            className="mb-1"
          />
          <p className="text-sm text-slate-500">URL of the application under test.</p>
        </section>

        <section className="card mb-8 border-0 shadow-lg shadow-slate-200/50">
          <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-indigo-500" /> Business scenario
          </h2>
          <input
            type="text"
            placeholder="Scenario name (optional)"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            className="mb-3"
          />
          <textarea
            placeholder="Paste or type your business scenario (e.g. Gherkin, UAC, or plain steps)..."
            value={uploadText}
            onChange={(e) => setUploadText(e.target.value)}
            rows={6}
            className="font-mono text-sm"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={handleUpload} className="btn-primary" disabled={!uploadText.trim()}>
              Save scenario
            </button>
            <button
              onClick={handleGenerateManualTestCases}
              disabled={!uploadText.trim()}
              className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              Generate manual test cases
            </button>
          </div>
        </section>

        {manualTestCases && manualTestCases.length > 0 && (
          <section className="card mb-8 border-0 shadow-lg shadow-slate-200/50">
            <div
              className="flex flex-wrap items-center justify-between gap-4 cursor-pointer select-none"
              onClick={() => setManualTestCasesExpanded((e) => !e)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setManualTestCasesExpanded((x) => !x)}
              aria-expanded={manualTestCasesExpanded}
            >
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <span
                  className={`inline-block transition-transform ${manualTestCasesExpanded ? 'rotate-90' : ''}`}
                  aria-hidden
                >
                  ▶
                </span>
                <span className="w-1 h-5 rounded-full bg-emerald-500" /> Generated manual test cases
                <span className="text-slate-500 font-normal text-sm">({manualTestCases.length} steps)</span>
              </h2>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setManualTestCasesExpanded((e) => !e)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                >
                  {manualTestCasesExpanded ? 'Collapse' : 'Expand'}
                </button>
                <button
                  onClick={() => downloadManualTestCasesExcel(manualTestCases, uploadName || 'Manual Test Cases')}
                  className="rounded-lg bg-slate-700 px-4 py-2 font-medium text-white transition hover:bg-slate-800"
                >
                  Download as Excel
                </button>
              </div>
            </div>
            {manualTestCasesExpanded && (
              <div className="overflow-x-auto rounded-lg border border-slate-200 mt-4">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Test Case ID</th>
                      <th className="px-4 py-3 font-semibold">Step</th>
                      <th className="px-4 py-3 font-semibold">Test Step Description</th>
                      <th className="px-4 py-3 font-semibold">Expected Result</th>
                      <th className="px-4 py-3 font-semibold">Application URL</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {manualTestCases.map((row) => (
                      <tr key={row.testCaseId + row.stepNo} className="bg-white hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono text-slate-700">{row.testCaseId}</td>
                        <td className="px-4 py-3 text-slate-600">{row.stepNo}</td>
                        <td className="px-4 py-3 text-slate-800 max-w-xs">{row.testStepDescription}</td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs">{row.expectedResult}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate" title={row.applicationUrl}>{row.applicationUrl || '—'}</td>
                        <td className="px-4 py-3 text-slate-500">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        <section className="card mb-8 border-0 shadow-lg shadow-slate-200/50">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-indigo-500" /> Scenarios &amp; automated tests
          </h2>
          {scenarios.length === 0 ? (
            <p className="text-slate-500">No saved scenarios yet. Save one above to generate Playwright tests.</p>
          ) : (
            <ul className="space-y-4">
              {scenarios.map((s) => {
                const gen = testForScenario(s.id);
                const run = gen ? latestRun(gen.testId) : null;
                return (
                  <li key={s.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 hover:border-slate-300 transition">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-800 truncate">{s.name}</h3>
                        <pre className="mt-2 text-xs text-slate-500 whitespace-pre-wrap font-mono max-h-24 overflow-y-auto">
                          {s.content.slice(0, 300)}{s.content.length > 300 ? '...' : ''}
                        </pre>
                      </div>
                      <div className="flex flex-shrink-0 flex-wrap gap-2">
                        <button
                          onClick={() => handleConvert(s.id)}
                          disabled={!!convertingId}
                          className="btn-primary text-sm"
                        >
                          {convertingId === s.id ? 'Generating…' : gen ? 'Re-generate test case' : 'Generate test case'}
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
                      <p className={`mt-3 text-sm font-medium ${run.success ? 'text-emerald-600' : 'text-red-600'}`}>
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
          <section className="card mb-8 border-0 shadow-lg shadow-slate-200/50">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Copilot prompt (run test)</h2>
            <p className="text-slate-500 text-sm mb-2">
              Share this context with Copilot to run the test:
            </p>
            <pre className="rounded-lg bg-slate-100 p-4 text-sm font-mono overflow-x-auto text-slate-800">
              {copilotPrompt}
            </pre>
          </section>
        )}

        {selectedTestId && (() => {
          const t = tests.find((x) => x.testId === selectedTestId);
          if (!t) return null;
          return (
            <section className="card fixed inset-4 md:inset-10 z-20 overflow-hidden flex flex-col bg-white border-2 border-slate-200 shadow-2xl rounded-2xl">
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800">Generated Playwright test</h2>
                <button onClick={() => setSelectedTestId(null)} className="btn-secondary text-sm">
                  Close
                </button>
              </div>
              <pre className="flex-1 overflow-auto rounded-lg bg-slate-100 p-4 text-sm font-mono whitespace-pre text-slate-800">
                {t.testCode}
              </pre>
            </section>
          );
        })()}
      </div>
    </div>
  );
}
