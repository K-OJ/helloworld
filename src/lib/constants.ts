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
