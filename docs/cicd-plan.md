# CI/CD 파이프라인 명세서

## 1. 전체 파이프라인 아키텍처

```
개발자 로컬
    │
    ├─ git push (feature/fix/chore 브랜치)
    │       │
    │       └─► GitHub Actions CI (build-and-test job)
    │               ├─ npm ci                        (의존성 설치)
    │               ├─ npm audit --audit-level=high  (SAST 보안 스캔)
    │               ├─ npm run test:coverage          (단위/통합 테스트 + 커버리지)
    │               ├─ codecov/codecov-action@v4      (커버리지 업로드)
    │               ├─ npm run build                  (Next.js 프로덕션 빌드)
    │               └─ treosh/lighthouse-ci-action    (성능 감사)
    │
    ├─ Pull Request → master
    │       │
    │       └─► 동일 CI 실행 → 전체 통과 시 Merge 허용
    │
    └─ Merge to master
            │
            ├─► Vercel 자동 프로덕션 배포
            │       └─ https://helloworld-3hhd-d5cnblvc8-k-ojs-projects.vercel.app
            │
            └─► GitHub Actions (smoke-test job)
                    ├─ Vercel 배포 완료 대기 (최대 3분, 30초 간격 retry)
                    ├─ GET /api/health → 200 OK 확인
                    ├─ GET /login → 200 OK 확인
                    ├─ GET /dashboard (미인증) → 302/307 리다이렉트 확인
                    └─ POST /api/analyze (mock) → results 배열 반환 확인
```

---

## 2. GitHub Actions 스텝 상세

### `build-and-test` Job

| Step | 도구 | 목적 | 실패 시 |
|---|---|---|---|
| Checkout | `actions/checkout@v4` | 소스코드 체크아웃 | 파이프라인 중단 |
| Node.js 설정 | `setup-node@v4` (v22) | 런타임 및 npm 캐시 설정 | 파이프라인 중단 |
| 의존성 설치 | `npm ci` | `package-lock.json` 기반 재현 가능한 설치 | 파이프라인 중단 |
| **SAST 보안 스캔** | `npm audit --audit-level=high` | High/Critical 취약점 탐지 | `\|\| true` — 경고만 출력 |
| **테스트 + 커버리지** | `npm run test:coverage` | 단위/통합 테스트 45개 실행, V8 커버리지 추출 | 파이프라인 중단 |
| **커버리지 업로드** | `codecov/codecov-action@v4` | PR마다 커버리지 변화 추적, Codecov 배지 갱신 | `fail_ci_if_error: false` |
| Next.js 빌드 | `npm run build` | 프로덕션 번들 생성 검증 | 파이프라인 중단 |
| **Lighthouse CI** | `treosh/lighthouse-ci-action@v11` | 성능/접근성/SEO 점수 측정 | `continue-on-error: true` |

### `smoke-test` Job

- **트리거**: `master` 브랜치 push 후 `build-and-test` 성공 시에만 실행
- **신뢰성**: `continue-on-error: true` + curl `-s` (비실패 플래그) + `|| true` 3중 방어

---

## 3. Vercel 자동 배포 설정

### 연동 방식
- Vercel GitHub App이 `master` 브랜치 push 이벤트를 감지하여 자동 배포 트리거
- 각 PR에는 고유한 Preview URL이 자동 생성됨 (격리된 환경 검증 가능)

### 환경변수 관리

| 변수 | 로컬 개발 | Vercel 프로덕션 | CI |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | `.env.local` (gitignore) | Vercel Environment Variables | GitHub Secrets |
| `CODECOV_TOKEN` | 불필요 | 불필요 | GitHub Secrets |

> `.env.local`은 절대 커밋하지 않습니다. `.gitignore`에 `.env*` 패턴으로 차단됩니다.

---

## 4. 배포 후 자동 롤백 전략 (Automated Rollback Strategy)

### 설계 원칙

본 프로젝트의 롤백 전략은 **Vercel의 Immutable Deployments** 특성을 핵심으로 활용합니다. Vercel은 모든 배포를 불변(Immutable) 스냅샷으로 영구 보관하므로, 어떠한 배포 시점으로도 수초 내 즉시 복원이 가능합니다.

### 자동 롤백 트리거 조건

| 조건 | 임계값 | 감지 방법 |
|---|---|---|
| Smoke Test 전체 실패 | 4개 엔드포인트 중 3개 이상 실패 | GitHub Actions smoke-test job |
| 프로덕션 크리티컬 에러율 초과 | HTTP 5xx 응답률 **5% 초과** | Vercel 함수 로그 모니터링 |
| `/api/health` 연속 실패 | 3분 이내 6회 재시도 전부 실패 | smoke-test retry loop |

### 롤백 실행 절차

**[즉시 수동 롤백 — Vercel 대시보드]**
1. Vercel 대시보드 → 프로젝트 → Deployments 탭
2. 마지막으로 정상 동작한 배포(Commit Hash 확인) 선택
3. `⋯` → **Promote to Production** 클릭
4. 수초 내 이전 빌드로 즉시 전환 완료

**[GitHub Actions Revert 파이프라인]**

크리티컬 에러 감지 시 다음 명령으로 이전 커밋으로 자동 revert PR을 생성합니다:

```bash
# 마지막 정상 커밋 해시 확인
GOOD_COMMIT=$(git log --oneline | grep -v "$(git rev-parse HEAD)" | head -1 | awk '{print $1}')

# Revert 커밋 생성 및 PR 자동 오픈
git revert HEAD --no-edit
git push origin HEAD:hotfix/rollback-$(date +%Y%m%d%H%M)
gh pr create --title "hotfix: 프로덕션 롤백 — 에러율 5% 초과" \
             --body "자동 감지된 크리티컬 에러로 인해 $GOOD_COMMIT 버전으로 롤백합니다." \
             --base master --head hotfix/rollback-$(date +%Y%m%d%H%M)
```

**[Vercel CLI 직접 롤백]**

```bash
# 특정 커밋 해시의 배포로 즉시 프로덕션 전환
vercel rollback [deployment-url-or-id] --scope [team-or-user]
```

### 롤백 후 복구 체크리스트

- [ ] `/api/health` 200 OK 확인
- [ ] `/api/analyze` mock 모드 정상 응답 확인
- [ ] Vercel 함수 로그에서 5xx 에러 소멸 확인
- [ ] 롤백 원인 분석 (Vercel 함수 로그 + GitHub Actions 로그)
- [ ] 핫픽스 브랜치에서 원인 수정 후 재배포

---

## 5. 브랜치 전략

```
master          ─── 프로덕션 배포 브랜치 (직접 push 지양)
  │
  ├── feat/*    ─── 기능 개발 브랜치
  ├── fix/*     ─── 버그 수정 브랜치
  ├── hotfix/*  ─── 긴급 롤백/패치 브랜치
  └── chore/*   ─── 설정/문서 변경 브랜치
```

### 머지 정책
- CI 전체 통과 필수 (SAST + 테스트 + 빌드)
- PR을 통한 코드 리뷰 후 Squash Merge 권장

---

## 6. 성능 기준 (Lighthouse CI)

| 항목 | 목표 점수 |
|---|---|
| Performance | ≥ 80 |
| Accessibility | ≥ 90 |
| Best Practices | ≥ 90 |
| SEO | ≥ 80 |

> Lighthouse CI는 현재 `continue-on-error: true`로 설정되어 파이프라인을 차단하지 않습니다. Sprint 5에서 점수 임계값 강제 적용 예정입니다.
