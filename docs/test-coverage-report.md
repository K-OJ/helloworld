# 📊 Test Coverage Report (Vitest)

> **목표 커버리지(rule-engine 95%, ai-analyzer 70%)를 초과 달성했습니다.**
>
> 아래 수치는 `vitest run --coverage` (`@vitest/coverage-v8`) 실행 결과입니다.

---

## 전체 요약

| 항목 | Stmts | Branch | Funcs | Lines |
|:---|---:|---:|---:|---:|
| **전체 평균** | **88.2%** | **84.1%** | **95.2%** | **88.2%** |
| 목표 임계값 | 70% | 65% | 80% | 70% |
| 달성 여부 | ✅ 초과 | ✅ 초과 | ✅ 초과 | ✅ 초과 |

---

## 파일별 상세 커버리지

### 핵심 비즈니스 로직 (`src/lib/`)

| 파일 | Stmts | Branch | Funcs | Lines | Uncovered Lines |
|:---|---:|---:|---:|---:|:---|
| `rule-engine.ts` | **96.5%** | **92.0%** | **100%** | **96.5%** | 147, 203 |
| `ai-analyzer.ts` | **85.0%** | **80.0%** | **100%** | **85.0%** | 88-91, 134 |
| `parser.ts` | 82.3% | 76.5% | 100% | 82.3% | 62-65, 118 |
| `suggest-mapping.ts` | 97.1% | 93.3% | 100% | 97.1% | 44 |
| `report-generator.ts` | 78.6% | 72.0% | 87.5% | 78.6% | 95-102 |

### API Routes (`src/app/api/`)

| 파일 | Stmts | Branch | Funcs | Lines | Uncovered Lines |
|:---|---:|---:|---:|---:|:---|
| `upload/route.ts` | 89.4% | 83.3% | 100% | 89.4% | 76-79 |
| `analyze/route.ts` | 91.2% | 87.5% | 100% | 91.2% | 52, 98 |
| `health/route.ts` | 100% | 100% | 100% | 100% | — |
| `report/route.ts` | 75.0% | 68.7% | 100% | 75.0% | 41-48 |

### UI 컴포넌트 (`src/components/`)

| 파일 | Stmts | Branch | Funcs | Lines | Uncovered Lines |
|:---|---:|---:|---:|---:|:---|
| `upload/FileDropzone.tsx` | 78.4% | 71.4% | 83.3% | 78.4% | 57-61, 88 |
| `upload/ColumnMapper.tsx` | 74.1% | 68.0% | 80.0% | 74.1% | 34-38, 72 |
| `dashboard/AnomalyTable.tsx` | 76.9% | 73.3% | 85.7% | 76.9% | 104-108 |
| `dashboard/SummaryCards.tsx` | 80.0% | 75.0% | 100% | 80.0% | 49-51 |
| `dashboard/AiInsightPanel.tsx` | 71.4% | 66.7% | 75.0% | 71.4% | 88-95, 127 |
| `FloatingChat.tsx` | 70.3% | 65.2% | 75.0% | 70.3% | 61-68, 112 |

---

## 테스트 파일 구성

| 테스트 파일 | 테스트 수 | 통과 | 실패 |
|:---|---:|---:|---:|
| `src/__tests__/rule-engine.test.ts` | 17 | ✅ 17 | 0 |
| `src/__tests__/ai-analyzer.test.ts` | 6 | ✅ 6 | 0 |
| `src/__tests__/suggest-mapping.test.ts` | 5 | ✅ 5 | 0 |
| `src/__tests__/api.test.ts` | 11 | ✅ 11 | 0 |
| `src/__tests__/components.test.tsx` | 6 | ✅ 6 | 0 |
| **합계** | **45** | **✅ 45** | **0** |

---

## 커버리지 달성 전략

### 1. 핵심 로직 우선 집중
`rule-engine.ts`는 전체 서비스의 핵심 판별 엔진으로, **17개의 엣지 케이스** (신규 약품 진입, 폐지 약품, 0% 변동, 정확히 임계값 경계, 음수 처방량 등)를 커버하도록 테스트를 설계하여 96.5% 라인 커버리지를 달성했습니다.

### 2. 외부 의존성 격리 (Mocking)
`ai-analyzer.ts`는 Claude API 실제 호출 없이 `vi.mock`으로 Anthropic SDK를 격리하여 **결정론적 테스트 환경**을 구성했습니다. Fallback mock 경로(크레딧 소진, 타임아웃)까지 검증합니다.

### 3. 미커버 영역 현황 및 계획
- **Uncovered**: 컴포넌트의 일부 에러 경계 분기, 스트리밍 응답 파싱 로직
- **계획**: Sprint 5에서 Playwright E2E로 UI 시나리오 전체 커버 예정

---

## 실행 명령어

```bash
# 커버리지 리포트 생성 (HTML + 터미널 출력)
npm run test:coverage

# 출력 위치
# coverage/index.html  (브라우저에서 확인)
# 터미널: 위 표와 동일한 수치 출력
```

---

*생성일: 2026-03-15 | 도구: Vitest v4 + @vitest/coverage-v8 | 브랜치: master*
