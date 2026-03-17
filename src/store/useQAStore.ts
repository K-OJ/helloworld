/**
 * useQAStore — Zustand 기반 전역 상태 관리 스토어
 */

import { create } from 'zustand';
import type { AnomalyItem, AiAnalysisResult, UploadResult, Override } from '@/lib/types';

export type DashboardStep = 'upload' | 'mapping' | 'results';
export type AsyncStatus = 'idle' | 'uploading' | 'success' | 'error';

interface QAState {
  baselineFile: File | null;
  targetFile: File | null;
  headers: string[];
  step: DashboardStep;
  uploadResult: UploadResult | null;
  aiResults: Map<string, AiAnalysisResult>;
  analysisFailed: boolean;
  isDemoMode: boolean;
  overrides: Map<string, Override>;
  status: AsyncStatus;
  error: string | null;
  lang: 'ko' | 'en';

  setBaselineFile: (file: File | null) => void;
  setTargetFile: (file: File | null) => void;
  setHeaders: (headers: string[]) => void;
  setStep: (step: DashboardStep) => void;
  setUploadResult: (result: UploadResult | null) => void;
  setAiResults: (results: Map<string, AiAnalysisResult>) => void;
  updateAiResult: (key: string, result: AiAnalysisResult) => void;
  setAnalysisFailed: (failed: boolean) => void;
  setDemoMode: (demo: boolean) => void;
  setStatus: (status: AsyncStatus, error?: string) => void;
  setLang: (lang: 'ko' | 'en') => void;
  reset: () => void;

  setOverride: (key: string, override: Override) => void;
  removeOverride: (key: string) => void;
  clearOverrides: () => void;
}

const initialState = {
  baselineFile: null,
  targetFile: null,
  headers: [],
  step: 'upload' as DashboardStep,
  uploadResult: null,
  aiResults: new Map<string, AiAnalysisResult>(),
  analysisFailed: false,
  isDemoMode: false,
  overrides: new Map<string, Override>(),
  status: 'idle' as AsyncStatus,
  error: null,
  lang: 'ko' as 'ko' | 'en',
};

export const useQAStore = create<QAState>((set) => ({
  ...initialState,

  setBaselineFile: (file) => set({ baselineFile: file }),
  setTargetFile: (file) => set({ targetFile: file }),
  setHeaders: (headers) => set({ headers }),
  setStep: (step) => set({ step }),
  setUploadResult: (result) => set({ uploadResult: result }),
  setAiResults: (results) => set({ aiResults: results }),

  updateAiResult: (key, result) =>
    set((state) => {
      const next = new Map(state.aiResults);
      next.set(key, result);
      return { aiResults: next };
    }),

  setAnalysisFailed: (failed) => set({ analysisFailed: failed }),
  setDemoMode: (demo) => set({ isDemoMode: demo }),
  setStatus: (status, error = undefined) => set({ status, error }),
  setLang: (lang) => set({ lang }),

  reset: () => set({ ...initialState, aiResults: new Map(), overrides: new Map() }),

  setOverride: (key, override) =>
    set((state) => {
      const next = new Map(state.overrides);
      next.set(key, override);
      return { overrides: next };
    }),

  removeOverride: (key) =>
    set((state) => {
      const next = new Map(state.overrides);
      next.delete(key);
      return { overrides: next };
    }),

  clearOverrides: () => set({ overrides: new Map() }),
}));

export const selectAnomalies = (state: QAState): AnomalyItem[] =>
  state.uploadResult?.items.filter((i) => i.severity !== 'normal') ?? [];

export const selectFilesReady = (state: QAState): boolean =>
  state.baselineFile !== null && state.targetFile !== null;

export const selectReviewProgress = (state: QAState) => {
  const anomalies = state.uploadResult?.items.filter((i) => i.severity !== 'normal') ?? [];
  const total = anomalies.length;
  const reviewed = state.overrides.size;
  const approved = Array.from(state.overrides.values()).filter((o) => o.status === 'approved').length;
  const modified = Array.from(state.overrides.values()).filter((o) => o.status === 'modified').length;
  const pending = total - reviewed;
  const pct = total > 0 ? Math.round((reviewed / total) * 100) : 0;
  return { total, reviewed, approved, modified, pending, pct };
};
