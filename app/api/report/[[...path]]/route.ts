import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const CWD = process.cwd();
const REPORT_BASE = path.join(CWD, 'playwright-report');
const TEST_RESULTS_BASE = path.join(CWD, 'test-results');

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const pathSegments = (await params).path ?? ['index.html'];
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
    content = html;
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
