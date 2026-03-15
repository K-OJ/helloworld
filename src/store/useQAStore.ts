/**
 * useQAStore — Zustand 기반 전역 상태 관리 스토어
 *
 * 대시보드 페이지에 분산된 검수 관련 상태를 중앙화하여
 * 컴포넌트 간 props drilling을 최소화합니다.
 *
 * @module useQAStore
 */

import { create } from 'zustand';
import type { AnomalyItem, AiAnalysisResult, UploadResult } from '@/lib/types';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

/** 대시보드 단계 */
export type DashboardStep = 'upload' | 'mapping' | 'results';

/** 비동기 처리 상태 */
export type AsyncStatus = 'idle' | 'uploading' | 'success' | 'error';

interface QAState {
  // ── 파일 상태 ──────────────────────────────────────────────
  /** 전월(기준) 파일 */
  baselineFile: File | null;
  /** 당월(검수 대상) 파일 */
  targetFile: File | null;
  /** 파일에서 읽어온 컬럼 헤더 목록 */
  headers: string[];

  // ── 대시보드 단계 ──────────────────────────────────────────
  /** 현재 대시보드 진행 단계 */
  step: DashboardStep;

  // ── 검수 결과 ──────────────────────────────────────────────
  /** 규칙 기반 검수 결과 (upload API 응답) */
  uploadResult: UploadResult | null;
  /** AI 분석 결과 맵 (key: drug_id 또는 drug_id__hospital_code) */
  aiResults: Map<string, AiAnalysisResult>;
  /** AI 분석 실패 여부 */
  analysisFailed: boolean;
  /** Demo(Mock) 모드 활성화 여부 */
  isDemoMode: boolean;

  // ── 비동기 상태 ────────────────────────────────────────────
  /** 업로드/분석 처리 상태 */
  status: AsyncStatus;
  /** 에러 메시지 */
  error: string | null;

  // ── 액션 ──────────────────────────────────────────────────
  /** 전월 파일 설정 */
  setBaselineFile: (file: File | null) => void;
  /** 당월 파일 설정 */
  setTargetFile: (file: File | null) => void;
  /** 컬럼 헤더 설정 */
  setHeaders: (headers: string[]) => void;
  /** 대시보드 단계 전환 */
  setStep: (step: DashboardStep) => void;
  /** 업로드 결과 저장 */
  setUploadResult: (result: UploadResult | null) => void;
  /** AI 분석 결과 단건 추가 또는 일괄 설정 */
  setAiResults: (results: Map<string, AiAnalysisResult>) => void;
  /** AI 분석 결과 단건 업데이트 (재분석 시) */
  updateAiResult: (key: string, result: AiAnalysisResult) => void;
  /** 분석 실패 플래그 설정 */
  setAnalysisFailed: (failed: boolean) => void;
  /** Demo 모드 토글 */
  setDemoMode: (demo: boolean) => void;
  /** 처리 상태 설정 */
  setStatus: (status: AsyncStatus, error?: string) => void;
  /** 전체 상태 초기화 (새로 검수하기) */
  reset: () => void;
}

// ────────────────────────────────────────────────────────────
// Initial State
// ────────────────────────────────────────────────────────────

const initialState = {
  baselineFile: null,
  targetFile: null,
  headers: [],
  step: 'upload' as DashboardStep,
  uploadResult: null,
  aiResults: new Map<string, AiAnalysisResult>(),
  analysisFailed: false,
  isDemoMode: false,
  status: 'idle' as AsyncStatus,
  error: null,
};

// ────────────────────────────────────────────────────────────
// Store
// ────────────────────────────────────────────────────────────

/**
 * Auto-QA 대시보드 전역 상태 스토어
 *
 * @example
 * ```tsx
 * const { uploadResult, setStep } = useQAStore();
 * ```
 */
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

  setStatus: (status, error = null) => set({ status, error }),

  reset: () => set({ ...initialState, aiResults: new Map() }),
}));

// ────────────────────────────────────────────────────────────
// Selectors (파생 상태)
// ────────────────────────────────────────────────────────────

/** 이상치 항목만 추출 (severity !== 'normal') */
export const selectAnomalies = (state: QAState): AnomalyItem[] =>
  state.uploadResult?.items.filter((i) => i.severity !== 'normal') ?? [];

/** 두 파일이 모두 선택되었는지 확인 */
export const selectFilesReady = (state: QAState): boolean =>
  state.baselineFile !== null && state.targetFile !== null;
