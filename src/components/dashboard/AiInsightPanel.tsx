// @ts-nocheck
'use client';

import { useState } from 'react';
import { ExternalLink, Sparkles, BrainCircuit, ChevronRight } from 'lucide-react';
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

const CLASS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  data_error:    { bg: 'bg-red-100 dark:bg-red-900/30',    text: 'text-red-700 dark:text-red-300',    border: 'border-red-200 dark:border-red-700' },
  market_trend:  { bg: 'bg-blue-100 dark:bg-blue-900/30',  text: 'text-blue-700 dark:text-blue-300',  border: 'border-blue-200 dark:border-blue-700' },
  seasonal:      { bg: 'bg-green-100 dark:bg-green-900/30',text: 'text-green-700 dark:text-green-300',border: 'border-green-200 dark:border-green-700' },
  policy_change: { bg: 'bg-purple-100 dark:bg-purple-900/30',text: 'text-purple-700 dark:text-purple-300',border: 'border-purple-200 dark:border-purple-700' },
  unknown:       { bg: 'bg-slate-100 dark:bg-slate-700',   text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-600' },
};

const RANK_LABEL = ['#1', '#2', '#3'];

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
    <div className="rounded-2xl border border-violet-200 dark:border-violet-800/50 overflow-hidden shadow-sm">

      {/* 헤더 그라디언트 배너 */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                {t.aiAnalysisTitle}
                <Sparkles className="h-4 w-4 text-yellow-300" />
              </h3>
              <p className="text-violet-200 text-xs mt-0.5">
                {t.aiAnalysisDesc.replace('{count}', String(toAnalyze.length))}
              </p>
            </div>
          </div>

          {status === 'idle' && (
            <button
              onClick={runAnalysis}
              disabled={toAnalyze.length === 0}
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-violet-700 shadow-lg hover:bg-violet-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-4 w-4" />
              {t.aiRunButton}
            </button>
          )}
          {status === 'done' && (
            <button
              onClick={() => { setStatus('idle'); setSummary(null); setIsMock(false); setTopFindings([]); onDemoModeChange?.(false); }}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/20 transition-all"
            >
              {t.aiRerunButton}
            </button>
          )}
        </div>
      </div>

      {/* 바디 */}
      <div className="bg-white dark:bg-slate-900 p-6 space-y-5">

        {/* Idle */}
        {status === 'idle' && (
          <div className="flex items-center gap-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/40 px-4 py-3">
            <span className="text-lg">🔒</span>
            <p className="text-xs text-violet-700 dark:text-violet-300">{t.securityNotice}</p>
          </div>
        )}

        {/* Running */}
        {status === 'running' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-sm text-gray-500 dark:text-slate-400 ml-1">{t.aiRunning}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            <strong>{t.aiErrorPrefix}</strong> {error}
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">{t.aiErrorHint}</p>
          </div>
        )}

        {/* Done */}
        {status === 'done' && summary && (
          <>
            {/* Mock 경고 */}
            {isMock && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 flex items-start gap-2.5 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                <span className="text-base leading-none mt-0.5">⚠️</span>
                <div>
                  <strong>{t.mockBannerTitle}</strong>
                  <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                    {errorDetail ?? 'Anthropic API 크레딧이 부족합니다.'}{' '}
                    <a href="https://console.anthropic.com/settings/billing" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 font-semibold underline">
                      {t.mockBannerCharge} <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                  <p className="mt-0.5 text-amber-600 dark:text-amber-500">{t.mockBannerNote}</p>
                </div>
              </div>
            )}

            {/* 분류 요약 칩 */}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2.5">원인 분류 요약</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(summary).map(([cls, cnt]) => {
                  const c = CLASS_COLORS[cls] ?? CLASS_COLORS.unknown;
                  return (
                    <span key={cls}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${c.bg} ${c.text} ${c.border}`}>
                      <span className="text-sm font-black">{cnt}</span>
                      {AI_CLASSIFICATION_LABELS[cls] ?? cls}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* TOP 3 주요 발견 */}
            {topFindings.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                  {t.topFindingsTitle}
                  {isMock && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 normal-case">{t.mockBadge}</span>
                  )}
                </p>
                <div className="space-y-3">
                  {topFindings.map(({ item, ai }, i) => {
                    const isDanger = item.severity === 'danger';
                    const clsColor = CLASS_COLORS[ai.classification] ?? CLASS_COLORS.unknown;
                    const confPct = Math.round(ai.confidence * 100);
                    return (
                      <div key={i}
                        className={`rounded-xl border-l-4 ${isDanger ? 'border-l-red-500' : 'border-l-amber-400'} border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4`}>

                        {/* 상단: 순위 + 약품명 + 심각도 + 분류 */}
                        <div className="flex items-start gap-3">
                          <span className={`shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white ${isDanger ? 'bg-red-500' : 'bg-amber-400'}`}>
                            {RANK_LABEL[i]}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-800 dark:text-slate-100 text-sm">{item.drug_name || item.drug_id}</span>
                              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${clsColor.bg} ${clsColor.text} ${clsColor.border}`}>
                                {AI_CLASSIFICATION_LABELS[ai.classification]}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 dark:text-slate-500">
                              <span>{item.hospital_code}</span>
                              <span className={`font-semibold ${item.change_pct > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                {item.change_pct > 0 ? '+' : ''}{item.change_pct.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          {/* 신뢰도 */}
                          <div className="shrink-0 text-right">
                            <p className="text-xs text-gray-400 dark:text-slate-500">신뢰도</p>
                            <p className="text-lg font-black text-violet-600 dark:text-violet-400 leading-tight">{confPct}%</p>
                          </div>
                        </div>

                        {/* 신뢰도 바 */}
                        <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700"
                            style={{ width: `${confPct}%` }} />
                        </div>

                        {/* 분석 내용 */}
                        <p className="mt-3 text-xs text-gray-600 dark:text-slate-400 leading-relaxed">{ai.explanation}</p>

                        {/* 권장 조치 */}
                        <div className="mt-2.5 flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex items-start gap-1.5">
                            <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">{ai.recommended_action}</p>
                          </div>
                          {ai.action_url && ai.action_label && (
                            <a href={ai.action_url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors shrink-0 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                              {ai.action_label} <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
