'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DataUploader from '@/components/DataUploader';
import { analyzeData, type PharmaData, type AnomalyResult } from '@/utils/compareData';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

function ChangePct({ result }: { result: AnomalyResult }) {
  if (result.is_missing) {
    return (
      <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-300">
        누락됨
      </span>
    );
  }
  const pct = result.change_pct ?? 0;
  const isPositive = pct > 0;
  return (
    <span className={`font-bold tabular-nums ${isPositive ? 'text-red-600' : 'text-blue-600'}`}>
      {isPositive ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}

export default function HomePage() {
  const [anomalies, setAnomalies] = useState<AnomalyResult[] | null>(null);

  function handleSubmit(prevData: PharmaData[], currData: PharmaData[]) {
    const results = analyzeData(prevData, currData);
    setAnomalies(results);
  }

  function handleReset() {
    setAnomalies(null);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            📊 Data Open Auto-QA Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            월간 제약 처방 데이터 정합성 자동 검수 시스템
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">

        {/* Upload Section */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-800">데이터 업로드</h2>
            <p className="mt-1 text-sm text-slate-500">
              전월과 당월 CSV 파일을 업로드하면 처방량 변동 이상치를 자동으로 탐지합니다.
              (변동률 ±30% 이상 / 누락 항목 포함)
            </p>
          </div>
          <DataUploader onSubmit={handleSubmit} />

          <div className="mt-4 rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700">
            <strong>샘플 데이터:</strong>{' '}
            <a href="/sample-data/baseline-sample.csv" download className="underline">전월 샘플</a>{' '}
            /{' '}
            <a href="/sample-data/target-sample.csv" download className="underline">당월 샘플</a>
          </div>
        </section>

        {/* Results Section */}
        {anomalies !== null && (
          <section className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">검수 결과</h2>
              <button
                onClick={handleReset}
                className="text-sm text-slate-400 hover:text-slate-600 underline"
              >
                초기화
              </button>
            </div>

            {anomalies.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <ShieldCheck className="h-12 w-12 text-emerald-400" />
                <p className="font-semibold text-emerald-600">이상치가 없습니다</p>
                <p className="text-sm text-slate-400">
                  모든 항목이 ±30% 범위 이내에 있습니다.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  <p className="text-sm text-amber-700">
                    총 <strong>{anomalies.length}건</strong>의 이상치가 발견됐습니다.
                    {anomalies.filter((a) => a.is_missing).length > 0 && (
                      <> (누락 <strong>{anomalies.filter((a) => a.is_missing).length}건</strong> 포함)</>
                    )}
                  </p>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <TableHead>약품명</TableHead>
                        <TableHead>약품코드</TableHead>
                        <TableHead>병원코드</TableHead>
                        <TableHead className="text-right">전월 처방량</TableHead>
                        <TableHead className="text-right">당월 처방량</TableHead>
                        <TableHead className="text-right">증감률</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {anomalies.map((row, idx) => (
                        <TableRow
                          key={idx}
                          className={row.is_missing ? 'bg-slate-50/70' : 'hover:bg-slate-50'}
                        >
                          <TableCell className="font-medium text-slate-800">
                            {row.drug_name || '-'}
                          </TableCell>
                          <TableCell className="text-xs text-slate-400">{row.drug_id}</TableCell>
                          <TableCell className="text-sm text-slate-600">{row.hospital_code}</TableCell>
                          <TableCell className="text-right tabular-nums text-slate-600">
                            {row.prev_volume !== null ? row.prev_volume.toLocaleString() : '-'}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-slate-600">
                            {row.is_missing ? (
                              <span className="text-slate-400 italic">-</span>
                            ) : (
                              row.curr_volume?.toLocaleString() ?? '-'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <ChangePct result={row} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
