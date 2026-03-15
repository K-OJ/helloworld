'use client';

import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileDropzone } from '@/components/upload/FileDropzone';
import { ColumnMapper } from '@/components/upload/ColumnMapper';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { AnomalyTable } from '@/components/dashboard/AnomalyTable';
import { AnomalyBarChart } from '@/components/dashboard/AnomalyBarChart';
import { ChangeChart } from '@/components/dashboard/ChangeChart';
import { AiInsightPanel } from '@/components/dashboard/AiInsightPanel';
import { FloatingChat } from '@/components/FloatingChat';
import { ReportDownloadButton } from '@/components/report/ReportDownloadButton';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useServerHealth } from '@/hooks/useServerHealth';
import { TopHeader } from '@/components/TopHeader';
import { readFileHeaders } from '@/lib/read-headers';
import type { AiAnalysisResult, AnomalyItem, ColumnMapping } from '@/lib/types';

type Step = 'upload' | 'mapping' | 'results';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

export default function DashboardPage() {
  const router = useRouter();
  const { isHealthy } = useServerHealth();

  function handleLogout() {
    document.cookie = 'autoqa_auth=; path=/; max-age=0';
    router.push('/login');
  }

  const {
    baselineFile, targetFile, setBaselineFile, setTargetFile,
    status, error, result, upload, reset,
  } = useFileUpload();

  const [step, setStep] = useState<Step>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [aiResults, setAiResults] = useState<Map<string, AiAnalysisResult>>(new Map());
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [analysisFailed, setAnalysisFailed] = useState(false);

  function handleAiResults(results: Map<string, AiAnalysisResult>) {
    setAiResults(results);
    setAnalysisFailed(results.size === 0);
  }

  function handleDemoModeChange(demo: boolean) {
    setIsDemoMode(demo);
    // demo 모드는 mock 데이터가 있으므로 analysisFailed는 건드리지 않음
  }

  async function handleNext() {
    if (!baselineFile) return;
    const h = await readFileHeaders(baselineFile);
    setHeaders(h);
    setStep('mapping');
  }

  async function handleMappingConfirm(mapping: ColumnMapping) {
    setStep('results');
    await upload(mapping);
  }

  function handleBack() {
    setStep('upload');
  }

  function handleReset() {
    reset();
    setStep('upload');
    setHeaders([]);
    setAiResults(new Map());
    setIsDemoMode(false);
    setAnalysisFailed(false);
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
        setAiResults((prev) => {
          const next = new Map(prev);
          next.set(key, r);
          next.set(r.drug_id, r);
          return next;
        });
      }
    } catch {
      // silent fail — user can retry again
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900">Auto-QA Dashboard</h1>
              <p className="hidden sm:block text-sm text-slate-500">월간 제약 데이터 정합성 AI 자동 검수</p>
            </div>
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              {isDemoMode && (
                <div
                  className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 cursor-default"
                  title="API 크레딧 제한으로 인해 현재 AI 분석 결과는 통제된 시나리오(Mock Data) 기반으로 제공됩니다."
                >
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Demo Mode Active
                </div>
              )}
              {(step === 'mapping' || step === 'results') && (
                <Button variant="outline" size="sm" onClick={handleReset}>
                  새로 검수하기
                </Button>
              )}
              <span
                title={isHealthy ? '서버 헬스체크 정상' : '서버 상태 확인 중'}
                className="hidden sm:flex items-center gap-1 text-xs text-slate-400"
              >
                <span className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-green-400' : 'bg-slate-300'}`} />
                {isHealthy ? '🟢 헬스체크 정상' : '확인 중'}
              </span>
              <TopHeader />
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-red-600">
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">데이터 업로드</h2>
              <p className="text-sm text-slate-500 mt-1">
                전월(기준) 데이터와 당월(검수 대상) 데이터를 업로드하면 자동으로 비교 분석합니다.
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <FileDropzone
                label="전월 데이터 (기준)"
                description="이전 달 처방 데이터를 업로드하세요"
                file={baselineFile}
                onFileSelect={setBaselineFile}
                disabled={false}
              />
              <FileDropzone
                label="당월 데이터 (검수 대상)"
                description="이번 달 배포 예정 데이터를 업로드하세요"
                file={targetFile}
                onFileSelect={setTargetFile}
                disabled={false}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleNext} disabled={!baselineFile || !targetFile} className="min-w-32">
                다음: 컬럼 매핑
              </Button>
              <span className="text-xs text-slate-400">CSV, XLSX, XLS 파일 지원 · 최대 50MB</span>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700">
              <strong>테스트용 샘플 데이터:</strong>{' '}
              <a href="/sample-data/baseline-sample.csv" download className="underline">전월 샘플</a>{' '}
              /{' '}
              <a href="/sample-data/target-sample.csv" download className="underline">당월 샘플</a>
            </div>
          </div>
        )}

        {/* Mapping Step */}
        {step === 'mapping' && (
          <ColumnMapper headers={headers} onConfirm={handleMappingConfirm} onBack={handleBack} />
        )}

        {/* Results Step */}
        {step === 'results' && (
          <div className="space-y-5">

            {/* Skeleton while loading */}
            {status === 'uploading' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <Skeleton className="h-6 w-40 mb-4" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
                  </div>
                </div>
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-96 rounded-2xl" />
              </div>
            )}

            {status === 'error' && error && (
              <div
                role="alert"
                aria-live="assertive"
                className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700"
              >
                <strong>오류:</strong> {error}
              </div>
            )}

            {result && (
              <>
                {/* Summary */}
                <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">검수 결과 요약</h2>
                  <SummaryCards
                    total={result.summary.total}
                    normal={result.summary.normal}
                    warning={result.summary.warning}
                    danger={result.summary.danger}
                    baselinePeriod={result.baseline_period}
                    targetPeriod={result.target_period}
                  />
                </motion.div>

                {(result.skipped_rows.baseline > 0 || result.skipped_rows.target > 0) && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
                    파싱 제외된 행: 전월 {result.skipped_rows.baseline}건, 당월 {result.skipped_rows.target}건
                    (약품 코드 누락 또는 비정상 처방량)
                  </div>
                )}

                {/* AI Analysis */}
                <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
                  <AiInsightPanel
                    items={result.items}
                    onResults={handleAiResults}
                    onDemoModeChange={handleDemoModeChange}
                  />
                </motion.div>

                {/* Detail Tabs */}
                <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible"
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">상세 검수 결과</h2>
                    <ReportDownloadButton uploadResult={result} aiResults={aiResults} />
                  </div>
                  <Tabs defaultValue="table">
                    <TabsList className="mb-4">
                      <TabsTrigger value="table">테이블 뷰</TabsTrigger>
                      <TabsTrigger value="chart">차트 뷰</TabsTrigger>
                    </TabsList>
                    <TabsContent value="table">
                      <div className="mb-6 rounded-xl border border-slate-100 bg-slate-50 p-4 overflow-x-auto">
                        <AnomalyBarChart items={result.items} />
                      </div>
                      <div className="overflow-x-auto">
                      <AnomalyTable
                        items={result.items}
                        aiResults={aiResults}
                        analysisFailed={analysisFailed}
                        isMock={isDemoMode}
                        onRetryItem={handleRetryItem}
                      />
                      </div>
                    </TabsContent>
                    <TabsContent value="chart">
                      <ChangeChart items={result.items} />
                    </TabsContent>
                  </Tabs>
                </motion.div>

                {/* Floating AI 챗봇 */}
                <FloatingChat items={result.items} aiResults={aiResults} />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
