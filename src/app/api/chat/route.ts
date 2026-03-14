import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { messages, anomaliesContext } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'API 키가 설정되지 않았습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: `당신은 유비케어 제약 데이터 품질 검수(QA) 어시스턴트입니다. 사용자가 질문하면 다음 [검수 결과 데이터]를 바탕으로 전문적이고 친절하게 답변하세요. 데이터에 없는 내용은 추측하지 마십시오.\n\n검수 결과 데이터:\n${JSON.stringify(anomaliesContext)}`,
    messages,
    temperature: 0.3,
  });

  return result.toTextStreamResponse();
}
