import type { ColumnMapping } from './types';

/** 각 필드별 인식 키워드 목록 (소문자, 공백/특수문자 제거 기준) */
const FIELD_KEYWORDS: Record<keyof ColumnMapping, string[]> = {
  drug_id: [
    'drug_id', 'drugid', 'drug_code', 'drugcode',
    '약품코드', '품목코드', '의약품코드', '약코드', '약품번호', '품목번호', '약번호', '코드',
  ],
  drug_name: [
    'drug_name', 'drugname',
    '약품명', '품목명', '의약품명', '약품이름', '품목이름', '약명', '제품명',
  ],
  hospital_code: [
    'hospital_code', 'hospitalcode', 'hospital',
    '병원코드', '요양기관번호', '기관코드', '요양기관코드', '병원번호', '기관번호', '요양번호', '요양기관', '기관',
  ],
  prescription_volume: [
    'prescription_volume', 'prescriptionvolume', 'volume', 'qty', 'quantity', 'count',
    '처방량', '처방건수', '처방수량', '처방횟수', '투약량', '처방', '수량', '건수',
  ],
  date: [
    'date', 'yyyymm', 'yearmonth',
    '날짜', '기준년월', '기준월', '년월', '연월', '기간', '년도월', '월', '기준일자',
  ],
};

/** 컬럼명을 정규화 (소문자 + 공백·특수문자 제거) */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s_\-\.]/g, '');
}

/**
 * 파일 헤더 목록을 받아 각 필드에 가장 적합한 컬럼을 추천합니다.
 *
 * 1순위: 정확히 일치하는 키워드
 * 2순위: 키워드를 포함하는 컬럼명
 *
 * @param headers - 파일에서 읽어온 컬럼명 배열
 * @returns 추천 매핑 (매칭 실패 시 해당 필드 빈 문자열)
 */
export function suggestMapping(headers: string[]): Partial<ColumnMapping> {
  const result: Partial<ColumnMapping> = {};

  for (const [field, keywords] of Object.entries(FIELD_KEYWORDS) as [keyof ColumnMapping, string[]][]) {
    // 1순위: 정확히 일치
    const exact = headers.find((h) =>
      keywords.some((kw) => normalize(h) === normalize(kw))
    );
    if (exact) {
      result[field] = exact;
      continue;
    }

    // 2순위: 포함 관계
    const partial = headers.find((h) =>
      keywords.some((kw) => normalize(h).includes(normalize(kw)) || normalize(kw).includes(normalize(h)))
    );
    if (partial) {
      result[field] = partial;
    }
  }

  return result;
}
