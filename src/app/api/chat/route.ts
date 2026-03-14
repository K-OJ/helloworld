import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { messages, context } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
  }

  try {
    const { text } = await generateText({
      model: anthropic('claude-sonnet-4-6'),
      system: `당신은 제약 데이터 품질 분석 전문가 AI 어시스턴트입니다. 사용자가 월간 처방 데이터 검수 결과에 대해 질문합니다. 아래 검수 데이터를 바탕으로 한국어로 간결하고 실용적으로 답변하십시오. 데이터에 없는 내용은 추측하지 마십시오.\n\n검수 결과 데이터:\n${context}`,
      messages,
      temperature: 0.3,
    });

    return NextResponse.json({ reply: text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[chat] error:', msg);
    return NextResponse.json({ error: `AI 응답 실패: ${msg}` }, { status: 500 });
  }
}
