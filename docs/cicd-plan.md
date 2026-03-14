# CI/CD 계획

## 전체 파이프라인 개요

```
개발자 로컬
    │
    ├─ git push (feature branch)
    │       │
    │       └─► GitHub Actions CI
    │               ├─ npm ci
    │               ├─ npm run lint
    │               └─ npm run build
    │
    ├─ Pull Request → main
    │       │
    │       └─► GitHub Actions CI (동일)
    │               └─ 통과 시 Merge 허용
    │
    └─ Merge to main (master)
            │
            └─► Vercel 자동 배포 (Production)
                    └─ https://helloworld-3hhd.vercel.app/dashboard
```

---

## GitHub Actions CI (`ci.yml`)

### 트리거
- `master` 브랜치 push
- 모든 브랜치 Pull Request

### 단계

| Step | 명령 | 목적 |
|---|---|---|
| Checkout | `actions/checkout@v4` | 소스 코드 체크아웃 |
| Node.js 설정 | `setup-node@v4` (v20) | 런타임 설정 |
| 의존성 설치 | `npm ci` | 재현 가능한 의존성 설치 |
| 린트 | `npm run lint` | 코드 품질 검증 |
| 빌드 | `npm run build` | TypeScript 오류 및 빌드 검증 |

### 파일 위치
`.github/workflows/ci.yml`

---

## Vercel 자동 배포

### 설정 방법
1. Vercel 대시보드 → 프로젝트 → Settings → Git
2. **Production Branch**: `master`
3. Vercel이 GitHub webhook을 통해 push 이벤트 감지 후 자동 배포

### 배포 설정 (`vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

### 환경변수 관리

| 변수 | 로컬 | Vercel |
|---|---|---|
| `ANTHROPIC_API_KEY` | `.env.local` (gitignore) | Vercel Environment Variables |

> `.env.local`은 절대 커밋하지 않습니다. `.gitignore`에 `.env*` 패턴으로 차단되어 있습니다.

---

## 브랜치 전략

```
master          ─── 프로덕션 배포 브랜치
  │
  ├── feat/*    ─── 기능 개발 브랜치
  ├── fix/*     ─── 버그 수정 브랜치
  └── chore/*   ─── 설정/문서 변경 브랜치
```

### 머지 정책
- CI 통과 필수 (lint + build)
- 직접 push 지양, PR을 통한 코드 리뷰 권장

---

## 롤백 전략

Vercel은 모든 배포를 보관하므로:
1. Vercel 대시보드 → Deployments
2. 이전 안정 버전 클릭 → **Promote to Production**

---

## 향후 CI 확장 계획

```yaml
# 추가 예정 스텝
- name: Run Tests
  run: npm test

- name: Upload Coverage
  uses: codecov/codecov-action@v4

- name: Lighthouse CI
  run: npx lhci autorun
```
