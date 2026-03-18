import { NextRequest, NextResponse } from 'next/server';
import { analyzeAnomalies, generateMockAnalysis } from '@/lib/ai-analyzer';
import { getErrorMessage } from '@/lib/constants';
import type { AnomalyItem } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    console.error('[analyze] 요청 파싱 실패: JSON 형식 오류');
    return NextResponse.json({ error: '올바른 JSON 형식이 아닙니다.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    console.error('[analyze] 입력 검증 실패: 요청 바디 없음');
    return NextResponse.json({ error: '요청 바디가 없습니다.' }, { status: 400 });
  }

  const { anomalies } = body as { anomalies?: unknown };

  if (!Array.isArray(anomalies)) {
    console.error('[analyze] 입력 검증 실패: anomalies가 배열이 아님', typeof anomalies);
    return NextResponse.json({ error: 'anomalies 필드가 배열이어야 합니다.' }, { status: 400 });
  }

  if (anomalies.length === 0) {
    console.error('[analyze] 입력 검증 실패: 빈 배열');
    return NextResponse.json({ error: '분석할 항목이 없습니다.' }, { status: 400 });
  }

  // 각 항목 필수 필드 검증
  for (let i = 0; i < anomalies.length; i++) {
    const item = anomalies[i] as Partial<AnomalyItem>;
    if (item.baseline_volume === undefined || item.target_volume === undefined) {
      console.error(`[analyze] 입력 검증 실패: anomalies[${i}] 필수 필드 누락`, item);
      return NextResponse.json(
        { error: `anomalies[${i}]에 필수 필드(baseline_volume, target_volume)가 없습니다.` },
        { status: 400 }
      );
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[analyze] ANTHROPIC_API_KEY 미설정 — Mock 결과 반환');
    const results = generateMockAnalysis(anomalies as AnomalyItem[]);
    return NextResponse.json({
      results,
      is_mock: true,
      error_detail: 'API 키가 설정되지 않았습니다. Vercel 대시보드 → Settings → Environment Variables에 ANTHROPIC_API_KEY를 추가하세요.',
    });
  }

  try {
    console.log(`[analyze] Claude AI 분석 시작: ${anomalies.length}건`);
    const results = await analyzeAnomalies(anomalies as AnomalyItem[]);
    console.log(`[analyze] 완료: ${results.length}건 분류`);
    return NextResponse.json({ results, is_mock: false });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[analyze] Claude API 호출 실패:', errorMsg);
    const results = generateMockAnalysis(anomalies as AnomalyItem[]);
    return NextResponse.json({ results, is_mock: true, error_detail: getErrorMessage('analysisFailed') });
  }
}
