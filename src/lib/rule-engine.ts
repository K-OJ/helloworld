import type { PrescriptionRecord, AnomalyItem, Severity } from './types';
import { SEVERITY_THRESHOLDS } from './constants';

interface AggregatedEntry {
  drug_id: string;
  drug_name: string;
  hospital_code: string;
  volume: number;
}

/**
 * 처방 레코드 배열을 (약품ID + 병원코드) 복합 키로 집계합니다.
 *
 * 동일 키의 레코드가 여러 개인 경우(일별 데이터를 월별로 합산하는 등)
 * prescription_volume을 누적 합산하여 월간 총 처방량을 구합니다.
 *
 * @param records - 파싱된 처방 레코드 배열
 * @returns 복합 키를 기준으로 집계된 Map
 */
// 선택된 필드만 키에 포함 (미선택 시 빈 문자열 → 해당 컬럼 제외)
function makeKey(r: PrescriptionRecord): string {
  const parts: string[] = [];
  if (r.drug_id)       parts.push(`d:${r.drug_id}`);
  if (r.hospital_code) parts.push(`h:${r.hospital_code}`);
  return parts.length > 0 ? parts.join('__') : 'all';
}

function aggregateByKey(records: PrescriptionRecord[]): Map<string, AggregatedEntry> {
  const map = new Map<string, AggregatedEntry>();
  for (const r of records) {
    const key = makeKey(r);
    const existing = map.get(key);
    if (existing) {
      existing.volume += r.prescription_volume;
    } else {
      map.set(key, {
        drug_id: r.drug_id,
        drug_name: r.drug_name,
        hospital_code: r.hospital_code,
        volume: r.prescription_volume,
      });
    }
  }
  return map;
}

/**
 * 처방량 변동률과 절대량을 기반으로 이상치 심각도를 분류합니다.
 *
 * ## 임계값 근거
 *
 * - **WARNING (30%)**: 국내 제약업계에서 통상적으로 ±30% 이상 변동을 '주의 관찰' 기준으로
 *   사용합니다. 계절성·시장 변화 등 자연 변동이 대부분 이 범위 이내에서 발생하므로,
 *   30% 초과 시 추가 검토가 필요한 수준으로 간주합니다.
 *
 * - **DANGER (50%)**: ±50% 이상은 단순 시장 변화로 설명하기 어려운 극단적 변동으로,
 *   데이터 오류·급여 기준 대폭 변경·거래 중단 등 즉각 확인이 필요한 수준입니다.
 *   건강보험심사평가원의 처방 모니터링 기준과도 유사한 수준입니다.
 *
 * ## 분류 규칙 (우선순위 순)
 *
 * 1. baseline > 0 && target === 0 → `danger` (처방 완전 소멸)
 * 2. |변동률| >= 50% → `danger`
 * 3. |변동률| >= 30% → `warning`
 * 4. 그 외 → `normal`
 *
 * @param change_pct - 전월 대비 처방량 변동률 (%)
 * @param baseline_volume - 전월 처방량
 * @param target_volume - 당월 처방량
 * @returns 심각도 및 트리거된 규칙명
 */
function classifySeverity(change_pct: number, baseline_volume: number, target_volume: number): { severity: Severity; rule_triggered: string } {
  if (baseline_volume > 0 && target_volume === 0) {
    return { severity: 'danger', rule_triggered: 'volume_dropped_to_zero' };
  }
  const abs_pct = Math.abs(change_pct);
  if (abs_pct >= SEVERITY_THRESHOLDS.DANGER) {
    return { severity: 'danger', rule_triggered: change_pct > 0 ? 'volume_increase_gt_50' : 'volume_decrease_gt_50' };
  }
  if (abs_pct >= SEVERITY_THRESHOLDS.WARNING) {
    return { severity: 'warning', rule_triggered: change_pct > 0 ? 'volume_increase_gt_30' : 'volume_decrease_gt_30' };
  }
  return { severity: 'normal', rule_triggered: 'within_normal_range' };
}

/**
 * 규칙 기반 처방량 이상치 탐지 엔진의 메인 함수입니다.
 *
 * ## 처리 흐름
 * 1. 전월(baseline)과 당월(target) 레코드를 각각 약품ID+병원코드로 집계
 * 2. 두 집계 맵의 합집합 키를 순회
 * 3. 각 키에 대해 변동률 계산 및 심각도 분류
 * 4. 절대 변동량 기준 내림차순 정렬 (검수 우선순위 반영)
 *
 * ## 신규 항목 처리
 * - 전월에 없고 당월에만 존재하는 항목은 `warning / new_item`으로 분류합니다.
 *   (신규 거래처 또는 신규 약품일 수 있으므로 자동 위험 분류 대신 경고로 처리)
 *
 * @param baseline - 전월(기준) 처방 레코드 배열
 * @param target - 당월(검수 대상) 처방 레코드 배열
 * @returns 이상치 항목 배열 (절대 변동량 내림차순 정렬)
 */
export function runRuleEngine(
  baseline: PrescriptionRecord[],
  target: PrescriptionRecord[]
): AnomalyItem[] {
  const baselineMap = aggregateByKey(baseline);
  const targetMap = aggregateByKey(target);

  const allKeys = new Set([...baselineMap.keys(), ...targetMap.keys()]);
  const results: AnomalyItem[] = [];

  for (const key of allKeys) {
    const b = baselineMap.get(key);
    const t = targetMap.get(key);

    const drug_id = (b ?? t)!.drug_id;
    const drug_name = (b ?? t)!.drug_name;
    const hospital_code = (b ?? t)!.hospital_code;
    const baseline_volume = b?.volume ?? 0;
    const target_volume = t?.volume ?? 0;

    let change_pct: number;
    if (baseline_volume === 0 && target_volume > 0) {
      // New item — treat as 100% increase
      change_pct = 100;
    } else if (baseline_volume === 0) {
      change_pct = 0;
    } else {
      change_pct = ((target_volume - baseline_volume) / baseline_volume) * 100;
    }

    const absolute_change = target_volume - baseline_volume;

    let severity: Severity;
    let rule_triggered: string;

    if (!b) {
      // New item in target only
      severity = 'warning';
      rule_triggered = 'new_item';
    } else {
      const classified = classifySeverity(change_pct, baseline_volume, target_volume);
      severity = classified.severity;
      rule_triggered = classified.rule_triggered;
    }

    results.push({
      drug_id,
      drug_name,
      hospital_code,
      baseline_volume,
      target_volume,
      change_pct,
      absolute_change,
      severity,
      rule_triggered,
    });
  }

  // Sort by absolute change descending
  results.sort((a, b) => Math.abs(b.absolute_change) - Math.abs(a.absolute_change));

  return results;
}

/**
 * 처방 레코드 배열에서 기간 정보를 추출합니다.
 *
 * `date` 필드의 고유값 중 최솟값과 최댓값을 반환합니다.
 * 단일 기간인 경우 해당 값만 반환하고, 범위인 경우 "시작 ~ 끝" 형식으로 반환합니다.
 *
 * @param records - 처방 레코드 배열
 * @returns 기간 문자열 (예: "2025-12" 또는 "2025-01 ~ 2025-03")
 */
export function extractPeriod(records: PrescriptionRecord[]): string {
  const dates = records.map((r) => r.date).filter(Boolean);
  if (dates.length === 0) return '알 수 없음';
  const unique = [...new Set(dates)].sort();
  return unique[0] === unique[unique.length - 1] ? unique[0] : `${unique[0]} ~ ${unique[unique.length - 1]}`;
}
