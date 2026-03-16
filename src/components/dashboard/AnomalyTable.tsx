// @ts-nocheck
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ExternalLink, Save } from 'lucide-react';
import { SeverityBadge } from './SeverityBadge';
import type { AnomalyItem, AiAnalysisResult, Severity, AiClassification } from '@/lib/types';
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

  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('absolute_change');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Map<string, Override>>(new Map());
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
    setOverrides((prev) => new Map(prev).set(key, { status: 'approved' }));
  }

  function handleModify(key: string, classification: AiClassification) {
    setOverrides((prev) => new Map(prev).set(key, { status: 'modified', classification }));
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      <span className="ml-1 text-blue-500">{sortDir === 'desc' ? '▼' : '▲'}</span>
    ) : (
      <span className="ml-1 text-gray-300">▼</span>
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
        <p className="text-sm text-gray-500">
          {t.totalCountText.replace('{count}', filtered.length.toLocaleString())}
          {overrides.size > 0 && (
            <span className="ml-2 text-xs text-blue-600">
              ({t.approvedCount.replace('{n}', String(Array.from(overrides.values()).filter(o => o.status === 'approved').length))} /
              {' '}{t.modifiedCount.replace('{n}', String(Array.from(overrides.values()).filter(o => o.status === 'modified').length))})
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v as Severity | 'all'); setPage(1); }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t.filterAll} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.filterAll}</SelectItem>
              <SelectItem value="danger">{t.filterDanger}</SelectItem>
              <SelectItem value="warning">{t.filterWarning}</SelectItem>
              <SelectItem value="normal">{t.filterNormal}</SelectItem>
            </SelectContent>
          </Select>
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
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>{t.colDrugName}</TableHead>
              <TableHead>{t.colHospCode}</TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('baseline_volume')}>
                {t.colPrevVol} <SortIcon k="baseline_volume" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('target_volume')}>
                {t.colCurrVol} <SortIcon k="target_volume" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('change_pct')}>
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
                    className={`hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset ${isExpanded ? 'bg-blue-50' : ''}`}
                    onClick={() => setExpandedKey(isExpanded ? null : key)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpandedKey(isExpanded ? null : key);
                      }
                    }}
                  >
                    <TableCell>
                      <div className="font-medium">{item.drug_name || '-'}</div>
                      <div className="text-xs text-gray-400">{item.drug_id}</div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{item.hospital_code}</TableCell>
                    <TableCell className="text-right">{item.baseline_volume.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{item.target_volume.toLocaleString()}</TableCell>
                    <TableCell className={`text-right font-semibold ${item.change_pct > 0 ? 'text-red-600' : item.change_pct < 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                      {item.change_pct > 0 ? '+' : ''}{item.change_pct.toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      <SeverityBadge severity={item.severity} />
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 max-w-48">
                      {ai ? (
                        <div>
                          {override?.status === 'approved' && (
                            <span className="inline-block mb-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">{t.approvedBadge}</span>
                          )}
                          {override?.status === 'modified' && (
                            <span className="inline-block mb-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{t.modifiedBadge}</span>
                          )}
                          <div>
                            {isMock && (
                              <span className="inline-block mr-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">{t.mockBadge}</span>
                            )}
                            {override?.status === 'modified' ? (
                              <>
                                <span className="line-through text-gray-400">{AI_CLASSIFICATION_LABELS[ai.classification]}</span>
                                <span className="ml-1 font-medium text-amber-700">{AI_CLASSIFICATION_LABELS[effectiveClassification!]}</span>
                              </>
                            ) : (
                              <span className="font-medium text-gray-700">{AI_CLASSIFICATION_LABELS[ai.classification]}</span>
                            )}
                            <span className="ml-1 text-gray-400">({Math.round(ai.confidence * 100)}%)</span>
                          </div>
                          <p className="mt-0.5 text-gray-500 line-clamp-1">{ai.explanation}</p>
                          <span className="text-blue-400 text-xs">{isExpanded ? t.collapseLabel : t.expandLabel}</span>
                        </div>
                      ) : analysisFailed && item.severity !== 'normal' ? (
                        <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                          <span className="text-amber-500 text-xs">{t.analysisDelayed}</span>
                          <button
                            className="text-xs text-blue-600 underline hover:text-blue-800"
                            onClick={() => handleRetryItem(item)}
                          >
                            {t.retryAnalysis}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </TableCell>
                  </TableRow>,
                  ...(isExpanded && ai ? [
                    <TableRow key={`${idx}-expanded`} className="bg-blue-50 border-b border-blue-100">
                      <TableCell colSpan={7} className="py-4 px-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                          <div>
                            <p className="font-medium text-gray-700 mb-1">{t.aiCauseTitle}</p>
                            <p className="text-gray-600">{ai.explanation}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700 mb-1">{t.aiActionTitle}</p>
                            <p className="text-blue-700 bg-blue-50 rounded p-2 border border-blue-100">{ai.recommended_action}</p>
                            {ai.action_url && ai.action_label && (
                              <a
                                href={ai.action_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="h-3 w-3" />
                                {ai.action_label}
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Human-in-the-loop 검토 */}
                        <div className="border-t border-blue-200 pt-3">
                          <p className="text-xs font-semibold text-gray-600 mb-2">{t.reviewTitle}</p>
                          {override?.status === 'approved' && (
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">{t.approvedMsg}</span>
                              <button className="text-xs text-gray-400 underline" onClick={(e) => { e.stopPropagation(); setOverrides(prev => { const m = new Map(prev); m.delete(key); return m; }); }}>{t.cancelButton}</button>
                            </div>
                          )}
                          {override?.status === 'modified' && (
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                                {t.modifiedBadge}: {AI_CLASSIFICATION_LABELS[override.classification]}
                              </span>
                              <button className="text-xs text-gray-400 underline" onClick={(e) => { e.stopPropagation(); setOverrides(prev => { const m = new Map(prev); m.delete(key); return m; }); }}>{t.cancelButton}</button>
                            </div>
                          )}
                          {!override && (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-green-300 text-green-700 hover:bg-green-50"
                                onClick={() => handleApprove(key)}
                              >
                                {t.approveButton}
                              </Button>
                              <Select onValueChange={(v) => handleModify(key, v as AiClassification)}>
                                <SelectTrigger className="h-8 w-44 border-amber-300 text-amber-700 text-xs">
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
            className="px-3 py-1 rounded border disabled:opacity-30"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {t.prevPage}
          </button>
          <span className="text-gray-600">{page} / {totalPages}</span>
          <button
            className="px-3 py-1 rounded border disabled:opacity-30"
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
