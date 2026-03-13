import { NextResponse } from 'next/server';
import { listGeneratedTests } from '@/lib/storage';

export async function GET() {
  const tests = listGeneratedTests();
  return NextResponse.json(tests);
}
