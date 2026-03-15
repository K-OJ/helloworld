import { describe, it, expect } from 'vitest';
import { runRuleEngine, extractPeriod } from '@/lib/rule-engine';
import type { PrescriptionRecord } from '@/lib/types';

function rec(drug_id: string, hospital_code: string, volume: number, date = '2025-12'): PrescriptionRecord {
  return { drug_id, drug_name: `약품_${drug_id}`, hospital_code, prescription_volume: volume, date };
}

// ─────────────────────────────────────────────
// 심각도 분류
// ─────────────────────────────────────────────
describe('runRuleEngine - 심각도 분류', () => {
  it('변동 없음 → normal', () => {
    const result = runRuleEngine([rec('D001', 'H001', 100)], [rec('D001', 'H001', 100)]);
    expect(result[0].severity).toBe('normal');
    expect(result[0].rule_triggered).toBe('within_normal_range');
  });

  it('29% 증가 → normal', () => {
    const result = runRuleEngine([rec('D001', 'H001', 100)], [rec('D001', 'H001', 129)]);
    expect(result[0].severity).toBe('normal');
  });

  it('30% 정확히 → warning (경계값)', () => {
    const result = runRuleEngine([rec('D001', 'H001', 100)], [rec('D001', 'H001', 130)]);
    expect(result[0].severity).toBe('warning');
    expect(result[0].rule_triggered).toBe('volume_increase_gt_30');
  });

  it('35% 증가 → warning', () => {
    const result = runRuleEngine([rec('D001', 'H001', 100)], [rec('D001', 'H001', 135)]);
    expect(result[0].severity).toBe('warning');
  });

  it('50% 정확히 → danger (경계값)', () => {
    const result = runRuleEngine([rec('D001', 'H001', 100)], [rec('D001', 'H001', 150)]);
    expect(result[0].severity).toBe('danger');
    expect(result[0].rule_triggered).toBe('volume_increase_gt_50');
  });

  it('60% 증가 → danger', () => {
    const result = runRuleEngine([rec('D001', 'H001', 100)], [rec('D001', 'H001', 160)]);
    expect(result[0].severity).toBe('danger');
  });

  it('35% 감소 → warning', () => {
    const result = runRuleEngine([rec('D001', 'H001', 100)], [rec('D001', 'H001', 65)]);
    expect(result[0].severity).toBe('warning');
    expect(result[0].rule_triggered).toBe('volume_decrease_gt_30');
  });

  it('55% 감소 → danger', () => {
    const result = runRuleEngine([rec('D001', 'H001', 100)], [rec('D001', 'H001', 45)]);
    expect(result[0].severity).toBe('danger');
    expect(result[0].rule_triggered).toBe('volume_decrease_gt_50');
  });

  it('처방량 0으로 소멸 → danger (volume_dropped_to_zero)', () => {
    const result = runRuleEngine([rec('D001', 'H001', 100)], [rec('D001', 'H001', 0)]);
    expect(result[0].severity).toBe('danger');
    expect(result[0].rule_triggered).toBe('volume_dropped_to_zero');
  });
});

// ─────────────────────────────────────────────
// 신규 항목
// ─────────────────────────────────────────────
describe('runRuleEngine - 신규 항목', () => {
  it('전월 없고 당월에만 존재 → warning (new_item)', () => {
    const result = runRuleEngine([], [rec('NEW1', 'H001', 50)]);
    expect(result[0].severity).toBe('warning');
    expect(result[0].rule_triggered).toBe('new_item');
    expect(result[0].baseline_volume).toBe(0);
    expect(result[0].target_volume).toBe(50);
  });

  it('전월에만 존재하고 당월 없음 → danger (volume_dropped_to_zero)', () => {
    const result = runRuleEngine([rec('D001', 'H001', 100)], []);
    expect(result[0].severity).toBe('danger');
    expect(result[0].rule_triggered).toBe('volume_dropped_to_zero');
  });
});

// ─────────────────────────────────────────────
// 처방량 집계 (동일 키 여러 행)
// ─────────────────────────────────────────────
describe('runRuleEngine - 집계', () => {
  it('같은 약품+병원 레코드 여러 개 → 합산', () => {
    const baseline = [rec('D001', 'H001', 40), rec('D001', 'H001', 60)]; // 합계 100
    const target = [rec('D001', 'H001', 100)];
    const result = runRuleEngine(baseline, target);
    expect(result[0].baseline_volume).toBe(100);
    expect(result[0].severity).toBe('normal');
  });

  it('변동률 계산: (target - baseline) / baseline * 100', () => {
    const result = runRuleEngine([rec('D001', 'H001', 200)], [rec('D001', 'H001', 250)]);
    expect(result[0].change_pct).toBeCloseTo(25);
    expect(result[0].absolute_change).toBe(50);
  });
});

// ─────────────────────────────────────────────
// 정렬
// ─────────────────────────────────────────────
describe('runRuleEngine - 정렬', () => {
  it('절대 변동량 내림차순 정렬', () => {
    const baseline = [rec('D001', 'H001', 100), rec('D002', 'H001', 100)];
    const target = [rec('D001', 'H001', 200), rec('D002', 'H001', 160)]; // 변동: 100, 60
    const result = runRuleEngine(baseline, target);
    expect(result[0].drug_id).toBe('D001'); // 더 큰 변동
    expect(result[1].drug_id).toBe('D002');
  });
});

// ─────────────────────────────────────────────
// extractPeriod
// ─────────────────────────────────────────────
describe('extractPeriod', () => {
  it('빈 배열 → 알 수 없음', () => {
    expect(extractPeriod([])).toBe('알 수 없음');
  });

  it('단일 날짜 → 해당 값 반환', () => {
    expect(extractPeriod([rec('D1', 'H1', 10, '2025-12')])).toBe('2025-12');
  });

  it('여러 날짜 → min ~ max 범위 반환', () => {
    const records = [
      rec('D1', 'H1', 10, '2025-01'),
      rec('D2', 'H2', 10, '2025-03'),
      rec('D3', 'H3', 10, '2025-02'),
    ];
    expect(extractPeriod(records)).toBe('2025-01 ~ 2025-03');
  });

  it('동일 날짜만 존재 → 단일값 반환', () => {
    const records = [rec('D1', 'H1', 10, '2025-12'), rec('D2', 'H2', 20, '2025-12')];
    expect(extractPeriod(records)).toBe('2025-12');
  });
});
