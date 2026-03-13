import { NextRequest, NextResponse } from 'next/server';
import { saveScenario } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, content } = body;
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }
    const scenario = saveScenario({
      name: typeof name === 'string' && name.trim() ? name.trim() : 'Untitled scenario',
      content: content.trim(),
    });
    return NextResponse.json(scenario);
  } catch (e) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
