# 테스트 전략

## 테스트 피라미드

```
                    E2E (Playwright)          ← 핵심 흐름 3개
                  ─────────────────
               통합 테스트 (API Routes)       ← /api/analyze smoke test (CI)
             ─────────────────────────
          단위 테스트 (lib/* 순수 함수)       ← 29개 케이스, 자동 실행
        ─────────────────────────────────
```

---

## 구현 현황

| 레이어 | 파일 | 테스트 수 | 상태 |
|---|---|:---:|:---:|
| 단위 | `src/__tests__/rule-engine.test.ts` | 17 | ✅ 구현 |
| 단위 | `src/__tests__/ai-analyzer.test.ts` | 6 | ✅ 구현 |
| 단위 | `src/__tests__/suggest-mapping.test.ts` | 5 | ✅ 구현 |
| 통합 | CI smoke test (`/api/analyze`) | - | ✅ 구현 |
| E2E | `e2e/` (Playwright) | - | 🔲 미구현 |

---

## 1. 단위 테스트 (Unit Test)

**프레임워크:** Vitest v4 | **설정:** `vitest.config.mts`

```bash
npm test              # 단회 실행
npm run test:watch    # 파일 감시 모드
npm run test:coverage # 커버리지 리포트
```

### rule-engine.test.ts (17개)

| 테스트 그룹 | 케이스 |
|---|---|
| 심각도 분류 | normal / warning 경계(30%) / danger 경계(50%) / 감소 / 0 소멸 |
| 신규 항목 | 당월 신규 → warning/new_item, 전월만 존재 → danger |
| 집계 | 동일 키 여러 행 합산, 변동률 계산 정확도 |
| 정렬 | 절대 변동량 내림차순 |
| extractPeriod | 빈 배열 / 단일 날짜 / 범위 / 중복 날짜 |

### ai-analyzer.test.ts (6개)

| 케이스 |
|---|
| normal 항목 제외 후 분석 |
| 결과 필수 필드 검증 (classification, confidence, action_url 등) |
| 변동 >200% → data_error 분류 |
| baseline 0 → data_error |
| 빈 배열 입력 처리 |
| action_url 공공기관 도메인 검증 |

### suggest-mapping.test.ts (5개)

| 케이스 |
|---|
| 표준 한글 컬럼명 전체 매핑 |
| 영문 표준 컬럼명 매핑 |
| 대소문자 무관 매핑 |
| 알 수 없는 컬럼 → 빈 객체 |
| 부분 매핑 가능 케이스 |

---

## 2. CI/CD 파이프라인 (`.github/workflows/ci.yml`)

```
push / PR to master
        │
        ▼
┌──────────────┐
│  Unit Tests  │  npm test → 29개 케이스 자동 실행
└──────┬───────┘
       │ 통과 시
       ▼
┌──────────────┐
│ Lint + Build │  ESLint + Next.js 빌드 검증
└──────┬───────┘
       │ master push 시
       ▼
┌──────────────────┐
│  Smoke Test      │  Vercel 배포 후 헬스 체크
│  (30초 대기)     │  - /login 200 OK
│                  │  - /dashboard 302 redirect
│                  │  - /api/analyze mock 응답 검증
└──────────────────┘
```

### 단계별 실패 처리

| 단계 | 실패 시 동작 |
|---|---|
| Unit Tests | PR/push 차단 (빌드 진행 불가) |
| Lint | 빌드 차단 |
| Build | 배포 불가 |
| Smoke Test | 알림만 (롤백 수동) |
| Coverage | 경고만 (`continue-on-error: true`) |

---

## 3. E2E 테스트 (Playwright) — 미구현

### 계획된 시나리오

```typescript
// e2e/auth.spec.ts
test('test/test 로그인 → 대시보드 이동', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[placeholder="아이디"]', 'test');
  await page.fill('[placeholder="비밀번호"]', 'test');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});

// e2e/dashboard.spec.ts
test('CSV 업로드 → 컬럼 매핑 → 검수 결과 표시', async ({ page }) => {
  await page.goto('/dashboard');
  // 파일 업로드 → 매핑 → 결과 확인
});
```

### 설치 방법

```bash
npm install -D @playwright/test
npx playwright install --with-deps chromium
```

---

## 4. 커버리지 목표

| 모듈 | 현재 | 목표 |
|---|:---:|:---:|
| `lib/rule-engine.ts` | ~95% | 90%+ |
| `lib/ai-analyzer.ts` | ~70% | 70%+ |
| `lib/suggest-mapping.ts` | ~85% | 70%+ |
| API Routes | smoke test | 핵심 경로 |

---

## 5. 테스트 환경

| 환경 | API Key | AI 동작 |
|---|---|---|
| 로컬 (`npm test`) | 없음 | Mock 결과 |
| CI (GitHub Actions) | Secret 없음 | Mock 결과 |
| Production (Vercel) | Env Var 설정 | 실제 Claude AI |
