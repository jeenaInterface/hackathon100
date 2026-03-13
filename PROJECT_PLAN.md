# Project Plan: Business Scenario → Playwright with Copilot (MCP)

## What Was Built

### 1. Application UI ✅
- **Next.js 14** app with a single main page
- **Tailwind CSS** for layout and dark theme
- **Sections:**
  - **Upload** – Text area + optional name to add business scenarios (paste or type)
  - **Scenarios & tests** – List of saved scenarios with actions: Convert to Playwright, View test script, Run test, Open HTML report
  - **Copilot prompt** – Suggested prompt text so the user (or Copilot) can run a test by `testId`

### 2. Input to Upload Business Scenarios ✅
- **API:** `POST /api/upload` with JSON `{ name?, content }`
- **Storage:** In-memory store in `lib/storage.ts` (scenarios, generated tests, run results)
- **UI:** Form with scenario name and content; “Save scenario” persists and refreshes the list

### 3. Integrate Copilot via MCP ✅
- **`lib/mcp-client.ts`** – Connects to an MCP server using `MCP_SERVER_COMMAND` (e.g. `npx -y some-mcp-server`)
- **Behavior:** Lists tools; looks for a tool whose name contains “convert”, “playwright”, or “scenario” and calls it with `{ scenario: scenarioContent }`
- **Config:** Set `MCP_SERVER_COMMAND` in `.env` (see `.env.example`)
- **Fallback:** If MCP is not set or has no matching tool, conversion uses a simple template in `lib/convert.ts` (scenario → Playwright test skeleton)

### 4. Conversion: Business Scenario → Playwright Test ✅
- **API:** `POST /api/convert` with `{ scenarioId }`
- **Flow:** Load scenario → call MCP tool (if available) → else use `scenarioToPlaywrightTemplate()` → write test to `tests/generated/scenario-<id>.spec.ts` → save metadata
- **Output:** Generated test is shown in the UI (“View test”) and can be re-converted

### 5. Run Test (Including via Copilot Prompt) ✅
- **API:** `POST /api/run-test` with `{ testId }`
- **Runner:** `lib/playwright-runner.ts` runs `npx playwright test <fileName> --config=playwright.config.ts` from project root
- **Report:** Playwright HTML reporter writes to `playwright-report/`; API returns `reportPath: 'index.html'`
- **Copilot:** User can run the test from the UI (“Run test”) or use the suggested Copilot prompt (e.g. “Run the Playwright test for testId: …”) so Copilot can trigger the same API or steps

### 6. HTML Report ✅
- **Config:** `playwright.config.ts` uses `reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }]]`
- **Serving:** `GET /api/report/[[...path]]` serves files under `playwright-report/` (e.g. `/api/report/index.html`, `/api/report/assets/…`)
- **Base tag:** Injected so relative assets load correctly when opened at `/api/report/`
- **UI:** “HTML report” link appears after a run and opens the report in a new tab

---

## What You Need to Do

1. **Install dependencies**
   ```bash
   cd c:\AUTOMATION\hackaton
   npm install
   ```

2. **Optional: MCP server**
   - Install or use an MCP server that exposes a tool to convert “business scenario” text → Playwright code (or a generic LLM tool you call with a prompt).
   - In `.env` set:
     ```env
     MCP_SERVER_COMMAND=npx -y your-mcp-server
     ```
   - If you don’t set this, the app still works and uses the built-in template conversion.

3. **Run the app**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000, add a scenario, convert, run, and open the report.

4. **Run tests (Playwright)**
   - Ensure generated tests exist under `tests/generated/` (create them via the UI “Convert to Playwright”).
   - From the UI use “Run test”, or from the CLI:
     ```bash
     npx playwright test --config=playwright.config.ts
     ```

5. **Persistence (optional)**
   - Current storage is in-memory; data is lost on restart.
   - To persist: replace `lib/storage.ts` with a DB (e.g. SQLite, JSON file, or cloud DB) and keep the same interfaces.

6. **Cursor / Copilot**
   - Use the “Copilot prompt” section in the UI to copy the run context (e.g. `testId`, report path) and ask Copilot to “run the Playwright test” or “open the HTML report” so the assistant can call the same APIs or commands.

---

## File Summary

| Path | Purpose |
|------|--------|
| `app/page.tsx` | Main UI: upload, list, convert, run, report link, Copilot prompt |
| `app/api/upload/route.ts` | Save scenario |
| `app/api/scenarios/route.ts` | List scenarios |
| `app/api/convert/route.ts` | Convert scenario → Playwright (MCP or template), write file |
| `app/api/tests/route.ts` | List generated tests |
| `app/api/run-test/route.ts` | Run Playwright test, return report path |
| `app/api/report/[[...path]]/route.ts` | Serve HTML report and assets |
| `lib/storage.ts` | In-memory store |
| `lib/mcp-client.ts` | MCP client for conversion tool |
| `lib/convert.ts` | Fallback template conversion |
| `lib/playwright-runner.ts` | Spawn Playwright CLI, return result and report path |
| `playwright.config.ts` | Test dir `tests/generated`, HTML reporter |
