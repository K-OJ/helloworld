import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { AnomalyItem, AiAnalysisResult } from './types';
import { AI_BATCH_SIZE } from './constants';

const AiAnalysisSchema = z.object({
  analyses: z.array(
    z.object({
      drug_id: z.string(),
      drug_name: z.string(),
      classification: z.enum(['data_error', 'market_trend', 'seasonal', 'policy_change', 'unknown']),
      confidence: z.number(),
      explanation: z.string(),
      recommended_action: z.string(),
    })
  ),
});

const SYSTEM_PROMPT = `당신은 제약 데이터 품질 분석 전문가입니다. 월간 의약품 처방량 데이터의 전월 대비 변동을 분석하여 이상 여부를 판단합니다.

반드시 지정된 JSON 스키마 형식으로만 응답하십시오.

분류 기준:
- data_error: 극단적인 변동(200% 초과), 단일 병원에서만 발생한 급변, 처방량이 음수 또는 비정상적인 반올림 패턴
- market_trend: 여러 병원에서 일관된 방향으로 30-80% 범위의 변동, 신약 출시나 경쟁약 등장
- seasonal: 계절성 질환 관련 약품(독감, 알레르기, 소화기계 등)의 계절적 패턴
- policy_change: 급여 기준 변경, 처방 가이드라인 개정과 일치하는 패턴
- unknown: 위 기준으로 판단하기 어려운 경우

중요 제약:
- 입력 데이터에 없는 약품명, 병원코드, 처방량 수치를 절대 생성하지 마십시오.
- 설명과 권장 조치는 반드시 한국어로 작성하십시오.
- confidence는 0.0~1.0 사이의 실수로 표현하십시오.`;

async function analyzeBatch(batch: AnomalyItem[]): Promise<AiAnalysisResult[]> {
  const input = batch.map((item) => ({
    drug_id: item.drug_id,
    drug_name: item.drug_name,
    hospital_code: item.hospital_code,
    baseline_volume: item.baseline_volume,
    target_volume: item.target_volume,
    change_pct: Math.round(item.change_pct * 10) / 10,
    severity: item.severity,
    rule: item.rule_triggered,
  }));

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-6'),
    schema: AiAnalysisSchema,
    system: SYSTEM_PROMPT,
    prompt: `다음 제약 처방량 이상 항목들을 분석하여 각각의 원인을 분류하고 권장 조치를 제시하십시오:\n\n${JSON.stringify(input, null, 2)}`,
    temperature: 0,
  });

  return object.analyses as AiAnalysisResult[];
}

export async function analyzeAnomalies(
  items: AnomalyItem[],
  onBatchComplete?: (results: AiAnalysisResult[]) => void
): Promise<AiAnalysisResult[]> {
  // Only analyze warning and danger items
  const toAnalyze = items.filter((i) => i.severity !== 'normal');
  const allResults: AiAnalysisResult[] = [];

  for (let i = 0; i < toAnalyze.length; i += AI_BATCH_SIZE) {
    const batch = toAnalyze.slice(i, i + AI_BATCH_SIZE);
    let lastErr: Error | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const results = await analyzeBatch(batch);
        allResults.push(...results);
        onBatchComplete?.(results);
        break;
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error(String(err));
        if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    if (lastErr && allResults.length === 0 && i === 0) {
      throw lastErr;
    }
  }

  return allResults;
}
