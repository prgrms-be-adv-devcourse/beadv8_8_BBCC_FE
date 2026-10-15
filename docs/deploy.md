# 프론트 배포

데브코스 AWS 지원(EC2 1대 · S3 버킷 1개, CloudFront · ACM 기본 불가)에 맞춘 구성이다.

```
브라우저 ─ https://도메인 ─ (HTTPS 종료: 호스트 Nginx + Certbot 등)
                              └ kidly-fe 컨테이너 (Nginx, 80)
                                  ├ /        → 정적 파일 (SPA: 모르는 주소는 index.html)
                                  └ /api/... → 백엔드 컨테이너 (API_UPSTREAM, 기본 http://app:8080)
```

- 프론트와 API가 **같은 주소**라 CORS가 필요 없고, 리프레시 토큰 쿠키(SameSite=Lax, Domain 없음)가 그대로 동작한다.
- S3 정적 호스팅은 쓰지 않는다: 버킷이 1개(상품 이미지)이고, CloudFront 없이는 HTTPS가 안 돼 토스 · 카카오에 쓸 수 없다.
- 추가 AWS 리소스 없음 (같은 EC2).

## 파일

| 파일                                 | 내용                                                                                            |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `Dockerfile`                         | `vite build` → `nginx:1.27-alpine`에 dist와 Nginx 설정                                          |
| `deploy/nginx/default.conf.template` | SPA fallback · `/assets` 1년 캐시 · `index.html` 캐시 안 함 · gzip · `/api` 프록시 · `/healthz` |
| `deploy/compose.rehearsal.yml`       | 배포와 같은 이미지를 내 PC에서 띄워 로컬 백엔드(8080)에 붙여 보는 리허설                        |
| `.github/workflows/deploy.yml`       | PR: 이미지 빌드 확인 / main 머지 · 수동: GHCR에 올림 (`ghcr.io/<저장소>:latest`, `:<커밋>`)     |

## 빌드 값 (빌드 인자 = 저장소 Actions Variables)

모두 화면에 그대로 들어가는 **공개 값**이다. 비밀 값은 넣지 않는다.

| 이름                      | 배포 값                                          | 설명                                                                                       |
| ------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `VITE_API_BASE_URL`       | 비움                                             | 같은 주소의 `/api`로 요청                                                                  |
| `VITE_USE_MOCK`           | `true`                                           | 백엔드에 없는 API(상품 목록 · 추천 · 정산 등)는 목                                         |
| `VITE_DEMO_ROLE_SWITCH`   | 서버에 개발 토큰이 있으면 `true`, 없으면 `false` | `false`면 시연 기능(역할 전환 · 시연 콘솔 · API 흐름 · 시연 문구)을 감추고 카카오 로그인만 |
| `VITE_TOSS_CLIENT_KEY`    | 토스 테스트 클라이언트 키                        | 결제 담당에게                                                                              |
| `VITE_KAKAO_CLIENT_ID`    | 카카오 REST API 키                               | 회원 담당에게                                                                              |
| `VITE_KAKAO_REDIRECT_URI` | `https://도메인/oauth/kakao/callback`            | 백엔드 `KAKAO_REDIRECT_URI`와 같게                                                         |

실행 환경 값: `API_UPSTREAM`(백엔드 주소, 기본 `http://app:8080`), `NGINX_RESOLVER`(기본 Docker DNS `127.0.0.11`).

## 배포 compose에 넣을 것 (예시, 인프라 담당과 맞춤)

```yaml
fe:
  image: ghcr.io/prgrms-be-adv-devcourse/beadv8_8_bbcc_fe:latest
  environment:
    API_UPSTREAM: http://app:8080 # 백엔드 서비스 이름
  depends_on: [app]
  restart: unless-stopped
  # HTTPS를 끝내는 앞단 Nginx가 이 컨테이너 80으로 넘긴다 (X-Forwarded-Proto 전달)
```

## 리허설 (내 PC)

1. BE 저장소에서 DB · Kafka(`docker compose up -d`)와 백엔드(`./gradlew bootRun`, local 프로필)를 띄운다
2. FE 저장소: `docker compose -f deploy/compose.rehearsal.yml up --build`
3. http://localhost:8081 → 시연 콘솔부터 진행 (API는 Nginx가 호스트 8080으로 넘김)

## Vercel 배포 (개발 확인 · 공유용)

팀 배포(EC2)와 따로, 머지하면 Vercel에도 올라간다 (`.github/workflows/vercel-deploy.yml`).

| 브랜치  | Vercel 환경 | 주소                                                       |
| ------- | ----------- | ---------------------------------------------------------- |
| main    | Production  | https://kidly-fe.vercel.app · https://kidly.kro.kr         |
| develop | Preview     | https://kidly-fe-dev.vercel.app · https://dev.kidly.kro.kr |

