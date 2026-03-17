// @ts-nocheck
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ExternalLink, Save } from 'lucide-react';
import { SeverityBadge } from './SeverityBadge';
import type { AnomalyItem, AiAnalysisResult, Severity, AiClassification, Override } from '@/lib/types';
import { AI_CLASSIFICATION_LABELS } from '@/lib/constants';
import { useLang } from '@/hooks/useLang';
import { useQAStore } from '@/store/useQAStore';

const PAGE_SIZE = 20;

type SortKey = 'change_pct' | 'absolute_change' | 'baseline_volume' | 'target_volume';
type SortDir = 'asc' | 'desc';
type Override =
  | { status: 'approved' }
  | { status: 'modified'; classification: AiClassification };

export function AnomalyTable() {
  const { t } = useLang();

  // Zustand 스토어에서 직접 구독 (Props Drilling 제거)
  const items = useQAStore((s) => s.uploadResult?.items ?? []);
  const aiResults = useQAStore((s) => s.aiResults);
  const analysisFailed = useQAStore((s) => s.analysisFailed);
  const isMock = useQAStore((s) => s.isDemoMode);
  const updateAiResult = useQAStore((s) => s.updateAiResult);
  const overrides = useQAStore((s) => s.overrides);
  const setOverride = useQAStore((s) => s.setOverride);
  const removeOverride = useQAStore((s) => s.removeOverride);

  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('absolute_change');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState(false);

  // 저장된 필터 뷰 복원
  useEffect(() => {
    try {
      const saved = localStorage.getItem('saved_filter_view');
      if (saved) {
        const { severityFilter: sf, sortKey: sk, sortDir: sd } = JSON.parse(saved);
        if (sf) setSeverityFilter(sf);
        if (sk) setSortKey(sk);
        if (sd) setSortDir(sd);
      }
    } catch { /* ignore */ }
  }, []);

  function handleSaveView() {
    const currentFilters = { severityFilter, sortKey, sortDir };
    localStorage.setItem('saved_filter_view', JSON.stringify(currentFilters));
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  }

  async function handleRetryItem(item: AnomalyItem) {
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anomalies: [item] }),
      });
      const data = await res.json();
      if (res.ok && !data.is_mock && data.results?.length) {
        const r = data.results[0] as AiAnalysisResult;
        const key = `${item.drug_id}__${item.hospital_code}`;
        updateAiResult(key, r);
        updateAiResult(r.drug_id, r);
      }
    } catch {
      // silent fail — user can retry again
    }
  }

  const filtered = useMemo(() => {
    let data = severityFilter === 'all' ? items : items.filter((i) => i.severity === severityFilter);
    data = [...data].sort((a, b) => {
      const av = Math.abs(a[sortKey]);
      const bv = Math.abs(b[sortKey]);
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return data;
  }, [items, severityFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  }

  function handleApprove(key: string) {
    setOverride(key, { status: 'approved' });
  }

  function handleModify(key: string, classification: AiClassification) {
    setOverride(key, { status: 'modified', classification });
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      <span className="ml-1 text-blue-500 dark:text-blue-400">{sortDir === 'desc' ? '▼' : '▲'}</span>
    ) : (
      <span className="ml-1 text-gray-300 dark:text-slate-600">▼</span>
    );

  return (
    <div className="space-y-3">
      {/* 필터 저장 Toast */}
      {saveToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg flex items-center gap-2"
        >
          <Save className="h-3.5 w-3.5 text-green-400" />
          {t.saveViewToast}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm text-gray-500 dark:text-slate-400">
          {t.totalCountText.replace('{count}', filtered.length.toLocaleString())}
          {overrides.size > 0 && (
            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
              ({t.approvedCount.replace('{n}', String(Array.from(overrides.values()).filter(o => o.status === 'approved').length))} /
              {' '}{t.modifiedCount.replace('{n}', String(Array.from(overrides.values()).filter(o => o.status === 'modified').length))})
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          {/* Pill filter buttons */}
          <div className="flex items-center gap-1.5">
            {([
              { value: 'all',     label: t.filterAll,     activeClass: 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900' },
              { value: 'danger',  label: t.filterDanger,  activeClass: 'bg-red-500 text-white' },
              { value: 'warning', label: t.filterWarning, activeClass: 'bg-amber-500 text-white' },
              { value: 'normal',  label: t.filterNormal,  activeClass: 'bg-green-500 text-white' },
            ] as const).map(({ value, label, activeClass }) => (
              <button
                key={value}
                onClick={() => { setSeverityFilter(value); setPage(1); }}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold border transition-all',
                  severityFilter === value
                    ? activeClass + ' border-transparent shadow-sm'
                    : 'bg-white text-gray-500 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600 dark:hover:border-slate-500'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveView}
            aria-label={t.saveViewButton}
            className="h-9 gap-1.5 text-xs text-slate-600"
          >
            <Save className="h-3.5 w-3.5" />
            {t.saveViewButton}
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table className="table-fixed w-full min-w-[720px]">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[10%]" />
            <col className="w-[9%]" />
            <col className="w-[26%]" />
          </colgroup>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-slate-800/60">
              <TableHead>{t.colDrugName}</TableHead>
              <TableHead>{t.colHospCode}</TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => toggleSort('baseline_volume')}>
                {t.colPrevVol} <SortIcon k="baseline_volume" />
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => toggleSort('target_volume')}>
                {t.colCurrVol} <SortIcon k="target_volume" />
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => toggleSort('change_pct')}>
                {t.colChangeRate} <SortIcon k="change_pct" />
              </TableHead>
              <TableHead>{t.colSeverity}</TableHead>
              <TableHead>{t.colAiDecision}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                  {t.noData}
                </TableCell>
              </TableRow>
            ) : (
              pageItems.flatMap((item, idx) => {
                const globalRank = (page - 1) * PAGE_SIZE + idx + 1;
                const key = `${item.drug_id}__${item.hospital_code}`;
                const ai = aiResults.get(key);
                const override = overrides.get(key);
                const isExpanded = expandedKey === key;

                const effectiveClassification = override?.status === 'modified'
                  ? override.classification
                  : ai?.classification;

                return [
                  <TableRow
                    key={idx}
                    tabIndex={0}
                    role="button"
                    aria-expanded={isExpanded}
                    aria-label={`${item.drug_name || item.drug_id} 상세 분석 ${isExpanded ? '접기' : '펼치기'}`}
                    className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset ${isExpanded ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    onClick={() => setExpandedKey(isExpanded ? null : key)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpandedKey(isExpanded ? null : key);
                      }
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-black shrink-0',
                          globalRank === 1 ? 'bg-red-500 text-white' :
                          globalRank === 2 ? 'bg-orange-500 text-white' :
                          globalRank === 3 ? 'bg-amber-500 text-white' :
                          'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                        )}>
                          {globalRank}
                        </span>
                        <div className="min-w-0">
                          <div className="font-medium dark:text-slate-200 truncate">{item.drug_name || '-'}</div>
                          <div className="text-xs text-gray-400 dark:text-slate-500">{item.drug_id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-slate-400">{item.hospital_code}</TableCell>
                    <TableCell className="text-right">{item.baseline_volume.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{item.target_volume.toLocaleString()}</TableCell>
                    <TableCell className={`text-right font-semibold ${item.change_pct > 0 ? 'text-red-600 dark:text-red-400' : item.change_pct < 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400'}`}>
                      {item.change_pct > 0 ? '+' : ''}{item.change_pct.toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      <SeverityBadge severity={item.severity} />
                    </TableCell>
                    <TableCell className="text-xs max-w-52">
                      {ai ? (
                        <div className="flex flex-col gap-1.5">
                          {/* 상태 뱃지 행 */}
                          <div className="flex flex-wrap gap-1">
                            {isMock && (
                              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{t.mockBadge}</span>
                            )}
                            {override?.status === 'approved' && (
                              <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">{t.approvedBadge}</span>
                            )}
                            {override?.status === 'modified' && (
                              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{t.modifiedBadge}</span>
                            )}
                          </div>

                          {/* 분류 + 신뢰도 */}
                          <div className="flex items-center gap-1 flex-wrap">
                            {override?.status === 'modified' ? (
                              <>
                                <span className="line-through text-gray-400 dark:text-slate-500 text-[11px]">{AI_CLASSIFICATION_LABELS[ai.classification]}</span>
                                <span className="font-semibold text-amber-700 dark:text-amber-300 text-[11px]">→ {AI_CLASSIFICATION_LABELS[effectiveClassification!]}</span>
                              </>
                            ) : (
                              <span className="font-semibold text-gray-700 dark:text-slate-200 text-[11px]">{AI_CLASSIFICATION_LABELS[ai.classification]}</span>
                            )}
                            <span className="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                              {Math.round(ai.confidence * 100)}%
                            </span>
                          </div>

                          {/* 펼치기 힌트 */}
                          <span className="text-blue-400 dark:text-blue-500 text-[11px]">
                            {isExpanded ? t.collapseLabel : t.expandLabel}
                          </span>
                        </div>
                      ) : analysisFailed && item.severity !== 'normal' ? (
                        <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                          <span className="text-amber-500 dark:text-amber-400 text-xs">{t.analysisDelayed}</span>
                          <button
                            className="text-xs text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            onClick={() => handleRetryItem(item)}
                          >
                            {t.retryAnalysis}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-300 dark:text-slate-600">-</span>
                      )}
                    </TableCell>
                  </TableRow>,
                  ...(isExpanded && ai ? [
                    <TableRow key={`${idx}-expanded`} className="border-b border-slate-200 dark:border-slate-700">
                      <TableCell colSpan={7} className="p-0">
                        <div className="bg-slate-50 dark:bg-slate-800/60 border-l-4 border-blue-400 dark:border-blue-500 px-4 py-4 space-y-3 overflow-hidden">

                          {/* ── 헤더: 약품명 + 분류 칩 ── */}
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className="font-semibold text-gray-800 dark:text-slate-100 text-sm truncate max-w-xs">
                              {item.drug_name || item.drug_id}
                            </span>
                            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shrink-0">
                              {AI_CLASSIFICATION_LABELS[effectiveClassification ?? ai.classification]}
                            </span>
                            <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300 shrink-0">
                              신뢰도 {Math.round(ai.confidence * 100)}%
                            </span>
                            {isMock && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 shrink-0">{t.mockBadge}</span>
                            )}
                          </div>

                          {/* ── 분석 원인 ── */}
                          <div className="rounded-lg bg-white border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-600 min-w-0">
                            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">{t.aiCauseTitle}</p>
                            <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed break-words whitespace-pre-wrap">{ai.explanation}</p>
                          </div>

                          {/* ── 권장 조치 ── */}
                          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 dark:bg-blue-900/20 dark:border-blue-700 min-w-0">
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1.5">{t.aiActionTitle}</p>
                            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed break-words whitespace-pre-wrap">{ai.recommended_action}</p>
                            {ai.action_url && ai.action_label && (
                              <div className="mt-2.5">
                                <a
                                  href={ai.action_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors dark:border-blue-600 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="h-3 w-3 shrink-0" />
                                  {ai.action_label}
                                </a>
                              </div>
                            )}
                          </div>

                          {/* ── 실무자 검토 ── */}
                          <div className="rounded-lg bg-white border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-600 min-w-0">
                            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">{t.reviewTitle}</p>
                            {override?.status === 'approved' && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">{t.approvedMsg}</span>
                                <button className="text-xs text-gray-400 underline hover:text-gray-600 dark:text-slate-500" onClick={(e) => { e.stopPropagation(); removeOverride(key); }}>{t.cancelButton}</button>
                              </div>
                            )}
                            {override?.status === 'modified' && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                  {t.modifiedBadge}: {AI_CLASSIFICATION_LABELS[override.classification]}
                                </span>
                                <button className="text-xs text-gray-400 underline hover:text-gray-600 dark:text-slate-500" onClick={(e) => { e.stopPropagation(); removeOverride(key); }}>{t.cancelButton}</button>
                              </div>
                            )}
                            {!override && (
                              <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/30"
                                  onClick={() => handleApprove(key)}
                                >
                                  {t.approveButton}
                                </Button>
                                <Select onValueChange={(v) => handleModify(key, v as AiClassification)}>
                                  <SelectTrigger className="h-8 w-40 border-amber-300 text-amber-700 text-xs dark:border-amber-700 dark:text-amber-300">
                                    <SelectValue placeholder={t.modifyPlaceholder} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(AI_CLASSIFICATION_LABELS).map(([val, label]) => (
                                      <SelectItem key={val} value={val}>{label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>

                        </div>
                      </TableCell>
                    </TableRow>,
                  ] : []),
                ];
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button
            className="px-3 py-1 rounded border disabled:opacity-30 dark:border-slate-600 dark:text-slate-300"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {t.prevPage}
          </button>
          <span className="text-gray-600 dark:text-slate-400">{page} / {totalPages}</span>
          <button
            className="px-3 py-1 rounded border disabled:opacity-30 dark:border-slate-600 dark:text-slate-300"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t.nextPage}
          </button>
        </div>
      )}
    </div>
  );
}
