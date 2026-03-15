# Auto-QA Dashboard — 월간 제약 처방 데이터 AI 자동 검수 시스템

> Claude AI를 활용하여 월간 제약 처방 데이터의 이상치를 자동 탐지하고 원인을 분류하는 QA 대시보드

[![CI](https://github.com/K-OJ/helloworld/actions/workflows/ci.yml/badge.svg)](https://github.com/K-OJ/helloworld/actions/workflows/ci.yml)
[![Deploy](https://img.shields.io/badge/deploy-Vercel-black)](https://helloworld-3hhd.vercel.app/dashboard)

---

## 문제의 배경

국내 제약사의 데이터 관리팀은 매월 수만 건의 병원별·약품별 처방량 데이터를 수기로 검수합니다. 전월 대비 처방량이 비정상적으로 증감한 항목을 Excel 필터링으로 찾아내고, 원인을 담당자 개인 경험에 의존해 판단합니다.

### 사용자 인터뷰 및 시장 조사 결과

유비케어 데이터사업팀 실무자 3인 인터뷰(2026년 2월 실시) 결과:

> "월말마다 수천 건 처방 데이터를 Excel로 필터링하는 데 혼자 **평균 40시간 이상** 씁니다. 이상치를 찾아도 왜 이상한지 원인을 파악하려면 의약정보팀에 따로 물어봐야 해요." — 데이터사업팀 과장

| 인터뷰 인사이트 | 빈도 |
|---|:---:|
| 수기 검수에 월 40시간 이상 소요 | 3/3명 |
| 이상치 원인 파악에 추가 1~2일 소요 | 2/3명 |
| 엑셀 보고서로 팀장 보고 필요 | 3/3명 |
| 전년 동기 데이터 비교 필요성 | 2/3명 |

### 현재 수기 검수 방식의 한계

| 문제 | 내용 |
|---|---|
| **속도** | 담당자 1인이 수천 건 수동 필터링에 수 시간 소요 |
| **일관성** | 검수 기준이 담당자마다 달라 결과 재현성 없음 |
| **원인 분석 부재** | 이상치 탐지 후 원인 파악을 위한 추가 조사 필요 |
| **이력 관리** | 검수 결과가 개인 PC에 산재하여 감사 추적 불가 |

---

## 목표 사용자 (Target Users)

- **제약사 데이터 관리팀**: 월말 처방 데이터 정합성 검수 담당자
- **의약정보팀**: 시장 트렌드 및 정책 변화에 따른 처방 패턴 분석 담당자
- **영업관리팀**: 이상 처방량 발생 시 현장 확인이 필요한 담당자

---

## 경쟁 도구 비교 (Differentiation)

| 기능 | Great Expectations | Soda Core | **Auto-QA Dashboard** |
|---|:---:|:---:|:---:|
| 데이터 유효성 검사 | ✅ | ✅ | ✅ |
| 통계적 이상치 탐지 | ⚠️ 수동 규칙 | ⚠️ 수동 규칙 | ✅ 자동 (±30%/50%) |
| **AI 원인 자동 분류** | ❌ | ❌ | ✅ Claude AI |
| 제약 도메인 특화 | ❌ | ❌ | ✅ |
| 코드 없이 사용 | ❌ | ❌ | ✅ (웹 UI) |
| 보고서 자동 생성 | ⚠️ 별도 설정 | ⚠️ 별도 설정 | ✅ CSV/Excel |

**핵심 차별점**: Claude AI가 경고/위험 항목의 원인을 `data_error`, `market_trend`, `seasonal`, `policy_change`, `unknown` 5가지로 자동 분류하고 권장 조치를 제시합니다. 기존 도구는 이상치 탐지까지만 가능하며 원인 분석은 여전히 수동입니다.

**실무자 피드백 반영**: 인터뷰에서 "결과를 팀장에게 엑셀로 보고해야 한다"는 공통 요구사항을 반영하여 AI 분석 결과 포함 Excel 다운로드 기능을 구현하였으며, 테스터 전원에게 **"가장 유용한 기능"으로 호평**받았습니다.

---

## 주요 기능

- **파일 업로드**: CSV / Excel (xlsx, xls) 지원, 최대 50MB
- **컬럼 매핑**: 한글 등 커스텀 컬럼명 파일도 드롭다운으로 매핑하여 사용 가능
- **규칙 기반 검수**: 전월 대비 ±30% 경고 / ±50% 위험 자동 분류
- **AI 원인 분석**: Claude Sonnet 4.6이 이상 항목의 원인을 5가지로 분류
- **시각화**: 요약 카드, 이상치 테이블(필터/정렬), 변동률 차트
- **보고서 다운로드**: AI 분석 결과 포함 CSV/Excel 보고서

---

## 아키텍처 개요

```
┌──────────────────────────────────────────────────────────┐
│  Browser (Next.js Client Components)                      │
│  FileDropzone → ColumnMapper → Dashboard → FloatingChat  │
└─────────────────────┬────────────────────────────────────┘
                      │ fetch (FormData / JSON)
┌─────────────────────▼────────────────────────────────────┐
│  Next.js API Routes (Node.js / Vercel Serverless)         │
│  ├── POST /api/upload   → parser + rule-engine            │
│  ├── POST /api/analyze  → ai-analyzer (Claude API)        │
│  ├── POST /api/chat     → streamText (Claude API)         │
│  ├── POST /api/report   → CSV/Excel 생성                  │
│  └── GET  /api/health   → 헬스 체크                      │
└─────────────────────┬────────────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼────────────────────────────────────┐
│  Anthropic Claude Sonnet 4.6 API                          │
│  generateObject (구조화 분류) / streamText (채팅)         │
└──────────────────────────────────────────────────────────┘
```

**미들웨어**: Next.js Middleware가 `/dashboard` 접근 시 `autoqa_auth` 쿠키를 검사하여 미인증 요청을 `/login`으로 리다이렉트합니다.

---

## 기술 스택

| 계층 | 기술 |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| AI | Anthropic Claude Sonnet 4.6 (`@ai-sdk/anthropic`) |
| 파일 처리 | PapaParse (CSV), XLSX (Excel) |
| 배포 | Vercel (Production) |
| CI | GitHub Actions |

---

## 빠른 시작

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 파일에 ANTHROPIC_API_KEY 입력

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000/dashboard](http://localhost:3000/dashboard) 접속

### 필수 컬럼 (또는 컬럼 매핑 사용)

| 필드 | 설명 | 필수 |
|---|---|:---:|
| `drug_id` | 약품 코드 | ✅ |
| `drug_name` | 약품명 | - |
| `hospital_code` | 병원(요양기관) 코드 | ✅ |
| `prescription_volume` | 처방량 (숫자) | ✅ |
| `date` | 기준년월 (예: 2025-01) | - |

컬럼명이 다른 경우(한글 등) 업로드 후 매핑 화면에서 직접 선택할 수 있습니다.

---

## 프로젝트 구조

```
src/
├── app/
│   ├── dashboard/page.tsx      # 메인 대시보드 페이지
│   └── api/
│       ├── upload/route.ts     # 파일 업로드 및 규칙 검수 API
│       ├── analyze/route.ts    # Claude AI 분석 API
│       └── report/route.ts     # 보고서 생성 API
├── components/
│   ├── dashboard/              # 결과 시각화 컴포넌트
│   └── upload/                 # 파일 업로드 및 컬럼 매핑 컴포넌트
└── lib/
    ├── rule-engine.ts          # 규칙 기반 이상치 탐지 엔진
    ├── ai-analyzer.ts          # Claude AI 분석 모듈
    ├── parser.ts               # CSV/Excel 파싱
    └── types.ts                # 공통 타입 정의
```

---

## 테스트 시나리오 가이드

샘플 데이터([전월 샘플](public/sample-data/baseline-sample.csv) / [당월 샘플](public/sample-data/target-sample.csv))에는 AI가 식별해야 하는 실제 시나리오가 내장되어 있습니다.

| 약품명 | 변동 | 예상 AI 분류 | 시나리오 설명 |
|---|:---:|:---:|---|
| **세티리진 10mg** | +205% 🔴 위험 | `seasonal` | 봄 알레르기 시즌 진입으로 항히스타민제 처방이 급증. AI가 계절적 패턴으로 정확히 식별합니다. |
| **아토르바스타틴 10mg** | +64% 🔴 위험 | `market_trend` | 심혈관 질환 예방 목적의 스타틴 처방 가이드라인 강화로 지속적 증가 추세. |
| **오메프라졸 20mg** | -47% 🟡 경고 | `policy_change` | 급여 기준 개정으로 PPI 계열 처방 적응증이 제한되어 감소. |
| **레보티록신 50mcg (H001)** | -85% 🔴 위험 | `data_error` | 단일 기관에서만 발생한 극단적 감소. 데이터 누락 또는 입력 오류 가능성 높음. |
| **독시사이클린 100mg (H001)** | -83% 🔴 위험 | `policy_change` | 항생제 내성 관리 정책으로 광역 항생제 처방이 급감. |
| **리나글립틴 5mg** | 신규 🟡 경고 | `new_item` | 전월 없던 DPP-4 억제제 신규 처방 시작. 거래처 신규 등록 여부 확인 필요. |

> 샘플 데이터로 검수를 실행한 후 **AI 분석 실행** 버튼을 눌러 Claude AI가 각 이상치의 원인을 어떻게 분류하는지 확인해 보세요.

---

## 문서

- [아키텍처 설계](docs/plan/architecture.md)
- [사용자 시나리오](docs/user-scenario.md)
- [테스트 전략](docs/test-strategy.md)
- [CI/CD 계획](docs/cicd-plan.md)
- [개발 로드맵](ROADMAP.md)
