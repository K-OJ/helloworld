# Auto-QA Dashboard — 개발 로드맵

## 현재 상태: v0.3.0 (2026-03-14 기준)

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

---

## Sprint 4 — 품질 보증 및 문서화 🔄 진행 중

**목표**: 테스트 커버리지 확보 및 해커톤 심사 보완

| 작업 | 상태 |
|---|:---:|
| README PRD 문서화 | ✅ |
| 아키텍처 문서 (`docs/plan/architecture.md`) | ✅ |
| 사용자 시나리오 문서 | ✅ |
| 테스트 전략 문서 | ✅ |
| GitHub Actions CI 파이프라인 | ✅ |
| `rule-engine.ts` 단위 테스트 | 🔄 |
| E2E 테스트 (Playwright) | ⬜ |

---

## Sprint 5 — 확장 기능 (예정)

**목표**: 엔터프라이즈 사용성 확보

| 작업 | 상태 |
|---|:---:|
| 사용자 인증 (NextAuth.js) | ⬜ |
| 검수 이력 저장 (DB 연동) | ⬜ |
| 다중 파일 배치 처리 | ⬜ |
| 알림 기능 (Slack / 이메일) | ⬜ |
| 대시보드 커스텀 임계값 설정 | ⬜ |
| 모바일 반응형 최적화 | ⬜ |

---

## 범례

| 아이콘 | 의미 |
|:---:|---|
| ✅ | 완료 |
| 🔄 | 진행 중 |
| ⬜ | 예정 |
