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
  SUPPORTED_EXTENSIONS: ['.csv', '.xlsx', '.xls'],
  /** AI 분석 최대 재시도 횟수 */
  AI_MAX_RETRY: 3,
  /** 재시도 기본 대기 시간 (ms) */
  AI_RETRY_DELAY_MS: 1000,
} as const;

/**
 * @architecture_note
 * 현재 MVP 단계에서는 글로벌 표준인 영문(en) 단일 언어 서비스만 제공합니다.
 * 단, 본 i18n 객체 구조는 향후 UN 가입 193개국 전체의 다국어(Locale)를
 * O(1) 시간 복잡도로 매핑하고 즉시 확장할 수 있도록 설계되었습니다.
 */
export const errorMessages = {
  en: {
    fileTooLarge: 'File size exceeds the 50MB limit.',
    invalidFormat: 'Unsupported file format. Please upload CSV or Excel (.xlsx, .xls).',
    apiTimeout: 'AI analysis timeout. Please try again.',
    analysisFailed: 'Failed to analyze data context.',
    missingColumns: 'Required columns are missing. Please check the column mapping.',
    emptyFile: 'The file contains no data.',
    parseError: 'An error occurred while parsing the file.',
    serverError: 'An internal server error occurred.',
  },
} as const;

export type SupportedLanguage = keyof typeof errorMessages;
export type ErrorKey = keyof typeof errorMessages['en'];

/**
 * i18n 에러 메시지 조회 함수
 * @param key - 에러 메시지 키
 * @param lang - 언어 코드 (기본값: 'en')
 */
export const getErrorMessage = (key: ErrorKey, lang: SupportedLanguage = 'en'): string => {
  return errorMessages[lang][key];
};
