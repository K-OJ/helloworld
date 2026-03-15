/**
 * 에러 메시지 국제화(i18n) 딕셔너리
 * 현재 지원 언어: ko(한국어), en(영어)
 */

export const errorMessages = {
  ko: {
    fileTooLarge: '파일 크기가 50MB를 초과했습니다.',
    invalidFormat: '지원하지 않는 파일 형식입니다. CSV, XLSX, XLS 파일을 업로드해 주세요.',
    missingFile: '전월(baseline)과 당월(target) 파일을 모두 업로드해 주세요.',
    missingColumns: '필수 컬럼이 누락되었습니다. 컬럼 매핑을 확인해 주세요.',
    parseError: '파일을 파싱하는 중 오류가 발생했습니다.',
    emptyFile: '파일에 데이터가 없습니다.',
    networkError: '서버와 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    aiAnalysisFailed: 'AI 분석에 실패했습니다. 규칙 기반 결과로 대체합니다.',
    aiCreditExhausted: 'AI 크레딧이 부족합니다. 예측 데이터로 표시 중입니다.',
    unknownError: '알 수 없는 오류가 발생했습니다.',
    serverError: '서버 내부 오류가 발생했습니다.',
    invalidMapping: '컬럼 매핑 정보가 올바르지 않습니다.',
    missingRequiredFields: '필수 필드가 누락되었습니다.',
  },
  en: {
    fileTooLarge: 'File size exceeds 50MB.',
    invalidFormat: 'Unsupported file format. Please upload CSV, XLSX, or XLS files.',
    missingFile: 'Please upload both baseline (previous month) and target (current month) files.',
    missingColumns: 'Required columns are missing. Please check the column mapping.',
    parseError: 'An error occurred while parsing the file.',
    emptyFile: 'The file contains no data.',
    networkError: 'A network error occurred. Please try again later.',
    aiAnalysisFailed: 'AI analysis failed. Falling back to rule-based results.',
    aiCreditExhausted: 'AI credits exhausted. Showing predicted data.',
    unknownError: 'An unknown error occurred.',
    serverError: 'An internal server error occurred.',
    invalidMapping: 'Column mapping information is invalid.',
    missingRequiredFields: 'Required fields are missing.',
  },
} as const;

export type ErrorMessageKey = keyof typeof errorMessages.ko;
export type SupportedLocale = keyof typeof errorMessages;

/**
 * 지정된 키와 언어로 에러 메시지를 반환합니다.
 * @param key - 에러 메시지 키
 * @param lang - 언어 코드 (기본값: 'ko')
 */
export function getErrorMessage(
  key: ErrorMessageKey,
  lang: SupportedLocale = 'ko'
): string {
  return errorMessages[lang][key];
}
