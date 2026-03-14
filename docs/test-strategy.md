# 테스트 전략

## 테스트 범위 및 우선순위

```
                    E2E (Playwright)          ← 소수, 핵심 흐름만
                  ─────────────────
               통합 테스트 (API Routes)       ← 주요 API 검증
             ─────────────────────────
          단위 테스트 (lib/* 순수 함수)       ← 가장 많고 빠름
        ─────────────────────────────────
```

---

## 1. 단위 테스트 (Unit Test)

### 대상 모듈

| 파일 | 테스트 포인트 |
|---|---|
| `lib/rule-engine.ts` | 변동률 계산, 심각도 분류, 신규 항목 처리, 정렬 |
| `lib/parser.ts` | 컬럼 매핑 적용, 누락 행 처리, 파일 크기 검증 |
| `lib/ai-analyzer.ts` | Mock 분석 생성 로직, 배치 분할 |

### 테스트 프레임워크: Vitest

```bash
npm install -D vitest @vitest/coverage-v8
```

`package.json` 스크립트 추가:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 주요 테스트 케이스 (`rule-engine`)

```typescript
// 정상 범위 (±30% 미만)
runRuleEngine(baseline, target) → severity: 'normal'

// 경고 (30% 이상 50% 미만)
changeOf35Percent → severity: 'warning', rule: 'volume_increase_gt_30'

// 위험 (50% 이상)
changeOf60Percent → severity: 'danger', rule: 'volume_increase_gt_50'

// 처방량 0으로 감소
volumeDroppedToZero → severity: 'danger', rule: 'volume_dropped_to_zero'

// 신규 항목 (전월 없음)
newItemInTarget → severity: 'warning', rule: 'new_item'

// 월간 처방 합산 검증
multipleRowsSameDrugHospital → aggregatedVolume
```

---

## 2. 통합 테스트 (Integration Test)

### 대상 API Routes

| 엔드포인트 | 검증 항목 |
|---|---|
| `POST /api/upload` | 정상 CSV 처리, 필수 컬럼 누락 에러, 컬럼 매핑 적용 |
| `POST /api/analyze` | Mock 결과 반환 (API key 없는 테스트 환경) |
| `POST /api/report` | CSV/Excel 바이너리 응답 |

### 도구
- `node:test` (Node.js 내장) 또는 Vitest + `undici` 모킹

---

## 3. E2E 테스트 (End-to-End)

### 대상 시나리오

1. **파일 업로드 → 검수 결과 표시** (Happy Path)
2. **컬럼 매핑 → 검수** (한글 컬럼 파일)
3. **AI 분석 버튼 → 예시 결과 표시** (API 미설정 환경)

### 도구: Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

```typescript
// e2e/dashboard.spec.ts 예시
test('CSV 업로드 후 검수 결과 표시', async ({ page }) => {
  await page.goto('/dashboard');
  await page.locator('[data-testid="baseline-dropzone"]').setInputFiles('fixtures/baseline.csv');
  await page.locator('[data-testid="target-dropzone"]').setInputFiles('fixtures/target.csv');
  await page.click('text=다음: 컬럼 매핑');
  // 매핑 선택 후...
  await page.click('text=검수 시작');
  await expect(page.locator('[data-testid="summary-cards"]')).toBeVisible();
});
```

---

## 4. CI 통합

GitHub Actions에서 모든 테스트 자동 실행:

```yaml
- name: Run Tests
  run: npm test
```

`.github/workflows/ci.yml` 참조.

---

## 커버리지 목표

| 모듈 | 목표 커버리지 |
|---|:---:|
| `lib/rule-engine.ts` | 90% 이상 |
| `lib/parser.ts` | 70% 이상 |
| `lib/ai-analyzer.ts` | 60% 이상 |
| API Routes | 핵심 경로 100% |

---

## 테스트 환경

| 환경 | API Key | 목적 |
|---|---|---|
| 로컬 개발 | `.env.local` | 실제 AI 호출 테스트 |
| CI (GitHub Actions) | 없음 (Secret 미설정) | Mock 결과로 빌드 검증 |
| Production (Vercel) | Env Var 설정 | 실제 서비스 |
