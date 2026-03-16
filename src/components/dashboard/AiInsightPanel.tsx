// @ts-nocheck
'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { AnomalyItem, AiAnalysisResult } from '@/lib/types';
import { AI_CLASSIFICATION_LABELS } from '@/lib/constants';
import { useLang } from '@/hooks/useLang';

interface AiInsightPanelProps {
  items: AnomalyItem[];
  onResults: (results: Map<string, AiAnalysisResult>) => void;
  onDemoModeChange?: (isDemoMode: boolean) => void;
}

type AiStatus = 'idle' | 'running' | 'done' | 'error';

export function AiInsightPanel({ items, onResults, onDemoModeChange }: AiInsightPanelProps) {
  const { t } = useLang();
  const [status, setStatus] = useState<AiStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [topFindings, setTopFindings] = useState<Array<{ item: AnomalyItem; ai: AiAnalysisResult }>>([]);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

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
      setErrorDetail(data.error_detail ?? null);
      setIsMock(mock);
      onDemoModeChange?.(mock);

      const map = new Map<string, AiAnalysisResult>();
      const classCounts: Record<string, number> = {};

      for (const r of results) {
        classCounts[r.classification] = (classCounts[r.classification] ?? 0) + 1;
        map.set(r.drug_id, r);
      }
      for (const item of items) {
        const byId = results.find((r) => r.drug_id === item.drug_id);
        if (byId) {
          map.set(`${item.drug_id}__${item.hospital_code}`, byId);
        }
      }

      const findings = items
        .filter((i) => i.severity !== 'normal')
        .map((i) => ({ item: i, ai: map.get(`${i.drug_id}__${i.hospital_code}`) }))
        .filter((f): f is { item: AnomalyItem; ai: AiAnalysisResult } => !!f.ai)
        .sort((a, b) => {
          if (a.item.severity !== b.item.severity) return a.item.severity === 'danger' ? -1 : 1;
          return b.ai.confidence - a.ai.confidence;
        })
        .slice(0, 3);
      setTopFindings(findings);

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
            {t.aiAnalysisTitle}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {t.aiAnalysisDesc.replace('{count}', String(toAnalyze.length))}
          </p>
        </div>
        {status === 'idle' && (
          <Button onClick={runAnalysis} disabled={toAnalyze.length === 0} className="shrink-0">
            {t.aiRunButton}
          </Button>
        )}
        {status === 'done' && (
          <Button variant="outline" onClick={() => { setStatus('idle'); setSummary(null); setIsMock(false); setTopFindings([]); onDemoModeChange?.(false); }} className="shrink-0">
            {t.aiRerunButton}
          </Button>
        )}
      </div>

      {status === 'idle' && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex items-start gap-2">
          <span>🔒</span>
          <span>{t.securityNotice}</span>
        </div>
      )}

      {status === 'running' && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-500 animate-pulse">{t.aiRunning}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <strong>{t.aiErrorPrefix}</strong> {error}
          <p className="mt-1 text-xs text-red-500">{t.aiErrorHint}</p>
        </div>
      )}

      {status === 'done' && summary && (
        <>
          {isMock && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 flex items-start gap-2">
              <span className="text-base leading-none">⚠️</span>
              <div>
                <strong>{t.mockBannerTitle}</strong>
                <p className="mt-0.5 text-amber-700">
                  {errorDetail ?? 'Anthropic API 크레딧이 부족합니다.'}{' '}
                  <a
                    href="https://console.anthropic.com/settings/billing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 font-semibold underline hover:text-amber-900"
                  >
                    {t.mockBannerCharge} <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
                <p className="mt-0.5 text-amber-600">{t.mockBannerNote}</p>
              </div>
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

          {topFindings.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">
                {t.topFindingsTitle}
                {isMock && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{t.mockBadge}</span>
                )}
              </p>
              {topFindings.map(({ item, ai }, i) => (
                <div key={i} className={`rounded-lg border p-3 text-sm ${item.severity === 'danger' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium mr-2 ${item.severity === 'danger' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.severity === 'danger' ? t.severityDanger : t.severityWarning}
                      </span>
                      <span className="font-medium text-gray-800">{item.drug_name || item.drug_id}</span>
                      <span className="ml-2 text-xs text-gray-500">{item.hospital_code} · {t.changeRateLabel} {item.change_pct > 0 ? '+' : ''}{item.change_pct.toFixed(1)}%</span>
                    </div>
                    <span className="shrink-0 text-xs text-gray-500">
                      {AI_CLASSIFICATION_LABELS[ai.classification]} · {Math.round(ai.confidence * 100)}%
                    </span>
                  </div>
                  <p className="mt-1.5 text-gray-600">{ai.explanation}</p>
                  <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-blue-700 font-medium">→ {ai.recommended_action}</p>
                    {ai.action_url && ai.action_label && (
                      <a
                        href={ai.action_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
                      >
                        {ai.action_label} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
