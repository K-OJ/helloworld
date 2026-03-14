'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { AnomalyItem, AiAnalysisResult } from '@/lib/types';
import { AI_CLASSIFICATION_LABELS } from '@/lib/constants';

interface AiInsightPanelProps {
  items: AnomalyItem[];
  onResults: (results: Map<string, AiAnalysisResult>) => void;
}

type AiStatus = 'idle' | 'running' | 'done' | 'error';

export function AiInsightPanel({ items, onResults }: AiInsightPanelProps) {
  const [status, setStatus] = useState<AiStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [isMock, setIsMock] = useState(false);

  const toAnalyze = items.filter((i) => i.severity !== 'normal');

  async function runAnalysis() {
    setStatus('running');
    setError(null);
    setProgress(10);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anomalies: items }),
      });

      setProgress(80);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'AI 분석 실패');

      const results = data.results as AiAnalysisResult[];
      const mock = data.is_mock as boolean;
      const map = new Map<string, AiAnalysisResult>();
      const classCounts: Record<string, number> = {};

      for (const r of results) {
        map.set(r.drug_id, r);
        classCounts[r.classification] = (classCounts[r.classification] ?? 0) + 1;
      }

      for (const item of items) {
        const byId = results.find((r) => r.drug_id === item.drug_id);
        if (byId) {
          map.set(`${item.drug_id}__${item.hospital_code}`, byId);
        }
      }

      setIsMock(mock);
      setSummary(classCounts);
      onResults(map);
      setProgress(100);
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      setStatus('error');
    }
  }

  return (
    <div className="rounded-xl border bg-gradient-to-br from-violet-50 to-blue-50 p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-lg">🤖</span> AI 컨텍스트 분석
            {isMock && status === 'done' && (
              <span className="inline-flex items-center rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-xs font-medium text-amber-700">
                예시 데이터
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            경고/위험 항목 <strong>{toAnalyze.length}건</strong>에 대해 Claude AI가 이상 원인을 분석합니다.
          </p>
        </div>
        {status === 'idle' && (
          <Button onClick={runAnalysis} disabled={toAnalyze.length === 0} className="shrink-0">
            AI 분석 실행
          </Button>
        )}
        {status === 'done' && (
          <Button variant="outline" onClick={() => { setStatus('idle'); setSummary(null); setIsMock(false); }} className="shrink-0">
            재분석
          </Button>
        )}
      </div>

      {status === 'running' && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-500 animate-pulse">Claude AI가 분석 중입니다...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <strong>분석 실패:</strong> {error}
          <p className="mt-1 text-xs text-red-500">룰 기반 검수 결과는 그대로 사용 가능합니다.</p>
        </div>
      )}

      {status === 'done' && summary && (
        <>
          {isMock && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
              AI API 연결 실패로 예시 분석 결과를 표시합니다. 실제 분석 결과와 다를 수 있습니다.
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {Object.entries(summary).map(([cls, cnt]) => (
              <div key={cls} className="rounded-lg bg-white border p-2 text-center">
                <p className="text-lg font-bold text-gray-800">{cnt}</p>
                <p className="text-xs text-gray-500">{AI_CLASSIFICATION_LABELS[cls] ?? cls}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
