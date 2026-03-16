// @ts-nocheck
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { AnomalyItem, AiAnalysisResult } from '@/lib/types';
import { AI_CLASSIFICATION_LABELS } from '@/lib/constants';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  items: AnomalyItem[];
  aiResults: Map<string, AiAnalysisResult>;
}

const SUGGESTED_QUESTIONS = [
  '가장 주의해야 할 항목이 무엇인가요?',
  '데이터 오류로 의심되는 항목을 알려주세요.',
  '계절적 요인으로 분류된 항목의 배경을 설명해주세요.',
  '이번 달 전반적인 처방 트렌드를 요약해주세요.',
];

export function AiChatPanel({ items, aiResults }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const context = useMemo(() => {
    const nonNormal = items.filter((i) => i.severity !== 'normal').slice(0, 25);
    return JSON.stringify(
      nonNormal.map((i) => {
        const ai = aiResults.get(`${i.drug_id}__${i.hospital_code}`);
        return {
          약품명: i.drug_name || i.drug_id,
          병원코드: i.hospital_code,
          변동률: `${i.change_pct > 0 ? '+' : ''}${i.change_pct.toFixed(1)}%`,
          심각도: i.severity === 'danger' ? '위험' : '경고',
          AI분류: ai ? AI_CLASSIFICATION_LABELS[ai.classification] : '미분석',
          AI설명: ai?.explanation ?? '',
        };
      }),
      null,
      2
    );
  }, [items, aiResults]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;
    setError(null);

    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'AI 응답 실패');
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="rounded-xl border bg-white p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-lg">💬</span> AI 추가 질문
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">검수 결과에 대해 궁금한 점을 질문하세요.</p>
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-700 hover:bg-blue-100 transition-colors"
              onClick={() => sendMessage(q)}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="max-h-72 overflow-y-auto space-y-3 rounded-lg bg-gray-50 p-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2 text-sm text-gray-400 animate-pulse">
                답변 작성 중...
              </div>
            </div>
          )}
          {error && (
            <div className="text-xs text-red-500 text-center">{error}</div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="검수 결과에 대해 질문하세요..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          전송
        </Button>
      </form>
    </div>
  );
}
