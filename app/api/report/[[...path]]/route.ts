import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const CWD = process.cwd();
const REPORT_BASE = path.join(CWD, 'playwright-report');
const TEST_RESULTS_BASE = path.join(CWD, 'test-results');

const INTELLITEST_LOGO_HTML =
  '<div style="display:flex;align-items:center;gap:12px;padding:12px 20px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;font-family:system-ui,sans-serif;font-weight:700;font-size:1.25rem;"><svg width="32" height="32" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="12" fill="rgba(255,255,255,0.2)"/><path d="M14 16h6v2h-4v4h4v2h-4v6h-2V16zm10 0h2v16h-2V16zm8 0h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h-2v-2h2v-2h-2v-2h2v-2h-2v-2h2v-2z" fill="white"/></svg><span>IntelliTest</span></div>';

const REPORT_FONT_STYLES = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style id="intellitest-report-styles">
    body, .report, [class*="report"], #root { font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif !important; }
    body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; letter-spacing: 0.01em; }
    a, span, div, p, h1, h2, h3, h4, td, th, li, button { font-family: inherit !important; }
    code, pre, .mono, [class*="code"], [class*="trace"] { font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace !important; }
  </style>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      try { if (document.title && !document.title.includes('IntelliTest')) document.title = 'IntelliTest – Test Report'; } catch(e) {}
    });
  </script>
`;

function injectIntelliTestLogo(html: string): string {
  if (html.includes('IntelliTest</span>')) return html;
  return html.replace(/<body(\s[^>]*)?>/, `<body$1>${INTELLITEST_LOGO_HTML}`);
}

function applyReportEnhancements(html: string): string {
  if (html.includes('intellitest-report-styles')) return html;
  html = html.replace(/<head(\s[^>]*)?>/, `<head$1>${REPORT_FONT_STYLES}`);
  html = injectIntelliTestLogo(html);
  return html;
}

function escapeForRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function rewriteReportAssetPaths(content: string): string {
  let out = content
    .replace(/href="\/data\//g, 'href="data/')
    .replace(/src="\/data\//g, 'src="data/')
    .replace(/href="\.\.\/test-results\//g, 'href="test-results/')
    .replace(/src="\.\.\/test-results\//g, 'src="test-results/')
    .replace(/href='\.\.\/test-results\//g, "href='test-results/")
    .replace(/src='\.\.\/test-results\//g, "src='test-results/")
    .replace(/"\/data\//g, '"data/')
    .replace(/"\.\.\/test-results\//g, '"test-results/')
    .replace(/\.\.\\test-results\\/g, 'test-results/')
    .replace(/\.\.\/test-results\//g, 'test-results/');

  const reportBaseBack = REPORT_BASE;
  const reportBaseFwd = REPORT_BASE.replace(/\\/g, '/');
  const testResultsFwd = TEST_RESULTS_BASE.replace(/\\/g, '/');

  [reportBaseBack, reportBaseFwd, reportBaseBack.replace(/\//g, '\\'), reportBaseFwd.replace(/\//g, '\\')].forEach((base) => {
    if (!base) return;
    const escaped = escapeForRegex(base);
    const re = new RegExp(escaped.replace(/\\\\/g, '[\\\\/]'), 'g');
    out = out.replace(re, '');
  });

  [TEST_RESULTS_BASE, testResultsFwd].forEach((base) => {
    const escaped = escapeForRegex(base);
    const re = new RegExp(escaped.replace(/\\\\/g, '[\\\\/]'), 'g');
    out = out.replace(re, 'test-results/');
  });

  out = out.replace(/file:\/\/\/[^"']*playwright-report[/\\]/gi, '');
  out = out.replace(/file:\/\/\/[^"']*test-results[/\\]/gi, 'test-results/');

  out = out.replace(/(["'])data\\/g, '$1data/').replace(/(["'])test-results\\/g, '$1test-results/');
  return out;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  let pathSegments = (await params).path ?? ['index.html'];
  pathSegments = pathSegments.map((p) => p.replace(/\\/g, '/'));
  const isTestResults = pathSegments[0] === 'test-results';
  const baseDir = isTestResults ? TEST_RESULTS_BASE : REPORT_BASE;
  const relativeSegments = isTestResults ? pathSegments.slice(1) : pathSegments;
  const safeJoin = path.join(baseDir, ...relativeSegments);
  const normalized = path.normalize(safeJoin);
  const baseNormalized = path.normalize(baseDir);
  if (!normalized.startsWith(baseNormalized)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }
  if (!fs.existsSync(normalized)) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }
  const stat = fs.statSync(normalized);
  if (stat.isDirectory()) {
    const index = path.join(normalized, 'index.html');
    if (fs.existsSync(index)) {
      let html = fs.readFileSync(index, 'utf-8');
      if (!html.includes('<base ')) {
        html = html.replace(/<head(\s[^>]*)?>/, '<head$1><base href="/api/report/">');
      }
      html = rewriteReportAssetPaths(html);
      html = applyReportEnhancements(html);
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    }
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }
  let content: Buffer | string = fs.readFileSync(normalized);
  const ext = path.extname(normalized);
  if (ext === '.html' && pathSegments[pathSegments.length - 1] === 'index.html') {
    let html = content.toString('utf-8');
    if (!html.includes('<base ')) {
      html = html.replace(/<head(\s[^>]*)?>/, '<head$1><base href="/api/report/">');
    }
    html = rewriteReportAssetPaths(html);
    html = applyReportEnhancements(html);
    content = html;
  } else if (!isTestResults && (ext === '.json' || ext === '.js')) {
    const str = content.toString('utf-8');
    content = typeof content === 'string' ? rewriteReportAssetPaths(str) : Buffer.from(rewriteReportAssetPaths(str), 'utf-8');
  }
  const types: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.webm': 'video/webm',
    '.mp4': 'video/mp4',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
  };
  const body = typeof content === 'string' ? content : new Uint8Array(content);
  return new NextResponse(body, {
    headers: { 'Content-Type': types[ext] || 'application/octet-stream' },
  });
}
