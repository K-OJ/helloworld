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

  if (!process.env.ANTHROPIC_API_KEY) {
    const results = generateMockAnalysis(anomalies);
    return NextResponse.json({
      results,
      is_mock: true,
      error_detail: 'API 키가 설정되지 않았습니다. Vercel 대시보드 → Settings → Environment Variables에 ANTHROPIC_API_KEY를 추가하세요.',
    });
  }

  try {
    const results = await analyzeAnomalies(anomalies);
    return NextResponse.json({ results, is_mock: false });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[analyze] error:', errorMsg);
    const results = generateMockAnalysis(anomalies);
    return NextResponse.json({ results, is_mock: true, error_detail: errorMsg });
  }
}
