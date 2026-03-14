import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { jsonSchema } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const STANDARD_KEYS = ['hospital_code', 'date', 'drug_id', 'drug_name', 'prescription_volume'] as const;

const MappingSchema = jsonSchema({
  type: 'object',
  properties: {
    mapping: {
      type: 'object',
      description: '원본 컬럼명 → 표준 키 매핑. 매핑 불가한 컬럼은 포함하지 않음',
      additionalProperties: {
        type: 'string',
        enum: ['hospital_code', 'date', 'drug_id', 'drug_name', 'prescription_volume'],
      },
    },
  },
  required: ['mapping'],
});

/**
 * POST /api/map-columns
 *
 * heuristicMap으로 매핑되지 않은 컬럼명을 Claude AI가 표준 키에 매핑합니다.
 *
 * Body: { unmappedColumns: string[], sampleData: Record<string, unknown>[] }
 */
export async function POST(req: NextRequest) {
  const { unmappedColumns, sampleData } = await req.json();

  if (!Array.isArray(unmappedColumns) || unmappedColumns.length === 0) {
    return NextResponse.json({ mapping: {} });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ mapping: {} });
  }

  try {
    const sampleStr = JSON.stringify(sampleData?.slice(0, 3) ?? [], null, 2);

    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-6'),
      schema: MappingSchema,
      system: `당신은 제약 데이터 컬럼 매핑 전문가입니다. 사용자가 업로드한 파일의 컬럼명을 아래 시스템 표준 키 중 하나에 매핑하십시오.

시스템 표준 키:
- hospital_code: 병원 또는 요양기관 식별자
- date: 기준 년월 (YYYYMM 형식 등)
- drug_id: 약품 코드 또는 식별자
- drug_name: 약품명
- prescription_volume: 처방량, 판매량, 수량 등 수치 필드

규칙:
- 매핑이 불확실하면 해당 컬럼을 결과에서 제외하십시오 (null 반환 금지).
- 하나의 표준 키에 여러 컬럼을 중복 매핑하지 마십시오.
- 반드시 JSON 스키마 형식으로만 응답하십시오.`,
      prompt: `다음 컬럼명들을 표준 키에 매핑하십시오.\n\n미매핑 컬럼: ${JSON.stringify(unmappedColumns)}\n\n샘플 데이터:\n${sampleStr}`,
      temperature: 0,
    });

    const result = object as { mapping: Record<string, string> };

    // 유효한 표준 키만 필터링
    const filtered: Record<string, string> = {};
    for (const [col, key] of Object.entries(result.mapping)) {
      if ((STANDARD_KEYS as readonly string[]).includes(key)) {
        filtered[col] = key;
      }
    }

    return NextResponse.json({ mapping: filtered });
  } catch (err) {
    console.error('[map-columns] error:', err);
    return NextResponse.json({ mapping: {} });
  }
}
