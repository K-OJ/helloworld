export interface PharmaData {
  drug_id: string;
  drug_name: string;
  hospital_code: string;
  prescription_volume: number;
  date: string;
}

export interface AnomalyResult {
  drug_id: string;
  drug_name: string;
  hospital_code: string;
  prev_volume: number | null;
  curr_volume: number | null;
  change_pct: number | null; // null = 누락된 항목
  is_missing: boolean;
}

const THRESHOLD = 30; // 30% 기준

export function analyzeData(
  prevData: PharmaData[],
  currData: PharmaData[]
): AnomalyResult[] {
  const prevMap = new Map<string, PharmaData>();
  const currMap = new Map<string, PharmaData>();

  for (const row of prevData) {
    const key = `${row.drug_id}__${row.hospital_code}`;
    const existing = prevMap.get(key);
    if (existing) {
      existing.prescription_volume += row.prescription_volume;
    } else {
      prevMap.set(key, { ...row });
    }
  }

  for (const row of currData) {
    const key = `${row.drug_id}__${row.hospital_code}`;
    const existing = currMap.get(key);
    if (existing) {
      existing.prescription_volume += row.prescription_volume;
    } else {
      currMap.set(key, { ...row });
    }
  }

  const results: AnomalyResult[] = [];

  // 전월 데이터 기준으로 순회 → 당월 누락 또는 변동 탐지
  for (const [key, prev] of prevMap.entries()) {
    const curr = currMap.get(key);

    if (!curr) {
      // 당월 데이터 누락
      results.push({
        drug_id: prev.drug_id,
        drug_name: prev.drug_name,
        hospital_code: prev.hospital_code,
        prev_volume: prev.prescription_volume,
        curr_volume: null,
        change_pct: null,
        is_missing: true,
      });
      continue;
    }

    const change_pct =
      prev.prescription_volume === 0
        ? 0
        : ((curr.prescription_volume - prev.prescription_volume) /
            prev.prescription_volume) *
          100;

    if (Math.abs(change_pct) >= THRESHOLD) {
      results.push({
        drug_id: prev.drug_id,
        drug_name: prev.drug_name,
        hospital_code: prev.hospital_code,
        prev_volume: prev.prescription_volume,
        curr_volume: curr.prescription_volume,
        change_pct,
        is_missing: false,
      });
    }
  }

  // 당월에 신규 추가된 항목(전월 없음)은 +100% 처리
  for (const [key, curr] of currMap.entries()) {
    if (!prevMap.has(key)) {
      results.push({
        drug_id: curr.drug_id,
        drug_name: curr.drug_name,
        hospital_code: curr.hospital_code,
        prev_volume: 0,
        curr_volume: curr.prescription_volume,
        change_pct: 100,
        is_missing: false,
      });
    }
  }

  // 누락 → 변동 큰 순서로 정렬
  results.sort((a, b) => {
    if (a.is_missing && !b.is_missing) return -1;
    if (!a.is_missing && b.is_missing) return 1;
    return Math.abs(b.change_pct ?? 0) - Math.abs(a.change_pct ?? 0);
  });

  return results;
}
