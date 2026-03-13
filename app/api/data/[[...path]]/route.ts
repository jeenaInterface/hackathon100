import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const REPORT_DATA_BASE = path.join(process.cwd(), 'playwright-report', 'data');

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const pathSegments = (await params).path ?? [];
  const safeJoin = path.join(REPORT_DATA_BASE, ...pathSegments);
  const normalized = path.normalize(safeJoin);
  const baseNormalized = path.normalize(REPORT_DATA_BASE);
  if (!normalized.startsWith(baseNormalized)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }
  if (!fs.existsSync(normalized)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const stat = fs.statSync(normalized);
  if (stat.isDirectory()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const content = fs.readFileSync(normalized);
  const ext = path.extname(normalized);
  const types: Record<string, string> = {
    '.webm': 'video/webm',
    '.mp4': 'video/mp4',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.json': 'application/json',
  };
  return new NextResponse(content, {
    headers: { 'Content-Type': types[ext] || 'application/octet-stream' },
  });
}
