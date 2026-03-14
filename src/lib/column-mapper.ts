/**
 * column-mapper.ts
 *
 * 업로드 파일의 컬럼명을 시스템 표준 키로 자동 매핑합니다.
 *
 * 파이프라인:
 * 1. heuristicMap - 동의어 사전으로 1차 매핑
 * 2. aiMap - 미매핑 컬럼에 대해 Claude AI로 2차 매핑 (fallback)
 * 3. autoMapColumns - 두 단계를 통합하여 표준화된 데이터 배열 반환
 *
 * NOTE: 시스템 내부에서 약품 코드 키는 `drug_id`로 통일합니다.
 *       (기획 문서의 `drug_code`는 `drug_id`의 별칭)
 */

/** 시스템 표준 키 */
export type TargetKey =
  | 'hospital_code'
  | 'date'
  | 'drug_id'
  | 'drug_name'
  | 'prescription_volume';

/** 각 표준 키별 동의어 목록 (정규화 전 원본) */
const HEURISTIC_DICT: Record<TargetKey, string[]> = {
  hospital_code: [
    '병원ID', '병원코드', '요양기관기호', '요양기관번호', '요양기관코드',
    '기관코드', '기관번호', '병원번호', '요양번호', '요양기관',
    'hospitalid', 'hospital_code', 'hospitalcode', 'hospital',
  ],
  date: [
    'MONTHID', '기준월', '년월', '기준년월', '연월', '기간', '년도월', '월', '기준일자',
    'date', 'month', 'yyyymm', 'yearmonth',
  ],
  drug_id: [
    '표준코드', '약품코드', '의약품코드', '품목코드', '단축코드',
    '약코드', '약품번호', '품목번호', '약번호',
    'drug_code', 'drugcode', 'drug_id', 'drugid',
  ],
  drug_name: [
    '약품이름', '약품명', '제품명', '품목명', '의약품명', '품목이름', '약명',
    'drug_name', 'drugname',
  ],
  prescription_volume: [
    '판매금액sum', '처방수량', '판매금액', '수량', '처방량', '처방건수',
    '처방횟수', '투약량', '처방', '건수',
    'qty', 'volume', 'quantity', 'count',
    'prescription_volume', 'prescriptionvolume',
  ],
};

/** 컬럼명 정규화: 소문자 + 공백·특수문자 제거 */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s_\-\.]/g, '');
}

/**
 * 규칙 기반(동의어 사전) 컬럼 매핑
 *
 * @param columns - 파일에서 추출한 컬럼명 배열
 * @returns `{ 원본컬럼명: TargetKey }` 형태의 매핑 결과 (미매핑 컬럼은 포함 안 됨)
 */
export function heuristicMap(columns: string[]): Record<string, TargetKey> {
  const result: Record<string, TargetKey> = {};
  const assignedTargets = new Set<TargetKey>();

  for (const col of columns) {
    const normCol = normalize(col);

    for (const [target, synonyms] of Object.entries(HEURISTIC_DICT) as [TargetKey, string[]][]) {
      if (assignedTargets.has(target)) continue;

      // 1순위: 정확히 일치
      const exactMatch = synonyms.some((s) => normalize(s) === normCol);
      if (exactMatch) {
        result[col] = target;
        assignedTargets.add(target);
        break;
      }
    }
  }

  // 2순위: 포함 관계 (1순위 미매핑 컬럼만)
  for (const col of columns) {
    if (result[col]) continue;
    const normCol = normalize(col);

    for (const [target, synonyms] of Object.entries(HEURISTIC_DICT) as [TargetKey, string[]][]) {
      if (assignedTargets.has(target)) continue;

      const partialMatch = synonyms.some(
        (s) => normCol.includes(normalize(s)) || normalize(s).includes(normCol)
      );
      if (partialMatch) {
        result[col] = target;
        assignedTargets.add(target);
        break;
      }
    }
  }

  return result;
}

/**
 * AI 기반 컬럼 매핑 (fallback)
 *
 * 동의어 사전에 없는 생소한 컬럼명이 있을 때 /api/map-columns 엔드포인트를 호출합니다.
 *
 * @param unmappedColumns - 아직 매핑되지 않은 컬럼명 배열
 * @param sampleData - 컨텍스트용 샘플 데이터 (상위 3행 권장)
 * @returns `{ 원본컬럼명: TargetKey }` 형태의 추가 매핑 결과
 */
export async function aiMap(
  unmappedColumns: string[],
  sampleData: Record<string, unknown>[]
): Promise<Record<string, TargetKey>> {
  if (unmappedColumns.length === 0) return {};

  try {
    const res = await fetch('/api/map-columns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unmappedColumns, sampleData }),
    });

    if (!res.ok) return {};
    const data = await res.json();
    return (data.mapping ?? {}) as Record<string, TargetKey>;
  } catch {
    return {};
  }
}

/**
 * 컬럼 자동 매핑 통합 파이프라인
 *
 * 1. 입력 데이터의 컬럼명을 heuristicMap으로 1차 매핑
 * 2. 미매핑 컬럼이 있으면 aiMap으로 2차 매핑
 * 3. 원본 데이터를 순회하며 키를 표준 키로 교체한 mappedData 반환
 *
 * @param data - CSV/Excel 파싱 결과 (row 배열, 각 row는 `{ 원본컬럼: 값 }`)
 * @returns `{ mappedData, mapping }` - 표준화된 데이터 배열과 최종 매핑 정보
 */
export async function autoMapColumns(data: Record<string, unknown>[]): Promise<{
  mappedData: Record<string, unknown>[];
  mapping: Record<string, TargetKey>;
}> {
  if (data.length === 0) return { mappedData: [], mapping: {} };

  const columns = Object.keys(data[0]);

  // 1차: 휴리스틱 매핑
  const mapping = heuristicMap(columns);

  // 2차: 미매핑 컬럼 AI 처리
  const unmapped = columns.filter((c) => !mapping[c]);
  if (unmapped.length > 0) {
    const aiResult = await aiMap(unmapped, data.slice(0, 3));
    Object.assign(mapping, aiResult);
  }

  // 표준 키로 교체된 새 데이터 배열 생성
  const mappedData = data.map((row) => {
    const newRow: Record<string, unknown> = {};
    for (const [origKey, value] of Object.entries(row)) {
      const targetKey = mapping[origKey];
      newRow[targetKey ?? origKey] = value;
    }
    return newRow;
  });

  return { mappedData, mapping };
}
