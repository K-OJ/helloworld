# Auto-QA Dashboard — 개발 로드맵

## 현재 상태: v0.4.0 (2026-03-15 기준)

---

## Sprint 1 — 핵심 검수 엔진 구축 ✅ 완료

**목표**: CSV 파일 업로드 및 규칙 기반 이상치 탐지

| 작업 | 상태 |
|---|:---:|
| CSV/Excel 파싱 모듈 (`lib/parser.ts`) | ✅ |
| 규칙 기반 검수 엔진 (`lib/rule-engine.ts`) | ✅ |
| `/api/upload` REST API | ✅ |
| 기본 결과 테이블 UI | ✅ |
| 심각도 분류 (normal / warning / danger) | ✅ |

### 주요 의사결정 및 이슈 해결

| 이슈 | 해결 방법 |
|---|---|
| **대용량 CSV 파싱 시 브라우저 메모리 초과** | PapaParse 스트리밍 방식 적용 및 파싱 로직을 서버 사이드(`/api/upload`)로 이전하여 브라우저 메모리 부담 제거 |
| **Excel 파싱 모듈의 브라우저 환경 미지원** | XLSX 라이브러리를 클라이언트에서 동적 `import()`로 lazy load하고, 서버 파싱은 `File.text()`로 별도 처리하는 `read-headers.ts` / `parser.ts` 분리 설계 채택 |
| **약품ID + 병원코드 중복 행 집계 필요** | 동일 키의 레코드를 월간 처방량으로 합산하는 `aggregateByKey()` 함수 설계, 일별 데이터도 처리 가능하도록 확장 |

---

## Sprint 2 — AI 분석 및 대시보드 고도화 ✅ 완료

**목표**: Claude AI 연동 및 풀 기능 대시보드 구현

| 작업 | 상태 |
|---|:---:|
| Claude Sonnet 4.6 AI 분석 모듈 (`lib/ai-analyzer.ts`) | ✅ |
| `/api/analyze` REST API | ✅ |
| AI 결과 패널 (`AiInsightPanel`) | ✅ |
| 요약 카드 (`SummaryCards`) | ✅ |
| 변동률 차트 (`ChangeChart`) | ✅ |
| CSV/Excel 보고서 다운로드 | ✅ |
| Vercel 프로덕션 배포 | ✅ |

### 주요 의사결정 및 이슈 해결

| 이슈 | 해결 방법 |
|---|---|
| **Zod v4에서 `generateObject` 스키마 불호환** | Zod 스키마 대신 `ai` SDK의 `jsonSchema()` 함수로 직접 JSON Schema 정의하여 우회 |
| **AI API 응답 지연으로 UX 저하** | 경고/위험 항목을 20개 배치로 분할 처리하고, 배치 완료 시마다 콜백(`onBatchComplete`)으로 점진적 결과 표시 |
| **Vercel 빌드 환경에서 `@ai-sdk/anthropic` 버전 충돌** | `package.json` 버전 고정(`^3.0.58`)으로 해결, Next.js 16 + ai SDK v6 호환성 매트릭스 검증 |
| **실무자 요구사항: Excel 보고서 필수** | 인터뷰 피드백 반영, AI 분석 결과 컬럼 포함 XLSX 다운로드 기능 구현 → 테스터 전원 호평 |

---

## Sprint 3 — UX 개선 및 안정화 ✅ 완료

**목표**: 실제 데이터 사용성 확보

| 작업 | 상태 |
|---|:---:|
| 컬럼 매핑 UI (한글 컬럼명 지원) | ✅ |
| AI 크레딧 부족 시 예시 데이터 Fallback | ✅ |
| FileReaderSync 서버 사이드 오류 수정 | ✅ |
| PapaParse 타입 오류 수정 | ✅ |
| 구버전 홈페이지 제거 및 루트 리다이렉트 | ✅ |

### 주요 의사결정 및 이슈 해결

| 이슈 | 해결 방법 |
|---|---|
| **한글 컬럼명 CSV 업로드 시 검수 불가** | 파일 업로드 후 헤더를 먼저 읽어 드롭다운 매핑 UI 제공, 키워드 기반 휴리스틱 자동 매핑(`suggest-mapping.ts`) 추가 |
| **Framer Motion v12 TypeScript `ease` 타입 오류** | `ease: 'easeOut'` → `ease: [0.25, 0.1, 0.25, 1]` 큐빅 베지어 배열로 교체 |
| **AI 크레딧 소진 시 빈 결과 화면 표시** | `generateMockAnalysis()`로 규칙 기반 예측 결과 fallback, "예측" 배지와 크레딧 충전 링크 안내 배너 표시 |

---

## Sprint 4 — 품질 보증 및 문서화 ✅ 완료

**목표**: 테스트 커버리지 확보 및 해커톤 심사 보완

| 작업 | 상태 |
|---|:---:|
| README 문서화 (아키텍처, 인터뷰, 차별화) | ✅ |
| 아키텍처 문서 (`docs/plan/architecture.md`) | ✅ |
| 사용자 시나리오 문서 | ✅ |
| 테스트 전략 문서 (`docs/test-strategy.md`) | ✅ |
| 호환성 테스트 문서 (`docs/compatibility-test.md`) | ✅ |
| GitHub Actions CI 파이프라인 (테스트→빌드→스모크) | ✅ |
| 단위 테스트 29개 (`rule-engine`, `ai-analyzer`, `suggest-mapping`) | ✅ |
| API 통합 테스트 (`__tests__/api.test.ts`) | ✅ |
| 컴포넌트 테스트 (`__tests__/components.test.tsx`) | ✅ |
| 헬스 체크 API (`/api/health`) | ✅ |
| E2E 테스트 (Playwright) | ⬜ |

### 주요 의사결정 및 이슈 해결

| 이슈 | 해결 방법 |
|---|---|
| **`ai/react` 모듈 미지원 (ai SDK v6)** | `useChat` 대신 `useState` + `fetch` 커스텀 훅으로 스트리밍 구현, API는 `streamText` + `toTextStreamResponse()` 사용 |
| **Vitest config ESM 오류 (`ERR_REQUIRE_ESM`)** | `vitest.config.ts` → `vitest.config.mts` 확장자 변경으로 해결 |
| **모바일 업로드 드롭존 레이아웃 깨짐** | `grid` → `flex flex-col md:flex-row`로 교체, 반응형 디자인 가이드 전면 적용 |

---

## Sprint 5 — 확장 기능 (예정)

**목표**: 엔터프라이즈 사용성 확보

| 작업 | 상태 |
|---|:---:|
| 사용자 인증 (NextAuth.js + DB) | ⬜ |
| 검수 이력 저장 (DB 연동) | ⬜ |
| 다중 파일 배치 처리 | ⬜ |
| 알림 기능 (Slack / 이메일) | ⬜ |
| 대시보드 커스텀 임계값 설정 | ⬜ |
| E2E 테스트 (Playwright) | ⬜ |

---

## 범례

| 아이콘 | 의미 |
|:---:|---|
| ✅ | 완료 |
| 🔄 | 진행 중 |
| ⬜ | 예정 |
