import { describe, it, expect } from 'vitest';
import { runRuleEngine, extractPeriod } from '../src/lib/rule-engine';
import type { PrescriptionRecord } from '../src/lib/types';

function makeRecord(overrides: Partial<PrescriptionRecord> = {}): PrescriptionRecord {
  return {
    drug_id: 'D001',
    drug_name: '테스트약품',
    hospital_code: 'H001',
    prescription_volume: 100,
    date: '2025-12',
    ...overrides,
  };
}

describe('runRuleEngine', () => {
  describe('심각도 분류', () => {
    it('변동률 ±30% 미만은 normal로 분류한다', () => {
      const baseline = [makeRecord({ prescription_volume: 100 })];
      const target = [makeRecord({ prescription_volume: 120 })]; // +20%
      const results = runRuleEngine(baseline, target);
      expect(results[0].severity).toBe('normal');
      expect(results[0].rule_triggered).toBe('within_normal_range');
    });

    it('변동률 +30% 이상은 warning으로 분류한다', () => {
      const baseline = [makeRecord({ prescription_volume: 100 })];
      const target = [makeRecord({ prescription_volume: 135 })]; // +35%
      const results = runRuleEngine(baseline, target);
      expect(results[0].severity).toBe('warning');
      expect(results[0].rule_triggered).toBe('volume_increase_gt_30');
    });

    it('변동률 -30% 이상은 warning으로 분류한다', () => {
      const baseline = [makeRecord({ prescription_volume: 100 })];
      const target = [makeRecord({ prescription_volume: 65 })]; // -35%
      const results = runRuleEngine(baseline, target);
      expect(results[0].severity).toBe('warning');
      expect(results[0].rule_triggered).toBe('volume_decrease_gt_30');
    });

    it('변동률 +50% 이상은 danger로 분류한다', () => {
      const baseline = [makeRecord({ prescription_volume: 100 })];
      const target = [makeRecord({ prescription_volume: 160 })]; // +60%
      const results = runRuleEngine(baseline, target);
      expect(results[0].severity).toBe('danger');
      expect(results[0].rule_triggered).toBe('volume_increase_gt_50');
    });

    it('변동률 -50% 이상은 danger로 분류한다', () => {
      const baseline = [makeRecord({ prescription_volume: 100 })];
      const target = [makeRecord({ prescription_volume: 40 })]; // -60%
      const results = runRuleEngine(baseline, target);
      expect(results[0].severity).toBe('danger');
      expect(results[0].rule_triggered).toBe('volume_decrease_gt_50');
    });

    it('처방량이 0으로 떨어지면 danger로 분류한다', () => {
      const baseline = [makeRecord({ prescription_volume: 100 })];
      const target = [makeRecord({ prescription_volume: 0 })];
      const results = runRuleEngine(baseline, target);
      expect(results[0].severity).toBe('danger');
      expect(results[0].rule_triggered).toBe('volume_dropped_to_zero');
    });
  });

  describe('신규 항목 처리', () => {
    it('전월에 없고 당월에만 있는 항목은 warning / new_item으로 분류한다', () => {
      const baseline: PrescriptionRecord[] = [];
      const target = [makeRecord({ prescription_volume: 50 })];
      const results = runRuleEngine(baseline, target);
      expect(results[0].severity).toBe('warning');
      expect(results[0].rule_triggered).toBe('new_item');
    });

    it('당월에 없고 전월에만 있는 항목은 danger / volume_dropped_to_zero로 분류한다', () => {
      const baseline = [makeRecord({ prescription_volume: 100 })];
      const target: PrescriptionRecord[] = [];
      const results = runRuleEngine(baseline, target);
      expect(results[0].severity).toBe('danger');
      expect(results[0].rule_triggered).toBe('volume_dropped_to_zero');
    });
  });

  describe('집계 처리', () => {
    it('동일 약품+병원 코드의 여러 행을 합산한다', () => {
      const baseline = [
        makeRecord({ prescription_volume: 60 }),
        makeRecord({ prescription_volume: 40 }),
      ];
      const target = [makeRecord({ prescription_volume: 100 })];
      const results = runRuleEngine(baseline, target);
      expect(results[0].baseline_volume).toBe(100);
      expect(results[0].severity).toBe('normal');
    });

    it('다른 약품+병원 키는 독립적으로 집계한다', () => {
      const baseline = [
        makeRecord({ drug_id: 'D001', hospital_code: 'H001', prescription_volume: 100 }),
        makeRecord({ drug_id: 'D002', hospital_code: 'H001', prescription_volume: 100 }),
      ];
      const target = [
        makeRecord({ drug_id: 'D001', hospital_code: 'H001', prescription_volume: 160 }), // +60% danger
        makeRecord({ drug_id: 'D002', hospital_code: 'H001', prescription_volume: 110 }), // +10% normal
      ];
      const results = runRuleEngine(baseline, target);
      const d001 = results.find((r) => r.drug_id === 'D001');
      const d002 = results.find((r) => r.drug_id === 'D002');
      expect(d001?.severity).toBe('danger');
      expect(d002?.severity).toBe('normal');
    });
  });

  describe('정렬', () => {
    it('절대 변동량 내림차순으로 정렬된다', () => {
      const baseline = [
        makeRecord({ drug_id: 'D001', prescription_volume: 100 }),
        makeRecord({ drug_id: 'D002', prescription_volume: 100 }),
      ];
      const target = [
        makeRecord({ drug_id: 'D001', prescription_volume: 110 }), // 절대변동 10
        makeRecord({ drug_id: 'D002', prescription_volume: 150 }), // 절대변동 50
      ];
      const results = runRuleEngine(baseline, target);
      expect(results[0].drug_id).toBe('D002');
      expect(results[1].drug_id).toBe('D001');
    });
  });

  describe('변동률 계산', () => {
    it('변동률을 정확히 계산한다', () => {
      const baseline = [makeRecord({ prescription_volume: 200 })];
      const target = [makeRecord({ prescription_volume: 300 })];
      const results = runRuleEngine(baseline, target);
      expect(results[0].change_pct).toBeCloseTo(50);
      expect(results[0].absolute_change).toBe(100);
    });
  });
});

describe('extractPeriod', () => {
  it('단일 날짜면 그대로 반환한다', () => {
    const records = [makeRecord({ date: '2025-12' }), makeRecord({ date: '2025-12' })];
    expect(extractPeriod(records)).toBe('2025-12');
  });

  it('여러 날짜면 범위로 반환한다', () => {
    const records = [makeRecord({ date: '2025-01' }), makeRecord({ date: '2025-03' })];
    expect(extractPeriod(records)).toBe('2025-01 ~ 2025-03');
  });

  it('날짜가 없으면 알 수 없음을 반환한다', () => {
    const records = [makeRecord({ date: '' })];
    expect(extractPeriod(records)).toBe('알 수 없음');
  });
});
