import { NextRequest, NextResponse } from 'next/server';
import { analyzeAnomalies } from '@/lib/ai-analyzer';
import type { AnomalyItem } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const anomalies: AnomalyItem[] = body.anomalies;

    if (!Array.isArray(anomalies) || anomalies.length === 0) {
      return NextResponse.json({ error: '분석할 항목이 없습니다.' }, { status: 400 });
    }

    const results = await analyzeAnomalies(anomalies);
    return NextResponse.json({ results });
  } catch (err) {
    console.error('[analyze] error:', err);
    return NextResponse.json(
      { error: `AI 분석 중 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}` },
      { status: 500 }
    );
  }
}
