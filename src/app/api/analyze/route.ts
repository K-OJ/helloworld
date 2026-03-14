import { NextRequest, NextResponse } from 'next/server';
import { analyzeAnomalies, generateMockAnalysis } from '@/lib/ai-analyzer';
import type { AnomalyItem } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const anomalies: AnomalyItem[] = body.anomalies;

  if (!Array.isArray(anomalies) || anomalies.length === 0) {
    return NextResponse.json({ error: '분석할 항목이 없습니다.' }, { status: 400 });
  }

  try {
    const results = await analyzeAnomalies(anomalies);
    return NextResponse.json({ results, is_mock: false });
  } catch (err) {
    console.error('[analyze] error:', err);
    const results = generateMockAnalysis(anomalies);
    return NextResponse.json({ results, is_mock: true });
  }
}
