# 아키텍처 설계 문서

## 개요

Auto-QA Dashboard는 Next.js App Router 기반의 풀스택 단일 애플리케이션입니다. 별도의 백엔드 서버 없이 Next.js API Routes가 서버 로직을 담당합니다.

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│                                                          │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐ │
│  │ FileDropzone │  │ ColumnMapper  │  │AiInsightPanel│ │
│  │ (업로드 UI)  │  │ (컬럼 매핑)   │  │ (AI 결과 UI) │ │
│  └──────┬───────┘  └───────┬───────┘  └──────┬───────┘ │
│         └──────────────────┴──────────────────┘         │
│                            │                             │
│                    useFileUpload Hook                    │
└────────────────────────────┼────────────────────────────┘
                             │ HTTP (fetch)
┌────────────────────────────┼────────────────────────────┐
│              Next.js API Routes (Node.js)                │
│                            │                             │
│  ┌─────────────────────────┼──────────────────────────┐ │
│  │      POST /api/upload   │                          │ │
│  │   parseFile() → runRuleEngine() → UploadResult     │ │
│  └─────────────────────────┼──────────────────────────┘ │
│                            │                             │
│  ┌─────────────────────────┼──────────────────────────┐ │
│  │      POST /api/analyze  │                          │ │
│  │   analyzeAnomalies() → Claude API → AiAnalysis     │ │
│  └─────────────────────────┼──────────────────────────┘ │
│                            │                             │
│  ┌─────────────────────────┼──────────────────────────┐ │
│  │      POST /api/report   │                          │ │
│  │   generateReport() → CSV/Excel Binary              │ │
│  └─────────────────────────┼──────────────────────────┘ │
└────────────────────────────┼────────────────────────────┘
                             │ HTTPS
              ┌──────────────┴──────────────┐
              │     Anthropic Claude API     │
              │   (claude-sonnet-4-6)        │
              └──────────────────────────────┘
```

---

## 핵심 모듈 설명

### `lib/rule-engine.ts` — 규칙 기반 검수 엔진

- **역할**: 전월/당월 처방량을 약품ID + 병원코드 키로 집계하고 변동률을 계산
- **설계 의도**: AI 호출 없이 즉시 실행되는 결정론적 검수로 빠른 1차 필터링 제공
- **의존성 없음**: 순수 TypeScript 함수로 테스트 용이

### `lib/ai-analyzer.ts` — AI 분석 모듈

- **역할**: 경고/위험 항목을 20개 배치로 나눠 Claude API에 전송, 원인 분류 수신
- **설계 의도**: 배치 처리로 토큰 효율 최적화, 3회 재시도로 신뢰성 확보
- **Fallback**: API 실패 시 규칙 기반 Mock 분석 결과 반환

### `lib/parser.ts` — 파일 파싱 모듈

- **역할**: CSV(PapaParse), Excel(XLSX) 파일을 `PrescriptionRecord[]`로 변환
- **서버 전용**: `File.text()`로 스트림 변환 후 파싱 (브라우저 API 의존 제거)
- **컬럼 매핑**: `ColumnMapping` 파라미터로 임의 컬럼명 지원

### `lib/read-headers.ts` — 클라이언트 헤더 읽기

- **역할**: 파일 업로드 전 컬럼명만 미리 읽어 매핑 UI에 전달
- **클라이언트 전용**: `parser.ts`(서버)와 분리하여 XLSX 브라우저 호환성 문제 방지
- **동적 import**: XLSX를 lazy load하여 초기 번들 크기 절감

---

## 데이터 흐름

```
1. 파일 선택 (FileDropzone)
   └─> read-headers.ts로 컬럼명 추출 (클라이언트)

2. 컬럼 매핑 (ColumnMapper)
   └─> ColumnMapping 객체 생성

3. POST /api/upload
   ├─> parser.ts: File → PrescriptionRecord[]
   ├─> rule-engine.ts: 집계 + 변동률 계산
   └─> response: UploadResult { items, summary, periods }

4. POST /api/analyze (선택)
   ├─> ai-analyzer.ts: 배치 분류 요청
   ├─> Claude API: 원인 분류 응답
   └─> response: { results: AiAnalysisResult[], is_mock: boolean }

5. POST /api/report (선택)
   ├─> report-generator.ts: CSV/Excel 생성
   └─> response: Binary file download
