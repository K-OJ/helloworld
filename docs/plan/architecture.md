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
