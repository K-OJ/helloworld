import { describe, it, expect } from 'vitest';
import { generateMockAnalysis } from '@/lib/ai-analyzer';
import type { AnomalyItem } from '@/lib/types';

function anomalyItem(drug_id: string, change_pct: number, severity: 'warning' | 'danger'): AnomalyItem {
  return {
    drug_id,
    drug_name: `약품_${drug_id}`,
    hospital_code: 'H001',
    baseline_volume: 100,
    target_volume: Math.round(100 * (1 + change_pct / 100)),
    change_pct,
    absolute_change: Math.round(100 * (change_pct / 100)),
    severity,
    rule_triggered: severity === 'danger' ? 'volume_increase_gt_50' : 'volume_increase_gt_30',
  };
}

describe('generateMockAnalysis', () => {
  it('normal 항목은 제외하고 warning/danger만 분석', () => {
    const items: AnomalyItem[] = [
      { ...anomalyItem('D001', 10, 'warning'), severity: 'normal', rule_triggered: 'within_normal_range' },
      anomalyItem('D002', 35, 'warning'),
      anomalyItem('D003', 60, 'danger'),
    ];
    const results = generateMockAnalysis(items);
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.drug_id)).not.toContain('D001');
  });

  it('결과마다 필수 필드 포함', () => {
    const results = generateMockAnalysis([anomalyItem('D001', 60, 'danger')]);
    const r = results[0];
    expect(r.drug_id).toBe('D001');
    expect(r.classification).toMatch(/^(data_error|market_trend|seasonal|policy_change|unknown)$/);
    expect(r.confidence).toBeGreaterThanOrEqual(0);
    expect(r.confidence).toBeLessThanOrEqual(1);
    expect(r.explanation).toBeTruthy();
    expect(r.recommended_action).toBeTruthy();
    expect(r.action_label).toBeTruthy();
    expect(r.action_url).toMatch(/^https?:\/\//);
  });

  it('극단적 변동(>200%) → data_error 분류', () => {
    const item: AnomalyItem = {
      ...anomalyItem('D001', 250, 'danger'),
      baseline_volume: 100,
      target_volume: 350,
    };
    const results = generateMockAnalysis([item]);
    expect(results[0].classification).toBe('data_error');
    expect(results[0].action_url).toContain('hira.or.kr');
  });

  it('baseline 0이면 data_error 분류', () => {
    const item: AnomalyItem = {
      ...anomalyItem('D001', 100, 'warning'),
      baseline_volume: 0,
    };
    const results = generateMockAnalysis([item]);
    expect(results[0].classification).toBe('data_error');
  });

  it('빈 배열 입력 → 빈 배열 반환', () => {
    expect(generateMockAnalysis([])).toEqual([]);
  });

  it('action_url은 유효한 공공기관 도메인', () => {
    const VALID_DOMAINS = ['hira.or.kr', 'nedrug.mfds.go.kr', 'kdca.go.kr'];
    const items = Array.from({ length: 10 }, (_, i) => anomalyItem(`D${i}`, 35 + i * 5, 'warning'));
    const results = generateMockAnalysis(items);
    for (const r of results) {
      const isValidDomain = VALID_DOMAINS.some((d) => r.action_url.includes(d));
      expect(isValidDomain, `${r.action_url} 이 유효한 도메인이 아닙니다`).toBe(true);
    }
  });
});
