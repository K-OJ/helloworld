'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AnomalyItem, AiAnalysisResult } from '@/lib/types';
import { AI_CLASSIFICATION_LABELS } from '@/lib/constants';

interface Props {
  items: AnomalyItem[];
  aiResults: Map<string, AiAnalysisResult>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  '가장 주의해야 할 항목이 무엇인가요?',
  '데이터 오류로 의심되는 항목을 알려주세요.',
  '계절적 요인 항목의 배경을 설명해주세요.',
  '전반적인 처방 트렌드를 요약해주세요.',
];

export function FloatingChat({ items, aiResults }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

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
        body: JSON.stringify({ messages: newMessages, anomaliesContext }),
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
        accumulated += decoder.decode(value, { stream: true });
        setStreamingText(accumulated);
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: accumulated }]);
      if (!open) setUnread((n) => n + 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류';
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠ 오류: ${msg}` }]);
    } finally {
      setIsLoading(false);
      setStreamingText('');
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Panel */}
      {open && (
        <div className="flex flex-col w-80 sm:w-96 h-[520px] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="font-semibold text-sm">AI QA 어시스턴트</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 hover:bg-blue-500 transition-colors"
                title="최소화"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 hover:bg-blue-500 transition-colors"
                title="닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
            {messages.length === 0 && !isLoading && (
              <div className="space-y-3">
                <p className="text-center text-xs text-slate-400 pt-2">
                  현재 검수 결과를 바탕으로 질문하세요
                </p>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-left text-xs text-blue-700 hover:bg-blue-50 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-white border border-slate-200 text-slate-800 shadow-sm rounded-bl-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm whitespace-pre-wrap leading-relaxed">
                  {streamingText || (
                    <span className="flex gap-1 items-center text-slate-400">
                      <span className="animate-bounce delay-0">●</span>
                      <span className="animate-bounce delay-100">●</span>
                      <span className="animate-bounce delay-200">●</span>
                    </span>
                  )}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-2.5 shrink-0"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLoading ? '답변 중...' : '질문을 입력하세요...'}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 disabled:text-slate-400"
            />
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !input.trim()}
              className="h-9 w-9 p-0 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
        title="AI QA 어시스턴트"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold">
            {unread}
          </span>
        )}
      </button>
    </div>
  );
}
