import type { PrescriptionRecord, AnomalyItem, Severity } from './types';
import { SEVERITY_THRESHOLDS } from './constants';

interface AggregatedEntry {
  drug_id: string;
  drug_name: string;
  hospital_code: string;
  volume: number;
}

function aggregateByKey(records: PrescriptionRecord[]): Map<string, AggregatedEntry> {
  const map = new Map<string, AggregatedEntry>();
  for (const r of records) {
    const key = `${r.drug_id}__${r.hospital_code}`;
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

export function extractPeriod(records: PrescriptionRecord[]): string {
  const dates = records.map((r) => r.date).filter(Boolean);
  if (dates.length === 0) return '알 수 없음';
  const unique = [...new Set(dates)].sort();
  return unique[0] === unique[unique.length - 1] ? unique[0] : `${unique[0]} ~ ${unique[unique.length - 1]}`;
}