- 다시 올리려면 Actions에서 해당 브랜치로 수동 실행한다. vercel CLI로 로컬 파일을 직접 올리지 않는다
- GitHub에 필요한 값: Secrets `VERCEL_TOKEN`, Variables `VERCEL_ORG_ID` · `VERCEL_PROJECT_ID`
- 도메인(내도메인.한국): `kidly.kro.kr`은 Vercel 프로젝트 Production 도메인, `dev.kidly.kro.kr`은 develop 브랜치 도메인이다. 프로젝트가 Git 연동이 아니라서 develop 배포마다 워크플로가 `dev.kidly.kro.kr` 별칭도 붙인다

### 빌드 값 (Vercel 프로젝트 Settings → Environment Variables)

GitHub Variables가 아니라 **Vercel 환경 변수**에서 받는다. Production과 Preview에 따로 넣을 수 있다 (Preview는 `develop` 브랜치로 한정할 수 있다). 바꾼 뒤 해당 브랜치로 다시 실행하면 반영된다.

| 이름                      | Production (main)                                  | Preview (develop)                                      | 넣지 않으면                       |
| ------------------------- | -------------------------------------------------- | ------------------------------------------------------ | --------------------------------- |
| `VITE_USE_MOCK`           | 백엔드에 API가 다 생기면 `false`                   | 같음                                                   | 목 켜짐                           |
| `VITE_API_BASE_URL`       | 아래 "백엔드 연결" 참고                            | 같음                                                   | 비움 (로그인 · 주문 · 결제 안 됨) |
| `VITE_DEMO_ROLE_SWITCH`   | 연결한 백엔드에 개발 토큰이 없으면 `false`         | 같음                                                   | 켜짐                              |
| `VITE_TOSS_CLIENT_KEY`    | 토스 테스트 클라이언트 키 (결제 담당)              | 같음                                                   | 충전 안 됨                        |
| `VITE_KAKAO_CLIENT_ID`    | 카카오 REST API 키 (회원 담당)                     | 같음                                                   | 카카오 로그인 안 됨               |
| `VITE_KAKAO_REDIRECT_URI` | `https://kidly-fe.vercel.app/oauth/kakao/callback` | `https://kidly-fe-dev.vercel.app/oauth/kakao/callback` | 로그인 복귀 실패                  |

모두 화면에 그대로 들어가는 **공개 값**이다. 비밀 값은 넣지 않는다.

### 백엔드 연결

Vercel 사이트는 백엔드와 **주소가 다르다**. EC2 배포처럼 같은 주소의 `/api`가 아니라서 그대로는 CORS와 리프레시 토큰 쿠키(SameSite=Lax)가 동작하지 않는다. 둘 중 하나로 맞춘다.

- **(권장) Vercel이 `/api`를 백엔드로 넘기기**: `vercel.json`에 `/api/:path*` → `https://<백엔드 주소>/api/:path*` rewrite를 더하고 `VITE_API_BASE_URL`은 비운다. 브라우저 입장에서 같은 주소라 CORS · 쿠키 설정이 필요 없다
- **백엔드 주소를 직접 부르기**: `VITE_API_BASE_URL`에 백엔드 주소를 넣고, 백엔드에서 `cors.allowed-origins`에 위 두 주소를 허용(자격 증명 포함)하고 리프레시 토큰 쿠키를 `SameSite=None; Secure`로 바꿔야 한다

### 함께 등록할 것

- [ ] 카카오 개발자 콘솔 Redirect URI에 위 두 주소의 `/oauth/kakao/callback`, 백엔드 `KAKAO_REDIRECT_URI`와 맞춤
- [ ] 토스 성공 · 실패 URL을 Vercel 주소로 쓸 수 있는지 (결제 담당)
- [ ] 연결할 백엔드 주소와 개발 토큰 여부 (인프라 · 회원 담당)

## 배포 전 체크 (FE 밖, 담당과 맞출 것)

- [ ] 도메인 · HTTPS(Certbot) · 배포 compose · EC2 반영(SSH) 담당
- [ ] 운영 서버에서 개발 토큰(`/dev/tokens`)을 켤지 → `VITE_DEMO_ROLE_SWITCH`
- [ ] 카카오 개발자 콘솔 Redirect URI, 토스 성공 · 실패 URL을 운영 도메인으로 등록
- [ ] 백엔드 쿠키 `secureCookie=true`(HTTPS). 같은 주소라 `cors.allowed-origins`는 필요 없음
- [ ] GHCR 패키지 공개 여부(비공개면 EC2에서 `docker login ghcr.io` 필요)
- [ ] 시연 시간: EC2 자동 실행은 9~18시
