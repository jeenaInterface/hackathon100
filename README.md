# Business Scenario → Playwright Test Generator

Convert business scenarios to Playwright tests, run them via Copilot (MCP), and view HTML reports.

## Features

1. **Application UI** – Web interface for entering url, uploading scenarios then click buttonG(enerate test case) click 
2. **Upload business scenarios** – File upload or paste text (e.g. Gherkin, plain English)
3. **Copilot integration (MCP)** – Uses your installed MCP server to convert scenarios and run tests
4. **Scenario → Playwright** – Converts business scenarios to Playwright test code
5. **Run tests via Copilot** – Trigger test execution through the app or Copilot prompt
6. **HTML report** – Playwright HTML reporter; view results in the UI

## Project structure
k
```
hackaton/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Main UI (upload, scenarios, run, report)
│   ├── layout.tsx
│   └── api/                # API routes
│       ├── upload/         # Upload scenario
│       ├── convert/        # Convert scenario → Playwright (MCP/Copilot)
│       ├── run-test/       # Run Playwright test
│       └── report/         # Serve HTML report
├── lib/
│   ├── mcp-client.ts       # MCP client for Copilot integration
│   ├── playwright-runner.ts
│   └── storage.ts         # In-memory/store for scenarios & generated tests
├── tests/                  # Generated Playwright tests (output)
├── playwright.config.ts
├── package.json
└── README.md
```

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure MCP (optional)**  
   Set `MCP_SERVER_COMMAND` or use Cursor’s MCP server. See `.env.example`.

3. **Run the app**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## Usage

1. Upload or paste a business scenario (e.g. “User logs in, navigates to dashboard, clicks Settings”).
2. Click **Convert to Playwright** – conversion uses the MCP server (Copilot) if configured.
3. Review the generated test and click **Run test** (or ask Copilot to run it).
4. Open the **HTML report** from the UI when the run finishes.

## Environment

- `MCP_SERVER_COMMAND` – Command to start your MCP server (e.g. `npx -y @modelcontextprotocol/server-playwright` or custom).
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` – Used for fallback conversion if no MCP tool is available.

## Tech stack

- **Next.js 14** (App Router), **React**, **Tailwind CSS**
- **@modelcontextprotocol/sdk** (v1) or **@modelcontextprotocol/client** for MCP
- **Playwright** for test execution and HTML reporter