```

---

## 컴포넌트 관계도

```
dashboard/page.tsx
├── FileDropzone (upload step)
├── ColumnMapper (mapping step)
├── SummaryCards (results)
├── AiInsightPanel (results)
│   └── /api/analyze 호출
├── AnomalyTable (results)
│   └── SeverityBadge
├── ChangeChart (results)
└── ReportDownloadButton
    └── /api/report 호출
```

---

## 설계 원칙

1. **서버/클라이언트 경계 명확화**: XLSX, PapaParse의 환경별 동작 차이를 모듈 분리로 해결
2. **점진적 기능 노출**: 규칙 검수(필수) → AI 분석(선택) → 보고서(선택) 순으로 의존성 없는 단계 설계
3. **Fallback 우선**: AI API 장애 시에도 규칙 검수 결과와 Mock 분석으로 서비스 연속성 보장

---

## 에러 처리 전략

### 전역 에러 분류

| 레이어 | 에러 유형 | 처리 방식 |
|---|---|---|
| API Route | 입력값 검증 실패 | `400 Bad Request` + 에러 메시지 JSON 반환 |
| API Route | AI API 호출 실패 | Mock 분석 fallback + `is_mock: true` 플래그 |
| API Route | 예기치 못한 서버 오류 | `500 Internal Server Error` + `console.error` 로깅 |
| Client | fetch 네트워크 오류 | try/catch → UI 에러 메시지 표시 |
| Client | 파일 파싱 오류 | 오류 행 수 카운트 후 결과에 포함 (`skipped_rows`) |

### API 상태 코드 규격

```
200 OK           — 정상 처리
400 Bad Request  — 필수 파라미터 누락, 형식 오류, 빈 파일
500 Server Error — 서버 내부 오류 (AI API 장애 제외, fallback 처리)
```

### 에러 응답 형식

```typescript
// 에러 응답 공통 포맷
{ error: string }

// AI fallback 응답 포맷 (200으로 반환)
{ results: AiAnalysisResult[], is_mock: true, error_detail: string }
```

### 로깅 전략

- **서버**: `console.error('[모듈명] 에러 설명:', errorMessage)` — Vercel 함수 로그에서 추적 가능
- **클라이언트**: 사용자 친화적 에러 메시지만 UI에 노출, 기술적 스택은 숨김
- **민감정보**: API 키, 처방 원본 데이터는 로그에 포함되지 않도록 명시적 제외

---

## 보안 고려사항

### API 키 관리

| 항목 | 구현 방식 |
|---|---|
| `ANTHROPIC_API_KEY` | Vercel Environment Variables에만 저장, 코드에 하드코딩 금지 |
| 로컬 개발 | `.env.local` (`.gitignore`에 포함) |
| CI/CD | GitHub Secrets (`${{ secrets.ANTHROPIC_API_KEY }}`) |
| 클라이언트 노출 | `NEXT_PUBLIC_` 접두사 없이 서버 전용 환경변수로만 사용 |

### 입력값 검증

```typescript
// /api/upload: 파일 검증
- MIME 타입: text/csv, application/vnd.ms-excel, application/vnd.openxmlformats...
- 파일 크기: 최대 50MB (MAX_FILE_SIZE_BYTES 상수)
- 필수 컬럼 또는 컬럼 매핑 존재 여부 확인

// /api/analyze: 요청 바디 검증
- anomalies 배열 존재 및 비어있지 않음 확인
- 각 항목 필수 필드(drug_id, hospital_code 등) 유효성 검사

