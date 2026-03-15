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
