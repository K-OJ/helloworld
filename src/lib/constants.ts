import type { Severity } from './types';

export const SEVERITY_THRESHOLDS = {
  WARNING: 30,  // 30% 이상 변동 시 warning
  DANGER: 50,   // 50% 이상 변동 시 danger
} as const;

export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const AI_BATCH_SIZE = 20;

export const REQUIRED_COLUMNS = [
  'drug_id',
  'drug_name',
  'hospital_code',
  'prescription_volume',
  'date',
] as const;

export const SEVERITY_COLORS: Record<Severity, string> = {
  normal: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  danger: 'bg-red-100 text-red-800 border-red-200',
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  normal: '정상',
  warning: '경고',
  danger: '위험',
};

export const AI_CLASSIFICATION_LABELS: Record<string, string> = {
  data_error: '데이터 오류',
  market_trend: '시장 트렌드',
  seasonal: '계절적 요인',
  policy_change: '정책 변경',
  unknown: '판단 불가',
};

/** 앱 전체 공통 설정 상수 (매직 넘버 제거용) */
export const APP_CONFIG = {
  /** Claude API 배치 처리 단위 */
  AI_BATCH_SIZE: 20,
  /** 업로드 허용 최대 파일 크기 (MB) */
  MAX_FILE_SIZE_MB: 50,
  /** 지원 파일 확장자 */
  SUPPORTED_FILE_TYPES: ['.csv', '.xlsx', '.xls'],
  /** AI 분석 최대 재시도 횟수 */
  AI_MAX_RETRY: 3,
  /** 재시도 기본 대기 시간 (ms) */
  AI_RETRY_DELAY_MS: 1000,
} as const;
