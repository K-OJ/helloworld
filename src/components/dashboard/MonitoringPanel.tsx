// @ts-nocheck
'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, PenLine, AlertTriangle, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SeverityBadge } from './SeverityBadge';
import { useQAStore, selectAnomalies, selectReviewProgress } from '@/store/useQAStore';
import { AI_CLASSIFICATION_LABELS } from '@/lib/constants';
import type { AiClassification } from '@/lib/types';

const PENDING_PAGE = 10;

export function MonitoringPanel() {
  const anomalies   = useQAStore(selectAnomalies);
  const progress    = useQAStore(selectReviewProgress);
  const overrides   = useQAStore((s) => s.overrides);
  const aiResults   = useQAStore((s) => s.aiResults);
  const setOverride = useQAStore((s) => s.setOverride);
  const removeOverride = useQAStore((s) => s.removeOverride);
  const clearOverrides = useQAStore((s) => s.clearOverrides);

  const [showDone, setShowDone] = useState(false);
  const [pendingPage, setPendingPage] = useState(1);

  if (anomalies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-slate-500 gap-3">
        <Clock className="h-10 w-10 opacity-30" />
        <p className="text-sm">검수 데이터가 없습니다. 파일을 업로드하고 분석을 실행해주세요.</p>
      </div>
    );
  }

  const pendingItems = anomalies.filter((i) => !overrides.has(`${i.drug_id}__${i.hospital_code}`));
  const doneItems    = anomalies.filter((i) =>  overrides.has(`${i.drug_id}__${i.hospital_code}`));

  const shownPending = pendingItems.slice(0, pendingPage * PENDING_PAGE);
  const hasMore = shownPending.length < pendingItems.length;

  const pctColor =
    progress.pct >= 80 ? 'text-green-600 dark:text-green-400' :
    progress.pct >= 40 ? 'text-amber-500 dark:text-amber-400' :
                         'text-slate-500 dark:text-slate-400';

  const barColor =
    progress.pct >= 80 ? 'from-green-400 to-emerald-500' :
    progress.pct >= 40 ? 'from-amber-400 to-orange-500' :
                         'from-slate-300 to-slate-400';

  return (
    <div className="space-y-5">

      {/* ── 진행률 헤더 ── */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-700 dark:text-slate-200">검수 진행 현황</h3>
          {overrides.size > 0 && (
            <button
              onClick={clearOverrides}
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 dark:text-slate-500 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />전체 초기화
            </button>
          )}
        </div>

        {/* 진행률 바 */}
        <div className="flex items-center gap-4 mb-4">
          <span className={`text-4xl font-black w-16 shrink-0 ${pctColor}`}>{progress.pct}%</span>
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500">
              전체 {progress.total}건 중 {progress.reviewed}건 검토 완료
            </p>
          </div>
        </div>

        {/* 상태별 카운터 3개 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400">미검토</span>
            </div>
            <p className="text-2xl font-black text-slate-600 dark:text-slate-300">{progress.pending}</p>
          </div>
          <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs text-green-600 dark:text-green-400">승인완료</span>
            </div>
            <p className="text-2xl font-black text-green-600 dark:text-green-400">{progress.approved}</p>
          </div>
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <PenLine className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs text-amber-600 dark:text-amber-400">분류수정</span>
            </div>
            <p className="text-2xl font-black text-amber-500 dark:text-amber-400">{progress.modified}</p>
          </div>
        </div>
      </div>

      {/* ── 미검토 항목 목록 ── */}
      {pendingItems.length > 0 && (
        <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">미검토 항목</span>
              <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                {pendingItems.length}
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {shownPending.map((item) => {
              const key = `${item.drug_id}__${item.hospital_code}`;
              const ai = aiResults.get(key);
              return (
                <div key={key} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  {/* 심각도 */}
                  <div className="shrink-0">
                    <SeverityBadge severity={item.severity} />
                  </div>

                  {/* 약품 정보 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">{item.drug_name || item.drug_id}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 truncate">
                      {item.hospital_code} · <span className={item.change_pct > 0 ? 'text-red-500' : 'text-blue-500'}>
                        {item.change_pct > 0 ? '+' : ''}{item.change_pct.toFixed(1)}%
                      </span>
                      {ai && <span> · {AI_CLASSIFICATION_LABELS[ai.classification]}</span>}
                    </p>
                  </div>

                  {/* 빠른 액션 */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-xs border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300"
                      onClick={() => setOverride(key, { status: 'approved' })}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />승인
                    </Button>
                    <Select onValueChange={(v) => setOverride(key, { status: 'modified', classification: v as AiClassification })}>
                      <SelectTrigger className="h-7 w-28 text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300">
                        <SelectValue placeholder="수정..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(AI_CLASSIFICATION_LABELS).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setPendingPage((p) => p + 1)}
                className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 font-medium"
              >
                + {pendingItems.length - shownPending.length}건 더 보기
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 완료 항목 ── */}
      {doneItems.length > 0 && (
        <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <button
            onClick={() => setShowDone((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">검토 완료</span>
              <span className="rounded-full bg-green-100 dark:bg-green-900/40 px-2 py-0.5 text-xs font-bold text-green-700 dark:text-green-300">
                {doneItems.length}
              </span>
            </div>
            {showDone ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          {showDone && (
            <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {doneItems.map((item) => {
                const key = `${item.drug_id}__${item.hospital_code}`;
                const override = overrides.get(key)!;
                const isApproved = override.status === 'approved';
                return (
                  <div key={key} className="flex items-center gap-3 px-5 py-3">
                    <div className="shrink-0">
                      <SeverityBadge severity={item.severity} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">{item.drug_name || item.drug_id}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">{item.hospital_code}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-1 text-xs font-semibold text-green-700 dark:text-green-300">
                          <CheckCircle2 className="h-3 w-3" />승인됨
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                          <PenLine className="h-3 w-3" />
                          {AI_CLASSIFICATION_LABELS[(override as any).classification]}
                        </span>
                      )}
                      <button
                        onClick={() => removeOverride(key)}
                        className="text-xs text-gray-300 hover:text-red-400 dark:text-slate-600 dark:hover:text-red-400 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 전체 완료 메시지 */}
      {progress.pct === 100 && (
        <div className="flex flex-col items-center py-8 gap-2">
          <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          </div>
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">모든 항목 검토 완료!</p>
          <p className="text-xs text-gray-400 dark:text-slate-500">리포트 다운로드로 결과를 내보낼 수 있습니다.</p>
        </div>
      )}

    </div>
  );
}
