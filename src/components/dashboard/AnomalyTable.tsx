'use client';

import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { SeverityBadge } from './SeverityBadge';
import type { AnomalyItem, AiAnalysisResult, Severity, AiClassification } from '@/lib/types';
import { AI_CLASSIFICATION_LABELS } from '@/lib/constants';

const PAGE_SIZE = 20;

interface AnomalyTableProps {
  items: AnomalyItem[];
  aiResults: Map<string, AiAnalysisResult>;
  analysisFailed?: boolean;
  onRetryItem?: (item: AnomalyItem) => void;
}

type SortKey = 'change_pct' | 'absolute_change' | 'baseline_volume' | 'target_volume';
type SortDir = 'asc' | 'desc';
type Override =
  | { status: 'approved' }
  | { status: 'modified'; classification: AiClassification };

export function AnomalyTable({ items, aiResults, analysisFailed, onRetryItem }: AnomalyTableProps) {
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('absolute_change');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Map<string, Override>>(new Map());

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
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          총 <strong>{filtered.length.toLocaleString()}</strong>건
          {overrides.size > 0 && (
            <span className="ml-2 text-xs text-blue-600">
              ({Array.from(overrides.values()).filter(o => o.status === 'approved').length}건 승인 /
              {' '}{Array.from(overrides.values()).filter(o => o.status === 'modified').length}건 수정)
            </span>
          )}
        </p>
        <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v as Severity | 'all'); setPage(1); }}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="danger">위험</SelectItem>
            <SelectItem value="warning">경고</SelectItem>
            <SelectItem value="normal">정상</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>약품명</TableHead>
              <TableHead>병원코드</TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('baseline_volume')}>
                전월 처방량 <SortIcon k="baseline_volume" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('target_volume')}>
                당월 처방량 <SortIcon k="target_volume" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('change_pct')}>
                변동률 <SortIcon k="change_pct" />
              </TableHead>
              <TableHead>심각도</TableHead>
              <TableHead>AI 판단</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                  해당 조건의 데이터가 없습니다.
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
                    className={`hover:bg-gray-50 cursor-pointer ${isExpanded ? 'bg-blue-50' : ''}`}
                    onClick={() => setExpandedKey(isExpanded ? null : key)}
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
                            <span className="inline-block mb-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">✓ 승인됨</span>
                          )}
                          {override?.status === 'modified' && (
                            <span className="inline-block mb-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">수정됨</span>
                          )}
                          <div>
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
                          <span className="text-blue-400 text-xs">{isExpanded ? '▲ 접기' : '▼ 상세보기'}</span>
                        </div>
                      ) : analysisFailed && item.severity !== 'normal' ? (
                        <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                          <span className="text-amber-500 text-xs">⚠ 분석 지연</span>
                          {onRetryItem && (
                            <button
                              className="text-xs text-blue-600 underline hover:text-blue-800"
                              onClick={() => onRetryItem(item)}
                            >
                              재분석 요청
                            </button>
                          )}
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
                            <p className="font-medium text-gray-700 mb-1">📋 AI 분석 원인</p>
                            <p className="text-gray-600">{ai.explanation}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700 mb-1">✅ 권장 조치</p>
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
                          <p className="text-xs font-semibold text-gray-600 mb-2">실무자 검토</p>
                          {override?.status === 'approved' && (
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">✓ AI 판단을 승인했습니다</span>
                              <button className="text-xs text-gray-400 underline" onClick={(e) => { e.stopPropagation(); setOverrides(prev => { const m = new Map(prev); m.delete(key); return m; }); }}>취소</button>
                            </div>
                          )}
                          {override?.status === 'modified' && (
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                                수정됨: {AI_CLASSIFICATION_LABELS[override.classification]}
                              </span>
                              <button className="text-xs text-gray-400 underline" onClick={(e) => { e.stopPropagation(); setOverrides(prev => { const m = new Map(prev); m.delete(key); return m; }); }}>취소</button>
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
                                ✓ AI 판단 승인
                              </Button>
                              <Select onValueChange={(v) => handleModify(key, v as AiClassification)}>
                                <SelectTrigger className="h-8 w-44 border-amber-300 text-amber-700 text-xs">
                                  <SelectValue placeholder="원인 수정..." />
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
            이전
          </button>
          <span className="text-gray-600">{page} / {totalPages}</span>
          <button
            className="px-3 py-1 rounded border disabled:opacity-30"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
