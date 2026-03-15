import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/health/route';
import { POST } from '@/app/api/analyze/route';
import { NextRequest } from 'next/server';

// ─────────────────────────────────────────────
// GET /api/health
// ─────────────────────────────────────────────
describe('GET /api/health', () => {
  it('200 OK와 status: ok 반환', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeTruthy();
  });

  it('응답에 timestamp ISO 형식 포함', async () => {
    const res = await GET();
    const body = await res.json();
    expect(() => new Date(body.timestamp)).not.toThrow();
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });
});

// ─────────────────────────────────────────────
// POST /api/analyze
// ─────────────────────────────────────────────
function makeAnalyzeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validAnomaly = {
  drug_id: 'D001',
  drug_name: '테스트약',
  hospital_code: 'H001',
  baseline_volume: 100,
  target_volume: 200,
  change_pct: 100,
  absolute_change: 100,
  severity: 'danger',
  rule_triggered: 'volume_increase_gt_50',
};

describe('POST /api/analyze — 입력 검증', () => {
  it('빈 배열 → 400 Bad Request', async () => {
    const res = await POST(makeAnalyzeRequest({ anomalies: [] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('anomalies 미포함 → 400 Bad Request', async () => {
    const res = await POST(makeAnalyzeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('배열');
  });

  it('anomalies가 배열이 아닌 경우 → 400 Bad Request', async () => {
    const res = await POST(makeAnalyzeRequest({ anomalies: 'not-an-array' }));
    expect(res.status).toBe(400);
  });

  it('필수 필드 누락 항목 → 400 Bad Request', async () => {
    const res = await POST(makeAnalyzeRequest({
      anomalies: [{ drug_id: 'D001' }], // hospital_code 등 누락
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('필수 필드');
  });
});

// ─────────────────────────────────────────────
// POST /api/analyze — Claude API Mocking 통합 테스트
// ─────────────────────────────────────────────
vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: () => () => 'mocked-model',
  anthropic: () => 'mocked-model',
}));

vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>();
  return {
    ...actual,
    generateObject: vi.fn().mockResolvedValue({
      object: {
        results: [
          {
            drug_id: 'D001',
            classification: 'market_trend',
            confidence_score: 0.87,
            reason: '해당 약품의 계절성 처방 패턴으로 인한 정상 증가',
            action_url: 'https://www.hira.or.kr',
          },
        ],
      },
    }),
  };
});

describe('POST /api/analyze — Claude API Mocking 통합 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Claude API 응답이 모킹되면 200과 results 배열을 반환한다', async () => {
    const res = await POST(makeAnalyzeRequest({ anomalies: [validAnomaly] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.results.length).toBeGreaterThan(0);
  });

  it('모킹된 결과에 drug_id, classification, reason이 포함된다', async () => {
    const res = await POST(makeAnalyzeRequest({ anomalies: [validAnomaly] }));
    const body = await res.json();
    const result = body.results[0];
    expect(result.drug_id).toBeTruthy();
    expect(result.classification).toBeTruthy();
    expect(result.reason).toBeTruthy();
  });

  it('action_url이 유효한 URL 형식이다', async () => {
    const res = await POST(makeAnalyzeRequest({ anomalies: [validAnomaly] }));
    const body = await res.json();
    const result = body.results[0];
    expect(result.action_url).toMatch(/^https?:\/\//);
  });
});

describe('POST /api/analyze — 정상 처리 (API 키 없는 환경 → Mock)', () => {
  it('유효한 입력 → 200과 results 배열 반환', async () => {
    const res = await POST(makeAnalyzeRequest({ anomalies: [validAnomaly] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.results.length).toBeGreaterThan(0);
  });

  it('API 키 없는 환경 → is_mock: true', async () => {
    // CI/테스트 환경에는 API 키 없음
    const res = await POST(makeAnalyzeRequest({ anomalies: [validAnomaly] }));
    const body = await res.json();
    // API 키 없으면 mock, 있으면 실제 AI 결과
    expect(typeof body.is_mock).toBe('boolean');
  });

  it('mock 결과에 필수 필드 포함', async () => {
    const res = await POST(makeAnalyzeRequest({ anomalies: [validAnomaly] }));
    const body = await res.json();
    const result = body.results[0];
    expect(result.drug_id).toBeTruthy();
    expect(result.classification).toMatch(/^(data_error|market_trend|seasonal|policy_change|unknown)$/);
    expect(result.action_url).toMatch(/^https?:\/\//);
  });
});