// /api/chat: 메시지 검증
- messages 배열 유효성 확인
- 컨텍스트 데이터 크기 제한 (토큰 초과 방지)
```

### 데이터 프라이버시

- **파일 비저장**: 업로드된 원본 파일은 서버 메모리에서만 처리되며 디스크에 저장되지 않음
- **AI 전송 최소화**: Claude API에는 약품코드·변동률 등 집계 통계만 전송, 병원명·환자 정보 미포함
- **쿠키 보안**: `autoqa_auth` 쿠키는 `SameSite=Lax`, `path=/` 설정으로 CSRF 방어
- **인증 가드**: Next.js Middleware가 `/dashboard` 전체 경로를 쿠키 기반으로 보호



## 4. 컴포넌트 간 책임 분리 명세 (Separation of Concerns)
본 프로젝트는 유지보수성과 확장성을 극대화하기 위해 UI 렌더링(Presentation)과 비즈니스 로직(Domain)의 책임을 엄격하게 분리했습니다.

* **View Components (`src/components/`)**: 오직 화면 렌더링과 사용자 입력 이벤트 처리만 담당합니다. (예: `FileDropzone`은 파일 읽기 로직을 모른 채 파일 객체만 상위로 전달, `SummaryCards`는 계산된 결과값만 props로 받아 시각화)
* **Business Logic & Utilities (`src/lib/` & `src/utils/`)**: 파일 파싱(`parser.ts`), 규칙 기반 검수 알고리즘(`rule-engine.ts`) 등 데이터 가공과 판별 책임을 독점합니다. UI에 대한 의존성이 0%이므로 독립적인 단위 테스트가 가능합니다.
* **API Routes (`src/app/api/`)**: 클라이언트와 AI 모델(Claude) 사이의 컨트롤러 역할을 합니다. 요청 데이터의 유효성을 검증하고, 외부 API 통신을 수행하며, 표준화된 에러 규격으로 응답합니다.

## 5. 전사적 에러 처리 전략 (Error Handling Strategy)
예측 불가능한 대용량 데이터 파싱과 외부 LLM API 통신 과정에서 시스템 다운을 방지하기 위한 3단계 에러 방어선(Defense in Depth)을 구축했습니다.

1. **클라이언트 입력단 (Validation Boundary):** Zod 스키마를 활용하여 업로드된 CSV 파일의 헤더 및 데이터 타입이 제약 데이터 규격에 맞는지 1차 검증하고, 실패 시 직관적인 Toast 에러 메시지를 반환합니다.
2. **비동기 API 통신단 (Graceful Degradation):** Claude API 통신 중 타임아웃이나 크레딧 고갈(`429 Too Many Requests` 등) 발생 시, 앱이 크래시되지 않도록 `try-catch`로 묶고 Fallback 데이터(규칙 기반의 기본 검수 결과)만이라도 사용자에게 안전하게 반환합니다.
3. **글로벌 에러 캡처 (Error Boundary):** React의 `error.tsx` 컴포넌트를 최상단에 배치하여, 렌더링 중 발생하는 런타임 에러를 포착하고 "데이터 처리 중 문제가 발생했습니다. 재시도 해주세요"라는 안전한 UI를 표출합니다.

## 6. 보안 및 데이터 보호 고려사항 (Security Considerations)
유비케어의 민감한 제약 처방 데이터를 다루는 시스템으로서, 데이터 유출 및 외부 공격을 차단하기 위한 보안 아키텍처를 적용했습니다.

* **인프라 및 API 보안:** Anthropic API Key(`ANTHROPIC_API_KEY`) 등 핵심 인증 정보는 클라이언트(브라우저)에 절대 노출되지 않도록 Next.js 서버 사이드(API Routes)에서만 접근 가능한 환경 변수로 철저히 격리했습니다.
* **데이터 무상태성 (Stateless Data Processing):** 업로드된 처방 데이터(CSV)는 서버 디스크나 별도의 DB에 영구 저장(Persistence)되지 않습니다. API 메모리 상에서 이상치 분석만 수행한 뒤 즉시 휘발되도록 설계하여 데이터 탈취 리스크를 원천 차단했습니다.
* **입력값 무결성 검증 (Input Sanitization):** 클라이언트에서 넘어온 페이로드를 서버 API(`route.ts`)에서 파싱할 때, 악의적인 스크립트(XSS)나 비정상적인 거대 쿼리가 없는지 검사한 후 LLM 컨텍스트로 주입합니다.
## 7. 상태 관리 및 데이터 페칭 아키텍처 (State & Fetching Strategy)

* **상태 관리 (Zustand):** 컴포넌트 뎁스가 깊어지며 발생하는 Prop Drilling(상태 내리물림) 문제를 해결하고, 분산된 로컬 상태(useState)를 중앙 집중화하기 위해 보일러플레이트가 가장 적은 Zustand를 전역 상태 스토어(`src/store/useQAStore.ts`)로 채택했습니다.
* **데이터 페칭 (SWR):** 대용량 제약 데이터의 잦은 재요청으로 인한 Claude API 토큰 낭비를 막기 위해 `stale-while-revalidate` 전략을 채택했습니다. Focus 시 재검증(revalidateOnFocus)을 제어하여 불필요한 네트워크 비용을 0으로 수렴시켰습니다.

### 7-1. SWR 기반 AI 분석 스마트 캐싱 전략 (토큰/속도 최적화)

**핵심 목적:** 유사한 정합성 오류 패턴에 대한 중복 AI 분석 토큰 소모를 원천 차단하고 검수 처리 속도를 극대화합니다.

**작동 방식:** 매월 초 대량의 패널 및 처방 데이터를 검수할 때, 동일한 사유의 오류가 다수 반복 발생합니다. SWR은 개별 데이터의 이상 패턴(Payload)을 해시화하여 고유한 캐시 키(Key)로 생성하고, 이에 대한 AI 원인 분석 결과를 캐싱합니다.

**토큰 세이브 효과:** 새로운 검수 데이터가 큐에 들어올 때 SWR이 가장 먼저 캐시를 확인합니다. 기존 분석 이력과 유사한 건이라면 캐시된 분석 결과를 즉시 반환(Cache Hit)하여 LLM API 호출을 전면 생략합니다. 이를 통해 처리 속도는 비약적으로 빨라지고 토큰 추론 비용은 기하급수적으로 감소합니다.

### 7-2. Zustand 기반 전역 상태 관리 아키텍처 (로직 중앙화)

**핵심 목적:** `AnomalyTable.tsx` 등 개별 UI 컴포넌트 내부에 인라인으로 얽혀 있는 복잡한 상태 관리 로직을 외부로 분리하여 코드 가독성과 테스트 용이성을 확보합니다.

**스토어(Store) 설계 구조:**

* `useDataStore`: 파일 파싱 결과, 원본 데이터 셋, 배포 대기 중인 월간 제약 데이터의 기초 상태를 보관합니다.
* `useQAStore`: AI 자동 검수 프로세스 상태를 전담합니다. 20건 단위의 배치(Batch) 처리 진행률, 남은 검수 건수, 완료된 오류 원인 매핑 데이터를 중앙에서 통제합니다.
* `useUIStore`: 에러 테이블의 데이터 필터링, 정렬 상태, 모달 창 오픈 여부 등 순수 화면 제어 상태를 담당합니다.

**효과:** 상태 변경(Action) 로직이 컴포넌트 밖으로 빠져나가면서 뷰(View) 컴포넌트는 순수 렌더링에만 집중할 수 있게 됩니다. 이는 수천 건의 에러 리스트를 테이블에 렌더링할 때 발생하는 UI 지연(Lag) 현상을 방지합니다.

### 7-3. 통합 데이터 플로우 (Data Flow)

사용자가 제약 데이터 파일을 업로드하면 Zustand가 전체적인 배치 진행 상태를 통제합니다. 검수가 진행되며 개별 행(Row)에 대한 원인 분석 요청이 발생할 때마다 SWR이 네트워크 단에서 이를 인터셉트합니다. 기존에 분석했던 캐시 데이터가 있으면 즉시 반환하고, 처음 보는 오류 패턴만 향후 도입될 로컬 전용 LLM 엔진이나 외부 API로 전송합니다. 응답이 오면 결과는 SWR 캐시에 새로 저장되는 동시에 Zustand 스토어에 병합되어 실시간으로 화면에 출력됩니다.

## 8. 프론트엔드 번들 사이즈 최적화 전략 (Bundle Optimization)

초기 로딩 속도 향상과 LCP(Largest Contentful Paint) 개선을 위해 다음 3가지 번들 최적화 기법을 적용했습니다.

1. **Dynamic Imports (`next/dynamic`):** 무거운 차트 라이브러리와 대시보드 하위 뷰 컴포넌트를 지연 로딩 처리.
2. **Tree-Shaking 극대화:** `lucide-react` 및 `lodash` 등의 라이브러리 사용 시 Named Export 방식으로만 호출하여 사용하지 않는 코드를 번들에서 제외(Dead-code Elimination).
3. **PapaParse/XLSX 경량화:** 거대 모듈인 파싱 라이브러리들을 Web Worker 스레드로 분리하고 청크(Chunk) 단위로 로드하여 메인 스레드 블로킹 방지 및 JS 번들 크기 축소.
