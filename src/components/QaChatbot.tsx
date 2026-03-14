'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AnomalyItem, AiAnalysisResult } from '@/lib/types';
import { AI_CLASSIFICATION_LABELS } from '@/lib/constants';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  anomaliesData: {
    items: AnomalyItem[];
    aiResults: Map<string, AiAnalysisResult>;
  };
}

const SUGGESTED_QUESTIONS = [
  '가장 주의해야 할 항목이 무엇인가요?',
  '데이터 오류로 의심되는 항목을 알려주세요.',
  '계절적 요인으로 분류된 항목의 배경을 설명해주세요.',
  '이번 달 전반적인 처방 트렌드를 요약해주세요.',
];

export function QaChatbot({ anomaliesData }: Props) {
  const { items, aiResults } = anomaliesData;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const anomaliesContext = useMemo(() => {
    const nonNormal = items.filter((i) => i.severity !== 'normal').slice(0, 25);
    return nonNormal.map((i) => {
      const ai = aiResults.get(`${i.drug_id}__${i.hospital_code}`);
      return {
        약품명: i.drug_name || i.drug_id,
        병원코드: i.hospital_code,
        변동률: `${i.change_pct > 0 ? '+' : ''}${i.change_pct.toFixed(1)}%`,
        심각도: i.severity === 'danger' ? '위험' : '경고',
        AI분류: ai ? AI_CLASSIFICATION_LABELS[ai.classification] : '미분석',
        AI설명: ai?.explanation ?? '',
      };
    });
  }, [items, aiResults]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isLoading]);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setStreamingText('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          anomaliesContext,
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'AI 응답 실패');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setStreamingText(accumulated);
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: accumulated }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류';
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠ 오류: ${msg}` }]);
    } finally {
      setIsLoading(false);
      setStreamingText('');
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  const showMessages = messages.length > 0 || isLoading;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
          <span className="text-lg">💬</span> 분석 결과에 대해 무엇이든 물어보세요
        </CardTitle>
        <p className="text-sm text-slate-500">현재 검수 결과 데이터를 바탕으로 AI가 답변합니다.</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* 추천 질문 */}
        {!showMessages && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-700 hover:bg-blue-100 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* 메시지 리스트 */}
        {showMessages && (
          <div className="h-64 overflow-y-auto rounded-lg bg-slate-50 p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {/* 스트리밍 중인 텍스트 */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm whitespace-pre-wrap leading-relaxed">
                  {streamingText || (
                    <span className="text-slate-400 animate-pulse">입력 중...</span>
                  )}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* 입력창 */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? '입력 중...' : '검수 결과에 대해 질문하세요...'}
            disabled={isLoading}
            className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-200 disabled:bg-slate-50 disabled:text-slate-400"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} size="sm" className="gap-1.5">
            <Send className="h-4 w-4" />
            전송
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
