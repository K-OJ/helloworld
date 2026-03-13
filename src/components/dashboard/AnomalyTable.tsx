'use client';

import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SeverityBadge } from './SeverityBadge';
import type { AnomalyItem, AiAnalysisResult, Severity } from '@/lib/types';
import { AI_CLASSIFICATION_LABELS } from '@/lib/constants';

const PAGE_SIZE = 20;

interface AnomalyTableProps {
  items: AnomalyItem[];
  aiResults: Map<string, AiAnalysisResult>;
}

type SortKey = 'change_pct' | 'absolute_change' | 'baseline_volume' | 'target_volume';
type SortDir = 'asc' | 'desc';

export function AnomalyTable({ items, aiResults }: AnomalyTableProps) {
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('absolute_change');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

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
              pageItems.map((item, idx) => {
                const key = `${item.drug_id}__${item.hospital_code}`;
                const ai = aiResults.get(key);
                return (
                  <TableRow key={idx} className="hover:bg-gray-50">
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
                          <span className="font-medium text-gray-700">{AI_CLASSIFICATION_LABELS[ai.classification]}</span>
                          <span className="ml-1 text-gray-400">({Math.round(ai.confidence * 100)}%)</span>
                          <p className="mt-0.5 text-gray-500 line-clamp-2">{ai.explanation}</p>
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
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
