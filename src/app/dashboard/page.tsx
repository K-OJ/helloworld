// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
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
import { SeverityDonutChart } from '@/components/dashboard/SeverityDonutChart';
import { HospitalRankChart } from '@/components/dashboard/HospitalRankChart';
import { VolumeScatterChart } from '@/components/dashboard/VolumeScatterChart';
import { AiClassificationChart } from '@/components/dashboard/AiClassificationChart';
import { FloatingChat } from '@/components/FloatingChat';
import { ReportDownloadButton } from '@/components/report/ReportDownloadButton';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useServerHealth } from '@/hooks/useServerHealth';
import { useLang } from '@/hooks/useLang';
import { useQAStore } from '@/store/useQAStore';
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
  const { t } = useLang();
  const { setUploadResult, setAiResults: syncAiResults, setAnalysisFailed: syncAnalysisFailed, setDemoMode: syncDemoMode } = useQAStore();

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

  // useFileUpload result → Zustand 스토어 동기화 (AnomalyTable이 스토어에서 직접 구독)
  useEffect(() => {
    if (result) setUploadResult(result);
  }, [result]);

  function handleAiResults(results: Map<string, AiAnalysisResult>) {
    setAiResults(results);
    setAnalysisFailed(results.size === 0);
    syncAiResults(results);
    syncAnalysisFailed(results.size === 0);
  }

  function handleDemoModeChange(demo: boolean) {
    setIsDemoMode(demo);
    syncDemoMode(demo);
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-slate-100">{t.appTitle}</h1>
              <p className="hidden sm:block text-sm text-slate-500 dark:text-slate-400">{t.appDesc}</p>
            </div>
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              {isDemoMode && (
                <div
                  className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 cursor-default dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  title="API 크레딧 제한으로 인해 현재 AI 분석 결과는 통제된 시나리오(Mock Data) 기반으로 제공됩니다."
                >
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse dark:bg-emerald-400" />
                  {t.demoModeLabel}
                </div>
              )}
              {(step === 'mapping' || step === 'results') && (
                <Button variant="outline" size="sm" onClick={handleReset}>
                  {t.newAnalysis}
                </Button>
              )}
              <span
                title={isHealthy ? '서버 헬스체크 정상' : '서버 상태 확인 중'}
                className="hidden sm:flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500"
              >
                <span className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-green-400' : 'bg-slate-300'}`} />
                {isHealthy ? t.healthOk : t.healthChecking}
              </span>
              <TopHeader />
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-red-600">
                {t.logout}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 dark:border-slate-700 dark:bg-slate-800">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200">{t.uploadTitle}</h2>
              <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">{t.uploadDesc}</p>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <FileDropzone
                label={t.baselineLabel}
                description={t.baselineDesc}
                file={baselineFile}
                onFileSelect={setBaselineFile}
                disabled={false}
              />
              <FileDropzone
                label={t.targetLabel}
                description={t.targetDesc}
                file={targetFile}
                onFileSelect={setTargetFile}
                disabled={false}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleNext} disabled={!baselineFile || !targetFile} className="min-w-32">
                {t.nextButton}
              </Button>
              <span className="text-xs text-slate-400 dark:text-slate-500">{t.fileHint}</span>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
              <strong>{t.sampleDataLabel}</strong>{' '}
              <a href="/sample-data/baseline-sample.csv" download className="underline">{t.baselineSample}</a>{' '}
              /{' '}
              <a href="/sample-data/target-sample.csv" download className="underline">{t.targetSample}</a>
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
                className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
              >
                <strong>오류:</strong> {error}
              </div>
            )}

            {result && (
              <>
                {/* Summary */}
                <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 dark:text-slate-200">{t.summaryTitle}</h2>
                  <SummaryCards
                    total={result.summary.total}
                    normal={result.summary.normal}
                    warning={result.summary.warning}
                    danger={result.summary.danger}
                    baselinePeriod={result.baseline_period}
                    targetPeriod={result.target_period}
                    prevLabel={t.prevLabel}
                    currLabel={t.currLabel}
                    totalLabel={t.totalItems}
                    normalLabel={t.statusNormal}
                    warningLabel={t.statusWarning}
                    dangerLabel={t.statusDanger}
                  />
                  <div className="mt-4">
                    <SeverityDonutChart
                      total={result.summary.total}
                      normal={result.summary.normal}
                      warning={result.summary.warning}
                      danger={result.summary.danger}
                    />
                  </div>
                </motion.div>

                {(result.skipped_rows.baseline > 0 || result.skipped_rows.target > 0) && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300">
                    {t.skippedRows.replace('{baseline}', String(result.skipped_rows.baseline)).replace('{target}', String(result.skipped_rows.target))}
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
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200">{t.detailTitle}</h2>
                    <ReportDownloadButton uploadResult={result} aiResults={aiResults} />
                  </div>
                  <Tabs defaultValue="table">
                    <TabsList className="mb-4">
                      <TabsTrigger value="table">{t.tableView}</TabsTrigger>
                      <TabsTrigger value="chart">{t.chartView}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="table">
                      <div className="mb-6 rounded-xl border border-slate-100 bg-slate-50 p-4 overflow-x-auto dark:border-slate-700 dark:bg-slate-800/50">
                        <AnomalyBarChart items={result.items} />
                      </div>
                      <AnomalyTable />
                    </TabsContent>
                    <TabsContent value="chart">
                      <div className="space-y-6">
                        {/* 병원별 이상 건수 */}
                        <HospitalRankChart items={result.items} />

                        {/* 처방량 vs 변동률 산포도 */}
                        <VolumeScatterChart items={result.items} />

                        {/* AI 원인 분류 결과 (AI 분석 완료 시에만 표시) */}
                        <AiClassificationChart />

                        {/* 변동률 상위 20 가로바 */}
                        <div className="rounded-xl border bg-white p-5 dark:bg-slate-800 dark:border-slate-700">
                          <ChangeChart items={result.items} />
                        </div>
                      </div>
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
