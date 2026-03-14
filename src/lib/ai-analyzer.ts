import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { jsonSchema } from 'ai';
import type { AnomalyItem, AiAnalysisResult } from './types';
import { AI_BATCH_SIZE } from './constants';

const AiAnalysisSchema = jsonSchema({
  type: 'object',
  properties: {
    analyses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          drug_id: { type: 'string' },
          drug_name: { type: 'string' },
          classification: {
            type: 'string',
            enum: ['data_error', 'market_trend', 'seasonal', 'policy_change', 'unknown'],
          },
          confidence: { type: 'number' },
          explanation: { type: 'string' },
          recommended_action: { type: 'string' },
          action_label: { type: 'string' },
          action_url: { type: 'string' },
        },
        required: ['drug_id', 'drug_name', 'classification', 'confidence', 'explanation', 'recommended_action', 'action_label', 'action_url'],
      },
    },
  },
  required: ['analyses'],
});

const SYSTEM_PROMPT = `당신은 유비케어의 10년 차 전문 제약 데이터 QA 분석관입니다. 월간 의약품 처방량 데이터의 전월 대비 변동을 분석하여 이상 여부를 판단합니다.

현재 시점은 2026년 3월 환절기입니다. 감기약, 항히스타민제, 호흡기 관련 약품의 계절적 변동을 고려하십시오.

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
- confidence는 0.0~1.0 사이의 실수로 표현하십시오.

action_url 및 action_label 규칙:
- 원인 분석 후, 실무자가 즉시 사실을 확인할 수 있는 공공기관 링크를 제공하십시오.
- policy_change: action_url="https://www.hira.or.kr/main.do", action_label="심평원 고시 확인"
- market_trend: action_url="https://nedrug.mfds.go.kr/index", action_label="경쟁 약품 검색"
- data_error: action_url="https://www.hira.or.kr/ra/rcvabam/rcvInsureAmtSrch.do", action_label="청구 데이터 조회"
- seasonal: action_url="https://www.kdca.go.kr/index.es?sid=a2", action_label="질병관리청 통계 확인"
- unknown: action_url="https://www.hira.or.kr/main.do", action_label="심평원 조회"`;

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
    prompt: `다음 제약 처방량 이상 항목들을 분석하여 각각의 원인을 분류하고 권장 조치 및 확인 링크를 제시하십시오:\n\n${JSON.stringify(input, null, 2)}`,
    temperature: 0,
  });

  const result = object as { analyses: AiAnalysisResult[] };
  return result.analyses;
}

const MOCK_EXPLANATIONS: Record<string, { explanation: string; recommended_action: string; action_label: string; action_url: string }> = {
  data_error: {
    explanation: '처방량이 극단적으로 변동하여 데이터 입력 오류 가능성이 높습니다. 단일 기관에서만 발생한 급격한 변화로 시스템 오류나 중복 입력이 의심됩니다.',
    recommended_action: '원본 처방 데이터와 대조 검증 후 오류 여부를 확인하십시오.',
    action_label: '청구 데이터 조회',
    action_url: 'https://www.hira.or.kr/ra/rcvabam/rcvInsureAmtSrch.do',
  },
  market_trend: {
    explanation: '여러 기관에서 유사한 방향의 처방량 변화가 관찰됩니다. 경쟁 약품 출시 또는 신규 처방 가이드라인 적용에 따른 시장 변화로 추정됩니다.',
    recommended_action: '동일 성분 경쟁 약품의 시장 점유율 변화를 확인하십시오.',
    action_label: '경쟁 약품 검색',
    action_url: 'https://nedrug.mfds.go.kr/index',
  },
  seasonal: {
    explanation: '계절적 요인에 의한 처방량 변동입니다. 해당 약품의 적응증이 특정 계절에 집중되는 패턴을 보입니다.',
    recommended_action: '전년도 동기간 데이터와 비교하여 계절성 패턴을 확인하십시오.',
    action_label: '질병관리청 통계 확인',
    action_url: 'https://www.kdca.go.kr/index.es?sid=a2',
  },
  policy_change: {
    explanation: '급여 기준 변경 또는 처방 가이드라인 개정과 일치하는 변동 패턴입니다. 보험 적용 범위 조정이 처방량에 직접적인 영향을 준 것으로 보입니다.',
    recommended_action: '해당 기간의 급여 고시 변경 내역을 확인하십시오.',
    action_label: '심평원 고시 확인',
    action_url: 'https://www.hira.or.kr/main.do',
  },
  unknown: {
    explanation: '현재 데이터만으로는 명확한 원인을 판단하기 어렵습니다. 추가적인 맥락 정보가 필요합니다.',
    recommended_action: '담당 영업팀 및 의약정보팀에 현장 확인을 요청하십시오.',
    action_label: '심평원 조회',
    action_url: 'https://www.hira.or.kr/main.do',
  },
};

const CLASSIFICATIONS = ['data_error', 'market_trend', 'seasonal', 'policy_change', 'unknown'] as const;

export function generateMockAnalysis(items: AnomalyItem[]): AiAnalysisResult[] {
  const toAnalyze = items.filter((i) => i.severity !== 'normal');
  return toAnalyze.map((item, idx) => {
    let classification: typeof CLASSIFICATIONS[number];
    const absPct = Math.abs(item.change_pct);

    if (absPct > 200 || item.baseline_volume === 0) {
      classification = 'data_error';
    } else if (absPct > 80) {
      classification = idx % 3 === 0 ? 'policy_change' : 'market_trend';
    } else if (idx % 5 === 0) {
      classification = 'seasonal';
    } else if (idx % 4 === 0) {
      classification = 'policy_change';
    } else {
      classification = CLASSIFICATIONS[idx % CLASSIFICATIONS.length];
    }

    const { explanation, recommended_action, action_label, action_url } = MOCK_EXPLANATIONS[classification];
    return {
      drug_id: item.drug_id,
      drug_name: item.drug_name,
      classification,
      confidence: Math.round((0.55 + (idx % 5) * 0.08) * 100) / 100,
      explanation,
      recommended_action,
      action_label,
      action_url,
    };
  });
}

export async function analyzeAnomalies(
  items: AnomalyItem[],
  onBatchComplete?: (results: AiAnalysisResult[]) => void
): Promise<AiAnalysisResult[]> {
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
